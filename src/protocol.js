"use strict";

const PacketWriter = requireModule("packet-writer");

const CreaturePropertyPacket = function (id, property, value) {
  /*
   * Class CreaturePropertyPacket
   * Wrapper for a packet that describes a property change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CREATURE_PROPERTY, 9);

  // Three properties
  this.writeUInt32(id);
  this.writeUInt8(property);
  this.writeUInt32(value);
};

CreaturePropertyPacket.prototype = Object.create(PacketWriter.prototype);
CreaturePropertyPacket.prototype.constructor = CreaturePropertyPacket;

const StringCreaturePropertyPacket = function (id, property, string) {
  /*
   * Class CreaturePropertyPacket
   * Wrapper for a packet that describes a property change
   */

  let stringEncoded = this.encodeString(string);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.CREATURE_PROPERTY,
    stringEncoded.getEncodedLength() + 5
  );

  // Three properties
  this.writeUInt32(id);
  this.writeUInt8(property);
  this.writeBuffer(stringEncoded);
};

StringCreaturePropertyPacket.prototype = Object.create(PacketWriter.prototype);
StringCreaturePropertyPacket.prototype.constructor =
  StringCreaturePropertyPacket;

const OutfitPacket = function (guid, outfit) {
  /*
   * Class OutfitPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.OUTFIT, 15);

  // Write the identifier of the creature & new outfit
  this.writeUInt32(guid);
  this.writeOutfit(outfit);
};

OutfitPacket.prototype = Object.create(PacketWriter.prototype);
OutfitPacket.prototype.constructor = OutfitPacket;

const EmotePacket = function (creature, message, color) {
  /*
   * Class EmotePacket
   * Wrapper for a packet that describes an outfit change
   */

  // Strings with variable length
  let stringEncoded = this.encodeString(message);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.EMOTE,
    6 + stringEncoded.getEncodedLength()
  );

  // Write creature information
  this.writeUInt32(creature.getId());
  this.writeUInt8(creature.type);
  this.writeBuffer(stringEncoded);
  this.writeUInt8(color);
};

EmotePacket.prototype = Object.create(PacketWriter.prototype);
EmotePacket.prototype.constructor = EmotePacket;

const ChannelDefaultPacket = function (creature, message, color) {
  /*
   * Class ChannelDefaultPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Strings with variable length
  let stringEncoded = this.encodeString(message);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.CREATURE_SAY,
    6 + stringEncoded.getEncodedLength()
  );

  // Write creature information
  this.writeUInt32(creature.getId());
  this.writeUInt8(creature.type);
  this.writeBuffer(stringEncoded);
  this.writeUInt8(color);
};

ChannelDefaultPacket.prototype = Object.create(PacketWriter.prototype);
ChannelDefaultPacket.prototype.constructor = ChannelDefaultPacket;

const EffectMagicPacket = function (position, type) {
  /*
   * Class EffectMagicPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.MAGIC_EFFECT, 7);

  // Properties
  this.writePosition(position);
  this.writeUInt8(type);
};

EffectMagicPacket.prototype = Object.create(PacketWriter.prototype);
EffectMagicPacket.prototype.constructor = EffectMagicPacket;

const EffectDistancePacket = function (positionFrom, positionTo, type) {
  /*
   * Class EffectMagicPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.DISTANCE_EFFECT, 13);

  // Properties
  this.writePosition(positionFrom);
  this.writePosition(positionTo);
  this.writeUInt8(type);
};

EffectDistancePacket.prototype = Object.create(PacketWriter.prototype);
EffectDistancePacket.prototype.constructor = EffectDistancePacket;

const PlayerLoginPacket = function (name) {
  /*
   * Class PlayerLoginPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Strings with variable length
  let stringEncoded = this.encodeString(name);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.PLAYER_LOGIN,
    stringEncoded.getEncodedLength()
  );

  // Write the property
  this.writeBuffer(stringEncoded);
};

PlayerLoginPacket.prototype = Object.create(PacketWriter.prototype);
PlayerLoginPacket.prototype.constructor = PlayerLoginPacket;

const PlayerLogoutPacket = function (name) {
  /*
   * Class PlayerLogoutPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Strings with variable length
  let stringEncoded = this.encodeString(name);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.PLAYER_LOGOUT,
    stringEncoded.getEncodedLength()
  );

  // Write the property
  this.writeBuffer(stringEncoded);
};

PlayerLogoutPacket.prototype = Object.create(PacketWriter.prototype);
PlayerLogoutPacket.prototype.constructor = PlayerLogoutPacket;

const CreatureMovePacket = function (guid, position, duration) {
  /*
   * Class CreatureMovePacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CREATURE_MOVE, 12);

  this.writeUInt32(guid);
  this.writePosition(position);
  this.writeUInt16(duration);
};

CreatureMovePacket.prototype = Object.create(PacketWriter.prototype);
CreatureMovePacket.prototype.constructor = CreatureMovePacket;

const CreatureTeleportPacket = function (guid, position) {
  /*
   * Class CreatureTeleportPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CREATURE_TELEPORT, 10);

  this.writeUInt32(guid);
  this.writePosition(position);
};

CreatureTeleportPacket.prototype = Object.create(PacketWriter.prototype);
CreatureTeleportPacket.prototype.constructor = CreatureTeleportPacket;

const ServerMessagePacket = function (message) {
  /*
   * Class ServerMessagePacket
   * Wrapper for a packet that describes an outfit change
   */

  // Strings with variable length
  let stringEncoded = this.encodeString(message);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.MESSAGE_SERVER,
    stringEncoded.getEncodedLength()
  );

  // Write the property
  this.writeBuffer(stringEncoded);
};

ServerMessagePacket.prototype = Object.create(PacketWriter.prototype);
ServerMessagePacket.prototype.constructor = ServerMessagePacket;

const ItemAddPacket = function (position, thing, index) {
  /*
   * Class ItemAddPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.ITEM_ADD, 10);

  this.writeClientId(thing.id);
  this.writeUInt8(thing.count);
  this.writePosition(position);
  this.writeUInt8(index);
};

ItemAddPacket.prototype = Object.create(PacketWriter.prototype);
ItemAddPacket.prototype.constructor = ItemAddPacket;

const ItemRemovePacket = function (position, index, count) {
  /*
   * Class ItemRemovePacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.ITEM_REMOVE, 8);

  this.writePosition(position);
  this.writeUInt8(index);
  this.writeUInt8(count);
};

ItemRemovePacket.prototype = Object.create(PacketWriter.prototype);
ItemRemovePacket.prototype.constructor = ItemRemovePacket;

const ContainerAddPacket = function (guid, index, item) {
  /*
   * Class ContainerAddPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CONTAINER_ADD, 8);

  this.writeUInt32(guid);
  this.writeUInt8(index);
  this.writeItem(item);
};

ContainerAddPacket.prototype = Object.create(PacketWriter.prototype);
ContainerAddPacket.prototype.constructor = ContainerAddPacket;

const ContainerRemovePacket = function (guid, index, count) {
  /*
   * Class containerRemovePacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CONTAINER_REMOVE, 6);

  this.writeUInt32(guid);
  this.writeUInt8(index);
  this.writeUInt8(count);
};

ContainerRemovePacket.prototype = Object.create(PacketWriter.prototype);
ContainerRemovePacket.prototype.constructor = ContainerRemovePacket;

const ChunkPacket = function (chunk) {
  /*
   * Class ChunkPacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CHUNK, this.MAX_PACKET_SIZE);

  // This is the number that unique identifies the chunk
  this.writeUInt32(chunk.id);
  this.writePosition(chunk.position);

  // Serialize each tile
  chunk.layers.forEach(function (layer) {
    // An empty layer
    if (layer === null) {
      return this.writeUInt8(0);
    }

    // Write the number of tiles
    this.writeUInt8(layer.length);

    layer.forEach(this.writeTile, this);
  }, this);
};

ChunkPacket.prototype = Object.create(PacketWriter.prototype);
ChunkPacket.prototype.constructor = ChunkPacket;

const CreatureStatePacket = function (creature) {
  /*
   * Class CreatureStatePacket
   * Wrapper for a packet that describes an outfit change
   */

  let stringEncoded = this.encodeString(
    creature.getProperty(CONST.PROPERTIES.NAME)
  );

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.CREATURE_STATE,
    stringEncoded.getEncodedLength() + 35
  );

  // The globally unique identifier
  this.writeUInt32(creature.getId());

  this.writeCreatureType(creature);
  this.writePosition(creature.getPosition());
  this.writeUInt8(creature.getProperty(CONST.PROPERTIES.DIRECTION));

  // Write the looktype
  this.writeOutfit(creature.getOutfit());

  // Write healthinformation
  this.writeUInt32(creature.getProperty(CONST.PROPERTIES.HEALTH));
  this.writeUInt32(creature.getProperty(CONST.PROPERTIES.HEALTH_MAX));
  this.writeUInt16(creature.getProperty(CONST.PROPERTIES.SPEED));

  this.writeCreatureType(creature);
  this.writeBuffer(stringEncoded);

  // Condition size
  this.writeUInt8(0);
};

CreatureStatePacket.prototype = Object.create(PacketWriter.prototype);
CreatureStatePacket.prototype.constructor = CreatureStatePacket;

const CancelMessagePacket = function (message) {
  /*
   * Class CancelMessagePacket
   * Wrapper for a packet that describes an outfit change
   */

  let stringEncoded = this.encodeString(message);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.MESSAGE_CANCEL,
    stringEncoded.getEncodedLength()
  );

  this.writeBuffer(stringEncoded);
};

CancelMessagePacket.prototype = Object.create(PacketWriter.prototype);
CancelMessagePacket.prototype.constructor = CancelMessagePacket;

const ToggleConditionPacket = function (toggle, cid, id) {
  /*
   * Class CancelMessagePacket
   * Wrapper for a packet that describes an outfit change
   */

  // Inherits from packet writer
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.TOGGLE_CONDITION, 7);

  this.writeUInt32(cid);
  this.writeBoolean(toggle);
  this.writeUInt16(id);
};

ToggleConditionPacket.prototype = Object.create(PacketWriter.prototype);
ToggleConditionPacket.prototype.constructor = ToggleConditionPacket;

const ServerStatePacket = function (message) {
  /*
   * Class ServerStatePacket
   * Wrapper for a packet that contains the server state
   */

  let stringEncoded = this.encodeString(CONFIG.SERVER.VERSION);

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.STATE_SERVER,
    stringEncoded.getEncodedLength() + 13
  );

  // The chunk information and the world size size
  this.writeUInt16(gameServer.world.lattice.width);
  this.writeUInt16(gameServer.world.lattice.height);
  this.writeUInt8(gameServer.world.lattice.depth);

  this.writeUInt8(CONFIG.WORLD.CHUNK.WIDTH);
  this.writeUInt8(CONFIG.WORLD.CHUNK.HEIGHT);
  this.writeUInt8(CONFIG.WORLD.CHUNK.DEPTH);

  // Other information that is very impportant like the server tick rate
  this.writeUInt8(CONFIG.SERVER.MS_TICK_INTERVAL);
  this.writeUInt16(CONFIG.WORLD.CLOCK.SPEED);
  this.writeBuffer(stringEncoded);
  this.writeUInt16(CONFIG.SERVER.CLIENT_VERSION);
};

ServerStatePacket.prototype = Object.create(PacketWriter.prototype);
ServerStatePacket.prototype.constructor = ServerStatePacket;

const WorldTimePacket = function (timeOffset) {
  /*
   * Class WorldTimePacket
   * Wrapper for a packet that contains the current world time
   */

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.WORLD_TIME, 4);

  this.writeUInt32(timeOffset);
};

WorldTimePacket.prototype = Object.create(PacketWriter.prototype);
WorldTimePacket.prototype.constructor = WorldTimePacket;

const CreatureForgetPacket = function (cid) {
  /*
   * Class CreatureForgetPacket
   * Wrapper for a packet to forget about a creature
   */

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CREATURE_REMOVE, 4);

  this.writeUInt32(cid);
};

CreatureForgetPacket.prototype = Object.create(PacketWriter.prototype);
CreatureForgetPacket.prototype.constructor = CreatureForgetPacket;

const ContainerOpenPacket = function (cid, name, container) {
  /*
   * Class ContainerOpenPacket
   * Wrapper for a packet that opens a container with the specified id
   */

  let stringEncoded = this.encodeString(name);

  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.CONTAINER_OPEN,
    stringEncoded.getEncodedLength() + 7 + container.getPacketSize()
  );

  // Get the items
  this.writeUInt32(container.guid);
  this.writeClientId(cid);
  this.writeBuffer(stringEncoded);
  this.writeUInt8(container.size);

  container.getSlots().forEach(this.writeItem, this);
};

ContainerOpenPacket.prototype = Object.create(PacketWriter.prototype);
ContainerOpenPacket.prototype.constructor = ContainerOpenPacket;

const ContainerClosePacket = function (cid) {
  /*
   * Class ContainerClosePacket
   * Wrapper for a packet that closes a container with the specified id
   */

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.CONTAINER_CLOSE, 4);

  // Get the items
  this.writeUInt32(cid);
};

ContainerClosePacket.prototype = Object.create(PacketWriter.prototype);
ContainerClosePacket.prototype.constructor = ContainerClosePacket;

const ChannelJoinPacket = function (channel) {
  /*
   * Class ChannelJoinPacket
   * Wrapper for a packet that joins a specific channel with a name
   */

  let stringEncoded = this.encodeString(channel.name);

  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.CHANNEL_JOIN,
    4 + stringEncoded.getEncodedLength()
  );

  this.writeUInt32(channel.id);
  this.writeBuffer(stringEncoded);
};

ChannelJoinPacket.prototype = Object.create(PacketWriter.prototype);
ChannelJoinPacket.prototype.constructor = ChannelJoinPacket;

const ChannelWritePacket = function (cid, name, message, color) {
  /*
   * Class ChannelWritePacket
   * Packet to write a message from a creature to a specific channel
   */

  // Make sure to encode all strings
  let encodedName = this.encodeString(name);
  let encodedMessage = this.encodeString(message);

  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.CREATURE_MESSAGE,
    5 + encodedName.getEncodedLength() + encodedMessage.getEncodedLength()
  );

  this.writeUInt32(cid);
  this.writeBuffer(encodedName);
  this.writeBuffer(encodedMessage);
  this.writeUInt8(color);
};

ChannelWritePacket.prototype = Object.create(PacketWriter.prototype);
ChannelWritePacket.prototype.constructor = ChannelWritePacket;

const TilePacket = function (position, id) {
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.ITEM_TRANSFORM, 10);

  this.writePosition(position);
  this.writeClientId(id);
};

TilePacket.prototype = Object.create(PacketWriter.prototype);
TilePacket.prototype.constructor = TilePacket;

const ServerErrorPacket = function (message) {
  let stringEncoded = this.encodeString(message);

  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.SERVER_ERROR,
    stringEncoded.getEncodedLength()
  );

  this.writeBuffer(stringEncoded);
};

ServerErrorPacket.prototype = Object.create(PacketWriter.prototype);
ServerErrorPacket.prototype.constructor = ServerErrorPacket;

const LatencyPacket = function () {
  /*
   * Class LatencyPacket
   * Simplest packet without payload to indicate latency request
   */

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.LATENCY, 0);
};

LatencyPacket.prototype = Object.create(PacketWriter.prototype);
LatencyPacket.prototype.constructor = LatencyPacket;

const TargetPacket = function (cid) {
  /*
   * Class TargetPacket
   * Wrapper for a packet that selects a target
   */

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.TARGET, 4);

  this.writeUInt32(cid);
};

TargetPacket.prototype = Object.create(PacketWriter.prototype);
TargetPacket.prototype.constructor = TargetPacket;

const SpellAddPacket = function (sid) {
  /*
   * Class SpellAddPacket
   * Wrapper for a packet that describes adding an available spell to a player
   */

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.SPELL_ADD, 2);

  this.writeUInt16(sid);
};

SpellAddPacket.prototype = Object.create(PacketWriter.prototype);
SpellAddPacket.prototype.constructor = SpellAddPacket;

const SpellCastPacket = function (sid, duration) {
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.SPELL_CAST, 6);

  this.writeUInt16(sid);
  this.writeUInt32(duration);
};

SpellCastPacket.prototype = Object.create(PacketWriter.prototype);
SpellCastPacket.prototype.constructor = SpellCastPacket;

const CreatureInformationPacket = function (creature) {
  /*
   * Class CreatureInformationPacket
   * Wrapper for creature information
   */

  let stringEncoded = this.encodeString(
    creature.getProperty(CONST.PROPERTIES.NAME)
  );

  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.CREATURE_INFORMATION,
    stringEncoded.getEncodedLength() + 3
  );

  this.writeBuffer(stringEncoded);

  // Add some information on the player
  if (creature.isPlayer()) {
    this.writeUInt16(
      creature.skills.getSkillLevel(CONST.PROPERTIES.EXPERIENCE)
    );
    this.writeUInt8(creature.getProperty(CONST.PROPERTIES.SEX));
  } else {
    this.writeUInt16(0);
    this.writeUInt8(0);
  }
};

CreatureInformationPacket.prototype = Object.create(PacketWriter.prototype);
CreatureInformationPacket.prototype.constructor = CreatureInformationPacket;

const ItemInformationPacket = function (thing, includeDetails) {
  /*
   * Class ItemInformationPacket
   * Wrapper for thing information sent to the player
   */

  // Encode all the strings
  let distance = this.encodeString(
    thing.isDistanceReadable() ? thing.getContent : null
  );
  let article = this.encodeString(thing.getArticle());
  let name = this.encodeString(thing.getName());
  let description = this.encodeString(
    includeDetails ? thing.getDescription() : null
  );

  // Determine combined length of all the strings
  let length =
    distance.getEncodedLength() +
    article.getEncodedLength() +
    name.getEncodedLength() +
    description.getEncodedLength();

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.ITEM_INFORMATION, length + 9);

  // Server and client identifier
  this.writeUInt16(thing.id);
  this.writeClientId(thing.id);

  // Weight
  this.writeUInt16(
    includeDetails && thing.isPickupable() ? thing.getWeight() : 0
  );
  this.writeUInt8(
    includeDetails && thing.getAttribute("attack")
      ? thing.getAttribute("attack")
      : 0
  );
  this.writeUInt8(
    includeDetails && thing.getAttribute("armor")
      ? thing.getAttribute("armor")
      : 0
  );

  // Write the encoded strings
  this.writeBuffer(distance);
  this.writeBuffer(article);
  this.writeBuffer(name);
  this.writeBuffer(description);

  // Always include the count too
  this.writeUInt8(thing.count);
};

ItemInformationPacket.prototype = Object.create(PacketWriter.prototype);
ItemInformationPacket.prototype.constructor = ItemInformationPacket;

const ReadTextPacket = function (item) {
  let content = this.encodeString(item.getContent());
  let name = this.encodeString(item.getName());

  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.ITEM_TEXT,
    content.getEncodedLength() + name.getEncodedLength() + 1
  );

  this.writeBoolean(false);
  this.writeBuffer(content);
  this.writeBuffer(name);
};

ReadTextPacket.prototype = Object.create(PacketWriter.prototype);
ReadTextPacket.prototype.constructor = ReadTextPacket;

const CombatLockPacket = function (bool) {
  PacketWriter.call(this, CONST.PROTOCOL.SERVER.COMBAT_LOCK, 1);

  this.writeBoolean(bool);
};

CombatLockPacket.prototype = Object.create(PacketWriter.prototype);
CombatLockPacket.prototype.constructor = CombatLockPacket;

const ChannelPrivatePacket = function (name, message) {
  /*
   * Class ChannelPrivatePacket
   * Wrapper for a private message to another player
   */

  let encodedName = this.encodeString(name);
  let encodedMessage = this.encodeString(message);

  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.MESSAGE_PRIVATE,
    encodedName.getEncodedLength() + encodedMessage.getEncodedLength()
  );

  // Write the sender name and the message
  this.writeBuffer(encodedName);
  this.writeBuffer(encodedMessage);
};

ChannelPrivatePacket.prototype = Object.create(PacketWriter.prototype);
ChannelPrivatePacket.prototype.constructor = ChannelPrivatePacket;

const NPCTradePacket = function (cid, offers) {
  /*
   * Class NPCTradePacket
   * Wrapper for NPC trade offers
   */

  PacketWriter.call(this, CONST.PROTOCOL.SERVER.TRADE_OFFER, this.MAX_PACKET_SIZE);

  this.writeUInt32(cid);
  this.writeUInt8(offers.length);

  // Write individual trade information
  offers.forEach(function (offer) {
    // Encode the name of the item
    let stringEncoded = this.encodeString(offer.name);

    this.writeClientId(offer.id);
    this.writeBuffer(stringEncoded);
    this.writeUInt32(offer.price);
    // Convert type string to boolean: "sell" = true, "buy" = false
    this.writeBoolean(offer.type === "sell");
  }, this);
};

NPCTradePacket.prototype = Object.create(PacketWriter.prototype);
NPCTradePacket.prototype.constructor = NPCTradePacket;

const PlayerStatePacket = function (player) {
  /*
   * Class PlayerStatePacket
   * Wrapper for a packet that describes an outfit change
   */

  let stringEncoded = this.encodeString(
    player.getProperty(CONST.PROPERTIES.NAME)
  );

  // Inherits from packet writer
  PacketWriter.call(
    this,
    CONST.PROTOCOL.SERVER.STATE_PLAYER,
    this.MAX_PACKET_SIZE
  );

  // Get the current values from player properties with debug logs
  let health = player.getProperty(CONST.PROPERTIES.HEALTH);
  let healthMax = player.getProperty(CONST.PROPERTIES.HEALTH_MAX);
  let mana = player.getProperty(CONST.PROPERTIES.MANA);
  let manaMax = player.getProperty(CONST.PROPERTIES.MANA_MAX);
  let capacity = player.getProperty(CONST.PROPERTIES.CAPACITY);
  let capacityMax = player.getProperty(CONST.PROPERTIES.CAPACITY_MAX);

  console.log("=== DEBUG PLAYER STATE PACKET CONSTRUCTION ===");
  console.log("Raw values from player properties:");
  console.log(`Health: ${health}/${healthMax}`);
  console.log(`Mana: ${mana}/${manaMax}`);
  console.log(`Capacity: ${capacity}/${capacityMax}`);

  // Basic player data
  this.writeUInt32(player.getId());
  this.writeBuffer(stringEncoded);
  this.writePosition(player.getPosition());
  this.writeUInt8(player.getProperty(CONST.PROPERTIES.DIRECTION));

  // Write the skills
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.MAGIC));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.FIST));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.CLUB));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.SWORD));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.AXE));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.DISTANCE));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.SHIELDING));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.FISHING));
  this.writeUInt32(player.skills.getSkillValue(CONST.PROPERTIES.EXPERIENCE));

  // State variables
  this.writeUInt16(player.getProperty(CONST.PROPERTIES.SPEED));
  this.writeUInt8(player.getProperty(CONST.PROPERTIES.ATTACK));
  this.writeUInt8(player.getProperty(CONST.PROPERTIES.ATTACK_SPEED));

  this.writeEquipment(player.containerManager.equipment);

  // Write the number of available mounts and outfits
  this.writeMounts(player.getProperty(CONST.PROPERTIES.MOUNTS));
  this.writeOutfits(player.getProperty(CONST.PROPERTIES.OUTFITS));

  // Write the available spells
  this.writeUInt8(0);
  this.writeUInt8(0);

  // Write the outfit
  this.writeOutfit(player.getProperty(CONST.PROPERTIES.OUTFIT));

  // Write health and mana information
  this.writeUInt32(health);
  this.writeUInt32(healthMax);
  this.writeUInt32(mana);
  this.writeUInt32(manaMax);
  this.writeUInt32(capacity);
  this.writeUInt32(capacityMax);

  // Conditions
  this.writeUInt8(0);

  console.log("=== DEBUG PACKET DATA BEING SENT ===");
  console.log({
    health,
    healthMax,
    mana,
    manaMax,
    capacity,
    capacityMax,
  });
};

PlayerStatePacket.prototype = Object.create(PacketWriter.prototype);
PlayerStatePacket.prototype.constructor = PlayerStatePacket;

module.exports = {
  CancelMessagePacket,
  ChannelDefaultPacket,
  ChannelJoinPacket,
  ChannelWritePacket,
  ChannelPrivatePacket,
  ChunkPacket,
  CombatLockPacket,
  ContainerClosePacket,
  ContainerOpenPacket,
  ContainerAddPacket,
  ContainerRemovePacket,
  CreatureForgetPacket,
  CreatureInformationPacket,
  CreatureMovePacket,
  CreatureStatePacket,
  CreatureTeleportPacket,
  EffectDistancePacket,
  EffectMagicPacket,
  EmotePacket,
  ItemAddPacket,
  ItemInformationPacket,
  ItemRemovePacket,
  LatencyPacket,
  NPCTradePacket,
  OutfitPacket,
  PlayerLoginPacket,
  PlayerLogoutPacket,
  PlayerStatePacket,
  CreaturePropertyPacket,
  ReadTextPacket,
  ServerErrorPacket,
  ServerStatePacket,
  ServerMessagePacket,
  SpellAddPacket,
  SpellCastPacket,
  StringCreaturePropertyPacket,
  TargetPacket,
  TilePacket,
  ToggleConditionPacket,
  WorldTimePacket,
};
