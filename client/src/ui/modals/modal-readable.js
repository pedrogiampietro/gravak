const ReadableModal = function (id) {

  Modal.call(this, id);

  // Store the current item being edited
  this.__currentItemId = null;
  this.__isWriteable = false;

}

ReadableModal.prototype = Object.create(Modal.prototype);
ReadableModal.constructor = ReadableModal;

ReadableModal.prototype.handleOpen = function (packet) {

  let textarea = document.getElementById("book-text-area");
  let saveButton = document.getElementById("book-save-button");

  textarea.value = packet.content;
  textarea.disabled = !packet.writeable;

  // Store item info for saving
  this.__currentItemId = packet.itemId;
  this.__isWriteable = packet.writeable;

  // Show/hide save button based on writeable status
  saveButton.style.display = packet.writeable ? "inline-block" : "none";

  this.setTitle(packet.name);

  // Focus the textarea if writeable
  if (packet.writeable) {
    setTimeout(() => textarea.focus(), 100);
  }

}

ReadableModal.prototype.handleConfirm = function () {

  /*
   * Function ReadableModal.handleConfirm
   * Called when Save button is clicked - sends the text content to server
   */

  if (!this.__isWriteable || !this.__currentItemId) {
    return true;
  }

  let content = document.getElementById("book-text-area").value;

  // Send the text content to the server
  gameClient.send(new WriteTextPacket(this.__currentItemId, content));

  return true;

}