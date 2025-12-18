"use strict";

const Packet = requireModule("packet");
const Outfit = requireModule("outfit");

const PacketWriter = function(opcode, length) {
    
  /*
   * Class PacketWriter
   * Wrapper for a packet buffer to write packets to the clients
   */ 
  
  // Inherits from packet
  Packet.call(this);
  
  // Whether the buffer encountered an overflow
  this.__inBounds = true;

  // Allocate space for the buffer
  this.buffer = Buffer.allocUnsafe(1 + length);

  // And write the opcode
  this.writeUInt8(opcode);

}

PacketWriter.prototype = Object.create(Packet.prototype);
PacketWriter.prototype.constructor = PacketWriter;

PacketWriter.prototype.MAX_PACKET_SIZE = 65536;

PacketWriter.prototype.writeMounts = function(ids) {

  /*
   * Function PacketWriter.writeMounts
   * Writes the available mount identifier and mount name to the packet
   */
  
  let mounts = Array.from(ids).filter(x => Outfit.prototype.MOUNTS.hasOwnProperty(x));
  
  this.writeUInt8(mounts.length);
  
  mounts.forEach(function(id) {
    this.writeUInt16(id);
    let stringEncoded = this.encodeString(Outfit.prototype.getMountName(id));
    this.writeBuffer(stringEncoded);
  }, this);
  
} 

PacketWriter.prototype.writeOutfits = function(ids) {

  /*
   * Function PacketWriter.writeOutfits
   * Writes the available outfits to the client
   */

  let outfits = Array.from(ids).filter(x => Outfit.prototype.OUTFITS.hasOwnProperty(x));

  this.writeUInt8(outfits.length);

  outfits.forEach(function(outfit) {
    this.writeUInt16(outfit);
    let stringEncoded = this.encodeString(Outfit.prototype.getName(outfit));
    this.writeBuffer(stringEncoded);
  }, this);

}

PacketWriter.prototype.writeEquipment = function(equipment) {
  
  /*
   * Function PacketWriter.writeEquipment
   * Writes all equipment to a packet
   */
  
  equipment.container.getSlots().forEach(function(item) {
    this.writeItem(item);
  }, this);
  
}

PacketWriter.prototype.canWrite = function(bytes) {

  /*
   * Function PacketWriter.canWrite
   * Returns true if there is available space in the packet
   */

  return this.__inBounds = (this.index + bytes) <= this.buffer.length;

}

PacketWriter.prototype.overflow = function() {

  /*
   * Function PacketWriter.overflow
   * Returns whether the buffer has been overflown
   */

  return !this.__inBounds;

}

PacketWriter.prototype.getBuffer = function() {

  /*
   * Function PacketWriter.getBuffer
   * Returns the buffer that has been written
   */

  // Completely full
  if(this.index === this.buffer.length) {
    return this.buffer;
  }

  // Only return the written part when using MAX_PACKET_SIZE for unknown size buffers
  return this.buffer.subarray(0, this.index);

}

PacketWriter.prototype.writeCreatureType = function(creature) {

  /*
   * Function PacketWriter.writeCreatureType
   * Writess the identifier for creature types to the client
   */

  switch(creature.constructor.name) {
    case "Player": return this.writeUInt8(CONST.TYPES.PLAYER);
    case "Monster": return this.writeUInt8(CONST.TYPES.MONSTER);
    case "NPC": return this.writeUInt8(CONST.TYPES.NPC);

  }

}

PacketWriter.prototype.writeItem = function(item) {
  
  /*
   * Function writeItem
   * Writes packet that defines an item (id and count)
   */
  
  // If there is no item write three zero bytes
  if(item === null) {
    this.writeUInt16(0);
    this.writeUInt8(0);
    return;
  }

  this.writeClientId(item.id);
  this.writeUInt8(item.count);
  
} 

PacketWriter.prototype.writeTile = function(tile) {
        
  /*  
   * Function PacketWriter.writeTile
   * Serializes a single tile with its client side identifier
   */
    
  // The tile nullptr is identified by id 0
  if(tile === null) {
    return this.writeNull(4);
  }
        
  this.writeClientId(tile.id);

  // Write the flags
  if(tile.hasOwnProperty("tilezoneFlags")) {
    this.writeUInt8(tile.tilezoneFlags.flag);
  } else {
    this.writeUInt8(0);
  }

  // Write all the items
  let items = tile.getItems();
  this.writeUInt8(items.length);

  items.forEach(this.writeItem, this);

}

PacketWriter.prototype.writePosition = function(position) {

  /*
   * Function Packet.writePosition
   * Writes x, y, z position to the packet
   */

  this.writeUInt16(position.x);
  this.writeUInt16(position.y);
  this.writeUInt16(position.z);
  
}

PacketWriter.prototype.writeClientId = function(id) {

  /*
   * Function PacketWriter.writeClientId
   * Writes the client ID by converting server ID to client ID
   */
  
  this.writeUInt16(gameServer.database.getClientId(id));
  
} 

PacketWriter.prototype.writeUInt8 = function(value) {
  
  /*
   * Function PacketWriter.writeUInt8
   * Writes an unsigned byte to the packet
   */
    
  if(!this.canWrite(1)) {
    return;
  }

  this.buffer.writeUInt8(value, this.index);
  this.advance(1);

} 

PacketWriter.prototype.writeUInt16 = function(value) {

  /*
   * Function PacketWriter.writeUInt16
   * Writes two unsigned bytes to the packet
   */

  if(!this.canWrite(2)) {
    return;
  }

  this.buffer.writeUInt16LE(value, this.index);
  this.advance(2);

}

PacketWriter.prototype.writeUInt32 = function(value) {

  /*
   * Function PacketWriter.writeUInt32
   * Writes four unsigned bytes to the packet
   */

  if(!this.canWrite(4)) {
    return;
  }

  this.buffer.writeUInt32LE(value, this.index);
  this.advance(4);

}

PacketWriter.prototype.writeNull = function(amount) {

  /*
   * Function PacketWriter.writeNull
   * Writes a number of null values to the buffer
   */

  if(!this.canWrite(amount)) {
    return;
  }

  let mod1 = Math.floor(amount / 4);
  let mod2 = amount % 4;

  // Write four bytes while we can
  for(let i = 0; i < mod1; i++) {
    this.writeUInt32(0);
  }

  // Fill in the remainder
  for(let i = 0; i < mod2; i++) {
    this.writeUInt8(0);
  }

}

PacketWriter.prototype.encodeString = function(message) {

  /*
   * Function PacketWriter.encodeString
   * Encodes a string to UTF-8 and returns the buffer and length
   */

  if(message === null) {
    return new Uint8Array();
  }

  return new TextEncoder("utf-8").encode(message.escapeHTML());

}

PacketWriter.prototype.writeBuffer = function(buffer) {

  /*
   * Function PacketWriter.writeBuffer
   * Writes a message to the packet
   */

  // Truncate
  if(buffer.length >= 0xFFFF) {
    buffer = buffer.subarray(0, 0xFFFF);
  }

  if(!this.canWrite(buffer.length)) {
    return;
  }

  // Write the message size
  this.writeUInt16(buffer.length);
  this.set(buffer);

}

PacketWriter.prototype.set = function(buffer) {

  /*
   * Function PacketWriter.set
   * Inserts a buffer or uint8array into the packet writer
   */

  if(!this.canWrite(buffer.length)) {
    return;
  }

  this.buffer.set(buffer, this.index);
  this.advance(buffer.length);

}

PacketWriter.prototype.writeBoolean = function(value) {

  /*
   * Function PacketWriter.writeBoolean
   * Writes a boolean value to the packet
   */

  if(!this.canWrite(1)) {
    return;
  }

  this.writeUInt8(value ? 1 : 0);
  
}

PacketWriter.prototype.writeOutfit = function(outfit) {

  /*
   * Function PacketWriter.writeOutfit
   * Writes a packet that contains the outfit information
   */

  this.writeUInt16(outfit.id);

  // If outfit details are enabled
  if(outfit.details) {
    this.writeUInt8(outfit.details.head);
    this.writeUInt8(outfit.details.body);
    this.writeUInt8(outfit.details.legs);
    this.writeUInt8(outfit.details.feet);
  } else {
    this.writeNull(4);
  }

  // If addons & mount features are enabled
  if(gameServer.isFeatureEnabled()) {
    this.writeUInt16(outfit.mount);
    this.writeBoolean(outfit.mounted);
    this.writeBoolean(outfit.addonOne);
    this.writeBoolean(outfit.addonTwo);
  } else {
    this.writeNull(5);
  }

}

module.exports = PacketWriter;
