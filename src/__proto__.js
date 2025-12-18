"use strict";

Array.prototype.random = function() {

  /*
   * Function Array.random
   * Returns a random element from the array
   */

  // No elements
  if(this.length === 0) {
    return null;
  }

  // One element
  if(this.length === 1) {
    return this[0];
  }

  // Random element
  return this[Math.floor(this.length * Math.random())];

}

Number.prototype.randomExp = function(min, max, lambda) {

  /*
   * Function Number.randomExp
   * Returns a random non-uniform between min, max depending on the value lambda (1 uniform) (< 1 bias towards high) (> 1 bias towards low)
   */

  return Math.floor(Math.pow(Math.random(), lambda) * (max - min + 1)) + min;

}

Array.prototype.popRandom = function() {

  /*
   * Function Array.popRandom
   * Pops a random element from the array
   */

  // Not possible
  if(this.length === 0) {
    return null;
  }

  return this.splice(Number.prototype.random(0, this.length - 1), 1).pop();

}

Number.prototype.random = function(min, max) {

  /*
   * Function Number.random
   * Returns a random number between min and max (both inclusive)
   */

  return Math.floor(Math.random() * (max - min + 1)) + min;

}

Number.prototype.clamp = function(min, max) {

  /*
   * Function Number.clamp
   * Returns a random number between min and max (both inclusive)
   */

  return Math.min(Math.max(min, this), max);

}

Number.prototype.isValidBitFlag = function() {

  /*
   * Function Array.isValidBitFlag
   * Returns true if the given number if a valid bit flag (power of 2)
   */

  return this !== 0 && (this & (this - 1)) === 0;

}

Array.prototype.nullfilter = function() {

  /*
   * Function Array.nullfilter
   * Applies the array filter operation and eliminates elements that are null
   */

  return this.filter(x => x !== null);

}

String.prototype.capitalize = function() {

  /*
   * Function String.capitalize
   * Capitalizes a string
   */

  let thing = this.toLowerCase();

  return thing.charAt(0).toUpperCase() + thing.slice(1);

}

Array.prototype.head = function() {

  /*
   * Function Array.head
   * Returns a reference to the first element in an array
   */

  if(this.length === 0) {
    return null;
  }

  // First element
  return this[0];

}

Array.prototype.last = function() {

  /*
   * Function Array.last
   * Returns a reference to the last element in an array
   */

  if(this.length === 0) {
    return null;
  }

  return this[this.length - 1];

}

String.prototype.format = function() {

  /*
   * Function String.format
   * Formats a string with interpolation of %s
   */

  let string = this;

  Array.from(arguments).forEach(argument => string = string.replace("%s", argument));

  return string;

}

Array.prototype.range = function(min, max) {

  /*
   * Array.range
   * Returns a range of integers from min to max (both inclusive)
   */

  return Array(max - min + 1).fill(0).map((x, i) => min + i);

}

Array.prototype.getClosestDown = function(element) {

  /*
   * Array.getClosestDown
   * Returns the closest number in an array rounded down
   */

  let low = 0;
  let high = this.length - 1;

  while(low <= high) {

    let i = (low + ((high - low) >> 1));

    if(this[i] == element) {
      return i + 1;
    }

    if(this[i] > element)  {
      high = i - 1;
    } else {
      low = i + 1;
    }

  }

  return low;

}

Set.prototype.toJSON = function() {

  /*
   * Set.toJSON
   * Implements serialization for sets
   */

  return Array.from(this);

}

String.prototype.escapeHTML = function() {

  /*
   * Function String.escapeHTML
   * Escapes unsafe HTML characters to prevent XSS attacks
   */

  return this.replaceAll("&", "&amp;")
             .replaceAll("<", "&lt;")
             .replaceAll(">", "&gt;")
             .replaceAll("'", "&apos;")
             .replaceAll('"', "&quot;");

}

Uint8Array.prototype.getEncodedLength = function() {

  /*
   * Function Uint8Array.getEncodedLength
   * Returns buffer length plus 2-byte prefix of its length
   */

  return 2 + this.length;

}
