"use strict";

const Condition = requireModule("combat/condition");
const MailboxHandler = requireModule("utils/mailbox-handler");
const Monster = requireModule("monster/monster");

const { ItemInformationPacket, CreatureInformationPacket } = requireModule("network/protocol");

const PacketHandler = function () {

  /*
   * Class PacketHandler
   * Handles incoming packets
   */

  this.mailboxHandler = new MailboxHandler();

}

PacketHandler.prototype.handleTileUse = function (player, tile) {

  /*
   * Function PacketHandler.handleTileUse
   * Handles the tile use event
   */

  // For the rest of the actions the player must be besides the tile
  if (!player.position.besides(tile.position)) {
    return null;
  }

  return tile.getTopItem();

}

PacketHandler.prototype.handleLogout = function (gameSocket) {

  /*
   * Function PacketHandler.handleLogout
   * Handles a logout request from the player
   */

  // Block request because the player is still in combat
  if (gameSocket.player.isInCombat()) {
    return gameSocket.player.sendCancelMessage("You cannot logout while in combat.");
  }

  if (gameSocket.player.isInNoLogoutZone()) {
    return gameSocket.player.sendCancelMessage("You may not logout here.");
  }

  // Otherwise feel free to close the gamesocket and clean up
  gameSocket.close();

}

PacketHandler.prototype.__handlePushCreature = function (creature, position) {

  /*
   * Function PacketHandler.__handlePushCreature
   * Handles pushing of a monster to an adjacent tile
   */

  // If the creature is moving do nothing
  if (creature.isMoving()) {
    return;
  }

  // Must be adjacent
  if (!position.besides(creature.position)) {
    return;
  }

  // Schedule the push event in the future
  gameServer.world.eventQueue.addEvent(creature.push.bind(creature, position), 20);

}

PacketHandler.prototype.moveItem = function (player, packet) {

  /*
   * Function PacketHandler.moveItem
   * Internal private function that moves one object from one place to another: very important!
   */

  let { fromWhere, fromIndex, toWhere, toIndex, count } = packet;

  // Invalid source or target location
  if (fromWhere === null || toWhere === null) {
    return;
  }

  // If moving from a tile the player must be adjacent to that particular tile!
  if (fromWhere.constructor.name === "Tile") {

    // Server check: is the player besides the tile?
    if (!player.position.besides(fromWhere.position)) {
      return player.sendCancelMessage("You are not close enough.");
    }

  }

  // If throwing to a tile check if the player can reach it
  if (toWhere.constructor.name === "Tile") {

    if (!player.position.inLineOfSight(toWhere.position)) {
      return player.sendCancelMessage("You cannot throw this item here.");
    }

  }

  // Get the item that is being moved
  let fromItem = fromWhere.peekIndex(fromIndex);

  // Guard against no item being moved
  if (fromItem === null) {
    return;
  }

  // Can the item be moved at all?
  if (!fromItem.isMoveable() || fromItem.hasUniqueId()) {
    return player.sendCancelMessage("You cannot move this item.");
  }

  // Moving to a place where there is a floor change (or teleporter)
  if (toWhere.constructor.name === "Tile") {

    if (toWhere.hasItems() && toWhere.itemStack.isMailbox() && this.mailboxHandler.canMailItem(fromItem)) {
      return this.mailboxHandler.sendThing(fromWhere, toWhere, player, fromItem);
    }

    // Check if the tile itself is blocking (mountains, walls, etc.)
    if (toWhere.isBlockSolid()) {
      return player.sendCancelMessage("You cannot throw there.");
    }

    // Thrown inside a teleport or stair?
    toWhere = gameServer.world.lattice.findDestination(player, toWhere);

    // No valid destination
    if (toWhere === null) {
      return player.sendCancelMessage("You cannot add this item here.");
    }

    // Trashholders have special handling
    if (toWhere.isTrashholder()) {
      return this.__addThingToTrashholder(fromItem, fromWhere, fromIndex, toWhere, count);
    }

    // Solid for items
    if (toWhere.hasItems() && toWhere.itemStack.isItemSolid()) {
      return player.sendCancelMessage("You cannot add this item here.");
    }

    if (fromItem.isBlockSolid() && toWhere.isOccupiedAny()) {
      return player.sendCancelMessage("You cannot add this item here.");
    }

  }

  // Check for containers and capacity
  if (toWhere.getTopParent() === player) {
    if (!player.hasSufficientCapacity(fromItem)) {
      if (fromWhere.constructor.name === "DepotContainer" || toWhere.getTopParent() !== fromWhere.getTopParent()) {
        return player.sendCancelMessage("Your capacity is insufficient to carry this item.");
      }
    }
  }

  // Check how much maximum can be added
  let maxCount = toWhere.getMaximumAddCount(player, fromItem, toIndex);

  // No items can be added there.
  if (maxCount === 0) {
    return player.sendCancelMessage("You cannot add this item here.");
  }

  // Make sure to limit the moved count to what the player wants to move and the maximum
  let realCount = Math.min(count, maxCount);

  this.__moveItem(player, fromWhere, fromIndex, toWhere, toIndex, realCount);

}

PacketHandler.prototype.__addItemToMailbox = function (player, direction) {

}

PacketHandler.prototype.handleItemLook = function (player, packet) {

  /*
   * Function PacketHandler.handleItemLook
   * Handles a look event at an item or creature or tile
   */

  // Invalid thing supplied
  if (packet.which === null) {
    return;
  }

  // Looking at a creature on the tile
  if (packet.which.constructor.name === "Tile" && packet.which.getCreature()) {
    return player.write(new CreatureInformationPacket(packet.which.getCreature()));
  }

  // Get the item at the requested index
  let thing = packet.which.peekIndex(packet.index);

  // Overwrite with the thing itself
  if (thing === null) {
    thing = packet.which;
  }

  // Check if thing has hasUniqueId method (Tiles don't have this method)
  let hasUniqueId = thing.hasUniqueId ? thing.hasUniqueId() : false;
  let includeDetails = !hasUniqueId && (packet.which.constructor.name !== "Tile" || player.isBesidesThing(packet.which));

  return player.write(new ItemInformationPacket(thing, includeDetails));

}

PacketHandler.prototype.handleContainerClose = function (player, containerId) {

  /*
   * Function PacketHandler.handleContainerClose
   * Handles an incoming request to close a container
   */

  let container = player.containerManager.getContainerFromId(containerId);

  if (container !== null) {
    return player.containerManager.closeContainer(container);
  }

}

PacketHandler.prototype.handleTargetCreature = function (player, id) {

  /*
   * Function PacketHandler.handleTargetCreature
   * Handles an incoming creature target packet
   */

  // Cancel target
  if (id === 0) {
    return player.actionHandler.targetHandler.setTarget(null);
  }

  let creature = gameServer.world.creatureHandler.getCreatureFromId(id);

  // No creature found
  if (creature === null) {
    return;
  }

  // Must be of type monster
  if (!(creature instanceof Monster)) {
    return player.sendCancelMessage("You may not attack this creature.");
  }

  // Can see the target
  if (player.canSee(creature.position)) {
    return player.actionHandler.targetHandler.setTarget(creature);
  }

}

PacketHandler.prototype.handlePlayerSay = function (player, packet) {

  /*
   * Function PacketHandler.handlePlayerSay
   * When player says a message handle it
   */

  // Spell words mapping to spell IDs
  const SPELL_WORDS = {
    // Existing spells (IDs 0-9)
    "exana flam": 0,           // Cure Burning
    "exevo mas flam": 1,       // Explosion
    "exura": 2,                // Light Healing
    "utana vid": 3,            // Invisible
    "utevo res ina": 4,        // Creature Illusion (handled separately below)
    "utevo lux": 5,            // Light
    "exori mort": 6,           // Death Strike
    "exani tera": 7,           // Temple Teleport (Hearthstone)
    "utani hur": 8,            // Haste
    "exani hur": 9,            // Levitate
    // New healing spells
    "exura gran": 10,          // Intense Healing
    "exura vita": 11,          // Ultimate Healing
    "exana pox": 12,           // Antidote
    // New attack spells
    "exori vis": 13,           // Energy Strike
    "exori flam": 14,          // Flame Strike
    "exevo flam hur": 15,      // Fire Wave
    "exevo vis lux": 16,       // Energy Beam
    // New support spells
    "utani gran hur": 17,      // Strong Haste
    "utamo vita": 18,          // Magic Shield
    "utevo gran lux": 19       // Great Light
  };

  // Check if message is a spell
  let messageLower = packet.message.toLowerCase().trim();

  // Special handling for Creature Illusion (utevo res ina "monster")
  if (messageLower.startsWith("utevo res ina ")) {
    let monsterName = messageLower.substring(14).replace(/"/g, "").trim(); // Remove prefix and quotes
    let monster = gameServer.database.getMonsterByName(monsterName);

    if (monster) {
      // Cast Morph (ID 4) with the monster's look type
      // Monster outfit is in monster.data.creatureStatistics.outfit
      let look = (monster.data && monster.data.creatureStatistics) ? monster.data.creatureStatistics.outfit : null;
      let lookId = look ? look.id : CONST.LOOKTYPES.OTHER.GAMEMASTER;

      return player.spellbook.handleSpell(4, { id: lookId });
    } else {
      player.sendCancelMessage("A creature with that name does not exist.");
      return;
    }
  }

  if (SPELL_WORDS.hasOwnProperty(messageLower)) {
    let spellId = SPELL_WORDS[messageLower];

    // First, show the spell words as speech on screen and in chat (like real Tibia)
    // We access the speech handler directly to force the orange color for spells
    player.speechHandler.internalCreatureSay(packet.message, CONST.COLOR.ORANGE);

    // Then execute the spell
    return player.spellbook.handleSpell(spellId);
  }

  // Write to the appropriate channel identifier
  let channel = gameServer.world.channelManager.getChannel(packet.id);

  // The channel must exist
  if (channel !== null) {
    return channel.send(player, packet);
  }

}

PacketHandler.prototype.__moveItem = function (player, fromWhere, fromIndex, toWhere, toIndex, count) {

  /*
   * Function PacketHandler.__moveItem
   * Internal private function that moves one object from one place to another
   */

  // Remove the requested item and amount from the source
  let movedItem = fromWhere.removeIndex(fromIndex, count);

  // Cannot take the requested item and count
  if (movedItem === null) {
    return;
  }

  let existthing = null;
  if (toWhere.constructor.name === "Tile") {
    existthing = toWhere.getTopItem();
  }

  // Use smart placement for containers and depot (auto-stack and first empty slot)
  if (toWhere.constructor.name === "DepotContainer" || (toWhere.isContainer && toWhere.isContainer())) {
    // Use addThingSmart which handles stacking and empty slot logic
    let added = toWhere.addThingSmart(movedItem);
    if (!added) {
      // Failed to add - container might be full, return item to source
      fromWhere.addThing(movedItem, fromIndex);
      player.sendCancelMessage("There is not enough room.");
      return;
    }
  } else {
    // Add the taken item to the new target location (Tile, Equipment, etc.)
    toWhere.addThing(movedItem, toIndex);
  }

  if (toWhere.constructor.name === "Tile") {
    if (existthing === null) {
      toWhere.emit("add", player, movedItem);
    } else {
      existthing.emit("add", player, movedItem);
    }
  }

  // We have to check each players' adjacency after the container has been moved
  if (movedItem.constructor.name === "Container") {
    if (fromWhere.getTopParent() !== toWhere.getTopParent()) {
      movedItem.checkPlayersAdjacency();
    }
  }

  // Emit the move event for the item
  movedItem.emit("move", player, toWhere, movedItem);

}

PacketHandler.prototype.__addThingToTrashholder = function (fromItem, fromWhere, fromIndex, toWhere, count) {

  /*
   * Function PacketHandler.addThingToTrashholder
   * Adds an item to the trashholder and completely deletes it
   */

  // Send deletion magic
  gameServer.world.sendMagicEffect(toWhere.position, toWhere.getTrashEffect());

  // Make sure to clean up the item
  fromItem.cleanup();

  // Delete the item and count
  return fromWhere.removeIndex(fromIndex, count);

}

PacketHandler.prototype.writeText = function (player, packet) {

  /*
   * Function PacketHandler.writeText
   * Handles writing text to an item (labels, letters, books)
   */

  // Read the item ID and content from packet
  let itemId = packet.readUInt32();
  let content = packet.readString();

  // Find the item in player's inventory
  // The itemId is the server-side thing ID
  let item = player.containerManager.findItemById(itemId);

  if (item === null) {
    return player.sendCancelMessage("You cannot edit this item.");
  }

  // Check if item is writeable
  if (!item.isWriteable || !item.isWriteable()) {
    return player.sendCancelMessage("This item cannot be edited.");
  }

  // Set the content
  item.setContent(content);

  // Send confirmation message
  player.sendCancelMessage("Your text has been saved.");

}

PacketHandler.prototype.handleQuestLog = function (player, questId) {
  /*
   * Function PacketHandler.handleQuestLog
   * Handles request for quest log data
   */

  console.log("PacketHandler: handleQuestLog called for questId:", questId);

  const { QuestLogPacket, QuestLinePacket } = requireModule("network/protocol");

  if (questId === 0) {
    // Send Quest List
    let quests = gameServer.questManager.getQuestList(player);
    console.log("PacketHandler: Sending quest list with " + quests.length + " quests.");
    player.socketHandler.write(new QuestLogPacket(quests));
  } else {
    // Send Quest Missions
    let missions = gameServer.questManager.getQuestMissions(player, questId);
    console.log("PacketHandler: Sending quest missions for quest " + questId);
    if (missions.length > 0) {
      player.socketHandler.write(new QuestLinePacket(questId, missions));
    }
  }
}

module.exports = PacketHandler;
