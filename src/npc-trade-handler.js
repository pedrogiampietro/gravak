"use strict";

const { NPCTradePacket } = requireModule("protocol");

const TradeHandler = function(npc, trade) {

  /*
   * Class TradeHandler
   * Wrapper for NPCs who sell and buy items from players
   */

  this.npc = npc;
  this.trade = trade;

}

TradeHandler.prototype.hasTrades = function() {

  /*
   * Function TradeHandler.hasTrades
   * Returns true if the NPC has trades to make
   */

  return this.trade.items.length !== 0;

}

TradeHandler.prototype.openTradeWindow = function(player) {

  /*
   * Function TradeHandler.openTradeWindow
   * Opens trade window with a friendly NPC
   */

  player.write(new NPCTradePacket(this.npc.guid, this.trade.items));

  // Reset the NPC state
  this.npc.conversationHandler.getFocusHandler().reset();

}

TradeHandler.prototype.getTradeItem = function(index) {

  /*
   * Function TradeHandler.getTradeItem
   * Returns the trade item for a particular index
   */

  // The request trade index is invalid
  if(index < 0 || index >= this.trade.items.length) {
    return null;
  }

  return this.trade[index];

}

module.exports = TradeHandler;
