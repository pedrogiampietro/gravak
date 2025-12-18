"use strict";

const http = require("http");
const url = require("url");

const AuthService = requireModule("auth-service");
const BandwidthHandler = requireModule("bandwidth-handler");
const Enum = requireModule("enum");
const WebsocketServer = requireModule("websocket-server");

const HTTPServer = function(host, port) {

  /*
   * Class HTTPServer
   * Wrapper for NodeJS HTTP server to host the websocket server
   *
   * Public API:
   *
   * HTTPServer.close() - Closes the HTTP and websocket serve   
   * HTTPServer.getDataDetails() - Returns telemetry of the HTTP and websocket server
   * HTTPServer.listen() - Opens the HTTP server to listen for connections
   *
   */

  // Save internal parameters
  this.__host = host;
  this.__port = port;

  // Sequential request identifiers
  this.__socketId = 0;

  // Create the websocket server that handles network IO
  this.websocketServer = new WebsocketServer();

  // The service that handles authentication and token validation
  this.authService = new AuthService();

  // Handler for bandwidth
  this.bandwidthHandler = new BandwidthHandler();

  // Default HTTP server: use a reverse proxy (Apache, NGINX) if you want to use TLS
  this.__server = http.createServer();

  // Timeout in ms for sockets that do not upgrade to WS or fail to make a HTTP request
  this.__server.timeout = 5000;

  // Delegate internal client error to HTTP error
  this.websocketServer.websocket.on("wsClientError", this.__handleClientError.bind(this));

  // Upgrade of HTTP server to websocket protocol and check authentication with login server
  this.__server.on("close", this.__handleClose.bind(this));
  this.__server.on("clientError", this.__handleClientError.bind(this));
  this.__server.on("connection", this.__handleConnection.bind(this));
  this.__server.on("error", this.__handleError.bind(this));
  this.__server.on("listening", this.__handleListening.bind(this));
  this.__server.on("request", this.__handleRequest.bind(this));
  this.__server.on("timeout", this.__handleTimeout.bind(this));
  this.__server.on("upgrade", this.__handleUpgrade.bind(this));

  // Start the HTTP server as closed
  this.__status = this.STATUS.CLOSED;

}

// Possible server states
HTTPServer.prototype.STATUS = new Enum(
  "OPENING",
  "OPEN",
  "CLOSING",
  "CLOSED"
);

HTTPServer.prototype.close = function() {

  /*
   * Function HTTPServer.close
   * Closes the HTTP server
   */

  // Only when the HTTP Server is open
  if(this.__status !== this.STATUS.OPEN) {
    return;
  }

  console.log("The HTTP server has started to close.");
  
  // Disconnect all the clients from the Websocket Server
  this.websocketServer.close();

  // Close all remaining idle HTTP connections
  this.__server.closeAllConnections();

  // And close the HTTP server itself
  this.__server.close();

}

HTTPServer.prototype.getDataDetails = function() {

  /*
   * Function HTTPServer.getDataDetails
   * Gets the data details (received & sent) from the network manager
   */

  return new Object({
    "websocket": this.websocketServer.getDataDetails(),
    "bandwidth": this.bandwidthHandler.getBandwidth()
  });

}

HTTPServer.prototype.listen = function() {

  /*
   * Function HTTPServer.listen
   * Sets server to listening for incoming requests
   */

  // Can only work when the HTTP server is currently closed
  if(this.__status !== this.STATUS.CLOSED) {
    return;
  }

  // Opening: only open when the listen callback fires
  this.__status = this.STATUS.OPENING;

  // Delegate to the internal server
  this.__server.listen(this.__port, this.__host);

}

HTTPServer.prototype.__handleRequest = function(request, response) {

  /*
   * Function HTTPServer.__handleRequest
   * Handles standard HTTP requests to the game server: we do not accept these and tell the client to upgrade to WS.
   */

  // Validation of request
  let code = this.__validateHTTPRequest(request);
  
  if(code !== null) {
    return this.__generateRawHTTPResponse(request.socket, code)
  }

  // We only accept websocket connections: tell the client to upgrade
  return this.__generateRawHTTPResponse(request.socket, 426);

}

HTTPServer.prototype.__validateHTTPRequest = function(request) {

  /*
   * Function HTTPServer.__validateHTTPRequest
   * Validates the initial HTTP request
   */

  // HTTP versions unsupported
  if(request.httpVersion === "0.9" || request.httpVersion === "1.0") {
    return 505;
  }

  if(request.method !== "GET") {
    return 405;
  }

  // Only root node
  if(url.parse(request.url).pathname!== "/") {
    return 404;
  }

  return null;

}

HTTPServer.prototype.__handleUpgrade = function(request, socket, head) {

  /*
   * Function HTTPServer.__handleUpgrade
   * Handles upgrading of the websocket and checks the token from the login server. Only valid tokens are upgraded.
   */

  // Validation of request
  let code = this.__validateHTTPRequest(request);

  if(code !== null) {
    return this.__generateRawHTTPResponse(socket, code)
  }

  // Get the token from the URL 
  let query = url.parse(request.url, true).query;

  // The login token must be present
  if(!Object.prototype.hasOwnProperty.call(query, "token")) {
    return this.__generateRawHTTPResponse(socket, 400);
  }

  // Authenticate the token
  let accountName = this.authService.authenticate(query.token);

  // Token was not valid: destroy the connection manually
  if(accountName === null) {
    return this.__generateRawHTTPResponse(socket, 401);
  }

  // Upgrade the HTTP request to the websocket server
  this.websocketServer.upgrade(request, socket, head, accountName);

}

HTTPServer.prototype.__handleConnection = function(socket) {

  /*
   * Function HTTPServer.__handleConnection
   * Handles an incoming TCP connection and socket
   */

  // Assign a unique identifier for tracking it
  socket.id = this.__socketId++;

  console.log("Connected TCP socket with identifier %s from %s.".format(socket.id, socket.address().address));

  // Socket handler
  socket.on("close", this.__handleSocketClose.bind(this, socket));

  // If socket monitoring is enabled
  if(CONFIG.LOGGING.NETWORK_TELEMETRY) {
    this.bandwidthHandler.monitorSocket(socket);
  }

}

HTTPServer.prototype.__generateRawHTTPResponse = function(socket, code) {

  /*
   * Function WebsocketServer.__generateRawHTTPResponse
   * Generates a raw HTTP response
   */

  console.log("Ending socket request with identifier %s with status code %s.".format(socket.id, code));
  
  // Destroy the socket manually
  socket.write("HTTP/1.1 %s %s\r\nConnection: close\r\n\r\n".format(code, http.STATUS_CODES[code]));
  socket.destroy();

}

HTTPServer.prototype.__handleClientError = function(error, socket) {


  /*
   * Function WebsocketServer.__handleClientError
   * Handles client protocol error by sending 400 
   */

  return this.__generateRawHTTPResponse(socket, 400);

}

HTTPServer.prototype.__handleSocketClose = function(socket) {

  /*
   * Function WebsocketServer.__handleSocketClose
   * Handles closing even of the socket
   */

  console.log("Disconnected TCP socket with identifier %s.".format(socket.id));

}

HTTPServer.prototype.__handleTimeout = function(socket) {

  /*
   * Function WebsocketServer.__handleTimeout
   * Handles a socket timeout before the HTTP request
   */

  return this.__generateRawHTTPResponse(socket, 408);

}

HTTPServer.prototype.__handleError = function(error) {

  /*
   * Function WebsocketServer.__handleError
   * Handles a server error when launching
   */

  // Already in use
  switch(error.code) {
    case "EADDRINUSE":
      return console.log("Could not start the HTTP server: the address or port is already in use.");
  }

}

HTTPServer.prototype.__handleListening = function() {

  /*
   * Function HTTPServer.__handleListening
   * Callback fired when server is listening for incoming connections
   */

  // We are listening for connections
  this.__status = this.STATUS.OPEN;

  console.log("The HTTP gameserver is listening for connections on %s:%s.".format(this.__host, this.__port));

}

HTTPServer.prototype.__handleClose = function() {

  /*
   * Function HTTPServer.__handleClose
   * Callback fired when the server is closed
   */

  this.__status = this.STATUS.CLOSED;

  console.log("The HTTP Server stopped listening for connections.");

}

module.exports = HTTPServer;
