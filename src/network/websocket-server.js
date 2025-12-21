"use strict";

const GameSocket = requireModule("network/gamesocket");
const WebsocketSocketHandler = requireModule("network/websocket-server-socket-handler");
const AccountDatabase = requireModule("auth/account-database");

const { Server } = require("ws");

const WebsocketServer = function () {
  /*
   *
   * Class WebsocketServer
   *
   * Container for the websocket server that accepts incoming HTTP connections
   * and upgrades them to websocket connections
   *
   */

  // Create the websocket server
  this.websocket = new Server({
    noServer: true,
    perMessageDeflate: this.__getCompressionConfiguration(),
  });

  // Reference the database
  this.accountDatabase = new AccountDatabase();

  // The handler for sockets
  this.socketHandler = new WebsocketSocketHandler();

  // The main websocket server listener
  this.websocket.on("connection", this.__handleConnection.bind(this));
  this.websocket.on("close", this.__handleClose.bind(this));
};

WebsocketServer.prototype.getDataDetails = function () {
  /*
   * Function WebsocketServer.getDataDetails
   * Returns data details of the websocket server
   */

  // Expose this information
  return new Object({
    sockets: this.socketHandler.getTotalConnectedSockets(),
  });
};

WebsocketServer.prototype.upgrade = function (
  request,
  socket,
  head,
  accountName
) {
  /*
   * Function WebsocketServer.upgrade
   * Upgrades an accepted HTTP connection to WS
   */

  console.log(
    "Attempting to upgrading request from %s to WS.".format(socket.id)
  );

  // Otherwise handle the upgrade with the submitted account information
  this.websocket.handleUpgrade(
    request,
    socket,
    head,
    function upgradeWebsocket(websocket) {
      console.log("Upgrade succesful for socket with id %s.".format(socket.id));

      // Tell the websocket server the connection upgrade is succesful
      this.websocket.emit("connection", websocket, request, accountName);
    }.bind(this)
  );
};

WebsocketServer.prototype.close = function () {
  /*
   * Function WebsocketServer.close
   * Call to the web socket server to close it
   */

  console.log("The websocket server has started to close.");

  // Terminate all remaining socket connections
  this.socketHandler.disconnectClients();

  // Close the websocket server after all clients were forcefully terminated
  this.websocket.close();
};

WebsocketServer.prototype.__handleClose = function () {
  /*
   * Function WebsocketServer.__handleClose
   * Callback fired when the websocket server is closed
   */

  console.log("The websocket server has closed.");

  // The database may be closed
  this.accountDatabase.close();
};

WebsocketServer.prototype.__handleConnection = function (
  socket,
  request,
  accountName
) {
  /*
   * Function WebsocketServer.__handleConnection
   * Handles an incoming websocket connection that was upgraded from HTTP with a valid token
   */

  // Create a new class that wraps the connected socket
  let gameSocket = new GameSocket(socket, accountName);

  // The server is full
  if (this.socketHandler.isOverpopulated()) {
    return gameSocket.closeError(
      "The server is currently overpopulated. Please try again later."
    );
  }

  // Server is in the process of shutting down: do not accept any new connections
  if (gameServer.isShutdown()) {
    return gameSocket.closeError(
      "The server is going offline. Please try again later."
    );
  }

  // The socket can be accepted
  this.__acceptConnection(gameSocket, accountName);
};

WebsocketServer.prototype.__acceptConnection = function (
  gameSocket,
  accountName
) {
  /*
   * Function WebsocketServer.__acceptConnection
   * Accepts the connection of the websocket
   */

  // Get the socket address
  let { address, family, port } = gameSocket.getAddress();

  console.log("A client joined the server: %s.".format(address));

  // Attach the socket listeners for socket closure
  gameSocket.socket.on(
    "close",
    this.__handleSocketClose.bind(this, gameSocket)
  );

  // Try logging in to a character
  this.__handleLoginRequest(gameSocket, accountName);
};

WebsocketServer.prototype.__handleLoginRequest = function (
  gameSocket,
  accountName
) {
  /*
   * Function WebsocketServer.__handleLoginRequest
   * Handles a login request from a socket
   */

  this.accountDatabase.getCharacter(
    accountName,
    function getPlayerAccount(error, result) {
      // There was an error getting the player account
      if (error) {
        return gameSocket.terminate();
      }

      // Parse the character data - handle double-escaped JSON
      let character = result.character;

      // If it's a string, parse it
      if (typeof character === "string") {
        character = JSON.parse(character);
      }

      // If it's still a string (double-escaped), parse again
      if (typeof character === "string") {
        character = JSON.parse(character);
      }

      // DEBUG: Log what was loaded from PostgreSQL
      console.log("[DEBUG] Loaded character from PostgreSQL:", accountName);
      console.log("[DEBUG] Health:", character.properties?.health);
      console.log("[DEBUG] MaxHealth:", character.properties?.maxHealth);

      // Fallback: ensure name exists in properties (fixes corrupted data from previous saves)
      if (!character.properties.name) {
        character.properties.name = accountName;
      }

      // Accept the gamesocket
      this.__acceptCharacterConnection(gameSocket, character);
    }.bind(this)
  );
};

WebsocketServer.prototype.__getCompressionConfiguration = function () {
  /*
   * Function WebsocketServer.__getCompressionConfiguration
   * Returns the compression options for zlib used in ws
   */

  // Compression is disabled
  if (!CONFIG.SERVER.COMPRESSION.ENABLED) {
    return false;
  }

  // Compression options: level 1 is sufficient to reach ~85% percent compression for chunks
  return new Object({
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    threshold: CONFIG.SERVER.COMPRESSION.THRESHOLD,
    zlibDeflateOptions: {
      level: CONFIG.SERVER.COMPRESSION.LEVEL,
    },
  });
};

WebsocketServer.prototype.__acceptCharacterConnection = function (
  gameSocket,
  data
) {
  /*
   * Function WebsocketServer.__acceptConnection
   * Handles a login request from a socket
   */

  // Save a reference to the game socket
  this.socketHandler.referenceSocket(gameSocket);

  // Attempt to get the player again in case of a race condition
  let existingPlayer = gameServer.world.creatureHandler.getPlayerByName(
    data.properties.name
  );

  // Not existing in the world: create a new player
  if (existingPlayer === null) {
    return gameServer.world.creatureHandler.createNewPlayer(gameSocket, data);
  }

  // What to do when this player is already online
  switch (CONFIG.SERVER.ON_ALREADY_ONLINE) {
    case "replace":
      return existingPlayer.socketHandler.attachController(gameSocket);
    case "spectate":
      return existingPlayer.socketHandler.addSpectator(gameSocket);
  }

  // Default behavior is closing the new socket
  return gameSocket.closeError("This character is already online.");
};

WebsocketServer.prototype.__handleSocketClose = function (gameSocket) {
  /*
   * Function WebsocketServer.__handleSocketClose
   * Closes a game socket and removes the player from the game world
   */

  console.log("A client has left the server: %s.".format(gameSocket.__address));

  // Dereference from the list of gamesockets
  this.socketHandler.dereferenceSocket(gameSocket);

  // Socket closed without being referenced to a player (e.g., spectating)
  if (gameSocket.player === null) {
    return;
  }

  // If the player is not in combat we can immediately remove the player
  if (!gameSocket.player.isInCombat() || gameServer.isClosed()) {
    return this.__removePlayer(gameSocket);
  }

  let logoutEvent = gameServer.world.eventQueue.addEvent(
    this.__removePlayer.bind(this, gameSocket),
    gameSocket.player.combatLock.remainingFrames()
  );

  return gameSocket.player.socketHandler.setLogoutEvent(logoutEvent);
};

WebsocketServer.prototype.__removePlayer = function (gameSocket) {
  /*
   * WebsocketServer.__removePlayer
   * Removes a player from the game world and stored its informaton in the database
   */

  try {
    // Make sure player exists and has valid properties
    if (!gameSocket.player) {
      console.log("No player found in gameSocket during removal");
      return;
    }

    console.log("=== REMOVING PLAYER ===");
    console.log(
      `Player name: ${gameSocket.player.getProperty(CONST.PROPERTIES.NAME)}`
    );

    // Sync properties before removing from world
    gameSocket.player.syncProperties();

    // Delete the player from the world
    gameServer.world.creatureHandler.removePlayerFromWorld(gameSocket);

    // Save the character information to the database
    this.accountDatabase.saveCharacter(gameSocket, function (error) {
      if (error) {
        console.log(
          "Error storing player information for %s: %s".format(
            gameSocket.player.getProperty(CONST.PROPERTIES.NAME),
            error
          )
        );
        return;
      }
      console.log(
        "Successfully stored player information for %s".format(
          gameSocket.player.getProperty(CONST.PROPERTIES.NAME)
        )
      );
    });
  } catch (error) {
    console.error("Error in __removePlayer:", error);
  }
};

module.exports = WebsocketServer;
