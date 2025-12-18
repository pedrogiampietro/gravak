"use strict";

const Geometry = requireModule("geometry");

const Position = function(x, y, z) {

  /*
   * Class Position
   * Container for a position (x, y, z) in Cartesian coordinates in the gameworld
   *
   * API:
   *
   * Position.inLineOfSight - returns true if this position is in line of sight of another position
   * Position.fromLiteral - returns a Position class from an object literal representation
   * Position.getSquare(size) - returns an array of positions that represent a square with a size
   * Position.getRadius(radius) - returns an array of positions that represent a circle with a radius
   * Position.toString - represents the Position class as a string
   * Position.copy - returns a memory copy of the Position
   * Position.equals(position) - returns true if the two positions are equal
   * Position.add(position) - adds a Position to another Position
   * Position.subtract(position) - subtracts a Position to another Position
   * Position.north - returns north of current position
   * Position.east - returns east of current position
   * Position.south - returns south of current position
   * Position.west - returns west of current position
   * Position.northeast - returns northeast of current position
   * Position.southeast - returns southeast of current position
   * Position.southwest - returns southwest of current position
   * Position.northwest- returns northwest of current position
   * Position.up - returns up of current position
   * Position.down - returns down of current position
   * Position.ladder - returns position when going up a ladder (up and south)
   *
   */

  // Save the three components (combine, x and y 16-bit to single 32-bit integer) to save some memory
  this.xy = x + ((y << 16) >>> 0);
  this.z = z;

}

// Extract x-coordinate
Object.defineProperty(Position.prototype, "x", {
  "get": function() { return this.xy & ((1 << 16) - 1); }
});

// Extract y-coordinate
Object.defineProperty(Position.prototype, "y", {
  "get": function() { return this.xy >>> 16; }
});

Position.prototype.isSameFloor = function(other) {

  /*
   * Function Position.isSameFloor
   * Returns true if the two positions are on the same floor with identical z-coordinates
   */

  return this.z === other.z;

}

Position.prototype.inLineOfSight = function(target) {

  /*
   * Function Position.inLineOfSight
   * Returns true if the other passed position is in the line of sight
   */

  // Always true if two characters are adjacent
  if(this.besides(target)) {
    return true;
  }

  // The positions must be on the same floor
  if(this.z !== target.z) {
    return false;
  }

  // Interpolate the positions
  for(let position of Geometry.prototype.interpolate(this, target)) {

    let tile = gameServer.world.getTileFromWorldPosition(position);

    if(tile === null) {
      return;
    }

    // Found a tile that blocks projectiles
    if(tile.isBlockProjectile()) {
      return false;
    }

  }

  // No collision were detected
  return true;

}

Position.prototype.fromLiteral = function(position) {

  /*
   * Function Position.fromLiteral
   * Returns a new Position class from a literal position object {x, y, z}
   */

  return new Position(position.x, position.y, position.z);

}

Position.prototype.getSquare = function(size) {

  /*
   * Function Position.getSquare
   * Returns the relative positions in a square of size { s } around { 0, 0 }
   */

  return Geometry.prototype.getSquare(this, size);

}

Position.prototype.getRadius = function(radius) {

  /*
   * Function Position.getRadius
   * Returns the relative positions in a circle of size { r } around { 0, 0 }
   */

  return Geometry.prototype.getRadius(this, radius);

}

Position.prototype.toString = function() {

  /*
   * Function Position.toString
   * Returns the position representation to string
   */

  return "%s, %s, %s".format(this.x, this.y, this.z);

}

Position.prototype.copy = function() {

  /*
   * Function Position.copy
   * Memory copy of the position vector
   */

  return new Position(this.x, this.y, this.z);

}

Position.prototype.equals = function(position) {

  /*
   * Function Position.equals
   * Returns true if two positions are equal
   */

  return this.x === position.x && this.y === position.y && this.z === position.z;

}

Position.prototype.addVector = function(x, y, z) {

  /*
   * Function Position.addVector
   * Adds an x y z vector to the position
   */

  return new Position(this.x + x, this.y + y, this.z + z);

}

Position.prototype.add = function(position) {

  /*
   * Function Position.add
   * Adds two position vectors to one another
   */

  return new Position(this.x + position.x, this.y + position.y, this.z + position.z);

}

Position.prototype.getNESW = function() {

  /*
   * Function Position.getNESW
   * Returns the north east south and west positions
   */

  return new Array(
    this.north(),
    this.east(),
    this.south(),
    this.west()
  );

}

Position.prototype.subtract = function(position) {

  /*
   * Function Position.subtract
   * Subtracts one position vector from another
   */

  return new Position(this.x - position.x, this.y - position.y, this.z - position.z);

}

Position.prototype.getPositionFromDirection = function(direction) {

  /*
   * Function Position.getPositionFromDirection
   * Returns the position based on the passed direction
   */

  switch(direction) { 
    case CONST.DIRECTION.NORTH: return this.north();
    case CONST.DIRECTION.EAST: return this.east();
    case CONST.DIRECTION.SOUTH: return this.south();
    case CONST.DIRECTION.WEST: return this.west();
    case CONST.DIRECTION.NORTHWEST: return this.northwest();
    case CONST.DIRECTION.NORTHEAST: return this.northeast();
    case CONST.DIRECTION.SOUTHEAST: return this.southeast();
    case CONST.DIRECTION.SOUTHWEST: return this.southwest();
    default: return null;
  }

}

Position.prototype.getFacingDirection = function(position) {

  /*
   * Function Position.getFacingDirection
   * Returns the face direction to another position based on the angle
   */

  return Geometry.prototype.getAngleBetween(this, position);

}

Position.prototype.west = function() {

  /*
   * Function Position.west
   * Returns position west of this position
   */

  return new Position(this.x - 1, this.y, this.z);

}

Position.prototype.north = function() {

  /*
   * Function Position.north
   * Returns position north of this position
   */

  return new Position(this.x, this.y - 1, this.z);

}

Position.prototype.east = function() {

  /*
   * Function Position.east
   * Returns position east of this position
   */

  return new Position(this.x + 1, this.y, this.z);

}

Position.prototype.south = function() {

  /*
   * Function Position.south
   * Returns position south of this position
   */

  return new Position(this.x, this.y + 1, this.z);

}

Position.prototype.up = function() {

  /*
   * Function Position.up
   * Returns up position
   */

  return new Position(this.x, this.y, this.z + 1);

}

Position.prototype.down = function() {

  /*
   * Function Position.down
   * Returns the downward position
   */

  return new Position(this.x, this.y, this.z - 1);

}

Position.prototype.northwest = function() {

  /*
   * Function Position.northwest
   * Returns northwest position
   */

  return new Position(this.x - 1, this.y - 1, this.z);

}

Position.prototype.northeast = function() {

  /*
   * Function Position.northeast
   * Returns northeast position
   */

  return new Position(this.x + 1, this.y - 1, this.z);

}

Position.prototype.southeast = function() {

  /*
   * Function Position.southeast
   * Returns southeast position
   */

  return new Position(this.x + 1, this.y + 1, this.z);

}

Position.prototype.southwest = function() {

  /*
   * Function Position.southwest
   * Returns southwest position
   */

  return new Position(this.x - 1, this.y + 1, this.z);

}

Position.prototype.ladderNorth = function() {

  /*
   * Function Position.ladderNorth
   * Returns the position taking a ladder and north
   */

  return new Position(this.x, this.y - 1, this.z + 1);

}

Position.prototype.ladder = function() {

  /*
   * Function Position.ladder
   * Returns the position after clicking a ladder which is up and south
   */

  return new Position(this.x, this.y + 1, this.z + 1);

}

Position.prototype.random = function() {

  /*
   * Function Position.random
   * Returns a random NESW position around the current position
   */

  // Draw a random sample
  switch(Number.prototype.random(0, 3)) {
    case 0: return this.north();
    case 1: return this.east();
    case 2: return this.south();
    case 3: return this.west();
  }

}

Position.prototype.isDiagonal = function(position) {

  /*
   * Function Position.isDiagonal
   * Returns true when a position is diagonal to another position
   */

  return (Math.abs(this.x - position.x) & Math.abs(this.y - position.y)) === 1;

}

Position.prototype.toJSON = function() {

  /*
   * Function Position.toJSON
   * Serializes the position as a buffer and implements the JSON Stringify interface
   */

  return new Object({
    "x": this.x,
    "y": this.y,
    "z": this.z
  });

}

Position.prototype.manhattanDistance = function(position) {

  /*
   * Function Position.manhattanDistance
   * Returns the Manhattan distance between two positions
   */

  return Math.abs(this.x - position.x) + Math.abs(this.y - position.y);

}

Position.prototype.pythagoreanDistance = function(position) {

  /*
   * Function Position.pythagoreanDistance
   * Returns the 2D Pythagorean distance between two positions (ceiled)
   */

  return Math.ceil(Math.sqrt(Math.pow((this.x - position.x), 2) + Math.pow((this.y - position.y), 2)));

}

Position.prototype.isWithinRangeOf = function(position, range) {

  /*
   * Function Position.isWithinRangeOf
   * Returns true if the other passed position is within a certain range
   */

  if(this.z !== position.z) {
    return false;
  }

  // Pythagorean distance
  return this.pythagoreanDistance(position) < range;

}

Position.prototype.besides = function(position) {

  /*
   * Function WorldPosition.besides
   * Returns true if one position is besides another position
   */

  // Never besides
  if(this.z !== position.z) {
    return false;
  }

  // The same tile equals true
  if(this.equals(position)) {
    return true;
  }

  // Otherwise a difference of one means besides
  return Math.max(Math.abs(this.x - position.x), Math.abs(this.y - position.y)) === 1;

}

Position.prototype.isVisible = function(position, x, y) {

  /*
   * Function Position.isVisible
   * Returns true whether the position can be seen within the range
   */

  return (Math.abs(this.x - position.x) < x) && (Math.abs(this.y - position.y) < y);

}

Position.prototype.rotate2D = function(direction, x, y) {

  /*
   * Function Position.__getSpellPosition
   * Rotates a relative 2D position around 90-degrees (positions are defined with character facing NORTH)
   */

  return Geometry.prototype.rotate2D(this, direction, x, y);

}

module.exports = Position;
