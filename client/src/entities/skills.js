const Skills = function (skills) {

  this.__skills = skills;

  // Store level for external access
  this.level = skills.level || 1;

  // Experience table for calculating percentage to next level
  this.__experienceTable = Array.from({ length: 1000 }, (_, i) => {
    let x = i + 1;
    return Math.round((50 / 3) * (Math.pow(x, 3) - 6 * Math.pow(x, 2) + 17 * x - 12));
  });

  Object.entries(this.__skills).forEach(function ([key, value]) {
    let displayValue = value;
    let percentage = Math.random() * 100;

    // For experience, just display it as-is (level comes separately from server)
    if (key === "experience") {
      displayValue = value || 0;
      // Calculate percentage to next level using the level from server
      let level = this.level || 1;
      let currentLevelExp = this.__experienceTable[level - 1] || 0;
      let nextLevelExp = this.__experienceTable[level] || currentLevelExp + 1000;
      if (nextLevelExp > currentLevelExp) {
        percentage = ((displayValue - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
      } else {
        percentage = 0;
      }
    }

    // Level comes directly from server - just display it
    if (key === "level") {
      displayValue = value || 1;
      percentage = 0; // Level doesn't have a progress bar
    }

    gameClient.interface.windowManager.getWindow("skill-window").setSkillValue(key, displayValue, percentage);
  }.bind(this));

}
