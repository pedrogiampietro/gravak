const Condition = requireModule("combat/condition");

module.exports = function useTrunk(player) {

  return player.hasCondition(Condition.prototype.MAGIC_FLAME);

}