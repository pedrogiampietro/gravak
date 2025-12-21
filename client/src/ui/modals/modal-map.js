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
      // Same target - start walking
      let walkTarget = this.__targetPosition;
      this.__targetPosition = null;

      // Close modal and walk
      gameClient.interface.modalManager.close();
      gameClient.world.pathfinder.findPath(playerPosition, walkTarget);
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
   * Draws a line from player position to target on the map
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

  // Draw path line
  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  // Draw line from player to target
  ctx.beginPath();
  ctx.strokeStyle = "#00FF00";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.moveTo(playerCanvasX, playerCanvasY);
  ctx.lineTo(targetCanvasX, targetCanvasY);
  ctx.stroke();

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
  this.span.innerHTML = "Target: " + this.__targetPosition.toString() + " (click again to walk)";

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