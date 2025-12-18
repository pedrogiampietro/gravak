const OutfitChangePacket = function(outfit) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.OUTFIT, 11);

  // Identifier
  this.writeUInt16(outfit.id);

  // Details
  this.writeUInt8(outfit.details.head);
  this.writeUInt8(outfit.details.body);
  this.writeUInt8(outfit.details.legs);
  this.writeUInt8(outfit.details.feet);

  // The mount identifier
  this.writeUInt16(outfit.mount);

  // State whether addons are equipped and the creature is mounted
  this.writeBoolean(outfit.mounted);
  this.writeBoolean(outfit.addonOne);
  this.writeBoolean(outfit.addonTwo);

}

OutfitChangePacket.prototype = Object.create(PacketWriter.prototype);
OutfitChangePacket.prototype.constructor = OutfitChangePacket;

const ContainerClosePacket = function(cid) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CONTAINER_CLOSE, 4);

  // Identifier
  this.writeUInt32(id);

}

ContainerClosePacket.prototype = Object.create(PacketWriter.prototype);
ContainerClosePacket.prototype.constructor = ContainerClosePacket;

const ChannelMessagePacket = function(id, loudness, string) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  let { stringEncoded, stringLength } = this.encodeString(string);

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CHANNEL_MESSAGE, stringLength + 2);

  this.writeUInt8(id);
  this.writeUInt8(loudness);
  this.writeBuffer(stringEncoded);

}

ChannelMessagePacket.prototype = Object.create(PacketWriter.prototype);
ChannelMessagePacket.prototype.constructor = ChannelMessagePacket;

const ChannelJoinPacket = function(id) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CHANNEL_JOIN, 1);

  this.writeUInt8(id);

}

ChannelJoinPacket.prototype = Object.create(PacketWriter.prototype);
ChannelJoinPacket.prototype.constructor = ChannelJoinPacket;

const ChannelLeavePacket = function(id) { 

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CHANNEL_LEAVE, 1);

  this.writeUInt8(id);

}

ChannelLeavePacket.prototype = Object.create(PacketWriter.prototype);
ChannelLeavePacket.prototype.constructor = ChannelLeavePacket;

const ChannelPrivatePacket = function(name, message) {

  /*
   * Class ChannelPrivatePacket
   * WRapper for an outfit change packet
   */

  let encodedName = this.encodeString(name);
  let encodedMessage = this.encodeString(message);

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CHANNEL_PRIVATE_MESSAGE, encodedName.stringLength + encodedMessage.stringLength);

  this.writeBuffer(encodedName.stringEncoded);
  this.writeBuffer(encodedMessage.stringEncoded);

}

ChannelPrivatePacket.prototype = Object.create(PacketWriter.prototype);
ChannelPrivatePacket.prototype.constructor = ChannelPrivatePacket;

const MovementPacket = function(direction) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.MOVE, 1); 
  
  this.writeUInt8(direction);

} 
  
MovementPacket.prototype = Object.create(PacketWriter.prototype);
MovementPacket.prototype.constructor = MovementPacket;

const PlayerTurnPacket = function(direction) {

  /*
   * Class PlayerTurnPacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.TURN, 1);          
  
  this.writeUInt8(direction);

} 
  
PlayerTurnPacket.prototype = Object.create(PacketWriter.prototype);
PlayerTurnPacket.prototype.constructor = PlayerTurnPacket;

const ItemMovePacket = function(fromThing, toThing, count) {
  
  /*
   * Class PlayerTurnPacket
   * WRapper for an outfit change packet
   */
  
  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.THING_MOVE, 17);
    
  this.__writeGenericMove(fromThing);
  this.__writeGenericMove(toThing);
  this.writeUInt8(count);

} 
  
ItemMovePacket.prototype = Object.create(PacketWriter.prototype);
ItemMovePacket.prototype.constructor = ItemMovePacket;

const ItemLookPacket = function(thing) {
  
  /*
   * Class ItemLookPacket
   * WRapper for an outfit change packet
   */
  
  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.THING_LOOK, 8);
    
  this.__writeGenericMove(thing);
  
}
 
ItemLookPacket.prototype = Object.create(PacketWriter.prototype);
ItemLookPacket.prototype.constructor = ItemLookPacket;

const ItemUsePacket = function(thing) {
 
  /*
   * Class ItemLookPacket
   * WRapper for an outfit change packet
   */
 
  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.THING_USE, 8);
   
  this.__writeGenericMove(thing);
 
}

ItemUsePacket.prototype = Object.create(PacketWriter.prototype);
ItemUsePacket.prototype.constructor = ItemUsePacket;

const ItemUseWithPacket = function(fromThing, toThing) {

  /*
   * Class ItemUseWithPacket
   * Wrapper packet for an use with action
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.THING_USE_WITH, 16);
  
  this.__writeGenericMove(fromThing);
  this.__writeGenericMove(toThing);

}

ItemUseWithPacket.prototype = Object.create(PacketWriter.prototype);
ItemUseWithPacket.prototype.constructor = ItemUseWithPacket;

const TargetPacket = function(id) {

  /*
   * Class ItemUseWithPacket
   * Wrapper packet for an use with action
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.TARGET, 4);

  this.writeUInt32(id);

} 
  
TargetPacket.prototype = Object.create(PacketWriter.prototype);
TargetPacket.prototype.constructor = TargetPacket;

const LogoutPacket = function() {

  /*
   * Class LogoutPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.LOGOUT, 0);

}

LogoutPacket.prototype = Object.create(PacketWriter.prototype);
LogoutPacket.prototype.constructor = LogoutPacket;

const KeyringOpenPacket = function() {

  /*
   * Class LogoutPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.OPEN_KEYRING, 0);

}

KeyringOpenPacket.prototype = Object.create(PacketWriter.prototype);
KeyringOpenPacket.prototype.constructor = KeyringOpenPacket;

const FriendRemovePacket = function(string) {

  /*
   * Class LogoutPacket
   * Wrapper for logout request for the player
   */

  let { stringEncoded, stringLength } = this.encodeString(string);

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.FRIEND_REMOVE, stringLength);

  this.writeBuffer(stringEncoded);

} 
  
FriendRemovePacket.prototype = Object.create(PacketWriter.prototype);
FriendRemovePacket.prototype.constructor = FriendRemovePacket;

const FriendAddPacket = function(string) {
  
  /*
   * Class LogoutPacket
   * Wrapper for logout request for the player
   */

  let { stringEncoded, stringLength } = this.encodeString(string);

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.FRIEND_ADD, stringLength);

  this.writeBuffer(stringEncoded);

}
  
FriendAddPacket.prototype = Object.create(PacketWriter.prototype);
FriendAddPacket.prototype.constructor = FriendAddPacket;

const OfferBuyPacket = function(id, offer, count) {

  /*
   * Class OfferBuyPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.BUY_OFFER, 6);

  this.writeUInt32(id);
  this.writeUInt8(offer);
  this.writeUInt8(count);

}

OfferBuyPacket.prototype = Object.create(PacketWriter.prototype);
OfferBuyPacket.prototype.constructor = OfferBuyPacket;

const SpellCastPacket = function(id) {

  /*
   * Class SpellCastPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CAST_SPELL, 2);

  this.writeUInt16(id);

}

SpellCastPacket.prototype = Object.create(PacketWriter.prototype);
SpellCastPacket.prototype.constructor = SpellCastPacket;

const LatencyPacket = function() {
  
  /*
   * Class LatencyPacket
   * Wrapper for logout request for the player
   */
  
  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.LATENCY, 0);

}

LatencyPacket.prototype = Object.create(PacketWriter.prototype);
LatencyPacket.prototype.constructor = LatencyPacket;
