const OutfitChangePacket = function (outfit) {

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

const ContainerClosePacket = function (cid) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CONTAINER_CLOSE, 4);

  // Identifier
  this.writeUInt32(cid);

}

ContainerClosePacket.prototype = Object.create(PacketWriter.prototype);
ContainerClosePacket.prototype.constructor = ContainerClosePacket;

const ChannelMessagePacket = function (id, loudness, string) {

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

const ChannelJoinPacket = function (id) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CHANNEL_JOIN, 1);

  this.writeUInt8(id);

}

ChannelJoinPacket.prototype = Object.create(PacketWriter.prototype);
ChannelJoinPacket.prototype.constructor = ChannelJoinPacket;

const ChannelLeavePacket = function (id) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CHANNEL_LEAVE, 1);

  this.writeUInt8(id);

}

ChannelLeavePacket.prototype = Object.create(PacketWriter.prototype);
ChannelLeavePacket.prototype.constructor = ChannelLeavePacket;

const ChannelPrivatePacket = function (name, message) {

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

const MovementPacket = function (direction) {

  /*
   * Class OutfitChangePacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.MOVE, 1);

  this.writeUInt8(direction);

}

MovementPacket.prototype = Object.create(PacketWriter.prototype);
MovementPacket.prototype.constructor = MovementPacket;

const PlayerTurnPacket = function (direction) {

  /*
   * Class PlayerTurnPacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.TURN, 1);

  this.writeUInt8(direction);

}

PlayerTurnPacket.prototype = Object.create(PacketWriter.prototype);
PlayerTurnPacket.prototype.constructor = PlayerTurnPacket;

const ItemMovePacket = function (fromThing, toThing, count) {

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

const ItemLookPacket = function (thing) {

  /*
   * Class ItemLookPacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.THING_LOOK, 8);

  this.__writeGenericMove(thing);

}

ItemLookPacket.prototype = Object.create(PacketWriter.prototype);
ItemLookPacket.prototype.constructor = ItemLookPacket;

const ItemUsePacket = function (thing) {

  /*
   * Class ItemLookPacket
   * WRapper for an outfit change packet
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.THING_USE, 8);

  this.__writeGenericMove(thing);

}

ItemUsePacket.prototype = Object.create(PacketWriter.prototype);
ItemUsePacket.prototype.constructor = ItemUsePacket;

const ItemUseWithPacket = function (fromThing, toThing) {

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

const ItemUseOnCreaturePacket = function (fromThing, creatureId) {

  /*
   * Class ItemUseOnCreaturePacket
   * Wrapper packet for using an item (like a rune) on a creature from battle list
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.THING_USE_ON_CREATURE, 12);

  // Write the source item location
  this.__writeGenericMove(fromThing);

  // Write the target creature ID
  this.writeUInt32(creatureId);

}

ItemUseOnCreaturePacket.prototype = Object.create(PacketWriter.prototype);
ItemUseOnCreaturePacket.prototype.constructor = ItemUseOnCreaturePacket;

const TargetPacket = function (id) {

  /*
   * Class ItemUseWithPacket
   * Wrapper packet for an use with action
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.TARGET, 4);

  this.writeUInt32(id);

}

TargetPacket.prototype = Object.create(PacketWriter.prototype);
TargetPacket.prototype.constructor = TargetPacket;

const LogoutPacket = function () {

  /*
   * Class LogoutPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.LOGOUT, 0);

}

LogoutPacket.prototype = Object.create(PacketWriter.prototype);
LogoutPacket.prototype.constructor = LogoutPacket;

const KeyringOpenPacket = function () {

  /*
   * Class LogoutPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.OPEN_KEYRING, 0);

}

KeyringOpenPacket.prototype = Object.create(PacketWriter.prototype);
KeyringOpenPacket.prototype.constructor = KeyringOpenPacket;

const FriendRemovePacket = function (string) {

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

const FriendAddPacket = function (string) {

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

const OfferBuyPacket = function (id, offer, count) {

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

const SpellCastPacket = function (id) {

  /*
   * Class SpellCastPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CAST_SPELL, 2);

  this.writeUInt16(id);

}

SpellCastPacket.prototype = Object.create(PacketWriter.prototype);
SpellCastPacket.prototype.constructor = SpellCastPacket;

const LatencyPacket = function () {

  /*
   * Class LatencyPacket
   * Wrapper for logout request for the player
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.LATENCY, 0);

}

LatencyPacket.prototype = Object.create(PacketWriter.prototype);
LatencyPacket.prototype.constructor = LatencyPacket;

const FightModePacket = function (mode) {

  /*
   * Class FightModePacket
   * Wrapper for fight mode change packet (OFFENSIVE, BALANCED, DEFENSIVE)
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.FIGHT_MODE, 1);

  this.writeUInt8(mode);

}

FightModePacket.prototype = Object.create(PacketWriter.prototype);
FightModePacket.prototype.constructor = FightModePacket;

const ChaseModePacket = function (mode) {

  /*
   * Class ChaseModePacket
   * Wrapper for chase mode change packet (STAND, CHASE)
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.CHASE_MODE, 1);

  this.writeUInt8(mode);

}

ChaseModePacket.prototype = Object.create(PacketWriter.prototype);
ChaseModePacket.prototype.constructor = ChaseModePacket;

const WriteTextPacket = function (itemId, content) {

  /*
   * Class WriteTextPacket
   * Wrapper for sending written text content to the server (labels, letters, etc.)
   */

  let encodedContent = this.encodeString(content);

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.WRITE_TEXT, 4 + encodedContent.stringLength);

  this.writeUInt32(itemId);
  this.writeBuffer(encodedContent.stringEncoded);

}

WriteTextPacket.prototype = Object.create(PacketWriter.prototype);
WriteTextPacket.prototype.constructor = WriteTextPacket;

const QuestLogPacket = function (questId) {
  /*
   * Class QuestLogPacket
   * Wrapper for requesting quest log or specific quest details
   * If questId is provided, it requests details for that quest (QuestLine)
   * If questId is 0 or undefined, it requests the main list
   */

  PacketWriter.call(this, CONST.PROTOCOL.CLIENT.QUEST_LOG, 2);

  this.writeUInt16(questId || 0);

}
QuestLogPacket.prototype = Object.create(PacketWriter.prototype);
QuestLogPacket.prototype.constructor = QuestLogPacket;
