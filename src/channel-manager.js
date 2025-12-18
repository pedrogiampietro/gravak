"use strict";

const DefaultChannel = requireModule("channel-default");
const GlobalChannel = requireModule("channel-global");

const { ChannelPrivatePacket } = requireModule("protocol");

const ChannelManager = function() {

  /*
   * Class ChannelManager
   * Container for all channels in the world
   *
   * Public API:
   *
   * ChannelManager.getChannel(cid) - returns the channel from an identifier
   * ChannelManager.leaveChannel(player, id) - removes a player from a chat channel
   * ChannelManager.joinChannel(player, id) - removes a player from a chat channel
   * ChannelManager.handleSendPrivateMessage(player, packet) - handles a write private message packet from a player to another player
   *
   */

  // Public game server channels
  this.__channels = new Map();

  // These channels are configured
  this.__channels.set(CONST.CHANNEL.DEFAULT, new DefaultChannel(CONST.CHANNEL.DEFAULT, "Default"));
  this.__channels.set(CONST.CHANNEL.WORLD, new GlobalChannel(CONST.CHANNEL.WORLD, "World"));
  this.__channels.set(CONST.CHANNEL.TRADE, new GlobalChannel(CONST.CHANNEL.TRADE, "Trade"));
  this.__channels.set(CONST.CHANNEL.HELP, new GlobalChannel(CONST.CHANNEL.HELP, "Help"));

}

ChannelManager.prototype.getChannel = function(cid) {

  /*
   * Function ChannelManager.getChannel
   * Returns a channel from the configured list of channels
   */

  // If the chat identifier is not valid
  if(!this.__channels.has(cid)) {
    return null;
  }

  return this.__channels.get(cid);

}

ChannelManager.prototype.leaveChannel = function(player, cid) {

  /*
   * Function ChannelManager.leaveChannel
   * Allows a player to leave general channel with identifier ID
   */

  let channel = this.getChannel(cid);

  if(channel === null) {
    return player.sendCancelMessage("This channel does not exist.");
  }

  // Only global channels can be left: the default channel must always exist
  if(channel instanceof DefaultChannel) {
    return;
  }

  // Remove the player from the channel
  channel.leave(player);

}

ChannelManager.prototype.joinChannel = function(player, id) {

  /*
   * Function ChannelManager.joinChannel
   * Joins a player to a global channel with identifier id
   */

  let channel = this.getChannel(id);

  // Confirm the channel is valid and exists
  if(channel === null) {
    return player.sendCancelMessage("This channel does not exist.");
  }

  // Only global channels can be joined
  if(channel instanceof DefaultChannel) {
    return;
  }

  // Add the player to the channel
  channel.join(player);

}

ChannelManager.prototype.handleSendPrivateMessage = function(player, packet) {

  /*
   * Function ChannelManager.handleSendPrivateMessage
   * Sends a private message to the target gameSocket (references by name)
   */

  // Avoid sending messages to self
  if(packet.name === player.name) {
    return player.sendCancelMessage("You cannot send messages to yourself.");
  }

  // Get a reference to the gamesocket from the player name
  let targetPlayer = gameServer.world.creatureHandler.getPlayerByName(packet.name);

  // No player with this name
  if(targetPlayer === null) {
    return player.sendCancelMessage("A player with this name is not online.");
  }

  targetPlayer.write(new ChannelPrivatePacket(player.getProperty(CONST.PROPERTIES.NAME), packet.message));

}

module.exports = ChannelManager;
