"use strict";

const Item = requireModule("entities/item");
const BaseContainer = requireModule("containers/base-container");
const Condition = requireModule("combat/condition");
const Enum = requireModule("utils/enum");

const Equipment = function (cid, player, equipment) {
  /*
   * Class Equipment
   * Container for player equipment that can contain items and keep state of all equipped attributes
   *
   * API:
   *
   * Equipment.peekIndex(index) - Looks what is equipped at the requested index (see Equipment.SLOTS)
   * Equipment.isAmmunitionEquipped() - Returns true if the correct ammunition is equipped
   *
   */

  // Save a circular reference to the player
  this.__player = player;

  // A base container to keep all the items
  this.container = new BaseContainer(cid, 10);

  // Add the equipment from the database
  this.__addEquipment(equipment);

  // Self spectate changes to the equipment always
  this.container.spectators.add(player);
};

Equipment.prototype.getTopParent = function () {
  /*
   * Function Equipment.getTopParent
   * Returns the top parent of the equipment which is the player
   */

  return this.__player;
};

Equipment.prototype.getParent = function () {
  /*
   * Function Equipment.getParent
   * The parent of the container is always the player
   */

  return this.__player;
};

Equipment.prototype.toJSON = function () {
  /*
   * Function Equipment.toJSON
   * Implements the JSON.Stringify interface that is called when the player is serialized
   */

  // Simply return the slots which is an array of items
  return this.container.__slots
    .map(function (item, index) {
      if (item === null) {
        return null;
      }

      return new Object({
        slot: index,
        item: item,
      });
    })
    .nullfilter();
};

Equipment.prototype.handleChangeOnEquip = function (thing, change) {
  let newThing = process.gameServer.database.createThing(change);
  thing.copyProperties(newThing);

  thing.cleanup();

  return newThing;
};

Equipment.prototype.handleChangeThing = function (thing, change) {
  /*
   * Function Equipment.handleChangeThing
   * Handles changing an item on equip event
   */

  let newThing = gameServer.database.createThing(change);

  // Copy over the properties
  thing.copyProperties(newThing);

  // Clean up the item
  thing.cleanup();

  return newThing;
};

Equipment.prototype.removeIndex = function (index, count) {
  /*
   * Function Equipment.removeIndex
   * Implements the removeIndex API that handles removal of an item by the index and amount
   */

  let thing = this.peekIndex(index);

  if (thing === null) {
    return null;
  }

  // If stackable and removing partial amount, BaseContainer logic is safe (it replaces in place)
  if (thing.isStackable() && count < thing.count) {
    return this.container.removeIndex(index, count);
  }

  // CRITICAL FIX: BaseContainer.removeIndex shifts items (like a backpack), which corrupts equipment slots.
  // We must manually remove the item from the fixed slot without shifting.

  // 1. Clear the slot
  this.container.__slots[index] = null;

  // 2. Notify spectators
  const { ContainerRemovePacket } = requireModule("network/protocol");
  this.container.__informSpectators(new ContainerRemovePacket(this.container.guid, index, 0));

  // 3. Update player state (Weight, Parent, Conditions)
  this.__updateWeight(-thing.getWeight());
  thing.setParent(null);

  // Removed thing has attribute invisible?
  if (thing.getAttribute("invisible")) {
    this.__player.removeCondition(Condition.prototype.INVISIBLE);
  }

  if (thing.getAttribute("suppressDrunk")) {
    this.__player.removeCondition(Condition.prototype.SUPPRESS_DRUNK);
  }

  if (thing.getAttribute("manashield")) {
    this.__player.removeCondition(Condition.prototype.MAGIC_SHIELD);
  }

  // Check if removed item had speed bonus - broadcast updated speed
  if (thing.getAttribute("speed")) {
    const { CreaturePropertyPacket } = requireModule("network/protocol");
    let newSpeed = this.__player.getSpeed();
    this.__player.broadcast(
      new CreaturePropertyPacket(this.__player.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
    this.__player.write(
      new CreaturePropertyPacket(this.__player.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
  }

  let change = thing.getChangeOnUnequip();

  // We have to change the item before returning it
  if (change !== null) {
    return this.handleChangeThing(thing, change);
  }

  // Otherwise return the changed item
  return thing;
};

Equipment.prototype.deleteThing = function (thing) {
  /*
   * Function Equipment.deleteThing
   * Implements the deleteThing API that handles removal of an item by its reference
   */

  // Handle removal by thing reference
  let index = this.container.deleteThing(thing);

  if (index === -1) {
    return -1;
  }

  this.__updateWeight(-thing.getWeight());
  thing.setParent(null);

  // Clean up the conditions
  if (thing.getAttribute("invisible")) {
    this.__player.removeCondition(Condition.prototype.INVISIBLE);
  }

  if (thing.getAttribute("suppressDrunk")) {
    this.__player.removeCondition(Condition.prototype.SUPPRESS_DRUNK);
  }

  if (thing.getAttribute("manashield")) {
    this.__player.removeCondition(Condition.prototype.MAGIC_SHIELD);
  }

  // Check if removed item had speed bonus - broadcast updated speed
  if (thing.getAttribute("speed")) {
    const { CreaturePropertyPacket } = requireModule("network/protocol");
    let newSpeed = this.__player.getSpeed();
    this.__player.broadcast(
      new CreaturePropertyPacket(this.__player.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
    this.__player.write(
      new CreaturePropertyPacket(this.__player.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
  }

  return index;
};

Equipment.prototype.peekIndex = function (index) {
  /*
   * Function Equipment.peekIndex
   * Peeks at the item at the specified slot index
   */

  return this.container.peekIndex(index);
};

Equipment.prototype.getWeaponType = function () {

  /*
   * Function Equipment.getWeaponType
   * Returns the weapon type that is currently equipped
   */

  // Check both hands for a weapon
  let slots = [CONST.EQUIPMENT.LEFT, CONST.EQUIPMENT.RIGHT];

  for (let i = 0; i < slots.length; i++) {

    let item = this.peekIndex(slots[i]);

    if (item === null) {
      continue;
    }

    // Map weapon type to property
    switch (item.getPrototype().properties.weaponType) {
      case "sword":
        return CONST.PROPERTIES.SWORD;
      case "club":
        return CONST.PROPERTIES.CLUB;
      case "axe":
        return CONST.PROPERTIES.AXE;
      case "distance":
        return CONST.PROPERTIES.DISTANCE;
    }

  }

  // Default fallback to fist fighting
  return CONST.PROPERTIES.FIST;

};

Equipment.prototype.addThing = function (thing, index) {
  /*
   * Function Equipment.addThing
   * Adds an item to the passed slot index
   */

  // Guard
  if (!thing.isPickupable()) {
    return false;
  }

  let change = thing.getChangeOnEquip();

  // We have to change the item before adding it
  if (change !== null) {
    thing = this.handleChangeThing(thing, change);
  }

  // The equipped item has a property invisible
  if (thing.getAttribute("invisible")) {
    this.__player.addCondition(Condition.prototype.INVISIBLE, -1, -1, null);
  }

  if (thing.getAttribute("suppressDrunk")) {
    this.__player.addCondition(
      Condition.prototype.SUPPRESS_DRUNK,
      -1,
      -1,
      null
    );
  }

  if (thing.getAttribute("manashield")) {
    this.__player.addCondition(Condition.prototype.MAGIC_SHIELD, -1, -1, null);
  }

  // Now feel free to add it
  this.container.addThing(thing, index);

  // The things parent is of course the player
  thing.setParent(this);

  // Check if item has speed bonus - broadcast updated speed
  // Guard: only broadcast if player is fully initialized (has containerManager.equipment)
  if (thing.getAttribute("speed") && this.__player.containerManager && this.__player.containerManager.equipment) {
    const { CreaturePropertyPacket } = requireModule("network/protocol");
    let newSpeed = this.__player.getSpeed();
    this.__player.broadcast(
      new CreaturePropertyPacket(this.__player.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
    this.__player.write(
      new CreaturePropertyPacket(this.__player.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
  }

  // Decrement the capacity
  return this.__updateWeight(thing.getWeight());
};

Equipment.prototype.getMaximumAddCount = function (player, thing, index) {
  /*
   * Function Equipment.getMaximumAddCount
   * Returns the count of the item that can be added to a tile
   */

  // Check whether the item type matches that of the slot
  if (!this.__isRightType(thing, index)) {
    return 0;
  }

  // Take a look at the item in the slot
  let currentItem = this.peekIndex(index);

  // The slot is currently empty, accept the maximum count
  if (currentItem === null) {
    return Item.prototype.MAXIMUM_STACK_COUNT;
  }

  // Not empty but the identifiers match and the item is stackable: return the maximum minus what is already there.
  if (currentItem.id === thing.id && thing.isStackable()) {
    return Item.prototype.MAXIMUM_STACK_COUNT - currentItem.count;
  }

  // Not able to add: another item is occupying the slot
  return 0;
};

Equipment.prototype.isAmmunitionEquipped = function () {
  /*
   * Public Function Equipment.isAmmunitionEquipped
   * Returns true if the player has ammunition equipped
   */

  // Take a look at the quiver
  let ammunition = this.peekIndex(CONST.EQUIPMENT.QUIVER);

  // If nothing is equipped there is no ammunition
  if (ammunition === null) {
    return false;
  }

  // Confirm the ammunition of the right type
  let weapon = this.peekIndex(CONST.EQUIPMENT.HAND_LEFT);

  // Weapon does not match ammunition type
  if (!weapon.isRightAmmunition(ammunition)) {
    return false;
  }

  return true;
};

Equipment.prototype.isDistanceWeaponEquipped = function () {
  /*
   * Public Function Equipment.isDistanceWeaponEquipped
   * Returns true if distance weapon equipped
   */

  // Take a look at the weapon in the left hand slot
  let thing = this.peekIndex(CONST.EQUIPMENT.HAND_LEFT);

  if (thing === null) {
    return false;
  }

  // Check whether is thing is a distance weapon
  return thing.isDistanceWeapon();
};

Equipment.prototype.isShieldEquipped = function () {
  /*
   * Public Function Equipment.isShieldEquipped
   * Returns true if shield equipped
   */

  let slots = [CONST.EQUIPMENT.LEFT, CONST.EQUIPMENT.RIGHT];

  for (let i = 0; i < slots.length; i++) {
    let item = this.peekIndex(slots[i]);
    if (item && item.getPrototype().properties.weaponType === "shield") {
      return true;
    }
  }

  return false;
};

Equipment.prototype.hasSufficientResources = function (resource, amount) {
  /*
   * Function Equipment.hasSufficientResources
   * Returns true if the player has a number of sufficient resources (e.g., gold)
   */

  let backpack = this.peekIndex(CONST.EQUIPMENT.BACKPACK);

  if (backpack === null) {
    return false;
  }

  let remainingAmount = amount;

  for (let i = 0; i < backpack.container.__slots.length; i++) {
    let slot = backpack.container.__slots[i];

    if (slot === null) {
      continue;
    }

    if (slot.id === resource) {
      if (slot.count >= remainingAmount) {
        return true;
      }

      remainingAmount = Math.max(0, remainingAmount - slot.count);
    }

    // The residual is zero: the player has sufficient resources
    if (remainingAmount === 0) {
      return true;
    }
  }

  return false;
};

Equipment.prototype.payWithResource = function (resource, amount) {
  /*
   * Function Equipment.payWithResource
   * Pays with a number of resources from the player's equipped backpack
   */

  let backpack = this.peekIndex(CONST.EQUIPMENT.BACKPACK);

  if (backpack === null) {
    return false;
  }

  // Guard against not sufficient resources
  if (!this.hasSufficientResources(resource, amount)) {
    return false;
  }

  let remainingAmount = amount;

  // Same algorithm as above but now subtract and remove the resources
  for (let i = 0; i < backpack.container.__slots.length; i++) {
    let slot = backpack.container.__slots[i];

    if (slot === null) {
      continue;
    }

    if (slot.id === resource) {
      // More than enough: subtract
      if (slot.count >= remainingAmount) {
        backpack.removeIndex(i, remainingAmount);
        return true;
      }

      // Remove the entire stack
      backpack.removeIndex(i, slot.count);
      remainingAmount = remainingAmount - slot.count;
    }
  }
};

Equipment.prototype.canPushItem = function (thing) {
  /*
   * Function Equipment.canPushItem
   * Return true if a thing can be pushed to the players inventory
   */

  // Take a look if there is a backpack equipped
  let backpack = this.peekIndex(CONST.EQUIPMENT.BACKPACK);

  // If the item cannot be added to the backpack just drop it on the ground
  if (backpack === null) {
    return false;
  }

  // Prevent unwanted nesting of containers in the players own backpack (e.g., when evicting nested backpacks from a house)
  if (
    thing.constructor.name === "Container" &&
    thing.exceedsMaximumChildCount()
  ) {
    return false;
  }

  // Full or no capacity
  if (
    backpack.container.isFull() ||
    !this.__player.hasSufficientCapacity(thing)
  ) {
    return false;
  }

  return true;
};

Equipment.prototype.pushItem = function (thing) {
  /*
   * Function Equipment.pushItem
   * Pushes an item into the backpack of the player or on the ground
   */

  // Take a look if there is a backpack equipped
  let backpack = this.peekIndex(CONST.EQUIPMENT.BACKPACK);

  if (backpack === null) {
    return;
  }

  backpack.addFirstEmpty(thing);
};

Equipment.prototype.getAttributeState = function (attribute) {
  /*
   * Function Equipment.getAttributeState
   * Returns the state of the player equipment by summing individual contributions
   */

  let sum = 0;

  // Go over all the slots
  this.container.__slots.forEach(function (thing) {
    // A thing is equipped..
    if (thing === null) {
      return;
    }

    let value = thing.getAttribute(attribute);

    if (value === null) {
      return;
    }

    sum += value;
  });

  return sum;
};

Equipment.prototype.__isRightType = function (item, slot) {
  /*
   * Function Equipment.__isRightType
   * Returns true if the item matches the slot type
   */

  // Ensure slot is a number
  slot = Number(slot);

  // Get the prototype
  let proto = item.getPrototype();

  switch (slot) {
    case CONST.EQUIPMENT.HELMET:
      return proto.properties.slotType === "head";
    case CONST.EQUIPMENT.ARMOR:
      return proto.properties.slotType === "body";
    case CONST.EQUIPMENT.LEGS:
      return proto.properties.slotType === "legs";
    case CONST.EQUIPMENT.BOOTS:
      return proto.properties.slotType === "feet";
    case CONST.EQUIPMENT.RIGHT:
    case CONST.EQUIPMENT.LEFT:
      return (
        proto.properties.weaponType === "sword" ||
        proto.properties.weaponType === "club" ||
        proto.properties.weaponType === "axe" ||
        proto.properties.weaponType === "distance" ||
        proto.properties.weaponType === "shield"
      );
    case CONST.EQUIPMENT.BACKPACK:
      return proto.properties.containerSize !== undefined;
    case CONST.EQUIPMENT.NECKLACE:
      return proto.properties.slotType === "necklace";
    case CONST.EQUIPMENT.RING:
      return proto.properties.slotType === "ring";
    case CONST.EQUIPMENT.QUIVER:
      return proto.properties.weaponType === "quiver";
    default:
      return false;
  }
};

Equipment.prototype.__updateWeight = function (weight) {
  /*
   * Function Equipment.__updateWeight
   * Updates the capacity of the parent player
   */

  // Invert the weight
  this.__player.changeCapacity(-weight);
};

Equipment.prototype.__addEquipment = function (equipment) {
  /*
   * Function Equipment.__addEquipment
   * Adds equipment in serialised form from the database
   */

  // Go over all the equipment slots from the database
  equipment.forEach(function (entry) {
    // Create the thing from the equipped item
    let thing = process.gameServer.database.parseThing(entry.item);

    this.addThing(thing, entry.slot);

    // Adding something with invisible attribute
    if (thing.getAttribute("invisible")) {
      this.__player.addCondition(Condition.prototype.INVISIBLE, -1, -1, null);
    }
  }, this);
};

Equipment.prototype.getTotalWeight = function () {
  /*
   * Function Equipment.getTotalWeight
   * Calculates the total weight of all items equipped
   */

  let totalWeight = 0;
  this.container.__slots.forEach((slot, index) => {
    if (slot !== null) {
      let itemWeight = slot.getWeight();
      totalWeight += itemWeight;
    }
  });
  return totalWeight;
};

module.exports = Equipment;
