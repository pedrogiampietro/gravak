"use strict";

const ServerMessagePacket = requireModule("protocol");
const DamageMapEntry = requireModule("damage-map-entry");

const { EmotePacket } = requireModule("protocol");

const DamageMap = function(monster) {

  /*
   * Class DamageMap
   * Contains and records the damage caused to a creature
   */

  this.__map = new Map();
  this.__monster = monster;

}

DamageMap.prototype.getDividedExperience = function(experience) {

  /*
   * Function DamageMap.getDividedExperience
   * Equally divides the total experience over the number of characters in the map
   */

  // Divide over all character in the map
  return Math.floor(experience / this.__map.size);

}

DamageMap.prototype.update = function(attacker, amount) {

  /*
   * Function DamageMap.update
   * Adds incoming damage from an attacker to the damage map
   */

  if(attacker === null) {
    return;
  }

  if(!this.__map.has(attacker)) {
    this.__map.set(attacker, new DamageMapEntry());
  }

  // Add to the existing amount
  this.__map.get(attacker).addDamage(amount);

}

DamageMap.prototype.distributeExperience = function() {

  /*
   * Function DamageMap.distributeExperience
   * Distributes the experience over all players in the damage map
   */

  // Distribute equally to all attackers
  let sharedExperience = this.getDividedExperience(this.__monster.experience);

  // Evenly distribute the experience
  this.__map.forEach(function(map, attacker) {

    // Add the experience
    if(!attacker.isPlayer()) {
      return;
    }

    // No longer online?
    if(!attacker.isOnline()) {
      return;
    }

    // Experience to share
    if(sharedExperience > 0) {
      attacker.incrementProperty(CONST.PROPERTIES.EXPERIENCE, sharedExperience);
      attacker.write(new EmotePacket(attacker, String(sharedExperience), CONST.COLOR.WHITE));
    }

  });

}

DamageMap.prototype.__createLootText = function(thing) {

  /*
   * Function DamageMap.__createLootText
   * Creates loot text entry
   */

  if(thing.isStackable()) {
    return thing.getCount() + " " + thing.getName();
  }

  return thing.getArticle() + " " + thing.getName();
  
}

module.exports = DamageMap;
