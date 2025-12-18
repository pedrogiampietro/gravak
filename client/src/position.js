const Position = function(x, y, z) {

  /*
   * Class Position
   * Wrapper for a generic 3D vector that represents a position or coordinates
   *
   * API:
   *
   * subtract(position) - subtracts the passed position from the current position
   * add(position) - adds the passed position to the current position
   * besides(position) - returns true if the passed position is besides (or equal to) the current position
   *
   *
   */

  this.x = x;
  this.y = y;
  this.z = z;

}

Position.prototype.NULL = new Position(0, 0, 0);

Position.prototype.subtract = function(position) {

  /*
   * Function Position.subtract
   * Subtracts a position vector from this vector
   */

  return new this.constructor(
    this.x - position.x,
    this.y - position.y,
    this.z - position.z
  );

}

Position.prototype.add = function(position) {

  /*
   * Function Position.add
   * Adds a position vector to this vector
   */

  return new this.constructor(
    this.x + position.x,
    this.y + position.y,
    this.z + position.z
  );

}

Position.prototype.above = function() {

  /*
   * Function Position.above
   * Returns the position above the current position vector
   */

  return new this.constructor(
    this.x,
    this.y,
    this.z + 1
  );

}

Position.prototype.unprojected = function() {

  /*
   * Function Position.unprojected
   * Unprojects the current chunk position to 3D space
   */

  // Bind to sector height
  let z = this.z % 8;

  return new this.constructor(
    this.x + z,
    this.y + z,
    z
  );

}

Position.prototype.projected = function() {

  /*
   * Function Position.projected
   * Projects the current world position on a flat surface
   */

  // Bind to sector height
  let z = this.z % 8;

  return new this.constructor(
    this.x - z,
    this.y - z,
    z
  );

}

Position.prototype.fromOpcode = function(opcode) {

  /*
   * Function Position.fromOpcode
   * Maps the byte opcode to a direction
   */

  switch(opcode) {
    case CONST.DIRECTION.NORTH:
      return this.north();
    case CONST.DIRECTION.EAST:
      return this.east();
    case CONST.DIRECTION.SOUTH:
      return this.south();
    case CONST.DIRECTION.WEST:
      return this.west();
    case CONST.DIRECTION.NORTH_EAST:
      return this.northeast();
    case CONST.DIRECTION.SOUTH_EAST:
      return this.southeast();
    case CONST.DIRECTION.SOUTH_WEST:
      return this.southwest();
    case CONST.DIRECTION.NORTH_WEST:
      return this.northwest();
  }

}

Position.prototype.copy = function() {

  /*
   * Function Position.copy
   * Makes a memory copy of the position
   */

  return new Position(this.x, this.y, this.z);

}

Position.prototype.west = function() {

  /*
   * Function Position.west
   * Returns the position currently west of the current position
   */

  return new this.constructor(this.x - 1, this.y, this.z);

}

Position.prototype.north = function() {

  /*
   * Function Position.north
   * Returns the position currently north of the current position
   */

  return new this.constructor(this.x, this.y - 1, this.z);

}

Position.prototype.east = function() {

  /*
   * Function Position.east
   * Returns the position currently east of the current position
   */

  return new this.constructor(this.x + 1, this.y, this.z);

}

Position.prototype.south = function() {

  /*
   * Function Position.south
   * Returns the position currently south of the current position
   */

  return new this.constructor(this.x, this.y + 1, this.z);

}

Position.prototype.northwest = function() {

  /*
   * Function Position.northwest
   * Returns the position north west the current position
   */

  return new this.constructor(this.x - 1, this.y - 1, this.z);

}

Position.prototype.northeast = function() {

  /*
   * Function Position.northeast
   * Returns the position north east of the current position
   */

  return new this.constructor(this.x + 1, this.y - 1, this.z);

}

Position.prototype.southeast = function() {

  /*
   * Function Position.southeast
   * Returns the position south east of the current position
   */

  return new this.constructor(this.x + 1, this.y + 1, this.z);

}

Position.prototype.southwest = function() {

  /*
   * Function Position.southeast
   * Returns the position south west of the current position
   */

  return new this.constructor(this.x - 1, this.y + 1, this.z);

}

Position.prototype.up = function() {

  /*
   * Function Position.up
   * Returns the position above the current position
   */

  return new this.constructor(this.x, this.y, this.z + 1);

}

Position.prototype.down = function() {

  /*
   * Function Position.down
   * Returns the position below the current position
   */

  return new this.constructor(this.x, this.y, this.z - 1);

}

Position.prototype.random = function() {

  /*
   * Function Position.random
   * Returns a random position around the current only (NESW)
   */

  let random = Math.floor(Math.random() * Math.floor(4));

  switch(random) {
    case 0:
      return this.west();
    case 1:
      return this.north();
    case 2:
      return this.east();
    case 3:
      return this.south();
  }

}

Position.prototype.getLookDirection = function(position) {
 
  /*
   * Function Position.getLookDirection
   * Returns the look direction towards another direction
   */

  if(this.z !== position.z) {
    return null;
  }

  let diff = position.subtract(this);

  if(diff.x === 0) {
    switch(diff.y) {
      case -1:
        return CONST.DIRECTION.NORTH;
      case 0:
        return null;
      case 1:
        return CONST.DIRECTION.SOUTH;
    }
  }

  if(diff.x === -1) {
    switch(diff.y) {
      case -1:
        return CONST.DIRECTION.NORTH_WEST;
      case 0:
        return CONST.DIRECTION.WEST;
      case 1:
        return CONST.DIRECTION.SOUTH_WEST;
    }
  }

  if(diff.x === 1) {
    switch(diff.y) {
      case -1:
        return CONST.DIRECTION.NORTH_EAST;
      case 0:
        return CONST.DIRECTION.EAST;
      case 1:
        return CONST.DIRECTION.SOUTH_EAST;
    }
  }

  return null;

}

Position.prototype.isDiagonal = function(position) {

  /*
   * Function Position.isDiagonal
   * Returns true when a position is diagonal to another position
   */

  return (Math.abs(this.x - position.x) & Math.abs(this.y - position.y)) === 1;

}

Position.prototype.toString = function() {

  /*
   * Function Position.toString
   * Returns the position as a comma delimited string
   */

  return this.x + ", " + this.y + ", " + this.z;

}

Position.prototype.serialize = function() {

  /*
   * Function Position.serialize
   * Serializes the position as a buffer
   */

  return {
    "x": this.x,
    "y": this.y,
    "z": this.z
  }

}

Position.prototype.equals = function(position) {

  /*
   * Function Position.equals
   * Returns true if two positions are equal
   */

  return this.x === position.x &&
         this.y === position.y &&
         this.z === position.z;

}

Position.prototype.inRange = function(position, range) {

  /*
   * Function Position.inRange
   * Returns true if a position is in range of another position
   */

  // Must be on same floor
  return this.z === position.z &&
         (Math.sqrt(Math.pow((this.x - position.x), 2) + Math.pow((this.y - position.y), 2)) | 0) < range

}

Position.prototype.besides = function(position) {

  /*
   * Function WorldPosition.besides
   * Returns true if position is besides another position
   */

  // Not same floor
  if(this.z !== position.z) {
    return false;
  }

  // Check the difference is one
  return Math.max(Math.abs(this.x - position.x), Math.abs(this.y - position.y)) <= 1;

}
