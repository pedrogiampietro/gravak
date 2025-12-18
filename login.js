"use strict";

require("./require");

const LoginServer = requireModule("login-server");

if(require.main === module) {

  /*
   * Function __main__
   * Function called when the initialization script is executed
   */

  console.log("Starting NodeJS Forby Open Tibia Login Server.");

  // Start
  global.loginServer = new LoginServer();
  global.loginServer.initialize();
  
}
