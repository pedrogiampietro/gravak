"use strict";

const Actions = requireModule("actions");
const Enum = requireModule("enum");
const Pathfinder = requireModule("pathfinder");
const Position = requireModule("position");

const MonsterBehaviour = function(monster, behaviour) {

  /*
   * Class MonsterBehaviour
   * Container for monster behaviour and choices: implements different types of monster behaviour
   *
   * API:
   *
   * MonsterBehaviour.hasTarget() - Returns true if the monster has a target
   * MonsterBehaviour.canSeeTarget() - Returns true if the monster can see its target
   * MonsterBehaviour.handleTarget() - Function called occasionally to (re)-target players or drop the target
   * MonsterBehaviour.setTarget(target) - Function to set the target of a monster
   * MonsterBehaviour.handleDamage(attacker) - Callback fired when a monster is damaged and may need to update its behaviour
   * MonsterBehaviour.is(behaviour) - Returns true if the monster currently subscribes to this behavioural state
   * MonsterBehaviour.getNextMoveTile() - Returns the next move for the monster based on its behaviour
   * MonsterBehaviour.setMonsterBehaviour() - Sets the behaviour of a monster from the configuration
   *
   * MonsterBehaviour.BEHAVIOUR - States of possible behaviour for a monster
   *
   */

  // Save a circular reference to the parent monster
  this.monster = monster;

  // Managed for behaviour actions
  this.actions = new Actions();

  // Properties
  this.__target = null;

  this.ignoreCharacters = false;
  this.openDoors = behaviour.openDoors;

  this.setBehaviour(behaviour.type);

  // Sayings were configured
  if(behaviour.sayings) {
    this.sayings = behaviour.sayings;
    this.actions.add(this.handleActionSpeak);
  }

}

// The behaviours that can be used by the monsters
MonsterBehaviour.prototype.NEUTRAL = 0;
MonsterBehaviour.prototype.FRIENDLY = 1;
MonsterBehaviour.prototype.HOSTILE = 2;
MonsterBehaviour.prototype.HOSTILE_ON_ATTACK = 3;
MonsterBehaviour.prototype.RANGED = 4;
MonsterBehaviour.prototype.FLEEING = 5;

MonsterBehaviour.prototype.handleActionTarget = function() {

  /*
   * Function Monster.handleActionTarget
   * Handles targeting action of the monster that is done every once in a while
   */

  // Always lock
  this.actions.lock(this.handleActionTarget, Actions.prototype.GLOBAL_COOLDOWN);

  if(!this.requiresTarget()) {
    return;
  }

  // Delegate to find or drop a target
  // If the creature does not have a target yet try to find one
  if(!this.hasTarget()) {
    return this.__findTarget();
  }

  // No longer online
  if(!gameServer.world.creatureHandler.isCreatureActive(this.getTarget())) {
    return this.setTarget(null);
  }

  // Cannot be seen?
  if(!this.canSeeTarget()) {
    return this.setTarget(null);
  }

  // The target is invisible
  if(this.getTarget().isInvisible()) {
    return this.setTarget(null);
  }

  // Target has gone into a protection zone
  if(this.getTarget().isInProtectionZone()) {
    return this.setTarget(null);
  }

}

MonsterBehaviour.prototype.handleActionSpeak = function() {

  /*
   * Function MonsterBehaviour.handleActionSpeak
   * Handles speaking action of the monster
   */

  // Say a random thing
  if(Math.random() > 0.15) {
    this.monster.speechHandler.internalCreatureSay(this.sayings.texts.random(), CONST.COLOR.ORANGE);
  }

  // Lock the action for a random duration
  this.actions.lock(this.handleActionSpeak, 0.1 * Number.prototype.random(1, 5) * this.sayings.slowness);

}

MonsterBehaviour.prototype.handleActionAttack = function() {

  /*
   * Function MonsterBehaviour.handleActionAttack
   * Handles the attack action for a monster
   */

  // We do not have a target
  if(!this.hasTarget()) {
    return this.actions.lock(this.handleActionAttack, Actions.prototype.GLOBAL_COOLDOWN);
  }

  // Target is offline or missing
  if(!this.canSeeTarget()) {
    return this.actions.lock(this.handleActionAttack, Actions.prototype.GLOBAL_COOLDOWN);
  }

  // Not yet besides the target
  if(!this.isBesidesTarget()) {
    return this.actions.lock(this.handleActionAttack, Actions.prototype.GLOBAL_COOLDOWN);
  }

  // Match the angle to the target
  this.monster.faceCreature(this.getTarget());

  // Delegate to handle the actual combat
  gameServer.world.combatHandler.handleCombat(this.monster);

  // And lock the attack action until next time
  this.actions.lock(this.handleActionAttack, this.monster.getProperty(CONST.PROPERTIES.ATTACK_SPEED));

}

MonsterBehaviour.prototype.handleActionMove = function() {
  
  /*
   * Function MonsterBehaviour.handleActionMove
   * Cooldown function that handles the creature movement
   */
  
  // Let the monster decide its next strategic move
  let tile = this.getNextMoveTile();
  
  // Invalid tile was returned: do nothing
  if(tile === null || tile.id === 0) {
    return this.actions.lock(this.handleActionMove, Actions.prototype.GLOBAL_COOLDOWN);
  } 

  let lockDuration = this.monster.getStepDuration(tile.getFriction());

  // Number of frames to lock
  let slowness = this.monster.position.isDiagonal(tile.position) ? 2 * lockDuration : lockDuration;

  // Delegate to move the creature to the new tile position
  gameServer.world.creatureHandler.moveCreature(this.monster, tile.position);

  // Lock this function for a number of frames
  this.actions.lock(this.handleActionMove, slowness);

}

MonsterBehaviour.prototype.getPathToTarget = function() {

  /*
   * Function MonsterBehaviour.getPathToTarget
   * Call to the pathfinder to recover the next step to be set by the creature
   */

  if(!this.hasTarget()) {
    return null;
  }

  // A* pathfinding between creature and target (stop at an adjacent tile)
  let path = gameServer.world.findPath(
    this.monster,
    this.monster.getPosition(),
    this.getTarget().getPosition(),
    Pathfinder.prototype.ADJACENT
  );

  // If no path is found the creature should instead wander randomly
  if(path.length === 0) {
    return null;
  }

  // Get the next position to move to following the pathing algorithm
  return path.pop();

}

MonsterBehaviour.prototype.getTarget = function() {

  /*
   * Function MonsterBehaviour.getTarget
   * Returns true if the monster has a target
   */

  return this.__target;

}

MonsterBehaviour.prototype.hasTarget = function() {

  /*
   * Function MonsterBehaviour.hasTarget
   * Returns true if the monster has a target
   */

  return this.__target !== null;

}

MonsterBehaviour.prototype.canSeeTarget = function() {

  /*
   * Function MonsterBehaviour.hasTarget
   * Returns true if the monster has a target
   */

  // Check whether the monster can see the target
  return this.monster.canSee(this.getTarget().getPosition());

}

MonsterBehaviour.prototype.setTarget = function(target) {

  /*
   * Function MonsterBehaviour.setTarget
   * Sets the target of the monster
   */

  // Active the combat lock when targeting a player
  this.__target = target;

}

MonsterBehaviour.prototype.handleDamage = function(attacker) {

  /*
   * Function MonsterBehaviour.handleDamage
   * Handles changes to behaviour for an incoming event by an attacker
   */

  // If hostile on attack change to being hostile and set the target to the attacker
  if(this.is(this.HOSTILE_ON_ATTACK)) {
    this.setState(this.HOSTILE);
    this.setTarget(attacker);
  }

  // Fleeing
  if(this.monster.health <= this.fleeHealth) {
    this.setState(this.FLEEING);
    this.setTarget(attacker);
  }

}

MonsterBehaviour.prototype.is = function(behaviour) {

  /*
   * Function MonsterBehaviour.is
   * Returns true if the behaviour state is currently equal to the passed behaviour
   */

  return this.state === behaviour;

}

MonsterBehaviour.prototype.isBesidesTarget = function() {

  /*
   * Function Monster.isBesidesTarget
   * Handles moving behaviour
   */

  return this.monster.isBesidesThing(this.getTarget());

}

MonsterBehaviour.prototype.requiresTarget = function() {

  /*
   * Function MonsterBehaviour.requiresTarget
   * Returns whether the particular behaviour state requires a target
   */

  return this.is(this.HOSTILE) || this.is(this.FLEEING) || this.is(this.FRIENDLY) || this.is(this.RANGED);

}

MonsterBehaviour.prototype.wander = function() {

  /*
   * Function MonsterBehaviour.wander
   * Returns a random position around the monster's position
   */

  // We have these options: explore them in a random order
  let position = this.monster.getPosition();

  if(position === null) {
    return null;
  }

  let options = position.getNESW();

  // Try them all
  while(options.length > 0) {

    let tile = gameServer.world.getTileFromWorldPosition(options.popRandom());

    if(tile === null || tile.id === 0 || this.monster.isTileOccupied(tile)) {
      continue;
    }

    return tile;

  }

  return null;

}

MonsterBehaviour.prototype.getNextMoveTile = function() {

  /*
   * Function MonsterBehaviour.getNextMoveTile
   * Returns the next move action for the monster based on its behaviour
   */

  // If the monster does not have a target always aimlessly wander around
  if(!this.hasTarget()) {
    return this.wander();
  }

  return this.__handleTargetMoveMonsterBehaviour();

}

MonsterBehaviour.prototype.setBehaviour = function(state) {

  // Set the state
  this.state = state;

  // Monsters have these actions
  this.actions.add(this.handleActionMove);
  this.actions.add(this.handleActionSpeak);
  
  if(this.is(this.HOSTILE)) {
    this.actions.add(this.handleActionAttack);
    this.actions.add(this.handleActionTarget);
  } else {
    this.actions.remove(this.handleActionAttack);
    this.actions.remove(this.handleActionTarget);
    this.setTarget(null);
  }

}

MonsterBehaviour.prototype.__findTarget = function() {

  /*
   * Function MonsterBehaviour.__findTarget
   * Finds a player to target and be hostile or friendly with
   */

  // All chunks
  let chunks = gameServer.world.getSpectatingChunks(this.monster.getPosition());

  // Go over all potential chunks
  for(let chunk of chunks) {

    // Go over all players in the chunks
    for(let player of chunk.players) {

      // Cannot target players in protection zones
      if(player.isInProtectionZone()) {
        continue;
      }

      // Cannot target invisible players
      if(player.isInvisible()) {
        continue;
      }

      // Cannot reach a player through pathfinding
      if(!this.__canReach(player.position)) {
        continue;
      }

      player.combatLock.activate();

      this.setTarget(player);

    }

  }

}

MonsterBehaviour.prototype.__canReach = function(targetPosition) {

  /*
   * Function MonsterBehaviour.__canReach
   * Returns true if the creature can reach a particular target position
   */

  // Not visible so no
  if(!this.monster.canSee(targetPosition)) {
    return false;
  }

  // Already besides the target
  if(targetPosition.besides(this.monster.getPosition())) {
    return true;
  }

  // A* pathfinding between creature and target (stop at an adjacent tile)
  let path = gameServer.world.findPath(
    this.monster,
    this.monster.getPosition(),
    targetPosition,
    Pathfinder.prototype.ADJACENT
  );

  // Must be a path
  return path.length > 0;

}

MonsterBehaviour.prototype.__handleRangedMoveMonsterBehaviour = function() {

  /*
   * Function MonsterBehaviour.__handleRangedMoveMonsterBehaviour
   * Returns the next move action for the monster if its behaviour is ranged
   */

  // Distance to be kept from the target
  const KEEP_DISTANCE = 3;

  // Calculate distance
  let distance = this.monster.position.pythagoreanDistance(this.getTarget().getPosition());
  
  // Either move inward or outward
  if(distance < KEEP_DISTANCE) {
    return this.__handleFleeMoveMonsterBehaviour();
  } else if(distance > KEEP_DISTANCE) {
    return this.__handlePathToTarget();
  }

  if(this.__canReach(this.getTarget().getPosition())) {
    return null;
  }

  this.setTarget(null);

  return null;

}

MonsterBehaviour.prototype.__handlePathToTarget = function() {

  // Otherwise use A* to find path to get adjacent to the target
  let path = this.getPathToTarget();

  // The target can be reached
  if(path !== null) {
    return path;
  }

  // If the target cannot be reached then drop it
  this.setTarget(null);

  return null;

}

MonsterBehaviour.prototype.__handleTargetMoveMonsterBehaviour = function() {

  /*
   * Function Monster.__handleTargetMoveMonsterBehaviour
   * Handles moving behaviour
   */

  // Always stop moving when already besides the target
  if(this.isBesidesTarget()) {
    return null;
  }

  return this.__handlePathToTarget();

}

MonsterBehaviour.prototype.__handleFleeMoveMonsterBehaviour = function() {

  /*
   * Function Monster.__handleFleeMoveMonsterBehaviour
   * Returns the optimal fleeing position using a simple heuristic
   */

  let heuristics = new Array();
  let tiles = new Array();

  for(let x = -1; x <= 1; x++) {
    for(let y = -1; y <= 1; y++) {

      let added = this.monster.position.add(new Position(x, y, 0));
      let tile = process.gameServer.world.getTileFromWorldPosition(added);

      // The tile cannot be used to walk on
      if(this.monster.isTileOccupied(tile)) {
        continue;
      }

      // Determine simple heuristic: farther distance (higher) away from "target" is better
      let heuristic = this.getTarget().getPosition().manhattanDistance(added);

      // Impose a penalty for diagonal movement
      if(this.monster.position.isDiagonal(added)) {
        heuristic /= 3;
      }

      // Save the heuristic and beloning tiles
      heuristics.push(heuristic);
      tiles.push(tile);

    }
  }

  // This means no tiles were found
  if(tiles.length === 0) {
    return null;
  }

  // Maximum heuristic
  let maximum = Math.max.apply(null, heuristics);

  // The best tile
  return tiles[heuristics.indexOf(maximum)];

}

MonsterBehaviour.prototype.handleOpenDoor = function(thing) {

  /*
   * Function MonsterBehaviour.handleOpenDoor
   * Checks whether a door exists at the tile and that the door can be opened
   */

  // There is no thing or the thing is not a door
  if(thing === null || !thing.isDoor()) {
    return;
  }

  // If the door is closed then just open it
  if(!thing.isOpened() && !thing.isLocked()) {
    return thing.open();
  }

}

module.exports = MonsterBehaviour;
