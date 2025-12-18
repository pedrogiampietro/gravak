"use strict";

const Position = requireModule("position");
const Outfit = requireModule("outfit");
const Property = requireModule("property");

const {
  CreaturePropertyPacket,
  OutfitPacket,
  EffectDistancePacket,
  EffectMagicPacket,
} = requireModule("protocol");

const CreatureProperties = function (creature, properties) {
  /*
   * Class CreatureProperties
   * Wrapper for the creature properties
   *
   * API:
   *
   * CreatureProperties.getId - returns the globally unique identifier of the creature
   * CreatureProperties.getFraction(type) - returns the fraction of a range property
   * CreatureProperties.isFull(type) - returns whether the range property is equal to its maximum
   *
   */

  // Reference parent
  this.__creature = creature;

  // The globally unique identifier of the creature
  this.__guid = gameServer.world.creatureHandler.assignUID();

  // The map of properties
  this.__properties = new Map();

  // Properties that all creatures share
  this.add(CONST.PROPERTIES.NAME, properties.name);
  this.add(CONST.PROPERTIES.SPEED, properties.speed);
  this.add(CONST.PROPERTIES.DEFENSE, properties.defense);
  this.add(CONST.PROPERTIES.ATTACK, properties.attack);
  this.add(CONST.PROPERTIES.ATTACK_SPEED, properties.attackSpeed);
  this.add(
    CONST.PROPERTIES.DIRECTION,
    properties.direction ?? CONST.DIRECTION.NORTH
  );
  this.add(CONST.PROPERTIES.HEALTH, properties.health);
  this.add(CONST.PROPERTIES.HEALTH_MAX, properties.health);
  this.add(CONST.PROPERTIES.MANA, properties.mana);
  this.add(CONST.PROPERTIES.MANA_MAX, properties.mana);
  this.add(CONST.PROPERTIES.OUTFIT, new Outfit(properties.outfit));
};

CreatureProperties.prototype.getId = function () {
  /*
   * Function CreatureProperties.getId
   * Returns the unique identifier of the creature
   */

  return this.__guid;
};

CreatureProperties.prototype.incrementProperty = function (type, amount) {
  /*
   * Function CreatureProperties.incrementProperty
   * Adds an amount to the property
   */

  let value = this.getProperty(type);

  if (value === null) {
    return console.warn(
      "Property of unknown type %s with value %s.".format(type, value)
    );
  }

  // Update the property
  this.setProperty(type, value + amount);
};

CreatureProperties.prototype.setProperty = function (type, value) {
  /*
   * Function CreatureProperties.setProperty
   * Internally sets the property of a creature
   */

  // Add debug logs for health properties
  if (
    type === CONST.PROPERTIES.HEALTH ||
    type === CONST.PROPERTIES.HEALTH_MAX
  ) {
    console.log("=== DEBUG CREATURE PROPERTIES SET ===");
    console.log(`Setting property type: ${type}`);
    console.log(`Current value: ${this.getProperty(type)}`);
    console.log(`New value: ${value}`);
  }

  let property = this.getProperty(type);

  if (property === null) {
    return console.warn(
      "Property of unknown type %s with value %s.".format(type, value)
    );
  }

  // Unchanged: do nothing
  if (property === value) {
    return;
  }

  if (type === CONST.PROPERTIES.MANA) {
    value = value.clamp(0, this.getProperty(CONST.PROPERTIES.MANA_MAX));
  } else if (type === CONST.PROPERTIES.HEALTH) {
    value = value.clamp(0, this.getProperty(CONST.PROPERTIES.HEALTH_MAX));
  }

  // Overwrite the property
  this.__properties.get(type).set(value);

  // Log after set
  if (
    type === CONST.PROPERTIES.HEALTH ||
    type === CONST.PROPERTIES.HEALTH_MAX
  ) {
    console.log(
      `After set in CreatureProperties - Value: ${this.getProperty(type)}`
    );
  }

  // Special handling
  if (type === CONST.PROPERTIES.HEALTH_MAX) {
    this.setProperty(
      CONST.PROPERTIES.HEALTH,
      this.getProperty(CONST.PROPERTIES.HEALTH)
    );
  } else if (type === CONST.PROPERTIES.MANA_MAX) {
    this.setProperty(
      CONST.PROPERTIES.MANA,
      this.getProperty(CONST.PROPERTIES.MANA)
    );
  }

  // Get the packet to send
  let packet = this.__getCreaturePropertyPacket(type, value);

  // All property types above 12 are private to the player
  if (type > 12) {
    return this.__creature.write(packet);
  }

  // Inform the spectators or the player of the property change
  return this.__creature.broadcast(packet);
};

CreatureProperties.prototype.__getCreaturePropertyPacket = function (
  type,
  value
) {
  /*
   * Function CreatureProperties.__getCreaturePropertyPacket
   * Returns the packet to write
   */

  switch (type) {
    case CONST.PROPERTIES.NAME:
      return null;
    case CONST.PROPERTIES.OUTFIT:
      return new OutfitPacket(this.getId(), value);
    case CONST.PROPERTIES.MOUNTS:
    case CONST.PROPERTIES.OUTFITS:
      return null;

    // All these are single valued properties (between 0 and 4,294,967,295)
    case CONST.PROPERTIES.HEALTH:
    case CONST.PROPERTIES.HEALTH_MAX:
    case CONST.PROPERTIES.MANA:
    case CONST.PROPERTIES.MANA_MAX:
    case CONST.PROPERTIES.SPEED:
    case CONST.PROPERTIES.DEFENSE:
    case CONST.PROPERTIES.ATTACK:
    case CONST.PROPERTIES.ATTACK_SPEED:
    case CONST.PROPERTIES.DIRECTION:
    case CONST.PROPERTIES.CAPACITY:
    case CONST.PROPERTIES.CAPACITY_MAX:
    case CONST.PROPERTIES.SEX:
    case CONST.PROPERTIES.ROLE:
    case CONST.PROPERTIES.VOCATION:
    case CONST.PROPERTIES.MAGIC:
    case CONST.PROPERTIES.FIST:
    case CONST.PROPERTIES.CLUB:
    case CONST.PROPERTIES.SWORD:
    case CONST.PROPERTIES.AXE:
    case CONST.PROPERTIES.DISTANCE:
    case CONST.PROPERTIES.SHIELDING:
    case CONST.PROPERTIES.FISHING:
    case CONST.PROPERTIES.EXPERIENCE:
      return new CreaturePropertyPacket(this.getId(), type, value);
  }

  return null;
};

CreatureProperties.prototype.has = function (type) {
  /*
   * Function CreatureProperties.has
   * Returns true if the creature has a property
   */

  return this.__properties.has(type);
};

CreatureProperties.prototype.add = function (type, value) {
  /*
   * Function CreatureProperties.add
   * Adds a skill to the map of skills
   */

  // Add it to the map
  this.__properties.set(type, new Property(value));
};

CreatureProperties.prototype.toJSON = function () {
  /*
   * Function CreatureProperties.toJSON
   * Serializes the class to a JSON object
   */

  return new Object({
    name: this.__properties.get(CONST.PROPERTIES.NAME),
    health: this.__properties.get(CONST.PROPERTIES.HEALTH),
    mana: this.__properties.get(CONST.PROPERTIES.MANA),
    speed: this.__properties.get(CONST.PROPERTIES.SPEED),
    defense: this.__properties.get(CONST.PROPERTIES.DEFENSE),
    attack: this.__properties.get(CONST.PROPERTIES.ATTACK),
    attackSpeed: this.__properties.get(CONST.PROPERTIES.ATTACK_SPEED),
    direction: this.__properties.get(CONST.PROPERTIES.DIRECTION),
    outfit: this.__properties.get(CONST.PROPERTIES.OUTFIT),
    role: this.__properties.get(CONST.PROPERTIES.ROLE),
    vocation: this.__properties.get(CONST.PROPERTIES.VOCATION),
    sex: this.__properties.get(CONST.PROPERTIES.SEX),
    availableMounts: this.__properties.get(CONST.PROPERTIES.MOUNTS),
    availableOutfits: this.__properties.get(CONST.PROPERTIES.OUTFITS),
  });
};

CreatureProperties.prototype.getProperty = function (type) {
  /*
   * Function CreatureProperties.getProperty
   * Returns a property of a particular type
   */

  // NOEXIST
  if (!this.has(type)) {
    return null;
  }

  return this.__properties.get(type).get();
};

CreatureProperties.prototype.getStepDuration = function (friction) {
  /*
   * Function CreatureProperties.prototype.getStepDuration
   * Math to calcualte the amount of frames to lock when walking (50MS tick)
   * See: https://tibia.fandom.com/wiki/Speed_Breakpoints
   */

  // Constants
  const A = 857.36;
  const B = 261.29;
  const C = -4795.009;

  let speed = this.getProperty(CONST.PROPERTIES.SPEED);

  // Logarithm of speed with some constants (never less than 1)
  let calculatedStepSpeed = Math.max(
    1,
    Math.round(A * Math.log(speed + B) + C)
  );

  return Math.ceil(
    Math.floor((1e3 * friction) / calculatedStepSpeed) /
      CONFIG.SERVER.MS_TICK_INTERVAL
  );
};

module.exports = CreatureProperties;
