const Condition = requireModule("combat/condition");

module.exports = function strongHaste(properties) {

    /*
     * Spell: Strong Haste (utani gran hur)
     * Level: 20 | Mana: 100
     * Increases movement speed significantly
     */

    // Apply strong haste condition (faster than regular haste)
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_GREEN);
    this.addCondition(Condition.prototype.HASTE, 2, 100); // Strength 2 = stronger

    return 100; // Mana cost

}
