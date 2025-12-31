"use strict";

const fs = require("fs");
const path = require("path");

const QuestManager = function () {
    /*
     * Class QuestManager
     * Manages the definitions of quests and their states
     */

    this.quests = [];
    this.__loadQuests();
}

QuestManager.prototype.__loadQuests = function () {
    /*
     * Function QuestManager.__loadQuests
     * Loads the quest definitions from JSON
     */

    try {
        const filePath = path.join(__dirname, "../../data/740/quests.json");
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath);
            this.quests = JSON.parse(data);
            console.log("Loaded [[ %s ]] quests definitions.".format(this.quests.length));
        } else {
            console.warn("No quests.json found in data directory.");
        }
    } catch (error) {
        console.error("Failed to load quests:", error);
    }
}

QuestManager.prototype.getQuestList = function (player) {
    /*
     * Function QuestManager.getQuestList
     * Returns a list of quests and their current status for a player
     * Status: "started" or "completed" (logic to be refined needed)
     */

    let playerQuests = [];

    this.quests.forEach(quest => {
        // We check the first mission to see if the quest is started
        if (quest.missions.length === 0) return;

        let firstMission = quest.missions[0];
        let storageValue = player.getStorage(firstMission.storageKey);

        console.log("Checking Quest: %s (ID: %s), Mission: %s, Required: %s, Player Has: %s".format(
            quest.name, quest.id, firstMission.name, firstMission.storageValue, storageValue
        ));

        // If the player has the storage key set to a value >= the first mission's value, the quest is started
        if (storageValue >= firstMission.storageValue) {
            // Determine if completed (logic can be improved, e.g., check last mission)
            let lastMission = quest.missions[quest.missions.length - 1];
            let isCompleted = player.getStorage(lastMission.storageKey) > lastMission.storageValue; // Example logic

            playerQuests.push({
                id: quest.id,
                name: quest.name,
                completed: isCompleted
            });
        }
    });

    return playerQuests;
}

QuestManager.prototype.getQuestMissions = function (player, questId) {
    /*
     * Function QuestManager.getQuestMissions
     * Returns missions for a specific quest
     */

    let quest = this.quests.find(q => q.id === questId);
    if (!quest) return [];

    let missions = [];

    quest.missions.forEach(mission => {
        let storageValue = player.getStorage(mission.storageKey);

        // Show mission if player has reached the required storage value
        if (storageValue >= mission.storageValue) {
            missions.push({
                name: mission.name,
                description: mission.description
            });
        }
    });

    return missions;
}

QuestManager.prototype.getQuestForStorage = function (storageKey) {
    /*
     * Function QuestManager.getQuestForStorage
     * Returns the quest associated with a storage key, or null
     */

    return this.quests.find(quest => {
        return quest.missions.some(mission => mission.storageKey === storageKey);
    }) || null;
}

module.exports = QuestManager;
