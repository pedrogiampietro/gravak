module.exports = function hanna() {

    /*
     * Definitions for NPC Hanna
     * Gems and jewellery buyer
     */

    // Reference the base state
    this.setBaseState(baseTalkState);

    // Event handlers
    this.on("focus", player => this.say("Hello, %s! I buy and sell gems and jewellery. Just say {trade} to see what I can offer!".format(player.name)));
    this.on("defocus", player => this.say("Goodbye, %s! Come back with more gems!".format(player.name)));
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
            return this.respond("I am a jeweler. I buy gems and precious stones from adventurers.");
        case "name":
            return this.respond("My name is Hanna.");
        case "help":
            return this.respond("I can buy gems and jewellery from you. Just say {trade} to see my offers.");
    }

}
