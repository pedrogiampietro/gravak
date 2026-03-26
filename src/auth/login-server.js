"use strict";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const http = require("http");
const fs = require("fs");
const url = require("url");
const nacl = require("tweetnacl");
const bs58 = require("bs58").default;

const AccountDatabase = requireModule("auth/account-database");

const LoginServer = function (host, port) {

  /*
   * Class LoginServer
   *
   * Wrapper for the Gravak HTML5 Open Tibia Server
   * Checks database of accounts / bcrypt passwords and returns a HMAC token to be provided to the gameserver
   * The gameserver uses the validity of the HMAC token to allow a websocket connection and load the required account file
   *
   */

  // Save information
  this.__host = CONFIG.LOGIN.HOST;
  this.__port = CONFIG.LOGIN.PORT;

  // The character manager
  this.accountDatabase = new AccountDatabase();

  // Create the server and handler
  this.server = http.createServer(this.__handleRequest.bind(this));
  this.server.on("listening", this.__handleListening.bind(this));
  this.server.on("close", this.__handleClose.bind(this));

  // Graceful close
  process.on("SIGINT", this.server.close.bind(this.server));
  process.on("SIGTERM", this.server.close.bind(this.server));

}

LoginServer.prototype.__handleClose = function () {

  /*
   * LoginServer.__handleClose
   * Callback fired when the HTTP server is closed
   */

  this.accountDatabase.close();

}

LoginServer.prototype.__handleListening = function () {

  /*
   * LoginServer.__handleListening
   * Callback fired when the HTTP server is listening
   */

  console.log("The login server is listening for connections on %s:%s.".format(this.__host, this.__port));

}

LoginServer.prototype.initialize = function () {

  /*
   * LoginServer.initialize
   * Starts the HTTP server and listens for incoming connections
   */

  this.server.listen(this.__port, this.__host);

}

LoginServer.prototype.__generateToken = function (name) {

  /*
   * LoginServer.__generateToken
   * Generates a simple HMAC token for the client to identify itself with.
   */

  // Token is only c valid for a few seconds
  let expire = Date.now() + CONFIG.LOGIN.TOKEN_VALID_MS;
  let hmac = crypto.createHmac("sha256", CONFIG.HMAC.SHARED_SECRET).update(name + expire).digest("hex");

  // Return the JSON payload
  return new Object({
    "name": name,
    "expire": expire,
    "hmac": hmac
  });

}

LoginServer.prototype.__isValidCreateAccount = function (queryObject) {

  /*
   * LoginServer.__isValidCreateAccount
   * Returns true if the request to create the account is valid
   */

  for (let property of ["account", "password", "name", "sex"]) {
    if (!Object.prototype.hasOwnProperty.call(queryObject, "account")) {
      return false;
    }
  }

  // Accept only lower case letters for the character name
  if (!/^[a-z]+$/.test(queryObject.name)) {
    return false;
  }

  // Must be male or female
  if (queryObject.sex !== "male" && queryObject.sex !== "female") {
    return false;
  }

  return true;

}

LoginServer.prototype.__createAccount = function (queryObject, response) {

  /*
   * LoginServer.__createAccount
   * Makes a call to the account manager to create a new account if the request is valid
   */

  // Is valid
  if (!this.__isValidCreateAccount(queryObject)) {
    response.statusCode = 400;
    return response.end();
  }

  this.accountDatabase.createAccount(queryObject, function (error, accountObject) {

    // Failure creating the account
    if (error !== null) {
      response.statusCode = error;
      return response.end();
    }

    // Finish the HTTP response
    response.statusCode = 201;
    response.end();

  }.bind(this))

}

LoginServer.prototype.__handleWalletLogin = function (body, response) {

  /*
   * LoginServer.__handleWalletLogin
   * Authenticates a Solana Phantom wallet login.
   * Verifies Ed25519 signature, then auto-creates or loads the account.
   *
   * Expected body: { publicKey, signature (base64), message, name? }
   */

  let { publicKey, signature, message, name } = body;

  // Validate required fields
  if (!publicKey || !signature || !message) {
    response.statusCode = 400;
    response.end(JSON.stringify({ error: "Missing publicKey, signature, or message" }));
    return;
  }

  // Replay-attack protection: message must be "Gravak login: {timestamp}" within ±30s
  const match = message.match(/^Gravak login: (\d+)$/);
  if (!match) {
    response.statusCode = 400;
    response.end(JSON.stringify({ error: "Invalid message format" }));
    return;
  }
  const msgTimestamp = parseInt(match[1], 10);
  if (Math.abs(Date.now() - msgTimestamp) > 30000) {
    response.statusCode = 401;
    response.end(JSON.stringify({ error: "Message expired" }));
    return;
  }

  // Verify Ed25519 signature
  let valid = false;
  try {
    const msgBytes = Buffer.from(message);
    const sigBytes = Buffer.from(signature, "base64");
    const pkBytes = bs58.decode(publicKey);
    valid = nacl.sign.detached.verify(msgBytes, sigBytes, pkBytes);
  } catch (err) {
    response.statusCode = 400;
    response.end(JSON.stringify({ error: "Invalid signature encoding" }));
    return;
  }

  if (!valid) {
    response.statusCode = 401;
    response.end(JSON.stringify({ error: "Signature verification failed" }));
    return;
  }

  // Look up existing wallet account
  this.accountDatabase.getAccountByWallet(publicKey, function (error, existing) {
    if (error) {
      response.statusCode = 500;
      return response.end();
    }

    // Wallet already registered — return token directly
    if (existing) {
      response.writeHead(200, { "Content-Type": "application/json" });
      return response.end(JSON.stringify({
        "token": Buffer.from(JSON.stringify(this.__generateToken(existing.account))).toString("base64"),
        "host": process.env.EXTERNAL_HOST || CONFIG.SERVER.EXTERNAL_HOST
      }));
    }

    // New wallet — name is required
    if (!name || !/^[a-zA-Z]{2,20}$/.test(name)) {
      response.statusCode = 422;
      response.writeHead(422, { "Content-Type": "application/json" });
      return response.end(JSON.stringify({ error: "Name required for new wallet", needsName: true }));
    }

    // Create new wallet account
    this.accountDatabase.createWalletAccount(publicKey, name, function (error, created) {
      if (error === 409) {
        response.statusCode = 409;
        response.end(JSON.stringify({ error: "Name already taken" }));
        return;
      }
      if (error) {
        response.statusCode = 500;
        return response.end();
      }

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        "token": Buffer.from(JSON.stringify(this.__generateToken(created.account))).toString("base64"),
        "host": process.env.EXTERNAL_HOST || CONFIG.SERVER.EXTERNAL_HOST
      }));
    }.bind(this));

  }.bind(this));

}

LoginServer.prototype.__handleRequest = function (request, response) {

  /*
   * LoginServer.__handleRequest
   * Handles incoming HTTP requests
   */

  console.log("Received request: %s %s".format(request.method, request.url));

  // Enabled CORS to allow requests from JavaScript
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  // Only GET (for tokens) and POST (for account creation / wallet login)
  if (request.method !== "GET" && request.method !== "POST") {
    response.statusCode = 501;
    return response.end();
  }

  // Data submitted in the querystring
  let requestObject = url.parse(request.url, true);

  // Wallet login endpoint
  if (requestObject.pathname === "/wallet") {
    if (request.method !== "POST") {
      response.statusCode = 405;
      return response.end();
    }

    let rawBody = "";
    request.on("data", chunk => rawBody += chunk);
    request.on("end", () => {
      let body = {};
      try { body = JSON.parse(rawBody); } catch(e) {}
      this.__handleWalletLogin(body, response);
    });
    return;
  }

  if (requestObject.pathname !== "/") {
    response.statusCode = 404;
    return response.end();
  }

  // POST requests means creating account
  if (request.method === "POST") {
    return this.__createAccount(requestObject.query, response);
  }

  return this.__getAccount(requestObject.query, response);

}

LoginServer.prototype.__getAccount = function (queryObject, response) {

  // Account or password were not supplied
  if (!queryObject.account || !queryObject.password) {
    response.statusCode = 401;
    return response.end();
  }

  this.accountDatabase.getAccountCredentials(queryObject.account, function (error, result) {

    // Does not exist
    if (result === undefined) {
      response.statusCode = 401;
      return response.end();
    }

    // Wallet-only account has no hash
    if (!result.hash) {
      response.statusCode = 401;
      return response.end();
    }

    // Compare the submitted password with the hashed + salted password
    bcrypt.compare(queryObject.password, result.hash, function (error, isPasswordCorrect) {

      if (error) {
        response.statusCode = 500;
        return response.end();
      }

      if (!isPasswordCorrect) {
        response.statusCode = 401;
        return response.end();
      }

      // Valid return a HMAC token to be verified by the GameServer
      response.writeHead(200, { "Content-Type": "application/json" });

      // Return the host and port of the game server too in addition to the token
      response.end(JSON.stringify({
        "token": Buffer.from(JSON.stringify(this.__generateToken(queryObject.account))).toString("base64"),
        "host": process.env.EXTERNAL_HOST || CONFIG.SERVER.EXTERNAL_HOST
      }));

    }.bind(this));

  }.bind(this));

}

module.exports = LoginServer;
