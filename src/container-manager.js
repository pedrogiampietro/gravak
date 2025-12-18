"use strict";

const DepotContainer = requireModule("depot");
const Equipment = requireModule("equipment");
const Keyring = requireModule("keyring");
const Thing = requireModule("thing");
const Inbox = requireModule("inbox");

const ContainerManager = function(player, containers) {

  /*
   * Class ContainerManager
   * Manager for all the containers that a player has opened (e.g., depot, backpacks, equipment, corpses)
   *
   * API:
   *
   * ContainerManager.getContainerFromId(cid) - Returns the container from a unique container identifier
   * ContainerManager.toggleContainer(container) - Toggles a container between opened/closed
   * ContainerManager.closeAll() - Closes all opened containers (e.g., when logging out)
   * ContainerManager.checkContainer(container) - Checks whether a single container can still be opened by the player (e.g., after container move)
   * ContainerManager.checkContainers() - Checks whether all containers can still be opened by the player (e.g., after player move)
   *
   */

  // Must circular reference the player
  this.__player = player;

  // Keep a set of the opened containers
  this.__openedContainers = new Map();

  // Depots and equipments are owned by individual players
  this.depot = new DepotContainer(CONST.CONTAINER.DEPOT, containers.depot);
  this.equipment = new Equipment(CONST.CONTAINER.EQUIPMENT, player, containers.equipment);
  this.keyring = new Keyring(CONST.CONTAINER.KEYRING, player, containers.keyring);

  this.inbox = new Inbox(player, containers.inbox);

}

ContainerManager.prototype.MAXIMUM_OPENED_CONTAINERS = 5;

ContainerManager.prototype.toJSON = function() {

  /*
   * Function ContainerManager.toJSON
   * Serializes the container manager
   */

  return new Object({
    "depot": this.depot,
    "equipment": this.equipment,
    "keyring": this.keyring,
    "inbox": this.inbox
  });

}

ContainerManager.prototype.getContainerFromId = function(cid) {

  /*
   * Function Player.getContainerFromId
   * Returns the container that is referenced by a unique identifier
   */

  // Simple mapping of the container identifier
  switch(cid) {
    case CONST.CONTAINER.DEPOT: return (this.depot.isClosed() ? null : this.depot);
    case CONST.CONTAINER.EQUIPMENT: return this.equipment;
    case CONST.CONTAINER.KEYRING: return this.keyring;
    default: return this.__getContainer(cid);
  }

}

ContainerManager.prototype.toggleContainer = function(container) {

  /*
   * Function ContainerManager.toggleContainer
   * Toggles a container between open and closed
   */

  // Either open or close it
  if(this.__openedContainers.has(container.id)) {
    return this.closeContainer(container);
  }

  if(container.isDepot() && this.__openedContainers.has(CONST.CONTAINER.DEPOT)) {
    return this.closeContainer(this.depot);
  }

  return this.__openContainer(container);

}

ContainerManager.prototype.cleanup = function() {

  /*
   * Function ContainerManager.cleanup
   * Closes all the containers that are opened by the player
   */

  // Close all opened containers
  this.__openedContainers.forEach(container => this.closeContainer(container));

}

ContainerManager.prototype.checkContainer = function(container) {

  /*
   * Function ContainerManager.checkContainer
   * Confirms whether a player can still see a container and keep it open
   */

  // Walk up a nested container chain to get the parent tile or character
  let parentThing = container.getTopParent();

  // The parent is the player and can always remain opened
  if(parentThing === this.__player) {
    return;
  }

  // If the parent is a depot but the depot is closed we need to eliminate the container
  if(parentThing === this.depot && this.depot.isClosed()) {
    return this.closeContainer(container);
  }

  // The container is on a tile and not besides the player anymore
  if(!this.__player.isBesidesThing(parentThing)) {
    return this.closeContainer(container);
  }

}

ContainerManager.prototype.checkContainers = function() {

  /*
   * Function ContainerManager.checkContainers
   * Goes over all the containers to check whether they can still be opened by the character
   */

  this.__openedContainers.forEach(this.checkContainer, this);

}

ContainerManager.prototype.closeContainer = function(container) {

  /*
   * Function ContainerManager.closeContainer
   * Closes a container and writes it to disk
   */

  // Guard
  if(!this.__openedContainers.has(container.id)) {
    return;
  }

  // Deference the container in a circular way
  this.__openedContainers.delete(container.id);

  // Close the container
  if(container === this.depot) {
    this.depot.openAtPosition(null);
    this.__player.closeContainer(this.depot.container);
  } else {
    this.__player.closeContainer(container.container);
  }

}

ContainerManager.prototype.__getContainer = function(cid) { 

  /*
   * Function ContainerManager.__getContainer
   * Finds a container by completing a linear search in all opened containers
   */

  if(!this.__openedContainers.has(cid)) {
    return null;
  }

  return this.__openedContainers.get(cid);

}

ContainerManager.prototype.openKeyring = function() {

  /*
   * Function ContainerManager.openKeyring
   * Opens the keyring for the player
   */

  // If already opened, close it
  if(this.__openedContainers.has(CONST.CONTAINER.KEYRING)) {
    this.__openedContainers.delete(CONST.CONTAINER.KEYRING);
    this.__player.closeContainer(this.keyring.container);
    return;
  }

  // Add a reference
  this.__openedContainers.set(CONST.CONTAINER.KEYRING, this.keyring);
  this.__player.openContainer(1987, "Keyring", this.keyring.container);

}

ContainerManager.prototype.__openContainer = function(container) {

  /*
   * Function ContainerManager.__openContainer
   * Writes packet to open a container
   */

  // Is already opened
  if(this.__openedContainers.has(container.id)) {
    return;
  }

  // A maximum of N containers can be referenced
  if(this.__openedContainers.size >= this.MAXIMUM_OPENED_CONTAINERS) {
    return this.__player.sendCancelMessage("You cannot open any more containers.");
  }

  // Sanity check for opening two depots
  if(container.isDepot() && !this.depot.isClosed()) {
    return this.__player.sendCancelMessage("You already have another depot opened.");
  }

  // Open the depot or a simple container
  if(!container.isDepot()) {
    this.__openedContainers.set(container.id, container);
    return this.__player.openContainer(container.id, container.getName(), container.container);
  }

  // Open the depot at the position
  this.__openedContainers.set(CONST.CONTAINER.DEPOT, this.depot);
  this.depot.openAtPosition(container.getPosition());
  this.__player.openContainer(container.id, "Depot", this.depot.container);

}

module.exports = ContainerManager;
