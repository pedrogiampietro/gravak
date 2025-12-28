module.exports = function ahmet() {

    /*
     * Definitions for NPC Ahmet
     * Tools and supplies merchant
     */

    // Reference the base state
    this.setBaseState(baseTalkState);

    // Event handlers
    this.on("focus", player => this.say("Hello, %s! I buy and sell tools and supplies. Just say {trade} to see my offers!".format(player.name)));
    this.on("defocus", player => this.say("Goodbye, %s! Come back when you need supplies!".format(player.name)));
    this.on("exit", player => this.say("Come back soon!"));
    this.on("regreet", player => this.say("Yes? Want to {trade}?"));
    this.on("idle", player => this.say("Hello? Anyone there?"));
    this.on("busy", (focus, player) => this.privateSay(player, "Please wait, I am talking to %s.".format(focus.name)));

}

function baseTalkState(state, player, message) {

    /*
     * Function baseTalkState
     * The base state of the NPC. It will respond to keywords not covered by defaults
     */

    switch (message) {
        case "trade":
            this.tradeHandler.openTradeWindow(player);
            return this.respond("Here are my offers. What would you like to buy or sell?");
        case "job":
            return this.respond("I am a merchant. I buy and sell all kinds of tools and supplies.");
        case "name":
            return this.respond("My name is Ahmet.");
        case "help":
            return this.respond("I can sell you tools and supplies. Just say {trade} to see my offers.");
    }

}
