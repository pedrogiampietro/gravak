const Condition = requireModule("combat/condition");

module.exports = function magicShield(properties) {

    /*
     * Spell: Magic Shield (utamo vita)
     * Level: 14 | Mana: 50
     * Damage is absorbed by mana instead of health
     */

    // Apply magic shield condition
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_BLUE);
    this.addCondition(Condition.prototype.MAGIC_SHIELD, 1, 200); // Duration ~200 ticks

    return 50; // Mana cost

}
