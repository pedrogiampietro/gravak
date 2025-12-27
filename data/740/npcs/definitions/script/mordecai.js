module.exports = function mordecai() {

    /*
     * Definitions for NPC Mordecai
     * Magic shop - sells runes, wands, rods, and fluids
     */

    // Reference the base state
    this.setBaseState(baseTalkState);

    // Event handlers
    this.on("focus", player => {
        // Check vocation for personalized greeting
        let vocation = player.getProperty(CONST.PROPERTIES.VOCATION);
        let gender = player.getProperty(CONST.PROPERTIES.SEX) === 1 ? "brother" : "sister";

        if (vocation === CONST.VOCATION.SORCERER || vocation === CONST.VOCATION.MASTER_SORCERER ||
            vocation === CONST.VOCATION.DRUID || vocation === CONST.VOCATION.ELDER_DRUID) {
            this.say("Welcome back, %s %s! What magical supplies do you need today?".format(gender, player.name));
        } else {
            this.say("Hello, %s! I sell magical supplies. Say {trade} to see my wares!".format(player.name));
        }
    });

    this.on("defocus", player => this.say("May the arcane guide you, %s!".format(player.name)));
    this.on("exit", player => this.say("Farewell, traveler!"));
    this.on("regreet", player => this.say("Yes? Need something else? Say {trade} to see my wares."));
    this.on("idle", player => this.say("Still there? Don't be shy, just say {trade}."));
    this.on("busy", (focus, player) => this.privateSay(player, "Please wait, I am attending to %s.".format(focus.name)));

}

function baseTalkState(state, player, message) {

    /*
     * Function baseTalkState
     * The base state of the NPC. It will respond to keywords
     */

    switch (message) {
        case "trade":
            this.tradeHandler.openTradeWindow(player);
            return this.respond("Here are my magical wares. What can I get for you?");
        case "help":
            return this.respond("I sell {runes}, {wands}, {rods}, {life fluid}s and {mana fluid}s. Just say {trade}!");
        case "offer":
        case "offers":
            return this.respond("I have {fluids}, {wands}, {rods}, and {runes}. Say {trade} to see my complete stock.");
        case "life fluid":
        case "lifefluid":
            return this.respond("Life fluid restores your health. Very useful for adventurers! Say {trade} to buy some.");
        case "mana fluid":
        case "manafluid":
            return this.respond("Mana fluid restores your magical energy. Every mage needs these! Say {trade} to buy some.");
        case "vial":
        case "vials":
        case "empty vial":
            return this.respond("I'll buy your empty vials for 5 gold each. Just {trade} with me!");
    }

}
