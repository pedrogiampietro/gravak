module.exports = function useSewerGrate(player, tile, index, item) {

  // Only allowed when not moving
  if (player.isMoving()) {
    return true;
  }

  // Teleport the player and 
  process.gameServer.world.creatureHandler.teleportCreature(player, tile.position.down());
  player.movementHandler.__moveLock.lock(10);

  return true;

}
