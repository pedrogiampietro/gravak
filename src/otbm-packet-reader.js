"use strict";

const PacketReader = requireModule("packet-reader");
const Position = requireModule("position");
const OTBM_HEADERS = requireModule("otbm-headers");

const OTBMPacketReader = function(buffer) {

  /*
   * Class OTBMPacketReader
   * Wrapper for a readable OTBM node packet
   */

  // Inherits from PacketReader but adds some functions
  PacketReader.call(this, buffer)

}

OTBMPacketReader.prototype = Object.create(PacketReader.prototype);
OTBMPacketReader.constructor = OTBMPacketReader;

OTBMPacketReader.prototype.__escapeString = function(buffer) {

  /*
   * Function OTBMPacketReader.__escapeString
   * Removes the escape character 0xFD from the buffer before parsing
   */

  let iEsc = 0;
  let index;

  while(true) {
    
    // Find the next escape character
    index = buffer.subarray(iEsc++).indexOf(OTBM_HEADERS.OTBM_NODE_ESC);
     
    // No more: stop iteration
    if(index === -1) {
      return buffer;
    }

    iEsc = iEsc + index;

    // Remove the character from the buffer
    buffer = Buffer.concat([
      buffer.subarray(0, iEsc),
      buffer.subarray(iEsc + 1)
    ]);

  }

}

OTBMPacketReader.prototype.readOTBMHeader = function() {

  /*
   * Function OTBMPacketReader.readOTBMHeader
   * Reads the properties of the OTBM header node
   */

  return new Object({
    "version": this.__readUInt32(),
    "mapWidth": this.__readUInt16(),
    "mapHeight": this.__readUInt16(),
    "itemsMajorVersion": this.__readUInt32(),
    "itemsMinorVersion": this.__readUInt32()
  });

}

OTBMPacketReader.prototype.__readPositionInv = function() {
    
  /*
   * Function OTBMPacketReader.__readPosition
   * Reads an OTBM position
   */ 
    
  // Four double bytes
  return new Position( 
    this.__readUInt16(),
    this.__readUInt16(),
    15 - this.__readUInt8()
  );
      
} 

OTBMPacketReader.prototype.__readPosition = function() {

  /*
   * Function OTBMPacketReader.__readPosition
   * Reads an OTBM position
   */

  // Four double bytes
  return new Position( 
    this.__readUInt16(),
    this.__readUInt16(),
    this.__readUInt8()
  );

}

OTBMPacketReader.prototype.readOTBMTown = function() {

  /*
   * Function OTBMPacketReader.readOTBMTown
   * Reads the properties of an OTBM town node
   */

  return new Object({
    "id": this.__readUInt32(),
    "name": this.__readString16(),
    "position": this.__readPosition()
  });

}

OTBMPacketReader.prototype.readOTBMWaypoint = function() {

  /*
   * Function OTBMPacketReader.readOTBMWaypoint
   * Reads the properties of an OTBM Waypoint node
   */

  return new Object({
    "name": this.__readString16(),
    "position": this.__readPosition()
  });

}

OTBMPacketReader.prototype.__readUInt32 = function() {

  /*
   * Function OTBMPacketReader.__readUInt32
   * Reads an escaped 32 bit unsigned integer
   */

  return this.__readUInt16() + (this.__readUInt16() << 16);

}

OTBMPacketReader.prototype.__readUInt16 = function() {

  /*
   * Function OTBMPacketReader.__readUInt16
   * Reads an escaped 16 bit unsigned integer
   */

  return this.__readUInt8() + (this.__readUInt8() << 8);

}

OTBMPacketReader.prototype.__readUInt8 = function() {

  /*
   * Function OTBMPacketReader.__readUInt8
   * Reads an escaped 8 bit unsigned integer: this uses a modified version of packet reader to skip escape characters
   */

  let value = this.readUInt8();

  // Not escaped: return this value
  if(value !== OTBM_HEADERS.OTBM_NODE_ESC) {
    return value;
  }

  // It was escaped; return the intended value
  return this.readUInt8();

}

OTBMPacketReader.prototype.readOTBMHouseTile = function() {

  /*
   * Function OTBMPacketReader.readOTBMHouseTile
   * The position and identifier of the house tile
   */

  return new Object({
    "x": this.__readUInt8(),
    "y": this.__readUInt8(),
    "id": this.__readUInt32(),
    "attributes": this.readAttributes()
  });

}

OTBMPacketReader.prototype.readOTBMItem = function() {

  /*
   * Function OTBMPacketReader.readOTBMItem
   * Reads the properties of an OTBM item
   */

  // Item identifier and a list of attributes
  return new Object({
    "id": this.__readUInt16(),
    "attributes": this.readAttributes()
  });

}

OTBMPacketReader.prototype.readOTBMTileArea = function() {

  /*
   * Function OTBMPacketReader.readOTBMTileArea
   * Reads the properties of an OTBM tile area
   */

  // Is just a position, x, y, z
  return new Object({
    "position": this.__readPosition()
  });

}

OTBMPacketReader.prototype.readOTBMData = function() {

  /*
   * Function OTBMPacketReader.readOTBMData
   * Read the properties of the OTBM metadata
   */

  return new Object({
    "attributes": this.readAttributes()
  });

}

OTBMPacketReader.prototype.readOTBMTile = function() {

  /*
   * Function OTBMPacketReader.readOTBMTile
   * Read the properties of an OTBM tile
   */

  // Has predefined x, y and random attributes
  return new Object({
    "x": this.__readUInt8(),
    "y": this.__readUInt8(),
    "attributes": this.readAttributes()
  });

}

OTBMPacketReader.prototype.__readString16 = function() {

  /*
   * Function OTBMPacketReadere.__readString16
   * Reads and escaped a string of max length 2^15
   */

  let length = this.__readUInt16();
  let slice = this.buffer.subarray(this.index, this.index + length);

  // Make sure to remove escaped characters from the string
  let string = this.__escapeString(slice).toString();
  this.index += length;

  return string;

}

OTBMPacketReader.prototype.readAttributes = function() {

  /*
   * Function OTBMPacketReadere.readAttributes
   * Parses the attributes of a node
   */

  // Collect additional attributes
  let attributes = new Map();

  // Read buffer from beginning
  while(this.isReadable()) {
    this.__setAttribute(attributes, this.__readUInt8());
  }

  return attributes;

}

OTBMPacketReader.prototype.__setAttribute = function(attributes, type) {

  /*
   * Function OTBMPacketReadere.__setAttribute
   * Parses the attributes of a node
   */

  // Read the leading byte
  switch(type) {

    // The attributes
    case OTBM_HEADERS.OTBM_ATTR_HOUSEDOORID:
    case OTBM_HEADERS.OTBM_ATTR_COUNT:
      return attributes.set(type, this.__readUInt8());
    case OTBM_HEADERS.OTBM_ATTR_DEPOT_ID:
    case OTBM_HEADERS.OTBM_ATTR_RUNE_CHARGES:
    case OTBM_HEADERS.OTBM_ATTR_ITEM:
    case OTBM_HEADERS.OTBM_ATTR_ACTION_ID:
    case OTBM_HEADERS.OTBM_ATTR_UNIQUE_ID:
    case OTBM_HEADERS.OTBM_ATTR_CHARGES:
      return attributes.set(type, this.__readUInt16());
    case OTBM_HEADERS.OTBM_ATTR_TILE_FLAGS:
      return attributes.set(type, this.__readUInt32());
    case OTBM_HEADERS.OTBM_ATTR_TEXT:
    case OTBM_HEADERS.OTBM_ATTR_EXT_SPAWN_FILE:
    case OTBM_HEADERS.OTBM_ATTR_EXT_HOUSE_FILE:
    case OTBM_HEADERS.OTBM_ATTR_DESCRIPTION:
    case OTBM_HEADERS.OTBM_ATTR_DESC:
      return attributes.set(type, this.__readString16());
    case OTBM_HEADERS.OTBM_ATTR_TELE_DEST:
      return attributes.set(type, this.__readPositionInv());
  }

}

module.exports = OTBMPacketReader;
