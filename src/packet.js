"use strict";

const Packet = function() {

  /*
   * Class Packet
   * Parent class of a readable and writeable binary packets
   *
   * API:
   * 
   * Packet.advance(amount) - advances the packet by a given number of bytes
   * 
   */

  this.index = 0;

}

Packet.prototype.advance = function(amount) {

  /*
   * Function Packet.advance
   * Advances the index of the packet
   */

  this.index += amount;

}

module.exports = Packet;
