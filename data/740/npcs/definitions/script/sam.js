module.exports = function sam() {

    /*
     * Definitions for NPC Sam
     * Blacksmith - buys and sells weapons and armor
     */

    // Reference the base state
    this.setBaseState(baseTalkState);

    // Event handlers
    this.on("focus", player => {
        this.say("Hello, %s! I buy swords, axes, clubs, helmets, boots, legs, shields and armors. Say {trade} to see my offers!".format(player.name));
    });

    this.on("defocus", player => {
        this.say("Goodbye, %s! May your weapons serve you well!".format(player.name));
    });

    this.on("exit", player => {
        this.say("Come back if you need better equipment!");
    });

    this.on("regreet", player => {
        this.say("Yes, %s? Want to see my {trade}?".format(player.name));
    });

    this.on("idle", player => {
        this.say("Still there? I have work in the forge...");
    });

    this.on("busy", (focus, player) => {
        this.privateSay(player, "One moment, I am attending to %s.".format(focus.name));
    });

}

function baseTalkState(state, player, message) {

    /*
     * Function baseTalkState
     * The base state of the NPC. It will respond to keywords not covered by defaults
     */

    switch (message) {
        case "trade":
            this.tradeHandler.openTradeWindow(player);
            return this.respond("Here are my offers. I buy and sell weapons and armor.");

        case "job":
            return this.respond("I am a blacksmith. I buy and sell all kinds of weapons and armor.");

        case "name":
            return this.respond("My name is Sam. I've been forging weapons for decades.");

        case "help":
            return this.respond("I buy and sell weapons and armor. Just say {trade} to see my offers.");

        case "weapons":
            return this.respond("I have {swords}, {axes}, {clubs} and {hammers}. Just say {trade} to see everything!");

        case "armor":
        case "armors":
            return this.respond("I sell {helmets}, {armors}, {legs}, {boots} and {shields}. Check my {trade}!");

        case "swords":
        case "sword":
            return this.respond("I have everything from simple swords to magic longswords! Check my {trade}.");

        case "axes":
        case "axe":
            return this.respond("From hatchets to the legendary stonecutter axe! Say {trade} to see them.");

        case "clubs":
        case "club":
        case "hammers":
        case "hammer":
            return this.respond("Maces, hammers, and even the mighty thunder hammer! Say {trade}.");

        case "shields":
        case "shield":
            return this.respond("From simple wooden shields to the blessed shield! Check my {trade}.");

        case "helmets":
        case "helmet":
            return this.respond("Crown helmets, royal helmets, and more! Say {trade} to browse.");

        case "boots":
        case "boot":
            return this.respond("Steel boots, boots of haste, even golden boots! Check my {trade}.");

        case "legs":
            return this.respond("Plate legs, knight legs, crown legs and more! Say {trade}.");

        case "forge":
        case "blacksmith":
            return this.respond("Yes, I am the local blacksmith. I've been working this forge for over 30 years.");
    }

}
