"use strict";

const GenericLock = requireModule("generic-lock");

const Actions = function() {

  /*
   * Class Actions
   *
   * Wrapper class for possible actions: an entity can have multiple action functions that are executed whenever available.
   *
   * API:
   *
   * Actions.has(action) - returns true if an action is available
   * Actions.add(action) - Adds an action to the action manager that will be executed when available
   * Actions.lock(action) - Locks an action in the action manager
   * Actions.handleActions(scope) - Handles all the available actions with a particular scope (this)
   *
   */

  // The set of allowed actions
  this.__allowedActions = new Set();

  // Set that keeps the actions that are available
  this.__availableActions = new Set();

  // Reference to the locks
  this.__actionsLockMap = new Map();

}

// Global minimum cooldown for all actions
Actions.prototype.GLOBAL_COOLDOWN = Math.floor(CONFIG.WORLD.GLOBAL_COOLDOWN_MS / CONFIG.SERVER.MS_TICK_INTERVAL);

Actions.prototype.forEach = function(callback, scope) {

  /*
   * Function Actions.forEach
   * Applies a callback function to each action
   */

  this.__availableActions.forEach(callback, scope);

}

Actions.prototype.handleActions = function(scope) {

  /*
   * Function Actions.handleActions
   * Executes all available actions in the action manager
   */

  // Call all actions
  this.__availableActions.forEach(action => action.call(scope));

}

Actions.prototype.isAvailable = function(action) {

  /*
   * Function Actions.isAvailable
   * Returns true if the requested action is available
   */

  return this.__availableActions.has(action);

}

Actions.prototype.lock = function(action, until) {

  /*
   * Function Actions.lock
   * Locks an action from the action set by removing it and adding it back after a certain amount of time has passed
   */

  if(!this.__allowedActions.has(action)) {
    return;
  }

  // Does not exist
  if(!this.__availableActions.has(action)) {
    return;
  }

  // Locking for 0 frames is equivalent to not locking: ignore the request
  if(until === 0) {
    return;
  }

  // Deleting means that it has become unavailable
  this.__availableActions.delete(action);

  // Add to the game queue and save a reference to the event in case it must be canceled
  this.__actionsLockMap.get(action).lock(until);

}

Actions.prototype.remove = function(action) {

  /*
   * Function Actions.remove
   * Removes a particular action from the action set
   */

  if(!this.__allowedActions.has(action)) {
    return;
  }

  // Add
  this.__allowedActions.delete(action);

}

Actions.prototype.add = function(action) {

  /*
   * Function Actions.add
   * Adds a particular action to the action set
   */

  if(this.__allowedActions.has(action)) {
    return;
  }

  // Add
  this.__allowedActions.add(action);

  // Create the generic lock
  let lock = new GenericLock();

  // Attach a callback to when this unlocks
  lock.on("unlock", this.__unlock.bind(this, action));

  // Set the action as available by adding it to the set and keep a reference
  this.__actionsLockMap.set(action, lock);
  this.__availableActions.add(action);

}

Actions.prototype.__unlock = function(action) {

  /*
   * Function Actions.__unlock
   * Unlocks an action
   */

  if(!this.__allowedActions.has(action)) {
    return this.__actionsLockMap.delete(action);
  }
 
  this.__availableActions.add(action);

}

Actions.prototype.cleanup = function() {

  /*
   * Function Actions.cleanup
   * Cleans up any remaining actions that are scheduled on the lock
   */

  this.__actionsLockMap.forEach(lock => lock.cancel());
  this.__actionsLockMap = new Map();
  this.__availableActions = new Set();

}

module.exports = Actions;
