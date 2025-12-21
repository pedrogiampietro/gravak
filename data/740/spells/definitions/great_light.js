const Condition = requireModule("combat/condition");

module.exports = function greatLight(properties) {

    /*
     * Spell: Great Light (utevo gran lux)
     * Level: 13 | Mana: 60
     * Creates a bright light around the caster
     */

    // Apply light condition with higher intensity
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_BLUE);
    this.addCondition(Condition.prototype.LIGHT, 8, 400); // Level 8 light, longer duration

    return 60; // Mana cost

}
