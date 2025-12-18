"use strict";

const Actions = requireModule("actions");
const Item = requireModule("item");
const Position = requireModule("position");
const Pathfinder = requireModule("pathfinder");
const SceneAction = requireModule("npc-scene-action");

const CutsceneHandler = function(npc) {

  /*
   * Class CutsceneHandler
   *
   * Manager for NPC scenes that follow particular instructions. E.g., this class handles scene configuration
   * that allows NPC characters to play in pre-defined cutscenes
   *
   * Public API:
   *
   * @CutsceneHandler.setScene(scene) - sets scene with the passed scene object
   * @CutsceneHandler.isInScene() - returns true if the NPC is currently in a scene
   * @CutsceneHandler.think() - function called every tick if the NPC is explicitly active
   * @CutsceneHandler.abort() - call to abort the currently running scene
   *
   */

  // Reference the parent NPC
  this.npc = npc;

  this.actions = new Actions();
  this.actions.add(this.__handleScene);

  // Parameters for playing scenes
  this.__currentSceneAction = null;
  this.__scheduledActions = new Array();
  this.__sceneTimeout = 0;

}

CutsceneHandler.prototype.isInScene = function() {

  /*
   * Function CutsceneHandler.isInScene
   * Returns whether the NPC is occupied in a scene
   */

  // Either in a current action or has remaining actions
  return this.__currentSceneAction !== null;

}

CutsceneHandler.prototype.think = function() {

  /*
   * Function CutsceneHandler.think
   * Schedules the next action
   */

  // Block
  if(!this.isInScene()) {
    return;
  }

  this.actions.handleActions(this);

}

CutsceneHandler.prototype.setScene = function(scene) {

  /*
   * Function CutsceneHandler.setScene
   * Sets the NPC state to that of the scene identified by an index
   */

  // Set up the scheduled actions (copy them)
  this.__scheduledActions = scene.actions.map(x => new SceneAction(x));
  this.__currentSceneAction = this.__scheduledActions.shift();

  // Creatures in a scene must be explicitly active even when they are in a sector alone
  gameServer.world.creatureHandler.sceneNPCs.add(this.npc);

}

CutsceneHandler.prototype.abort = function() {

  /*
   * Function CutsceneHandler.abort
   * Aborts the currently running scene because the timeout has been exceeded
   */

  // Teleport to the start position
  gameServer.world.teleportCreature(this.npc, this.npc.spawnPosition);
  gameServer.world.sendMagicEffect(this.npc.spawnPosition, CONST.EFFECT.MAGIC.TELEPORT);

  // Reset the scene handler
  this.__reset()

}

CutsceneHandler.prototype.__hasRemainingActions = function() {

  /*
   * Function CutsceneHandler.__hasRemainingActions
   * Returns true if the handler has scheduled actions queued
   */

  return this.__scheduledActions.length > 0;

}

CutsceneHandler.prototype.__reset = function() {

  /*
   * Function CutsceneHandler.__reset
   * Resets the state of the handler
   */

  // Reset actions
  this.__sceneTimeout = 0;
  this.__currentSceneAction = null;
  this.__scheduledActions = new Array();

  // Free the NPC
  gameServer.world.creatureHandler.sceneNPCs.delete(this.npc);

  this.npc.pauseActions(50);

}

CutsceneHandler.prototype.__completeAction = function() {

  /*
   * Function CutsceneHandler.__completeAction
   * Completes the current action
   */

  // The NPC is still in a scene
  if(this.__hasRemainingActions()) {
    return this.__currentSceneAction = this.__scheduledActions.shift();
  }

  // Otherwise reset the state: NPC scene is completed
  this.__reset()

}

CutsceneHandler.prototype.__isTimedOut = function(action) {

  /*
   * Function CutsceneHandler.__isTimedOut
   * Returns true if the NPC action timed out
   */

  return this.__sceneTimeout++ > action.timeout;

}

CutsceneHandler.prototype.__addItemAction = function(action) {

  /*
   * Function CutsceneHandler.__addItemAction
   * Handles the item add action of a NPC in a scene
   */

  // Get the tile and the thing
  let tile = process.gameServer.world.getTileFromWorldPosition(action.position);

  if(tile === null) {
    return;
  }

  let thing = process.gameServer.database.createThing(action.item).setCount(action.count);

  if(action.actionId) {
    thing.setActionId(action.actionId);
  }

  tile.addTopThing(thing);

}

CutsceneHandler.prototype.__moveAction = function(action) {

  /*
   * Function CutsceneHandler.__moveAction
   * Handles the move action of the NPC
   */

  // We have made our target destination: complete the action!
  if(this.npc.position.equals(action.position)) {
    return this.__completeAction();
  }

  // Do exact pathfinding to the destination tile
  let path = gameServer.world.findPath(
    this.npc,
    this.npc.position,
    action.position,
    Pathfinder.prototype.EXACT
  );

  // The path is not accesible
  if(path.length === 0) {
    return null;
  }

  // Get the next tile
  let nextTile = path.pop();

  gameServer.world.creatureHandler.moveCreature(this.npc, nextTile.position);

  // Lock for the step duration
  this.actions.lock(this.__handleScene, this.npc.getStepDuration(nextTile.getFriction()));

}

CutsceneHandler.prototype.__handleScene = function() {

  /*
   * Function CutsceneHandler.__handleScene
   * Handles an action of the NPC
   */

  let action = this.__currentSceneAction;

  // The timeout was exceeded: abort
  if(this.__isTimedOut(action)) {
    return this.abort();
  }

  // Moving is slightly different because we re-use the same action until the goal is reached
  if(action.type === SceneAction.prototype.ACTIONS.MOVE) {
    return this.__moveAction(action);
  }

  // Lock for the requested number of frames
  this.actions.lock(this.__handleScene, action.duration);

  // Get the type of the scheduled action
  switch(action.type) {
    case SceneAction.prototype.ACTIONS.IDLE: break;
    case SceneAction.prototype.ACTIONS.FUNCTION: action.callback.call(this.npc); break;
    case SceneAction.prototype.ACTIONS.ADD: this.__addItemAction(action); break;
    case SceneAction.prototype.ACTIONS.FACE: this.npc.setDirection(action.direction); break;
    case SceneAction.prototype.ACTIONS.ANCHOR: this.npc.spawnPosition = action.position; break;
    case SceneAction.prototype.ACTIONS.TELEPORT: process.gameServer.world.teleportCreature(this.npc, action.position); break;
    case SceneAction.prototype.ACTIONS.EMOTE: this.npc.sayEmote(action.message, action.color); break;
    case SceneAction.prototype.ACTIONS.TALK: this.npc.internalCreatureSay(action.message); break;
    case SceneAction.prototype.ACTIONS.EFFECT: process.gameServer.world.sendMagicEffect(action.position, action.effect); break;
    default: break;
  }

  this.__completeAction();

}

module.exports = CutsceneHandler;
