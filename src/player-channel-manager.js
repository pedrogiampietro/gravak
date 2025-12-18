"use strict";

const ChannelManager = function(player) {

  /*
   * Class ChannelManager
   * The managed for channels the player has joined
   */

  // Circular reference the player
  this.__player = player;

  // Map of the opened channels
  this.__openedGlobalChannels = new Map();

}

ChannelManager.prototype.cleanup = function() {

  /*
   * Function ChannelManager.cleanup
   * Cleans up all the channels the player is in
   */

  // Clean up all opened global channels
  this.__openedGlobalChannels.forEach(channel => channel.leave(this.__player));

}

ChannelManager.prototype.remove = function(id) {

  /*
   * Function ChannelManager.remove
   * Cleans up all the channels the player is in
   */

  this.__openedGlobalChannels.delete(id);

}

ChannelManager.prototype.add = function(channel) {

  /*
   * Function ChannelManager.add
   * Cleans up all the channels the player is in
   */

  // Reference
  this.__openedGlobalChannels.set(channel.id, channel);

}

module.exports = ChannelManager;
