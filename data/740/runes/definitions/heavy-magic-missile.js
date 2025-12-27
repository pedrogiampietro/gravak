module.exports = function heavyMagicMissile(source, target) {

  /*
   * function heavyMagicMissile
   * Code that handles the heavy magic missile rune
   * HMM rune deals energy damage to a single target
   */

  // If no monsters on the tile
  if (target.monsters.size === 0) {
    return false;
  }

  // Send distance effect from source to target
  process.gameServer.world.sendDistanceEffect(source.position, target.position, CONST.EFFECT.PROJECTILE.ENERGY);

  // Send magic effect at the target position
  process.gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.ENERGYHIT);

  // Calculate random damage between 40-60 (typical HMM damage in Tibia 7.4)
  let minDamage = 40;
  let maxDamage = 60;

  // Apply the damage to all monsters on the tile
  target.monsters.forEach(function (monster) {
    let damage = Number.prototype.random(minDamage, maxDamage);
    process.gameServer.world.__damageEntity(source, monster, damage, CONST.COLOR.LIGHTBLUE);
  });

  return true;

}
