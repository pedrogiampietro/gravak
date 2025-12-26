"use strict";

const Container = require("../containers/container");
const Corpse = require("../entities/corpse");
const DataValidator = require("../utils/validator");
const Door = require("../entities/door");
const FluidContainer = require("../utils/fluidcontainer");
const House = require("../entities/house");
const Item = require("../entities/item");
const Key = require("../utils/key");
const NPC = require("../npc/npc");
const Readable = require("../entities/readable");
const Rune = require("../utils/rune");
const Teleporter = requireModule("entities/teleporter");
const Thing = require("../entities/thing");
const ThingPrototype = require("../entities/thing-prototype");
const ActionLoader = requireModule("core/database-action-loader");
const OTBMParser = requireModule("parsers/otbm-parser");

const fs = require("fs");

const Database = function () {

  /*
   * Class Database
   * Container for the database that maintains all the server data
   *
   * API:
   * 
   * getSpell(id) - returns a spell with a particular identifier
   * getRune(id) - returns a rune with a particular identifier
   * getMoster(id) - returns a monster with a particular identifier
   * getZone(id) - returns a zone with a particular identifier
   *
   */

  // Validate for server data using JSON schemas
  this.validator = new DataValidator();

  // Parser for the world file
  this.worldParser = new OTBMParser();

  // Loader for the scripting actions
  this.actionLoader = new ActionLoader();

}

Database.prototype.loadHouseItems = function () {

  /*
   * Function Database.loadHouseItems
   * Loads the items that are within the houses
   */

  // Go over all the house definitions
  this.houses.forEach(function (house) {

    // Read the house definition from disk
    let json = JSON.parse(fs.readFileSync(getDataFile("houses", "definitions", "%s.json".format(house.id))));

    json.forEach(function (entry) {

      // Get the tile and create the item
      let tile = gameServer.world.getTileFromWorldPosition(entry.position);
      let thing = gameServer.database.parseThing(entry.item);

      // Push the thing to the top of the tile
      tile.addTopThing(thing);

    });

  });

}

Database.prototype.saveHouses = function () {

  /*
   * Function Database.saveHouses
   * Serializes and saves the house items to disk
   */

  // Go over everything
  this.houses.forEach(function (house) {

    // Collect all things for serialization
    let things = new Array();

    house.tiles.forEach(function (tile) {

      if (!tile.hasOwnProperty("itemStack")) return;

      tile.itemStack.__items.forEach(function (item) {

        // Save everything that can be moved or picked up
        if (!item.isPickupable() && !item.isMoveable()) {
          return;
        }

        // We have to save a position and the item itself
        things.push(new Object({
          "position": tile.position,
          "item": item
        }));

      });

    });

    // Write to disk
    fs.writeFileSync(getDataFile("houses", "definitions", "%s.json".format(house.id)), JSON.stringify(things));

  });

  let done = JSON.stringify(Object.fromEntries(this.houses), null, 2);

  // Write to disk
  fs.writeFileSync(getDataFile("houses", "definitions.json"), done);

}

Database.prototype.initialize = function () {

  /*
   * Function Database.initialize
   * Loads all the server data and things
   */

  // Load all other data files
  this.items = this.__loadItemDefinitions("items");
  this.spells = this.__loadDefinitions("spells");
  this.runes = this.__loadDefinitions("runes");
  this.doors = this.__loadDefinitions("doors");

  // Read house information from the database
  this.houses = this.__loadHouses("houses");

  this.conditions = this.__loadDefinitions("conditions");

  // Actions need the item definitions to be present: so load them now before the game world is parsed
  this.actionLoader.initialize();

  // Load the gameworld itself
  this.worldParser.load(CONFIG.WORLD.WORLD_FILE);

  // Clock events requires the world to be present
  this.actionLoader.attachClockEvents("clock");

  // Load house items
  this.loadHouseItems();

  // Monsters now
  this.monsters = this.__loadDefinitions("monsters");

  // Validate monsters
  Object.entries(this.monsters).forEach(function ([key, value]) {
    this.validator.validateMonster(key, value);
  }, this);

  // NPCs if they are enabled
  if (CONFIG.WORLD.NPCS.ENABLED) {
    this.npcs = this.__loadNPCDefinitions("npcs");
  }

  // Spawns if they are enabled
  if (CONFIG.WORLD.SPAWNS.ENABLED) {
    this.__loadSpawnDefinitions("spawns");
  }

}

Database.prototype.__loadHouses = function (definition) {

  let json = JSON.parse(fs.readFileSync(getDataFile(definition, "definitions.json")));
  let houses = new Map();

  Object.entries(json).forEach(function ([id, entry]) {
    houses.set(Number(id), new House(Number(id), entry));
  });

  return houses;

}

Database.prototype.getHouse = function (hid) {

  if (!this.houses.has(hid)) {
    return null;
  }

  return this.houses.get(hid);

}

Database.prototype.getCondition = function (name) {

  if (!this.conditions.has(name)) {
    return null;
  }

  return this.conditions.get(name);

}

Database.prototype.createThing = function (id) {

  /*
   * Function Database.createThing
   * Creates a new thing from a particular identifier
   */

  // The requested item identifier does not exist
  if (!this.items.hasOwnProperty(id)) {
    return null;
  }

  // Get the right constructor from the identifier
  let thing = this.__createClassFromId(id);

  // Set the weight of pickupable items
  if (thing.isPickupable()) {
    thing.setWeight(thing.getPrototype().properties.weight);
  }

  // Schedule the decay event
  if (thing.isDecaying()) {
    thing.scheduleDecay();
  }

  return thing;

}

Database.prototype.parseItems = function (container, things) {

  /*
   * Function Database.parseItems
   * Recursively parses items from JSON
   */

  things.forEach(function (thing, index) {

    if (thing !== null) {
      return container.addThing(gameServer.database.parseThing(thing), index);
    }

  }, this);

}

Database.prototype.getDoorEvent = function (aid) {

  // Create a bucket to collect the functions
  if (!this.doors.hasOwnProperty(aid)) {
    return null;
  }

  return this.doors[aid];

}

Database.prototype.parseThing = function (item) {

  /*
   * Function Database.parseThing
   * Parses a thing from a database JSON definition
   */

  // Create the thing based on the identifier
  let thing = this.createThing(item.id);

  // Copy over the count
  if (item.count) {
    thing.setCount(item.count);
  }

  // Recursively add items to the container
  if (thing.isContainer()) {

    if (item.items) {
      this.parseItems(thing, item.items);
    }

    if (item.content) {
      this.parseItems(thing, item.content);
    }

  }

  // Copy the item identifier
  if (item.actionId) {
    thing.setActionId(item.actionId);
  }

  if (item.duration) {
    thing.setDuration(item.duration);
    if (thing.isDecaying()) {
      thing.__scheduleDecay(item.duration);
    }
  }

  if (item.content) {
    thing.setContent(item.content);
  }

  return thing;

}

Database.prototype.getMonster = function (id) {

  /*
   * Function Database.getMonster
   * Returns the monsters that belongs to a particular identifier
   */

  // Does not exist
  if (!this.monsters.has(id)) {
    return null;
  }

  return this.monsters.get(id);

}

Database.prototype.getMonsterByName = function (name) {

  /*
   * Function Database.getMonsterByName
   * Finds a monster by name (case-insensitive) and returns { id, data }
   */

  let searchName = name.toLowerCase();

  for (let [id, data] of this.monsters) {
    if (data.creatureStatistics && data.creatureStatistics.name) {
      if (data.creatureStatistics.name.toLowerCase() === searchName) {
        return { id: id, data: data };
      }
    }
  }

  return null;

}

Database.prototype.getItemIdByName = function (name) {

  /*
   * Function Database.getItemIdByName
   * Finds an item by name (case-insensitive exact match) and returns the item ID
   */

  let searchName = name.toLowerCase();

  for (let [id, proto] of Object.entries(this.items)) {
    if (proto.properties && proto.properties.name) {
      if (proto.properties.name.toLowerCase() === searchName) {
        return Number(id);
      }
    }
  }

  return null;

}

Database.prototype.getRune = function (id) {

  /*
   * Function Database.getRune
   * Returns the function that belongs to a rune with a particular ID
   */

  if (!this.runes.has(id)) {
    return null;
  }

  return this.runes.get(id);

}

Database.prototype.getSpell = function (sid) {

  /*
   * Function Database.getSpell
   * Returns the function that belongs to a spell with a particular ID
   */

  if (!this.spells.has(sid)) {
    return null;
  }

  return this.spells.get(sid);

}

Database.prototype.__loadDefinitions = function (definition) {

  /*
   * Function Database.__loadDefinitions
   * Loads particular data definitions from the folders
   */

  let reference = new Map();

  Object.entries(this.readDataDefinition(definition)).forEach(function ([key, value]) {
    reference.set(Number(key), require(getDataFile(definition, "definitions", value)));
  });

  console.log("Loaded [[ %s ]] %s definitions.".format(reference.size, definition));

  return reference;

}

Database.prototype.getThingPrototype = function (id) {

  /*
   * Function Database.getThingPrototype
   * Returns the prototype of a thing with an identifier
   */

  // The item does not exist
  if (!this.items.hasOwnProperty(id)) {
    return null;
  }

  return this.items[id];

}

Database.prototype.getClientId = function (id) {

  /*
   * Function Database.getClientId
   * Returns the client identifier from server identifier
   */

  let proto = this.getThingPrototype(id);

  if (proto === null) {
    return 0;
  }

  return proto.id;

}

Database.prototype.__loadSpawnDefinitions = function (definition) {
  /*
   * Function Database.__loadSpawnDefinitions
   * Loads all the configured spawns and associated monsters
   */

  const Monster = require("../monster/monster");
  const Position = require("../utils/position");

  // Mapping of monster name to ID
  let nameToId = new Map();

  this.monsters.forEach((data, id) => {
    if (data.creatureStatistics && data.creatureStatistics.name) {
      nameToId.set(data.creatureStatistics.name.toLowerCase(), id);
    }
  });

  // Determine the path to the spawn file
  let path = getDataFile("world", "Tibia74-spawns.xml");

  if (!fs.existsSync(path)) {
    return console.log("Could not find spawn file at %s".format(path));
  }

  let content = fs.readFileSync(path, 'utf8');
  let count = 0;

  // Regex for <spawn ...> ... </spawn>
  // Matches centerx, centery, centerz, radius
  let spawnRegex = /<spawn\s+centerx="(\d+)"\s+centery="(\d+)"\s+centerz="(\d+)"\s+radius="(\d+)">([\s\S]*?)<\/spawn>/g;
  let match;

  while ((match = spawnRegex.exec(content)) !== null) {

    let centerX = parseInt(match[1]);
    let centerY = parseInt(match[2]);
    let centerZ = parseInt(match[3]);
    let radius = parseInt(match[4]);
    let innerContent = match[5];

    // Regex for children <monster .../> or <npc .../>
    // Matches type (monster|npc), name, x, y, z
    let childRegex = /<(monster|npc)\s+name="([^"]+)"\s+x="(-?\d+)"\s+y="(-?\d+)"\s+z="(\d+)"/g;
    let childMatch;

    while ((childMatch = childRegex.exec(innerContent)) !== null) {

      let type = childMatch[1];
      let name = childMatch[2];
      let x = parseInt(childMatch[3]);
      let y = parseInt(childMatch[4]);
      let z = parseInt(childMatch[5]);

      // Determine absolute position
      let position = new Position(centerX + x, centerY + y, z);

      // Only handle monsters for now as NPCs have different loading
      if (type === "monster") {

        let id = nameToId.get(name.toLowerCase());

        if (id !== undefined) {

          // Create the monster
          let data = this.getMonster(id);
          let monster = new Monster(id, data);

          // Add to world
          gameServer.world.creatureHandler.addCreatureSpawn(monster, position);
          count++;

        } else {
          // console.log("Unknown monster: %s".format(name));
        }

      }
    }
  }

  console.log("Loaded %s creature spawns.".format(count));

}

Database.prototype.__loadNPCDefinitions = function (definition) {

  /*
   * Function Database.__loadNPCDefinitions
   * Loads the NPC configuration from the data files
   */

  let reference = new Object();

  Object.entries(this.readDataDefinition(definition)).forEach(function ([key, value]) {
    reference[key] = this.__readNPCDefinition(value);
  }, this);

  console.log("Loaded [[ %s ]] %s definitions.".format(Object.keys(reference).length, definition));

  return reference;

}

Database.prototype.__readNPCDefinition = function (name) {

  /*
   * Function Database.getZone
   * Returns the zone that belongs to a particular zone identifier
   */

  let data = require(getDataFile("npcs", "definitions", name.definition));

  // Validate the data: are there errors?
  this.validator.validateNPC(name.definition, data);

  // If enabled add the NPC to the gameworld: otherwise just keep it in memory
  if (name.enabled) {
    // Create the NPC
    let npc = new NPC(data);
    gameServer.world.creatureHandler.addCreatureSpawn(npc, name.position);
    return npc;
  }

  // Return a reference to the npc
  //return npc;

}

Database.prototype.__loadDefinitions = function (definition) {

  /*
   * Function Database.__loadDefinitions
   * Loads particular data definitions from the folders
   */

  let reference = new Map();

  Object.entries(this.readDataDefinition(definition)).forEach(function ([key, value]) {
    reference.set(Number(key), require(getDataFile(definition, "definitions", value)));
  });

  console.log("Loaded [[ %s ]] %s definitions.".format(reference.size, definition));

  return reference;

}

Database.prototype.__loadItemDefinitions = function (definition) {

  /*
   * Function Database.__loadItemDefinitions
   * Loads items from the combined item.xml and items.otbm. These were merged to a JSON file using a tool.
   */

  let reference = new Object();

  // Create a thing prototype
  Object.entries(this.readDataDefinition(definition)).forEach(function ([key, value]) {
    reference[key] = new ThingPrototype(value);
  });

  return reference;

}

Database.prototype.__createClassFromId = function (id) {

  /*
   * Function Database.__createClassFromId
   * Creates the appropriate class entity for a particular identifier
   */

  // Create a wrapper for easy lookup
  let proto = this.getThingPrototype(id);

  if (proto.properties === null) {
    return new Item(id);
  }

  // Specific mapping of thing types to classes
  switch (proto.properties.type) {
    case "corpse": return new Corpse(id, Number(proto.properties.containerSize) || 4);
    case "container": return new Container(id, Number(proto.properties.containerSize) || 4);
    case "fluidContainer": return new FluidContainer(id);
    case "rune": return new Rune(id);
    case "key": return new Key(id);
    case "door": return new Door(id);
    case "readable": return new Readable(id);
    case "teleport": return new Teleporter(id);
    default: return new Item(id);
  }

}

Database.prototype.readDataDefinition = function (definition) {

  /*
   * Function Database.readDataDefinition
   * Loads a JSON definition file from a particular folder
   */

  return JSON.parse(fs.readFileSync(getDataFile(definition, "definitions.json")));

}

module.exports = Database;
