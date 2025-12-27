module.exports = function suddenDeath(source, target) {

  /*
   * function suddenDeath
   * Code that handles the sudden death rune
   * SD rune deals high death damage to a single target
   */

  // If no monsters on the tile
  if (target.monsters.size === 0) {
    return false;
  }

  // Send distance effect from source to target
  process.gameServer.world.sendDistanceEffect(source.position, target.position, CONST.EFFECT.PROJECTILE.DEATH);

  // Send magic effect at the target position
  process.gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.MORTAREA);

  // Calculate random damage between 150-200 (typical SD damage in Tibia 7.4)
  let minDamage = 150;
  let maxDamage = 200;

  // Apply damage to all monsters on the tile
  target.monsters.forEach(function (monster) {
    let damage = Number.prototype.random(minDamage, maxDamage);
    process.gameServer.world.__damageEntity(source, monster, damage, CONST.COLOR.WHITE);
  });

  return true;

}
