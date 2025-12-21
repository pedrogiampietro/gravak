"use strict";

const ServerMessagePacket = requireModule("network/protocol");
const DamageMapEntry = requireModule("combat/damage-map-entry");

const { EmotePacket, CreaturePropertyPacket } = requireModule("network/protocol");

const DamageMap = function (monster) {

  /*
   * Class DamageMap
   * Contains and records the damage caused to a creature
   */

  this.__map = new Map();
  this.__monster = monster;

}

DamageMap.prototype.getDividedExperience = function (experience) {

  /*
   * Function DamageMap.getDividedExperience
   * Equally divides the total experience over the number of characters in the map
   */

  // Divide over all character in the map
  return Math.floor(experience / this.__map.size);

}

DamageMap.prototype.update = function (attacker, amount) {

  /*
   * Function DamageMap.update
   * Adds incoming damage from an attacker to the damage map
   */

  if (attacker === null) {
    return;
  }

  if (!this.__map.has(attacker)) {
    this.__map.set(attacker, new DamageMapEntry());
  }

  // Add to the existing amount
  this.__map.get(attacker).addDamage(amount);

}

DamageMap.prototype.distributeExperience = function () {

  /*
   * Function DamageMap.distributeExperience
   * Distributes the experience over all players in the damage map
   * Applies stage multipliers based on player level
   */

  console.log(`[EXP DEBUG] distributeExperience called!`);
  console.log(`[EXP DEBUG] Monster: ${this.__monster.getProperty(CONST.PROPERTIES.NAME)}`);
  console.log(`[EXP DEBUG] Monster base exp: ${this.__monster.experience}`);
  console.log(`[EXP DEBUG] Damage map size: ${this.__map.size}`);

  // Load stages configuration
  let stagesConfig = null;
  try {
    stagesConfig = require(process.cwd() + "/data/740/stages.json");
  } catch (e) {
    // If stages.json doesn't exist, use 1x multiplier
    stagesConfig = { enabled: false, stages: [] };
  }

  // Distribute equally to all attackers
  let baseExperience = this.getDividedExperience(this.__monster.experience);
  console.log(`[EXP DEBUG] Base experience per attacker: ${baseExperience}`);

  // Evenly distribute the experience
  this.__map.forEach(function (map, attacker) {

    // Add the experience
    if (!attacker.isPlayer()) {
      return;
    }

    // No longer online?
    if (!attacker.isOnline()) {
      return;
    }

    // Calculate final experience with stage multiplier
    let finalExperience = baseExperience;

    if (stagesConfig.enabled && stagesConfig.stages.length > 0) {
      let playerLevel = attacker.getLevel();
      let multiplier = 1;

      // Find the appropriate stage for the player's level
      for (let stage of stagesConfig.stages) {
        let minLevel = stage.minLevel || 1;
        let maxLevel = stage.maxLevel || Infinity;

        if (playerLevel >= minLevel && playerLevel <= maxLevel) {
          multiplier = stage.multiplier || 1;
          break;
        }
      }

      finalExperience = Math.floor(baseExperience * multiplier);
    }

    // Experience to share
    if (finalExperience > 0) {
      // Save current level before adding experience
      let levelBefore = attacker.getLevel();
      let expBefore = attacker.skills.getSkillValue(CONST.PROPERTIES.EXPERIENCE);

      console.log(`[EXP DEBUG] Player: ${attacker.getProperty(CONST.PROPERTIES.NAME)}`);
      console.log(`[EXP DEBUG] Exp before: ${expBefore}, Level before: ${levelBefore}`);
      console.log(`[EXP DEBUG] Adding experience: ${finalExperience}`);

      // Add experience using skills.incrementSkill (not incrementProperty!)
      attacker.skills.incrementSkill(CONST.PROPERTIES.EXPERIENCE, finalExperience);
      attacker.write(new EmotePacket(attacker, String(finalExperience), CONST.COLOR.WHITE));

      let expAfter = attacker.skills.getSkillValue(CONST.PROPERTIES.EXPERIENCE);
      let levelAfter = attacker.getLevel();
      console.log(`[EXP DEBUG] Exp after: ${expAfter}, Level after: ${levelAfter}`);

      // ALWAYS send experience update to client (even if no level up)
      attacker.write(new CreaturePropertyPacket(attacker.getId(), CONST.PROPERTIES.EXPERIENCE, expAfter));

      // Check if level changed
      if (levelAfter > levelBefore) {
        // Player leveled up! Send level update and message
        attacker.onLevelUp(levelBefore, levelAfter);
      }
    }

  });

}

DamageMap.prototype.__createLootText = function (thing) {

  /*
   * Function DamageMap.__createLootText
   * Creates loot text entry
   */

  if (thing.isStackable()) {
    return thing.getCount() + " " + thing.getName();
  }

  return thing.getArticle() + " " + thing.getName();

}

module.exports = DamageMap;
