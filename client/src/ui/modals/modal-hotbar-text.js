"use strict";

const HotbarTextModal = function (element) {

    /*
     * Class HotbarTextModal
     * Wrapper for the modal that allows adding custom text to hotbar slots
     */

    // Inherit from modal
    Modal.call(this, element);

    this.__input = document.getElementById("hotbar-text-input");
    this.__index = 0;

}

HotbarTextModal.prototype = Object.create(Modal.prototype);
HotbarTextModal.constructor = HotbarTextModal;

HotbarTextModal.prototype.handleOpen = function (index) {

    /*
     * Function HotbarTextModal.handleOpen
     * Callback fired when the hotbar text modal is opened
     */

    this.__index = index;
    this.__input.value = "";

    // Focus the input field after a small delay to ensure modal is visible
    setTimeout(() => {
        this.__input.focus();
    }, 100);

}

HotbarTextModal.prototype.__internalButtonClick = function (target) {

    /*
     * Function HotbarTextModal.__internalButtonClick
     * Handles action when an action button is clicked
     */

    let action = target.getAttribute("action");

    if (action === "cancel") {
        return true;
    }

    if (action === "confirm-text") {
        let text = this.__input.value.trim();

        if (text.length === 0) {
            return false;
        }

        // Add the text slot to the hotbar
        gameClient.interface.hotbarManager.addTextSlot(this.__index, text);
        return true;
    }

    return false;
}
