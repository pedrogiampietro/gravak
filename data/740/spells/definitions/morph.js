const Condition = requireModule("combat/condition");

module.exports = function morph(properties) {

  let id = (properties && properties.id) ? properties.id : CONST.LOOKTYPES.OTHER.GAMEMASTER;

  this.addCondition(Condition.prototype.MORPH, 1, 100, { "id": id });

  return 100;

}
