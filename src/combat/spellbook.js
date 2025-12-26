"use strict";

const { SpellAddPacket, SpellCastPacket } = requireModule("network/protocol");

const Spellbook = function (player, data) {

  /*
   * Class Spellbook
   * Container for all spells that a player has and handles casting / cooldowns
   */

  // Circular reference
  this.player = player;

  // The map of spells that are currently on cooldown
  this.__spellCooldowns = new Map();

  this.__cooldowns = data.cooldowns;

  // Initialize with ALL spells (0-19) available by default
  this.__availableSpells = new Set();
  for (let sid = 0; sid <= 19; sid++) {
    this.__availableSpells.add(sid);
  }

}

Spellbook.prototype.GLOBAL_COOLDOWN = 0xFFFF;
Spellbook.prototype.GLOBAL_COOLDOWN_DURATION = 20;

Spellbook.prototype.getAvailableSpells = function () {

  /*
   * Function Spellbook.getAvailableSpells
   * Returns the spells that are available in the player's spellbook
   */

  return this.__availableSpells;

}

Spellbook.prototype.toJSON = function () {

  /*
   * Function Spellbook.toJSON
   * Implements the toJSON API to serialize the spellbook when writing to file
   */

  // Serialize
  return new Object({
    "availableSpells": Array.from(this.__availableSpells),
    "cooldowns": Array.from(this.__spellCooldowns).map(this.__serializeCooldown, this)
  });

}

Spellbook.prototype.__serializeCooldown = function ([key, value]) {

  /*
   * Function Spellbook.__serializeCooldown
   * Serializes the cooldowns
   */

  return new Object({
    "sid": key,
    "cooldown": value.remainingFrames()
  });

}

Spellbook.prototype.addAvailableSpell = function (sid) {

  /*
   * Function Spellbook.addAvailableSpell
   * Adds an available spell to the player's spellbook
   */

  // Add it
  this.__availableSpells.add(sid);

  // Inform the player they have learned a new spell
  this.player.sendCancelMessage("You have learned a new spell!");

  this.player.write(new SpellAddPacket(sid));

}

Spellbook.prototype.handleSpell = function (sid, properties) {

  /*
   * Function Spellbook.handleSpell
   * Handles casting of a spell by an entity
   */

  console.log("SID:", sid);

  // Ignore cast requests that are already on cooldown
  if (this.__spellCooldowns.has(this.GLOBAL_COOLDOWN) || this.__spellCooldowns.has(sid)) {
    console.log("Spell on cooldown, skipping");
    return;
  }

  // Try to get the spell
  let spell = gameServer.database.getSpell(sid);
  console.log("Spell from database:", spell ? "found" : "null");

  // Does not exist
  if (spell === null) {
    console.log("Spell not found in database");
    return;
  }

  // The player does not own this spell
  if (!this.__availableSpells.has(sid)) {
    console.log("Player does not have this spell");
    return;
  }

  // Get spell metadata for requirements
  let spellMeta = gameServer.database.getSpellMeta(sid);

  // Check if player is GM (role >= 3) - GMs bypass all checks
  let isGM = this.player.getProperty(CONST.PROPERTIES.ROLE) >= 3;

  if (!isGM && spellMeta) {
    // Check level requirement
    let playerLevel = this.player.skills ? this.player.skills.getSkillLevel(CONST.PROPERTIES.EXPERIENCE) : 1;
    if (playerLevel < spellMeta.level) {
      this.player.sendCancelMessage("You need to be at least level " + spellMeta.level + " to cast this spell.");
      return;
    }

    // Check mana requirement
    let playerMana = this.player.getProperty(CONST.PROPERTIES.MANA);
    if (playerMana < spellMeta.mana) {
      this.player.sendCancelMessage("You do not have enough mana. You need " + spellMeta.mana + " mana.");
      return;
    }

    // Check vocation requirement
    let playerVocation = this.player.getVocationName ? this.player.getVocationName() : "knight";
    if (spellMeta.vocations && spellMeta.vocations.length > 0) {
      if (!spellMeta.vocations.includes(playerVocation.toLowerCase())) {
        this.player.sendCancelMessage("Your vocation cannot cast this spell.");
        return;
      }
    }
  }

  // Call with reference to player
  let cooldown = spell.call(this.player, properties);
  console.log("Spell returned cooldown:", cooldown);

  // Zero cooldown means that the cast was unsuccessful
  if (cooldown === 0) {
    console.log("Cooldown is 0, cast failed");
    return;
  }

  // Consume mana (only for non-GMs)
  if (!isGM && spellMeta && spellMeta.mana > 0) {
    this.player.decreaseMana(spellMeta.mana);
  }

  // Write a packet to the player that the spell needs to be put on cooldown by a number of frames
  console.log("Sending SpellCastPacket...");
  this.player.write(new SpellCastPacket(sid, cooldown));
  console.log("SpellCastPacket sent");

  // Lock it
  this.__lockSpell(sid, cooldown);
  console.log("Spell locked, handleSpell complete");

}

Spellbook.prototype.__lockSpell = function (sid, duration) {

  /*
   * Function Spellbook.__lockSpell
   * Handles locking of a spell by adding it to the cooldown map. A reference to the locked down event is included
   */

  // Also lock to the global cooldown
  this.__internalLockSpell(sid, duration);
  this.__internalLockSpell(this.GLOBAL_COOLDOWN, this.GLOBAL_COOLDOWN_DURATION);

}

Spellbook.prototype.applyCooldowns = function () {

  /*
   * Function Spellbook.applyCooldowns
   * Applies the serialized cooldowns when the player logs in
   */

  // Apply a correction for the duration the player has been offline
  let correction = (Date.now() - this.player.lastVisit);

  this.__cooldowns.forEach(function ({ sid, cooldown }) {

    cooldown = Math.max(0, cooldown - (correction / CONFIG.SERVER.MS_TICK_INTERVAL));

    // Cooldown of zero: not needed
    if (cooldown === 0) {
      return;
    }

    // Lock and inform
    this.__internalLockSpell(sid, cooldown);
    this.player.write(new SpellCastPacket(sid, cooldown));

  }, this);

}

Spellbook.prototype.writeSpells = function (gameSocket) {

  /*
   * Function Spellbook.writeSpells
   * Serializes the spellbook as a binary packet
   */

  this.__availableSpells.forEach(sid => gameSocket.write(new SpellAddPacket(sid)));

}

Spellbook.prototype.__internalLockSpell = function (sid, duration) {

  /*
   * Function Spellbook.__internalLockSpell
   * Internal function actually schedule the lock
   */

  this.__spellCooldowns.set(sid, gameServer.world.eventQueue.addEvent(this.__unlockSpell.bind(this, sid), duration));

}

Spellbook.prototype.__unlockSpell = function (sid) {

  /*
   * Function Spellbook.__unlockSpell
   * Handles unlocking of a spell by deleting it from the cooldown map
   */

  this.__spellCooldowns.delete(sid);

}

module.exports = Spellbook;
