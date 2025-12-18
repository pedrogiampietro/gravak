module.exports = function explosion() {

  /*
   * Function explosion
   * Attack spell that damages target or tile in front
   */

  let target = null;
  let effectPosition = null;

  // Check if player has a target
  if (this.isPlayer() && this.getTarget()) {
    target = this.getTarget();
    effectPosition = target.position;
  } else {
    // No target - get tile in front based on direction
    let direction = this.getProperty(CONST.PROPERTIES.DIRECTION);
    effectPosition = this.position.getPositionFromDirection(direction);

    // Check if there's a creature on that tile
    let tile = process.gameServer.world.getTileFromWorldPosition(effectPosition);
    if (tile && tile.hasOwnProperty("creatures") && tile.creatures.size > 0) {
      target = tile.creatures.values().next().value;
    }
  }

  // Send projectile effect from caster to target position
  if (effectPosition) {
    process.gameServer.world.sendDistanceEffect(this.position, effectPosition, CONST.EFFECT.PROJECTILE.FIRE);
  }

  // Apply damage if we have a target
  if (target) {
    process.gameServer.world.combatHandler.applyEnvironmentalDamage(target, 40, CONST.COLOR.ORANGE);
  }

  // Show explosion effect at position
  if (effectPosition) {
    process.gameServer.world.sendMagicEffect(effectPosition, CONST.EFFECT.MAGIC.HITBYFIRE);
  }

  return 50;

}