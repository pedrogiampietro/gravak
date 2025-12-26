"use strict";

const path = require("path");
const Position = requireModule("utils/position");
const NPC = requireModule("npc/npc");
const { ServerMessagePacket } = requireModule("network/protocol");

const CommandHandler = function () { };

CommandHandler.prototype.WAYPOINTS = new Object({
  rookgaard: new Position(32097, 32219, 8),
  thais: new Position(32369, 32241, 8),
  carlin: new Position(32360, 31782, 8),
  "ab'dendriel": new Position(32732, 31634, 8),
  venore: new Position(32957, 32076, 8),
  poh: new Position(32816, 32260, 10),
  "gm-island": new Position(32316, 31942, 8),
  senja: new Position(32125, 31667, 8),
  dracona: new Position(32804, 31586, 15),
  "orc-fortress": new Position(32882, 31772, 9),
  edron: new Position(33217, 31814, 7),
  kazordoon: new Position(32649, 31925, 4),
  ankrahmun: new Position(33194, 32853, 7),
  darama: new Position(33213, 32454, 14),
  cormaya: new Position(33301, 31968, 8),
  fibula: new Position(32174, 32437, 8),
  "white-flower": new Position(32346, 32362, 9),
  "femur-hills": new Position(32536, 31837, 11),
  "ghost-ship": new Position(33321, 32181, 8),
  mintwallin: new Position(32456, 32100, 0),
  cyclopolis: new Position(33251, 31695, 8),
  annihilator: new Position(33221, 31671, 2),
});

CommandHandler.prototype.handleCommandWaypoint = function (player, waypoint) {
  /*
   * CommandHandler.handleCommandWaypoint
   * Executes the waypoint command
   */

  if (!this.WAYPOINTS.hasOwnProperty(waypoint)) {
    return player.sendCancelMessage("This waypoint does not exist.");
  }

  return gameServer.world.creatureHandler.teleportCreature(
    player,
    this.WAYPOINTS[waypoint]
  );
};

CommandHandler.prototype.handleCommandAddSkill = function (
  player,
  skill,
  amount
) {
  if (skill === "level") {
    try {
      // Obter exp atual do objeto skills
      const currentExp = player.skills.experience || 0;
      const currentLevel = Math.floor(currentExp / 100) + 1;
      const targetLevel = currentLevel + Number(amount);


      // Calcular exp necessária
      const Skill = requireModule("utils/skill");
      const skillInstance = new Skill();
      const targetExp = skillInstance.getExperience(targetLevel);
      const currentLevelExp = skillInstance.getExperience(currentLevel);
      const expRequired = targetExp - currentLevelExp;


      // Recalcular atributos baseados no novo level
      const newHealth = 150 + (targetLevel - 1) * 5;
      const newMana = 35 + (targetLevel - 1) * 5;
      const newCap = 400 + (targetLevel - 1) * 10;

      // Atualizar o player em tempo real usando as constantes corretas
      // Primeiro setamos o MAX, depois o atual
      player.setProperty(2, newHealth); // MAX_HEALTH primeiro
      player.setProperty(1, newHealth); // HEALTH depois
      player.setProperty(4, newMana); // MAX_MANA primeiro
      player.setProperty(3, newMana); // MANA depois
      player.setProperty(5, newCap); // CAPACITY

      // Atualizar os valores no objeto properties
      if (player.properties) {
        player.properties.health = newHealth;
        player.properties.maxHealth = newHealth;
        player.properties.mana = newMana;
        player.properties.maxMana = newMana;
        player.properties.capacity = newCap;
      }

      // Salvar no banco de dados
      if (player.socketHandler && player.socketHandler.account) {
        // Criar um objeto com os dados atualizados
        const characterData = {
          position: {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
          },
          skills: {
            magic: player.skills.magic || 0,
            fist: player.skills.fist || 10,
            club: player.skills.club || 10,
            sword: player.skills.sword || 10,
            axe: player.skills.axe || 10,
            distance: player.skills.distance || 10,
            shielding: player.skills.shielding || 10,
            fishing: player.skills.fishing || 10,
            experience: currentExp + expRequired,
          },
          properties: {
            name: player.properties.name,
            health: newHealth,
            mana: newMana,
            maxHealth: newHealth,
            maxMana: newMana,
            capacity: newCap,
            speed: player.properties.speed,
            defense: player.properties.defense,
            attack: player.properties.attack,
            attackSpeed: player.properties.attackSpeed,
            direction: player.properties.direction,
            outfit: player.properties.outfit,
            role: player.properties.role,
            vocation: player.properties.vocation,
            sex: player.properties.sex,
            availableMounts: player.properties.availableMounts,
            availableOutfits: player.properties.availableOutfits,
          },
          lastVisit: Date.now(),
          containers: player.containers,
          spellbook: player.spellbook,
          friends: player.friends,
          templePosition: {
            x: player.templePosition.x,
            y: player.templePosition.y,
            z: player.templePosition.z,
          },
        };

        // Atualizar o player em memória
        player.skills = characterData.skills;
        player.properties = characterData.properties;

        const AccountDatabase = requireModule("auth/account-database");
        const db = new AccountDatabase();

        // Create a mock gameSocket object to use saveCharacter
        const mockGameSocket = {
          player: player,
          account: player.socketHandler.account
        };

        // Use the saveCharacter method
        db.saveCharacter(mockGameSocket, function (error) {
          if (error) {
            console.error("[AddSkill] Error saving to database:", error);
          } else {
            console.log("[AddSkill] Character saved successfully to database");
          }
        });
      }

      // Notificar o cliente sobre as mudanças
      return gameServer.world.broadcastPacket(
        new ServerMessagePacket(
          `Added ${expRequired} experience points (${amount} levels). New level: ${targetLevel}`
        )
      );
    } catch (error) {
      console.error("[AddSkill] Error:", error);
      return gameServer.world.broadcastPacket(
        new ServerMessagePacket("An error occurred while adding experience.")
      );
    }
  }

  return gameServer.world.broadcastPacket(
    new ServerMessagePacket("Invalid skill type. Available: level")
  );
};

CommandHandler.prototype.handle = function (player, message) {
  //if(player.getProperty(CONST.PROPERTIES.ROLE) !== CONST.ROLES.ADMIN) {
  //  return;
  //}

  message = message.split(" ");

  if (message[0] === "/property") {
    return player.setProperty(Number(message[1]), Number(message[2]));
  }

  if (message[0] === "/waypoint") {
    return this.handleCommandWaypoint(player, message[1]);
  }

  if (message[0] === "/teleport") {
    return gameServer.world.creatureHandler.teleportCreature(
      player,
      new Position(Number(message[1]), Number(message[2]), Number(message[3]))
    );
  }

  if (message[0] === "/broadcast") {
    return gameServer.world.broadcastPacket(
      new ServerMessagePacket(message[1])
    );
  }

  if (message[0] === "/m") {
    let arg = message.slice(1).join(" ");
    let id = Number(arg);

    // If not a number, search by name
    if (isNaN(id) || arg === "") {
      let result = gameServer.database.getMonsterByName(arg);
      if (result === null) {
        return player.sendCancelMessage("Monster not found: " + arg);
      }
      id = result.id;
    }

    return gameServer.world.creatureHandler.spawnCreature(
      id,
      player.getPosition()
    );
  }

  if (message[0] === "/path") {
    let a = player.getPosition();
    let b = a.add(new Position(Number(message[1]), Number(message[2]), 0));
    let p = gameServer.world.findPath(player, a, b, 1);
    p.forEach(function (tile) {
      gameServer.world.sendMagicEffect(
        tile.getPosition(),
        CONST.EFFECT.MAGIC.TELEPORT
      );
    });
  }

  if (message[0] === "/addskill") {
    return this.handleCommandAddSkill(player, message[1], message[2]);
  }

  // Create item command: /i [item_id_or_name] [count]
  if (message[0] === "/i") {
    let itemArg = message[1];
    let count = 1;
    let itemId = null;

    // Check if first argument is a number (ID)
    if (!isNaN(Number(itemArg))) {
      itemId = Number(itemArg);
      count = Number(message[2]) || 1;
    } else {
      // Try to find by name - join remaining args (except last if it's a number for count)
      let nameArgs = message.slice(1);

      // Check if last arg is a number (count)
      let lastArg = nameArgs[nameArgs.length - 1];
      if (nameArgs.length > 1 && !isNaN(Number(lastArg))) {
        count = Number(lastArg);
        nameArgs = nameArgs.slice(0, -1);
      }

      let itemName = nameArgs.join(" ");
      itemId = gameServer.database.getItemIdByName(itemName);

      if (itemId === null) {
        return player.sendCancelMessage("Item '" + itemName + "' not found. Usage: /i [id_or_name] [count]");
      }
    }

    // Validate item ID
    if (isNaN(itemId) || itemId <= 0) {
      return player.sendCancelMessage("Invalid item. Usage: /i [item_id_or_name] [count]");
    }

    // Create the item
    let thing = gameServer.database.createThing(itemId);

    if (thing === null) {
      return player.sendCancelMessage("Item with ID " + itemId + " does not exist.");
    }

    // Set count for stackable items
    if (thing.isStackable() && count > 1) {
      thing.setCount(Math.min(count, 100)); // Max 100 for stackable items
    }

    // Add the item to the player's position
    gameServer.world.addTopThing(player.getPosition(), thing);

    // Send success message with item name if available
    let itemName = thing.getPrototype().properties?.name || itemId;
    return player.sendCancelMessage("Created " + itemName + (count > 1 ? " x" + count : ""));
  }

  if (message[0] === "/goto") {
    let name = message.slice(1).join(" ").toLowerCase();

    // Find the creature
    let target = null;
    let targetName = "";
    let found = false;

    gameServer.world.creatureHandler.__creatureMap.forEach(function (creature) {
      if (found) return;

      // Get creature name using getProperty for consistency
      let creatureName = creature.getProperty(CONST.PROPERTIES.NAME);
      if (creatureName && creatureName.toLowerCase() === name) {
        target = creature;
        targetName = creatureName;
        found = true;
      }
    });

    if (target) {
      gameServer.world.creatureHandler.teleportCreature(player, target.getPosition());
      return player.sendCancelMessage("Teleported to " + targetName + ".");
    } else {
      return player.sendCancelMessage("Creature not found: " + name);
    }
  }

  // Spawn NPC command: /npc [npc_name]
  if (message[0] === "/npc") {
    let npcName = message.slice(1).join(" ").toLowerCase();

    if (!npcName) {
      return player.sendCancelMessage("Usage: /npc [npc_name]. Available: cipfried, aldee");
    }

    try {
      // Build path to NPC definition file using process.cwd()
      let npcFile = npcName + ".json";
      let npcPath = path.join(process.cwd(), "data", "740", "npcs", "definitions", npcFile);


      // Clear cache to allow reloading
      if (require.cache[npcPath]) {
        delete require.cache[npcPath];
      }

      let data = require(npcPath);

      // Create and spawn NPC at player position
      let npc = new NPC(data);
      gameServer.world.creatureHandler.addCreatureSpawn(npc, player.getPosition());

      return player.sendCancelMessage("Spawned NPC: " + data.creatureStatistics.name);
    } catch (error) {
      return player.sendCancelMessage("NPC error: " + error.message);
    }
  }

  // Learn all spells command: /learnall
  if (message[0] === "/learnall") {
    // Add all spell IDs (0-19) to player's spellbook
    for (let sid = 0; sid <= 19; sid++) {
      if (!player.spellbook.getAvailableSpells().has(sid)) {
        player.spellbook.addAvailableSpell(sid);
      }
    }
    return player.sendCancelMessage("You have learned all spells (0-19)!");
  }

  // Reset character command: /reset
  if (message[0] === "/reset") {
    // Reset to level 1 stats
    player.skills.experience = 0;
    player.skills.magic = 0;
    player.skills.fist = 10;
    player.skills.club = 10;
    player.skills.sword = 10;
    player.skills.axe = 10;
    player.skills.distance = 10;
    player.skills.shielding = 10;
    player.skills.fishing = 10;

    // Reset properties to level 1 values
    player.setProperty(CONST.PROPERTIES.HEALTH, 150);
    player.setProperty(CONST.PROPERTIES.MAX_HEALTH, 150);
    player.setProperty(CONST.PROPERTIES.MANA, 35);
    player.setProperty(CONST.PROPERTIES.MAX_MANA, 35);
    player.setProperty(CONST.PROPERTIES.CAPACITY, 400);

    // Also update properties object if it exists
    if (player.properties) {
      player.properties.health = 150;
      player.properties.maxHealth = 150;
      player.properties.mana = 35;
      player.properties.maxMana = 35;
      player.properties.capacity = 400;
    }

    return player.sendCancelMessage("Character reset to Level 1! Experience: 0, HP: 150, Mana: 35");
  }

  // Test magic effect command: /z [effect_id]
  if (message[0] === "/z") {
    let effectId = Number(message[1]);

    if (isNaN(effectId) || effectId < 0) {
      return player.sendCancelMessage("Usage: /z [effect_id] - Shows magic effect at your position.");
    }

    gameServer.world.sendMagicEffect(player.getPosition(), effectId);
    return player.sendCancelMessage("Effect " + effectId + " displayed.");
  }

  // Test distance/missile effect command: /x [shoot_type_id]
  if (message[0] === "/x") {
    let shootType = Number(message[1]);

    if (isNaN(shootType) || shootType < 0) {
      return player.sendCancelMessage("Usage: /x [shoot_type_id] - Shoots missile from you.");
    }

    // Get target position (3 tiles in front of player based on direction)
    let from = player.getPosition();
    let direction = player.getProperty(CONST.PROPERTIES.DIRECTION) || 2; // Default south
    let dx = 0, dy = 0;

    switch (direction) {
      case 0: dy = -3; break; // North
      case 1: dx = 3; break;  // East
      case 2: dy = 3; break;  // South
      case 3: dx = -3; break; // West
    }

    let to = from.add(new Position(dx, dy, 0));
    gameServer.world.sendDistanceEffect(from, to, shootType);
    return player.sendCancelMessage("Missile " + shootType + " fired.");
  }
};

module.exports = CommandHandler;
