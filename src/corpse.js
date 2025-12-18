"use strict";

const Container = requireModule("container");

const Corpse = function(id, size) {

  /*
   * Class Corpse
   * Wrapper for monster corpses that contain loot
   *
   * API:
   *
   * Corpse.getFluidType - returns the blood type of the corpse
   * Corpse.addLoot(loot) - adds loot entries to the corpse
   *
   */

  // Inherits from container
  Container.call(this, id, size);

}

Corpse.prototype = Object.create(Container.prototype);
Corpse.prototype.constructor = Corpse;

Corpse.prototype.getFluidType = function() {

  /*
   * Function Corpse.getFluidType
   * Returns the fluid type of the corpse
   */

  // Add mappings here
  switch(this.getAttribute("corpseType")) {
    case "blood": return CONST.FLUID.BLOOD;
    case "venom": return CONST.FLUID.SLIME;
    case "undead": return CONST.FLUID.NONE;
    case "fire": return CONST.FLUID.NONE;
    default: return CONST.FLUID.BLOOD;
  }

}

module.exports = Corpse;
