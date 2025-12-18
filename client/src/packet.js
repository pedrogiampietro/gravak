"use strict";

const Packet = function() {

  /*
   * Class Packet
   * Container for a packet (writeable or readable)
   */

  this.index = 0;

}

Packet.prototype.advance = function(amount) {

  /*
   * Function Packet.advance 
   * Advanced the packet by a number of bytes
   */

  this.index += amount;

}
