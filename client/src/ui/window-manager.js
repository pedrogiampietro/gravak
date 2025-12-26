const WindowManager = function () {

  /*
   * Function WindowManager
   * Manages all windows (e.g. skills, battle list)
   *
   * API:
   *
   * Function closeAll - Closes all the opened windows in e.g., a client reset
   * Function getStack - Returns the particular stack (left or right) DOM element
   * Function getWindow - Returns a reference to a window with a particular name
   *
   */

  this.windows = new Object({
    "battle-window": new BattleWindow(document.getElementById("battle-window")),
    "skill-window": new SkillWindow(document.getElementById("skill-window")),
    "friend-window": new FriendWindow(document.getElementById("friend-window")),
  });

  this.stacks = document.getElementsByClassName("column");
  this.__attachStackEventListeners(this.stacks);

  // Default add to right column
  this.getWindow("battle-window").addTo(this.getStack("right"));
  this.getWindow("skill-window").addTo(this.getStack("right"));
  this.getWindow("friend-window").addTo(this.getStack("right"));

  // State object of the mouse
  this.state = new State();
  this.state.add("currentDragElement", null),
    this.state.add("currentMouseElement", null),
    this.state.add("mouseDownTarget", null);
  this.state.add("currentDragElementOffset", null);

  // Callback one mouse move
  document.addEventListener("mousemove", this.__handleMove.bind(this));
  document.addEventListener("mouseup", this.__handleMouseUp.bind(this));

  // Add the event listeners for dragging and mouse down/up events
  Object.values(this.windows).forEach(this.register.bind(this), this);

}

WindowManager.prototype.register = function (gameWindow) {

  this.__addListeners(gameWindow);

}

WindowManager.prototype.getWindow = function (name) {

  /*
   * Function WindowManager.getWindow
   * Returns the window for a particular name
   */

  // Does not exist
  if (!this.windows.hasOwnProperty(name)) {
    return null;
  }

  return this.windows[name];

}

WindowManager.prototype.__addListeners = function (gameWindow) {

  /*
   * Function WindowManager.addListeners
   * Returns the window for a particular name
   */

  // Add event listeners to the particular element
  gameWindow.__element.addEventListener("dragstart", this.__handleDragStart.bind(this));
  gameWindow.__element.addEventListener("dragend", this.__handleDragEnd.bind(this));
  gameWindow.__element.addEventListener("mousedown", this.__handleMouseDown.bind(this, gameWindow));

}

WindowManager.prototype.closeAll = function () {

  /*
   * Function WindowManager.closeAll
   * Closes all the opened windows
   */

  // Close all the windows
  Object.values(this.windows).forEach(gameWindow => gameWindow.close());

}

WindowManager.prototype.getStack = function (stack) {

  /*
   * Function WindowManager.getStack
   * Returns the stack that belongs either left or right
   */

  switch (stack) {
    case "left":
      return this.stacks[0];
    case "right":
      return this.stacks[1];
    default:
      return console.error("Unknown stack requested.");
  }

}

WindowManager.prototype.getFreeStack = function (requiredHeight) {

  /*
   * Function WindowManager.getFreeStack
   * Returns the best stack to open a window, preferring right side.
   * Falls back to left if right column doesn't have enough space.
   */

  let rightStack = this.getStack("right");

  if (requiredHeight === undefined) {
    requiredHeight = 0;
  }

  // Calculate the actual height of VISIBLE children in the right stack
  let visibleHeight = 0;
  Array.from(rightStack.children).forEach(function (child) {
    if (child.style.display !== "none" && child.style.display !== "") {
      visibleHeight += child.offsetHeight;
    }
  });

  // Get the parent container (oogwrap)
  let oogwrap = rightStack.parentElement;
  let parentHeight = oogwrap ? oogwrap.clientHeight : window.visualViewport.height;

  // Calculate height taken by sibling elements (oogwrap2 - minimap, equipment, etc.)
  let siblingsHeight = 0;
  if (oogwrap) {
    Array.from(oogwrap.children).forEach(function (sibling) {
      if (sibling !== rightStack) {
        siblingsHeight += sibling.offsetHeight;
      }
    });
  }

  // The actual available height for the column is parent height minus siblings
  let limit = parentHeight - siblingsHeight;

  // Check if the right stack is full (visible content + new window exceeds available height)
  if (visibleHeight + requiredHeight > limit) {
    return this.getStack("left");
  }

  return rightStack;

}

WindowManager.prototype.__attachStackEventListeners = function (stacks) {

  /*
   * Function WindowManager.__attachStackEventListeners
   * Updates the skill value with a new provided value
   */

  // Attach a listener to both stacks for when windows are dropped
  Array.from(stacks).forEach(function (element) {
    element.addEventListener("dragover", this.__handleWindowDrop.bind(this));
  }, this);

}

WindowManager.prototype.__handleMove = function (event) {

  /*
   * Function WindowManager.__handleMove
   * Callback fired when the mouse is moved
   */

  // There is currently no element being dragged
  if (this.state.currentMouseElement === null) {
    return;
  }

  let body = this.state.currentMouseElement.getBody();
  body.style.height = (event.clientY - body.offsetTop - 12) + "px";

}

WindowManager.prototype.__handleWindowDrop = function (event) {

  /*
   * Function WindowManager.__handleWindowDrop
   * Handles drop of a window in the window stack
   */

  // Get the target of the element being dropped on
  let element = event.target;

  if (this.state.currentDragElement === null) {
    return;
  }

  // Dropped in the stack element itself: append the element
  if (element.className === "column") {
    return element.append(this.state.currentDragElement);
  }

  // Run up the dropped area to get the window being swapped
  let iterations = 0;
  while (element.parentElement && element.parentElement.className !== "column") {
    element = element.parentElement;
    iterations++;
    if (iterations > 20) {
      break;
    }
  }

  // Nothing to do if the same element is being hovered on
  if (element === this.state.currentDragElement) {
    return;
  }

  // Commit to swapping the windows!
  if (element.previousSibling === this.state.currentDragElement) {
    element.parentNode.insertBefore(element, this.state.currentDragElement);
  } else {
    element.parentNode.insertBefore(this.state.currentDragElement, element);
  }

}

WindowManager.prototype.__handleDragEnd = function (event) {

  /*
   * Function WindowManager.handleDragEnd
   * Returns the window for a particular name
   */

  // Check if there is a current drag element (drag may have been cancelled)
  if (this.state.currentDragElement === null) {
    event.target.style.opacity = 1;
    return;
  }

  // Reset the opacity and current element
  this.state.currentDragElement.children[1].scrollTop = this.state.currentDragElementOffset;
  this.state.currentDragElement = null;
  this.state.currentDragElementOffset = null;

  event.target.style.opacity = 1;

}

WindowManager.prototype.__handleMouseDown = function (gameWindow, event) {

  /*
   * Function Window.__handleMouseDown
   * Callback fired when mouse is pushed down
   */

  this.state.mouseDownTarget = event.target;

  if (event.target.className === "footer") {
    this.state.currentMouseElement = gameWindow
  }

}

WindowManager.prototype.__handleDragStart = function (event) {

  /*
   * Function Window.__handleDragStart
   * Callback fired when the dragging is started
   */

  // Can only be dragged by the header of the window
  if (this.state.mouseDownTarget.className !== "header") {
    return event.preventDefault();
  }

  // Set the currently dragged element and opacity
  this.state.currentDragElement = event.target;
  this.state.currentDragElementOffset = event.target.children[1].scrollTop;

  // Drop the opacity to show being dragged
  event.target.style.opacity = 0.25;

}

WindowManager.prototype.__handleMouseUp = function (event) {

  /*
   * Function Window.__handleMouseUp
   * Callback fired when mouse is pushed up
   */

  this.state.currentMouseElement = null;

}