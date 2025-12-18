"use strict";

const PathfinderNode = function() {

  /*
   * Class PathfinderNode
   * Wrapper for parameters used in A* pathfinding
   */

  // All parameters used for pathfinding
  this.__parent = null;
  this.__closed = false;
  this.__visited = false;

  // Scores: f is the heap score, g is the total cost, and h is the heuristic score
  this.__f = 0;
  this.__g = 0;
  this.__h = 0;

}

PathfinderNode.prototype.setParent = function(parent) {

  /*
   * Function PathfinderNode.setParent
   * Sets the parent of the pathfinder node
   */

  this.__parent = parent;

}

PathfinderNode.prototype.getParent = function() {

  /*
   * Function PathfinderNode.getParent
   * Returns the parent of a pathfinder node
   */

  return this.__parent;
  
}

PathfinderNode.prototype.setClosed = function() {

  /*
   * Function PathfinderNode.setClosed
   * Sets the node to closed for searching
   */

  this.__closed = true;

}

PathfinderNode.prototype.isClosed = function() {

  /*
   * Function PathfinderNode.isClosed
   * Returns true if the pathfinding node is closed
   */

  return this.__closed;

}

PathfinderNode.prototype.isVisited = function() {

  /*
   * Function PathfinderNode.isClosed
   * Returns true if the pathfinding node is visited
   */

  return this.__visited;

}

PathfinderNode.prototype.setVisited = function() {

  /*
   * Function PathfinderNode.setVisited
   * Sets the pathfinding node to visited
   */

  this.__visited = true;

}

PathfinderNode.prototype.getScore = function() {

  /*
   * Function PathfinderNode.getScore
   * Returns the heap score of the particular node
   */

  return this.__f;

}

PathfinderNode.prototype.setScore = function(score) {

  /*
   * Function PathfinderNode.setScore
   * Sets the new heap score of a particular node
   */

  this.__f = score;

}

PathfinderNode.prototype.setHeuristic = function(heuristic) {

  /*
   * Function PathfinderNode.setHeuristic
   * Sets the heuristic score of a particular node
   */

  this.__h = heuristic;

}

PathfinderNode.prototype.getHeuristic = function() {

  /*
   * Function PathfinderNode.getHeuristic
   * Returns the heuristic value of the node
   */

  return this.__h;

}

PathfinderNode.prototype.getCost = function() {

  /*
   * Function PathfinderNode.getCost
   * Returns the total code of the node
   */

  return this.__g;

}

PathfinderNode.prototype.setCost = function(cost) {

  /*
   * Function PathfinderNode.setCost
   * Sets the total cost of the node
   */

  this.__g = cost;

}

module.exports = PathfinderNode;
