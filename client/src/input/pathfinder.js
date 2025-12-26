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

Pathfinder.prototype.findPathWithWaypoints = function (begin, stop, waypoints) {

  /*
   * Function Pathfinder.findPathWithWaypoints
   * Uses pre-calculated waypoints from the world map to guide pathfinding
   * This ensures the character follows the visual path shown on the map
   */

  // Store waypoints and final destination
  this.__waypoints = waypoints.slice(); // Copy array
  this.__finalDestination = stop;
  this.__usingWaypoints = true;

  // Start walking to the first waypoint
  this.__navigateToNextWaypoint(begin);

}

Pathfinder.prototype.__navigateToNextWaypoint = function (currentPos) {

  /*
   * Function Pathfinder.__navigateToNextWaypoint
   * Navigates to the next waypoint in the queue
   */

  if (!this.__waypoints || this.__waypoints.length === 0) {
    // No more waypoints, try to reach final destination
    if (this.__finalDestination !== null) {
      this.__usingWaypoints = false;
      this.findPath(currentPos, this.__finalDestination, true);
    }
    return;
  }

  // Get next waypoint
  let nextWaypoint = this.__waypoints[0];

  // Check if we're close to this waypoint (within 3 tiles)
  let dx = Math.abs(currentPos.x - nextWaypoint.x);
  let dy = Math.abs(currentPos.y - nextWaypoint.y);

  if (dx <= 3 && dy <= 3) {
    // Close enough, move to next waypoint
    this.__waypoints.shift();
    this.__navigateToNextWaypoint(currentPos);
    return;
  }

  // Try to path to this waypoint
  let start = gameClient.world.getTileFromWorldPosition(currentPos);
  let end = gameClient.world.getTileFromWorldPosition(nextWaypoint);

  if (start === null) {
    this.__waypoints = null;
    this.__finalDestination = null;
    return gameClient.interface.setCancelMessage("Cannot find path from current position.");
  }

  // If waypoint tile not loaded, find closest loaded tile towards it
  if (end === null) {
    end = this.__findClosestTileTowards(currentPos, nextWaypoint);
  }

  if (end === null || start === end) {
    // Skip this waypoint and try next one
    this.__waypoints.shift();
    this.__navigateToNextWaypoint(currentPos);
    return;
  }

  let path = this.search(start, end);

  if (path.length === 0) {
    // Can't reach this waypoint directly, try alternate route
    let alternateEnd = this.__findAnyWalkableTileInDirection(currentPos, nextWaypoint);
    if (alternateEnd !== null && alternateEnd !== start) {
      path = this.search(start, alternateEnd);
    }
  }

  if (path.length === 0) {
    // Skip this waypoint and try next
    this.__waypoints.shift();
    this.__navigateToNextWaypoint(currentPos);
    return;
  }

  // Convert path to directions
  let startNode = start;
  path = path.map(function (node) {
    let tmp = startNode.__position.getLookDirection(node.__position);
    startNode = node;
    return tmp;
  });

  this.setPathfindCache(path);

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
  let isDestinationLoaded = (end !== null);

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
    // Try to find any walkable tile in the general direction
    let alternateEnd = this.__findAnyWalkableTileInDirection(begin, stop);
    if (alternateEnd !== null && alternateEnd !== start) {
      path = this.search(start, alternateEnd);
    }

    // If still no path
    if (path.length === 0) {
      // DON'T clear final destination for intermediate paths
      if (!isFinalDestination) {
        return gameClient.interface.setCancelMessage("Finding alternate route...");
      }
      // If destination is not loaded, keep the destination for continued walking
      if (!isDestinationLoaded) {
        return gameClient.interface.setCancelMessage("Walking towards destination...");
      }
      this.__finalDestination = null;
      return gameClient.interface.setCancelMessage("There is no way.");
    }
  }

  // Convert path to directions
  path = path.map(function (node) {
    let tmp = start.__position.getLookDirection(node.__position);
    start = node;
    return tmp;
  });

  this.setPathfindCache(path);

}

Pathfinder.prototype.__findAnyWalkableTileInDirection = function (from, to) {

  /*
   * Function Pathfinder.__findAnyWalkableTileInDirection
   * Finds a reachable tile that gets closest to the destination
   * Uses BFS to explore reachable area and picks the tile that minimizes distance to target
   */

  let startTile = gameClient.world.getTileFromWorldPosition(from);
  if (startTile === null) return null;

  // Calculate initial distance to target
  let initialDistToTarget = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));

  // BFS to find all reachable tiles
  let visited = new Set();
  let queue = [];

  queue.push({ tile: startTile, dist: 0 });
  visited.add(from.x + "," + from.y);

  let bestTile = null;
  let bestDistToTarget = initialDistToTarget;
  let bestPathDist = 0;

  while (queue.length > 0 && visited.size < 300) {
    let current = queue.shift();

    if (current.dist > 20) continue; // Limit search depth

    let neighbors = current.tile.neighbours || [];

    for (let i = 0; i < neighbors.length; i++) {
      let neighbor = neighbors[i];
      if (neighbor === null) continue;

      let nPos = neighbor.__position;
      let key = nPos.x + "," + nPos.y;

      if (visited.has(key)) continue;
      visited.add(key);

      if (neighbor.isOccupied()) continue;

      // Calculate distance from this tile to the target
      let distToTarget = Math.sqrt(Math.pow(to.x - nPos.x, 2) + Math.pow(to.y - nPos.y, 2));

      // We want tiles that:
      // 1. Are closer to the target than where we started
      // 2. Are at least a few steps away (to make progress)
      // 3. Prefer tiles that are reachable in fewer steps

      if (distToTarget < bestDistToTarget && current.dist >= 3) {
        // This tile gets us closer to target
        bestTile = neighbor;
        bestDistToTarget = distToTarget;
        bestPathDist = current.dist;
      } else if (distToTarget === bestDistToTarget && current.dist < bestPathDist) {
        // Same distance but shorter path
        bestTile = neighbor;
        bestPathDist = current.dist;
      }

      queue.push({ tile: neighbor, dist: current.dist + 1 });
    }
  }

  return bestTile;

}


Pathfinder.prototype.__findClosestTileTowards = function (from, to) {

  /*
   * Function Pathfinder.__findClosestTileTowards
   * Finds the best reachable tile that gets us closer to the destination
   * Uses BFS to explore and picks the tile that minimizes distance to target
   */

  let startTile = gameClient.world.getTileFromWorldPosition(from);
  if (startTile === null) return null;

  let dx = to.x - from.x;
  let dy = to.y - from.y;
  let initialDistToTarget = Math.sqrt(dx * dx + dy * dy);

  if (initialDistToTarget < 1) return null;

  // BFS to find all reachable tiles within loaded area
  let visited = new Set();
  let queue = [];

  queue.push({ tile: startTile, dist: 0 });
  visited.add(from.x + "," + from.y);

  let bestTile = null;
  let bestDistToTarget = initialDistToTarget;

  while (queue.length > 0 && visited.size < 500) {
    let current = queue.shift();

    if (current.dist > 25) continue; // Limit search depth

    let neighbors = current.tile.neighbours || [];

    for (let i = 0; i < neighbors.length; i++) {
      let neighbor = neighbors[i];
      if (neighbor === null) continue;

      let nPos = neighbor.__position;
      let key = nPos.x + "," + nPos.y;

      if (visited.has(key)) continue;
      visited.add(key);

      if (neighbor.isOccupied()) continue;

      // Calculate distance from this tile to the final target
      let distToTarget = Math.sqrt(Math.pow(to.x - nPos.x, 2) + Math.pow(to.y - nPos.y, 2));

      // We want the tile that gets us closest to the target
      // and is at least a few steps away from start
      if (distToTarget < bestDistToTarget && current.dist >= 3) {
        bestTile = neighbor;
        bestDistToTarget = distToTarget;
      }

      queue.push({ tile: neighbor, dist: current.dist + 1 });
    }
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
    this.__waypoints = null; // Clear waypoints
    this.__usingWaypoints = false;
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

  // If no more moves, check for waypoints or final destination
  if (nextMove === null) {
    let self = this;

    // If using waypoints, continue to next waypoint
    if (this.__usingWaypoints && this.__waypoints && this.__waypoints.length > 0) {
      setTimeout(function () {
        let playerPos = gameClient.player.getPosition();
        self.__navigateToNextWaypoint(playerPos);
      }, 300);
      return;
    }

    // Otherwise, try to reach final destination
    if (this.__finalDestination !== null) {
      let dest = this.__finalDestination;
      setTimeout(function () {
        if (self.__finalDestination !== null) {
          let playerPos = gameClient.player.getPosition();
          // Check if we've reached the destination
          if (playerPos.x === dest.x && playerPos.y === dest.y && playerPos.z === dest.z) {
            self.__finalDestination = null;
            self.__waypoints = null;
            self.__usingWaypoints = false;
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
