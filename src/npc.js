"use strict";

const Actions = requireModule("actions");
const ConversationHandler = requireModule("npc-conversation-handler");
const Creature = requireModule("creature");
const CutsceneHandler = requireModule("npc-scene-handler");
const NPCBehaviour = requireModule("npc-behaviour-handler");

const NPC = function(data) {

  /*
   * Function NPC
   * Container for non-playable characters that can be interacted with
   *
   * API:
   * 
   * @NPC.isSpeaking() - returns true if the NPC has a focus
   * @NPC.pauseActions(duration) - pauses NPC actions for a given duration
   *
   */

  // A NPC inherits from creature
  Creature.call(this, data.creatureStatistics);

  // Handler for NPC conversations
  this.conversationHandler = new ConversationHandler(this, data.conversation);
  this.behaviourHandler = new NPCBehaviour(this, data.behaviourHandler);
  this.cutsceneHandler = new CutsceneHandler(this);

  // All creatures have action functions that can be added: these are executed whenever available
  this.actions = new Actions();

  // The actions (e.g., wandering and saying)
  this.__registerActions();

}

// Inherit from creature
NPC.prototype = Object.create(Creature.prototype);
NPC.prototype.constructor = NPC;

NPC.prototype.__registerActions = function() {

  /*
   * Function NPC.__registerActions
   * Registers the available actions for the NPC: these are fired whenever available
   */

  // If wandering: we must move
  if(this.behaviourHandler.isWandering()) {
    this.actions.add(this.handleActionWander);
  }

  // If the NPC has sayings
  if(this.conversationHandler.hasSayings()) {
    this.actions.add(this.handleActionSpeak);
  }

}

NPC.prototype.listen = function(player, message) {

  /*
   * Function NPC.listen
   * Listens to incoming messages in the default channel
   */

  // Do not accept anything when acting in a scene
  if(this.cutsceneHandler.isInScene()) {
    return;
  }

  // If in range of the player
  if(!this.isWithinHearingRange(player)) {
    return;
  }

  // Delegate
  this.conversationHandler.handleResponse(player, message);

}

NPC.prototype.isWithinHearingRange = function(creature) {

  /*
   * Function NPC.isWithinHearingRange
   * Faces a particular creature by updating the look direction
   */

  return this.isWithinRangeOf(creature, this.conversationHandler.getHearingRange());

}

NPC.prototype.isInConversation = function() {

  /*
   * Function NPC.isInConversation
   * Returns true if the NPC is currently occupied in a conversation
   */

  return this.conversationHandler.isInConversation();

}

NPC.prototype.isTileOccupied = function(tile) {

  /*
   * Function NPC.isTileOccupied
   * Returns true if the tile is occupied for the NPC
   */

  return this.behaviourHandler.isTileOccupied(tile);

}

NPC.prototype.handleActionWander = function() {

  /*
   * Function NPC.handleActionWander
   * Cooldown function that handles the NPC movement
   */

  // Let the creature decide its next strategic move
  let tile = this.behaviourHandler.getWanderMove();

  // Invalid tile was returned: do nothing (but lock to prevent event spam)
  if(tile === null) {
    return this.actions.lock(this.handleActionWander, this.actions.GLOBAL_COOLDOWN);
  }

  // Delegate to move the creature
  gameServer.world.creatureHandler.moveCreature(this, tile.position);

  // Lock this function
  this.actions.lock(this.handleActionWander, this.behaviourHandler.getStepDuration(tile));

}

NPC.prototype.pauseActions = function(duration) {

  /*
   * Function NPC.pauseActions
   * Briefly pauses NPC actions (e.g., after droppping a converastion or scene)
   */

  this.actions.lock(this.handleActionWander, duration);
  this.actions.lock(this.handleActionSpeak, duration);

}

NPC.prototype.think = function() {

  /*
   * Function NPC.think
   * Called every server frame to handle NPC actions (wandering, talking)
   */

  // Paused because already speaking with a player
  if(this.isInConversation()) {
    return;
  }

  // In a scene
  if(this.cutsceneHandler.isInScene()) {
    return;
  }

  this.actions.handleActions(this);

}

NPC.prototype.handleActionSpeak = function() {

  /*
   * Function NPC.handleActionSpeak
   * Handles speaking action of the NPC
   */

  let sayings = this.conversationHandler.getSayings();

  // Is determined by chance
  if(Math.random() > (1.0 - sayings.chance)) {
    this.speechHandler.internalCreatureSay(sayings.texts.random());
  }

  // Always lock the action
  this.actions.lock(this.handleActionSpeak, sayings.rate);

}

NPC.prototype.setScene = function(scene) {

  /*
   * Function NPC.setScene
   * Sets the NPC state to that of the scene
   */

  // Block is already in a scene
  if(this.cutsceneHandler.isInScene()) {
    this.cutsceneHandler.abort();
  }

  // Scenes makes the NPC drop everything and play the cutscene
  if(this.isInConversation()) {
    this.conversationHandler.abort();
  }

  // Set up the scheduled actions
  this.cutsceneHandler.setScene(scene);

}

module.exports = NPC;
