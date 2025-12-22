"use strict";

const HotbarMenu = function (id) {

  /*
   * Class HotbarMenu
   * Wrapper for the menu that displays on the main game screen
   */

  // Inherits from menu
  Menu.call(this, id);

  this.__index = null;

}

HotbarMenu.prototype = Object.create(Menu.prototype);
HotbarMenu.prototype.constructor = HotbarMenu;

HotbarMenu.prototype.click = function (event) {

  /*
   * Function HotbarMenu.click
   * Callback fired specially for the ScreenMenu after a button is clicked
   */

  let index = Array.from(this.downEvent.target.parentNode.children).indexOf(this.downEvent.target);

  // Take action depending on the button
  console.log("[DEBUG HOTBAR] Click event action:", event.target.getAttribute("action"));
  console.log("[DEBUG HOTBAR] Index:", index);
  switch (event.target.getAttribute("action")) {
    case "add":
      console.log("[DEBUG HOTBAR] Opening spellbook-modal for index:", index);
      let result = gameClient.interface.modalManager.open("spellbook-modal", index);
      console.log("[DEBUG HOTBAR] Modal open result:", result);
      break;
    case "remove":
      gameClient.interface.hotbarManager.clearSlot(index);
      break;
  }

  return true;

}
