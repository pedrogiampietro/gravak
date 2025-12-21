"use strict";

const TalkStateHandler = function(conversationHandler) {

  /*
   * Class TalkStateHandler
   * Code that handles and remembers the NPC talk state
   *
   * Public API:
   *
   * @ConversationHandler.handle(player, keyword) - applies the current buffered talk state to the keyword
   * @ConversationHandler.isDefaultState() - returns true if the NPC is in the default state
   * @ConversationHandler.setTalkState(talkState, propertyState) - sets a new talk state (with optional state properties for NPC memory)
   * @ConversationHandler.setBaseState(baseState) - sets a new base state
   * @ConversationHandler.reset() - completely resets the state to the configured base state
   *
   */

  // Reference parent
  this.conversationHandler = conversationHandler;

  // These void functions will be overwritten by custom script
  this.__talkState = Function.prototype;
  this.__baseTalkState = Function.prototype;
  this.__baseTalkStateBound = Function.prototype;

}

TalkStateHandler.prototype.handle = function(player, keyword) {

  /*
   * Function TalkStateHandler.handle
   * Applies the correct bound state function to the keyword
   */

  // The bound function is saved here, so call it
  this.__talkState(player, keyword);

}

TalkStateHandler.prototype.isDefaultState = function() {

  /*
   * Function TalkStateHandler.isDefaultState
   * Returns true if the NPC is in the default base state
   */

  return this.__talkState === this.__baseTalkStateBound;

}

TalkStateHandler.prototype.setTalkState = function(talkState, propertyState) {

  /*
   * Function TalkStateHandler.setTalkState
   * Sets the current NPC talk state to a particular callback function that needs to be implemented
   */

  // Setting to base state: use the bound function instead
  if(talkState === this.__baseTalkState) {
    return this.reset();
  }

  // If the property state is not specified it is an empty object and the state is reset
  if(propertyState === undefined) {
    propertyState = new Object();
  }

  // Set the current NPC response state 
  this.__talkState = talkState.bind(this.conversationHandler, propertyState);

}

TalkStateHandler.prototype.reset = function() {

  /*
   * Function TalkStateHandler.reset
   * Sets the current NPC talk state to a particular callback function that needs to be implemented
   */

  return this.__talkState = this.__baseTalkStateBound;

}

TalkStateHandler.prototype.setBaseState = function(baseState) {

  /*
   * Function TalkStateHandler.setBaseState
   * Sets the initial base state of the NPC that is used after a reset
   */

  // The original function and a bound function
  this.__baseTalkState = baseState;
  this.__baseTalkStateBound = baseState.bind(this.conversationHandler, new Object());

  this.setTalkState(baseState);

}

module.exports = TalkStateHandler
