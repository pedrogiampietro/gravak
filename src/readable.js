"use strict";

const Item = requireModule("item");

const Readable = function(id) {

  /*
   * Class Readable
   * Wrapper for items that are readable and may have text
   */

  // Inherit
  Item.call(this, id);

}

// Inherit from event emitter
Readable.prototype = Object.create(Item.prototype);
Readable.prototype.constructor = Readable;

Readable.prototype.setContent = function(content) {

  /*
   * Function Readable.setContent
   * Sets the contents of a readable
   */

  this.content = content;

}

Readable.prototype.getContent = function() {

  /*
   * Function Readable.getContent
   * Returns the content of a readable
   */

  if(!this.content) {
    return null; 
  }

  return this.content;

}

Readable.prototype.toJSON = function() {
  
  /*
   * Function Item.toJSON
   * Serializes an item
   */
  
  // Clean up items when they are serialized
  this.cleanup();

  return new Object({
    "id": this.id,
    "actionId": this.actionId,
    "content": this.content
  });

}

module.exports = Readable;
