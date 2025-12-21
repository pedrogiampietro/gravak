"use strict";

const LootEntry = function(loot) {

  /*
   * Class LootEntry
   * Wrapper for a single loot entry
   */

  this.id = loot.id;
  this.probability = loot.probability;
  this.min = loot.min;
  this.max = loot.max;

}

LootEntry.prototype.getId = function() {

  return this.id;

}

LootEntry.prototype.roll = function() {

  /*
   * Function LootEntry.roll
   * Rolls whether a loot item should be added to the creature
   */

  return Math.random() <= this.probability;

}

LootEntry.prototype.rollCount = function() {

  /*
   * Function LootEntry.rollCount
   * Roll for a random count for stackable items bounded by min/max
   */

  return Number.prototype.random(this.min, this.max);

}

LootEntry.prototype.hasCount = function() {

  /*
   * Function LootEntry.hasCount
   * Returns true if the count should be set on the item
   */

  return this.min >= 1 && this.max >= 2;

}

module.exports = LootEntry;
