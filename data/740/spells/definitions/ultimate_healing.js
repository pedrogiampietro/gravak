const Condition = requireModule("combat/condition");

module.exports = function ultimateHealing(properties) {

    /*
     * Spell: Ultimate Healing (exura vita)
     * Level: 20 | Mana: 160
     * Heals 200-400 HP
     */

    // Calculate healing amount (base + level bonus)
    let minHeal = 200 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 3);
    let maxHeal = 400 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 5);
    let healAmount = Number.prototype.random(minHeal, maxHeal);

    // Apply healing
    this.increaseHealth(healAmount);

    // Visual effect
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_BLUE);

    return 160; // Mana cost

}
