const NetworkManager = function() {

  /*
   * Class NetworkManager
   * Handles networking over the websocket
   */

  // Internal class state
  this.state = new State();
  this.state.add("bytesRecv", null);
  this.state.add("bytesSent", null);
  this.state.add("latency", null);
  this.state.add("nPackets", null);
  this.state.add("connected", null);

  this.nPacketsSent = 0;

  // The handler for all incoming packets
  this.packetHandler = new PacketHandler();

}

NetworkManager.prototype.close = function() {

  /*
   * Class NetworkManager.close
   * Closes the socket to the gameserver
   */

  return this.socket.close();

}

NetworkManager.prototype.isConnected = function() {

  /*
   * Class NetworkManager.isConnected
   * Returns true if the network manager is connected to the gameserver
   */

  return this.state.connected;

}

NetworkManager.prototype.readPacket = function(packet) {

  /*
   * Class NetworkManager.readPacket
   * Reads a packet received from the gameserver
   */

  this.state.nPackets++;

  // What operation the server sends is the first byte
  switch(packet.readUInt8()) {
  
    case CONST.PROTOCOL.SERVER.SPELL_ADD: {
      return gameClient.interface.updateSpells(packet.readUInt16());
    }

    case CONST.PROTOCOL.SERVER.PLAYER_STATISTICS: {
      return this.packetHandler.handlePlayerStatistics(packet.readCharacterStatistics());
    }

    // NPC trade offers are received
    case CONST.PROTOCOL.SERVER.TRADE_OFFER: {
      return this.packetHandler.handleTradeOffer(packet.readTradeOffer());
    }

    // A remove friend is requested
    case CONST.PROTOCOL.SERVER.REMOVE_FRIEND: {
      return this.packetHandler.handleRemoveFriend(packet.readString());
    }
  
    case CONST.PROTOCOL.SERVER.ITEM_TRANSFORM: {
      return this.packetHandler.handleTransformTile(packet.readTransformTile());
    }
  
    case CONST.PROTOCOL.SERVER.MESSAGE_CANCEL: {
      return this.packetHandler.handleCancelMessage(packet.readString());
    }
  
    case CONST.PROTOCOL.SERVER.ITEM_INFORMATION: {
      return this.packetHandler.handleItemInformation(packet.readItemInformation());
    }
  
    case CONST.PROTOCOL.SERVER.TARGET: {
      return this.packetHandler.handleSetTarget(packet.readUInt32());
    }

    case CONST.PROTOCOL.SERVER.OUTFIT: {
      return this.packetHandler.handleChangeOutfit(packet.readChangeOutfit());
    }
  
    case CONST.PROTOCOL.SERVER.ITEM_TEXT: {
      return this.packetHandler.handleReadText(packet.readReadable());
    }
  
    case CONST.PROTOCOL.SERVER.STATE_SERVER: {
      return this.packetHandler.handleServerData(packet);
    }
  
    case CONST.PROTOCOL.SERVER.CHANNEL_JOIN: {
      return this.packetHandler.handleOpenChannel(packet.readOpenChannel());
    }
  
    case CONST.PROTOCOL.SERVER.COMBAT_LOCK: {
      return this.packetHandler.handleCombatLock(packet.readBoolean());
    }

    case CONST.PROTOCOL.SERVER.MAGIC_EFFECT: {
      return this.packetHandler.handleSendMagicEffect(packet.readMagicEffect());
    }
  
    case CONST.PROTOCOL.SERVER.DISTANCE_EFFECT: {
      return this.packetHandler.handleSendDistanceEffect(packet.readDistanceEffect());
    }
  
    case CONST.PROTOCOL.SERVER.CONTAINER_REMOVE: {
      return this.packetHandler.handleContainerItemRemove(packet.readContainerItemRemove());
    }
  
    case CONST.PROTOCOL.SERVER.CREATURE_STATE: {
      return this.packetHandler.handleEntityReference(packet.readCreatureInfo());
    }
  
    case CONST.PROTOCOL.SERVER.CREATURE_INFORMATION: {
      return this.packetHandler.handleCharacterInformation(packet.readCharacterInformation());
    }
  
    case CONST.PROTOCOL.SERVER.CONTAINER_CLOSE: {
      return this.packetHandler.handleContainerClose(packet.readUInt32());
    }
  
    case CONST.PROTOCOL.SERVER.LATENCY: {
     return this.packetHandler.handleLatency();
    }
  
    case CONST.PROTOCOL.SERVER.CREATURE_MOVE: {
      return this.packetHandler.handleCreatureServerMove(packet.readEntityMove());
    }
  
    case CONST.PROTOCOL.SERVER.ITEM_ADD: {
      return this.packetHandler.handleItemAdd(packet.readTileItemAdd());
    }
  
    case CONST.PROTOCOL.SERVER.CONTAINER_OPEN: {
      return this.packetHandler.handleContainerOpen(packet.readOpenContainer());
    }
  
    case CONST.PROTOCOL.SERVER.CONTAINER_ADD: {
      return this.packetHandler.handleContainerAddItem(packet.readContainerItemAdd());
    }
  
    case CONST.PROTOCOL.SERVER.STATE_PLAYER: {
      return this.packetHandler.handleAcceptLogin(packet.readPlayerInfo());
    }
  
    case CONST.PROTOCOL.SERVER.ITEM_REMOVE: {
      return this.packetHandler.handleRemoveItem(packet.readRemoveItem());
    }
  
    case CONST.PROTOCOL.SERVER.SPELL_CAST: {
      return gameClient.player.spellbook.serverCastSpell(packet.readCastSpell());
    }

    case CONST.PROTOCOL.SERVER.CHUNK: {
      return this.packetHandler.handleChunk(packet.readChunkData());
    }
  
    case CONST.PROTOCOL.SERVER.SERVER_ERROR: {
      return this.packetHandler.handleServerError(packet.readString());
    }

    case CONST.PROTOCOL.SERVER.MESSAGE_SERVER: {
      return this.packetHandler.handleServerMessage(packet.readString());
    }
  
    case CONST.PROTOCOL.SERVER.CREATURE_REMOVE: {
      return this.packetHandler.handleEntityRemove(packet.readUInt32());
    }
  
    case CONST.PROTOCOL.SERVER.CREATURE_TELEPORT: {
      return this.packetHandler.handleEntityTeleport(packet.readCreatureTeleport());
    }
  
    case CONST.PROTOCOL.SERVER.MESSAGE_PRIVATE: {
      return this.packetHandler.handleReceivePrivateMessage(packet.readPrivateMessage());
    }
  
    case CONST.PROTOCOL.SERVER.PLAYER_LOGIN: {
      return this.packetHandler.handlePlayerConnect(packet.readString());
    }
  
    case CONST.PROTOCOL.SERVER.PLAYER_LOGOUT: {
      return this.packetHandler.handlePlayerDisconnect(packet.readString());
    }
  
    case CONST.PROTOCOL.SERVER.WORLD_TIME: {
      return this.packetHandler.handleWorldTime(packet.readUInt32());
    }

    case CONST.PROTOCOL.SERVER.CREATURE_MESSAGE: {
      return this.packetHandler.handleChannelMessage(packet.readChannelMessage());
    }
  
    case CONST.PROTOCOL.SERVER.TOGGLE_CONDITION: {
      return this.packetHandler.handleCondition(packet.readToggleCondition());
    }

    case CONST.PROTOCOL.SERVER.EMOTE: {
      return this.packetHandler.handleEmote(packet.readDefaultMessage());
    }

    case CONST.PROTOCOL.SERVER.CREATURE_SAY: {
      return this.packetHandler.handleDefaultMessage(packet.readDefaultMessage());
    }

    case CONST.PROTOCOL.SERVER.CREATURE_PROPERTY: {
      return this.packetHandler.handlePropertyChange(packet.readProperty());
    }
  
    default:
      throw("An unknown packet was received from the server.");
  
  }

}

NetworkManager.prototype.send = function(packet) {

  /*
   * Function NetworkManager.send
   * Writes a packet to the gameserver
   */

  // Not connected to the gameserver
  if(!this.isConnected()) {
    return;
  }

  buffer = packet.getBuffer();

  // Save some state
  this.state.bytesSent += buffer.length;
  this.nPacketsSent++;

  // Just write the buffer over the websocket
  this.socket.send(buffer);

}

NetworkManager.prototype.getLatency = function() {

  /*
   * Function NetworkManager.pingServer
   * Pings the game server with a stay-alive message
   */

  // Save the ping timing and write the packet
  this.__latency = performance.now();

  this.send(new LatencyPacket());

}

NetworkManager.prototype.getConnectionString = function(response) {

  /*
   * Function NetworkManager.getConnectionString
   * Returns the connection string from the protocol, host, and port
   */

  return "%s?token=%s".format(response.host, response.token);

}

NetworkManager.prototype.getConnectionSettings = function() {

  /*
   * Function NetworkManager.getConnectionSettings
   * Returns the configured connection settings from the DOM
   */

  return document.getElementById("host").value;

}

NetworkManager.prototype.createAccount = function(options) {

  /*
   * Function NetworkManager.connect
   * Connects to the server websocket at the remote host and port
   */

  let host = this.getConnectionSettings();

  let url = "%s//%s/?account=%s&password=%s&name=%s&sex=%s".format(location.protocol, host, options.account, options.password, options.name, options.sex);

  // Make a post request
  fetch(url, {"method": "POST"}).then(function(response) {

    switch(response.status) {
      case 201: break;
      case 400: throw("Malformed account creation request.");
      case 409: throw("An account or character with this name already exists.");
      case 500: throw("The server experienced an internal error.");
    }

    // Update the DOM with the newly created accounted
    document.getElementById("user-username").value = options.account;
    document.getElementById("user-password").value = options.password;

    gameClient.interface.modalManager.open("floater-connecting", "The account and character have been created.")

  }).catch(x => gameClient.interface.modalManager.open("floater-connecting", x));

}

NetworkManager.prototype.fetchCallback = function(response) {

  /*
   * Function NetworkManager.fetchCallback
   * Callback to fire for fetch requests: check HTTP Status Code
   */

  if(response.status !== 200) {
    return Promise.reject(response);
  }

  return Promise.resolve(response.arrayBuffer());

}

NetworkManager.prototype.loadGameFilesServer = function() {

  /*
   * Function NetworkManager.loadGameFilesServer
   * Connects to the server websocket at the remote host and port
   */

  // The resource to load from the server
  let resources = new Array("Tibia.spr", "Tibia.dat");

  let promises = resources.map(function(url) {
    return fetch("/data/%s/%s".format(gameClient.SERVER_VERSION, url)).then(this.fetchCallback);
  }, this);

  // Wait for completing of resources
  Promise.all(promises).then(function([ dataSprites, dataObjects ]) {

    // Load the sprites and data objects
    gameClient.spriteBuffer.load("Tibia.spr", {"target": {"result": dataSprites}});
    gameClient.dataObjects.load("Tibia.dat", {"target": {"result": dataObjects}});

  }).catch(function(error) {
    return gameClient.interface.modalManager.open("floater-connecting", "Failed loading client data from server. Please select them manually using the Load Assets button.");
  });

}

NetworkManager.prototype.connect = function() {

  /*
   * Function NetworkManager.connect
   * Connects to the server websocket at the remote host and port
   */

  let host = this.getConnectionSettings();
  let { account, password } = gameClient.interface.getAccountDetails();

  // Contact the login server
  fetch("%s//%s/?account=%s&password=%s".format(location.protocol, host, account, password)).then(function(response) {

    switch(response.status) {
      case 200: break;
      case 401: throw new AuthenticationError("The account number or password is incorrect.");
      case 500: throw new ServerError("The server experienced an internal error.");
    }

    // Proceed
    return response.json();

  }).then(function(response) {

    // Open the websocket connection: binary transfer of data
    this.socket = new WebSocket(this.getConnectionString(response));
    this.socket.binaryType = "arraybuffer";
    
    // Attach callbacks
    this.socket.onopen = this.__handleConnection.bind(this);
    this.socket.onmessage = this.__handlePacket.bind(this);
    this.socket.onclose = this.__handleClose.bind(this);
    this.socket.onerror = this.__handleError.bind(this);

  }.bind(this)).catch(x => gameClient.interface.modalManager.open("floater-connecting", x));

}

NetworkManager.prototype.__handlePacket = function(event) {

  /*
   * Function NetworkManager.__handlePacket
   * Handles an incoming binary message
   */

  // Wrap the buffer in a readable packet
  let packet = new PacketReader(event.data);

  // Save the number of received bytes
  this.state.bytesRecv += packet.buffer.length;

  // Can still read the packet
  while(packet.readable()) {
    this.readPacket(packet);
  }

}

NetworkManager.prototype.__handleError = function(event) {

  /*
   * Function GameClient.__handleError
   * Gracefully handle websocket errors..
   */

  gameClient.interface.modalManager.open("floater-connecting", new ConnectionError("Could not connect to the Gameworld. <br> Please try again later."));

}

NetworkManager.prototype.__handleClose = function(event) {

  /*
   * Function NetworkManager.__handleClose
   * Callback function for when the websocket connection is closed
   */

  console.log("Disconnected");

  // If we are connected to the game world: handle a reset
  if(this.state.connected && gameClient.renderer) {
    gameClient.reset();
  }

  // Set connected to false
  this.state.connected = false;

}

NetworkManager.prototype.__handleConnection = function(event) {

  /*
   * Function NetworkManager.__handleConnection
   * Callback fired when connected to the gameserver
   */

  this.state.connected = true;

  console.log("You are connected to the gameserver.");

}
