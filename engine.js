"use strict";

require("./require");

const GameServer = requireModule("core/gameserver");

if (require.main === module) {

  /*
   * Function main
   * Function called when the engine script is executed
   */

  console.log("Starting NodeJS Gravak Open Tibia Server");
  console.log("Creating server with version %s".format(CONFIG.SERVER.CLIENT_VERSION));
  console.log("Setting data directory to %s".format(getDataFile("")));

  // Attach the gameserver to the process and initialize
  global.gameServer = process.gameServer = new GameServer();

  // Initialize the gameserver
  gameServer.initialize();

}
