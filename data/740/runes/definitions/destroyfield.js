const Position = requireModule("utils/position");

module.exports = function destroyField(source, target) {

  /*
   * function suddenDeath
   * Code that handles the sudden death rune
   */

  let item;

  // Target can be a tile (has peekItem) or the item itself
  if (typeof target.peekItem === "function") {
    item = target.peekItem(0xFF);
  } else {
    // Assume target is the item itself
    item = target;
  }

  if (item === null) {
    return process.gameServer.world.sendMagicEffect(source.position, CONST.EFFECT.MAGIC.POFF);
  }

  if (!item.getPrototype().isMagicField()) {
    return process.gameServer.world.sendMagicEffect(source.position, CONST.EFFECT.MAGIC.POFF);
  }

  item.remove();

  process.gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.POFF);

  return true;

}
