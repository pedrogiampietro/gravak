"use strict";

const { createHmac } = require("crypto");

const AuthService = function() {


  /*
   * Class AuthService
   * Service responsible for player authentication
   *
   * API:
   *
   * AuthService.authenticate(token) - returns the name of the account to load if the token is valid
   *
   */

  if(CONFIG.HMAC.SHARED_SECRET === "0000000000000000000000000000000000000000000000000000000000000000") {
    console.warn("The default HMAC secret is used. This is a security vulnerability in production environments.");
  }

}

AuthService.prototype.authenticate = function(token) {
  
  /*
   * Function AuthService.authenticate
   * Authentictes a client request with a token
   */

  // Get the payload from the request
  let payload = this.__parseToken(token);

  // Could not parse payload
  if(payload === null) {
    return null;
  }

  // Could not verify token: it was tampered with or not signed by our login server via the shared HMAC secret
  if(!this.__verifyLoginToken(payload)) {
    return null;
  }

  // The token is valid but has expired
  if(payload.expire <= Date.now()) {
    return null;
  }

  // Token was verified and succesfully return the name of the account to be loaded
  return payload.name;

}

AuthService.prototype.__parseToken = function(token) {

  /*
   * Function AuthService.__parseToken
   * Attempt to parse the HMAC token to JSON
   */

  let string = Buffer.from(token, "base64").toString();

  // Wrap token extraction in a try/catch
  try {
    return JSON.parse(string);
  } catch(exception) {
    return null;
  }

}

AuthService.prototype.__verifyLoginToken = function(payload) {

  /*
   * Function AuthService.__verifyLoginToken
   * Verifies the passed HMAC token and check that it was signed by the login server
   */

  // Validate the object
  if(payload === null || typeof payload !== "object") {
    return false;
  }

  // Requires properties
  if(!payload.hasOwnProperty("name") || !payload.hasOwnProperty("expire") || !payload.hasOwnProperty("hmac")) {
    return false;
  }

  // Expected signature
  let hmac = createHmac("sha256", CONFIG.HMAC.SHARED_SECRET).update(payload.name + payload.expire).digest("hex");

  // Confirm the HMAC signature
  return payload.hmac === hmac;

}

module.exports = AuthService;
