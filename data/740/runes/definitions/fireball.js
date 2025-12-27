module.exports = function greatFireball(source, target) {

  /*
   * function greatFireball
   * Code that handles the great fireball rune
   * GFB rune deals fire damage in a circular area (37 sqms - radius 3)
   */

  // Send distance effect from source to target
  process.gameServer.world.sendDistanceEffect(source.position, target.position, CONST.EFFECT.PROJECTILE.FIRE);

  // Calculate random damage between 80-120 (typical GFB damage in Tibia 7.4)
  let minDamage = 80;
  let maxDamage = 120;

  // Get circle positions around the target position (radius 3 for ~37 sqms)
  let areaPositions = target.position.getRadius(3);

  areaPositions.forEach(function (position) {

    let tile = process.gameServer.world.getTileFromWorldPosition(position);

    if (tile === null) {
      return;
    }

    // Skip blocked tiles
    if (tile.isBlockSolid()) {
      return;
    }

    // Send fire magic effect on the tile
    process.gameServer.world.sendMagicEffect(position, CONST.EFFECT.MAGIC.FIREAREA);

    // Apply damage to all monsters on the tile
    tile.monsters.forEach(function (monster) {
      let damage = Number.prototype.random(minDamage, maxDamage);
      process.gameServer.world.__damageEntity(source, monster, damage, CONST.COLOR.ORANGE);
    });

    // Apply damage to all players on the tile (except the source)
    tile.players.forEach(function (player) {
      if (player !== source) {
        let damage = Number.prototype.random(minDamage, maxDamage);
        process.gameServer.world.__damageEntity(source, player, damage, CONST.COLOR.ORANGE);
      }
    });

  });

  return true;

}

