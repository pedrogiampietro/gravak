"use strict";

const LootEntry = requireModule("monster-loot-entry");

const LootHandler = function(loot) {

  /*
   * Class LootHandler
   * Handler for loot for monsters
   */

  // Create instances of loot
  this.loots = loot.map(x => new LootEntry(x));

}

LootHandler.prototype.addLoot = function(corpse) {

  /*
   * Function LootHandler.addLoot
   * Adds loot to the corpse container
   */

  // Invalid: too much loot for the container size..
  if(this.loots.length > corpse.getSize()) {
    return console.warn("Corpse loot exceeds the corpse size");
  }

  // Add each entry in the loot table
  this.loots.forEach(function(loot) {

    // Check the probability
    if(!loot.roll()) {
      return;
    }

    // Create the thing
    let item = gameServer.database.createThing(loot.getId());

    // Cannot be picked up
    if(!item.isPickupable()) {
      return;
    }

    // Set the random between minimum and maximum
    if(loot.hasCount() && item.isStackable()) {
      item.setCount(loot.rollCount());
    }

    // Push the loot to the container
    corpse.addFirstEmpty(item);

  });

}

module.exports = LootHandler;
