const ChatResizer = function () {
    /*
     * Class ChatResizer
     * Handles resizing of the chat window
     */

    this.resizer = document.getElementById("chat-resizer");
    this.lower = document.querySelector(".lower");
    this.lockButton = document.getElementById("chat-lock-resize");

    // State
    this.isResizing = false;
    this.isLocked = false;
    this.startY = 0;
    this.startHeight = 0;

    // Bind events if elements exist
    if (this.resizer && this.lower) {
        this.resizer.addEventListener("mousedown", this.__onMouseDown.bind(this));
        document.addEventListener("mousemove", this.__onMouseMove.bind(this));
        document.addEventListener("mouseup", this.__onMouseUp.bind(this));
    }

    if (this.lockButton) {
        this.lockButton.addEventListener("click", this.__toggleLock.bind(this));
    }
}

ChatResizer.prototype.__toggleLock = function () {
    this.isLocked = !this.isLocked;

    if (this.isLocked) {
        this.lockButton.innerHTML = "lock"; // Locked icon
        this.resizer.style.cursor = "default";
        this.resizer.classList.add("locked");
    } else {
        this.lockButton.innerHTML = "lock_open"; // Unlocked icon
        this.resizer.style.cursor = "ns-resize";
        this.resizer.classList.remove("locked");
    }
}

ChatResizer.prototype.__onMouseDown = function (event) {
    /*
     * Function ChatResizer.__onMouseDown
     * Starts the resize process
     */

    if (this.isLocked) return;

    this.isResizing = true;
    this.startY = event.clientY;
    this.startHeight = this.lower.offsetHeight;

    document.body.style.cursor = "ns-resize";
    this.lower.classList.add("resizing");

    event.preventDefault();
}

ChatResizer.prototype.__onMouseMove = function (event) {
    /*
     * Function ChatResizer.__onMouseMove
     * Calculates new height during drag
     */

    if (!this.isResizing) return;
    if (this.isLocked) return;

    // Dragging UP (negative delta) increases height
    // Dragging DOWN (positive delta) decreases height
    const deltaY = this.startY - event.clientY;
    let newHeight = this.startHeight + deltaY;

    // Limits
    const minHeight = 50;
    const maxHeight = window.innerHeight * 0.8; // Max 80% screen height

    if (newHeight < minHeight) newHeight = minHeight;
    if (newHeight > maxHeight) newHeight = maxHeight;

    this.lower.style.maxHeight = newHeight + "px";
    this.lower.style.height = newHeight + "px";

    // Also force flex-basis to ensure it takes space
    this.lower.style.flex = "0 0 " + newHeight + "px";
}

ChatResizer.prototype.__onMouseUp = function (event) {
    /*
     * Function ChatResizer.__onMouseUp
     * Ends the resize process
     */

    if (this.isResizing) {
        this.isResizing = false;
        document.body.style.cursor = "default";
        this.lower.classList.remove("resizing");

        // Trigger renderer resize if available
        if (window.gameClient && window.gameClient.renderer) {
            // Assuming the renderer handles window resize automatically or needs a trigger
            // window.gameClient.renderer.resize(); 
            // Often resize is handled by window 'resize' event. We can trigger it artificially.
            window.dispatchEvent(new Event('resize'));
        }
    }
}
