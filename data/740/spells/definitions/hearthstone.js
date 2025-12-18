module.exports = function Hearthstone(properties) {

  /*
   * Function Hearthstone
   * Teleports the player to his/her temple position
   */

  gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.POFF);
  gameServer.world.creatureHandler.teleportCreature(this, this.characterStatistics.templePosition);
  gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.TELEPORT);

  return 100;

}
