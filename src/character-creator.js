"use strict";

const Position = requireModule("position");
const Outfit = requireModule("outfit");

const CharacterCreator = function() {

  /*
   * Class CharacterCreator
   * Handler for the creation of new characters
   */

  this.blueprint = new Object({
    "position": new Position(32097, 32215, 8),
    "templePosition": new Position(32097, 32215, 8),
    "properties": {
      "vocation": CONST.VOCATION.NONE,
      "role": CONST.ROLES.NONE,
      "sex": CONST.SEX.MALE,
      "maxCapacity": 2000,
      "availableMounts": [],
      "availableOutfits": [],
      "name": "Unknown",
      "attack": 4,
      "attackSpeed": 20,
      "defense": 2,
      "direction": CONST.DIRECTION.NORTH,
      "health": 150,
      "mana": 35,
      "outfit": new Outfit({
        "id": 0,
        "details": {
          "head": 78,
          "body": 69,
          "legs": 58,
          "feet": 76
        },
        "mount": 0,
        "mounted": false,
        "addonOne": false,
        "addonTwo": false
      }),
      "speed": 1020
    },
    "skills": {
      "experience": 0,
      "magic": 0,
      "fist": 10,
      "club": 10,
      "sword": 10,
      "axe": 10,
      "distance": 10,
      "shielding": 10,
      "fishing": 10
    },
    "spellbook": {
      "availableSpells": [],
      "cooldowns": []
    },
    "containers": {
      "keyring": [],
      "depot": [],
      "inbox": [],
      "equipment": [{"slot": 6, "item": {"id": 1988}}],
    },
    "friends": []
  });

}

CharacterCreator.prototype.create = function(name, sex) {

  /*
   * CharacterCreator.create
   * Creates a new character with the given properties
   */

  // Memory copy of the template
  let copiedTemplate = JSON.parse(JSON.stringify(this.blueprint));

  // Replace the character name
  copiedTemplate.properties.name = name;

  // And sex specific attributes
  if(sex === "male") {
    copiedTemplate.properties.sex = CONST.SEX.MALE;
    copiedTemplate.properties.outfit.id = CONST.LOOKTYPES.MALE.CITIZEN;
    copiedTemplate.properties.availableOutfits = new Array(
      CONST.LOOKTYPES.MALE.CITIZEN,
      CONST.LOOKTYPES.MALE.HUNTER,
      CONST.LOOKTYPES.MALE.MAGE,
      CONST.LOOKTYPES.MALE.KNIGHT
    );
  } else if(sex === "female") {
    copiedTemplate.properties.sex = CONST.SEX.FEMALE;
    copiedTemplate.properties.outfit.id = CONST.LOOKTYPES.FEMALE.CITIZEN;
    copiedTemplate.properties.availableOutfits = new Array(
      CONST.LOOKTYPES.FEMALE.CITIZEN,
      CONST.LOOKTYPES.FEMALE.HUNTER,
      CONST.LOOKTYPES.FEMALE.MAGE,
      CONST.LOOKTYPES.FEMALE.KNIGHT
    );
  }

  // Return the template as a string to write it to the filesystem
  return JSON.stringify(copiedTemplate);

}


module.exports = CharacterCreator;
