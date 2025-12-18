const NetworkManager = require("./network-manager");
const BandwidthHandler = requireModule("bandwidth-handler");

const WebsocketSocketHandler = function() {

  /*
   * Class WebsocketSocketHandler
   * The handler for all connected websockets
   */

  // Keep track of all connected sockets
  this.__connectedSockets = new Set();

  // Manager for socket I/O
  this.networkManager = new NetworkManager();

}

WebsocketSocketHandler.prototype.getConnectedSockets = function() {

  /*
   * Function WebsocketSocketHandler.getConnectedSockets
   * Returns the set of all connnected sockets
   */

  return this.__connectedSockets;

}

WebsocketSocketHandler.prototype.isOverpopulated = function() {

  /*
   * Function WebsocketSocketHandler.isOverpopulated
   * Returns true if the server has equal or more sockets connected than the configured maximum
   */

  return this.getTotalConnectedSockets() >= CONFIG.SERVER.ALLOW_MAXIMUM_CONNECTIONS;

}

WebsocketSocketHandler.prototype.getTotalConnectedSockets = function() {

  /*
   * Function WebsocketSocketHandler.getTotalConnectedSockets
   * Returns the number of connected sockets
   */

  return this.getConnectedSockets().size;

}

WebsocketSocketHandler.prototype.disconnectClients = function() {

  /*
   * Function WebsocketSocketHandler.disconnectClients
   * Disconnects all client connected to the webocket server
   */

  this.getConnectedSockets().forEach(gameSocket => gameSocket.close());

}

WebsocketSocketHandler.prototype.ping = function() {

  /*
   * Function WebsocketSocketHandler.ping
   * Pings all clients over the websocket protocol to disconnect stale connections
   */

  this.__connectedSockets.forEach(gameSocket => gameSocket.ping());

}

WebsocketSocketHandler.prototype.flushSocketBuffers = function(gameSocket) {

  /*
   * Function WebsocketSocketHandler.flushSocketBuffers
   * Flushing the incoming and outgoing websocket buffer
   */

  // Go over all sockets and handle buffers
  this.__connectedSockets.forEach(gameSocket => this.networkManager.handleIO(gameSocket));

}

WebsocketSocketHandler.prototype.referenceSocket = function(gameSocket) {

  /*
   * WebsocketSocketHandler.__referenceSocket
   * Saves a reference to the gamesocket
   */

  this.__connectedSockets.add(gameSocket);

}

WebsocketSocketHandler.prototype.dereferenceSocket = function(gameSocket) {

  /*
   * WebsocketSocketHandler.__dereferenceSocket
   * Deletes a reference to the gamesocket
   */

  // Save the number of bytes written and sent over this socket
  this.__connectedSockets.delete(gameSocket);

}

module.exports = WebsocketSocketHandler;
