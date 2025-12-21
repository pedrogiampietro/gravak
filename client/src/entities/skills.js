const Skills = function(skills) {

  this.__skills = skills;

  Object.entries(this.__skills).forEach(function([ key, value ]) {
    gameClient.interface.windowManager.getWindow("skill-window").setSkillValue(key, value, Math.random() * 100);
  });

}
