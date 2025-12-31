"use strict";

const Actions = requireModule("utils/actions");
const TargetHandler = requireModule("combat/target-handler");
const Condition = requireModule("combat/condition");
const Pathfinder = requireModule("utils/pathfinder");

const ActionHandler = function (player) {

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
  this.actions.add(this.handleActionChase);

}

ActionHandler.prototype.REGENERATION_DURATION = 100;

ActionHandler.prototype.cleanup = function () {

  /*
   * Function ActionHandler.prototype.cleanup
   * Delegates to the actions to clean up remaining actions
   */

  this.actions.cleanup();

}

ActionHandler.prototype.handleActionAttack = function () {

  /*
   * Function Player.handleActionAttack
   * Handles attack action 
   */

  // No target
  if (!this.targetHandler.hasTarget()) {
    return;
  }

  // Prevent attack if dead
  if (this.__player.isDead) {
    return;
  }

  // Drop the target if it is dead
  if (!gameServer.world.creatureHandler.isCreatureActive(this.targetHandler.getTarget())) {
    return this.targetHandler.setTarget(null);
  }

  // Not besides target and not distance fighting
  if (!this.targetHandler.isBesidesTarget() && !this.__player.isDistanceWeaponEquipped()) {
    return;
  }

  // Confirm player can see the creature for distance (or normal) fighting
  if (!this.__player.isInLineOfSight(this.targetHandler.getTarget())) {
    return;
  }

  this.__player.combatLock.activate();

  // Handle combat with the target
  gameServer.world.combatHandler.handleCombat(this.__player);

  // Lock the action for the inverse of the attack speed of the player
  this.actions.lock(this.handleActionAttack, this.__player.getProperty(CONST.PROPERTIES.ATTACK_SPEED));

}

ActionHandler.prototype.handleActionRegeneration = function () {

  /*
   * Function Player.handleActionRegeneration
   * Handles default health and mana generation of players
   */

  // Check if player is sated and not in combat for bonus regeneration
  let hasSatedCondition = this.__player.hasCondition(Condition.prototype.SATED);
  let isSated = !this.__player.isInCombat() && hasSatedCondition;

  // Health regeneration
  if (!this.__player.isFull(CONST.PROPERTIES.HEALTH)) {
    let healthRegen = this.__player.getEquipmentAttribute("healthGain") || 0;

    if (isSated) {
      healthRegen += 5;
    }

    if (healthRegen > 0) {
      this.__player.increaseHealth(healthRegen);
    }
  }

  // Mana regeneration (only when sated)
  if (!this.__player.isFull(CONST.PROPERTIES.MANA)) {
    let manaRegen = this.__player.getEquipmentAttribute("manaGain") || 0;

    if (isSated) {
      manaRegen += 5;
      this.__player.increaseMana(manaRegen);
    } else if (manaRegen > 0) {
      this.__player.increaseMana(manaRegen);
    }
  }

  this.actions.lock(this.handleActionRegeneration, this.REGENERATION_DURATION);

}

ActionHandler.prototype.CHASE_DURATION = 5;

ActionHandler.prototype.handleActionChase = function () {

  /*
   * Function Player.handleActionChase
   * Handles automatic chasing of target when chase mode is enabled
   */

  // Always lock to prevent spamming
  this.actions.lock(this.handleActionChase, this.CHASE_DURATION);

  // Only chase if chase mode is CHASE (1)
  if (this.__player.chaseMode !== CONST.CHASE_MODE.CHASE) {
    return;
  }

  // No target to chase
  if (!this.targetHandler.hasTarget()) {
    return;
  }

  // Prevent chase if dead
  if (this.__player.isDead) {
    return;
  }

  // Already moving, don't interrupt
  if (this.__player.movementHandler.isMoving()) {
    return;
  }

  // Already besides target, no need to chase
  if (this.targetHandler.isBesidesTarget()) {
    return;
  }

  // Check if the target is still valid
  let target = this.targetHandler.getTarget();
  if (!gameServer.world.creatureHandler.isCreatureActive(target)) {
    return;
  }

  // Use A* pathfinding to find path to target (stop at adjacent tile)
  let path = gameServer.world.findPath(
    this.__player,
    this.__player.getPosition(),
    target.getPosition(),
    Pathfinder.prototype.ADJACENT
  );

  // No path found
  if (path.length === 0) {
    return;
  }

  // Get the next tile to move to (last in path since path is reversed)
  let nextTile = path.pop();

  if (nextTile === null) {
    return;
  }

  // Calculate the direction to move
  let direction = this.__player.getPosition().getFacingDirection(nextTile.position);

  // Move the player in that direction
  this.__player.movementHandler.handleMovement(direction);

}

module.exports = ActionHandler;
