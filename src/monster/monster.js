"use strict";

const Actions = requireModule("utils/actions");
const Creature = requireModule("entities/creature");
const Corpse = requireModule("entities/corpse");
const DamageMap = requireModule("combat/damage-map");
const LootHandler = requireModule("monster/monster-loot-handler");
const MonsterBehaviour = requireModule("monster/monster-behaviour");

const { EmotePacket } = requireModule("network/protocol");

const Monster = function (cid, data) {

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
  this.lootHandler = new LootHandler(data.loot || []);

  // Container for the behaviour
  this.behaviourHandler = new MonsterBehaviour(this, data.behaviour);

  // Initialize spell actions for monster abilities
  this.spellActions = new Actions();

  // Store attacks array for ranged/magic attacks
  this.attacks = data.attacks || [];
  this.specialAttacks = this.attacks.filter(a => a.name !== 'melee');

  // If monster has special attacks, add the special attack action
  if (this.specialAttacks.length > 0) {
    this.behaviourHandler.actions.add(this.handleSpecialAttacks.bind(this));
  }

  // Load spells from data if provided (legacy format)
  if (data.spells && Array.isArray(data.spells)) {
    this.__addSpells(data.spells);
  }

}

Monster.prototype = Object.create(Creature.prototype);
Monster.prototype.constructor = Monster;

Monster.prototype.setTarget = function (target) {

  /*
   * Function Monster.setTarget
   * Sets the target of the monster
   */

  // Delegate
  this.behaviourHandler.setTarget(target);

}

Monster.prototype.cleanup = function () {

  /*
   * Function Monster.cleanup
   * Call to clean up references from the monster so it can be garbage collected
   */

  this.setTarget(null);

}

Monster.prototype.isTileOccupied = function (tile) {

  /*
   * Function Monster.isTileOccupied
   * Function evaluated for a tile whether it is occupied for the monster or not
   */

  if (tile === null) {
    return true;
  }

  // Tiles that block solid can never be walked on
  if (tile.isBlockSolid()) {
    return true;
  }

  if (tile.isProtectionZone()) {
    return true;
  }

  // The tile items contain a block solid (e.g., a wall)
  if (tile.itemStack && tile.itemStack.isBlockSolid(this.behaviourHandler.openDoors)) {
    return true;
  }

  // Cannot pass through characters
  if (tile.isOccupiedCharacters()) {
    return true;
  }

  return false;

}

Monster.prototype.createCorpse = function () {

  /*
   * Function Monster.createCorpse
   * Returns the corpse of a particular creature
   */

  // Create a new corpse based on the monster type
  let thing = gameServer.database.createThing(this.corpse);

  // Distribute the experience
  this.damageMap.distributeExperience();

  // Add loot to the corpse and schedule a decay event
  if (thing instanceof Corpse) {
    this.lootHandler.addLoot(thing);
  }

  // Add the experience
  return thing;

}

Monster.prototype.getPrototype = function () {

  /*
   * Function Monster.getPrototype
   * Returns the prototype definition of a monster from its monster identifier
   */

  return gameServer.database.getMonster(this.cid);

}

Monster.prototype.getTarget = function () {

  /*
   * Function Creature.getTarget
   * Returns the target of a creature
   */

  return this.behaviourHandler.getTarget();

}

Monster.prototype.push = function (position) {

  /*
   * Function Monster.push
   * Cooldown function that handles the creature movement
   */

  // Cannot push when the creature is moving
  if (this.isMoving()) {
    return;
  }

  if (!position.besides(this.position)) {
    return;
  }

  let tile = process.gameServer.world.getTileFromWorldPosition(position);

  if (tile === null || tile.id === 0) {
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

Monster.prototype.hasTarget = function () {

  /*
   * Function Monster.hasTarget
   * Returns true if the monster has a target
   */

  return this.behaviourHandler.hasTarget();

}

Monster.prototype.think = function () {

  /*
   * Function Monster.think
   * Function called when an creature should think
   */

  // Delegates to handling all the available actions
  this.behaviourHandler.actions.handleActions(this.behaviourHandler);

}

Monster.prototype.handleSpellAction = function () {

  /*
   * Function Monster.handleSpellAction
   * Handles monster cast spell events
   */

  // Must have a target before casting any spells
  if (!this.behaviourHandler.hasTarget()) {
    return;
  }

  // Always lock the global spell cooldown
  this.lockAction(this.handleSpellAction, 1000);

  // Can not shoot at the target (line of sight blocked)
  if (!this.isInLineOfSight(this.behaviourHandler.target)) {
    return;
  }

  // Go over all the available spells in the spellbook
  this.spellActions.forEach(function (spell) {

    // This means there is a failure to cast the spell
    if (Math.random() > spell.chance) {
      return;
    }

    // Get the spell callback from the database and apply it
    let cast = gameServer.database.getSpell(spell.id);

    // If casting was succesful lock it with the specified cooldown
    if (cast.call(this, spell)) {
      this.spellActions.lock(spell, spell.cooldown);
    }

  }, this);

}

Monster.prototype.isDistanceWeaponEquipped = function () {

  /*
   * Function Monster.isDistanceWeaponEquipped
   * Returns true if the monster has a distance weapon equipped
   */

  return false;

}

Monster.prototype.decreaseHealth = function (source, amount) {

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
  if (this.isZeroHealth()) {
    return gameServer.world.creatureHandler.dieCreature(this);
  }

}

Monster.prototype.__addSpells = function (spells) {

  /*
   * Function Monster.__addSpells
   * Adds the spells to the spellbook
   */

  spells.forEach(spell => this.spellActions.add(spell));

}

Monster.prototype.handleSpecialAttacks = function () {

  /*
   * Function Monster.handleSpecialAttacks
   * Handles special attacks (fire, energy, lifedrain, etc) from the attacks array
   * Supports both targeted attacks (with shootEffect) and wave attacks (with length+spread)
   */

  // Must have a target before casting any special attacks
  if (!this.behaviourHandler.hasTarget()) {
    return;
  }

  const target = this.behaviourHandler.getTarget();
  const Geometry = requireModule("utils/geometry");

  // Check if target is within range for any special attack
  const distanceToTarget = this.position.manhattanDistance(target.position);

  // Go through each special attack and try to cast it
  for (const attack of this.specialAttacks) {
    // Check chance
    if (Math.random() > attack.chance) {
      continue;
    }

    // Calculate damage
    const damage = Number.prototype.random(attack.min, attack.max);
    const effectType = attack.areaEffect ? this.__getMagicEffect(attack.areaEffect) : null;

    // Check if this is a wave attack (has length and spread, no target flag)
    if (attack.length && attack.spread) {
      // Wave attack - affects cone area in front of monster
      const direction = this.getProperty(CONST.PROPERTIES.DIRECTION);
      const wavePositions = Geometry.prototype.getWave(this.position, direction, attack.length, attack.spread);

      // Show effects and apply damage to all tiles in wave
      for (const pos of wavePositions) {
        // Show area effect on each tile
        if (effectType !== null) {
          gameServer.world.sendMagicEffect(pos, effectType);
        }

        // Get tile and apply damage to creatures on it
        const tile = gameServer.world.getTileFromWorldPosition(pos);
        if (tile === null || !tile.creatures) {
          continue;
        }

        // Damage all creatures on the tile (except self)
        for (const creature of tile.creatures) {
          if (creature !== this && damage > 0) {
            gameServer.world.combatHandler.applyEnvironmentalDamage(creature, damage, CONST.COLOR.ORANGE);
          }
        }
      }

      // Only one special attack per think cycle
      break;
    }

    // Regular targeted attack
    // Check range (default to 7 if not specified)
    const range = attack.range || 7;
    if (distanceToTarget > range) {
      continue;
    }

    // Send projectile effect if shootEffect is specified
    if (attack.shootEffect) {
      const shootType = this.__getShootEffect(attack.shootEffect);
      if (shootType !== null) {
        gameServer.world.sendDistanceEffect(this.position, target.position, shootType);
      }
    }

    // Send area effect if areaEffect is specified (for targeted attacks)
    if (effectType !== null) {
      gameServer.world.sendMagicEffect(target.position, effectType);
    }

    // Apply damage to target
    if (damage > 0) {
      gameServer.world.combatHandler.applyEnvironmentalDamage(target, damage, CONST.COLOR.ORANGE);
    }

    // Only one special attack per think cycle
    break;
  }

}

Monster.prototype.__getShootEffect = function (effectName) {
  /*
   * Maps shoot effect names to CONST values
   */
  const effectMap = {
    'fire': CONST.EFFECT.PROJECTILE.FIRE,
    'energy': CONST.EFFECT.PROJECTILE.ENERGY,
    'poison': CONST.EFFECT.PROJECTILE.POISON,
    'ice': CONST.EFFECT.PROJECTILE.ICE,
    'earth': CONST.EFFECT.PROJECTILE.EARTH,
    'death': CONST.EFFECT.PROJECTILE.DEATH,
    'holy': CONST.EFFECT.PROJECTILE.HOLY
  };
  return effectMap[effectName.toLowerCase()] || null;
}

Monster.prototype.__getMagicEffect = function (effectName) {
  /*
   * Maps area effect names to CONST values
   */
  const effectMap = {
    'firearea': CONST.EFFECT.MAGIC.HITBYFIRE,
    'energyarea': CONST.EFFECT.MAGIC.ENERGY_AREA,
    'icearea': CONST.EFFECT.MAGIC.ICE_AREA,
    'eartharea': CONST.EFFECT.MAGIC.EARTH_AREA,
    'blueshimmer': CONST.EFFECT.MAGIC.MAGIC_BLUE,
    'redshimmer': CONST.EFFECT.MAGIC.MAGIC_RED,
    'greenshimmer': CONST.EFFECT.MAGIC.MAGIC_GREEN,
    'mortarea': CONST.EFFECT.MAGIC.DEATH_AREA,
    'holyarea': CONST.EFFECT.MAGIC.HOLY_AREA
  };
  return effectMap[effectName.toLowerCase()] || null;
}

module.exports = Monster;
