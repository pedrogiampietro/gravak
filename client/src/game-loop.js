const GameLoop = function (frameCallback) {

  /*
   * Class GameLoop
   * Wrapper for the game loop that executes as fast as possible allowed by the client
   *
   * API:
   *
   * GameLoop.isRunning() - returns true if the game loop is running
   * GameLoop.init() - initializes the game loop
   * GameLoop.abort() - aborts the game loop
   * GameLoop.setFPSMode(mode) - sets the FPS mode (60, 120, or 0 for unlimited)
   *
   */

  // Callback fired every frame
  this.__frameCallback = frameCallback;

  // State
  this.__frame = 0;
  this.__running = false;
  this.__aborted = false;
  this.__initialized = null;

  // FPS control
  this.__targetFPS = 60;
  this.__lastFrameTime = 0;
  this.__frameInterval = 1000 / 60; // ms per frame for 60fps

}

GameLoop.prototype.getCurrentFrame = function () {

  return this.__frame;

}

GameLoop.prototype.isRunning = function () {

  /*
   * Function GameLoop.isRunning
   * Returns true if the game loop is running
   */

  return this.__running;

}

GameLoop.prototype.setFPSMode = function (targetFPS) {

  /*
   * Function GameLoop.setFPSMode
   * Sets the target FPS mode (60, 120, or 0 for unlimited)
   */

  this.__targetFPS = parseInt(targetFPS);

  if (this.__targetFPS > 0) {
    this.__frameInterval = 1000 / this.__targetFPS;
  } else {
    this.__frameInterval = 0; // Unlimited
  }

}

GameLoop.prototype.getFPSMode = function () {

  /*
   * Function GameLoop.getFPSMode
   * Returns the current FPS mode
   */

  return this.__targetFPS;

}

GameLoop.prototype.init = function () {

  /*
   * Function GameLoop.init
   * Initializes the game loop
   */

  // Already running
  if (this.isRunning()) {
    return;
  }

  this.__initialized = performance.now();
  this.__lastFrameTime = performance.now();

  // Set state and begin the loop
  this.__aborted = false;
  this.__running = true;

  this.__loop();

}

GameLoop.prototype.abort = function () {

  /*
   * Function GameLoop.abort
   * Aborts the currently running gameloop
   */

  this.__aborted = true;
  this.__running = false;

}

GameLoop.prototype.__loop = function () {

  /*
   * Function GameClient.__loop
   * Main body of the internal game loop
   */

  // The internal loop was aborted: stop running
  if (this.__aborted) {
    return;
  }

  let now = performance.now();
  let elapsed = now - this.__lastFrameTime;

  // For V-Sync mode (60 FPS), use requestAnimationFrame
  if (this.__targetFPS === 60) {
    this.__frame++;
    this.__lastFrameTime = now;
    this.__frameCallback();
    requestAnimationFrame(this.__loop.bind(this));
    return;
  }

  // For unlimited or higher FPS modes
  if (this.__targetFPS === 0 || elapsed >= this.__frameInterval) {
    this.__frame++;
    this.__lastFrameTime = now - (elapsed % this.__frameInterval);
    this.__frameCallback();
  }

  // Use setTimeout for higher than 60fps or unlimited
  setTimeout(this.__loop.bind(this), 0);

}
