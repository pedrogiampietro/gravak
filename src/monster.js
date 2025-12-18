"use strict";

const Creature = requireModule("creature");
const Corpse = requireModule("corpse");
const DamageMap = requireModule("damage-map");
const LootHandler = requireModule("monster-loot-handler");
const MonsterBehaviour = requireModule("monster-behaviour");

const { EmotePacket } = requireModule("protocol");

const Monster = function(cid, data) {

  /*
   * Class Monster
   * Container for an attackable monster
   */

  // Inherit from creature
  Creature.call(this, data.creatureStatistics);

  // Save properties of the monster
  this.cid = cid;
  this.corpse = data.corpse;
  this.fluidType = CONST.COLOR.RED;
  this.experience = data.experience;

  // Map for damage done to the creature
  this.damageMap = new DamageMap(this);

  // Handler for loot
  this.lootHandler = new LootHandler(data.loot);

  // Container for the behaviour
  this.behaviourHandler = new MonsterBehaviour(this, data.behaviour);

}

Monster.prototype = Object.create(Creature.prototype);
Monster.prototype.constructor = Monster;

Monster.prototype.setTarget = function(target) {

  /*
   * Function Monster.setTarget
   * Sets the target of the monster
   */

  // Delegate
  this.behaviourHandler.setTarget(target);

}

Monster.prototype.cleanup = function() {

  /*
   * Function Monster.cleanup
   * Call to clean up references from the monster so it can be garbage collected
   */

  this.setTarget(null);

}

Monster.prototype.isTileOccupied = function(tile) {

  /*
   * Function Monster.isTileOccupied
   * Function evaluated for a tile whether it is occupied for the monster or not
   */

  if(tile === null) {
    return true;
  }

  // Tiles that block solid can never be walked on
  if(tile.isBlockSolid()) {
    return true;
  }

  if(tile.isProtectionZone()) {
    return true;
  }

  // The tile items contain a block solid (e.g., a wall)
  if(tile.itemStack && tile.itemStack.isBlockSolid(this.behaviourHandler.openDoors)) {
    return true;
  }

  // Cannot pass through characters
  if(tile.isOccupiedCharacters()) {
    return true;
  }

  return false;

}

Monster.prototype.createCorpse = function() {

  /*
   * Function Monster.createCorpse
   * Returns the corpse of a particular creature
   */

  // Create a new corpse based on the monster type
  let thing = gameServer.database.createThing(this.corpse);

  // Distribute the experience
  this.damageMap.distributeExperience();

  // Add loot to the corpse and schedule a decay event
  if(thing instanceof Corpse) {
    this.lootHandler.addLoot(thing);
  }

  // Add the experience
  return thing;

}

Monster.prototype.getPrototype = function() {

  /*
   * Function Monster.getPrototype
   * Returns the prototype definition of a monster from its monster identifier
   */

  return gameServer.database.getMonster(this.cid);

}

Monster.prototype.getTarget = function() {

  /*
   * Function Creature.getTarget
   * Returns the target of a creature
   */

  return this.behaviourHandler.getTarget();

}

Monster.prototype.push = function(position) {

  /*
   * Function Monster.push
   * Cooldown function that handles the creature movement
   */

  // Cannot push when the creature is moving
  if(this.isMoving()) {
    return;
  }

  if(!position.besides(this.position)) {
    return;
  }

  let tile = process.gameServer.world.getTileFromWorldPosition(position);

  if(tile === null || tile.id === 0) {
    return;
  }

  let lockDuration = this.getStepDuration(tile.getFriction());

  // Determine the slowness
  let slowness = this.position.isDiagonal(position) ? 2 * lockDuration : lockDuration;

  // Delegate to move the creature to the new tile position
  gameServer.world.moveCreature(this, position);

  // Lock this function for a number of frames
  this.behaviourHandler.actions.lock(this.handleActionMove, slowness);

}

Monster.prototype.hasTarget = function() {

  /*
   * Function Monster.hasTarget
   * Returns true if the monster has a target
   */

  return this.behaviourHandler.hasTarget();

}

Monster.prototype.think = function() {

  /*
   * Function Monster.think
   * Function called when an creature should think
   */

  // Delegates to handling all the available actions
  this.behaviourHandler.actions.handleActions(this.behaviourHandler);

} 

Monster.prototype.handleSpellAction = function() {

  /*
   * Function Monster.handleSpellAction
   * Handles monster cast spell events
   */

  // Must have a target before casting any spells
  if(!this.behaviourHandler.hasTarget()) {
    return;
  }

  // Always lock the global spell cooldown
  this.lockAction(this.handleSpellAction, 1000);

  // Can not shoot at the target (line of sight blocked)
  if(!this.isInLineOfSight(this.behaviourHandler.target)) {
    return;
  }

  // Go over all the available spells in the spellbook
  this.spellActions.forEach(function(spell) {

    // This means there is a failure to cast the spell
    if(Math.random() > spell.chance) {
      return;
    }

    // Get the spell callback from the database and apply it
    let cast = gameServer.database.getSpell(spell.id);

    // If casting was succesful lock it with the specified cooldown
    if(cast.call(this, spell)) {
      this.spellActions.lock(spell, spell.cooldown);
    }

  }, this);
  
}

Monster.prototype.isDistanceWeaponEquipped = function() {

  /*
   * Function Monster.isDistanceWeaponEquipped
   * Returns true if the monster has a distance weapon equipped
   */

  return false;

}

Monster.prototype.decreaseHealth = function(source, amount) {

  /*
   * Function Monster.decreaseHealth
   * Fired when the monster loses health
   */

  // Clamp
  amount = amount.clamp(0, this.getProperty(CONST.PROPERTIES.HEALTH));

  // Record the attack in the damage map
  this.damageMap.update(source, amount);

  // Change the property
  this.incrementProperty(CONST.PROPERTIES.HEALTH, -amount);

  // Inform behaviour handler of the damage event
  this.behaviourHandler.handleDamage(source);
  this.broadcast(new EmotePacket(this, String(amount), this.fluidType));

  // When zero health is reached the creature is dead
  if(this.isZeroHealth()) {
    return gameServer.world.creatureHandler.dieCreature(this);
  }

}

Monster.prototype.__addSpells = function(spells) {

  /*
   * Function Monster.__addSpells
   * Adds the spells to the spellbook
   */

  spells.forEach(spell => this.spellActions.add(spell));

}

module.exports = Monster;
