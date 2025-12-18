"use strict";

const Outfit = requireModule("outfit");
const Packet = requireModule("packet");
const Position = requireModule("position");

const PacketReader = function(buffer) {

  /*
   * Class PacketReader
   * Wrapper a buffer to make it a binary buffer easily readable (used in networking protocol)
   */

  // Inherits from packet
  Packet.call(this);

  // Save the buffer to be read
  this.buffer = buffer;

}

PacketReader.prototype = Object.create(Packet.prototype);
PacketReader.constructor = PacketReader;

PacketReader.prototype.readBuyOffer = function() {

  /*
   * Function PacketReader.readBuyOffer
   * Reads a buy buffer that was made by the player
   */

  // References the creature identifier, offer index, and count
  return new Object({
    "id": this.readUInt32(),
    "index": this.readUInt8(),
    "count": this.readUInt8()
  });

}

PacketReader.prototype.readMoveItem = function(player) {

  /*
   * Function PacketReader.readMoveItem
   * Read a complete move item event from the packet
   */

  return new Object({
    "fromWhere": this.readMoveEvent(player),
    "fromIndex": this.readUInt8(),
    "toWhere": this.readMoveEvent(player),
    "toIndex": this.readUInt8(),
    "count": this.readUInt8()
  });

}

PacketReader.prototype.readAccountDetails = function() {

  /*
   * Function PacketReader.readAccountDetails
   * Reads the account details (name, password) from the packet
   */

  return new Object({
    "account": this.readString(),
    "password": this.readString()
  });

}

PacketReader.prototype.readClientMessage = function() {

  /*
   * Function PacketReader.readClientMessage
   * Reads a message sent by the client
   */

  return new Object({
    "id": this.readUInt8(),
    "loudness": this.readUInt8(),
    "message": this.readString()
  });

}

PacketReader.prototype.readPrivateMessage = function() {

  /*
   * Function PacketReader.readPrivateMessage
   * Reads a private message from the packet
   */

  return new Object({
    "name": this.readString(),
    "message": this.readString()
  });

}

PacketReader.prototype.readItemUseWith = function(player) {

  /*
   * Function PacketReader.readItemUseWith
   * Reads a packet for a use-with event
   */

  return new Object({
    "fromWhere": this.readMoveEvent(player),
    "fromIndex": this.readUInt8(),
    "toWhere": this.readMoveEvent(player),
    "toIndex": this.readUInt8()
  });

}

PacketReader.prototype.isReadable = function() {

  /*
   * Function PacketReader.readable
   * Returns whether the packet is still readable
   */

  return this.index < this.buffer.length;

}

PacketReader.prototype.seek = function(offset) {

  /*
   * Public Function PacketReader.seek
   * Goes to a particular offset in the packet (use with care)
   */

  this.index = offset;

}

PacketReader.prototype.readPositionAndIndex = function(player) {

  /*
   * Public Function PacketReader.readPositionAndIndex
   * Reads a position (tile or container) and an index
   */

  return new Object({
    "which": this.readMoveEvent(player),
    "index": this.readUInt8()
  });

}

PacketReader.prototype.readMoveEvent = function(player) {

  /*
   * Public Function PacketReader.readMoveEvent
   * Read an item movement event (from tile, container, equipment)
   */

  switch(this.readUInt8()) {
    case 0:
      this.readUInt16();
      return player.containerManager.getContainerFromId(this.readUInt32());
    case 1:
      return process.gameServer.world.getTileFromWorldPosition(this.readWorldPosition());
    default:
      return null;
  }

}

PacketReader.prototype.readString16 = function() {

  /*
   * Public Function PacketReader.readString16
   * Reads a string from the packet of max length 2^16
   */

  let length = this.readUInt16();
  let string = this.buffer.subarray(this.index, this.index + length).toString();
  this.advance(length);

  return string;

}

PacketReader.prototype.readString = function() {

  /*
   * Public Function PacketReader.readString
   * Reads a string from the packet of max length 2^8
   */

  let length = this.readUInt8();
  let string = this.buffer.subarray(this.index, this.index + length).toString();
  this.advance(length);

  return string;

}

PacketReader.prototype.readUInt8 = function() {

  /*
   * Public Function PacketReader.readUInt8
   * Reads a single byte unsigned integer from the packet
   */

  let result = this.buffer.readUInt8(this.index)
  this.advance(1);

  return result;

}

PacketReader.prototype.readUInt16 = function() {

  /*
   * Public Function PacketReader.readUInt16
   * Reads a 2 byte unsigned integer from the packet
   */

  let result = this.buffer.readUInt16LE(this.index);
  this.advance(2);

  return result;

}

PacketReader.prototype.readUInt32 = function() {

  /*
   * Public Function PacketReader.readUInt32
   * Reads a 4 byte unsigned integer (usually identifiers) from the packet
   */

  let result = this.buffer.readUInt32LE(this.index);
  this.advance(4);

  return result;

}

PacketReader.prototype.readBoolean = function() {

  /*
   * Public Function PacketReader.readBoolean
   * Reads a boolean packet
   */

  return this.readUInt8() === 1;

}

PacketReader.prototype.readOutfit = function() {

  /*
   * Public Function PacketReader.readOutfit
   * Reads an outfit from a websocket packet
   */

  return new Outfit({
    "id": this.readUInt16(),
    "details":  {
      "head": this.readUInt8(),
      "body": this.readUInt8(),
      "legs": this.readUInt8(),
      "feet": this.readUInt8()
    },
    "mount": this.readUInt16(),
    "mounted": this.readBoolean(),
    "addonOne": this.readBoolean(),
    "addonTwo": this.readBoolean()
  });

}

PacketReader.prototype.readWorldPosition = function() {

  /*
   * Function PacketReader.readWorldPosition
   * Reads a world position from the packet
   */

  // Four double bytes
  return new Position(
    this.readUInt16(),
    this.readUInt16(),
    this.readUInt16()
  );

}

module.exports = PacketReader;
