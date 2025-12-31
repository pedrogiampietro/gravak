const Condition = requireModule("combat/condition");

module.exports = function spellLight(properties) {

  process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_BLUE);
  this.sayEmote("Parva Lux!", CONST.COLOR.SKYBLUE);

  if (!this.addCondition(Condition.prototype.LIGHT, 5000, 1)) {
    return 0;
  }

  // Update quest "The Magician"
  if (this.getStorage(2001) !== 1) {
    this.setStorage(2001, 1);
  }

  return 50;

}