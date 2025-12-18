"use strict";

const Friendlist = function(friends) {

  /*
   * Class Friendlist
   * Wrapper for a characters friendlist
   */

  // Set the friends explicitly when constructing the class
  this.friends = new Set(friends);

}

Friendlist.prototype.remove = function(name) {

  /*
   * Function Friendlist.remove
   * Removes a character from the friendlist
   */

  if(!this.friends.has(name)) {
    return;
  }

  this.friends.delete(name);

}

Friendlist.prototype.add = function(name) {

  /*
   * Function Friendlist.add
   * Adds a character to the existing friendlist
   */

  if(this.friends.has(name)) {
    return;
  } 
  
  this.friends.add(name);

}

Friendlist.prototype.toJSON = function() {

  /*
   * Function Friendlist.toJSON
   * Serializes the friendlist to be saved to JSON
   */

  return Array.from(this.friends);

}

module.exports = Friendlist;
