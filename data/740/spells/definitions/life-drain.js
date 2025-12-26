module.exports = function lifeDrain() {

  /*
   * Function lifeDrain
   * Drains life from target and heals the caster
   */

  // Need a target to drain life from
  if (!this.hasTarget()) {
    this.sendCancelMessage("You need a target to use this spell.");
    return 0; // Return 0 to indicate spell failed
  }

  let target = this.getTarget();

  // Check if target is valid and in range
  if (!target || target.isDead) {
    this.sendCancelMessage("Target is not valid.");
    return 0;
  }

  // Calculate damage (scales with level)
  let level = this.skills ? this.skills.getSkillLevel(CONST.PROPERTIES.EXPERIENCE) : 1;
  let amount = Number.prototype.random(5 + Math.floor(level / 5), 10 + Math.floor(level / 3));

  // Heal the caster
  this.increaseHealth(amount);
  process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_GREEN);

  // Damage the target
  target.decreaseHealth(this, amount, CONST.COLOR.RED);
  process.gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.MAGIC_RED);

  return 50;

}