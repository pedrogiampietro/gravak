const Pathfinder = function () {

  /*
   * Class Pathfinder
   * Container for client-side pathfinding code inside the screen
   */

  // Cache to keep the tiles to walk on
  this.__pathfindCache = new Array();
  this.__dirtyNodes = new Array();

  // Final destination for continuous autowalking (when destination is far)
  this.__finalDestination = null;

}

Pathfinder.prototype.search = function (from, to) {

  /*
   * Function Pathfinder.search
   * Does client side pathfinding
   */

  this.__dirtyNodes.forEach(node => node.cleanPathfinding());
  this.__dirtyNodes = new Array(from);

  from.__h = this.heuristic(from, to);

  let openHeap = new BinaryHeap();

  openHeap.push(from);

  while (openHeap.size() > 0) {

    // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
    let currentNode = openHeap.pop();

    // End case -- result has been found, return the traced path.
    if (currentNode === to) {
      return this.pathTo(currentNode);
    }

    // Normal case -- move currentNode from open to closed, process each of its neighbors.
    currentNode.__closed = true;

    for (let i = 0; i < currentNode.neighbours.length; i++) {

      let neighbourNode = currentNode.neighbours[i];

      // Not a valid node to process, skip to next neighbor.
      if (neighbourNode.__closed || neighbourNode.isOccupied()) {
        continue;
      }

      // Add a penalty to diagonal movement (only done when absolutely necessary)
      let penalty = currentNode.__position.isDiagonal(neighbourNode.__position) ? 2 * Math.SQRT2 : 1;

      // Add the cost of the current node
      let gScore = currentNode.__g + penalty * neighbourNode.getCost(currentNode);
      let visited = neighbourNode.__visited;

      if (!visited || gScore < neighbourNode.__g) {

        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
        neighbourNode.__visited = true;
        neighbourNode.__parent = currentNode;
        neighbourNode.__h = neighbourNode.__h || this.heuristic(neighbourNode, to);
        neighbourNode.__g = gScore;
        neighbourNode.__f = neighbourNode.__g + neighbourNode.__h;

        this.__dirtyNodes.push(neighbourNode);

        if (!visited) {
          openHeap.push(neighbourNode);
        } else {
          openHeap.rescoreElement(neighbourNode);
        }

      }

    }

  }

  // No result was found - empty array signifies failure to find path.
  return new Array();

}

Pathfinder.prototype.heuristic = function (from, to) {

  /*
   * Function Pathfinder.heuristic
   * Manhattan heuristic for pathfinding
   */

  return Math.abs(from.__position.x - to.__position.x) +
    Math.abs(from.__position.y - to.__position.y);

}

Pathfinder.prototype.pathTo = function (tile) {

  /*
   * Function Pathfinder.pathTo
   * Walks up the parent chain to find the recovered path
   */

  let path = new Array();

  while (tile.__parent) {
    path.unshift(tile);
    tile = tile.__parent;
  }

  return path;

}

Pathfinder.prototype.findPath = function (begin, stop, isFinalDestination = true) {

  /*
   * Function Pathfinder.findPath
   * Does client-side pathfinding with continuous walking support
   */

  // Store final destination for continuous walking
  if (isFinalDestination) {
    this.__finalDestination = stop;
  }

  let start = gameClient.world.getTileFromWorldPosition(begin);
  let end = gameClient.world.getTileFromWorldPosition(stop);

  // If start is null, we can't pathfind
  if (start === null) {
    this.__finalDestination = null;
    return gameClient.interface.setCancelMessage("Cannot find path from current position.");
  }

  // Check if already at destination
  if (begin.x === stop.x && begin.y === stop.y && begin.z === stop.z) {
    this.__finalDestination = null;
    return;
  }

  // If destination tile is not loaded, find the farthest loaded tile towards it
  if (end === null) {
    end = this.__findClosestTileTowards(begin, stop);
    if (end === null) {
      // DON'T clear final destination - we might be able to continue later
      return gameClient.interface.setCancelMessage("Walking towards destination...");
    }
  }

  // Same tile check (start equals end)
  if (start === end) {
    // DON'T clear final destination - continue walking
    return;
  }

  let path = this.search(start, end);

  if (path.length === 0) {
    // DON'T clear final destination for intermediate paths
    if (!isFinalDestination) {
      return gameClient.interface.setCancelMessage("Finding alternate route...");
    }
    this.__finalDestination = null;
    return gameClient.interface.setCancelMessage("There is no way.");
  }

  // Convert path to directions
  path = path.map(function (node) {
    let tmp = start.__position.getLookDirection(node.__position);
    start = node;
    return tmp;
  });

  this.setPathfindCache(path);

}

Pathfinder.prototype.__findClosestTileTowards = function (from, to) {

  /*
   * Function Pathfinder.__findClosestTileTowards
   * Finds the farthest loaded and walkable tile in the direction of the target
   */

  let dx = to.x - from.x;
  let dy = to.y - from.y;
  let distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1) return null;

  // Normalize direction
  let nx = dx / distance;
  let ny = dy / distance;

  // Search from near to far, keep the farthest valid tile
  let bestTile = null;
  let maxDistance = Math.min(Math.floor(distance), 60); // Limit to 60 tiles

  // Check every tile along the path
  for (let d = 1; d <= maxDistance; d++) {
    let checkX = Math.floor(from.x + nx * d);
    let checkY = Math.floor(from.y + ny * d);
    let checkPos = new Position(checkX, checkY, from.z);

    let tile = gameClient.world.getTileFromWorldPosition(checkPos);

    // If tile exists and is walkable
    if (tile !== null && !tile.isOccupied()) {
      bestTile = tile;
    } else if (tile === null) {
      // Hit edge of loaded world, stop here
      break;
    }
    // If tile is occupied, we might still find walkable tiles beyond, so continue
  }

  return bestTile;

}

Pathfinder.prototype.setPathfindCache = function (path) {

  /*
   * Function Pathfinder.setPathfindCache
   * Updates the pathfinding cache with a new path or nothing
   */

  if (path === null) {
    this.__finalDestination = null; // Cancel continuous walking
    this.__pathfindCache = new Array();
    return;
  }

  this.__pathfindCache = path;
  this.handlePathfind();

}

Pathfinder.prototype.getNextMove = function () {

  /*
   * Function Pathfinder.getNextMove
   * Returns the next pathfinding move
   */

  if (this.__pathfindCache.length === 0) {
    return null;
  }

  return this.__pathfindCache.shift();

}

Pathfinder.prototype.handlePathfind = function () {

  /*
   * Function Pathfinder.handlePathfind
   * Handles the next pathfinding action
   */

  let nextMove = this.getNextMove();

  // If no more moves but we have a final destination, try to continue
  if (nextMove === null) {
    if (this.__finalDestination !== null) {
      // Schedule continuation after a short delay (allows new tiles to load)
      let self = this;
      let dest = this.__finalDestination;
      setTimeout(function () {
        if (self.__finalDestination !== null) {
          let playerPos = gameClient.player.getPosition();
          // Check if we've reached the destination
          if (playerPos.x === dest.x && playerPos.y === dest.y && playerPos.z === dest.z) {
            self.__finalDestination = null;
          } else {
            // Continue pathfinding towards destination
            self.findPath(playerPos, dest, false);
          }
        }
      }, 300);
    }
    return;
  }

  // Delegate movement
  switch (nextMove) {
    case CONST.DIRECTION.NORTH: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.UP_ARROW);
    case CONST.DIRECTION.EAST: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.RIGHT_ARROW);
    case CONST.DIRECTION.SOUTH: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.DOWN_ARROW);
    case CONST.DIRECTION.WEST: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.LEFT_ARROW);
    case CONST.DIRECTION.NORTH_EAST: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.KEYPAD_9);
    case CONST.DIRECTION.SOUTH_EAST: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.KEYPAD_3);
    case CONST.DIRECTION.SOUTH_WEST: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.KEYPAD_1);
    case CONST.DIRECTION.NORTH_WEST: return gameClient.keyboard.handleCharacterMovement(Keyboard.prototype.KEYS.KEYPAD_7);
    default: return;
  }

}
