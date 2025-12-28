const Skills = function (skills, vocation) {

  this.__skills = skills;

  // Store level and vocation for external access
  this.level = skills.level || 1;

  // Store vocation from player data (0 = none, 1 = knight, 2 = paladin, 3 = sorcerer, 4 = druid)
  this.vocation = vocation || 0;

  // Experience table for calculating percentage to next level
  this.__experienceTable = Array.from({ length: 1000 }, (_, i) => {
    let x = i + 1;
    return Math.round((50 / 3) * (Math.pow(x, 3) - 6 * Math.pow(x, 2) + 17 * x - 12));
  });

  Object.entries(this.__skills).forEach(function ([key, value]) {
    let displayValue = value;
    let percentage = 0;

    // For experience, calculate percentage to next level
    if (key === "experience") {
      displayValue = value || 0;
      let level = this.level || 1;
      let currentLevelExp = this.__experienceTable[level - 1] || 0;
      let nextLevelExp = this.__experienceTable[level] || currentLevelExp + 1000;
      if (nextLevelExp > currentLevelExp) {
        percentage = ((displayValue - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
      }
    }
    // Level doesn't have a progress bar
    else if (key === "level") {
      displayValue = value || 1;
      percentage = 0;
    }
    // For regular skills (magic, fist, club, etc.), calculate percentage
    else {
      let points = value || 0;
      let skillLevel = this.__getSkillLevel(key, points);
      displayValue = skillLevel;

      // Calculate percentage to next skill level
      let currentLevelPoints = this.__getRequiredSkillPoints(key, skillLevel);
      let nextLevelPoints = this.__getRequiredSkillPoints(key, skillLevel + 1);

      if (nextLevelPoints > currentLevelPoints && points >= currentLevelPoints) {
        percentage = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
      }
    }

    gameClient.interface.windowManager.getWindow("skill-window").setSkillValue(key, displayValue, percentage);
  }.bind(this));

}

// Get the skill constant A based on skill type
Skills.prototype.__getSkillConstant = function (skillType) {
  switch (skillType) {
    case "magic": return 1600;
    case "fist":
    case "club":
    case "sword":
    case "axe": return 50;
    case "distance": return 25;
    case "shielding": return 100;
    case "fishing": return 20;
    default: return 50;
  }
}

// Get the vocation constant B based on vocation and skill type
// Matches server skill.js and packet-handler.js exactly
Skills.prototype.__getVocationConstant = function (skillType) {
  let vocation = this.vocation;

  if (vocation === 0) { // NONE
    switch (skillType) {
      case "magic": return 3.0;
      case "club":
      case "sword":
      case "axe":
      case "distance": return 2.0;
      case "fist":
      case "shielding": return 1.5;
      case "fishing": return 1.1;
    }
  } else if (vocation === 1) { // KNIGHT
    switch (skillType) {
      case "magic": return 3.0;
      case "club":
      case "sword":
      case "axe":
      case "fist":
      case "shielding":
      case "fishing": return 1.1;
      case "distance": return 1.4;
    }
  } else if (vocation === 2) { // PALADIN
    switch (skillType) {
      case "magic": return 1.4;
      case "club":
      case "sword":
      case "axe":
      case "fist": return 1.2;
      case "distance":
      case "shielding":
      case "fishing": return 1.1;
    }
  } else if (vocation === 3) { // SORCERER
    switch (skillType) {
      case "magic": return 1.1;
      case "club":
      case "sword":
      case "axe":
      case "distance": return 2.0;
      case "fist":
      case "shielding": return 1.5;
      case "fishing": return 1.1;
    }
  } else if (vocation === 4) { // DRUID
    switch (skillType) {
      case "magic": return 1.1;
      case "club":
      case "sword":
      case "axe":
      case "distance": return 1.8;
      case "fist":
      case "shielding": return 1.5;
      case "fishing": return 1.1;
    }
  }

  // Default fallback
  return 2.0;
}

// Get the skill level based on accumulated points
Skills.prototype.__getSkillLevel = function (skillType, points) {
  if (points <= 0) return skillType === "magic" ? 0 : 10;

  let skillOffset = (skillType === "magic") ? 0 : 10;
  let A = this.__getSkillConstant(skillType);
  let B = this.__getVocationConstant(skillType);

  // Inverse formula: level = offset + log(points * (B-1) / A + 1) / log(B)
  let level = Math.floor(skillOffset + (Math.log(points * ((B - 1) / A) + 1) / Math.log(B)));

  return Math.max(level, skillOffset);
}

// Get required points for a specific skill level
Skills.prototype.__getRequiredSkillPoints = function (skillType, level) {
  let skillOffset = (skillType === "magic") ? 0 : 10;

  if (level <= skillOffset) return 0;

  let A = this.__getSkillConstant(skillType);
  let B = this.__getVocationConstant(skillType);

  // Formula: points = A * ((B^(level - offset) - 1) / (B - 1))
  return Math.round(A * ((Math.pow(B, level - skillOffset) - 1) / (B - 1)));
}
