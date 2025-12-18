"use strict";

const BinaryHeap = function() {

  /*
   * Class BinaryHeap
   * Implementation of a simple binary heap used as a priority queue in e.g. the A* pathfinding algorithm and the event scheduler
   * Binary heap nodes must implement the getScore() API.
   * See 
   *
   * API:
   *
   * BinaryHeap.hasExecutedUntil(score) - returns whether the next element is larger than the passed score
   * BinaryHeap.isEmpty() - returns true if there are no items on the heap
   * BinaryHeap.remove(element) - removes an element from the binary heap
   * BinaryHeap.next() - returns a reference to the next element in the heap
   * BinaryHeap.push(element) - pushes an element to the heap
   * BinaryHeap.pop() - pops the next element from the heap
   * BinaryHeap.size() - returns the total size of the heap
   * BinaryHeap.rescoreElement(element) - rescores an element that already exists in the heap
   *
   */

  // Save the content
  this.content = new Array();
  this.__reference = new Map();

}

BinaryHeap.prototype.hasExecutedUntil = function(score) {

  /*
   * Function BinaryHeap.hasExecutedUntil
   * Returns true if the binary heap has been executed until
   */

  if(this.isEmpty()) {
    return true;
  }

  return this.next().getScore() > score;

}

BinaryHeap.prototype.isEmpty = function() {

  /*
   * Function BinaryHeap.hasExecutedUntil
   * Returns true if the binary heap has been executed until
   */

  return this.size() === 0;

}

BinaryHeap.prototype.remove = function(node) {

  /*
   * Function BinaryHeap.remove
   * Removes an item from the binary heap
   */

  // Go from back to front (likely we are removing an event far in the future; otherwise cancel)
  let index = this.content.lastIndexOf(node);

  if(index === -1) {
    return console.error("Attempted to remove a node that does not exist in the heap");
  }

  let end = this.content.pop();

  // Ending node was what we wanted to remove
  if(node === end) {
    return;
  }

  // Replace the node with the end
  this.content[index] = end;

  // Make sure the end bubbles up or sinks down
  if(end.getScore() < node.getScore()) {
    this.__sinkDown(index);
  } else {
    this.__bubbleUp(index);
  }

}

BinaryHeap.prototype.next = function() {

  /*
   * Function BinaryHeap.next
   * Returns a reference to next scheduled node in the heap
   */

  return this.content.head();

}

BinaryHeap.prototype.push = function(element) {

  /*
   * Function BinaryHeap.push
   * Adds an element to the binary heap
   */

  if(!(typeof element.getScore === "function")) {
    return console.error("Added node to binary heap that does not implement the getScore() API");
  }

  // Add the new element to the end of the array.
  this.content.push(element);

  // Allow it to sink down.
  this.__sinkDown(this.content.length - 1);

}

BinaryHeap.prototype.pop = function() {

  /*
   * Function BinaryHeap.pop
   * Pops the top element of the binary heap
   */

  // Store the first element so we can return it later.
  let result = this.next();

  // Get the element at the end of the array.
  let end = this.content.pop();

  // If there are any elements left, put the end element at the
  // start, and let it bubble up.
  if(this.content.length > 0) {
    this.content[0] = end;
    this.__bubbleUp(0);
  }

  return result;

}

BinaryHeap.prototype.size = function() {

  /*
   * Function BinaryHeap.size
   * Returns the size of the binary heap
   */

  return this.content.length;

}

BinaryHeap.prototype.rescoreElement = function(node) {

  /*
   * Function BinaryHeap.rescoreElement
   * Rescores an element within the binary heap
   */

  let index = this.content.indexOf(node);

  if(index === -1) {
    return console.error("Attempted to rescore a node that does not exist in the heap");
  }

  this.__sinkDown(index);

}

BinaryHeap.prototype.__sinkDown = function(n) {

  /*
   * Function BinaryHeap.__sinkDown
   * Sinks an element down to its supposed location
   */

  // Fetch the element that has to be sunk.
  let element = this.content[n];

  // When at 0, an element can not sink any further.
  while(n > 0) {

    // Compute the parent element's index, and fetch it.
    let parentN = ((n + 1) >> 1) - 1;
    let parent = this.content[parentN];

    // Found a parent that is less, no need to sink any further.
    if(element.getScore() >= parent.getScore()) {
      break;
    }

    // Swap the elements if the parent is greater.
    this.content[parentN] = element;
    this.content[n] = parent;
    n = parentN;

  }

}

BinaryHeap.prototype.__bubbleUp = function(n) {

  /*
   * Function BinaryHeap.__bubbleUp
   * Bubbles up an element
   */

  // Look up the target element and its score.
  let length = this.content.length;
  let element = this.content[n];
  let elemScore = element.getScore();

  while(true) {

    // Compute the indices of the child elements.
    let child2N = (n + 1) << 1;
    let child1N = child2N - 1;

    // This is used to store the new position of the element, if any.
    let swap = null;
    let child1Score;

    // If the first child exists (is inside the array)...
    if(child1N < length) {

      // Look it up and compute its score.
      let child1 = this.content[child1N];
      child1Score = child1.getScore();

      // If the score is less than our element's, we need to swap.
      if(child1Score < elemScore) {
        swap = child1N;
      }

    }

    // Do the same checks for the other child.
    if(child2N < length) {

      let child2 = this.content[child2N];
      let child2Score = child2.getScore();

      if(child2Score < (swap === null ? elemScore : child1Score)) {
        swap = child2N;
      }

    }

    if(swap === null) {
      break;
    }

    // If the element needs to be moved, swap it, and continue.
    this.content[n] = this.content[swap];
    this.content[swap] = element;
    n = swap;

  }

}

module.exports = BinaryHeap;
