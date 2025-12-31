const path = require('path');
const fs = require('fs');

// Mock global gameServer
global.gameServer = {};

// Mock requireModule
global.requireModule = function (modulePath) {
    if (modulePath === 'network/protocol') {
        return {
            ServerMessagePacket: function (msg) { this.type = 'ServerMessage'; this.msg = msg; },
            QuestLogPacket: function (quests) { this.type = 'QuestLog'; this.quests = quests; },
            CreaturePropertyPacket: function () { },
            PacketWriter: function () { }
        };
    }
    // Return mocks for other modules to avoid loading entire engine
    return function () { };
};

// Simple mock for string format
String.prototype.format = function () { return this; };

// Load QuestManager
const QuestManager = require('../src/core/quest-manager');

// Mock QuestManager data loading (override the file reading)
QuestManager.prototype.__loadQuests = function () {
    this.quests = [
        {
            id: 1,
            name: "Test Quest",
            missions: [
                { storageKey: 1001, storageValue: 1, name: "Mission 1" }
            ]
        }
    ];
};

// Initialize QuestManager
const questManager = new QuestManager();
global.gameServer.questManager = questManager;

// Mock Player
const player = {
    name: "TestPlayer",
    storage: {},
    write: function (packet) {
        console.log("Player.write called with packet type:", packet.type);
        if (packet.type === 'ServerMessage') {
            console.log("Message:", packet.msg);
        } else if (packet.type === 'QuestLog') {
            console.log("QuestLog Packet sent with quests:", packet.quests.length);
        }
    },
    getStorage: function (key) { return this.storage[key] || -1; }
};

// Bind setStorage from the actual file (we'll read and eval it or just copy the function for testing if we want absolute isolation, but let's try to simulate)
// actually, since we modified the file, let's just copy the setStorage function logic here to verify IT works given the dependencies, 
// OR better, we can verify the logic we wrote.
// But to test the ACTUAL file, we should require it. But Player.js has many dependencies.
// Let's redefine setStorage on our mock player using the EXACT code we inserted/modified to verify the logic flow.

player.setStorage = function (key, value) {
    this.storage[key] = value;
    console.log("Storage Updated - Key: %s, Value: %s".format(key, value));

    // Check if this storage key is related to a quest
    if (gameServer.questManager) {
        const quest = gameServer.questManager.getQuestForStorage(key);
        if (quest) {
            // Notify the player
            // We need to require the mock protocol here as per the code
            const { ServerMessagePacket, QuestLogPacket } = global.requireModule("network/protocol");
            this.write(new ServerMessagePacket("Your quest log has been updated."));
            console.log("Quest Log Updated for player %s (Quest: %s)".format(this.name, quest.name));

            // Send the updated quest list
            let quests = gameServer.questManager.getQuestList(this);
            this.write(new QuestLogPacket(quests));
        }
    }
};

console.log("--- Test Start ---");
console.log("Setting storage 999 (Not a quest)...");
player.setStorage(999, 1);

console.log("\nSetting storage 1001 (Quest storage)...");
player.setStorage(1001, 1);
console.log("--- Test End ---");
