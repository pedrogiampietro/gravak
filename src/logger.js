"use strict";

const fs = require("fs");

const ServerLogger = function() {

  /*
   * Class ServerLogger
   * Logs internal server parameters to logfile
   */

  // State to keep average game loop exec time
  this.__gameLoopExecutionTime = 0;
  this.__cpu = process.cpuUsage();
  this.__time = performance.now();

  // Create writeable stream to disk
  if(CONFIG.LOGGING.FILEPATH === "stdout") {
    this.logfile = process.stdout;
  } else {
    this.logfile = fs.createWriteStream(CONFIG.LOGGING.FILEPATH);
  }

  // Write the header
  const HEADER = new Array(
    "Timestamp",
    "Memory (mb)",
    "CPU Usage (%)",
    "Event Heap Size",
    "Event Heap Handled",
    "Clients",
    "Total Bytes In",
    "Total Bytes Out",
    "Bandwidth In (kb/s)",
    "Bandwidth Out (kb/s)",
    "Pathfinding Requests",
    "Pathfinding Iterations",
    "Loop Exec Time (ms)",
    "Drift (ms)",
    "Frame",
    "World Time",
    "Monsters"
  );

  this.writeLine(HEADER);

}

ServerLogger.prototype.writeLine = function(line) {

  /*
   * Function ServerLogger.writeLine
   * Writes an array of parameters to a line delimited by tabs
   */

  this.logfile.write(line.join("\t"));
  this.logfile.write("\n");

}

ServerLogger.prototype.getCPUUsage = function() {

  /*
   * Function ServerLogger.getCPUUsage
   * Determines and returns CPU usage in percent of the process
   */

  let result = (100 * (this.__cpu.user + this.__cpu.system) / (1000 * this.__time));
  this.__cpu = process.cpuUsage(this.__cpu);
  this.__time = performance.now();
  
  return result;

}

ServerLogger.prototype.log = function() {

  /*
   * Function ServerLogger.log
   * Writes server diagnostics to logfile
   */

  let networkDetails = gameServer.HTTPServer.getDataDetails();
  let loopDetails = gameServer.gameLoop.getDataDetails();
  let worldDetails = gameServer.world.getDataDetails();

  let memoryUsage = process.memoryUsage().rss / (1024 * 1024);
  let executionTime = this.__gameLoopExecutionTime / CONFIG.LOGGING.INTERVAL;
  let pathfinding = gameServer.world.lattice.pathfinder.getDataDetails();

  this.__cpu = process.cpuUsage(this.__cpu);

  // Generate a logging message
  let message = new Array(
    new Date().toISOString(),
    memoryUsage.toFixed(0),
    this.getCPUUsage().toFixed(1),
    gameServer.world.eventQueue.heap.size(),
    gameServer.world.eventQueue.getEventsHandled(),
    networkDetails.websocket.sockets,
    networkDetails.bandwidth.bytesRead,
    networkDetails.bandwidth.bytesWritten,
    networkDetails.bandwidth.bandwidthRead,
    networkDetails.bandwidth.bandwidthWritten,
    pathfinding.requests,
    pathfinding.iterations,
    executionTime.toFixed(0),
    loopDetails.drift,
    loopDetails.tick,
    worldDetails.time,
    worldDetails.activeMonsters
  );

  this.writeLine(message);

  // Reset the execution time
  this.__gameLoopExecutionTime = 0;

}

module.exports = ServerLogger;
