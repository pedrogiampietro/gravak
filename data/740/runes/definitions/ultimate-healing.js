module.exports = function ultimateHealing(source, target) {

  /*
   * function ultimateHealing
   * Code that handles the ultimate healing rune
   * UH rune heals a player on the target tile
   */

  // If no players on the tile
  if (target.players.size === 0) {
    return false;
  }

  // Send magic effect at the target position
  process.gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.MAGIC_BLUE);

  // Calculate random healing between 300-400 (typical UH healing in Tibia 7.4)
  let minHealing = 300;
  let maxHealing = 400;

  // Apply healing to all players on the tile
  target.players.forEach(function (player) {
    let healAmount = Number.prototype.random(minHealing, maxHealing);
    player.increaseHealth(healAmount);

    // Send healing emote (green color for healing)
    player.broadcast(new (requireModule("network/protocol")).EmotePacket(player, "+" + healAmount, CONST.COLOR.LIGHTGREEN));
  });

  return true;

}