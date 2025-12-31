const WindowQuestLog = function (id) {
  /*
   * Class WindowQuestLog
   * Container for the Quest Log (Modal)
   */

  // Inherit from Modal
  Modal.call(this, id);

  // Content body
  this.body = this.element.querySelector(".modal-body");

  // Custom layout with Tibia-style two-panel design + Footer
  // We override flex-direction to column to stack the main content and footer
  // Note: We use the existing body element
  this.body.innerHTML = `
    <div class="quest-log-window" style="flex-direction: column; width: 100%; height: 100%; border: none;">
      
      <!-- Main Content Row -->
      <div style="display: flex; flex-direction: row; flex: 1; overflow: hidden;">
        <div class="quest-list-container">
          <div class="section-header">Quest Lines</div>
          <div class="quest-list" id="quest-log-list">
            <div class="empty-state">Loading...</div>
          </div>
        </div>
        <div class="quest-details-container">
          <div class="section-header quest-details-header" id="quest-details-title">Select a Quest</div>
          <div class="quest-details" id="quest-log-details">
            <div class="empty-state">Select a quest to view details.</div>
          </div>
        </div>
      </div>

      <!-- Footer Panel -->
      <div class="footer-panel">
        <div class="footer-left">
           <select class="tibia-select">
             <option>Alphabetically (A-Z)</option>
           </select>
           
           <input type="text" class="tibia-input" placeholder="Type to search">

           <div class="tibia-checkbox-group">
             <label class="tibia-checkbox">
               <input type="checkbox" checked> Show completed
             </label>
             <div style="flex:1"></div>
           </div>
        </div>

        <div class="footer-right">
           <label class="tibia-checkbox text-right" style="margin-bottom: 4px;">
              <input type="checkbox" action="tracker-check"> Show in quest tracker
           </label>
           
           <div class="tibia-btn-group">
             <button class="tibia-button" action="tracker">Quest Tracker</button>
             <button class="tibia-button" action="close">Close</button>
           </div>
        </div>
      </div>

    </div>
  `;

  this.listContainer = this.body.querySelector("#quest-log-list");
  this.detailsContainer = this.body.querySelector("#quest-log-details");
  this.detailsHeader = this.body.querySelector("#quest-details-title");

  // Bind close button
  const closeBtn = this.body.querySelector('button[action="close"]');
  if (closeBtn) {
    closeBtn.onclick = () => gameClient.interface.modalManager.close();
  }

  // Bind Tracker Button
  const trackerBtn = this.body.querySelector('button[action="tracker"]');
  if (trackerBtn) {
    trackerBtn.onclick = this.handleTrackerClick.bind(this);
  }

  // Bind Tracker Checkbox
  this.trackerCheckbox = this.body.querySelector('input[action="tracker-check"]');
  if (this.trackerCheckbox) {
    this.trackerCheckbox.onchange = this.handleTrackerClick.bind(this);
  }

  this.currentQuests = [];
  this.selectedQuestId = null;
}

WindowQuestLog.prototype = Object.create(Modal.prototype);
WindowQuestLog.prototype.constructor = WindowQuestLog;

WindowQuestLog.prototype.handleTrackerClick = function () {
  if (this.selectedQuestId === null) return;

  let quest = this.currentQuests.find(q => q.id === this.selectedQuestId);
  if (!quest) return;

  // Check if this quest is already being tracked
  if (gameClient.interface.questTracker.activeQuestId === this.selectedQuestId) {
    // Toggle off - hide the tracker
    gameClient.interface.questTracker.clear();
    if (this.trackerCheckbox) this.trackerCheckbox.checked = false;
    return;
  }

  // Set new quest to track
  if (this.currentMissions) {
    gameClient.interface.questTracker.setQuest(this.selectedQuestId, quest.name, this.currentMissions);
    if (this.trackerCheckbox) this.trackerCheckbox.checked = true;
  }
}

WindowQuestLog.prototype.handleOpen = function () {
  /*
   * Function WindowQuestLog.handleOpen
   * Callback fired when the modal is opened
   */

  // Request initial list
  if (gameClient && gameClient.isConnected()) {
    gameClient.send(new QuestLogPacket(0));
  }
}

WindowQuestLog.prototype.setQuests = function (quests) {
  /*
   * Function WindowQuestLog.setQuests
   * Populates the quest list
   */

  this.currentQuests = quests;
  this.listContainer.innerHTML = "";

  if (quests.length === 0) {
    this.listContainer.innerHTML = '<div class="empty-state">No quests started.</div>';
    return;
  }

  quests.forEach(quest => {
    let div = document.createElement("div");
    div.className = "quest-entry";
    if (quest.completed) div.classList.add("completed");

    // Create checkmark span
    let checkSpan = document.createElement("span");
    checkSpan.className = "quest-check";
    div.appendChild(checkSpan);

    // Create name span
    let nameSpan = document.createElement("span");
    nameSpan.className = "quest-name";
    nameSpan.innerText = quest.name;
    div.appendChild(nameSpan);

    div.onclick = () => {
      // Highlight selection
      Array.from(this.listContainer.children).forEach(c => c.classList.remove("selected"));
      div.classList.add("selected");

      this.selectedQuestId = quest.id;
      this.currentMissions = null; // Reset until loaded

      // Update header with quest name
      this.detailsHeader.innerText = quest.name;

      // Update checkbox based on if this quest is being tracked
      if (this.trackerCheckbox) {
        this.trackerCheckbox.checked = (gameClient.interface.questTracker.activeQuestId === quest.id);
      }

      // Request details
      this.requestQuestDetails(quest.id);
    };

    this.listContainer.appendChild(div);
  });
}

WindowQuestLog.prototype.requestQuestDetails = function (questId) {
  /*
   * Function WindowQuestLog.requestQuestDetails
   * Sends packet to request quest details
   */

  this.detailsContainer.innerHTML = '<div class="empty-state">Loading missions...</div>';

  gameClient.send(new QuestLogPacket(questId));
}

WindowQuestLog.prototype.setQuestDetails = function (questId, missions) {
  /*
   * Function WindowQuestLog.setQuestDetails
   * Displays the missions for a quest
   */

  this.detailsContainer.innerHTML = "";

  let questName = "Quest";
  let quest = this.currentQuests.find(q => q.id === questId);
  if (quest) {
    questName = quest.name;
    this.detailsHeader.innerText = questName;
  }

  // Store for tracker usage
  if (questId === this.selectedQuestId) {
    this.currentMissions = missions;
  }

  if (missions.length === 0) {
    this.detailsContainer.innerHTML = '<div class="empty-state">No missions found.</div>';
    return;
  }

  missions.forEach((mission, index) => {
    let div = document.createElement("div");
    div.className = "mission-entry";

    let title = document.createElement("div");
    title.className = "mission-name";

    // Add checkmark for mission
    let checkSpan = document.createElement("span");
    checkSpan.className = "mission-check";
    checkSpan.innerText = "✓";
    title.appendChild(checkSpan);

    let nameText = document.createElement("span");
    nameText.innerText = "Mission " + String(index + 1).padStart(2, "0") + ": " + mission.name;
    title.appendChild(nameText);

    let desc = document.createElement("div");
    desc.className = "mission-description";
    desc.innerText = mission.description;

    div.appendChild(title);
    div.appendChild(desc);
    this.detailsContainer.appendChild(div);
  });
}
