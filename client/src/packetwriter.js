const PacketWriter = function(opcode, length) {

  /*
   * Class PacketWriter
   * Writes bytes to a packet
   */

  if(opcode === undefined) {
    throw(console.trace());
  }

  // Inherits from a generic packet
  Packet.call(this);

  // Create a packet of the right size
  this.buffer = new Uint8Array(1 + length);

  // Write the opcode
  this.writeUInt8(opcode);

}

PacketWriter.prototype = Object.create(Packet.prototype);
PacketWriter.prototype.constructor = PacketWriter;

PacketWriter.prototype.__writeGenericMove = function(object) {

  /*
   * Function PacketWriter.__writeGenericMove
   * Generic packet to write a specific location (position, container) and index
   */
  
  // Difference writing position or container: unpacked on the server side
  if(object.which.constructor.name === "Tile") {
    this.writeUInt8(1);
    this.writePosition(object.which.getPosition());
  } else {
    this.writeUInt8(0);
    this.writeUInt16(0);
    this.writeUInt32(object.which.__containerId);
  }

  this.writeUInt8(object.index);

}

PacketWriter.prototype.getBuffer = function() {

  /*
   * Function PacketWriter.getBuffer
   * Returns the buffer that has been written
   */

  // Completely full
  if(this.index === this.buffer.length) {
    return this.buffer;
  }
  
  // Only return the written part
  return this.buffer.subarray(0, this.index);

}

PacketWriter.prototype.encodeString = function(string) {

  /*
   * Function PacketWriter.encodeString
   * Encodes the string to UTF-8 and creates a buffer from it
   */

  // Truncate
  if(string.length > 0xFF) {
    string = string.substring(0, 0xFF);
  }

  let stringEncoded = new TextEncoder("utf-8").encode(string);
  let stringLength = stringEncoded.length + 1;

  return { stringEncoded, stringLength }

}

PacketWriter.prototype.writeBuffer = function(buffer) {
    
  /*
   * Function PacketWriter.writeString
   * Writes a string of variable length to the packet
   */

  // Write the length of the string and the bytes
  this.writeUInt8(buffer.length);
  this.set(buffer);

}

PacketWriter.prototype.set = function(buffer) {

  /*
   * Function PacketWriter.set
   * Writes a full buffer to the internal buffer
   */

  this.buffer.set(buffer, this.index);
  this.advance(buffer.length)

} 

PacketWriter.prototype.writeUInt8 = function(value) {

  /*
   * Function PacketWriter.writeUInt8
   * Writes an unsigned 1 byte integer to the packet
   */

  this.buffer[this.index++] = value;

}

PacketWriter.prototype.writeUInt16 = function(value) {

  /*
   * Function PacketWriter.writeUInt16
   * Writes an unsigned 2 byte integer to the packet
   */

  this.buffer[this.index++] = value;
  this.buffer[this.index++] = value >> 8;

}

PacketWriter.prototype.writeUInt32 = function(value) {

  /*
   * Function PacketWriter.writeUInt32
   * Writes an unsigned 4 byte integer to the packet
   */

  this.buffer[this.index++] = value;
  this.buffer[this.index++] = value >> 8;
  this.buffer[this.index++] = value >> 16;
  this.buffer[this.index++] = value >> 24;

}

PacketWriter.prototype.writeBoolean = function(value) {
  
  /*
   * Function PacketWriter.writeBoolean
   * Writes a boolean as an uint8 (1 = true, 0 = false)
   */

  this.writeUInt8(value ? 1 : 0);

} 

PacketWriter.prototype.writePosition = function(position) {

  /*
   * Function PacketWriter.writePosition
   * Writes a position to a buffer
   */

  this.writeUInt16(position.x);
  this.writeUInt16(position.y);
  this.writeUInt16(position.z);

}
