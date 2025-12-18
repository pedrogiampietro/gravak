"use strict";

const Condition = requireModule("condition");
const MailboxHandler = requireModule("mailbox-handler");
const Monster = requireModule("monster");

const { ItemInformationPacket, CreatureInformationPacket } = requireModule("protocol");

const PacketHandler = function() {

  /*
   * Class PacketHandler
   * Handles incoming packets
   */

  this.mailboxHandler = new MailboxHandler();

}

PacketHandler.prototype.handleTileUse = function(player, tile) {

  /*
   * Function PacketHandler.handleTileUse
   * Handles the tile use event
   */
  
  // For the rest of the actions the player must be besides the tile
  if(!player.position.besides(tile.position)) {
    return null;
  }
  
  return tile.getTopItem();

}

PacketHandler.prototype.handleLogout = function(gameSocket) {

  /*
   * Function PacketHandler.handleLogout
   * Handles a logout request from the player
   */

  // Block request because the player is still in combat
  if(gameSocket.player.isInCombat()) {
    return gameSocket.player.sendCancelMessage("You cannot logout while in combat.");
  }

  if(gameSocket.player.isInNoLogoutZone()) {
    return gameSocket.player.sendCancelMessage("You may not logout here.");
  }

  // Otherwise feel free to close the gamesocket and clean up
  gameSocket.close();

}

PacketHandler.prototype.__handlePushCreature = function(creature, position) {

  /*
   * Function PacketHandler.__handlePushCreature
   * Handles pushing of a monster to an adjacent tile
   */

  // If the creature is moving do nothing
  if(creature.isMoving()) {
    return;
  }

  // Must be adjacent
  if(!position.besides(creature.position)) {
    return;
  }

  // Schedule the push event in the future
  gameServer.world.eventQueue.addEvent(creature.push.bind(creature, position), 20);

}

PacketHandler.prototype.moveItem = function(player, packet) {

  /*
   * Function PacketHandler.moveItem
   * Internal private function that moves one object from one place to another: very important!
   */

  let { fromWhere, fromIndex, toWhere, toIndex, count } = packet;

  // Invalid source or target location
  if(fromWhere === null || toWhere === null) {
    return;
  }

  // If moving from a tile the player must be adjacent to that particular tile!
  if(fromWhere.constructor.name === "Tile") {

    // Server check: is the player besides the tile?
    if(!player.position.besides(fromWhere.position)) {
      return player.sendCancelMessage("You are not close enough.");
    }

  }

  // If throwing to a tile check if the player can reach it
  if(toWhere.constructor.name === "Tile") {

    if(!player.position.inLineOfSight(toWhere.position)) {
      return player.sendCancelMessage("You cannot throw this item here.");
    }

  }

  // Get the item that is being moved
  let fromItem = fromWhere.peekIndex(fromIndex);

  // Guard against no item being moved
  if(fromItem === null) {
    return;
  }

  // Can the item be moved at all?
  if(!fromItem.isMoveable() || fromItem.hasUniqueId()) {
    return player.sendCancelMessage("You cannot move this item.");
  }

  // Moving to a place where there is a floor change (or teleporter)
  if(toWhere.constructor.name === "Tile") {

    if(toWhere.hasItems() && toWhere.itemStack.isMailbox() && this.mailboxHandler.canMailItem(fromItem)) {
      return this.mailboxHandler.sendThing(fromWhere, toWhere, player, fromItem);
    }

    // Thrown inside a teleport or stair?
    toWhere = gameServer.world.lattice.findDestination(player, toWhere);

    // No valid destination
    if(toWhere === null) {
      return player.sendCancelMessage("You cannot add this item here.");
    }

    // Trashholders have special handling
    if(toWhere.isTrashholder()) {
      return this.__addThingToTrashholder(fromItem, fromWhere, fromIndex, toWhere, count);
    }

    // Solid for items
    if(toWhere.hasItems() && toWhere.itemStack.isItemSolid()) {
      return player.sendCancelMessage("You cannot add this item here.");
    }

    if(fromItem.isBlockSolid() && toWhere.isOccupiedAny()) {
      return player.sendCancelMessage("You cannot add this item here.");
    }

  }

  // Check for containers and capacity
  if(toWhere.getTopParent() === player) {
    if(!player.hasSufficientCapacity(fromItem)) {
      if(fromWhere.constructor.name === "DepotContainer" || toWhere.getTopParent() !== fromWhere.getTopParent()) {
        return player.sendCancelMessage("Your capacity is insufficient to carry this item.");
      }
    }
  }

  // Check how much maximum can be added
  let maxCount = toWhere.getMaximumAddCount(player, fromItem, toIndex);

  // No items can be added there.
  if(maxCount === 0) {
    return player.sendCancelMessage("You cannot add this item here.");
  }

  // Make sure to limit the moved count to what the player wants to move and the maximum
  let realCount = Math.min(count, maxCount);

  this.__moveItem(player, fromWhere, fromIndex, toWhere, toIndex, realCount);

}

PacketHandler.prototype.__addItemToMailbox = function(player, direction) {

}

PacketHandler.prototype.handleItemLook = function(player, packet) {

  /*
   * Function PacketHandler.handleItemLook
   * Handles a look event at an item or creature or tile
   */

  // Invalid thing supplied
  if(packet.which === null) {
    return;
  }

  // Looking at a creature on the tile
  if(packet.which.constructor.name === "Tile" && packet.which.getCreature()) {
    return player.write(new CreatureInformationPacket(packet.which.getCreature()));
  }

  // Get the item at the requested index
  let thing = packet.which.peekIndex(packet.index);

  // Overwrite with the thing itself
  if(thing === null) {
    thing = packet.which;
  }

  let includeDetails = !thing.hasUniqueId() && (packet.which.constructor.name !== "Tile" || player.isBesidesThing(packet.which));

  return player.write(new ItemInformationPacket(thing, includeDetails));

}

PacketHandler.prototype.handleContainerClose = function(player, containerId) {

  /*
   * Function PacketHandler.handleContainerClose
   * Handles an incoming request to close a container
   */

  let container = player.containerManager.getContainerFromId(containerId);

  if(container !== null) {
    return player.containerManager.closeContainer(container);
  }

}

PacketHandler.prototype.handleTargetCreature = function(player, id) {

  /*
   * Function PacketHandler.handleTargetCreature
   * Handles an incoming creature target packet
   */

  // Cancel target
  if(id === 0) {
    return player.actionHandler.targetHandler.setTarget(null);
  }

  let creature = gameServer.world.creatureHandler.getCreatureFromId(id);

  // No creature found
  if(creature === null) {
    return;
  }

  // Must be of type monster
  if(!(creature instanceof Monster)) {
    return player.sendCancelMessage("You may not attack this creature.");
  }

  // Can see the target
  if(player.canSee(creature.position)) {
    return player.actionHandler.targetHandler.setTarget(creature);
  }

}

PacketHandler.prototype.handlePlayerSay = function(player, packet) {

  /*
   * Function PacketHandler.handlePlayerSay
   * When player says a message handle it
   */

  // Write to the appropriate channel identifier
  let channel = gameServer.world.channelManager.getChannel(packet.id);

  // The channel must exist
  if(channel !== null) {
    return channel.send(player, packet);
  }

}

PacketHandler.prototype.__moveItem = function(player, fromWhere, fromIndex, toWhere, toIndex, count) {

  /*
   * Function PacketHandler.__moveItem
   * Internal private function that moves one object from one place to another
   */

  // Remove the requested item and amount from the source
  let movedItem = fromWhere.removeIndex(fromIndex, count);

  // Cannot take the requested item and count
  if(movedItem === null) {
    return;
  }

  let existthing = null
  if(toWhere.constructor.name === "Tile") {
    existthing = toWhere.getTopItem();
  }

  // Add the taken item to the new target location
  toWhere.addThing(movedItem, toIndex);

  if(toWhere.constructor.name === "Tile") {
    if(existthing === null) {
      toWhere.emit("add", player, movedItem);
    } else {
      existthing.emit("add", player, movedItem);
    }
  }

  // We have to check each players' adjacency after the container has been moved
  if(movedItem.constructor.name === "Container") {
    if(fromWhere.getTopParent() !== toWhere.getTopParent()) {
      movedItem.checkPlayersAdjacency();
    }
  }

  // Emit the move event for the item
  movedItem.emit("move", player, toWhere, movedItem);

}

PacketHandler.prototype.__addThingToTrashholder = function(fromItem, fromWhere, fromIndex, toWhere, count) {

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

module.exports = PacketHandler;
