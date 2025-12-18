"use strict";

const Event = function(callback, tick) {

  /*
   * Class Event
   * Container for events that fire a callback at a given frame
   *
   * API:
   * Event.isCancelled() - Returns true if the event was cancelled using cancel()
   * Event.getScore() - Returns the score of the event to be sorted in the min-heap
   * Event.cancel() - Cancels the event from execution 
   * Event.remove() - Removes the event from the min-heap
   *
   */

  // The callback to be executed when the event fires
  this.callback = callback;

  // State parameters of the event
  this.__cancelled = false;
  this.__f = tick;

}

Event.prototype.isCancelled = function() {

  /*
   * Function Event.isCancelled
   * Returns true if the event was cancelled
   */

  // If the event was cancelled and needs not to be executed anymore: cheaper than removing
  return this.__cancelled;

}

Event.prototype.remove = function() {

  /*
   * Function Event.remove
   * Function to remove an event from the event queue
   */

  gameServer.world.eventQueue.remove(this);

}

Event.prototype.getScore = function() {

  /*
   * Function Event.getScore
   * Returns the score of the event for scheduling
   */

  return this.__f;

}

Event.prototype.cancel = function() {

  /*
   * Function Event.cancel
   * Cancels a scheduled event so that it is no longer executed
   */

  // Set to cancelled
  this.__cancelled = true;

  // Overwrite the callback to clear up any references to creatures
  this.callback = null;

}

Event.prototype.remainingFrames = function() {

  /*
   * Function Event.remainingFrames
   * Returns the number of frames remaining before the event is scheduled
   */

  return this.getScore() - gameServer.gameLoop.getCurrentFrame();

}

module.exports = Event;
