const ContainerMenu = function (id) {

    /*
     * Class ContainerMenu
     * Wrapper for the menu that displays on container slots
     */

    // Inherits from menu
    Menu.call(this, id);

    // Store reference to the slot object
    this.slotObject = null;

}

ContainerMenu.prototype = Object.create(Menu.prototype);
ContainerMenu.prototype.constructor = ContainerMenu;

ContainerMenu.prototype.open = function (event, slotObject) {

    /*
     * Function ContainerMenu.open
     * Opens the container menu with the slot object reference
     */

    this.slotObject = slotObject;

    // Call parent open
    return Menu.prototype.open.call(this, event);

}

ContainerMenu.prototype.click = function (event) {

    /*
     * Function ContainerMenu.click
     * Callback fired specially for the ContainerMenu after a button is clicked
     */

    if (this.slotObject === null) {
        return true;
    }

    // Take action depending on the button
    switch (this.__getAction(event)) {
        case "look":
            gameClient.mouse.look(this.slotObject);
            break;
        case "use":
            gameClient.mouse.use(this.slotObject);
            break;
    }

    // Reset slot object reference
    this.slotObject = null;

    // Return true to close the menu after clicking
    return true;

}
