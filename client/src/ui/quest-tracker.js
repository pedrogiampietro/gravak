const QuestTracker = function () {
    /*
     * Class QuestTracker
     * Manages the Quest Tracker overlay on the game screen
     */

    this.element = document.getElementById("quest-tracker");

    // Guard against missing element
    if (!this.element) {
        console.warn("Quest Tracker: #quest-tracker element not found in DOM.");
        this.header = null;
        this.questNameEl = null;
        this.missionListEl = null;
        this.activeQuestId = null;
        return;
    }

    this.header = this.element.querySelector(".tracker-header");
    this.questNameEl = this.element.querySelector(".tracker-quest-name");
    this.missionListEl = this.element.querySelector(".tracker-mission-list");

    this.activeQuestId = null;
}

QuestTracker.prototype.setQuest = function (questId, questName, missions) {
    /*
     * Function QuestTracker.setQuest
     * Sets the current quest to track and shows the overlay
     */
    if (!this.element) return;

    this.activeQuestId = questId;
    this.questNameEl.innerText = questName;

    this.updateMissions(missions);

    this.show();
}

QuestTracker.prototype.updateMissions = function (missions) {
    /*
     * Function QuestTracker.updateMissions
     * Updates the mission list display
     */
    if (!this.element || !this.missionListEl) return;

    this.missionListEl.innerHTML = "";

    if (!missions || missions.length === 0) {
        this.missionListEl.innerHTML = '<div class="tracker-mission">No active missions.</div>';
        return;
    }

    // Flash checking
    this.element.classList.remove("tracker-update");
    void this.element.offsetWidth; // Trigger reflow
    this.element.classList.add("tracker-update");

    missions.forEach(mission => {
        // Basic heuristics to find "counters" or progress in description
        // Ideally the server should send progress data separately, but for now we display the description
        // or the name. User asked for "1/10 rats dead". Assuming description contains this info.

        let div = document.createElement("div");
        div.className = "tracker-mission";

        // We display name and description. 
        // If description is short, it might be the progress.
        div.innerHTML = `
      <div style="font-weight: 500">${mission.name}</div>
      <div style="font-size: 10px; opacity: 0.8">${mission.description}</div>
    `;

        this.missionListEl.appendChild(div);
    });

}

QuestTracker.prototype.clear = function () {
    this.activeQuestId = null;
    this.hide();
}

QuestTracker.prototype.show = function () {
    if (!this.element) return;
    this.element.style.display = "block";
}

QuestTracker.prototype.hide = function () {
    if (!this.element) return;
    this.element.style.display = "none";
}

QuestTracker.prototype.toggle = function () {
    if (!this.element) return;
    if (this.element.style.display === "none") {
        this.show();
    } else {
        this.hide();
    }
}
