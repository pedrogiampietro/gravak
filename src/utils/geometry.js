"use strict";

const Geometry = function () {

  /*
   * Class Geometry
   * Wrapper for some geometical functions
   */

}

Geometry.prototype.getSquare = function (position, size) {

  /*
   * Function Geometry.getSquare
   * Returns an array of positions with size R around a given position
   */

  let positions = new Array();

  for (let x = -size; x <= size; x++) {
    for (let y = -size; y <= size; y++) {
      positions.push(position.addVector(x, y, 0));
    }
  }

  return positions;

}

Geometry.prototype.getRadius = function (position, radius) {

  /*
   * Function Geometry.getRadius
   * Returns an array of positions with radius R around a given position
   */

  let positions = new Array();

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {

      // Only include what is inside the circle
      if ((x * x + y * y) > (radius * radius)) {
        continue;
      }

      positions.push(position.addVector(x, y, 0));

    }
  }

  return positions;

}

Geometry.prototype.getAngleBetween = function (one, two) {

  /*
   * Function Geometry.getAngleBetween
   * Returns the facing direction between two positions
   */

  // Calculate the angle between the positions
  let angle = Math.atan2(one.y - two.y, one.x - two.x) / Math.PI;

  // Determine the quadrant and thus the look direction
  if (angle >= -0.75 && angle < -0.25) {
    return CONST.DIRECTION.SOUTH;
  } else if (angle >= -0.25 && angle < 0.25) {
    return CONST.DIRECTION.WEST;
  } else if (angle >= 0.25 && angle < 0.75) {
    return CONST.DIRECTION.NORTH;
  } else {
    return CONST.DIRECTION.EAST;
  }

}

Geometry.prototype.rotate2D = function (position, direction, x, y) {

  /*
   * Function Geometry.rotate2D
   * Rotates a vector in 2-dimensions (90 deg. increments)
   */

  // 2D rotation around 90 degrees
  switch (direction) {
    case CONST.DIRECTION.NORTH: return position.addVector(x, y, 0);
    case CONST.DIRECTION.EAST: return position.addVector(-y, -x, 0);
    case CONST.DIRECTION.SOUTH: return position.addVector(x, -y, 0);
    case CONST.DIRECTION.WEST: return position.addVector(y, -x, 0);
  }

  return position;

}

Geometry.prototype.getWave = function (position, direction, length, spread) {

  /*
   * Function Geometry.getWave
   * Returns an array of positions forming a wave/cone pattern in the given direction
   * 
   * @param position - Origin position (monster's position)
   * @param direction - Direction the monster is facing (NORTH, SOUTH, EAST, WEST)
   * @param length - How many tiles forward the wave extends
   * @param spread - Maximum width of the wave at its end
   * 
   * The wave starts narrow and expands outward in a cone shape
   */

  let positions = new Array();

  // Generate the wave pattern row by row
  for (let row = 1; row <= length; row++) {
    // Calculate width at this row (starts at 1, expands to spread)
    let widthAtRow = Math.ceil((row / length) * spread);
    let halfWidth = Math.floor(widthAtRow / 2);

    // Generate positions for this row
    for (let col = -halfWidth; col <= halfWidth; col++) {
      let relativePos;

      // Calculate position based on direction
      switch (direction) {
        case CONST.DIRECTION.NORTH:
          relativePos = position.addVector(col, -row, 0);
          break;
        case CONST.DIRECTION.SOUTH:
          relativePos = position.addVector(col, row, 0);
          break;
        case CONST.DIRECTION.EAST:
          relativePos = position.addVector(row, col, 0);
          break;
        case CONST.DIRECTION.WEST:
          relativePos = position.addVector(-row, col, 0);
          break;
        default:
          continue;
      }

      positions.push(relativePos);
    }
  }

  return positions;

}

Geometry.prototype.interpolate = function (source, target) {

  /*
   * Function Geometry.interpolate
   * Interpolates all tiles between the source and target
   */

  // Linear interpolate between the coordinates
  let xLerp = target.x - source.x;
  let yLerp = target.y - source.y;

  // Determine the number of interpolation steps to make
  let steps = Math.max(Math.abs(xLerp), Math.abs(yLerp)) + 1;
  let positions = new Array();

  // Linear interpolation
  for (let i = 0; i < steps; i++) {

    let fraction = i / (steps - 1);
    let x = Math.round(fraction * xLerp);
    let y = Math.round(fraction * yLerp);

    // Add tile to be checked
    positions.push(source.addVector(x, y, 0));

  }

  return positions;

}

module.exports = Geometry;
