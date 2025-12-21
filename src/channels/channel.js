"use strict";

const Channel = function(id, name) {

  /*
   * Class Channel
   * Base for classes that implement channels (e.g., default or global channels)
   * Classes that inherit from channel should implement the send() API
   *
   * API:
   *
   * Channel.equals(id) - returns true if the channel has the passed identifier
   *
   */

  // Each channel has a readable name and identifier
  this.id = id;
  this.name = name;

}

Channel.prototype.equals = function(id) {

  /*
   * Function Channel.equals
   * Returns if this is the channel with identifier id
   */

  return this.id === id;

}

// Default no-op
Channel.prototype.send = Function.prototype;

module.exports = Channel;
