"use strict";

const BinaryHeap = requireModule("binary-heap");

const Pathfinder = function(lattice) {

  /*
   * Class Pathfinder
   * A* algorithm using a binary heap to find monster pathing
   */

  this.__enabledTiles = new Array();

  // Data statistics
  this.__iterations = 0;
  this.__requests = 0;

}

Pathfinder.prototype.ADJACENT = 0x00;
Pathfinder.prototype.EXACT = 0x01;

Pathfinder.prototype.enableTile = function(tile, to) {

  /*
   * Function Pathfinder.enableTile
   * Enables a tile for pathfinding during search
   */

  // Used in the heuristic function: every unvisited tile counts for approx. 130 points
  const AVERAGE_FRICTION = 130;

  // Keep track of it for cleanup
  this.__enabledTiles.push(tile);

  // Enable the pathfinding and add the heuristic
  tile.enablePathfinding();

  // Calculate the heuristic (Manhattan distance) when enabling the tile
  tile.pathfinderNode.setHeuristic(AVERAGE_FRICTION * tile.distanceManhattan(to));

}

Pathfinder.prototype.search = function(creature, from, to, mode) {

  /*
   * Function Pathfinder.search
   * Searches connection from one tile (from) to tile (to) using a specific mode
   * See https://en.wikipedia.org/wiki/A*_search_algorithm and https://github.com/bgrins/javascript-astar/blob/master/astar.js
   */

  this.__requests++;

  // Create a new binary heap to help with pathfinding priority queue
  let openHeap = new BinaryHeap();

  this.enableTile(from, to);

  // Add the first tile to the heap
  openHeap.push(from);

  // Find path in the open heap
  while(!openHeap.isEmpty()) {

    this.__iterations++;

    // Get the current node with the current lowest f-score
    let currentTile = openHeap.pop();
    let currentNode = currentTile.pathfinderNode;

    // Found the end of the traversal: must be adjacent to end
    if(mode === this.ADJACENT) {
      if(to.neighbours.includes(currentTile)) {
        return this.pathTo(currentTile);
      }
    } else if(mode === this.EXACT) {
      if(currentTile === to) {
        return this.pathTo(currentTile);
      }
    }

    // Set the current node to closed: no need to revisit it
    currentNode.setClosed();

    // Go over all of its neighbours
    currentTile.neighbours.forEach(function(neighbourTile) {

      // Not needed
      if(neighbourTile === currentTile) {
        return;
      }

      // This tile has not been opened for pathfinding yet
      if(!neighbourTile.pathfinderNode) {
        this.enableTile(neighbourTile, to);
      }

      let neighbourNode = neighbourTile.pathfinderNode;

      // Already closed for searching
      if(neighbourNode.isClosed()) {
        return;
      }

      // Only search in the visible space 
      if(!neighbourTile.getPosition().isVisible(from.getPosition(), 11, 8)) {
        return neighbourNode.setClosed();
      }

      if(!neighbourTile.getPosition().isVisible(to.getPosition(), 11, 8)) {
        return neighbourNode.setClosed();
      }

      // Occupied so close it for searching
      if(creature.isTileOccupied(neighbourTile)) {
        return neighbourNode.setClosed();
      }

      // Debugging
      gameServer.world.sendMagicEffect(neighbourTile.getPosition(), CONST.EFFECT.MAGIC.SOUND_WHITE);

      // Add the cost of the current node
      let gScore = currentNode.getCost() + neighbourTile.getWeight(currentTile);

      // Whether this node was already visited before
      let isVisited = neighbourNode.isVisited();

      // Visited and score not high enough: continue
      if(isVisited && gScore >= neighbourNode.getCost()) {
        return;
      }

      // Update the node information
      neighbourNode.setVisited();
      neighbourNode.setParent(currentTile);
      neighbourNode.setCost(gScore);

      // This is the priority value in the binary heap
      neighbourNode.setScore(gScore + neighbourNode.getHeuristic());

      // If it does not exist in the heap
      if(!isVisited) {
        return openHeap.push(neighbourTile);
      }

      // Rescore the element
      openHeap.rescoreElement(neighbourTile);

    }, this);

  }

  // Clean up after searching
  this.__cleanup();

  // No path found
  return new Array();

}

Pathfinder.prototype.__cleanup = function() {

  /*
   * Pathfinder.__cleanup
   * Disables all tiles used for pathfinding
   */

  // We kept track of all tiles that were enabled
  this.__enabledTiles.forEach(tile => tile.disablePathfinding());
  this.__enabledTiles = new Array();

}

Pathfinder.prototype.getDataDetails = function() {

  /*
   * Pathfinder.getDataDetails
   * Gets usage statistics for the pathfinder
   */

  let totalIterations = this.__iterations;
  let totalRequests = this.__requests;
  this.__iterations = 0;
  this.__requests = 0;

  return new Object({
    "iterations": totalIterations,
    "requests": totalRequests
  });

}

Pathfinder.prototype.pathTo = function(tile) {

  /*
   * Function pathTo
   * Returns the path to a node following an A* path
   */

  let resolvedPath = new Array();

  // Go over the chain to reconstruct the path
  while(tile.pathfinderNode.getParent() !== null) {
    resolvedPath.push(tile);
    gameServer.world.sendMagicEffect(tile.getPosition(), CONST.EFFECT.MAGIC.SOUND_BLUE);
    tile = tile.pathfinderNode.getParent();
  }

  // Clean up
  this.__cleanup();

  return resolvedPath;

}

module.exports = Pathfinder;
