const BattleWindow = function (element) {

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
BattleWindow.prototype = Object.create(InteractiveWindow.prototype);
BattleWindow.prototype.constructor = BattleWindow;

BattleWindow.prototype.removeCreature = function (id) {

  let element = this.getBody().querySelector('[id="%s"]'.format(id));

  if (element === null) {
    return;
  }

  element.remove();

}

BattleWindow.prototype.setTarget = function (creature) {

  Array.from(this.getBody().children).forEach(function (x) {

    if (creature === null) {
      return x.style.border = "1px solid black";
    }

    if (Number(x.getAttribute('id')) === creature.id) {
      x.style.border = "1px solid red";
    } else {
      x.style.border = "1px solid black";
    }

  });

}

BattleWindow.prototype.updateCreature = function (creature) {

  /*
   * Function BattleWindow.updateCreature
   * Updates the DOM element of the creature with new stats
   */

  // Find the element for this creature
  let element = this.getBody().querySelector('[id="%s"]'.format(creature.id));

  if (!element) {
    return;
  }

  // FOV Check: Only show creatures on the same floor and within 9 tiles
  let player = gameClient.player;
  if (player && !gameClient.isSelf(creature)) {
    let playerPos = player.getPosition();
    let creaturePos = creature.getPosition();
    let dx = Math.abs(playerPos.x - creaturePos.x);
    let dy = Math.abs(playerPos.y - creaturePos.y);

    if (playerPos.z !== creaturePos.z || dx > 9 || dy > 9) {
      element.style.display = "none";
      return;
    }
  }

  element.style.display = "flex";

  let nameSpan = element.firstElementChild.firstElementChild;
  nameSpan.innerHTML = creature.name;

  let nodeList = element.querySelectorAll(".battle-window-bar-wrapper");

  // Health Bar
  let hpParams = [creature.state.health, creature.maxHealth];
  nodeList[0].querySelector('.bar-text').innerHTML = "%s / %s".format(...hpParams);
  let hpPercent = Math.min(100, Math.max(0, (creature.state.health / (creature.maxHealth || 1)) * 100));
  nodeList[0].querySelector('.health').style.width = hpPercent + "%";

  // Mana Bar
  if (!creature.maxMana || creature.maxMana <= 0) {
    nodeList[1].style.display = "none";
  } else {
    let manaParams = [creature.state.mana || 0, creature.maxMana || 0];
    nodeList[1].querySelector('.bar-text').innerHTML = "%s / %s".format(...manaParams);
    let manaPercent = Math.min(100, Math.max(0, ((creature.state.mana || 0) / (creature.maxMana || 1)) * 100));
    nodeList[1].querySelector('.mana').style.width = manaPercent + "%";
  }

}

BattleWindow.prototype.addCreature = function (creature) {

  /*
   * Function BattleWindow.addCreature
   * Updates the DOM with the targeted creature
   */

  // Check if creature already exists in the list to avoid duplicates
  let existing = this.getBody().querySelector('[id="%s"]'.format(creature.id));
  if (existing) {
    return this.updateCreature(creature);
  }

  //if(creature.type !== 1) return;
  // Create the target node and add
  let node = document.getElementById("battle-window-target").cloneNode(true);
  node.style.display = "flex";
  node.setAttribute("id", creature.id);

  // Create a new canvas
  let canvas = new Canvas(node.lastElementChild.firstElementChild, 32, 32);

  let frames = creature.getCharacterFrames();
  let zPattern = (frames.characterGroup.pattern.z > 1 && creature.isMounted()) ? 1 : 0;

  // Call to draw the character
  canvas.__drawCharacter(
    creature.spriteBuffer,
    creature.spriteBufferMount,
    creature.outfit,
    new Position(1, 1),
    frames.characterGroup,
    frames.mountGroup,
    frames.characterFrame,
    frames.mountFrame,
    CONST.DIRECTION.SOUTH,
    zPattern,
    32,
    0
  );

  let nameSpan = node.firstElementChild.firstElementChild;
  nameSpan.innerHTML = creature.name;

  this.getBody().appendChild(node);

  // Update the stats immediately
  this.updateCreature(creature);

  // BLOCK ALL MOUSE EVENTS IN MOBILE MODE
  // This is critical because Mouse.js listens to mousedown/mouseup on document.body.
  // Since we allow touchstart default (for scroll), the browser acts as a mouse.
  // We must stop these events here so they don't reach the game map.

  function blockMobileMouse(event) {
    if (gameClient.touch && gameClient.touch.isMobileMode) {
      // console.log("Blocking mobile mouse event:", event.type, this.id);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  node.addEventListener("mousedown", blockMobileMouse);
  node.addEventListener("mouseup", blockMobileMouse);

  node.addEventListener("click", function (event) {
    if (gameClient.touch && gameClient.touch.isMobileMode) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    // Check if we have a multi-use item active (crosshair mode for runes)
    if (gameClient.mouse.__multiUseObject !== null) {
      // Use the rune on this creature
      let creatureId = Number(this.id);
      gameClient.send(new ItemUseOnCreaturePacket(gameClient.mouse.__multiUseObject, creatureId));

      // Reset the multi-use item and cursor
      gameClient.mouse.__multiUseObject = null;
      gameClient.mouse.setCursor("auto");
      return;
    }

    // Desktop behavior - normal targeting
    let creature = gameClient.world.getCreature(this.id);
    gameClient.player.setTarget(creature);
    gameClient.send(new TargetPacket(this.id));
  });

  // Mobile support: Custom Tap Handling
  // We cannot just use touchstart with preventDefault because that breaks scrolling.
  // We need to track the touch and fire only if it wasn't a scroll.
  let touchStartX = 0;
  let touchStartY = 0;

  node.addEventListener("touchstart", function (event) {
    if (gameClient.touch && gameClient.touch.isMobileMode) {
      // Don't prevent default here, or we can't scroll!
      // But we must stop propagation if this turns out to be a click later... 
      // Actually, we can't fully stop propagation here if we want scrolling to bubble?
      // No, scrolling happens on this element's container.

      let touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }
  }, { passive: true }); // Passive to allow scrolling

  node.addEventListener("touchend", function (event) {
    if (gameClient.touch && gameClient.touch.isMobileMode) {
      let touch = event.changedTouches[0];
      let dx = Math.abs(touch.clientX - touchStartX);
      let dy = Math.abs(touch.clientY - touchStartY);

      // If moved less than 10 pixels, consider it a tap
      if (dx < 10 && dy < 10) {
        // It's a tap!
        event.preventDefault(); // Prevent mouse compatibility events
        event.stopPropagation();
        event.stopImmediatePropagation();

        let id = Number(this.id);
        let creature = gameClient.world.getCreature(id);

        if (creature) {
          gameClient.player.setTarget(creature);
          gameClient.send(new TargetPacket(id));
        }
      }
    }
  });

}
