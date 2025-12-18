module.exports = function sarah() {

  /*
   * Definitions for NPC Sarah
   * All events are emitters when the character engages with the NPC
   */

  // Reference the base state (a base state is required)
  this.setBaseState(baseTalkState);

  // Defaults
  this.on("focus", player => this.say("Hello, %s! Feel free to ask me for help.".format(player.name)));
  this.on("defocus", player => this.say("Safe climb down!"));
  this.on("exit", player => this.say("Pff."));
  this.on("regreet", player => this.say("Yes, sweety?"));
  this.on("idle", player => this.say("Excuse me.."));
  this.on("busy", player => this.say("Please wait, %s. I already talk to someone!"))

}

function baseTalkState(state, player, message) {

  /*
   * Function baseTalkState
   * The base state of the NPC. It will respond to the following keywords
   */

  switch(message) {
    case "heal":
      return this.respond("You aren't looking really bad, %s. Sorry, I can't help you.".format(player.name));
  }

}
