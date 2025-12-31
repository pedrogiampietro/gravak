"use strict";

const Condition = requireModule("combat/condition");
const Creature = requireModule("entities/creature");
const ContainerManager = requireModule("containers/container-manager");
const Friendlist = requireModule("utils/friendlist.js");
const PacketReader = requireModule("network/packet-reader");
const Spellbook = requireModule("combat/spellbook");

const PlayerIdleHandler = requireModule("player/player-idle-handler");
const CharacterProperties = requireModule("player/player-properties");
const SocketHandler = requireModule("player/player-socket-handler");
const PlayerMovementHandler = requireModule("player/player-movement-handler");
const ChannelManager = requireModule("player/player-channel-manager");
const CombatLock = requireModule("player/player-combat-lock");
const ActionHandler = requireModule("player/player-action-handler");
const UseHandler = requireModule("player/player-use-handler");
const Skills = requireModule("utils/skills");
const Position = requireModule("utils/position");

const { EmotePacket, CreatureStatePacket, ContainerOpenPacket, ContainerClosePacket, CancelMessagePacket, ServerMessagePacket, ChannelWritePacket, CreaturePropertyPacket } = requireModule("network/protocol");

const Player = function (data) {
  /*
   * Class Player
   * Wrapper for a playable character
   *
   * API:
   *
   * Player.isInCombat - Returns true if the player is or has recently been in combat
   *
   *
   */

  // Inherit from Creature class
  Creature.call(this, data.properties);


  this.templePosition = Position.prototype.fromLiteral(data.templePosition);

  // Add the player properties (sex, role, vocation, etc.)
  this.addPlayerProperties(data.properties);

  // The player skills and experience
  // IMPORTANT: Skills constructor calls setMaximumProperties() which sets HEALTH_MAX, MANA_MAX, CAPACITY_MAX
  this.skills = new Skills(this, data.skills);

  // If player logged in with zero health (died previously), restore them
  // This MUST be after Skills init so HEALTH_MAX is properly calculated from level/vocation
  if (this.getProperty(CONST.PROPERTIES.HEALTH) <= 0) {
    let healthMax = this.getProperty(CONST.PROPERTIES.HEALTH_MAX);
    let manaMax = this.getProperty(CONST.PROPERTIES.MANA_MAX);
    console.log("Respawning player with Health:", healthMax, "Mana:", manaMax);
    this.setProperty(CONST.PROPERTIES.HEALTH, healthMax);
    this.setProperty(CONST.PROPERTIES.MANA, manaMax);
  }

  // Child classes with data for player handlers
  this.socketHandler = new SocketHandler(this);
  this.friendlist = new Friendlist(data.friends);
  this.containerManager = new ContainerManager(this, data.containers);
  this.spellbook = new Spellbook(this, data.spellbook);

  // Storage for quests/values
  this.storage = data.storage || {};

  // Update current capacity based on equipped items weight
  this.__updateCurrentCapacity();

  // Non-data handlers
  this.idleHandler = new PlayerIdleHandler(this);
  this.movementHandler = new PlayerMovementHandler(this);
  this.channelManager = new ChannelManager(this);
  this.actionHandler = new ActionHandler(this);
  this.combatLock = new CombatLock(this);
  this.useHandler = new UseHandler(this);

  // Last visited
  this.lastVisit = data.lastVisit;

  // Combat mode state (default to balanced)
  this.fightMode = CONST.FIGHT_MODE.BALANCED;

  // Chase mode state (default to stand)
  this.chaseMode = CONST.CHASE_MODE.STAND;
};

Player.prototype = Object.create(Creature.prototype);
Player.prototype.constructor = Player;

Player.prototype.addPlayerProperties = function (properties) {
  /*
   * Player.addPlayerProperties
   * Adds the properties of the player to the available properties
   */


  // Add these properties
  this.properties.add(CONST.PROPERTIES.MOUNTS, properties.availableMounts);
  this.properties.add(CONST.PROPERTIES.OUTFITS, properties.availableOutfits);
  this.properties.add(CONST.PROPERTIES.SEX, properties.sex);
  this.properties.add(CONST.PROPERTIES.ROLE, properties.role);
  this.properties.add(CONST.PROPERTIES.VOCATION, properties.vocation);

};

Player.prototype.getTarget = function () {
  return this.actionHandler.targetHandler.getTarget();
};

Player.prototype.getStorage = function (key) {
  /*
   * Function Player.getStorage
   * Returns the value for a storage key
   */

  return this.storage[key] || -1;
};

Player.prototype.setStorage = function (key, value) {
  /*
   * Function Player.setStorage
   * Sets the value for a storage key
   */

  this.storage[key] = value;
  console.log("Storage Updated - Key: %s, Value: %s".format(key, value));

  // Check if this storage key is related to a quest
  if (gameServer.questManager) {
    const quest = gameServer.questManager.getQuestForStorage(key);
    if (quest) {
      // Notify the player
      const { ServerMessagePacket, QuestLogPacket } = requireModule("network/protocol");
      this.write(new ServerMessagePacket("Your quest log has been updated."));
      console.log("Quest Log Updated for player %s (Quest: %s)".format(this.name, quest.name));

      // Send the updated quest list
      let quests = gameServer.questManager.getQuestList(this);
      this.write(new QuestLogPacket(quests));
    }
  }
};

Player.prototype.getTextColor = function () {
  /*
   * Function Player.getTextColor
   * Returns the text color of the player
   */

  return this.getProperty(CONST.PROPERTIES.ROLE) === CONST.ROLES.ADMIN
    ? CONST.COLOR.RED
    : CONST.COLOR.YELLOW;
};

Player.prototype.getLevel = function () {
  /*
   * Function Player.getLevel
   * Returns the level of the player
   */

  return this.skills.getSkillLevel(CONST.PROPERTIES.EXPERIENCE);
};

Player.prototype.setLevel = function (level) {
  /*
   * Function Player.setLevel
   * Sets the level of a player character
   */

  // Set the level & experience
  this.characterStatistics.skills.setSkillLevel(CONST.SKILL.EXPERIENCE, level);
};

Player.prototype.onLevelUp = function (oldLevel, newLevel) {
  /*
   * Function Player.onLevelUp
   * Called when player gains a level - updates stats and notifies client
   */

  console.log(`[LEVEL UP] ${this.getProperty(CONST.PROPERTIES.NAME)} advanced from level ${oldLevel} to ${newLevel}!`);

  // Recalculate max health, mana, capacity based on new level
  this.skills.setMaximumProperties();

  // Send level update to client (using a custom property ID for level)
  // We'll use property ID 30 for LEVEL
  this.write(new CreaturePropertyPacket(this.getId(), 30, newLevel));

  // Send experience update to client
  let currentExp = this.skills.getSkillValue(CONST.PROPERTIES.EXPERIENCE);
  this.write(new CreaturePropertyPacket(this.getId(), CONST.PROPERTIES.EXPERIENCE, currentExp));

  // Send max health and max mana updates
  let newMaxHealth = this.getProperty(CONST.PROPERTIES.HEALTH_MAX);
  let newMaxMana = this.getProperty(CONST.PROPERTIES.MANA_MAX);
  let newMaxCapacity = this.getProperty(CONST.PROPERTIES.CAPACITY_MAX);

  console.log(`[LEVEL UP] New max stats - HP: ${newMaxHealth}, Mana: ${newMaxMana}, Cap: ${newMaxCapacity}`);

  this.write(new CreaturePropertyPacket(this.getId(), CONST.PROPERTIES.HEALTH_MAX, newMaxHealth));
  this.write(new CreaturePropertyPacket(this.getId(), CONST.PROPERTIES.MANA_MAX, newMaxMana));
  this.write(new CreaturePropertyPacket(this.getId(), CONST.PROPERTIES.CAPACITY_MAX, newMaxCapacity));

  // Send congratulations message
  let message = `You advanced from Level ${oldLevel} to Level ${newLevel}. Congratulations!`;
  this.write(new ServerMessagePacket(message));

  // Also send to console
  this.write(new ChannelWritePacket(
    CONST.CHANNEL.DEFAULT,
    "Server",
    message,
    CONST.COLOR.WHITE
  ));
};

Player.prototype.getExperiencePoints = function () {
  /*
   * Function Player.getExperience
   * Returns the number of experience points a player has
   */

  return this.characterStatistics.skills.getSkillPoints(CONST.SKILL.EXPERIENCE);
};

Player.prototype.think = function () {
  this.actionHandler.actions.handleActions(this.actionHandler);
};

Player.prototype.getVocation = function () {
  /*
   * Function Player.getVocation
   * Returns the vocation of the player
   */

  return this.getProperty(CONST.PROPERTIES.VOCATION);
};

Player.prototype.extendCondition = function (id, ticks, duration) {
  // Does not exist yet?
  if (!this.hasCondition(id)) {
    return this.conditions.add(new Condition(id, ticks, duration), null);
  }

  this.conditions.extendCondition(id, ticks);
};

Player.prototype.isSated = function (ticks) {
  return (
    this.hasCondition(Condition.prototype.SATED) &&
    ticks +
    this.conditions.__conditions.get(Condition.prototype.SATED).numberTicks >
    1500
  );
};

Player.prototype.isInvisible = function () {
  return this.hasCondition(Condition.prototype.INVISIBLE);
};

Player.prototype.enterNewChunks = function (newChunks) {
  /*
   * Function Player.enterNewChunk
   * Necessary functions to call when a creature enters a new chunk
   */

  // Get the serialized chunks
  newChunks.forEach((chunk) => chunk.serialize(this));

  newChunks.forEach((chunk) =>
    chunk.internalBroadcast(new CreatureStatePacket(this))
  );
};

Player.prototype.isInNoLogoutZone = function () {
  /*
   * Function Player.isInNoLogoutZone
   * Returns true if the player is in a no-logout zone
   */

  return process.gameServer.world
    .getTileFromWorldPosition(this.position)
    .isNoLogoutZone();
};

Player.prototype.isInProtectionZone = function () {
  /*
   * Function Player.isInProtectionZone
   * Returns true if the player is in a protection zone
   */

  return process.gameServer.world
    .getTileFromWorldPosition(this.position)
    .isProtectionZone();
};

Player.prototype.ownsHouseTile = function (tile) {
  /*
   * Function Player.ownsHouseTile
   * Returns true if the tile is a house tile
   */

  return (
    tile.house.owner === this.name || tile.house.invited.includes(this.name)
  );
};

Player.prototype.isTileOccupied = function (tile) {
  /*
   * Function Player.isTileOccupied
   * Function evaluated for a tile whether it is occupied for the NPC or not
   */

  // If the tile is blocking then definitely
  if (tile.isBlockSolid()) {
    return true;
  }

  // House tile but not owned
  if (tile.isHouseTile() && !this.ownsHouseTile(tile)) {
    this.sendCancelMessage("You do not own this house.");
    return true;
  }

  // The tile items contain a block solid (e.g., a wall)
  if (tile.hasItems() && tile.itemStack.isBlockSolid()) {
    return true;
  }

  // Occupied by other characters
  if (tile.isOccupiedCharacters()) {
    return true;
  }

  return false;
};

Player.prototype.openContainer = function (id, name, baseContainer) {
  /*
   * Function Player.openContainer
   * Opens the base container and writes a packet to the player
   */

  baseContainer.addSpectator(this);

  this.write(new ContainerOpenPacket(id, name, baseContainer));
};

Player.prototype.closeContainer = function (baseContainer) {
  /*
   * Function Player.closeContainer
   * Closes the base container and writes a packet to the player
   */

  baseContainer.removeSpectator(this);

  this.write(new ContainerClosePacket(baseContainer.guid));
};

Player.prototype.isInCombat = function () {
  /*
   * Function Player.isInCombat
   * Return true if the player is currently engaged in combat
   */

  return this.combatLock.isLocked();
};

Player.prototype.isOnline = function () {
  /*
   * Function Player.isOnline
   * Returns true if the player is online and connected to the gameworld
   */

  // Check with the world
  return gameServer.world.creatureHandler.isPlayerOnline(this);
};

Player.prototype.isMoving = function () {
  /*
   * Function Player.isMoving
   * Returns true if the creature is moving and does not have the move action available
   */

  return this.movementHandler.isMoving();
};

Player.prototype.canUseHangable = function (thing) {
  /*
   * Function Player.canNotUseHangable
   * Delegates to the internal function
   */

  return (
    (thing.isHorizontal() && this.position.y >= thing.getPosition().y) ||
    (thing.isVertical() && this.position.x >= thing.getPosition().x)
  );
};

Player.prototype.decreaseHealth = function (source, amount) {
  /*
   * Function Player.decreaseHealth
   * Decreases the health of the player
   * If Magic Shield (utamo vita) is active, damage goes to mana first
   */

  // Prevent damage if dead
  if (this.isDead) {
    return;
  }

  // Put the target player in combat
  this.combatLock.activate();

  // Check if Magic Shield (utamo vita) is active
  const Condition = requireModule("combat/condition");
  if (this.hasCondition(Condition.prototype.MAGIC_SHIELD)) {
    let currentMana = this.getProperty(CONST.PROPERTIES.MANA);

    if (currentMana > 0) {
      // Calculate how much damage goes to mana vs health
      let manaAbsorbed = Math.min(amount, currentMana);
      let remainingDamage = amount - manaAbsorbed;

      // Decrease mana by the absorbed amount
      this.incrementProperty(CONST.PROPERTIES.MANA, -manaAbsorbed);

      // Send mana damage in blue color
      this.broadcast(new EmotePacket(this, String(manaAbsorbed), CONST.COLOR.LIGHTBLUE));

      // Send message about mana damage
      this.write(new ChannelWritePacket(
        CONST.CHANNEL.DEFAULT,
        "",
        "You lose " + manaAbsorbed + " mana" + (source && source.isPlayer && !source.isPlayer() ? " due to an attack by " + (source.getProperty(CONST.PROPERTIES.NAME) || "creature").toLowerCase() : "") + ".",
        CONST.COLOR.WHITE
      ));

      // If mana runs out, remove the Magic Shield condition
      if (this.getProperty(CONST.PROPERTIES.MANA) === 0) {
        this.removeCondition(Condition.prototype.MAGIC_SHIELD);
        this.sendCancelMessage("Your magic shield has been depleted.");
      }

      // If there's remaining damage after mana is depleted, apply it to health
      if (remainingDamage > 0) {
        this.incrementProperty(CONST.PROPERTIES.HEALTH, -remainingDamage);
        this.broadcast(new EmotePacket(this, String(remainingDamage), CONST.COLOR.RED));

        this.write(new ChannelWritePacket(
          CONST.CHANNEL.DEFAULT,
          "",
          "You lose " + remainingDamage + " hitpoints.",
          CONST.COLOR.WHITE
        ));
      }

      // Check for death after remaining damage
      if (this.isZeroHealth()) {
        if (this.isDead) {
          return;
        }
        return this.handleDeath();
      }

      return;
    } else {
      // No mana left, remove magic shield
      this.removeCondition(Condition.prototype.MAGIC_SHIELD);
      this.sendCancelMessage("Your magic shield has been depleted.");
    }
  }

  // Normal damage to health (no magic shield or mana depleted)
  this.incrementProperty(CONST.PROPERTIES.HEALTH, -amount);

  // Send damage color to the player
  this.broadcast(new EmotePacket(this, String(amount), CONST.COLOR.RED));

  // Send combat message to chat: "You lose X hitpoints due to an attack by [monster name]."
  if (source && source.isPlayer && !source.isPlayer()) {
    let sourceName = source.getProperty(CONST.PROPERTIES.NAME) || "creature";
    // Send to Default channel (console) - channel id 0
    this.write(new ChannelWritePacket(
      CONST.CHANNEL.DEFAULT,
      "",
      "You lose " + amount + " hitpoints due to an attack by " + sourceName.toLowerCase() + ".",
      CONST.COLOR.WHITE
    ));
  } else if (source === null) {
    // Environmental damage
    this.write(new ChannelWritePacket(
      CONST.CHANNEL.DEFAULT,
      "",
      "You lose " + amount + " hitpoints.",
      CONST.COLOR.WHITE
    ));
  }

  // Zero health means death
  if (this.isZeroHealth()) {
    if (this.isDead) {
      return;
    }
    return this.handleDeath();
  }
};

Player.prototype.getCorpse = function () {
  /*
   * Function Player.getCorpse
   * Returns either the male or female corpse
   */

  const CORPSE_MALE = 3058;
  const CORPSE_FEMALE = 3065;

  return this.getProperty(CONST.PROPERTIES.SEX) === CONST.SEX.MALE
    ? CORPSE_MALE
    : CORPSE_MALE;
};

Player.prototype.handleDeath = function () {
  /*
   * Function Player.handleDeath
   * Called when the player dies because of zero health
   * Shows a death message and disconnects - player respawns at temple on reconnect
   */

  // Prevent multiple calls
  if (this.isDead) {
    return;
  }

  this.isDead = true;

  // Send death message screen to client (like Tibia's "You are dead" modal)
  // 0x28 (Death Window) should trigger the modal natively without disconnect
  const { DeathPacket, CancelMessagePacket, CreatureForgetPacket } = requireModule("network/protocol");
  this.write(new DeathPacket());
  this.write(new CancelMessagePacket("You are dead."));

  // Broadcast CreatureForgetPacket to all spectators to make the player "disappear"
  // This removes the player sprite from the screen without changing outfit
  // We also write directly to the player since broadcast may not include self
  let forgetPacket = new CreatureForgetPacket(this.getId());
  this.write(forgetPacket);
  this.broadcast(forgetPacket);

  // Explicitly force nearby monsters to drop target immediately to prevent lingering attacks
  let chunk = gameServer.world.getChunkFromWorldPosition(this.getPosition());
  if (chunk) {
    let dropTarget = (monster) => {
      if (monster.hasTarget() && monster.getTarget() === this) {
        monster.setTarget(null);
      }
    };
    chunk.monsters.forEach(dropTarget);
    chunk.neighbours.forEach(neighbour => neighbour.monsters.forEach(dropTarget));
  }

  // Create the player corpse at the death location
  let corpse = gameServer.database.createThing(this.getCorpse());

  if (corpse !== null) {
    gameServer.world.addTopThing(this.getPosition(), corpse);
    gameServer.world.addSplash(2016, this.getPosition(), corpse.getFluidType());
  }

  // Mark that player should respawn at temple on next login
  this.__spawnAtTemple = true;
};

Player.prototype.consumeAmmunition = function () {
  /*
   * Function Player.consumeAmmunition
   * Consumes a single piece of ammunition
   */

  return this.containerManager.equipment.removeIndex(CONST.EQUIPMENT.QUIVER, 1);
};

Player.prototype.isAmmunitionEquipped = function () {
  /*
   * Function Player.isAmmunitionEquipped
   * Returns true if the player has ammunition available
   */

  return this.containerManager.equipment.isAmmunitionEquipped();
};

Player.prototype.isDistanceWeaponEquipped = function () {
  /*
   * Function Player.isDistanceWeaponEquipped
   * Returns true if the player has a distance weapon equipped
   */

  return this.containerManager.equipment.isDistanceWeaponEquipped();
};

Player.prototype.sendCancelMessage = function (message) {
  /*
   * Function Player.sendCancelMessage
   * Writes a cancel message to the player
   */

  this.write(new CancelMessagePacket(message));
};

Player.prototype.syncProperties = function () {
  /*
   * Function Player.syncProperties
   * Synchronizes all player properties before saving
   */


  // Update maximum properties based on level first
  this.skills.setMaximumProperties();

  // Log current values before sync
  console.log(
    `Health: ${this.getProperty(CONST.PROPERTIES.HEALTH)}/${this.getProperty(
      CONST.PROPERTIES.HEALTH_MAX
    )}`
  );
  console.log(
    `Mana: ${this.getProperty(CONST.PROPERTIES.MANA)}/${this.getProperty(
      CONST.PROPERTIES.MANA_MAX
    )}`
  );
  console.log(
    `Capacity: ${this.getProperty(
      CONST.PROPERTIES.CAPACITY
    )}/${this.getProperty(CONST.PROPERTIES.CAPACITY_MAX)}`
  );

  // Ensure health and mana don't exceed maximums
  let currentHealth = this.getProperty(CONST.PROPERTIES.HEALTH);
  let maxHealth = this.getProperty(CONST.PROPERTIES.HEALTH_MAX);
  if (currentHealth > maxHealth) {
    this.setProperty(CONST.PROPERTIES.HEALTH, maxHealth);
  }

  let currentMana = this.getProperty(CONST.PROPERTIES.MANA);
  let maxMana = this.getProperty(CONST.PROPERTIES.MANA_MAX);
  if (currentMana > maxMana) {
    this.setProperty(CONST.PROPERTIES.MANA, maxMana);
  }

  // Update capacity based on current items
  if (this.containerManager) {
    let totalWeight = this.containerManager.equipment.getTotalWeight();
    let maxCapacity = this.getProperty(CONST.PROPERTIES.CAPACITY_MAX);
    this.setProperty(
      CONST.PROPERTIES.CAPACITY,
      Math.max(0, maxCapacity - totalWeight)
    );
  }

  // Log final values after sync
  console.log(
    `Health: ${this.getProperty(CONST.PROPERTIES.HEALTH)}/${this.getProperty(
      CONST.PROPERTIES.HEALTH_MAX
    )}`
  );
  console.log(
    `Mana: ${this.getProperty(CONST.PROPERTIES.MANA)}/${this.getProperty(
      CONST.PROPERTIES.MANA_MAX
    )}`
  );
  console.log(
    `Capacity: ${this.getProperty(
      CONST.PROPERTIES.CAPACITY
    )}/${this.getProperty(CONST.PROPERTIES.CAPACITY_MAX)}`
  );
};

Player.prototype.cleanup = function () {
  /*
   * Public Function Player.cleanup
   * Cleans up player references and events after socket close
   */

  // Sync all properties before cleanup
  this.syncProperties();

  // Leave all channels
  this.channelManager.cleanup();

  // Close all containers
  this.containerManager.cleanup();

  // Cancel events scheduled by the condition manager
  this.conditions.cleanup();

  // Cancel events scheduled by the combat lock
  this.combatLock.cleanup();

  // Idle events
  this.idleHandler.cleanup();

  // Disconnect all connected sockets
  this.socketHandler.disconnect();

  // Remaining actions
  this.actionHandler.cleanup();

  // Emit the logout event for the player
  this.emit("logout");
};

Player.prototype.toJSON = function () {
  /*
   * Function Player.toJSON
   * Serializes the player to JSON
   */

  // Sync properties before saving
  this.syncProperties();

  // Get current properties
  let currentProperties = {
    name: this.getProperty(CONST.PROPERTIES.NAME),
    health: this.getProperty(CONST.PROPERTIES.HEALTH),
    healthMax: this.getProperty(CONST.PROPERTIES.HEALTH_MAX),
    mana: this.getProperty(CONST.PROPERTIES.MANA),
    manaMax: this.getProperty(CONST.PROPERTIES.MANA_MAX),
    capacity: this.getProperty(CONST.PROPERTIES.CAPACITY),
    capacityMax: this.getProperty(CONST.PROPERTIES.CAPACITY_MAX),
    speed: this.getProperty(CONST.PROPERTIES.SPEED),
    attack: this.getProperty(CONST.PROPERTIES.ATTACK),
    defense: this.getProperty(CONST.PROPERTIES.DEFENSE),
    attackSpeed: this.getProperty(CONST.PROPERTIES.ATTACK_SPEED),
    direction: this.getProperty(CONST.PROPERTIES.DIRECTION),
    outfit: this.getProperty(CONST.PROPERTIES.OUTFIT),
    role: this.getProperty(CONST.PROPERTIES.ROLE),
    vocation: this.getProperty(CONST.PROPERTIES.VOCATION),
    sex: this.getProperty(CONST.PROPERTIES.SEX),
    availableMounts: this.getProperty(CONST.PROPERTIES.MOUNTS),
    availableOutfits: this.getProperty(CONST.PROPERTIES.OUTFITS),
  };


  return new Object({
    position: this.__spawnAtTemple ? this.templePosition : this.position,
    templePosition: this.templePosition,
    properties: currentProperties,
    skills: this.skills.toJSON(),
    spellbook: this.spellbook.toJSON(),
    containers: this.containerManager.toJSON(),
    friends: this.friendlist.toJSON(),
    storage: this.storage,
    lastVisit: Date.now(),
  });
};

Player.prototype.disconnect = function () {
  this.socketHandler.disconnect();
};

Player.prototype.write = function (packet) {
  /*
   * Function Player.write
   * Delegates write to the websocket connection to write a packet
   */

  this.socketHandler.write(packet);
};

Player.prototype.getEquipmentAttribute = function (attribute) {
  /*
   * Function Player.getEquipmentAttribute
   * Returns an attribute from the the players' equipment
   */

  return this.containerManager.equipment.getAttributeState(attribute);
};

Player.prototype.getSpeed = function () {
  /*
   * Function Player.getSpeed
   * Returns the speed of the player
   * Tibia formula: Base Speed = 109 + Level
   */

  // Get the player level
  let level = this.skills.getSkillLevel(CONST.PROPERTIES.EXPERIENCE) || 1;

  // Tibia speed formula: 109 + Level
  let baseSpeed = 109 + level;

  // Add speed bonuses from equipment (boots of haste, etc.)
  // Guard: containerManager may not exist during player initialization
  let equipmentSpeed = 0;
  if (this.containerManager && this.containerManager.equipment) {
    equipmentSpeed = this.getEquipmentAttribute("speed") || 0;
  }
  baseSpeed += equipmentSpeed;

  // Apply haste condition multiplier
  if (this.hasCondition(Condition.prototype.HASTE)) {
    // Haste formula: speed * 1.3 - 24 (approximately)
    baseSpeed = Math.floor(baseSpeed * 1.3 - 24);
  }

  // Apply strong haste (if implemented)
  if (this.hasCondition(Condition.prototype.STRONG_HASTE)) {
    // Strong Haste formula: speed * 1.7 - 56
    baseSpeed = Math.floor(baseSpeed * 1.7 - 56);
  }

  return Math.max(baseSpeed, 10); // Minimum speed of 10
};

Player.prototype.getBaseDamage = function () {
  /*
   * Function Player.getBaseDamage
   * Returns the base damage based on the level of the player
   * https://tibia.fandom.com/wiki/Formulae#Base_Damage_and_Healing
   */

  let level = this.skills.getSkillLevel(CONST.PROPERTIES.EXPERIENCE);

  // One base point per 5 levels
  return Math.floor(level / 5);
};

Player.prototype.getAttack = function () {
  /*
   * Function Player.getAttack
   * Returns the attack of the player
   * https://tibia.fandom.com/wiki/Formulae#Melee
   */

  // States of player
  const OFFENSIVE = 0;
  const BALANCED = 1;
  const DEFENSIVE = 2;

  let mode = this.fightMode;

  let B = this.getBaseDamage();
  let W = 20;
  let weaponType = this.containerManager.equipment.getWeaponType();
  let S = this.skills.getSkillLevel(weaponType);

  switch (mode) {
    case OFFENSIVE:
      return B + Math.floor(Math.floor(W * (6 / 5)) * ((S + 4) / 28));
    case BALANCED:
      return B + Math.floor(W * ((S + 4) / 28));
    case DEFENSIVE:
      return B + Math.floor(Math.ceil(W * (3 / 5)) * ((S + 4) / 28));
  }

  return 0;
};

Player.prototype.getDefense = function () {
  /*
   * Function Player.getDefense
   * Returns the attack of a creature
   */

  return this.getProperty(CONST.PROPERTIES.DEFENSE);
};

Player.prototype.setFightMode = function (mode) {
  /*
   * Function Player.setFightMode
   * Sets the combat fight mode (OFFENSIVE, BALANCED, DEFENSIVE)
   */

  // Validate the mode
  if (mode < CONST.FIGHT_MODE.OFFENSIVE || mode > CONST.FIGHT_MODE.DEFENSIVE) {
    return;
  }

  this.fightMode = mode;

  // Log for debugging
  let modeName = ["OFFENSIVE", "BALANCED", "DEFENSIVE"][mode];
  console.log(`[FIGHT_MODE] ${this.name} changed to ${modeName}`);
};

Player.prototype.setChaseMode = function (mode) {
  /*
   * Function Player.setChaseMode
   * Sets the chase mode (STAND, CHASE)
   */

  // Validate the mode
  if (mode < CONST.CHASE_MODE.STAND || mode > CONST.CHASE_MODE.CHASE) {
    return;
  }

  this.chaseMode = mode;

  // Log for debugging
  let modeName = ["STAND", "CHASE"][mode];
  console.log(`[CHASE_MODE] ${this.name} changed to ${modeName}`);
};

Player.prototype.purchase = function (offer, count) {
  /*
   * Function Player.purchase
   * Function to purchase an item from an NPC
   */

  let thing = process.gameServer.database.createThing(offer.id);

  if (thing.isStackable() && count) {
    thing.setCount(count);
  } else if (thing.isFluidContainer() && offer.count) {
    thing.setCount(offer.count);
  }

  if (!this.containerManager.equipment.canPushItem(thing)) {
    return this.sendCancelMessage(
      "You do not have enough available space or capacity."
    );
  }

  // Price is equivalent to the count times price
  if (!this.payWithResource(2148, offer.price * count)) {
    return this.sendCancelMessage("You do not have enough gold.");
  }

  // Add
  this.containerManager.equipment.pushItem(thing);

  return true;
};

Player.prototype.getCapacity = function () {
  /*
   * Function Player.getCapacity
   * Returns the available capacity for the player
   */

  return this.getProperty(CONST.PROPERTIES.CAPACITY);
};

Player.prototype.hasSufficientCapacity = function (thing) {
  /*
   * Function Player.hasSufficientCapacity
   * Returns true if the player has sufficient capacity to carry the thing
   */

  // Get capacity in oz
  let capacity = this.getCapacity();

  // Get weight - in Tibia, weight is stored in 1/100 oz units (e.g., 750 = 7.50 oz)
  // So we need to convert to oz by dividing by 100
  let weightInUnits = thing.getWeight();
  let weightInOz = weightInUnits / 100;


  return capacity >= weightInOz;
};

Player.prototype.payWithResource = function (currencyId, price) {
  /*
   * Function Player.payWithResource
   * Pays a particular price in gold coins
   */

  return this.containerManager.equipment.payWithResource(currencyId, price);
};

Player.prototype.handleBuyOffer = function (packet) {
  /*
   * Function Player.handleBuyOffer
   * Opens trade window with a friendly NPC
   */

  let creature = gameServer.world.creatureHandler.getCreatureFromId(packet.id);

  // The creature does not exist
  if (creature === null) {
    return;
  }

  // Trading only with NPCs
  if (creature.constructor.name !== "NPC") {
    return;
  }

  if (!creature.isWithinHearingRange(this)) {
    return;
  }

  // Get the current offer
  let offer = creature.conversationHandler.tradeHandler.getTradeItem(
    packet.index
  );

  // Try to make the purchase
  if (this.purchase(offer, packet.count)) {
    creature.speechHandler.internalCreatureSay(
      "Here you go!",
      CONST.COLOR.YELLOW
    );
  }
};

Player.prototype.getFluidType = function () {
  /*
   * Function Player.getFluidType
   * Returns the fluid type of a player which is always blood
   */

  return CONST.FLUID.BLOOD;
};

Player.prototype.__handleCreatureKill = function (creature) {
  /*
   * Function Player.__handleCreatureKill
   * Callback fired when the player participates in a creature kill
   */
  //this.questlog.kill(creature);
};

Player.prototype.changeCapacity = function (value) {
  /*
   * Function Player.changeCapacity
   * Changes the available capacity of a player by a value
   * Note: value is in 1/100 oz units (from item weights)
   */


  // Guard: check if CAPACITY property exists
  let currentCapacity = this.getProperty(CONST.PROPERTIES.CAPACITY);
  if (currentCapacity === null) {
    // Property doesn't exist yet, skip during initialization
    return;
  }


  // Convert value from 1/100 oz to oz for capacity change
  // Use Math.trunc() instead of Math.floor() for symmetric truncation
  // Math.floor(-7.5) = -8, Math.floor(7.5) = 7 (asymmetric!)
  // Math.trunc(-7.5) = -7, Math.trunc(7.5) = 7 (symmetric!)
  let valueInOz = Math.trunc(value / 100);

  // Calculate new capacity, ensuring it doesn't go below 0
  let newCapacity = Math.max(0, currentCapacity + valueInOz);

  this.setProperty(CONST.PROPERTIES.CAPACITY, newCapacity);
};

Player.prototype.__updateCurrentCapacity = function () {
  /*
   * Function Player.__updateCurrentCapacity
   * Updates current capacity based on equipped items weight
   */

  if (!this.containerManager) {
    return;
  }

  // Note: Tibia stores weight in 1/100 oz units (e.g., 1800 = 18.00 oz)
  // Capacity is also in 1/100 oz units, so no division needed
  let totalWeight = this.containerManager.equipment.getTotalWeight();
  let maxCapacity = this.getProperty(CONST.PROPERTIES.CAPACITY_MAX);

  // Convert maxCapacity to same units (multiply by 100) since it's stored in oz
  let maxCapacityUnits = maxCapacity * 100;
  let currentCapacity = Math.max(0, maxCapacityUnits - totalWeight);

  // Convert back to oz for display
  let currentCapacityOz = Math.floor(currentCapacity / 100);


  this.setProperty(CONST.PROPERTIES.CAPACITY, currentCapacityOz);
};

Player.prototype.changeSlowness = function (speed) {
  this.speed = this.speed + speed;
  this.write(
    new CreaturePropertyPacket(this.getId(), CONST.PROPERTIES.SPEED, this.speed)
  );
};

Skills.prototype.setMaximumProperties = function () {
  // Based on level and vocation
  let level = this.getSkillLevel(CONST.PROPERTIES.EXPERIENCE);
  let vocation = this.__player.getProperty(CONST.PROPERTIES.VOCATION);

  let { health, mana, capacity } = this.__setMaximumPropertiesConsants(
    vocation,
    level
  );


  // Add these parameters too
  this.__player.properties.add(CONST.PROPERTIES.HEALTH_MAX, health);
  this.__player.properties.add(CONST.PROPERTIES.MANA_MAX, mana);
  this.__player.properties.add(CONST.PROPERTIES.CAPACITY_MAX, capacity);
  // Also add current capacity (initially set to max, will be updated when items are loaded)
  this.__player.properties.add(CONST.PROPERTIES.CAPACITY, capacity);
};

Player.prototype.setFull = function (type) {
  /*
   * Function Player.setFull
   * Sets the property to its maximum value
   */

  // Add debug logs for health
  if (type === CONST.PROPERTIES.HEALTH) {
    console.log(
      `Current Health before set full: ${this.getProperty(
        CONST.PROPERTIES.HEALTH
      )}`
    );
    console.log(
      `Current Health Max: ${this.getProperty(CONST.PROPERTIES.HEALTH_MAX)}`
    );
  }

  switch (type) {
    case CONST.PROPERTIES.HEALTH:
      this.setProperty(
        CONST.PROPERTIES.HEALTH,
        this.getProperty(CONST.PROPERTIES.HEALTH_MAX)
      );
      break;
    case CONST.PROPERTIES.MANA:
      this.setProperty(
        CONST.PROPERTIES.MANA,
        this.getProperty(CONST.PROPERTIES.MANA_MAX)
      );
      break;
  }

  // Log after setting full health
  if (type === CONST.PROPERTIES.HEALTH) {
    console.log(
      `Health after set full: ${this.getProperty(CONST.PROPERTIES.HEALTH)}`
    );
  }
};

Player.prototype.incrementProperty = function (type, amount) {
  /*
   * Function Creature.incrementProperty
   * Increases the health of an entity
   */

  // Set the health of the creature
  this.properties.incrementProperty(type, amount);
};

Player.prototype.setProperty = function (type, value) {
  /*
   * Function Player.setProperty
   * Sets a property value
   */

  let result = this.properties.setProperty(type, value);
  return result;
};

Player.prototype.checkSkillAdvance = function (isBloodHit) {
  /*
   * Function Player.checkSkillAdvance
   * Advances the skill of the player based on the weapon used
   * Uses CONFIG.SKILLS for multipliers
   */

  let weaponType = this.containerManager.equipment.getWeaponType();

  // Determine if it's a distance or melee weapon
  let isDistance = weaponType === CONST.PROPERTIES.DISTANCE;
  let skillConfig = isDistance
    ? (CONFIG.SKILLS && CONFIG.SKILLS.DISTANCE ? CONFIG.SKILLS.DISTANCE : {})
    : (CONFIG.SKILLS && CONFIG.SKILLS.MELEE ? CONFIG.SKILLS.MELEE : {});

  // Get config values with defaults
  let basePoints = skillConfig.BASE_POINTS_PER_HIT || 1;
  let bloodBonus = skillConfig.BLOOD_HIT_BONUS || 2;
  let globalMultiplier = skillConfig.GLOBAL_MULTIPLIER || 1;
  let vocationMultipliers = skillConfig.VOCATION_MULTIPLIERS || {};

  // Get vocation multiplier
  let vocationName = this.getVocationName().toUpperCase();
  let vocationMultiplier = vocationMultipliers[vocationName] || vocationMultipliers.NONE || 1;

  // Calculate final points: blood hit gets bonus, blocked gets base
  let hitPoints = isBloodHit ? (basePoints * bloodBonus) : basePoints;
  let totalPoints = hitPoints * vocationMultiplier * globalMultiplier;

  this.skills.incrementSkill(weaponType, totalPoints);
};

Player.prototype.checkDefensiveSkillAdvance = function () {
  /*
   * Function Player.checkDefensiveSkillAdvance
   * Advances the shielding skill if a shield is used
   * Uses CONFIG.SKILLS for multipliers
   */

  if (this.containerManager.equipment.isShieldEquipped()) {
    // Get config values with defaults
    let skillConfig = CONFIG.SKILLS && CONFIG.SKILLS.SHIELDING ? CONFIG.SKILLS.SHIELDING : {};
    let basePoints = skillConfig.BASE_POINTS_PER_BLOCK || 1;
    let globalMultiplier = skillConfig.GLOBAL_MULTIPLIER || 1;
    let vocationMultipliers = skillConfig.VOCATION_MULTIPLIERS || {};

    // Get vocation multiplier
    let vocationName = this.getVocationName().toUpperCase();
    let vocationMultiplier = vocationMultipliers[vocationName] || vocationMultipliers.NONE || 1;

    let totalPoints = basePoints * vocationMultiplier * globalMultiplier;
    this.skills.incrementSkill(CONST.PROPERTIES.SHIELDING, totalPoints);
  }
};

Player.prototype.isGM = function () {
  return this.getProperty(CONST.PROPERTIES.ROLE) >= 3;
};

Player.prototype.getVocationName = function () {
  /*
   * Function Player.getVocationName
   * Returns the string name of the vocation
   */

  let vocationId = this.getProperty(CONST.PROPERTIES.VOCATION);
  switch (vocationId) {
    case CONST.VOCATION.KNIGHT:
    case CONST.VOCATION.ELITE_KNIGHT:
      return "knight";
    case CONST.VOCATION.PALADIN:
    case CONST.VOCATION.ROYAL_PALADIN:
      return "paladin";
    case CONST.VOCATION.SORCERER:
    case CONST.VOCATION.MASTER_SORCERER:
      return "sorcerer";
    case CONST.VOCATION.DRUID:
    case CONST.VOCATION.ELDER_DRUID:
      return "druid";
    default:
      return "none";
  }
};

Player.prototype.decreaseMana = function (amount) {
  /*
   * Function Player.decreaseMana
   * Decreases the mana of the player
   */

  let currentMana = this.getProperty(CONST.PROPERTIES.MANA);
  let newMana = Math.max(0, currentMana - amount);

  // Update property
  this.setProperty(CONST.PROPERTIES.MANA, newMana);

  // Send update packet to client
  this.write(new CreaturePropertyPacket(this.getId(), CONST.PROPERTIES.MANA, newMana));
};

module.exports = Player;
