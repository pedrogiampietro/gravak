"use strict";

const Position = requireModule("position");

const CharacterProperties = function(player, stats) {

  /*
   * Class CharacterProperties
   * Container for player statistics and properties
   */

  // Circular reference the player
  this.__player = player;

  // Save properties
  this.vocation = stats.vocation;
  this.role = stats.role;
  this.sex = stats.sex;
  this.maxCapacity = stats.maxCapacity;

  // Save the temple position
  this.templePosition = Position.prototype.fromLiteral(stats.templePosition);

  // The mounts and outfits available for the character
  this.availableOutfits = new Set(stats.availableOutfits);
  this.availableMounts = new Set(stats.availableMounts)

}

CharacterProperties.prototype.setTemplePosition = function(position) {

  /*
   * Function CharacterProperties.setTemplePosition
   * Sets the temple position of the character
   */

  this.templePosition = position;

}

CharacterProperties.prototype.toJSON = function() {

  /*
   * Function CharacterProperties.toJSON
   * Serialization of the player statistics to JSON
   */

  return new Object({
    "role": this.role,
    "vocation": this.vocation,
    "sex": this.sex,
    "templePosition": this.templePosition,
    "maxCapacity": this.maxCapacity,
    "availableMounts": Array.from(this.availableMounts),
    "availableOutfits": Array.from(this.availableOutfits)
  });

}

module.exports = CharacterProperties;
