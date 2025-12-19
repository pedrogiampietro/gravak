const Player = function (data) {
  /*
   * Function Player
   * Container for the gameclient player character
   *
   * API:
   *
   *
   */

  // Ensure data exists with default values
  data = data || {};

  // Create default outfit structure
  const defaultOutfit = {
    id: 128,
    frameGroups: {
      north: 1,
      east: 2,
      south: 3,
      west: 4,
    },
    details: {
      head: 78,
      body: 69,
      legs: 58,
      feet: 76,
    },
    mount: 0,
    mounted: false,
    addonOne: false,
    addonTwo: false,
  };

  // Log incoming data for debugging
  console.log("=== DEBUG OUTFIT INITIALIZATION ===");
  console.log("Server outfit data:", data.outfit);

  // Convert outfit instance to plain object and ensure valid values
  const serverOutfit = data.outfit
    ? {
      id: Number(data.outfit.id) || defaultOutfit.id,
      details: {
        head: Number(data.outfit.details?.head) || defaultOutfit.details.head,
        body: Number(data.outfit.details?.body) || defaultOutfit.details.body,
        legs: Number(data.outfit.details?.legs) || defaultOutfit.details.legs,
        feet: Number(data.outfit.details?.feet) || defaultOutfit.details.feet,
      },
      mount: Number(data.outfit.mount) || defaultOutfit.mount,
      mounted: Boolean(data.outfit.mounted),
      addonOne: Boolean(data.outfit.addonOne),
      addonTwo: Boolean(data.outfit.addonTwo),
    }
    : defaultOutfit;

  // Merge with frameGroups
  data.outfit = {
    ...serverOutfit,
    frameGroups: defaultOutfit.frameGroups,
  };

  console.log("Final outfit structure:", data.outfit);

  // Inherit from creature
  Creature.call(this, data);

  this.type = 0;
  this.setState(data);

  // Players have equipment
  this.equipment = new Equipment(data.equipment);
  this.spellbook = new Spellbook(data.spellbook);

  // Private state for the player
  this.__movementEvent = null;
  this.__movementBuffer = null;
  this.__openedContainers = new Set();

  // Can only work again if the server has confirmed
  this.__serverWalkConfirmation = true;

  // Container for the players friendlist
  this.friendlist = new Friendlist(data.friendlist);
};

Player.prototype = Object.create(Creature.prototype);
Player.prototype.constructor = Player;

Player.prototype.getSpeed = function () {
  // Ensure we have a valid base speed
  let base = this.state.speed || 1000;

  if (this.hasCondition(ConditionManager.prototype.HASTE)) {
    base *= 1.3;
  }

  return base;
};

Player.prototype.getStepDuration = function (tile) {
  /*
   * Function Creature.getStepDuration
   * Math to calculate the amount of frames to lock when walking (50MS tick)
   * See: https://tibia.fandom.com/wiki/Speed_Breakpoints
   */

  // Get base speed and ensure it's a valid number
  const speed = this.getSpeed();

  // Tibia-like speed calculation
  const calculatedStepSpeed = Math.max(
    1,
    Math.floor(1000 / Math.max(speed / 100, 1))
  );

  // Get tile friction (default to 1 if not available)
  let groundSpeed = tile?.getFriction() || 1;

  // Calculate final step duration in frames (ensure it's reasonable)
  const stepDuration = Math.min(
    12,
    Math.max(
      1,
      Math.ceil(
        (calculatedStepSpeed * groundSpeed) / gameClient.getTickInterval()
      )
    )
  );

  return stepDuration;
};

Player.prototype.getTile = function () {
  /*
   * Function Player.getTile
   * Returns the tile that the player is currently on
   */

  return gameClient.world.getTileFromWorldPosition(this.__position);
};

Player.prototype.getMaxFloor = function () {
  /*
   * Function Player.getMaxFloor
   * Returns the maximum visible floor for the player: used for rendering
   */

  return gameClient.world
    .getChunkFromWorldPosition(this.getPosition())
    .getFirstFloorFromBottom(this.getPosition());
};

Player.prototype.setCapacity = function (value) {
  /*
   * Function Player.setCapacity
   * Sets the capacity of the respective player
   */

  // Use the passed value, or fall back to state.capacity
  const currentCapacity = typeof value === "number" ? value : this.state.capacity;
  const maxCapacity = this.state.maxCapacity || 400;

  // Keep the DOM in sync with actual value
  document.getElementById(
    "player-capacity"
  ).innerHTML = `Cap: <br>${currentCapacity}`;

};

Player.prototype.setState = function (data) {
  /*
   * Function Player.setState
   * Sets the player state from server data
   */

  // Initialize state if not exists
  if (!this.state) {
    this.state = {};
  }

  console.log("=== DEBUG CLIENT STATE DATA ===");
  console.log("Received data:", data);
  console.log("Speed from server:", data.speed);

  // Keep player state
  this.skills = new Skills(data.skills);
  this.mounts = data.mounts || [];
  this.outfits = data.outfits || [];

  // Add state handlers FIRST (before setting values)
  // This is required because State.add() initializes values to null
  if (typeof this.state.add === "function") {
    this.state.add("capacity", this.setCapacity.bind(this));
    this.state.add("armor", this.setLevelSkillValue.bind(this, "armor"));
    this.state.add("attack", this.setLevelSkillValue.bind(this, "attack"));
    this.state.add("speed", this.setLevelSkillValue.bind(this, "speed"));
  }

  // Set state values using server data with appropriate fallbacks
  // These must be set AFTER add() calls, because add() initializes to null
  this.state.health = data.health || 150;
  this.state.maxHealth = data.maxHealth || 150;
  this.state.mana = data.mana || 35;
  this.state.maxMana = data.manaMax || 55;
  this.state.capacity = typeof data.capacity === "number" ? data.capacity : 400;
  this.state.maxCapacity = data.maxCapacity || 400;
  this.state.speed = typeof data.speed === "number" ? data.speed : 1020; // Default Tibia speed
  this.state.armor = data.armor || 0;
  this.state.attack = data.attack || 0;

  // Debug log the state after setting values
  console.log("=== DEBUG CLIENT STATE AFTER SET ===");
  console.log("Raw state values:");
  console.log(
    "Health:",
    this.state.health,
    "Max Health:",
    this.state.maxHealth
  );
  console.log("Mana:", this.state.mana, "Max Mana:", this.state.maxMana);
  console.log("Speed:", this.state.speed);
  console.log("Capacity:", this.state.capacity);

  // Update the UI
  this.setHealthStatus();
  this.setManaStatus();
};

Player.prototype.setLevelSkillValue = function (which, value) {
  /*
   * Function Player.setLevelSkillValue
   * Returns the percentage required to level up
   */

  gameClient.interface.windowManager
    .getWindow("skill-window")
    .setSkillValue(which, value);
};

Player.prototype.setBarStatus = function (bar) {
  /*
   * Function Player.setBarStatus
   * Sets the mana status to the DOM
   */

  let currentValue, maxValue;

  if (bar.id === "health-bar") {
    currentValue = this.state.health;
    maxValue = this.state.maxHealth;
  } else if (bar.id === "mana-bar") {
    currentValue = this.state.mana;
    maxValue = this.state.maxMana;
  }

  // Ensure we have valid values
  currentValue = currentValue || 0;
  maxValue = maxValue || 1;

  // Calculate percentage for the bar width
  let percentage = ((currentValue / maxValue) * 100).clamp(0, 100);

  bar.firstElementChild.style.width = percentage + "%";
  bar.lastElementChild.innerHTML = `${currentValue}/${maxValue}`;

  console.log(
    `Setting ${bar.id} to ${currentValue}/${maxValue} (${percentage}%)`
  );
};

Player.prototype.getManaFraction = function () {
  /*
   * Function Player.getManaFraction
   * Returns the mana fraction of a player (0 to 1)
   */

  let mana = this.state.mana || 0;
  let maxMana = this.state.maxMana || 1;
  return (mana / maxMana).clamp(0, 1);
};

Player.prototype.setManaStatus = function () {
  /*
   * Function Player.setManaStatus
   * Sets the mana status to the DOM
   */

  this.setBarStatus(document.getElementById("mana-bar"));
};

Player.prototype.setHealthStatus = function () {
  /*
   * Function Player.setHealthStatus
   * Sets the health status to the DOM where required
   */

  // The health bar on the side
  this.setBarStatus(document.getElementById("health-bar"));

  // Gamescreen
  this.characterElement.setDefault();
};

Player.prototype.setAmbientSound = function () {
  /*
   * Player.setAmbientSound
   * Sets the ambient soundtrack
   */

  if (this.isUnderground()) {
    gameClient.interface.soundManager.setAmbientTrace("cave");
    gameClient.interface.soundManager.setVolume("rain", 0);
  } else {
    gameClient.interface.soundManager.setAmbientTrace("forest");

    if (gameClient.renderer.weatherCanvas.isRaining()) {
      gameClient.interface.soundManager.setVolume("rain", 1);
    }
  }
};

Player.prototype.isUnderground = function () {
  /*
   * Function Player.isUnderground
   * Returns true if  the player is underground
   */

  return this.getPosition().z < 8;
};

Player.prototype.setMovementBuffer = function (key) {
  /*
   * Function Player.setMovementBuffer
   * Functions to overwrite the private movement buffer state variable
   */

  this.__movementBuffer = key;
};

Player.prototype.extendMovementBuffer = function (key) {
  /*
   * Function Player.setMovementBuffer
   * Sets the movement buffer of the player to a key
   */

  // This parameter defines the responsiveness of the buffer
  const LENIENCY = 0.75;

  if (this.getMovingFraction() < LENIENCY) {
    return this.setMovementBuffer(key);
  }
};

Player.prototype.confirmClientWalk = function () {
  /*
   * Function Player.confirmClientWalk
   * Confirms the client-side walk-ahead. The player may only walk again after the server has confirmed its move
   */

  if (this.__serverWalkConfirmation) {
    gameClient.renderer.updateTileCache();
  }

  this.__serverWalkConfirmation = true;
};

Player.prototype.isCreatureTarget = function (creature) {
  /*
   * Function Player.isCreatureTarget
   * Returns true is the creature is the current target
   */

  return this.__target === creature;
};

Player.prototype.addExperience = function (experience) {
  /*
   * Function Player.addExperience
   * Adds experience points to the player
   */

  return;
};

Player.prototype.isInProtectionZone = function () {
  return this.getTile().isProtectionZone();
};

Player.prototype.setTarget = function (creature) {
  /*
   * Function Player.setTarget
   * Sets target
   */

  this.__target = creature;
  gameClient.interface.windowManager
    .getWindow("battle-window")
    .setTarget(creature);
};

Player.prototype.openContainer = function (container) {
  /*
   * Function Player.openContainer
   * Opens a container
   */

  this.__openedContainers.add(container);
};

Player.prototype.getItem = function (containerId, slotId) {
  /*
   * Function Player.getItem
   * Returns the carried item from a container and slot index
   */

  let container = this.getContainer(containerId);

  if (container === null) {
    return null;
  }

  return container.getSlotItem(slotId);
};

Player.prototype.getContainer = function (id) {
  /*
   * Function Player.getContainer
   * Returns the container based on the identifier
   */

  // Container identifier 0 refers to the players own equipment
  if (id === 0x00) {
    return this.equipment;
  }

  // Linear direct search for the correct container
  let containers = Array.from(this.__openedContainers);

  for (let i = 0; i < containers.length; i++) {
    if (containers[i].__containerId === id) {
      return containers[i];
    }
  }

  return null;
};

Player.prototype.closeAllContainers = function () {
  /*
   * Function Player.closeAllContainers
   * Cleanup function to close all containers
   */

  this.__openedContainers.forEach(function (container) {
    this.removeContainer(container);
  }, this);
};

Player.prototype.removeContainer = function (container) {
  /*
   * Function Player.removeContainer
   * Removes a container from the DOM
   */

  // Remove the reference from the player
  this.__openedContainers.delete(container);

  // Clean up the element from the DOM
  container.window.remove();
};

Player.prototype.closeContainer = function (container) {
  /*
   * Function Player.closeContainer
   * Closes the container and removes it from the graphical user interface
   */

  gameClient.send(new ContainerClosePacket(container.____containerId));
};

Player.prototype.setTurnBuffer = function (direction) {
  /*
   * Function Player.setTurnBuffer
   * Sets the direction of the player to a new direction
   */

  // If moving update the buffer to be updated when player stops moving
  if (this.isMoving()) {
    return (this.__lookDirectionBuffer = direction);
  }

  // Update the look direction
  this.__setLookDirection(direction);
};

Player.prototype.__setLookDirection = function (direction) {
  /*
   * Function Player.__setLookDirection
   * Sets the direction of the player to a new direction
   */

  this.__lookDirection = direction;
};
