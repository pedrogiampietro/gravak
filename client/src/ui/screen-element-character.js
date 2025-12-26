const CharacterElement = function (creature) {
  /*
   * Class CharacterElement
   * Container for a character element that floats above creatures
   */

  // Inherit from screen element
  ScreenElement.call(this, "character-element-prototype");

  this.__creature = creature;

  // Update settings
  this.setName(creature.name);
};

CharacterElement.prototype = Object.create(ScreenElement.prototype);
CharacterElement.prototype.constructor = CharacterElement;

CharacterElement.prototype.setDefault = function () {
  /*
   * Class CharacterElement.setDefault
   * Sets the default colors of the healthbar
   */

  this.setHealthFraction(this.__creature.getHealthFraction());
  this.setManaColor(Interface.prototype.COLORS.BLUE);

  // Set mana fraction if the creature has mana (e.g., Players)
  if (typeof this.__creature.getManaFraction === "function") {
    this.setManaFraction(this.__creature.getManaFraction());
  }
};

CharacterElement.prototype.setGrey = function () {
  /*
   * Class CharacterElement.setGrey
   * Sets the fraction of the mana bar width
   */

  this.setHealthColor(Interface.prototype.COLORS.LIGHTGREY);
  this.setManaColor(Interface.prototype.COLORS.LIGHTGREY);
};

CharacterElement.prototype.setHealthFraction = function (fraction) {
  /*
   * Class CharacterElement.setHealthFraction
   * Sets the fraction of the mana bar width
   */

  // Set the color of the health bar too
  let color =
    fraction > 0.5
      ? Interface.prototype.COLORS.LIGHTGREEN
      : fraction > 0.25
        ? Interface.prototype.COLORS.ORANGE
        : fraction > 0.1
          ? Interface.prototype.COLORS.RED
          : Interface.prototype.COLORS.DARKRED;

  // Fetch the healthbar from the element
  let healthBar = this.element.querySelector(".value-health");

  // Set styling
  healthBar.style.width = fraction.toPercentage() + "%";

  // Add actual health values
  let currentHealth = Math.round(this.__creature.state.health);
  let maxHealth = Math.round(this.__creature.state.maxHealth);
  healthBar.setAttribute("title", `${currentHealth}/${maxHealth}`);

  this.setHealthColor(color);
};

CharacterElement.prototype.setHealthColor = function (color) {
  this.element.querySelector(".value-health").style.backgroundColor =
    Interface.prototype.getHexColor(color);

  this.setNameColor(color);
};

CharacterElement.prototype.setManaColor = function (color) {
  this.element.querySelector(".value-mana").style.backgroundColor =
    Interface.prototype.getHexColor(color);
};

CharacterElement.prototype.setManaFraction = function (fraction) {
  /*
   * Class CharacterElement.setManaFraction
   * Sets the fraction of the mana bar width
   */

  this.element.querySelector(".value-mana").style.width =
    fraction.toPercentage() + "%";
};

CharacterElement.prototype.setNameColor = function (color) {
  /*
   * Class CharacterElement.setNameColor
   * Sets the color of the name plate of the character element
   */

  this.element.querySelector("span").style.color =
    Interface.prototype.getHexColor(color);
};

CharacterElement.prototype.setName = function (name) {
  /*
   * Class CharacterElement.setName
   * Sets the name plate of the character element
   */

  this.element.querySelector("span").innerHTML = name;
};

CharacterElement.prototype.setTextPosition = function () {
  /*
   * Function CharacterElement.setTextPosition
   * Sets the text position of the character element
   */

  let isMobile = gameClient.touch && gameClient.touch.isMobileMode;
  let isPlayer = this.__creature === gameClient.player;

  // Use the same position calculation for both desktop and mobile
  // This includes movement interpolation for smooth animation
  let screenPosition = gameClient.renderer.getCreatureScreenPosition(this.__creature);

  /*
   * FIX: Snap to internal pixel grid to match renderer
   * The renderer rounds coordinates to the nearest integer pixel (32x)
   * The DOM uses floating point, causing sub-pixel jitter when scaled
   * We must snap the DOM position to the same "virtual pixels" as the sprite
   */
  screenPosition.x = Math.round(screenPosition.x * 32) / 32;
  screenPosition.y = Math.round(screenPosition.y * 32) / 32;

  let offset = this.__getAbsoluteOffset(screenPosition);
  let scale = gameClient.interface.getSpriteScalingVector();

  // Center the nameplate horizontally
  offset.left += scale.x / 2;

  // Add an offset to make the nameplate hover above the player
  // Mobile needs larger offset due to CSS scaling, desktop uses original
  // Use scale.y for vertical offset to match height scaling
  offset.top -= isMobile ? (scale.y * 0.7) : (scale.y / 4);

  // Add smooth transition for mobile to reduce any visual jittering
  if (isMobile) {
    this.element.style.transition = "transform 0.05s linear";
  } else {
    this.element.style.transition = "";
  }

  // Delegate to the generic move function
  this.__updateTextPosition(offset);
};
