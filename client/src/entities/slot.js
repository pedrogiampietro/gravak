const Slot = function () {

  /*
   * Class Slot
   * Container for a slot that contains an item
   */

  // A slot must reference an item (or empty, nullptr)
  this.item = null;

}

Slot.prototype.setElement = function (element) {

  /*
   * Function Slot.setElement
   * Sets the elements in the DOM
   */

  this.element = element;
  this.canvas = new Canvas(element.firstElementChild, 32, 32);

  // Add tooltip listeners
  element.addEventListener("mouseover", function () {
    if (this.item) {
      gameClient.interface.tooltip.show(this.item, this.element);
    }
  }.bind(this));

  element.addEventListener("mouseout", function () {
    gameClient.interface.tooltip.hide();
  }.bind(this));

}

Slot.prototype.createDOM = function (index) {

  /*
   * Function Slot.createDOM
   * Creates the interactable DOM elements for the slot
   */

  let element = document.getElementById("slot-prototype").cloneNode(true);
  element.setAttribute("slotIndex", index);
  element.removeAttribute("id");



  this.setElement(element);

}

Slot.prototype.setItem = function (item) {

  /*
   * Function Slot.setItem
   * Sets an item in the slot
   */

  this.item = item;

  // Update the class with the rarity color of the item
  this.element.className = "slot " + this.getRarityColor(item);

}

Slot.prototype.getRarityColor = function (item) {

  /*
   * Function Slot.getRarityColor
   * Returns the rarity color of the slot
   * TODO: Implement proper rarity system based on item properties
   */

  // Disabled - no rarity borders by default
  return "";

  // Uncomment below to enable rarity system based on item properties:
  // if (!item) return "";
  // let rarity = item.getDataObject()?.properties?.rarity;
  // switch(rarity) {
  //   case 1: return "uncommon";  // green
  //   case 2: return "rare";      // blue
  //   case 3: return "epic";      // purple
  //   case 4: return "legendary"; // orange
  //   default: return "";         // no border
  // }

}

Slot.prototype.__renderAnimated = function () {

  /*
   * Function Slot.__renderAnimated
   * Renders the slot when it is animated
   */

  // Skip when empty or not animated
  if (this.isEmpty()) {
    return;
  }

  this.render();

}

Slot.prototype.render = function () {

  /*
   * Function Slot.render
   * Renders the slot when it is animated
   */

  // Clear the slot
  this.canvas.clear();
  this.setCountString(null);

  // Skip when empty
  if (this.isEmpty()) {
    return;
  }

  // Draw the sprite to the slow canvas
  this.canvas.drawSprite(this.item, new Position(0, 0), 32);

  // If the item is stackable we should update the count as well
  if (this.item.isStackable()) {
    this.setCountString(this.item.getCount());
  }

}

Slot.prototype.setCountString = function (count) {

  /*
   * Function Slot.setCountString
   * Sets the count DOM element to the passed value
   */

  this.element.lastChild.innerHTML = count;

}

Slot.prototype.isEmpty = function () {

  /*
   * Function Slot.isEmpty
   * Returns true if the slot is empty and does not contain an item
   */

  return this.item === null;

}
