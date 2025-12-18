"use strict";

const CombatHandler = function() {

  /*
   * Class CombatHandler
   * Wrapper for all combat related functions
   */

}

CombatHandler.prototype.handleCombat = function(source) {

  /*
   * Function CombatHandler.handleCombat
   * Handles combat between a creature and its target
   */

  // Reference the target
  let target = source.getTarget();

  // Calculate the damage
  let damage = source.calculateDamage();
  let defense = target.calculateDefense();

  // Get the unmitigated damage clamped
  let unmitigatedDamage = (damage - defense).clamp(0, target.getProperty(CONST.PROPERTIES.HEALTH));

  // If the attacker has a distance weapon equipped
  if(source.isDistanceWeaponEquipped()) {

    // No ammunition?
    if(!source.isAmmunitionEquipped()) {
      return;
    }

    this.handleDistanceCombat(source, target);

  }

  // If there is no damage send a block poff effect
  if(unmitigatedDamage < 0) {
    return gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.POFF);
  }

  // Precisely zero
  if(unmitigatedDamage === 0) {
    return gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.BLOCKHIT);
  }

  unmitigatedDamage = 2;

  // Remove health from target
  return target.decreaseHealth(source, unmitigatedDamage);

}

CombatHandler.prototype.handleDistanceCombat = function(source, target) {
    
  /*
   * Function CombatHandler.handleDistanceCombat
   * Handles the distance combat
   */
  
  // Consume the ammunition
  let ammo = source.consumeAmmunition();

  // Write a distance effect
  gameServer.world.sendDistanceEffect(source.position, target.position, ammo.getShootType());
    
} 

CombatHandler.prototype.applyEnvironmentalDamage = function(target, amount, color) {

  /*
   * Function CombatHandler.applyEnvironmentalDamage
   * Applies environmental damage from the gameworld (fire, energy, poison)
   */

  // Make sure to lock the player in combat
  if(target.isPlayer()) {
    target.combatLock.activate();
  }

  // Decrease the health
  target.decreaseHealth(null, amount, color);

}

module.exports = CombatHandler;
