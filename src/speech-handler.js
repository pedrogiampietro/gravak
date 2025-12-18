"use strict";

const { EmotePacket, ChannelDefaultPacket } = requireModule("protocol");

const SpeechHandler = function(creature) {

  /*
   * Class SpeechHandler
   * Handler for creature speaking abilities
   */

  // Reference parent
  this.__creature = creature;

}

SpeechHandler.prototype.emote = function(emote, color) {

  /*
   * Function SpeechHandler.emote
   * Makes the creature say an emote with a particular color
   */
  
  this.__creature.broadcastFloor(new EmotePacket(this.__creature, emote, color));

}

SpeechHandler.prototype.internalCreatureYell = function(message, color) {

  /*
   * Function SpeechHandler.internalCreatureYell
   * Yells a messages to even far away characters
   */

  return this.__creature.broadcast(new ChannelDefaultPacket(this.__creature, message.toUpperCase(), color));

}

SpeechHandler.prototype.internalCreatureWhisper = function(message, color) {

  /*
   * Function SpeechHandler.internalCreatureWhisper
   * Whispers to nearby creatures on the adjacent tiles
   */

  // Get the tile from the creature position
  let tile = gameServer.world.getTileFromWorldPosition(this.__creature.getPosition());

  tile.broadcastNeighbours(new ChannelDefaultPacket(this.__creature, message.toLowerCase(), color));

}

SpeechHandler.prototype.internalCreatureSay = function(message, color) {

  /*
   * Function SpeechHandler.internalCreatureSay
   * Writes a creature message to all spectators
   */

  return this.__creature.broadcastFloor(new ChannelDefaultPacket(this.__creature, message, color));

}

SpeechHandler.prototype.privateSay = function(player, message, color) {

  /*
   * Function SpeechHandler.privateSay
   * Writes a message that only a particular player can hear
   */

  return player.write(new ChannelDefaultPacket(this.__creature, message, color));

}

module.exports = SpeechHandler;
