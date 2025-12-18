"use strict";

const Monster = requireModule("monster");
const NPC = requireModule("npc");
const Player = requireModule("player");
const Tile = requireModule("tile");

const { CreatureStatePacket, ChunkPacket } = requireModule("protocol");

const Chunk = function(id, chunkPosition) {

  /*
   *
   * Class Chunk
    *
   * Container for a single chunk: an 8x8x8 area that references
   * neighbouring chunk cells. When an update happens in one chunk,
   * only adjacent chunks need to be pushed an update.
   *
   * API:
   *
   * Chunk.addCreature - adds a creature to the chunk
   * Chunk.broadcast - broadcasts a packet to all spectating entities
   * Chunk.broadcastFloor - broadcasts a packet to all spectating entities on a given floor
   * Chunk.createTile - creates a new tile in the chunk
   * Chunk.getTileFromWorldPosition - Returns the tile within the chunk based on a world position
   * Chunk.handleRequest - Serializes the tiles of the chunk to a packet
   *
   */

  // Save the chunk identifier and its position in the world
  this.id = id;
  this.position = chunkPosition;

  // Container for the creatures in the chunk
  this.monsters = new Set();
  this.players = new Set();
  this.npcs = new Set();

  // Reference to neighbouring chunks including itself
  this.neighbours = new Array();

  // Reference to slice of tiles and reserve the required memory
  this.layers = new Array(this.DEPTH).fill(null);

}

// Overwrite from the configuration
Chunk.prototype.WIDTH = CONFIG.WORLD.CHUNK.WIDTH;
Chunk.prototype.HEIGHT = CONFIG.WORLD.CHUNK.HEIGHT;
Chunk.prototype.DEPTH = CONFIG.WORLD.CHUNK.DEPTH;

Chunk.prototype.difference = function(chunk) {

  /*
   * Function Chunk.difference
   * Returns the chunks that are in the passed chunk but not in this chunk
   */

  // Other neighbours
  let complement = new Set(chunk.neighbours);

  // Delete everything that also exists in this chunk
  this.neighbours.forEach(x => complement.delete(x));

  // We are left with what is different in the new chunk
  return complement;

}

Chunk.prototype.createTile = function(position, id) {

  /*
   * Function Chunk.createTile
   * Creates a tile within the chunk and returns it
   */

  // Determine the layer to add the tile
  let layer = position.z % this.DEPTH;

  // Layer does not exist: reserve for the tiles
  if(this.layers[layer] === null) {
    this.layers[layer] = new Array(this.WIDTH * this.HEIGHT).fill(null);
  }

  let index = this.__getTileIndex(position);

  // Assign the tile to the correct index
  return this.layers[layer][index] = new Tile(id, position);

}

Chunk.prototype.getTileFromWorldPosition = function(position) {

  /*
   * Function Chunk.getTileFromWorldPosition
   * Returns a tile from the chunk relative to the chunk
   */

  let layer = position.z % this.DEPTH;

  if(this.layers[layer] === null) {
    return null;
  }

  let tileIndex = this.__getTileIndex(position);

  return this.layers[layer][tileIndex];

}

Chunk.prototype.serialize = function(targetSocket) {

  /*
   * Function Chunk.serialize
   * Introduces the creature to its new chunk (targetSocket can be a player or gameSocket)
   */

  // Write the chunk itself
  targetSocket.write(new ChunkPacket(this)); 

  for(let chunkPlayer of this.players) {

    // Do not send information on self
    if(targetSocket.player === chunkPlayer) {
      continue;
    }

    // Otherwise write information on other players
    targetSocket.write(new CreatureStatePacket(chunkPlayer));

  }

  // Write the other creatures (npcs & monsters)
  for(let npc of this.npcs) {
    targetSocket.write(new CreatureStatePacket(npc));
  }

  for(let monster of this.monsters) {
    targetSocket.write(new CreatureStatePacket(monster));
  }

}

Chunk.prototype.broadcast = function(packet) {

  /*
   * Function Chunk.broadcast
   * Broadcasts a packet to all the chunk spectators (including neighbours)
   */

  // Chunks needs to broadcast to their neighbours
  this.neighbours.forEach(chunk => chunk.internalBroadcast(packet));

}

Chunk.prototype.broadcastFloor = function(floor, packet) {

  /*
   * Function Chunk.broadcastFloor
   * Broadcasts a packet to all the chunk spectators (including neighbours) on the same floor
   */

  // Add chunk information to each connected game socket in each neighbouring chunk cell
  this.neighbours.forEach(chunk => chunk.__internalBroadcastFloor(floor, packet));

}

Chunk.prototype.removeCreature = function(creature) {

  /*
   * Function Chunk.removeCreature
   * Removes the creature reference from the chunk
   */

  switch(creature.constructor) {
    case Player: return this.players.delete(creature);
    case Monster: return this.monsters.delete(creature);
    case NPC: return this.npcs.delete(creature);
  }

}

Chunk.prototype.addCreature = function(creature) {

  /*
   * Function Chunk.addCreature
   * Adds a creature to the correct entity set of the chunk
   */

  switch(creature.constructor) {
    case Player: return this.players.add(creature);
    case Monster: return this.monsters.add(creature);
    case NPC: return this.npcs.add(creature);
  }

}

Chunk.prototype.__getTileIndex = function(worldPosition) {

  /*
   * Function Chunk.__getTileIndex
   * Returns the index of a tile in the chunk
   */

  // Project the z-component. The coordinates are truncated to the chunk size
  let z = (worldPosition.z % this.DEPTH);
  let x = (worldPosition.x - z) % this.WIDTH;
  let y = (worldPosition.y - z) % this.HEIGHT;

  // Return the tile from the chunk
  return x + (y * this.WIDTH);
  
}

Chunk.prototype.internalBroadcast = function(packet) {

  /*
   * Function Chunk.internalBroadcast
   * Broadcasts a packet to the players within the chunk itself (not neighbours)
   */

  // Go over each players in the chunk
  this.players.forEach(player => player.write(packet));

}

Chunk.prototype.__internalBroadcastFloor = function(floor, packet) {

  /*
   * Function Chunk.__internalBroadcastFloor
   * Broadcasts a packet to the players within the chunk itself (not neighbours)
   */

  this.players.forEach(function(player) {

    // Check if the floor matches
    if(player.position.z === floor) {
      player.write(packet);
    }

  });

}

module.exports = Chunk;
