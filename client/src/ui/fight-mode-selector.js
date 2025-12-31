const FightModeSelector = function () {

    /*
     * Class FightModeSelector
     * Manager for the combat/fight mode selector buttons and chase mode buttons
     * Fight Modes: OFFENSIVE (0), BALANCED (1), DEFENSIVE (2)
     * Chase Modes: STAND (0), CHASE (1)
     */

    // Current fight mode (default to BALANCED = 1)
    this.currentFightMode = 1; // BALANCED

    // Current chase mode (default to STAND = 0)
    this.currentChaseMode = 0; // STAND

    // Reference to the buttons container
    this.container = document.getElementById("fight-mode-selector");

    if (!this.container) {
        console.warn("FightModeSelector: Container not found");
        return;
    }

    // Get the fight mode buttons
    this.fightButtons = {
        offensive: this.container.querySelector('[data-mode="offensive"]'),
        balanced: this.container.querySelector('[data-mode="balanced"]'),
        defensive: this.container.querySelector('[data-mode="defensive"]')
    };

    // Get the chase mode buttons
    this.chaseButtons = {
        stand: this.container.querySelector('[data-chase="stand"]'),
        chase: this.container.querySelector('[data-chase="chase"]')
    };

    // Attach click listeners for fight modes
    // OFFENSIVE = 0, BALANCED = 1, DEFENSIVE = 2
    if (this.fightButtons.offensive) {
        this.fightButtons.offensive.addEventListener("click", this.setFightMode.bind(this, 0));
    }
    if (this.fightButtons.balanced) {
        this.fightButtons.balanced.addEventListener("click", this.setFightMode.bind(this, 1));
    }
    if (this.fightButtons.defensive) {
        this.fightButtons.defensive.addEventListener("click", this.setFightMode.bind(this, 2));
    }

    // Attach click listeners for chase modes
    // STAND = 0, CHASE = 1
    if (this.chaseButtons.stand) {
        this.chaseButtons.stand.addEventListener("click", this.setChaseMode.bind(this, 0));
    }
    if (this.chaseButtons.chase) {
        this.chaseButtons.chase.addEventListener("click", this.setChaseMode.bind(this, 1));
    }

    // Set initial visual state
    this.__updateFightVisualState();
    this.__updateChaseVisualState();

};

FightModeSelector.prototype.setFightMode = function (mode) {

    /*
     * Function FightModeSelector.setFightMode
     * Sets the current fight mode and sends packet to server
     */

    // Already this mode, do nothing
    if (this.currentFightMode === mode) {
        return;
    }

    this.currentFightMode = mode;

    // Send packet to server
    gameClient.send(new FightModePacket(mode));

    // Update button visuals
    this.__updateFightVisualState();

    // Log for debugging
    let modeName = ["OFFENSIVE", "BALANCED", "DEFENSIVE"][mode];
    console.log("[FIGHT_MODE] Client switched to", modeName);

};

FightModeSelector.prototype.setChaseMode = function (mode) {

    /*
     * Function FightModeSelector.setChaseMode
     * Sets the current chase mode and sends packet to server
     */

    // Already this mode, do nothing
    if (this.currentChaseMode === mode) {
        return;
    }

    this.currentChaseMode = mode;

    // Send packet to server
    gameClient.send(new ChaseModePacket(mode));

    // Update button visuals
    this.__updateChaseVisualState();

    // Log for debugging
    let modeName = ["STAND", "CHASE"][mode];
    console.log("[CHASE_MODE] Client switched to", modeName);

};

FightModeSelector.prototype.__updateFightVisualState = function () {

    /*
     * Function FightModeSelector.__updateFightVisualState
     * Updates the visual state of the fight mode buttons
     */

    // Remove 'active' class from all fight buttons
    Object.values(this.fightButtons).forEach(function (button) {
        if (button) button.classList.remove("active");
    });

    // Add 'active' class to current mode button
    switch (this.currentFightMode) {
        case 0: // OFFENSIVE
            if (this.fightButtons.offensive) this.fightButtons.offensive.classList.add("active");
            break;
        case 1: // BALANCED
            if (this.fightButtons.balanced) this.fightButtons.balanced.classList.add("active");
            break;
        case 2: // DEFENSIVE
            if (this.fightButtons.defensive) this.fightButtons.defensive.classList.add("active");
            break;
    }

};

FightModeSelector.prototype.__updateChaseVisualState = function () {

    /*
     * Function FightModeSelector.__updateChaseVisualState
     * Updates the visual state of the chase mode buttons
     */

    // Remove 'active' class from all chase buttons
    Object.values(this.chaseButtons).forEach(function (button) {
        if (button) button.classList.remove("active");
    });

    // Add 'active' class to current mode button
    switch (this.currentChaseMode) {
        case 0: // STAND
            if (this.chaseButtons.stand) this.chaseButtons.stand.classList.add("active");
            break;
        case 1: // CHASE
            if (this.chaseButtons.chase) this.chaseButtons.chase.classList.add("active");
            break;
    }

};
