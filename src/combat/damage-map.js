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
      // Add experience using skills.incrementSkill
      // This internally handles level up detection and calls onLevelUp if needed
      attacker.skills.incrementSkill(CONST.PROPERTIES.EXPERIENCE, finalExperience);
      attacker.write(new EmotePacket(attacker, String(finalExperience), CONST.COLOR.WHITE));

      // Send experience update to client
      let expAfter = attacker.skills.getSkillValue(CONST.PROPERTIES.EXPERIENCE);
      attacker.write(new CreaturePropertyPacket(attacker.getId(), CONST.PROPERTIES.EXPERIENCE, expAfter));
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
