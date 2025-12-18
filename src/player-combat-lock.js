"use strict";

const GenericLock = requireModule("generic-lock");

const { CombatLockPacket} = requireModule("protocol");

const CombatLock = function(player) {

  /*
   * Class CombatLock
   * Wrapper for the player combat lock so they cannot log out when they are in combat
   */

  // Inherit from generic lock to use all the toys
  GenericLock.call(this);

  // Owner of the lock
  this.__player = player;

  // Assign the callbacks to write true or false during lock / unlock to client
  this.on("unlock", this.__writeChangeCombat.bind(this, false));
  this.on("lock", this.__writeChangeCombat.bind(this, true));

}

CombatLock.prototype = Object.create(GenericLock.prototype);
CombatLock.prototype.constructor = CombatLock;

CombatLock.prototype.activate = function() {

  /*
   * Function CombatLock.activate
   * Triggers or extends the combat lock
   */

  const COMBAT_LOCK_SECONDS = 3;

  this.lockSeconds(COMBAT_LOCK_SECONDS);

}

CombatLock.prototype.__writeChangeCombat = function(bool) {

  /*
   * Function CombatLock.__writeChangeCombat
   * Writes a packet to the client to update the state of the combat lock
   */

  return this.__player.write(new CombatLockPacket(bool));

}

module.exports = CombatLock;
