const Condition = requireModule("combat/condition");

module.exports = function antidote(properties) {

    /*
     * Spell: Antidote (exana pox)
     * Level: 10 | Mana: 30
     * Removes poison condition
     */

    // Remove poison condition
    this.removeCondition(Condition.prototype.POISON);

    // Visual effect
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_BLUE);

    return 30; // Mana cost

}
