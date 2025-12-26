const MapModal = function (element) {

  /*
   * Class MapModal
   * Wrapper for the world map modal that shows the world map
   */

  // Inherit from modal
  Modal.call(this, element);

  // Current center of the map
  this.canvas = new Canvas("map-modal-canvas", 256, 256);
  this.span = document.querySelector(".map-modal-wrapper > span");

  // Attach listeners to be able to scroll the map
  this.canvas.canvas.addEventListener("mousedown", this.__attachMove.bind(this));
  this.canvas.canvas.addEventListener("wheel", this.__handleScroll.bind(this));
  document.addEventListener("mouseup", this.__removeMove.bind(this));

  this.__center = Position.prototype.NULL;
  this.__mouseDownPosition = Position.prototype.NULL;
  this.__boundMoveCallback = this.__handleMove.bind(this);
  this.__zoomLevel = 0;
  this.__isDragging = false;
  this.__targetPosition = null;  // Target position for path visualization

}

MapModal.prototype = Object.create(Modal.prototype);
MapModal.constructor = MapModal;

MapModal.prototype.__removeMove = function (event) {

  /*
   * Function MapModal.__removeMove
   * Removes movement listener from the canvas and handles click if not dragging
   */

  this.canvas.canvas.removeEventListener("mousemove", this.__boundMoveCallback);

  // If not dragging, treat as a click for walk-to
  if (!this.__isDragging && event && event.target === this.canvas.canvas) {
    this.__handleClick(event);
  }

  this.__isDragging = false;

}

MapModal.prototype.__handleScroll = function (event) {

  /*
   * Function MapModal.__handleScroll
   * Scrolls the minimap with the scroll wheel
   */

  // Check the direction of the scrollwheel
  if (event.deltaY < 0) {
    this.__changeZoomLevel(1);
  } else {
    this.__changeZoomLevel(-1);
  }

}

MapModal.prototype.__changeZoomLevel = function (value) {

  /*
   * Function GameClient.changeZoomLevel
   * Changes the state of the zoom level (clamped between 0 & 4) and renders the minimap
   */

  this.__zoomLevel += value;
  this.__zoomLevel = Math.min(Math.max(0, this.__zoomLevel), 4);

  this.draw();

}

MapModal.prototype.__attachMove = function (event) {

  /*
   * Function MapModal.__attachMove
   * Attaches movement listener to the canvas
   */

  this.__mouseDownPosition = this.canvas.getCanvasCoordinates(event);
  this.__isDragging = false;

  this.canvas.canvas.addEventListener("mousemove", this.__boundMoveCallback);

}

MapModal.prototype.__handleMove = function (event) {

  /*
   * Function MapModal.__handleMove
   * Callback fired when the mouse is moved to update the world map position
   */

  // Mark as dragging since mouse moved
  this.__isDragging = true;

  let { x, y } = this.canvas.getCanvasCoordinates(event);

  let position = new Position(this.__mouseDownPosition.x - x, this.__mouseDownPosition.y - y, 0);

  // Handle zoom level
  position.x = Math.round(position.x * (1 / (this.__zoomLevel + 1)));
  position.y = Math.round(position.y * (1 / (this.__zoomLevel + 1)));

  // Update the offset
  this.__center = this.__center.add(position);

  // Update this position too
  this.__mouseDownPosition = this.canvas.getCanvasCoordinates(event);

  this.draw();

}

MapModal.prototype.__handleClick = function (event) {

  /*
   * Function MapModal.__handleClick
   * Handles click on the map to walk to that location
   * First click: show path on map
   * Click again or same spot: start walking
   */

  // Get canvas coordinates
  let { x, y } = this.canvas.getCanvasCoordinates(event);

  // Calculate world position (accounting for center and zoom)
  // Canvas is 256x256, center is at 128,128
  let zoomFactor = 1 / (this.__zoomLevel + 1);
  let worldX = Math.floor(this.__center.x + (x - 128) * zoomFactor);
  let worldY = Math.floor(this.__center.y + (y - 128) * zoomFactor);

  // Use player's current floor for pathfinding
  let playerPosition = gameClient.player.getPosition();
  let worldZ = playerPosition.z;

  // Create target position
  let targetPosition = new Position(worldX, worldY, worldZ);

  // Check if viewing a different floor
  if (this.__center.z !== worldZ) {
    gameClient.interface.setCancelMessage("You can only walk to locations on the same floor.");
    return;
  }

  // If clicking on same target (within 3 tiles), start walking
  if (this.__targetPosition !== null) {
    let dx = Math.abs(this.__targetPosition.x - targetPosition.x);
    let dy = Math.abs(this.__targetPosition.y - targetPosition.y);

    if (dx <= 3 && dy <= 3) {
      // Same target - start walking using cached waypoints
      let walkTarget = this.__targetPosition;
      let waypoints = this.__cachedWaypoints || [];
      this.__targetPosition = null;
      this.__cachedWaypoints = null;

      // Close modal and walk
      gameClient.interface.modalManager.close();

      // Pass waypoints to pathfinder if available
      if (waypoints.length > 0) {
        gameClient.world.pathfinder.findPathWithWaypoints(playerPosition, walkTarget, waypoints);
      } else {
        gameClient.world.pathfinder.findPath(playerPosition, walkTarget);
      }
      return;
    }
  }

  // Store target and draw path
  this.__targetPosition = targetPosition;
  this.draw();
  this.__drawPath();

}

MapModal.prototype.__drawPath = function () {

  /*
   * Function MapModal.__drawPath
   * Draws an A* path from player position to target on the map using minimap color data
   * Also caches waypoints for pathfinder to use
   */

  if (this.__targetPosition === null) return;

  let playerPos = gameClient.player.getPosition();
  let targetPos = this.__targetPosition;
  let center = this.__center;
  let zoomFactor = this.__zoomLevel + 1;

  // Calculate canvas positions
  let playerCanvasX = 128 + (playerPos.x - center.x) * zoomFactor;
  let playerCanvasY = 128 + (playerPos.y - center.y) * zoomFactor;
  let targetCanvasX = 128 + (targetPos.x - center.x) * zoomFactor;
  let targetCanvasY = 128 + (targetPos.y - center.y) * zoomFactor;

  let ctx = this.canvas.context;

  // Get the current canvas image data to analyze walkability
  let imageData = ctx.getImageData(0, 0, 256, 256);

  // Calculate path using A* on minimap colors
  let pathPoints = this.__calculateMinimapPath(
    playerCanvasX, playerCanvasY,
    targetCanvasX, targetCanvasY,
    imageData,
    zoomFactor
  );

  // Convert path points back to world coordinates and cache as waypoints
  let self = this;
  this.__cachedWaypoints = [];

  if (pathPoints.length > 1) {
    // Sample waypoints every few points to reduce count
    let sampleRate = Math.max(1, Math.floor(pathPoints.length / 20));

    for (let i = 0; i < pathPoints.length; i += sampleRate) {
      let canvasX = pathPoints[i].x;
      let canvasY = pathPoints[i].y;

      // Convert canvas coordinates back to world coordinates
      let worldX = Math.floor(center.x + (canvasX - 128) / zoomFactor);
      let worldY = Math.floor(center.y + (canvasY - 128) / zoomFactor);

      this.__cachedWaypoints.push(new Position(worldX, worldY, playerPos.z));
    }

    // Always include the final target
    this.__cachedWaypoints.push(targetPos);
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  // Draw path as connected segments
  if (pathPoints.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.stroke();
  } else {
    // Fallback: draw straight line if no path found
    ctx.beginPath();
    ctx.strokeStyle = "#FF6600"; // Orange to indicate potential obstacles
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.moveTo(playerCanvasX, playerCanvasY);
    ctx.lineTo(targetCanvasX, targetCanvasY);
    ctx.stroke();
  }

  // Draw player marker (blue circle)
  ctx.beginPath();
  ctx.fillStyle = "#0088FF";
  ctx.arc(playerCanvasX, playerCanvasY, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.stroke();

  // Draw target marker (red X)
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(targetCanvasX - 5, targetCanvasY - 5);
  ctx.lineTo(targetCanvasX + 5, targetCanvasY + 5);
  ctx.moveTo(targetCanvasX + 5, targetCanvasY - 5);
  ctx.lineTo(targetCanvasX - 5, targetCanvasY + 5);
  ctx.stroke();

  ctx.restore();

  // Update span to show coordinates
  let pathStatus = pathPoints.length > 1 ? "(click again to walk)" : "(path may have obstacles)";
  this.span.innerHTML = "Target: " + this.__targetPosition.toString() + " " + pathStatus;

}

MapModal.prototype.__calculateMinimapPath = function (startX, startY, endX, endY, imageData, zoomFactor) {

  /*
   * Function MapModal.__calculateMinimapPath
   * Calculates an A* path on the minimap using color data to determine walkability
   */

  // Step size based on zoom (larger steps for zoomed out view)
  let step = Math.max(2, Math.floor(zoomFactor));

  // Convert to grid coordinates
  let gridStartX = Math.floor(startX / step);
  let gridStartY = Math.floor(startY / step);
  let gridEndX = Math.floor(endX / step);
  let gridEndY = Math.floor(endY / step);

  // Grid dimensions
  let gridWidth = Math.ceil(256 / step);
  let gridHeight = Math.ceil(256 / step);

  // Check if point is within bounds
  let isInBounds = function (x, y) {
    return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
  };

  // Check if a grid cell is walkable based on minimap color
  let self = this;
  let isWalkable = function (gx, gy) {
    let canvasX = gx * step;
    let canvasY = gy * step;

    if (canvasX < 0 || canvasX >= 256 || canvasY < 0 || canvasY >= 256) {
      return false;
    }

    let index = (canvasY * 256 + canvasX) * 4;
    let r = imageData.data[index];
    let g = imageData.data[index + 1];
    let b = imageData.data[index + 2];
    let a = imageData.data[index + 3];

    return self.__isWalkableColor(r, g, b, a);
  };

  // Clamp to bounds
  gridStartX = Math.max(0, Math.min(gridWidth - 1, gridStartX));
  gridStartY = Math.max(0, Math.min(gridHeight - 1, gridStartY));
  gridEndX = Math.max(0, Math.min(gridWidth - 1, gridEndX));
  gridEndY = Math.max(0, Math.min(gridHeight - 1, gridEndY));

  // A* implementation
  let openSet = [];
  let closedSet = new Set();
  let cameFrom = new Map();
  let gScore = new Map();
  let fScore = new Map();

  let key = function (x, y) { return x + "," + y; };

  let heuristic = function (x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  };

  let startKey = key(gridStartX, gridStartY);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(gridStartX, gridStartY, gridEndX, gridEndY));
  openSet.push({ x: gridStartX, y: gridStartY, f: fScore.get(startKey) });

  // Direction vectors (8 directions)
  let directions = [
    { dx: 0, dy: -1 },  // N
    { dx: 1, dy: 0 },   // E
    { dx: 0, dy: 1 },   // S
    { dx: -1, dy: 0 },  // W
    { dx: 1, dy: -1 },  // NE
    { dx: 1, dy: 1 },   // SE
    { dx: -1, dy: 1 },  // SW
    { dx: -1, dy: -1 }  // NW
  ];

  let iterations = 0;
  let maxIterations = 5000;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    // Get node with lowest fScore
    openSet.sort(function (a, b) { return a.f - b.f; });
    let current = openSet.shift();
    let currentKey = key(current.x, current.y);

    // Reached goal
    if (current.x === gridEndX && current.y === gridEndY) {
      // Reconstruct path
      let path = [];
      let pathKey = currentKey;

      while (pathKey) {
        let [px, py] = pathKey.split(",").map(Number);
        path.unshift({ x: px * step + step / 2, y: py * step + step / 2 });
        pathKey = cameFrom.get(pathKey);
      }

      return path;
    }

    closedSet.add(currentKey);

    // Check neighbors
    for (let i = 0; i < directions.length; i++) {
      let nx = current.x + directions[i].dx;
      let ny = current.y + directions[i].dy;
      let neighborKey = key(nx, ny);

      if (!isInBounds(nx, ny) || closedSet.has(neighborKey)) {
        continue;
      }

      if (!isWalkable(nx, ny)) {
        continue;
      }

      // Diagonal movement costs more
      let moveCost = (directions[i].dx !== 0 && directions[i].dy !== 0) ? 1.414 : 1;
      let tentativeG = gScore.get(currentKey) + moveCost;

      if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        let f = tentativeG + heuristic(nx, ny, gridEndX, gridEndY);
        fScore.set(neighborKey, f);

        // Check if already in openSet
        let inOpen = openSet.some(function (n) { return n.x === nx && n.y === ny; });
        if (!inOpen) {
          openSet.push({ x: nx, y: ny, f: f });
        }
      }
    }
  }

  // No path found - return empty array
  return [];

}

MapModal.prototype.__isWalkableColor = function (r, g, b, a) {

  /*
   * Function MapModal.__isWalkableColor
   * Determines if a minimap color represents a walkable tile
   * Based on Tibia minimap color conventions:
   * - Black (0,0,0) = unexplored/void - NOT walkable
   * - Red/Orange hues = walls/obstacles - NOT walkable
   * - Gray/Brown/Green = walkable floors
   */

  // Transparent or unexplored (black)
  if (a < 128 || (r === 0 && g === 0 && b === 0)) {
    return false;
  }

  // Calculate hue and saturation to identify color type
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let delta = max - min;

  // Very dark colors are usually obstacles
  if (max < 50) {
    return false;
  }

  // Check for red/orange hues (obstacles like walls)
  // Red has high R, low G and B
  if (r > 150 && g < 100 && b < 100) {
    return false;
  }

  // Orange has high R, medium G, low B
  if (r > 180 && g > 50 && g < 150 && b < 80) {
    return false;
  }

  // Pure red (saturated)
  if (delta > 100 && r === max && r > 200 && g < 100) {
    return false;
  }

  // Gray colors (low saturation) are usually floors - walkable
  if (delta < 50 && max > 80) {
    return true;
  }

  // Green colors (grass, nature) - walkable
  if (g > r && g > b && g > 100) {
    return true;
  }

  // Brown/tan colors (sand, dirt) - usually walkable
  if (r > b && g > b && max > 100) {
    return true;
  }

  // Blue colors could be water - not walkable
  if (b > r && b > g && b > 150) {
    return false;
  }

  // Default: if bright enough, consider walkable
  return max > 100;

}



MapModal.prototype.handleOpen = function () {

  /*
   * Function MapModal.handleOpen
   * Callback fired when the world map is opened
   */

  // Clear previous target
  this.__targetPosition = null;

  // Update the offset
  this.__center = gameClient.player.getPosition().copy();

  this.draw();

}

MapModal.prototype.draw = function () {

  /*
   * Function MapModal.draw
   * Draws the world map at the requested position
   */

  // Add position to the span
  this.span.innerHTML = this.__center.toString();

  let position = this.__center;

  // Collect the number of chunks to be rendered (5x5 around player)
  let chunkPositions = new Array();

  // Fetch the chunks around the player
  for (let x = -2; x <= 2; x++) {
    for (let y = -2; y <= 2; y++) {
      chunkPositions.push(new Position(position.x - x * 128, position.y - y * 128, position.z));
    }
  }

  this.canvas.clear();

  // Load all the visible chunks from the database
  gameClient.database.preloadCallback(chunkPositions, function (chunks) {

    Object.entries(chunks).forEach(function ([id, chunk]) {

      let [x, y, z] = id.split(".").map(Number);

      // And paste it at the right position on the minimap canvas
      this.canvas.context.putImageData(
        chunk.imageData,
        x * 128 - position.x + 128,
        y * 128 - position.y + 128
      );

    }, this);

  }.bind(this));

  this.canvas.context.globalCompositeOperation = "copy";

  // Handle zooming
  for (let i = 0; i < this.__zoomLevel; i++) {
    this.canvas.context.drawImage(this.canvas.canvas, 0, 0, 256, 256, -128, -128, 512, 512);
  }

  let pos = gameClient.player.getPosition();

  gameClient.database.dropWorldMapChunks(this.__center);

}