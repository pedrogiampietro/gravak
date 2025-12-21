"use strict";

const SocketHandler = function(player) {

  /*
   * Class SocketHandler
   * Wrapper for sockets connectted to the player: these are 1) controller and N) spectators
   */

  // Reference the parent player
  this.player = player;

  // A single controller and multiple possible spectators
  this.__controllingSocket = null;
  this.__spectators = new Set();

  // Callback assigned to log out
  this.__logoutCallback = null;

}

SocketHandler.prototype.setLogoutEvent = function(logoutEvent) {

  this.__logoutCallback = logoutEvent;

}

SocketHandler.prototype.write = function(buffer) {

  /*
   * Function SocketHandler.write
   * Writes a messsage to all the connected sockets
   */

  // Go over all the connected game sockets
  this.__spectators.forEach(gameSocket => gameSocket.write(buffer));

}

SocketHandler.prototype.attachController = function(gameSocket) {

  /*
   * Function SocketHandler.attachController
   * Attaches a controlling socket to the player
   */

  // Replace: remove the currently connected game socket
  if(this.__controllingSocket !== null) {
    this.__controllingSocket.close();
  }

  // Cancel a potential scheduled logout callback
  if(this.__logoutCallback) {
    this.__logoutCallback.cancel();
  }

  // Reference
  this.__controllingSocket = gameSocket;

  // A controller is automatically a spectator too
  this.addSpectator(gameSocket);

}

SocketHandler.prototype.disconnect = function() {

  /*
   * Function SocketHandler.disconnect
   * All spectators must be disconnected
   */

  this.__spectators.forEach(gameSocket => gameSocket.close());

}

SocketHandler.prototype.getController = function() {

  /*
   * Function SocketHandler.getController
   * Returns the controlling game socket of the player
   */

  return this.__controllingSocket;

}

SocketHandler.prototype.getLastPacketReceived = function() {

  /*
   * Function SocketHandler.getLastPacketReceived
   * Returns the timestamp of when the latest packet was received 
   */

  // Get the last packet of the controlling socket
  return this.getController().getLastPackedReceived();

}

SocketHandler.prototype.addSpectator = function(gameSocket) {

  /*
   * Function SocketHandler.addSpectator
   * Adds a new spectator to the player and writes the world state
   */

  // Reference
  this.__spectators.add(gameSocket);

  // Reference the player in the game socket
  gameSocket.player = this.player;

  // Call to write the initial spectator packets
  gameSocket.writeWorldState(this.player);

}

module.exports = SocketHandler;
