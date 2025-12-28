module.exports = function oracle() {

    /*
     * Definitions for NPC The Oracle
     * Handles vocation selection and town teleportation for new players
     */

    // Configuration - Temple positions for each town
    const config = {
        minLevel: 8,
        maxLevel: 10,
        towns: {
            "venore": {
                name: "Venore",
                temple: { x: 32957, y: 32076, z: 8 }
            },
            "thais": {
                name: "Thais",
                temple: { x: 32369, y: 32241, z: 8 }
            },
            "carlin": {
                name: "Carlin",
                temple: { x: 32360, y: 31782, z: 8 }
            }
        },
        vocations: {
            "sorcerer": { id: CONST.VOCATION.SORCERER, name: "Sorcerer" },
            "druid": { id: CONST.VOCATION.DRUID, name: "Druid" },
            "paladin": { id: CONST.VOCATION.PALADIN, name: "Paladin" },
            "knight": { id: CONST.VOCATION.KNIGHT, name: "Knight" }
        }
    };

    // Reference the base state
    this.setBaseState(baseTalkState);

    // Event handlers
    this.on("focus", player => {
        // Use correct API methods
        const level = player.getLevel();
        const vocation = player.getVocation();

        console.log("Oracle focus - Player: %s, Level: %d, Vocation: %d".format(player.name, level, vocation));

        // Check level requirements
        if (level < config.minLevel) {
            this.say("CHILD! COME BACK WHEN YOU HAVE GROWN UP!");
            this.getFocusHandler().reset();
            return;
        }

        if (level > config.maxLevel) {
            this.say("%s, I CAN'T LET YOU LEAVE - YOU ARE TOO STRONG ALREADY! YOU CAN ONLY LEAVE WITH LEVEL %d OR LOWER.".format(player.name, config.maxLevel));
            this.getFocusHandler().reset();
            return;
        }

        // Check if already has a vocation
        if (vocation !== CONST.VOCATION.NONE) {
            this.say("YOU ALREADY HAVE A VOCATION!");
            this.getFocusHandler().reset();
            return;
        }

        this.say("%s, ARE YOU PREPARED TO FACE YOUR DESTINY?".format(player.name));
    });

    this.on("defocus", player => this.say("COME BACK WHEN YOU ARE PREPARED TO FACE YOUR DESTINY!"));
    this.on("exit", player => this.say("COME BACK WHEN YOU ARE PREPARED TO FACE YOUR DESTINY!"));
    this.on("regreet", player => this.say("I AM ALREADY SPEAKING TO YOU, %s!".format(player.name)));
    this.on("idle", player => this.say("WHAT IS YOUR DECISION?"));
    this.on("busy", (focus, player) => this.privateSay(player, "WAIT YOUR TURN, %s!".format(player.name)));

    // Make config available to talk states
    this.config = config;

};

function baseTalkState(state, player, message) {

    /*
     * Function baseTalkState
     * The base state - waiting for player to confirm they are ready
     */

    if (message === "yes") {
        this.respond("IN WHICH TOWN DO YOU WANT TO LIVE: {CARLIN}, {THAIS}, OR {VENORE}?");
        this.setTalkState(townSelectState);
        return;
    }

    if (message === "no") {
        this.respond("THEN COME BACK WHEN YOU ARE READY!");
        return;
    }

}

function townSelectState(state, player, message) {

    /*
     * Function townSelectState
     * Player is selecting their town
     */

    const townConfig = this.config.towns[message];

    if (townConfig) {
        state.town = townConfig;
        this.respond("IN %s! AND WHAT PROFESSION HAVE YOU CHOSEN: {KNIGHT}, {PALADIN}, {SORCERER}, OR {DRUID}?".format(townConfig.name.toUpperCase()));
        this.setTalkState(vocationSelectState, state);
        return;
    }

    this.respond("IN WHICH TOWN DO YOU WANT TO LIVE: {CARLIN}, {THAIS}, OR {VENORE}?");

}

function vocationSelectState(state, player, message) {

    /*
     * Function vocationSelectState
     * Player is selecting their vocation
     */

    const vocationConfig = this.config.vocations[message];

    if (vocationConfig) {
        state.vocation = vocationConfig;
        this.respond("A %s! ARE YOU SURE? THIS DECISION IS IRREVERSIBLE!".format(vocationConfig.name.toUpperCase()));
        this.setTalkState(confirmState, state);
        return;
    }

    this.respond("{KNIGHT}, {PALADIN}, {SORCERER}, OR {DRUID}?");

}

function confirmState(state, player, message) {

    /*
     * Function confirmState
     * Player is confirming their choice
     */

    if (message === "yes") {
        // Apply vocation using setProperty
        player.setProperty(CONST.PROPERTIES.VOCATION, state.vocation.id);

        // Get temple position for the selected town
        const templePos = state.town.temple;
        const Position = requireModule("utils/position");
        const newPosition = new Position(templePos.x, templePos.y, templePos.z);

        // Update player's temple position directly
        player.templePosition = newPosition;

        // Send magic effect at current position before teleport
        gameServer.world.sendMagicEffect(player.position, CONST.EFFECT.MAGIC.TELEPORT);

        // Teleport player to the new town temple
        gameServer.world.creatureHandler.teleportCreature(player, newPosition);

        // Send magic effect at new position after teleport
        gameServer.world.sendMagicEffect(newPosition, CONST.EFFECT.MAGIC.TELEPORT);

        this.say("SO BE IT!");
        this.getFocusHandler().reset();
        return;
    }

    if (message === "no") {
        this.respond("THEN WHAT? {KNIGHT}, {PALADIN}, {SORCERER}, OR {DRUID}?");
        this.setTalkState(vocationSelectState, { town: state.town });
        return;
    }

    this.respond("ARE YOU SURE? THIS DECISION IS IRREVERSIBLE! SAY {YES} OR {NO}.");

}
