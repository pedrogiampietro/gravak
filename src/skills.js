"use strict";

const Skill = requireModule("skill");

const Skills = function (player, points) {
  /*
   * Class Skills
   * Wrapper for the player skills
   *
   * API:
   *
   * Skills.getSkill(type) - returns the a skill of particular type
   * Skills.getSkillLevel(type) - returns the skill level in a particular skill (based on points)
   * Skills.hasSkill(type) - returns true if the skill exists
   * Skills.setSkillLevel(type, level) - sets the skill level of a particular type
   * Skills.setSkillValue(type, value) - sets the number of skill points
   * Skills.toJSON - serializes the skills from memory to JSON
   *
   */

  // Circular reference
  this.__player = player;

  // Add all these skills as player properties
  this.__addSkillProperty(CONST.PROPERTIES.MAGIC, points.magic);
  this.__addSkillProperty(CONST.PROPERTIES.FIST, points.fist);
  this.__addSkillProperty(CONST.PROPERTIES.CLUB, points.club);
  this.__addSkillProperty(CONST.PROPERTIES.SWORD, points.sword);
  this.__addSkillProperty(CONST.PROPERTIES.AXE, points.axe);
  this.__addSkillProperty(CONST.PROPERTIES.DISTANCE, points.distance);
  this.__addSkillProperty(CONST.PROPERTIES.SHIELDING, points.shielding);
  this.__addSkillProperty(CONST.PROPERTIES.FISHING, points.fishing);
  this.__addSkillProperty(CONST.PROPERTIES.EXPERIENCE, points.experience);

  // Set the maximum properties based on experience level
  this.setMaximumProperties();
};

Skills.prototype.__setMaximumPropertiesConsants = function (vocation, level) {
  /*
   * Function Skills.__setMaximumPropertiesConsants
   * Maximum properties are based on the player level
   */

  // https://tibia.fandom.com/wiki/Formulae#Hitpoints,_Mana_and_Capacity
  switch (vocation) {
    case CONST.VOCATION.NONE:
      return new Object({
        health: 5 * (level + 29),
        mana: 5 * (level + 10),
        capacity: 10 * (level + 39),
      });
    case CONST.VOCATION.KNIGHT:
    case CONST.VOCATION.ELITE_KNIGHT:
      return new Object({
        health: 5 * (3 * level + 13),
        mana: 5 * (level + 10),
        capacity: 5 * (5 * level + 54),
      });
    case CONST.VOCATION.PALADIN:
    case CONST.VOCATION.ROYAL_PALADIN:
      return new Object({
        health: 5 * (2 * level + 21),
        mana: 5 * (3 * level - 6),
        capacity: 10 * (2 * level + 31),
      });
    case CONST.VOCATION.SORCERER:
    case CONST.VOCATION.MASTER_SORCERER:
    case CONST.VOCATION.DRUID:
    case CONST.VOCATION.ELDER_DRUID:
      return new Object({
        health: 5 * (level + 29),
        mana: 5 * (6 * level - 30),
        capacity: 10 * (level + 39),
      });
  }
};

Skills.prototype.setMaximumProperties = function () {
  /*
   * Function Skills.setMaximumProperties
   * Maximum properties are based on the player level and vocation
   */

  // Get current level and vocation
  let level = this.getSkillLevel(CONST.PROPERTIES.EXPERIENCE);
  let vocation = this.__player.getProperty(CONST.PROPERTIES.VOCATION);

  console.log("=== DEBUG SET MAXIMUM PROPERTIES ===");
  console.log(`Level: ${level}, Vocation: ${vocation}`);

  // Calculate maximum values based on vocation and level
  // https://tibia.fandom.com/wiki/Formulae#Hitpoints,_Mana_and_Capacity
  let health, mana, capacity;

  switch (vocation) {
    case CONST.VOCATION.NONE:
      health = 5 * (level + 29);
      mana = 5 * (level + 10);
      capacity = 10 * (level + 39);
      break;
    case CONST.VOCATION.KNIGHT:
    case CONST.VOCATION.ELITE_KNIGHT:
      health = 5 * (3 * level + 13);
      mana = 5 * (level + 10);
      capacity = 5 * (5 * level + 54);
      break;
    case CONST.VOCATION.PALADIN:
    case CONST.VOCATION.ROYAL_PALADIN:
      health = 5 * (2 * level + 21);
      mana = 5 * (3 * level - 6);
      capacity = 10 * (2 * level + 31);
      break;
    case CONST.VOCATION.SORCERER:
    case CONST.VOCATION.MASTER_SORCERER:
    case CONST.VOCATION.DRUID:
    case CONST.VOCATION.ELDER_DRUID:
      health = 5 * (level + 29);
      mana = 5 * (6 * level - 30);
      capacity = 10 * (level + 39);
      break;
    default:
      health = 150;
      mana = 55;
      capacity = 400;
  }

  console.log("Calculated maximum values:");
  console.log(`Health Max: ${health}`);
  console.log(`Mana Max: ${mana}`);
  console.log(`Capacity Max: ${capacity}`);

  // Set the maximum values
  this.__player.setProperty(CONST.PROPERTIES.HEALTH_MAX, health);
  this.__player.setProperty(CONST.PROPERTIES.MANA_MAX, mana);
  this.__player.setProperty(CONST.PROPERTIES.CAPACITY_MAX, capacity);
};

Skills.prototype.calculateMaxCapacity = function (level, vocation) {
  console.log(
    `Iniciando cálculo de capacidade máxima para level ${level} e vocação ${vocation}`
  );

  // Base capacity is 400
  let capacity = 400;
  console.log(`Capacidade base: ${capacity}`);

  // Add capacity based on level
  let levelBonus = (level - 1) * 10;
  console.log(`Bônus por level (${level - 1} * 10): ${levelBonus}`);
  capacity += levelBonus;

  // Add vocation bonus
  let vocationBonus = 0;
  switch (vocation) {
    case CONST.VOCATION.KNIGHT:
      vocationBonus = level * 25;
      break;
    case CONST.VOCATION.PALADIN:
      vocationBonus = level * 20;
      break;
    case CONST.VOCATION.SORCERER:
    case CONST.VOCATION.DRUID:
      vocationBonus = level * 10;
      break;
  }
  console.log(`Bônus por vocação (${vocation}): ${vocationBonus}`);
  capacity += vocationBonus;

  return capacity; // Retornar o valor sem divisão
};

Skills.prototype.getSkillValue = function (type) {
  /*
   * Function Skills.getSkillValue
   * Sets a range property to the maximum
   */

  let skill = this.__getSkill(type);

  if (skill === null) {
    return null;
  }

  return skill.toJSON();
};

Skills.prototype.getSkillLevel = function (type) {
  console.log(`Tentando obter skill level para type: ${type}`);

  let skill = this.__getSkill(type);

  if (skill === null) {
    console.log(`AVISO: Skill ${type} é null!`);
    return null;
  }

  // Vamos adicionar mais logs para debug
  console.log("Skill encontrada:", {
    type: type,
    value: skill.toJSON(),
    rawSkill: skill,
  });

  let vocation = this.__player.getVocation();
  let level = skill.getSkillLevel(vocation);
  console.log(
    `Skill ${type} level calculado: ${level} (vocation: ${vocation})`
  );

  return level;
};

Skills.prototype.setSkillLevel = function (type, level) {
  /*
   * Function Skills.setSkillLevel
   * Sets a particular skill to a particular level by calculating the number of required points
   */

  let skill = this.__getSkill(type);

  if (skill === null) {
    return;
  }

  // Determine the points required for a particular level
  let value = skill.getRequiredSkillPoints(level, this.__player.getVocation());

  // Set the property through the player properties
  this.__player.setProperty(type, value);
};

Skills.prototype.toJSON = function () {
  /*
   * Function Skills.toJSON
   * Serialization of the skills for the players
   */

  // Recover the values from the properties
  return new Object({
    magic: this.__getSkill(CONST.PROPERTIES.MAGIC),
    fist: this.__getSkill(CONST.PROPERTIES.FIST),
    club: this.__getSkill(CONST.PROPERTIES.CLUB),
    sword: this.__getSkill(CONST.PROPERTIES.SWORD),
    axe: this.__getSkill(CONST.PROPERTIES.AXE),
    distance: this.__getSkill(CONST.PROPERTIES.DISTANCE),
    shielding: this.__getSkill(CONST.PROPERTIES.SHIELDING),
    fishing: this.__getSkill(CONST.PROPERTIES.FISHING),
    experience: this.__getSkill(CONST.PROPERTIES.EXPERIENCE),
  });
};

Skills.prototype.__getSkill = function (type) {
  /*
   * Function Skills.__getSkill
   * Returns the skill of a particular type from the player properties
   */

  let skill = this.__player.getProperty(type);

  if (skill === null) {
    return null;
  }

  // Must be of type skill
  if (!(skill instanceof Skill)) {
    return null;
  }

  return skill;
};

Skills.prototype.__addSkillProperty = function (type, points) {
  /*
   * Function Skills.__addSkillProperty
   * Adds a skill to the map of properties
   */

  // Add the skills to the player properties
  this.__player.properties.add(type, new Skill(type, points));
};

module.exports = Skills;
