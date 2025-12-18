"use strict";

const { TargetPacket } = requireModule("protocol");

const TargetHandler = function(player) {

  /*
   * Class TargetHandler
   * Handler for targeting 
   */

  this.__player = player;
  this.__target = null;

}

TargetHandler.prototype.hasTarget = function() {

  /*
   * Function ActionHandler.hasTarget
   * Returns true when the creature has a target
   */
  
  return this.__target !== null;

}

TargetHandler.prototype.getTarget = function() {

  return this.__target;

}

TargetHandler.prototype.setTarget = function(target) {

  /*
   * Function ActionHandler.prototype.setTarget
   * Sets the target of the creature
   */

  this.__target = target;

  let id = (target === null) ? 0 : target.getId();

  this.__player.write(new TargetPacket(id));

}

TargetHandler.prototype.isBesidesTarget = function() {

  if(!this.hasTarget()) {
    return false;
  }

  return this.__player.isBesidesThing(this.getTarget());

}

module.exports = TargetHandler;
