"use strict";

const EventEmitter = requireModule("eventemitter");
const FocusHandler = requireModule("npc-focus-handler");
const TradingHandler = requireModule("npc-trade-handler");

const ConversationHandler = function(npc, conversation) {

  /*
   * Class ConversationHandler
   * Code that handles NPC interaction with players
   *
   * Public API:
   *
   * @ConversationHandler.getFocus() - return the focus of the conversation
   * @ConversationHandler.respond(message, color) - NPC responds to a query and extend the idle timer
   * @ConversationHandler.say(message, color) - NPC says something without extending the idle timer
   * @ConversationHandler.emote(message, color) - Sends an emote message to the NPC
   * @ConversationHandler.enterAlert(player) - Call to fire the alert event
   * @ConversationHandler.hasSeen(player) - Returns true if the NPC has seen the player
   * @ConversationHandler.isInConversation(player) - returns true if the NPC is in a conversation (with a player)
   * @ConversationHandler.handleResponse(player, keyword) - internal function that handles response for particular keywords
   * @ConversationHandler.getTalkStateHandler() - returns the talk state handler
   * @ConversationHandler.getFocusHandler() - returns the focus handler
   * @ConversationHandler.setBaseState(baseState) - sets the base state in a conversation scripts
   * @ConversationHandler.setTalkState(baseState) - sets a new talk state in the conversation scripts
   * @ConversationHandler.getHearingRange() - returns the hearing range of the NPC conversation handler
   *
   */

  // Inherits for events
  EventEmitter.call(this);

  // Save a reference to the parent NPC class
  this.npc = npc;

  // Weak set of players that have been spotted before (enter events)
  this.__seenCreatures = new WeakSet();

  // Sensible defaults
  this.conversation = new Object({
    "hearingRange": 5,
    "trade": new Array(),
    "keywords": new Object(),
    "farewells": new Array(),
    "greetings": new Array(),
    "sayings": new Object({
      "texts": new Array(),
      "rate": 300,
      "chance": 1.0
    }),
    "script": null
  });

  // Overwrite
  Object.assign(this.conversation, conversation);

  // Handler for trades
  this.tradeHandler = new TradingHandler(npc, conversation.trade);

  // Handler for focus on player
  this.__focusHandler = new FocusHandler(this);
  this.__focusHandler.on("focusIdle", this.__resetEmitter.bind(this, "idle"));
  this.__focusHandler.on("focusLogout", this.__resetEmitter.bind(this, "exit"));
  this.__focusHandler.on("focusMove", this.__handleFocusMove.bind(this));

  // If there is a script we must attach it to the NPC
  this.__loadScript(conversation.script);

}

// Set the prototype and constructor
ConversationHandler.prototype = Object.create(EventEmitter.prototype);
ConversationHandler.prototype.constructor = ConversationHandler;

ConversationHandler.prototype.getHearingRange = function() {

  /*
   * Function ConversationHandler.getHearingRange
   * Returns the hearing range of the conversation handler
   */

  return this.conversation.hearingRange;

}

ConversationHandler.prototype.__handleFocusMove = function() {

  /*
   * Function ConversationHandler.__handleFocusMove
   * Callback that is fired when the focus moves around 
   */

  let focus = this.getFocus();

  // Always face the focus
  this.npc.faceCreature(focus);

  // If the focus moves outside of range
  if(!this.npc.isWithinHearingRange(focus)) {
    return this.__resetEmitter("exit");
  }

}

ConversationHandler.prototype.getFocus = function() {

  /*
   * Function FocusHandler.getFocus
   * Returns the current focus of the conversation
   */

  return this.__focusHandler.getFocus();

}

ConversationHandler.prototype.respond = function(message, color) {

  /*
   * Function ConversationHandler.respond
   * Function to call to respond to a player query and extend the idle duration
   */

  // Extend the idle duration
  if(this.isInConversation()) {
    this.getFocusHandler().extendFocus(message.length * 4);
  }

  this.say(message, color);

}

ConversationHandler.prototype.emote = function(message, color) {

  /*
   * Function ConversationHandler.emote
   * Emotes a message above the NPC
   */

  this.npc.emote(message, color);

}

ConversationHandler.prototype.privateSay = function(player, message, color) {

  /*
   * Function ConversationHandler.privateSay
   * Says a message to only a single player
   */

  this.npc.privateSay(player, message, color);

}

ConversationHandler.prototype.say = function(message, color) {

  /*
   * Function ConversationHandler.say
   * Function to call to say something without extending the idle duration
   */

  // Delegate to the parent NPC to say the text
  this.npc.internalCreatureSay(message, color);

}

ConversationHandler.prototype.hasSayings = function() {

  /*
   * Function ConversationHandler.hasSayings
   * Returns true if the NPC has sayings
   */

  return this.getSayings().texts.length > 0;

}

ConversationHandler.prototype.getSayings = function() {

  /*
   * Function ConversationHandler.getSayings
   * Returns the configured sayings of the NPC
   */

  return this.conversation.sayings;

}

ConversationHandler.prototype.enterAlert = function(creature) {

  /*
   * Function ConversationHandler.enterAlert
   * Alerts the NPC that a creature has entered the range
   */

  this.__seenCreatures.add(creature);

  this.emit("enter", creature);

}

ConversationHandler.prototype.hasSeen = function(creature) {

  /*
   * Function ConversationHandler.hasSeen
   * Returns true if the NPC has already seen the creature
   */

  return this.__seenCreatures.has(creature);

}

ConversationHandler.prototype.isInConversation = function(player) {

  /*
   * Function ConversationHandler.isInConversation
   * Returns true if the NPC is occupied in a conversation
   */

  return this.getFocusHandler().isInConversation(player);

}

ConversationHandler.prototype.handleResponse = function(player, keyword) {

  /*
   * Function ConversationHandler.handleResponse
   * Handles an incoming keyword from a particular player
   */

  // Accept incoming greetins from anyone
  if(this.__isGreeting(keyword)) {
    return this.__handleGreeting(player);
  }

  // The current player is not speaking 
  if(!this.isInConversation(player)) {
    return;
  }

  // Confirm the message is a goodbye
  if(this.__isGoodbye(keyword)) {
    return this.__resetEmitter("defocus");
  }

  // Apply the default configured keywords
  if(this.__isDefaultKeyword(keyword)) {
    return this.respond(this.conversation.keywords[keyword]);
  }

  // Other call the configured function in the talkstate of the NPC in the script
  this.getTalkStateHandler().handle(player, keyword);

}

ConversationHandler.prototype.getTalkStateHandler = function() {

  /*
   * Function ConversationHandler.getTalkStateHandler
   * Returns the focus state talk state handler
   */

  return this.getFocusHandler().getTalkStateHandler();

}

ConversationHandler.prototype.getFocusHandler = function() {

  /*
   * Function ConversationHandler.getFocusHandler
   * Returns the focus handler
   */

  return this.__focusHandler;

}

ConversationHandler.prototype.setBaseState = function(baseState) {

  /*
   * Function ConversationHandler.setBaseState
   * Delegates to the talk state handler and sets a new configured base state from the cusstom script
   */

  this.getTalkStateHandler().setBaseState(baseState);

}

ConversationHandler.prototype.setTalkState = function(talkState, propertyState) {

  /*
   * Function ConversationHandler.setTalkState
   * Sets the current NPC talk state to a particular callback function that needs to be implemented
   */

  this.getTalkStateHandler().setTalkState(talkState, propertyState);

}

ConversationHandler.prototype.__loadScript = function(script) {

  /*
   * Function ConversationHandler.__loadScript
   * Loads the NPC script definitions from disk
   */

  // Does not exist
  if(script === null) {
    return;
  }

  // Call the script
  require(getDataFile("npcs", "definitions", "script", script)).call(this);

}

ConversationHandler.prototype.__handleGreeting = function(player) {

  /*
   * Function ConversationHandler.__handleGreeting
   * Sets current NPC focus on the player
   */

  // If the NPC is not already focused: obtain a new focus
  if(!this.isInConversation()) {
    return this.__acceptConversation(player);
  }

  // Already speaking to the player
  if(this.isInConversation(player)) {
    return this.emit("regreet", this.getFocus());
  }

  // Already chatting with another player
  return this.emit("busy", this.getFocus(), player);

}

ConversationHandler.prototype.__acceptConversation = function(player) {

  /*
   * Function ConversationHandler.__acceptConversation
   * Accepts the current passed player as the NPCs focus
   */

  // Set the state
  this.getFocusHandler().setFocus(player);

  // Face the current focus
  this.npc.faceCreature(this.getFocus());

  // Emit focus event that custom NPC scripts can subscribe to
  this.emit("focus", player);

}

ConversationHandler.prototype.abort = function() {

  /*
   * Function ConversationHandler.abort
   * Aborts the conversation (e.g., when entering a scene)
   */

  this.__resetEmitter("abort");

}

ConversationHandler.prototype.__resetEmitter = function(which) {

  /*
   * Function ConversationHandler.__resetEmitter
   * Wrapper for emitters that reset the full conversation (e.g., exit)
   */

  // Emit the right event
  this.emit(which, this.getFocus());

  // Reset the focus and state
  this.getFocusHandler().reset();

  // Pause actions for a brief moment
  this.npc.pauseActions(50);

}

ConversationHandler.prototype.__isGoodbye = function(string) {

  /*
   * Function ConversationHandler.__isGoodbye
   * Returns whether a text is a goodbye message
   */

  return this.conversation.farewells.includes(string);

}

ConversationHandler.prototype.__isGreeting = function(string) {

  /*
   * Function ConversationHandler.__isGreeting
   * Returns whether a text is a greeting message
   */

  return this.conversation.greetings.includes(string);

}

ConversationHandler.prototype.__isDefaultKeyword = function(keyword) {

  /*
   * Function ConversationHandler.__isDefaultKeyword
   * Returns true if the given keyword is a default specified in the text
   */

  // Must be in the base talk state to respond to key words
  return this.getTalkStateHandler().isDefaultState() && this.conversation.keywords.hasOwnProperty(keyword);

}

module.exports = ConversationHandler;
