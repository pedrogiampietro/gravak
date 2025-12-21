module.exports = function flameStrike(properties) {

    /*
     * Spell: Flame Strike (exori flam)
     * Level: 12 | Mana: 20
     * Deals fire damage to target in front
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
        process.gameServer.world.sendMagicEffect(targetPosition, CONST.EFFECT.MAGIC.HITBYFIRE);
        return 20;
    }

    // Calculate damage
    let minDamage = 10 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 0.5);
    let maxDamage = 30 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 1);
    let damage = Number.prototype.random(minDamage, maxDamage);

    // Deal damage
    target.decreaseHealth(this, damage);

    // Visual effects
    process.gameServer.world.sendMagicEffect(targetPosition, CONST.EFFECT.MAGIC.HITBYFIRE);

    return 20; // Mana cost

}
