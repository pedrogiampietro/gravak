"use strict";

const Channel = requireModule("channel");
const CommandHandler = requireModule("command-handler");

const DefaultChannel = function(id, name) {

  /*
   * Class DefaultChannel
   * Wrapper for the default channel that broadcasts to all characters inside a particular range
   */

  // Inherits from channel
  Channel.call(this, id, name);

  // The handler for chat commands
  this.commandHandler = new CommandHandler();

}

DefaultChannel.prototype = Object.create(Channel.prototype);
DefaultChannel.prototype.constructor = DefaultChannel;

DefaultChannel.prototype.send = function(player, packet) {

  /*
   * Function DefaultChannel.send
   * Sends a message to all players near this player in the gameworld
   */

  // Message and loudness
  let message = packet.message;
  let loudness = packet.loudness;

  // Administrators have a red color; players yellow
  let color = player.getProperty(CONST.PROPERTIES.ROLE) === CONST.ROLES.ADMIN ? CONST.COLOR.RED : CONST.COLOR.YELLOW;

  // Forward to the command handler
  if(message.startsWith("/")) {
    return this.commandHandler.handle(player, message);
  }

  // Whispers
  if(packet.loudness === 0) {
    return player.internalCreatureWhisper(message, color);
  }

  if(packet.loudness === 2) {
    return player.internalCreatureYell(message, color);
  }

  // Write to the default game screen and the default chat channel
  player.speechHandler.internalCreatureSay(message, color);

  // NPCs listen to all messages in the default channels
  this.__NPCListen(player, message.toLowerCase());

}

DefaultChannel.prototype.__NPCListen = function(player, message) {

  /*
   * Function DefaultChannel.__NPCListen
   * Handler called when a player says a message and NPCs are nearby
   */
 
  // Get the npcs spectating the chunk
  let chunks = gameServer.world.getSpectatingChunks(player);

  // Go over all the NPCs that are nearby in the game world
  chunks.forEach(function(chunk) {
    chunk.npcs.forEach(npc => npc.listen(player, message));
  });

}

module.exports = DefaultChannel;
