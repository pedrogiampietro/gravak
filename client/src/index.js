const CLIENT_VERSION = "0.0.1";
const SERVER_VERSION = "740";

window.onload = function windowOnLoad() {

  /*
   * Function window.windowOnLoad
   * Callback fired when the full window is ready
   */
  
  // Create the game client class and attach it to the window
  window.gameClient = new GameClient();

}

document.addEventListener("DOMContentLoaded", function DOMContentLoaded() {

  /*
   * Function document.DOMContentLoaded
   * Callback fired when the DOM is ready to be used
   */

  document.getElementById("enter-game").disabled = true;

});
