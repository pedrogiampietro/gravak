"use strict";

const Enum = requireModule("enum");

const SceneAction = function(action) {

  /*
   * Class SceneAction
   * Code that wraps a single action for an NPC scene
   */

  // Defaults
  this.type = this.ACTIONS.IDLE;
  this.duration = 0;
  this.timeout = 20;

  Object.assign(this, action);

}

SceneAction.prototype.ACTIONS = new Enum(
  "ADD",
  "ANCHOR",
  "EFFECT",
  "EMOTE",
  "FACE",
  "FUNCTION",
  "IDLE",
  "MOVE",
  "TALK",
  "TELEPORT"
); 

module.exports = SceneAction;
