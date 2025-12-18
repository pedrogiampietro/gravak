"use strict";

const ChannelManager = requireModule("channel-manager");
const CombatHandler = requireModule("world-combat-handler");
const CreatureHandler = requireModule("world-creature-handler");
const EventQueue = requireModule("eventqueue");
const Lattice = requireModule("lattice");
const WorldClock = requireModule("world-clock");

const { PlayerLogoutPacket, ServerMessagePacket, EffectMagicPacket, EffectDistancePacket } = requireModule("protocol");

const World = function(worldSize) {

  /*
   * Class World
   * Container for the entire game world
   *
   * API:
   *
   * World.sendMagicEffect(to, type) - Sends a magic effect to a position of type
   * World.sendDistanceEffect(from, to, type) - Sends a distance magic effect from a position to another position of type
   * World.broadcast - Sends a packet to the a certain world position
   * World.getActiveChunks - Returns a set of all the currently active sectors that need to be updated
   * World.removeCreature(creature) - Function call to force remove a creature from the gameworld
   * World.addSplash(id, position, fluidtype) - Creates and adds a splash with a particular identifier to a position
   * World.getPlayerByName(name) - Returns the gamesocket by player name
   *
   */

  // Conversation channels (e.g., default, trade, world)
  this.channelManager = new ChannelManager();

  // The world lattice that references chunks and tiles
  this.lattice = new Lattice(worldSize);

  // Add a binary priority queue for all the game events
  this.eventQueue = new EventQueue();

  // Create the world clock
  this.clock = new WorldClock();

  // The handler for creatures
  this.creatureHandler = new CreatureHandler();

  // The handler for combat
  this.combatHandler = new CombatHandler();
  
  // Delegate and expose these functions
  this.getSpectatingChunks = this.lattice.getSpectatingChunks.bind(this.lattice);
  this.findAvailableTile = this.lattice.findAvailableTile.bind(this.lattice);
  this.getTileFromWorldPosition = this.lattice.getTileFromWorldPosition.bind(this.lattice);
  this.withinBounds = this.lattice.withinBounds.bind(this.lattice);
  this.getChunkFromWorldPosition = this.lattice.getChunkFromWorldPosition.bind(this.lattice);
  this.findPath = this.lattice.findPath.bind(this.lattice);

}

World.prototype.tick = function() {

  /*
   * Function World.tick
   * Called every server frame
   */

  // Tick the world clock
  this.clock.tick();

  // Handle all the events scheduled in the internal event queue
  this.eventQueue.tick();

  // Handle all the creature actions next
  this.creatureHandler.tick();

}

World.prototype.addTopThing = function(position, thing) {

  /*
   * Function World.addTopThing
   * Adds an item to the top of the item stack
   */

  let tile = this.getTileFromWorldPosition(position);

  if(tile === null) {
    return;
  }

  tile.addTopThing(thing);

}

World.prototype.addThing = function(position, item, index) {

  /*
   * Function World.addThing
   * Adds an item to a specific position at a stack index
   */

  // Get the tile
  let tile = this.getTileFromWorldPosition(position);

  if(tile === null) {
    return;
  }

  tile.addThing(item, index);

}

World.prototype.broadcastPosition = function(position, packet) {

  /*
   * Function World.broadcastPosition
   * Broadcasts a packet to all observers at the given position
   */

  let chunk = this.getChunkFromWorldPosition(position);

  if(chunk === null) {
    return;
  }

  chunk.broadcast(packet);

}

World.prototype.addSplash = function(id, position, type) {

  /*
   * Function World.addSplash
   * Creates a splash item at the bottom
   */

  // Create the splash and make it the right count (color)
  let splash = gameServer.database.createThing(id);

  // Set the type of the fluid
  splash.setFluidType(type);

  // Add at bottom of the stack
  this.addThing(position, splash, 0);

}

World.prototype.sendDistanceEffect = function(from, to, type) {

  /*
   * Function World.sendMagicEffect
   * Sends a magic effect to the world at a position
   */

  // Invalid
  if(!this.withinBounds(from) || !this.withinBounds(to)) {
    return;
  }

  // Cannot send from one floor to another
  if(!from.isSameFloor(to)) {
    return;
  }

  let packet = new EffectDistancePacket(from, to, type);

  // Play the animation in both positions to make sure it is never missed
  this.broadcastPosition(to, packet);
  this.broadcastPosition(from, packet);

}

World.prototype.sendMagicEffect = function(position, type) {

  /*
   * Function World.sendMagicEffect
   * Sends a magic effect to the world at a position
   */

  // Invalid
  if(!this.withinBounds(position)) {
    return;
  }

  this.broadcastPosition(position, new EffectMagicPacket(position, type));

}

World.prototype.broadcastMessage = function(message) {

  /*
   * Function World.broadcastMessage
   * Broadcasts a message to all the connected players
   */

  this.broadcastPacket(new ServerMessagePacket(message)); 

}

World.prototype.broadcastPacket = function(packet) {

  /*
   * Function World.broadcastPacket
   * Broadcasts a packet to all the connected players
   */

  this.creatureHandler.getConnectedPlayers().forEach(player => player.write(packet));

}

World.prototype.writePlayerLogout = function(name) {

  /*
   * Function World.writePlayerLogout
   * Writes logout action of a player to all connected gamesockets
   */

  this.broadcastPacket(new PlayerLogoutPacket(name));

}

World.prototype.getDataDetails = function() {

  /*
   * Function World.getDataDetails
   * Returns statistics of the world
   */

  return new Object({
    "activeMonsters": this.creatureHandler.__numberActiveMonsters,
    "time": this.clock.getTimeString()
  });
 
}

module.exports = World;
