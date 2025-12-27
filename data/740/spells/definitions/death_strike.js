module.exports = function deathStrike(properties) {

    /*
     * Spell: Death Strike (exori mort)
     * Level: 16 | Mana: 20
     * Deals death damage to target in front
     */

    // Get creature in front based on direction
    let direction = this.getProperty(CONST.PROPERTIES.DIRECTION);
    let targetPosition = this.position.getPositionFromDirection(direction);

    if (targetPosition === null) {
        return 0;
    }

    let targetTile = process.gameServer.world.getTileFromWorldPosition(targetPosition);

    if (targetTile === null) {
        return 0;
    }

    let target = targetTile.getCreature();

    if (target === null) {
        // MORTAREA effect is ID 18
        process.gameServer.world.sendMagicEffect(targetPosition, CONST.EFFECT.MAGIC.MORTAREA);
        return 20;
    }

    // Calculate damage
    let minDamage = 10 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 0.5);
    let maxDamage = 30 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 1);
    let damage = Number.prototype.random(minDamage, maxDamage);

    // Deal damage
    target.decreaseHealth(this, damage);

    // Visual effects - MORTAREA effect is ID 18
    process.gameServer.world.sendMagicEffect(targetPosition, CONST.EFFECT.MAGIC.MORTAREA);

    return 20; // Mana cost

}
