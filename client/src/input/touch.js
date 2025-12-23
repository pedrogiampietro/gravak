"use strict";

/**
 * Class Touch
 * Handles all touch input for mobile devices including virtual joystick and action buttons
 */
const Touch = function () {

    // Check if touch is supported
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Mobile mode flag
    this.isMobileMode = false;

    // Joystick state
    this.joystick = {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        direction: null,
        moveInterval: null
    };

    // Action mode (null, 'look', 'use')
    this.actionMode = null;

    // Long press detection
    this.longPressTimer = null;
    this.longPressTriggered = false;

    // Tap detection for double tap
    this.lastTapTime = 0;
    this.lastTapTarget = null;

    // Initialize if on mobile or landscape
    if (this.isTouchDevice || window.innerWidth <= 768 || window.innerHeight <= 500) {
        this.__initialize();
    }

    // Listen for resize to toggle mobile mode
    window.addEventListener('resize', this.__handleResize.bind(this));

}

Touch.prototype.JOYSTICK_DEADZONE = 15;
Touch.prototype.JOYSTICK_MOVE_INTERVAL = 150; // ms between moves
Touch.prototype.LONG_PRESS_DURATION = 500; // ms for long press

Touch.prototype.__initialize = function () {

    /*
     * Function Touch.__initialize
     * Initialize touch controls and event listeners
     */

    this.isMobileMode = true;

    // Get DOM elements
    this.joystickZone = document.getElementById('mobile-joystick-zone');
    this.joystickKnob = document.getElementById('joystick-knob');
    this.virtualJoystick = document.getElementById('virtual-joystick');

    // Action buttons
    this.lookBtn = document.getElementById('mobile-look-btn');
    this.useBtn = document.getElementById('mobile-use-btn');
    this.attackBtn = document.getElementById('mobile-attack-btn');
    this.menuBtn = document.getElementById('mobile-menu-btn');
    this.inventoryBtn = document.getElementById('mobile-inventory-btn');
    this.equipmentBtn = document.getElementById('mobile-equipment-btn');
    this.chatBtn = document.getElementById('mobile-chat-btn');

    // Status bars
    this.healthBar = document.getElementById('mobile-health-bar');
    this.healthText = document.getElementById('mobile-health-text');
    this.manaBar = document.getElementById('mobile-mana-bar');
    this.manaText = document.getElementById('mobile-mana-text');

    // Bind joystick events
    if (this.joystickZone) {
        this.joystickZone.addEventListener('touchstart', this.__handleJoystickStart.bind(this), { passive: false });
        this.joystickZone.addEventListener('touchmove', this.__handleJoystickMove.bind(this), { passive: false });
        this.joystickZone.addEventListener('touchend', this.__handleJoystickEnd.bind(this), { passive: false });
        this.joystickZone.addEventListener('touchcancel', this.__handleJoystickEnd.bind(this), { passive: false });
    }

    // Bind action button events
    if (this.lookBtn) {
        this.lookBtn.addEventListener('touchstart', this.__handleLookButton.bind(this), { passive: false });
    }
    if (this.useBtn) {
        this.useBtn.addEventListener('touchstart', this.__handleUseButton.bind(this), { passive: false });
    }
    if (this.attackBtn) {
        this.attackBtn.addEventListener('touchstart', this.__handleAttackButton.bind(this), { passive: false });
    }
    if (this.menuBtn) {
        this.menuBtn.addEventListener('touchstart', this.__handleMenuButton.bind(this), { passive: false });
    }
    if (this.inventoryBtn) {
        this.inventoryBtn.addEventListener('touchstart', this.__handleInventoryButton.bind(this), { passive: false });
    }
    if (this.equipmentBtn) {
        this.equipmentBtn.addEventListener('touchstart', this.__handleEquipmentButton.bind(this), { passive: false });
    }
    if (this.chatBtn) {
        this.chatBtn.addEventListener('touchstart', this.__handleChatButton.bind(this), { passive: false });
    }

    // Bind hotbar slot events
    this.__bindHotbarSlots();

    // Bind canvas touch events
    this.__bindCanvasTouchEvents();

    // Bind global layout events (slots)
    this.__bindGlobalEvents();

    // Initialize status bars with current player stats if available
    if (typeof gameClient !== 'undefined' && gameClient && gameClient.player) {
        let state = gameClient.player.state;
        this.updateStatusBars(
            state.health || 0,
            state.maxHealth || 1,
            state.mana || 0,
            state.maxMana || 1
        );
    }

    console.log("Touch controls initialized for mobile mode");

}

Touch.prototype.__handleResize = function () {

    /*
     * Function Touch.__handleResize
     * Handle window resize to toggle mobile mode
     */

    // Use height for landscape detection (phones in landscape have low height)
    let shouldBeMobile = window.innerHeight <= 500 || window.innerWidth <= 768;

    if (shouldBeMobile && !this.isMobileMode) {
        this.__initialize();
    } else if (!shouldBeMobile && this.isMobileMode) {
        this.isMobileMode = false;
        this.__cleanup();
    }

}

Touch.prototype.__cleanup = function () {

    /*
     * Function Touch.__cleanup
     * Clean up mobile controls when switching to desktop mode
     */

    if (this.joystick.moveInterval) {
        clearInterval(this.joystick.moveInterval);
        this.joystick.moveInterval = null;
    }

    this.actionMode = null;
    this.__clearActionButtonHighlights();

}

Touch.prototype.__bindCanvasTouchEvents = function () {

    /*
     * Function Touch.__bindCanvasTouchEvents
     * Bind touch events to the game canvas for interaction
     */

    let canvas = document.getElementById('screen');
    if (!canvas) return;

    canvas.addEventListener('touchstart', this.__handleCanvasTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.__handleCanvasTouchEnd.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.__handleCanvasTouchMove.bind(this), { passive: false });

}

Touch.prototype.__handleCanvasTouchStart = function (event) {

    /*
     * Function Touch.__handleCanvasTouchStart
     * Handle touch start on game canvas
     */

    if (!gameClient || !gameClient.networkManager.isConnected()) return;
    if (gameClient.player && gameClient.player.isDead) return;

    event.preventDefault();

    let touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.longPressTriggered = false;

    // Start long press timer for Look action
    this.longPressTimer = setTimeout(() => {
        this.longPressTriggered = true;
        this.__performLookAtTouch(touch);
    }, this.LONG_PRESS_DURATION);

}

Touch.prototype.__handleCanvasTouchMove = function (event) {

    /*
     * Function Touch.__handleCanvasTouchMove
     * Handle touch move on canvas - cancel long press if moved too much
     */

    event.preventDefault();

    let touch = event.touches[0];
    let dx = Math.abs(touch.clientX - this.touchStartX);
    let dy = Math.abs(touch.clientY - this.touchStartY);

    // If moved more than threshold, cancel long press
    if (dx > 10 || dy > 10) {
        this.__cancelLongPress();
    }

}

Touch.prototype.__handleCanvasTouchEnd = function (event) {

    /*
     * Function Touch.__handleCanvasTouchEnd
     * Handle touch end on game canvas
     */

    event.preventDefault();

    this.__cancelLongPress();

    // If long press was triggered, don't do tap action
    if (this.longPressTriggered) {
        this.longPressTriggered = false;
        return;
    }

    let touchDuration = Date.now() - this.touchStartTime;

    // Short tap - perform action based on mode
    if (touchDuration < 300) {
        this.__performTapAction();
    }

}

Touch.prototype.__cancelLongPress = function () {

    if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
    }

}

Touch.prototype.__performTapAction = function () {

    /*
     * Function Touch.__performTapAction
     * Perform action based on current mode (look, use, or walk)
     */

    // Get tile at touch position
    let fakeEvent = {
        clientX: this.touchStartX,
        clientY: this.touchStartY
    };

    let tileObject = gameClient.mouse.getWorldObject(fakeEvent);

    if (!tileObject || !tileObject.which) return;

    switch (this.actionMode) {
        case 'look':
            gameClient.mouse.look(tileObject);
            this.__clearActionMode();
            break;

        case 'use':
            gameClient.mouse.use(tileObject);
            this.__clearActionMode();
            break;

        default:
            // Default: walk to tile
            if (!gameClient.player.isMoving()) {
                let targetTile = gameClient.renderer.screen.getWorldCoordinates(fakeEvent);
                if (targetTile) {
                    gameClient.world.pathfinder.findPath(
                        gameClient.player.__position,
                        targetTile.__position
                    );
                }
            }
            break;
    }

}

Touch.prototype.__performLookAtTouch = function (touch) {

    /*
     * Function Touch.__performLookAtTouch
     * Perform look action at touch position (long press)
     */

    let fakeEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
    };

    let tileObject = gameClient.mouse.getWorldObject(fakeEvent);

    if (tileObject && tileObject.which) {
        gameClient.mouse.look(tileObject);
    }

    // Visual feedback - brief vibration if supported
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }

}

Touch.prototype.__handleJoystickStart = function (event) {

    /*
     * Function Touch.__handleJoystickStart
     * Handle joystick touch start
     */

    event.preventDefault();

    let touch = event.touches[0];
    let rect = this.joystickZone.getBoundingClientRect();

    this.joystick.active = true;
    this.joystick.startX = rect.left + rect.width / 2;
    this.joystick.startY = rect.top + rect.height / 2;
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;

    this.__updateJoystickVisual();

}

Touch.prototype.__handleJoystickMove = function (event) {

    /*
     * Function Touch.__handleJoystickMove
     * Handle joystick touch move
     */

    if (!this.joystick.active) return;

    event.preventDefault();

    let touch = event.touches[0];
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;

    this.__updateJoystickVisual();
    this.__processJoystickInput();

}

Touch.prototype.__handleJoystickEnd = function (event) {

    /*
     * Function Touch.__handleJoystickEnd
     * Handle joystick touch end
     */

    event.preventDefault();

    this.joystick.active = false;
    this.joystick.direction = null;

    // Reset joystick visual
    if (this.joystickKnob) {
        this.joystickKnob.style.transform = 'translate(0, 0)';
    }

    // Stop continuous movement
    if (this.joystick.moveInterval) {
        clearInterval(this.joystick.moveInterval);
        this.joystick.moveInterval = null;
    }

}

Touch.prototype.__updateJoystickVisual = function () {

    /*
     * Function Touch.__updateJoystickVisual
     * Update the visual position of the joystick knob
     */

    if (!this.joystickKnob) return;

    let dx = this.joystick.currentX - this.joystick.startX;
    let dy = this.joystick.currentY - this.joystick.startY;

    // Limit to joystick bounds
    let maxOffset = 30;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxOffset) {
        dx = (dx / distance) * maxOffset;
        dy = (dy / distance) * maxOffset;
    }

    this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

}

Touch.prototype.__processJoystickInput = function () {

    /*
     * Function Touch.__processJoystickInput
     * Process joystick position and move player
     */

    let dx = this.joystick.currentX - this.joystick.startX;
    let dy = this.joystick.currentY - this.joystick.startY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Deadzone check
    if (distance < this.JOYSTICK_DEADZONE) {
        this.joystick.direction = null;
        if (this.joystick.moveInterval) {
            clearInterval(this.joystick.moveInterval);
            this.joystick.moveInterval = null;
        }
        return;
    }

    // Calculate direction (8-directional)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let direction = this.__angleToDirection(angle);

    // Only update if direction changed
    if (direction !== this.joystick.direction) {
        this.joystick.direction = direction;

        // Stop existing interval
        if (this.joystick.moveInterval) {
            clearInterval(this.joystick.moveInterval);
        }

        // Move immediately
        this.__moveInDirection(direction);

        // Start continuous movement
        this.joystick.moveInterval = setInterval(() => {
            if (this.joystick.active && this.joystick.direction) {
                this.__moveInDirection(this.joystick.direction);
            }
        }, this.JOYSTICK_MOVE_INTERVAL);
    }

}

Touch.prototype.__angleToDirection = function (angle) {

    /*
     * Function Touch.__angleToDirection
     * Convert angle to NESW direction
     */

    // Normalize angle to 0-360
    if (angle < 0) angle += 360;

    // 8-directional mapping
    if (angle >= 337.5 || angle < 22.5) return CONST.DIRECTION.EAST;
    if (angle >= 22.5 && angle < 67.5) return CONST.DIRECTION.SOUTHEAST;
    if (angle >= 67.5 && angle < 112.5) return CONST.DIRECTION.SOUTH;
    if (angle >= 112.5 && angle < 157.5) return CONST.DIRECTION.SOUTHWEST;
    if (angle >= 157.5 && angle < 202.5) return CONST.DIRECTION.WEST;
    if (angle >= 202.5 && angle < 247.5) return CONST.DIRECTION.NORTHWEST;
    if (angle >= 247.5 && angle < 292.5) return CONST.DIRECTION.NORTH;
    if (angle >= 292.5 && angle < 337.5) return CONST.DIRECTION.NORTHEAST;

    return null;

}

Touch.prototype.__moveInDirection = function (direction) {

    /*
     * Function Touch.__moveInDirection
     * Move player in the specified direction
     */

    if (!gameClient || !gameClient.networkManager.isConnected()) return;
    if (gameClient.player && gameClient.player.isDead) return;
    if (gameClient.player.isMoving()) return;

    // Use keyboard's move function
    if (gameClient.keyboard) {
        gameClient.keyboard.handleMoveKey(direction);
    }

}

Touch.prototype.__handleLookButton = function (event) {

    /*
     * Function Touch.__handleLookButton
     * Toggle Look mode
     */

    event.preventDefault();

    if (this.actionMode === 'look') {
        this.__clearActionMode();
    } else {
        this.actionMode = 'look';
        this.__updateActionButtonHighlights();
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(30);

}

Touch.prototype.__handleUseButton = function (event) {

    /*
     * Function Touch.__handleUseButton
     * Toggle Use mode
     */

    event.preventDefault();

    if (this.actionMode === 'use') {
        this.__clearActionMode();
    } else {
        this.actionMode = 'use';
        this.__updateActionButtonHighlights();
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(30);

}

Touch.prototype.__handleAttackButton = function (event) {

    /*
     * Function Touch.__handleAttackButton
     * Attack current target
     */

    event.preventDefault();

    if (!gameClient || !gameClient.player) return;

    let target = gameClient.player.getTarget();

    if (target) {
        // Already have a target - attack it
        gameClient.send(new TargetPacket(target.getId()));
    } else {
        // No target - maybe show message
        gameClient.interface.setCancelMessage("Select a target first.");
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(50);

}

Touch.prototype.__handleMenuButton = function (event) {

    /*
     * Function Touch.__handleMenuButton
     * Open mobile menu / settings
     */

    event.preventDefault();

    // Check if modal is already open, close it if so
    if (gameClient.interface.modalManager.isOpened()) {
        gameClient.interface.modalManager.close();
    } else {
        // Open settings modal
        gameClient.interface.modalManager.open("settings-modal");
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(30);

}

Touch.prototype.__clearActionMode = function () {

    this.actionMode = null;
    this.__clearActionButtonHighlights();

}

Touch.prototype.__updateActionButtonHighlights = function () {

    /*
     * Function Touch.__updateActionButtonHighlights
     * Update button visual state based on current mode
     */

    this.__clearActionButtonHighlights();

    if (this.actionMode === 'look' && this.lookBtn) {
        this.lookBtn.style.boxShadow = '0 0 10px 3px #4444ff';
    } else if (this.actionMode === 'use' && this.useBtn) {
        this.useBtn.style.boxShadow = '0 0 10px 3px #44ff44';
    }

}

Touch.prototype.__clearActionButtonHighlights = function () {

    if (this.lookBtn) this.lookBtn.style.boxShadow = '';
    if (this.useBtn) this.useBtn.style.boxShadow = '';

}

Touch.prototype.updateStatusBars = function (health, healthMax, mana, manaMax) {

    /*
     * Function Touch.updateStatusBars
     * Update mobile status bars with current HP/MP values
     */

    if (!this.isMobileMode) return;

    if (this.healthBar && healthMax > 0) {
        let healthPercent = Math.min(100, (health / healthMax) * 100);
        this.healthBar.style.width = healthPercent + '%';
    }

    if (this.healthText) {
        this.healthText.textContent = health + ' / ' + healthMax;
    }

    if (this.manaBar && manaMax > 0) {
        let manaPercent = Math.min(100, (mana / manaMax) * 100);
        this.manaBar.style.width = manaPercent + '%';
    }

    if (this.manaText) {
        this.manaText.textContent = mana + ' / ' + manaMax;
    }

}

Touch.prototype.__handleInventoryButton = function (event) {

    /*
     * Function Touch.__handleInventoryButton
     * Open inventory / equipment window
     */

    event.preventDefault();

    if (!gameClient || !gameClient.player) return;

    // Try to open the first container (backpack) or equipment window
    let containers = Array.from(gameClient.player.__openedContainers || []);

    if (containers.length > 0) {
        // Toggle visibility of existing containers
        containers.forEach(container => {
            if (container.window) {
                let display = container.window.style.display;
                container.window.style.display = (display === 'none') ? 'block' : 'none';
            }
        });
    } else {
        // Show a message that no containers are open
        gameClient.interface.setCancelMessage("No backpack open. Use a backpack first.");
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(30);

}

Touch.prototype.__handleEquipmentButton = function (event) {

    /*
     * Function Touch.__handleEquipmentButton
     * Toggle equipment panel visibility
     */

    event.preventDefault();

    if (!gameClient || !gameClient.player || !gameClient.player.equipment) return;

    // Toggle equipment panel visibility
    let equipmentElement = gameClient.player.equipment.element;

    if (equipmentElement) {
        let currentDisplay = equipmentElement.style.display;
        equipmentElement.style.display = (currentDisplay === 'none') ? 'block' : 'none';
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(30);

}

Touch.prototype.__handleChatButton = function (event) {

    /*
     * Function Touch.__handleChatButton
     * Toggle chat panel visibility
     */

    event.preventDefault();

    // Find the chat container (.lower)
    let chatContainer = document.querySelector('#game-wrapper .main .lower');

    if (chatContainer) {
        // Toggle the mobile-chat-active class
        chatContainer.classList.toggle('mobile-chat-active');

        // If chat is now active, focus the input
        if (chatContainer.classList.contains('mobile-chat-active')) {
            let chatInput = document.getElementById('chat-input');
            if (chatInput) {
                // Small delay to ensure DOM is ready
                setTimeout(() => chatInput.focus(), 100);
            }
        }
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(30);

}

Touch.prototype.__bindHotbarSlots = function () {

    /*
     * Function Touch.__bindHotbarSlots
     * Bind touch events to mobile hotbar slots
     */

    let slots = document.querySelectorAll('.mobile-hotbar-slot');

    slots.forEach((slot, index) => {
        slot.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.__handleHotbarSlotTap(index);
        }, { passive: false });
    });

}

Touch.prototype.__handleHotbarSlotTap = function (slotIndex) {

    /*
     * Function Touch.__handleHotbarSlotTap
     * Handle tap on mobile hotbar slot - trigger corresponding F-key action
     */

    if (!gameClient || !gameClient.interface) return;

    // Map slot index (0-3) to F1-F4 keys (112-115)
    let fKeyCode = 112 + slotIndex;

    // Use the hotbar manager to handle the key press
    if (gameClient.interface.hotbarManager) {
        gameClient.interface.hotbarManager.handleKeyPress(fKeyCode);
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(20);

}

Touch.prototype.syncMobileHotbar = function () {

    /*
     * Function Touch.syncMobileHotbar
     * Sync mobile hotbar slots with desktop hotbar icons
     */

    if (!this.isMobileMode) return;
    if (!gameClient || !gameClient.interface || !gameClient.interface.hotbarManager) return;

    let desktopSlots = gameClient.interface.hotbarManager.slots;
    let mobileSlots = document.querySelectorAll('.mobile-hotbar-slot');
    let icons = gameClient.interface.hotbarManager.ICONS;

    // Only sync first 4 slots (F1-F4)
    mobileSlots.forEach((mobileSlot, index) => {
        if (index >= desktopSlots.length) return;

        let desktopSlot = desktopSlots[index];
        let canvas = mobileSlot.querySelector('canvas');

        if (!canvas) return;

        let ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = 32;
        canvas.height = 32;

        // Clear canvas
        ctx.clearRect(0, 0, 32, 32);

        // Draw spell icon if available
        if (desktopSlot.spell) {
            ctx.drawImage(
                icons,
                32 * desktopSlot.spell.icon.x,
                32 * desktopSlot.spell.icon.y,
                32, 32,
                0, 0,
                32, 32
            );
        } else if (desktopSlot.text) {
            // Draw text slot indicator
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, 32, 32);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TXT', 16, 16);
        }
    });

}

Touch.prototype.__bindGlobalEvents = function () {

    /*
     * Function Touch.__bindGlobalEvents
     * Binds global touch start across the document to detect slot interactions
     */

    document.body.addEventListener('touchstart', this.__handleGlobalTouchStart.bind(this), { passive: false });

}

Touch.prototype.__handleGlobalTouchStart = function (event) {

    /*
     * Function Touch.__handleGlobalTouchStart
     * Handles global touch events to detect double tap on slots
     */

    if (!this.isMobileMode) return;

    // Use the first changed touch
    let touch = event.changedTouches[0];

    // Find the element at the touch coordinates
    let element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (!element) return;

    // Check if we touched a slot or inside a slot
    let slotElement = element.closest('.slot');

    if (slotElement) {

        let currentTime = new Date().getTime();
        let tapLength = currentTime - this.lastTapTime;

        // Double tap detection (< 300ms)
        if (tapLength < 300 && tapLength > 0 && this.lastTapTarget === slotElement) {

            // Successfully detected double tap on same slot
            event.preventDefault();
            this.__handleSlotDoubleTap(slotElement);

            // Access granted, reset tap time
            this.lastTapTime = 0;

        } else {

            // First tap
            this.lastTapTime = currentTime;
            this.lastTapTarget = slotElement;

        }

    } else {
        // Tapped outside a slot, reset
        this.lastTapTime = 0;
        this.lastTapTarget = null;
    }

}

Touch.prototype.__handleSlotDoubleTap = function (slotElement) {

    /*
     * Function Touch.__handleSlotDoubleTap
     * Handles double tap on a slot -> Simulates "Use"
     */

    let slotObject = this.__getSlotObject(slotElement);

    if (slotObject && slotObject.which) {
        // Feedback
        if (navigator.vibrate) navigator.vibrate(50);

        // Use the item (Open backpack, use consumable, etc)
        // Delegating to Mouse 'use' logic if available or directly sending packet
        if (gameClient.mouse && gameClient.mouse.use) {
            gameClient.mouse.use(slotObject);
        }
    }

}

Touch.prototype.__getSlotObject = function (element) {

    /*
     * Function Touch.__getSlotObject
     * Resolves a DOM element to a game object (Container or Equipment slot)
     * Ported logic from Mouse.__getSlotObject
     */

    if (!element) return null;

    let slotIndex, containerIndex;

    // Check if body-style (equipment usually has specific structure)
    if (element.className === "body") {
        slotIndex = 0;
        containerIndex = Number(element.parentElement.getAttribute("containerIndex"));
    } else {
        // Regular slot
        if (element.getAttribute("slotIndex")) {
            slotIndex = Number(element.getAttribute("slotIndex"));
        } else {
            return null;
        }

        // Find container index (parent of parent usually)
        if (element.parentElement && element.parentElement.parentElement) {
            containerIndex = Number(element.parentElement.parentElement.getAttribute("containerIndex"));
        } else {
            containerIndex = Number(element.parentElement.getAttribute("containerIndex"));
        }
    }

    if (isNaN(slotIndex) || isNaN(containerIndex)) return null;

    // Fetch the container from the player
    let container = gameClient.player.getContainer(containerIndex);

    if (!container) return null;

    return new Object({
        "which": container,
        "index": slotIndex
    });

}
