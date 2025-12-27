"use strict";

const Condition = function (id, ticks, duration) {

  /*
   * Class Condition
   * Wrapper for a condition fired in intervals (e.g., damage over time or drunkness)
   */

  this.id = Number(id);

  // Condition state
  this.numberTicks = ticks;
  this.maxNumberTicks = ticks;
  this.tickDuration = duration;

  this.__applyEvent = null;

}

Condition.prototype.isPermanent = function () {

  /*
   * Function Condition.isPermanent
   * Returns true if the condition is considered permanent
   */

  return this.numberTicks === -1;

}

Condition.prototype.isLastTick = function () {

  /*
   * Function Condition.isLastTick
   * Returns true if the tick is the last one
   */

  return this.numberTicks === 0;

}

Condition.prototype.getTotalDuration = function () {

  /*
   * Function Condition.getTotalDuration
   * Returns true if the tick is the last one
   */

  return this.maxNumberTicks * this.tickDuration;

}

Condition.prototype.getRemainigDuration = function () {

  /*
   * Function Condition.getRemainigDuration
   * Returns true if the tick is the last one
   */

  return this.numberTicks * this.tickDuration;

}

Condition.prototype.isFirstTick = function () {

  /*
   * Function Condition.isFirstTick
   * Returns true if the tick is the first one
   */

  return this.numberTicks === this.maxNumberTicks;

}

Condition.prototype.getFraction = function () {

  /*
   * Function Condition.getFraction
   * Returns the fraction of completeness for the condition
   */

  return (this.numberTicks / this.maxNumberTicks);

}

Condition.prototype.cancel = function () {

  /*
   * Function Condition.cancel
   * Cancels the condition by cancelling the scheduled tick event
   */

  if (this.__applyEvent === null) {
    return;
  }

  this.__applyEvent.cancel();

}

Condition.prototype.DRUNK = 0;
Condition.prototype.POISONED = 1;
Condition.prototype.BURNING = 2;
Condition.prototype.ELECTRIFIED = 3;
Condition.prototype.INVISIBLE = 4;
Condition.prototype.PROTECTION_ZONE = 5;
Condition.prototype.SUPPRESS_DRUNK = 6;
Condition.prototype.LIGHT = 7;
Condition.prototype.HEALING = 8;
Condition.prototype.REGENERATION = 9;
Condition.prototype.MORPH = 10;
Condition.prototype.MAGIC_SHIELD = 11;
Condition.prototype.MAGIC_FLAME = 12;
Condition.prototype.SATED = 13;
Condition.prototype.HASTE = 14;
Condition.prototype.ARENA = 15;

module.exports = Condition;
