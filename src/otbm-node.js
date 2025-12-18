"use strict";

const OTBM_HEADERS = requireModule("otbm-headers");
const OTBMPacketReader = requireModule("otbm-packet-reader");
const Position = requireModule("position");

const OTBMNode = function(parentNode, buffer) {

  /* 
   * Class OTBMNode
   * Wrapped for a single node in an OTBM file
   */

  // Save a reference to the parent node
  this.parentNode = parentNode;

  // Create a reader
  let packet = new OTBMPacketReader(buffer);

  // Set the type (first byte)
  this.type = packet.readUInt8();

  // And the properties
  this.properties = this.__readProperties(packet);

}

OTBMNode.prototype.getAttribute = function(attribute) {

  /*
   * Function OTBMNode.getAttribute
   * Returns the attribute of a node
   */

  if(!this.hasAttribute(attribute)) {
    return null;
  }

  return this.properties.attributes.get(attribute);

}

OTBMNode.prototype.hasAttribute = function(attribute) {

  /*
   * Function OTBMNode.hasAttribute
   * Returns true if the node has a particular attribute
   */

  return this.properties.attributes.has(attribute);

}

OTBMNode.prototype.getPosition = function() {

  /*
   * Function OTBMNode.getPosition
   * Wrapper that returns the world position of the OTBM node (item or tile)
   */

  // An item refers to the parent tile
  if(this.type === OTBM_HEADERS.OTBM_ITEM) {
    return this.parentNode.getPosition();
  }

  // A tile takes it position from the parent tile area 
  if(this.type === OTBM_HEADERS.OTBM_TILE || this.type === OTBM_HEADERS.OTBM_HOUSETILE) {
    return new Position(
      this.properties.x + this.parentNode.properties.position.x,
      this.properties.y + this.parentNode.properties.position.y,
      15 - this.parentNode.properties.position.z // Swap the z-coordinate
    );
  }

  return null;

}

OTBMNode.prototype.__readProperties = function(packet) {

  /*
   * Function OTBMNode.__readProperties
   * Reads the properties of the OTBMNode
   */

  // Map to handler
  switch(this.type) {
    case OTBM_HEADERS.OTBM_MAP_HEADER: return packet.readOTBMHeader();
    case OTBM_HEADERS.OTBM_MAP_DATA: return packet.readOTBMData();
    case OTBM_HEADERS.OTBM_TILE_AREA: return packet.readOTBMTileArea();
    case OTBM_HEADERS.OTBM_TILE: return packet.readOTBMTile();
    case OTBM_HEADERS.OTBM_ITEM: return packet.readOTBMItem();
    case OTBM_HEADERS.OTBM_HOUSETILE: return packet.readOTBMHouseTile();
    case OTBM_HEADERS.OTBM_WAYPOINT: return packet.readOTBMWaypoint();
    case OTBM_HEADERS.OTBM_TOWN: return packet.readOTBMTown();
  }

  return null;

}

module.exports = OTBMNode;
