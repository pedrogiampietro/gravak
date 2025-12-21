const Condition = requireModule("combat/condition");

module.exports = function morph(properties) {

  this.addCondition(Condition.prototype.MORPH, 1, 100, {"id": CONST.LOOKTYPES.OTHER.GAMEMASTER});

  return 100;

}
