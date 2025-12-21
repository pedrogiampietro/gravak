"use strict";

const Property = function(value) {

  /*
   * Class Property
   * Wrapper for a single value property
   */

  this.__value = value;

}

Property.prototype.set = function(value) {

  /*
   * Function Property.prototype.get
   * Sets the property
   */

  return this.__value = value;

}

Property.prototype.get = function() {

  /*
   * Function Property.prototype.get
   * Returns the property
   */

  return this.__value;

}

Property.prototype.toJSON = function() {

  /*
   * Function Property.prototype.toJSON
   * Serializes the class to JSON
   */

  return this.__value;

}

module.exports = Property;
