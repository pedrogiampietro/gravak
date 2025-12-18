"use strict";

const Actions = requireModule("actions");
const TargetHandler = requireModule("target-handler");

const ActionHandler = function(player) {

  /*
   * Class ActionHandler
   * Wrapper for player action handlers
   */

  this.__player = player;

  this.actions = new Actions();
  this.targetHandler = new TargetHandler(player);

  // Add the available player actions that are checked every server tick
  this.actions.add(this.handleActionAttack);
  this.actions.add(this.handleActionRegeneration);

}

ActionHandler.prototype.REGENERATION_DURATION = 100;

ActionHandler.prototype.cleanup = function() {

  /*
   * Function ActionHandler.prototype.cleanup
   * Delegates to the actions to clean up remaining actions
   */

  this.actions.cleanup();

}

ActionHandler.prototype.handleActionAttack = function() {
  
  /*
   * Function Player.handleActionAttack
   * Handles attack action 
   */
  
  // No target
  if(!this.targetHandler.hasTarget()) {
    return;
  }

  // Drop the target if it is dead
  if(!gameServer.world.creatureHandler.isCreatureActive(this.targetHandler.getTarget())) {
    return this.targetHandler.setTarget(null);
  }

  // Not besides target and not distance fighting
  if(!this.targetHandler.isBesidesTarget() && !this.__player.isDistanceWeaponEquipped()) {
    return;
  }

  // Confirm player can see the creature for distance (or normal) fighting
  if(!this.__player.isInLineOfSight(this.targetHandler.getTarget())) {
    return;
  }

  this.__player.combatLock.activate();

  // Handle combat with the target
  gameServer.world.combatHandler.handleCombat(this.__player);

  // Lock the action for the inverse of the attack speed of the player
  this.actions.lock(this.handleActionAttack, this.__player.getProperty(CONST.PROPERTIES.ATTACK_SPEED));

}

ActionHandler.prototype.handleActionRegeneration = function() {

  /*
   * Function Player.handleActionRegeneration
   * Handles default health generation of players
   */

  if(!this.__player.isFull(CONST.PROPERTIES.HEALTH)) {

    let regeneration = this.__player.getEquipmentAttribute("healthGain");
    
    // If not full health
    if(!this.__player.isInCombat() && this.__player.hasCondition(CONST.CONDITION.SATED)) {
      regeneration += 5;
    }
  
    //this.__player.increaseHealth(regeneration); 
  
  }
  
  this.actions.lock(this.handleActionRegeneration, this.REGENERATION_DURATION);
  
} 

module.exports = ActionHandler;
