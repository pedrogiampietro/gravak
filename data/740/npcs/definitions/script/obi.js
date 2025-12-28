module.exports = function aldee() {

    /*
     * Definitions for NPC Al Dee
     * Equipment and tools shopkeeper
     */

    // Reference the base state
    this.setBaseState(baseTalkState);

    // Event handlers
    this.on("focus", player => this.say("Hello, %s! I sell tools and equipment. Just say {trade} to see my wares!".format(player.name)));
    this.on("defocus", player => this.say("Goodbye, %s! Come back anytime!".format(player.name)));
    this.on("exit", player => this.say("Come back soon!"));
    this.on("regreet", player => this.say("Yes? Want to see my {trade}?"));
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
            return this.respond("I am the local shopkeeper. I sell all kinds of tools and equipment.");
        case "name":
            return this.respond("My name is Al Dee. I've been running this shop for many years.");
        case "help":
            return this.respond("I can sell you tools and basic equipment. Just say {trade} to see my offers.");
    }

}
