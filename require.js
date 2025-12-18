const path = require("path");

global.CONFIG = require("./config");

// Create some useful global functions
global.getDataFile = function() {

  /*
   * Function global.getDataFile
   * Returns a file from the base data directory
   */

  return path.join(__dirname, "data", CONFIG.SERVER.CLIENT_VERSION, ...arguments);

}

global.requireData = function() {

  /*
   * Function global.requireData
   * Requires a module from the base data directory
   */

  return require(getDataFile(...arguments))

}

global.requireModule = function() {

  /*
   * Function global.requireModule
   * Requires a module from the base source directory
   */

  return require(path.join(__dirname, "src", ...arguments));

}

// Requires the prototype modifications
requireModule("__proto__");

// Load constants
global.CONST = require("./" + path.join("client", "data", CONFIG.SERVER.CLIENT_VERSION, "constants.json"))

// Check the NodeJS version
let [ major, minor, patch ] = process.versions.node.split(".");

// Confirm major NodeJS version
if(major < 16) {
  console.log("Could not launch gameserver: required version > 16.0.0 and current version: %s.".format(process.versions.node));
  return process.exit(1);
}
