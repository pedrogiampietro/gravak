"use strict";

const Skill = requireModule("skill");

const PlayerSkills = function(player, points) {

  /*
   * Class PlayerSkills
   * Wrapper for the player skills
   *
   * API:
   *
   * PlayerSkills.getSkill(type) - returns the a skill of particular type
   * PlayerSkills.getSkillPoints(type) - returns the skill points in a particular skill
   * PlayerSkills.getSkillLevel(type) - returns the skill level in a particular skill (based on points)
   * PlayerSkills.hasSkill(type) - returns true if the skill exists
   * PlayerSkills.increment(type, value) - increments the skill type by the specified value
   * PlayerSkills.setSkillLevel(type, level) - sets the skill level of a particular type
   * PlayerSkills.setSkillValue(type, value) - sets the number of skill points
   * PlayerSkills.toJSON - serializes the skills from memory to JSON
   *
   */

  // Circular reference
  this.__player = player;

  // Add all these skills as player properties
  this.__addSkill(CONST.PROPERTIES.MAGIC, points.magic);
  this.__addSkill(CONST.PROPERTIES.FIST, points.fist);
  this.__addSkill(CONST.PROPERTIES.CLUB, points.club);
  this.__addSkill(CONST.PROPERTIES.SWORD, points.sword);
  this.__addSkill(CONST.PROPERTIES.AXE, points.axe);
  this.__addSkill(CONST.PROPERTIES.DISTANCE, points.distance);
  this.__addSkill(CONST.PROPERTIES.SHIELDING, points.shielding);
  this.__addSkill(CONST.PROPERTIES.FISHING, points.fishing);
  this.__addSkill(CONST.PROPERTIES.EXPERIENCE, points.experience);

}

PlayerSkills.prototype.setSkillLevel = function(type, level) {

  /*
   * Function PlayerSkills.setSkillLevel
   * Sets a particular skill to a particular level
   */

  let skill = this.getSkill(type);
  
  if(skill === null) {
    return;
  }

  // Determine the points required for a particular level
  let value = skill.getRequiredSkillPoints(level, this.__player.getVocation());

  this.setSkillPoints(type, value);

}

PlayerSkills.prototype.toJSON = function() {

  /*
   * Function PlayerSkills.toJSON
   * Serialization of the skills for the players
   */

  return new Object({
    "magic": this.__player.getProperty(CONST.PROPERTIES.MAGIC),
    "fist": this.__player.getProperty(CONST.PROPERTIES.FIST),
    "club": this.__player.getProperty(CONST.PROPERTIES.CLUB),
    "sword": this.__player.getProperty(CONST.PROPERTIES.SWORD),
    "axe": this.__player.getProperty(CONST.PROPERTIES.AXE),
    "distance": this.__player.getProperty(CONST.PROPERTIES.DISTANCE),
    "shielding": this.__player.getProperty(CONST.PROPERTIES.SHIELDING),
    "fishing": this.__player.getProperty(CONST.PROPERTIES.FISHING),
    "experience": this.__player.getProperty(CONST.PROPERTIES.EXPERIENCE)
  });

}

PlayerSkills.prototype.hasSkill = function(type) {

  /*
   * Function PlayerSkills.hasSkill
   * Returns true if the skill class has a skill of particular type
   */

  return this.__player.properties.hasProperty(type);

}

PlayerSkills.prototype.getSkill = function(type) {

  /*
   * Function PlayerSkills.getSkill
   * Returns the skill (if exists) of a particular type
   */

  if(!this.hasSkill(type)) {
    return null;
  }

  // Read from property
  return this.__player.getProperty(type);

}

PlayerSkills.prototype.getSkillPoints = function(type) {

  /*
   * Function PlayerSkills.getSkillPoints
   * Returns the current points of a particular skill
   */

  let skill = this.getSkill(type);

  if(skill === null) {
    return null;
  }

  return skill.getSkillPoints();

}

PlayerSkills.prototype.getSkillLevel = function(type) {

  /*
   * Function PlayerSkills.getSkillLevel
   * Returns the current skill level of the player
   */

  let skill = this.getSkill(type);

  if(skill === null) {
    return null;
  }

  return skill.getSkillLevel(this.__player.getVocation());

}

PlayerSkills.prototype.setSkillValue = function(type, value) {

  /*
   * Function PlayerSkills.setSkillValue
   * Wrapper function to update the skill value to a particular value
   */

  let skill = this.getSkill(type);
  
  if(skill === null) {
    return;
  }

  // Set and see if skill level changed
  let current = this.getSkillLevel(type);
  skill.setSkillPoints(value);
  let now = this.getSkillLevel(type);

  // Emit if changed
  if(current !== now) {
    this.__player.emit("skill", type, current, now);
  }

}

PlayerSkills.prototype.increment = function(type, value) {

  /*
   * Function PlayerSkills.increment
   * Increments by the player skill by a specific value
   */

  let skill = this.getSkill(type);
  
  if(skill === null) {
    return;
  }

  // Add the passed value to the current value
  this.setSkillValue(type, skill.getSkillPoints() + value);

}

PlayerSkills.prototype.__addSkill = function(type, points) {

  /*
   * Function PlayerSkills.__addSkill
   * Adds a skill to the map of skills
   */

  // Add to the player properties
  this.__player.properties.addProperty(type, new Skill(type, points));

}

module.exports = PlayerSkills;
