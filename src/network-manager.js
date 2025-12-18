"use strict";

const PacketReader = requireModule("packet-reader");
const PacketHandler = requireModule("packet-handler");

const { createWriteStream } = require("fs");

function NetworkManager() {

  /*
   * Class NetworkManager
   * Accepts all the incoming network messages and delegates to the appropriate handlers
   *
   * API:
   *
   * @NetworkManager.writeOutgoingBuffer(socket) - writes the outgoing buffered messages to the socket
   * @NetworkManager.readIncomingBuffer(socket) - reads the incoming buffered messages from the socket
   * @NetworkManager.getDataDetails() - returns the number of bytes written/read by the server
   *
   */

  // The handler for packets
  this.packetHandler = new PacketHandler(this);

  // Stream for all packets received by the server
  this.packetStream = createWriteStream("packets.wal");

}

NetworkManager.prototype.writeOutgoingBuffer = function(gameSocket) {

  /*
   * Function WebsocketServer.writeOutgoingBuffer
   * Flushes the outgoing network buffer to the client
   */

  // Ignore if the socket was already destroyed
  if(gameSocket.socket.destroyed) {
    return;
  }

  // No messages
  if(gameSocket.outgoingBuffer.isEmpty()) {
    return;
  }

  let message = gameSocket.outgoingBuffer.flush();

  gameSocket.socket.send(message);

}

NetworkManager.prototype.handleIO = function(gameSocket) {

  /*
   * Function NetworkManager.handleIO
   * Handles buffered input and output for a game socket
   */

  this.readIncomingBuffer(gameSocket);
  this.writeOutgoingBuffer(gameSocket);

}

NetworkManager.prototype.readIncomingBuffer = function(gameSocket) {

  /*
   * Function GameServer.readIncomingBuffer
   * Flushes the incoming network message buffer
   */

  // Read the incoming buffer
  let buffer = gameSocket.incomingBuffer.flush();

  // Write all received records to disk
  this.packetStream.write(buffer);

  // Block excessively large inputs by the users
  if(buffer.length > CONFIG.SERVER.MAX_PACKET_SIZE) {
    return gameSocket.close();
  }

  // Class to easily read a buffer sequentially
  let packet = new PacketReader(buffer);

  // Extend the idle lock if a packet is received
  if(packet.isReadable()) {
    gameSocket.player.idleHandler.extend();
  }

  // Keep parsing the incoming buffer
  while(packet.isReadable()) {

    // Prevent reading the incoming buffer if the socket was destroyed
    if(gameSocket.socket.destroyed) {
      return;
    }

    // Parsing client packets is very dangerous so wrap in a try/catch. Should probably verify length of packets!
    try {
      this.__readPacket(gameSocket, packet);
    } catch(exception) {
      console.trace(exception);
      return gameSocket.close();
    }

  }

}


NetworkManager.prototype.__readPacket = function(gameSocket, packet) {

  /*
   * Function NetworkManager.__readPacket
   * Reads a single packet from the passed buffer
   */

  // Read the opcode of the packet
  let opcode = packet.readUInt8();

  // The packet operational code
  switch(opcode) {

    // Cancel target packet is requested (esc key)
    case CONST.PROTOCOL.CLIENT.BUY_OFFER: {
       return gameSocket.player.handleBuyOffer(packet.readBuyOffer());
    }

    // Cancel target packet is requested (esc key)
    case CONST.PROTOCOL.CLIENT.TARGET_CANCEL: {
       return gameSocket.player.setTarget(null);
    }

    // Adding friend packet is received
    case CONST.PROTOCOL.CLIENT.FRIEND_ADD: {
      return gameSocket.player.friendlist.add(packet.readString());
    }

    // Remove friend packet is received
    case CONST.PROTOCOL.CLIENT.FRIEND_REMOVE: {
      return gameSocket.player.friendlist.remove(packet.readString());
    }

    // Packet that requests looking at an item
    case CONST.PROTOCOL.CLIENT.THING_LOOK: {
      return this.packetHandler.handleItemLook(gameSocket.player, packet.readPositionAndIndex(gameSocket.player));
    }

    // An outfit change is requested
    case CONST.PROTOCOL.CLIENT.THING_USE: {
      return gameSocket.player.useHandler.handleItemUse(packet.readPositionAndIndex(gameSocket.player));
    }

    // An outfit change is requested
    case CONST.PROTOCOL.CLIENT.THING_USE_WITH: {
      return gameSocket.player.useHandler.handleActionUseWith(packet.readItemUseWith(gameSocket.player));
    }

    case CONST.PROTOCOL.CLIENT.OUTFIT: {
      return gameSocket.player.changeOutfit(packet.readOutfit());
    }

    case CONST.PROTOCOL.CLIENT.CHANNEL_LEAVE: {
      return gameServer.world.channelManager.leaveChannel(gameSocket.player, packet.readUInt8());
    }

    case CONST.PROTOCOL.CLIENT.CHANNEL_JOIN: {
      return gameServer.world.channelManager.joinChannel(gameSocket.player, packet.readUInt8());
    }

    // A spell was casted by the player
    case CONST.PROTOCOL.CLIENT.CAST_SPELL: {
      return gameSocket.player.spellbook.handleSpell(packet.readUInt16());
    }

    // An item move was requested
    case CONST.PROTOCOL.CLIENT.THING_MOVE: {
      return this.packetHandler.moveItem(gameSocket.player, packet.readMoveItem(gameSocket.player));
    }

    case CONST.PROTOCOL.CLIENT.TURN: {
      return gameSocket.player.setDirection(packet.readUInt8());
    }

    case CONST.PROTOCOL.CLIENT.CONTAINER_CLOSE: {
      return this.packetHandler.handleContainerClose(gameSocket.player, packet.readUInt32());
    }

    case CONST.PROTOCOL.CLIENT.OPEN_KEYRING: {
      return gameSocket.player.containerManager.openKeyring();
    }

    case CONST.PROTOCOL.CLIENT.TARGET: {
      return this.packetHandler.handleTargetCreature(gameSocket.player, packet.readUInt32());
    }

    case CONST.PROTOCOL.CLIENT.CLIENT_USE_TILE: {
      return this.handleTileUse(gameSocket.player, packet.readWorldPosition());
    }

    // A string is sent by the player
    case CONST.PROTOCOL.CLIENT.CHANNEL_MESSAGE: {
      return this.packetHandler.handlePlayerSay(gameSocket.player, packet.readClientMessage());
    }

    case CONST.PROTOCOL.CLIENT.LOGOUT: {
      return this.packetHandler.handleLogout(gameSocket);
    }

    // A private message is received
    case CONST.PROTOCOL.CLIENT.CHANNEL_PRIVATE_MESSAGE: {
      return gameServer.world.channelManager.handleSendPrivateMessage(gameSocket.player, packet.readPrivateMessage());
    }

    // Player movement operation
    case CONST.PROTOCOL.CLIENT.MOVE: {
      return gameSocket.player.movementHandler.handleMovement(packet.readUInt8());
    }

    // Unknown opcode sent: close the socket immediately
    default: {
      return gameSocket.close();
    }

  }

}

module.exports = NetworkManager;
