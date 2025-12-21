"use strict";

const BandwidthHandler = function() {

  /*
   * Class BandwidthHandler
   * Handler for keeping statistics on network I/O
   *
   * API:
   *
   * BandwidthHandler.getBandwidth() - returns the current bandwidth usage statistics
   * BandwidthHandler.monitorSocket(socket) - monitors the bandwidth of a socket
   *
   */

  // State parameters to save
  this.__bytesWritten = 0;
  this.__bytesRead = 0;

  this.__bandwidthStartWritten = 0;
  this.__bandwidthStartRead = 0;

}

BandwidthHandler.prototype.monitorSocket = function(socket) {

  /*
   * Function BandwidthHandler.monitorSocket
   * Enables monitoring of the socket by recording the bytes written / read
   */

  // Add total number of bytes read
  socket.on("data", (data) => this.__bytesRead += data.length);
  
  // Add total number of bytes written
  let pointer = socket.write;

  socket.write = function(data) {
    pointer.call(socket, data)
    this.__bytesWritten += data.length;
  }.bind(this);

}

BandwidthHandler.prototype.getBandwidth = function() {

  /*
   * Function BandwidthHandler.getBandwidth
   * Returns the network I/O bandwidth of the HTTP server
   */

  // Calculate bandwidth by taking the difference
  let differenceWritten = (this.__bytesWritten - this.__bandwidthStartWritten);
  this.__bandwidthStartWritten = this.__bytesWritten;

  // Same for read
  let differenceRead = (this.__bytesRead - this.__bandwidthStartRead);
  this.__bandwidthStartRead = this.__bytesRead;

  return new Object({
    "bytesWritten": this.__bytesWritten,
    "bytesRead": this.__bytesRead,
    "bandwidthWritten": differenceWritten,
    "bandwidthRead": differenceRead
  });

}

module.exports = BandwidthHandler;
