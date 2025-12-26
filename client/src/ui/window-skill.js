const SkillWindow = function (element) {

  /*
   * Class InteractiveWindow
   * Makes an element with the window class interactive
   *
   * API:
   *  - generateContent(content): Generates the body content for the window based on the friend list array
   */

  InteractiveWindow.call(this, element);

}

// Set the prototype and constructor
SkillWindow.prototype = Object.create(InteractiveWindow.prototype);
SkillWindow.prototype.constructor = SkillWindow;

SkillWindow.prototype.setSkillValue = function (which, value, percentage) {

  /*
   * Function SkillWindow.setSkillValue
   * Updates the skill value with a new provided value
   */

  // Select the appropriate skill wrapper element
  let span = "div[skill=" + which + "]";

  // Select it from the skill window body
  let skill = this.__element.querySelector(span).querySelector(".skill");

  if (skill !== null) {
    skill.innerHTML = value.formatNumber();
  }

  // See if there is a bar
  let bar = this.__element.querySelector(span).querySelector(".bar");

  // Also update the bar element
  if (bar === null) {
    return;
  }

  // Update the DOM properties
  bar.title = "You need %s% to advance.".format(Math.ceil(100 - percentage));
  bar.children[0].style.width = percentage + "%";

}

SkillWindow.prototype.setFoodTimer = function (seconds) {

  /*
   * Function SkillWindow.setFoodTimer
   * Updates the food timer display with remaining seconds in MM:SS format
   * Starts a countdown that updates every second
   */

  // Store the remaining seconds on the window for countdown
  this.__foodTimerSeconds = Math.max(0, Math.floor(seconds));

  // Update the display immediately
  this.__updateFoodTimerDisplay();

  // Clear any existing interval
  if (this.__foodTimerInterval) {
    clearInterval(this.__foodTimerInterval);
    this.__foodTimerInterval = null;
  }

  // Start countdown interval if there's time remaining
  if (this.__foodTimerSeconds > 0) {
    this.__foodTimerInterval = setInterval(this.__countdownFoodTimer.bind(this), 1000);
  }

}

SkillWindow.prototype.__countdownFoodTimer = function () {

  /*
   * Function SkillWindow.__countdownFoodTimer
   * Decrements the food timer by 1 second and updates display
   */

  this.__foodTimerSeconds--;

  if (this.__foodTimerSeconds <= 0) {
    this.__foodTimerSeconds = 0;
    // Stop the interval when timer reaches 0
    if (this.__foodTimerInterval) {
      clearInterval(this.__foodTimerInterval);
      this.__foodTimerInterval = null;
    }
  }

  this.__updateFoodTimerDisplay();

}

SkillWindow.prototype.__updateFoodTimerDisplay = function () {

  /*
   * Function SkillWindow.__updateFoodTimerDisplay
   * Updates the food timer DOM element with current value
   */

  let seconds = this.__foodTimerSeconds || 0;

  // Calculate minutes and remaining seconds
  let minutes = Math.floor(seconds / 60);
  let remainingSeconds = seconds % 60;

  // Format as MM:SS (with leading zeros)
  let formatted = String(minutes).padStart(2, '0') + ':' + String(remainingSeconds).padStart(2, '0');

  // Select the food skill element
  let foodElement = this.__element.querySelector("div[skill=food]");

  if (foodElement === null) {
    return;
  }

  let skill = foodElement.querySelector(".skill");

  if (skill !== null) {
    skill.innerHTML = formatted;
  }

}