const DamageMapEntry = function() {

  this.damage = 0;
  this.aggro = 0;

}

DamageMapEntry.prototype.addDamage = function(amount) {

  this.damage = this.damage + amount;

}

module.exports = DamageMapEntry;
