"use strict";

const Enum = function() {

  /*
   * Class Enum
   * Generates an enum by returning an object with symbols
   */

  // Maximum number of bits
  if(arguments.length > 31) {
    throw new Error("Cannot create enum with more than 31 values.")
  }

  // Another bit per item
  Array.from(arguments).forEach((x, i) => this[x] = 1 << i);

}

module.exports = Enum;
