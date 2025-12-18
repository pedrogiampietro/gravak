"use strict";

const Item = requireModule("item");

const Teleporter = function(id) {

  /*
   * Class Teleporter
   * Wrapper for an item that teleports the player to another location
   */

  Item.call(this, id);

}

Teleporter.prototype = Object.create(Item.prototype);
Teleporter.prototype.constructor = Teleporter;

Teleporter.prototype.setDestination = function(destination) {

  /*
   * Function Teleporter.setDestination
   * Wrapper for an item that teleports players and items to another location
   */

  this.destination = destination;

}

module.exports = Teleporter;
