"use strict";

const { CreaturePropertyPacket } = requireModule("network/protocol");

function onStart(creature) {

  /*
   * Function onStart
   * Callback fired on condition start
   */

  creature.sendCancelMessage("You feel fast.");

  // Broadcast the new speed to all spectators
  if (creature.isPlayer && creature.isPlayer()) {
    let newSpeed = creature.getSpeed();

    creature.broadcast(
      new CreaturePropertyPacket(creature.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
    // Also send to the player itself
    creature.write(
      new CreaturePropertyPacket(creature.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
  }

}

function onExpire(creature) {

  /*
   * Function onExpire
   * Callback fired on condition expire
   */

  creature.sendCancelMessage("Your speed returns to normal.");

  // Broadcast the restored speed to all spectators
  if (creature.isPlayer && creature.isPlayer()) {
    let newSpeed = creature.getSpeed();

    creature.broadcast(
      new CreaturePropertyPacket(creature.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
    // Also send to the player itself
    creature.write(
      new CreaturePropertyPacket(creature.getId(), CONST.PROPERTIES.SPEED, newSpeed)
    );
  }

}

function onTick(creature) {

  /*
   * Function onTick
   * Callback fired every condition tick
   */

}

module.exports.onStart = onStart;
module.exports.onExpire = onExpire;
module.exports.onTick = onTick;