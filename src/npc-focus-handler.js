"use strict";

const EventEmitter = require("./eventemitter");
const GenericLock = requireModule("generic-lock");
const TalkStateHandler = requireModule("npc-talk-state-handler");

const FocusHandler = function(conversationHandler) {

  /*
   * Class FocusHandler
   * Code to handle the focus of NPC on the player
   *
   * Public API:
   *
   * @FocusHandler.extendFocus(frames) - extends the NPC idle event by a number of frames
   * @FocusHandler.setFocus(player) - sets a new focus
   * @FocusHandler.getTalkStateHandler() - returns the talk state handler class
   * @FocusHandler.reset() - reset the focus of the NPC to nothing
   * @FocusHandler.isInConversation() - returns true if the NPC is in a conversation with a player
   * @FocusHandler.getFocus() - returns the current focus of the NPC
   *
   */

  EventEmitter.call(this);

  // Save reference to the parent
  this.conversationHandler = conversationHandler;

  // The handler for the NPC talk state (e.g., multiple yes, no questions)
  this.__talkStateHandler = new TalkStateHandler(conversationHandler);

  // The focus player of the conversation
  this.__conversationFocus = null;

  // NPC idle event triggered when the player is idle
  this.__conversationFocusIdleEvent = new GenericLock();
  this.__conversationFocusIdleEvent.on("unlock", this.emit.bind(this, "focusIdle"));

  // Player events
  this.__conversationFocusMovementEvent = null;
  this.__conversationFocusLogoutEvent = null;

}

// Set the prototype and constructor
FocusHandler.prototype = Object.create(EventEmitter.prototype);
FocusHandler.prototype.constructor = FocusHandler;

FocusHandler.prototype.IDLE_TIMEOUT_FRAMES = 250;

FocusHandler.prototype.extendFocus = function(duration) {

  /*
   * Function FocusHandler.extendFocus
   * Extend the focus of the NPC by a given or default amount
   */

  if(!this.isInConversation()) {
    return;
  }

  // Extend the idle event
  this.__conversationFocusIdleEvent.lock(Math.max(this.IDLE_TIMEOUT_FRAMES, duration));

}

FocusHandler.prototype.setFocus = function(player) {

  /*
   * Function FocusHandler.setFocus
   * Sets the focus of a NPC to the player
   */

  if(this.isInConversation()) {
    return;
  }

  // Reference the player
  this.__conversationFocus = player;

  // Subscribe to player movement and logout events
  this.__conversationFocusMovementEvent = player.on("move", this.emit.bind(this, "focusMove"))
  this.__conversationFocusLogoutEvent = player.on("logout", this.emit.bind(this, "focusLogout"));

  // Set up an idle event
  this.extendFocus(this.IDLE_TIMEOUT_FRAMES);

}

FocusHandler.prototype.getTalkStateHandler = function() {

  /*
   * Function FocusHandler.getTalkStateHandler
   * Returns the talk state handler
   */

  return this.__talkStateHandler;

}

FocusHandler.prototype.reset = function() {

  /*
   * Function FocusHandler.reset
   * Resets the focus of the NPC and cleans up remaining events
   */

  // Has no focus
  if(!this.isInConversation()) {
    return;
  }

  // Cancel remaining idle events
  this.__conversationFocusIdleEvent.cancel();

  // Clean up the focus functions
  this.__conversationFocus.off("logout", this.__conversationFocusLogoutEvent);
  this.__conversationFocus.off("move", this.__conversationFocusMovementEvent);

  this.__conversationFocus = null;
  this.__conversationFocusLogoutEvent = null;
  this.__conversationFocusMovementEvent = null;

  // Reset the NPC to the base state variable
  this.__talkStateHandler.reset();

}

FocusHandler.prototype.getFocus = function() {

  /*
   * Function ConversationHandler.getFocus
   * Returns the current focus of the NPC
   */

  return this.__conversationFocus;

}

FocusHandler.prototype.isInConversation = function(player) {

  /*
   * Function ConversationHandler.isInConversation
   * Returns true if the NPC is focused and speaking to a player
   */

  let focus = this.getFocus();

  // No parameter passed: check if in any conversation
  if(player === undefined) {
    return focus !== null;
  }

  // Check if in conversation with the passed player
  return focus === player;

}


module.exports = FocusHandler;
