const Condition = requireModule("combat/condition");

module.exports = function intenseHealing(properties) {

    /*
     * Spell: Intense Healing (exura gran)
     * Level: 11 | Mana: 40
     * Heals 50-100 HP
     */

    // Calculate healing amount (base + level bonus)
    let minHeal = 50 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 1.5);
    let maxHeal = 100 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 2);
    let healAmount = Number.prototype.random(minHeal, maxHeal);

    // Apply healing
    this.increaseHealth(healAmount);

    // Visual effect
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.MAGIC_BLUE);

    return 40; // Mana cost

}
