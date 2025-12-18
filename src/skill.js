"use strict";

const Skill = function(type, points) {

  /*
   * Class Skill
   * Wrapper for the character skills that can be trained
   *
   * API:
   *
   * Skill.toJSON - Serializes the object to JSON
   * Skill.increment - Increments the number of skill points with a value
   * Skill.getSkillLevel - Returns the skill level that belongs to a particular skill
   * 
   */

  // The total number of points and type of the skill
  this.__points = points;
  this.__type = type;

}

Skill.prototype.__getVocationConstant = function(vocation) {

  /*
   * Function Skill.__getVocationConstant
   * Returns the vocation skill constant for each skill
   * See https://tibia.fandom.com/wiki/Formulae#Skills
   */

  if(vocation === CONST.VOCATION.NONE) {
    switch(this.__type) {
      case CONST.PROPERTIES.MAGIC:
        return 3.0;
      case CONST.PROPERTIES.CLUB:
      case CONST.PROPERTIES.SWORD:
      case CONST.PROPERTIES.AXE:
      case CONST.PROPERTIES.DISTANCE:
        return 2.0;
      case CONST.PROPERTIES.FIST:
      case CONST.PROPERTIES.SHIELDING:
        return 1.5;
      case CONST.PROPERTIES.FISHING:
        return 1.1;
    }
  } else if(vocation === CONST.VOCATION.KNIGHT) {
    switch(this.__type) {
      case CONST.PROPERTIES.MAGIC:
        return 3.0;
      case CONST.PROPERTIES.CLUB:
      case CONST.PROPERTIES.SWORD:
      case CONST.PROPERTIES.AXE:
      case CONST.PROPERTIES.FIST:
      case CONST.PROPERTIES.SHIELDING:
      case CONST.PROPERTIES.FISHING:
        return 1.1;
      case CONST.PROPERTIES.DISTANCE:
        return 1.4;
    }
  } else if(vocation === CONST.VOCATION.PALADIN) {
    switch(this.__type) {
      case CONST.PROPERTIES.MAGIC:	
        return 1.4;
      case CONST.PROPERTIES.CLUB:
      case CONST.PROPERTIES.SWORD:
      case CONST.PROPERTIES.AXE:
      case CONST.PROPERTIES.FIST:
        return 1.2;
      case CONST.PROPERTIES.DISTANCE:
      case CONST.PROPERTIES.SHIELDING:
      case CONST.PROPERTIES.FISHING:
        return 1.1;
    }
  } else if(vocation === CONST.VOCATION.SORCERER) {
    switch(this.__type) {
      case CONST.PROPERTIES.MAGIC:
        return 1.1;
      case CONST.PROPERTIES.CLUB:
      case CONST.PROPERTIES.SWORD:
      case CONST.PROPERTIES.AXE:
      case CONST.PROPERTIES.DISTANCE:
        return 2.0;
      case CONST.PROPERTIES.FIST:
      case CONST.PROPERTIES.SHIELDING:
        return 1.5;
      case CONST.PROPERTIES.FISHING:
        return 1.1;
    }   
  } else if(vocation === CONST.VOCATION.DRUID) {
    switch(this.__type) {
      case CONST.PROPERTIES.MAGIC:
        return 1.1;
      case CONST.PROPERTIES.CLUB:
      case CONST.PROPERTIES.SWORD:
      case CONST.PROPERTIES.AXE:
      case CONST.PROPERTIES.DISTANCE:
        return 1.8;
      case CONST.PROPERTIES.FIST:
      case CONST.PROPERTIES.SHIELDING:
        return 1.5;
      case CONST.PROPERTIES.FISHING:
        return 1.1;
    }   
  }

  return NaN;

}

Skill.prototype.increment = function(value) {

  /*
   * Function Skill.increment
   * Increments the skill with a number of spent points
   * See https://tibia.fandom.com/wiki/Formulae#Skills
   */

  // Add the points
  this.__points += value;

}

Skill.prototype.get = function() {

  /*
   * Function Skill.increment
   * Increments the skill with a number of spent points
   * See https://tibia.fandom.com/wiki/Formulae#Skills
   */

  return this.__points;

}

Skill.prototype.set = function(points) {

  /*
   * Function Skill.increment
   * Increments the skill with a number of spent points
   * See https://tibia.fandom.com/wiki/Formulae#Skills
   */

  // Add the points
  this.__points = points;

}

Skill.prototype.__getSkillConstant = function() {

  /*
   * Function Skill.__getSkillConstant
   * Returns the constant for each skill
   */

  switch(this.__type) {
    case CONST.PROPERTIES.MAGIC:
      return 1600;
    case CONST.PROPERTIES.FIST:
    case CONST.PROPERTIES.CLUB:
    case CONST.PROPERTIES.SWORD:
    case CONST.PROPERTIES.AXE:
      return 50;
    case CONST.PROPERTIES.DISTANCE:
      return 25;
    case CONST.PROPERTIES.SHIELDING:
      return 100;
    case CONST.PROPERTIES.FISHING:
      return 20;
  }

  return NaN;

}

Skill.prototype.getExperience = function(x) {

  /*
   * Function Skill.getExperience
   * Returns the required experience for a particular level
   */

  return Math.round((50 / 3) * (Math.pow(x, 3) - 6 * Math.pow(x, 2) + 17 * x - 12));

}

Skill.prototype.getRequiredSkillPoints = function(x, vocation) {

  /*
   * Function Skill.getRequiredSkillPoints
   * Returns the number of required skill points
   */

  if(this.__type === CONST.PROPERTIES.EXPERIENCE) {
    return this.getExperience(x);
  }

  let { skillOffset, A, B } = this.__getSkillConstants(vocation);

  return A * ((Math.pow(B, x - skillOffset) - 1) / (B - 1));

}

Skill.prototype.__getSkillConstants = function(vocation) {

  /*
   * Function Skill.__getSkillConstants
   * Returns the skill constants
   */

  // The offset (magic starts at level 0; other skills at 10)
  let skillOffset = (this.__type === CONST.PROPERTIES.MAGIC) ? 0 : 10;

  // Constants
  let A = this.__getSkillConstant();
  let B = this.__getVocationConstant(vocation);

  return { skillOffset, A, B }

}

Skill.prototype.getSkillLevel = function(vocation) {

  /*
   * Function Skill.getSkillLevel
   * Returns the skill based on the current number of skill points for a given vocation
   */

  // Special handler for experience "skill" through binary search
  if(this.__type === CONST.PROPERTIES.EXPERIENCE) {
    return this.EXPERIENCE_TABLE.getClosestDown(this.__points);
  }

  let { skillOffset, A, B } = this.__getSkillConstants(vocation);

  // Calculate the level based on the number of points
  return Math.floor(skillOffset + (Math.log(this.__points * ((B - 1) / A) + 1) / Math.log(B)));

}

Skill.prototype.toJSON = function() {

  /*
   * Function Skill.toJSON
   * Serializes the class to JSON
   */

  return this.__points;

}

// Lookup table to determine level from given experience
Skill.prototype.EXPERIENCE_TABLE = Array.from({"length": 1000}, (_, i) => i + 1).map(Skill.prototype.getExperience);

module.exports = Skill;
