"use strict";

const Condition = function(id, ticks, duration) {

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

Condition.prototype.isPermanent = function() {

  /*
   * Function Condition.isPermanent
   * Returns true if the condition is considered permanent
   */

  return this.numberTicks === -1;

}

Condition.prototype.isLastTick = function() {

  /*
   * Function Condition.isLastTick
   * Returns true if the tick is the last one
   */

  return this.numberTicks === 0;

}

Condition.prototype.getTotalDuration = function() {

  /*
   * Function Condition.getTotalDuration
   * Returns true if the tick is the last one
   */

  return this.maxNumberTicks * this.tickDuration;

}

Condition.prototype.getRemainigDuration = function() {

  /*
   * Function Condition.getRemainigDuration
   * Returns true if the tick is the last one
   */

  return this.numberTicks * this.tickDuration;

}

Condition.prototype.isFirstTick = function() {

  /*
   * Function Condition.isFirstTick
   * Returns true if the tick is the first one
   */

  return this.numberTicks === this.maxNumberTicks;

}

Condition.prototype.getFraction = function() {

  /*
   * Function Condition.getFraction
   * Returns the fraction of completeness for the condition
   */

  return (this.numberTicks / this.maxNumberTicks);

}

Condition.prototype.cancel = function() {

  /*
   * Function Condition.cancel
   * Cancels the condition by cancelling the scheduled tick event
   */

  if(this.__applyEvent === null) {
    return;
  }

  this.__applyEvent.cancel();

}

module.exports = Condition;
