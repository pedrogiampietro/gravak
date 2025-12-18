"use strict";

const ConditionManager = requireModule("condition-manager");
const CreatureProperties = requireModule("creature-properties");
const EventEmitter = requireModule("eventemitter");
const SpeechHandler = requireModule("speech-handler");
const {
  CreatureForgetPacket,
  CreatureStatePacket,
  OutfitPacket,
  CreatureInfoPacket,
} = requireModule("protocol");

const Creature = function (properties) {
  /*
   * Class Creature
   * Base container for all creatures (npc, monster, player)
   *
   */

  // Inherits from event emitter
  EventEmitter.call(this);

  // All creatures begin with no position
  this.position = null;

  // The properties of the creature
  this.properties = new CreatureProperties(this, properties);

  // The conditions that are affecting the creature
  this.conditions = new ConditionManager(this);

  // For saying things
  this.speechHandler = new SpeechHandler(this);
};

// Set the prototype and constructor
Creature.prototype = Object.create(EventEmitter.prototype);
Creature.prototype.constructor = Creature;

Creature.prototype.setProperty = function (type, value) {
  /*
   * Function Creature.prototype.setProperty
   * Sets the value of an existing property of the creature
   */

  return this.properties.setProperty(type, value);
};

Creature.prototype.isFull = function (type) {
  /*
   * Function Creature.prototype.isFull
   * Returns true if the property is a range property and its value is equal to its maximum
   */

  return this.properties.isFull(type);
};

Creature.prototype.isFull = function (type) {
  /*
   * Function Creature.prototype.isFull
   * Returns the property of a specific type
   */

  switch (type) {
    case CONST.PROPERTIES.HEALTH:
      return (
        this.getProperty(CONST.PROPERTIES.HEALTH) ===
        this.getProperty(CONST.PROPERTIES.HEALTH_MAX)
      );
    case CONST.PROPERTIES.MANA:
      return (
        this.getProperty(CONST.PROPERTIES.MANA) ===
        this.getProperty(CONST.PROPERTIES.MANA_MAX)
      );
  }

  return false;
};

Creature.prototype.setFull = function (type) {
  /*
   * Function Creature.prototype.isFull
   * Returns the property of a specific type
   */

  switch (type) {
    case CONST.PROPERTIES.HEALTH:
      return this.setProperty(
        CONST.PROPERTIES.HEALTH,
        this.getProperty(CONST.PROPERTIES.HEALTH_MAX)
      );
    case CONST.PROPERTIES.MANA:
      return this.setProperty(
        CONST.PROPERTIES.MANA,
        this.getProperty(CONST.PROPERTIES.MANA_MAX)
      );
  }
};

Creature.prototype.getProperty = function (type) {
  /*
   * Function Creature.prototype.getProperty
   * Returns the property of a specific type
   */

  return this.properties.getProperty(type);
};

Creature.prototype.getId = function () {
  /*
   * Function Creature.getId
   * Returns the globally unique identifier of the creature
   */

  return this.properties.getId();
};

Creature.prototype.isDrunk = function () {
  /*
   * Function Creature.isDrunk
   * Returns whether the creature is drunk
   */

  return this.conditions.isDrunk();
};

Creature.prototype.faceCreature = function (creature) {
  /*
   * Function Creature.faceCreature
   * Faces a particular creature by updating the look direction
   */

  // Creature does not exist
  if (creature === null) {
    return;
  }

  // Turn to face the focus
  this.setDirection(
    this.getPosition().getFacingDirection(creature.getPosition())
  );
};

Creature.prototype.getStepDuration = function (friction) {
  /*
   * Function Creature.getStepDuration
   * Math to calcualte the amount of frames to lock when walking (50MS tick)
   * See: https://tibia.fandom.com/wiki/Speed_Breakpoints
   */

  return this.properties.getStepDuration(friction);
};

Creature.prototype.hasCondition = function (id) {
  /*
   * Function Creature.hasCondition
   * Returns true if the creature has a particular condition
   */

  return this.conditions.has(id);
};

Creature.prototype.removeCondition = function (id) {
  /*
   * Function Creature.addCondition
   * Removes a condition from the creature
   */

  return this.conditions.remove(id);
};

Creature.prototype.getFluidType = function () {
  /*
   * Function Creature.getFluidType
   * Returns the fluid type of a creature
   */

  switch (this.getPrototype().fluidType) {
    case CONST.BLOODTYPE.BLOOD:
      return CONST.FLUID.BLOOD;
    case CONST.BLOODTYPE.POISON:
      return CONST.FLUID.SLIME;
    default:
      return CONST.FLUID.BLOOD;
  }
};

Creature.prototype.getTile = function () {
  /*
   * Function Creature.getTile
   * Returns the tile that a creature is located on
   */

  return gameServer.world.getTileFromWorldPosition(this.getPosition());
};

Creature.prototype.getChunk = function () {
  /*
   * Function Creature.getChunk
   * Returns the chunk that a creature is located in
   */

  let chunk = gameServer.world.getChunkFromWorldPosition(this.getPosition());
  if (chunk === null) {
    console.warn(`No chunk found for position: ${this.getPosition()}`);
  } else {
    console.log(`Chunk found for position: ${this.getPosition()}`);
  }
  return chunk;
};

Creature.prototype.changeOutfit = function (outfit) {
  /*
   * Function Creature.changeOutfit
   * Changes the outfit of the creature
   */

  // Check whether the outfit is in fact valid
  if (!outfit.isValid()) {
    return;
  }

  // Internal change the outfit
  this.properties.setProperty(CONST.PROPERTIES.OUTFIT, outfit);
};

Creature.prototype.getOutfit = function () {
  /*
   * Creature.getOutfit
   * Returns the outfit of a creature
   */

  return this.getProperty(CONST.PROPERTIES.OUTFIT);
};

Creature.prototype.calculateDefense = function () {
  /*
   * Creature.calculateDefense
   * Calculates the random damage mitigated by a defense
   */

  // Draw a random sample between 0 and the defense
  return Number.prototype.random(0, this.getDefense());
};

Creature.prototype.getDefense = function () {
  /*
   * Function Properties.getDefense
   * Base creature function that returns the defense of a particular creature
   */

  return this.getProperty(CONST.PROPERTIES.DEFENSE);
};

Creature.prototype.getAttackSpeed = function () {
  /*
   * Function Properties.getAttackSpeed
   * Base creature function that returns the attack of a particular creature
   */

  return this.getProperty(CONST.PROPERTIES.ATTACK_SPEED);
};

Creature.prototype.getAttack = function () {
  /*
   * Function Properties.getAttack
   * Base creature function that returns the attack of a particular creature
   */

  return this.getProperty(CONST.PROPERTIES.ATTACK);
};

Creature.prototype.calculateDamage = function () {
  /*
   * Creature.calculateDamage
   * Calculates the random damage done by an attack
   */

  // Draw a random sample
  return Number.prototype.random(0, this.getAttack());
};

Creature.prototype.getPosition = function () {
  /*
   * Function Creature.getPosition
   * Returns the position of the creature
   */

  return this.position;
};

Creature.prototype.leaveOldChunks = function (oldChunks) {
  /*
   * Function Creature.leaveOldChunk
   * Called when the creatures leaves a number of adjacent chunks
   */

  // Dereference self in these old chunks. Other players then know they should not keep a reference to this player
  oldChunks.forEach((chunk) =>
    chunk.internalBroadcast(new CreatureForgetPacket(this.getId()))
  );
};

Creature.prototype.enterNewChunks = function (newChunks) {
  /*
   * Function Creature.enterNewChunk
   * Called when the creatures enters a number of new adjacent chunks
   */

  // Introduce self to the new chunk
  newChunks.forEach((chunk) =>
    chunk.internalBroadcast(new CreatureStatePacket(this))
  );
};

Creature.prototype.canSee = function (position) {
  /*
   * Function Creature.prototype.canSee
   * Returns whether a creature can see another creature with range x = 8, y = 6
   */

  return position.isVisible(this.getPosition(), 8, 6);
};

Creature.prototype.setPosition = function (position) {
  /*
   * Function Creature.setPosition
   * Sets the position of the creature
   */

  this.position = position;
  console.log(`Creature position set to: ${this.position}`);
};

Creature.prototype.setDirection = function (direction) {
  /*
   * Function Creature.setDirection
   * Sets the creature look direction
   */

  this.properties.setProperty(CONST.PROPERTIES.DIRECTION, direction);
};

Creature.prototype.isWithinRangeOf = function (creature, range) {
  /*
   * Function Creature.isWithinRangeOf
   * Returns true is a creature is in range of another creature
   */

  return this.position.isWithinRangeOf(creature.position, range);
};

Creature.prototype.is = function (name) {
  /*
   * Function Creature.is
   * Returns true if the creature has a particular class name
   */

  return this.constructor.name === name;
};

Creature.prototype.isWithinChunk = function (chunk) {
  /*
   * Function Creature.isWithinChunk
   * Returns true if the creature is within a given chunk
   */

  return this.getChunk() === chunk;
};

Creature.prototype.isBesidesThing = function (thing) {
  /*
   * Function Creature.isBesidesThing
   * Returns true when a creature is besides another thing
   */

  return this.position.besides(thing.getPosition());
};

Creature.prototype.isMounted = function () {
  /*
   * Function Creature.isMounted
   * Returns true if the creature is mounted
   */

  return this.getOutfit().mounted;
};

Creature.prototype.isZeroHealth = function () {
  /*
   * Function Creature.isZeroHealth
   * Returns true if the creature has 0 health and is therefore slain
   */

  return this.getProperty(CONST.PROPERTIES.HEALTH) === 0;
};

Creature.prototype.isPlayer = function () {
  /*
   * Function Creature.isPlayer
   * Returns true if the creature is a player
   */

  return this.constructor.name === "Player";
};

Creature.prototype.incrementProperty = function (type, amount) {
  /*
   * Function Creature.incrementProperty
   * Increases the health of an entity
   */

  // Set the health of the creature
  this.properties.incrementProperty(type, amount);
};

Creature.prototype.broadcast = function (packet) {
  /*
   * Function Creature.broadcast
   * Broadcasts a packet to all creatures in the same chunk
   */

  let chunk = this.getChunk();
  if (chunk !== null) {
    chunk.broadcast(packet);
  } else {
    console.warn("Attempted to broadcast to a null chunk.");
  }
};

Creature.prototype.broadcastFloor = function (packet) {
  /*
   * Function Creature.broadcastFloor
   * Broadcasts a packet to all spectators on the same floor as the creature
   */

  if (this.position === null) {
    return;
  }

  // Broadcast in the current active sector
  this.getChunk().broadcastFloor(this.getPosition().z, packet);
};

Creature.prototype.isInLineOfSight = function (other) {
  /*
   * Function Creature.isInLineOfSight
   * Returns true if the creature can see another thing at a position
   */

  if (other === null) {
    return false;
  }

  return this.position.inLineOfSight(other.getPosition());
};

Creature.prototype.increaseHealth = function (amount) {
  /*
   * Function Creature.increaseHealth
   * Increases the health of the creature until a maximum
   */

  // Add debug logs
  console.log("=== DEBUG HEALTH INCREASE ===");
  console.log(
    `Current Health before increase: ${this.getProperty(
      CONST.PROPERTIES.HEALTH
    )}`
  );
  console.log(`Max Health: ${this.getProperty(CONST.PROPERTIES.HEALTH_MAX)}`);
  console.log(`Amount to increase: ${amount}`);

  this.setProperty(
    CONST.PROPERTIES.HEALTH,
    (this.getProperty(CONST.PROPERTIES.HEALTH) + amount).clamp(
      0,
      this.getProperty(CONST.PROPERTIES.HEALTH_MAX)
    )
  );

  // Log after increase
  console.log(
    `Health after increase: ${this.getProperty(CONST.PROPERTIES.HEALTH)}`
  );
};

module.exports = Creature;
