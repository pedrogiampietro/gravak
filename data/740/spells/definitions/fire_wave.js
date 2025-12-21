module.exports = function fireWave(properties) {

    /*
     * Spell: Fire Wave (exevo flam hur)
     * Level: 18 | Mana: 80
     * Deals fire damage in a wave pattern in front of caster
     */

    const direction = this.getProperty(CONST.PROPERTIES.DIRECTION);

    // Wave pattern offsets based on direction
    const waveOffsets = {
        [CONST.DIRECTION.NORTH]: [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -2, y: -2 }, { x: -1, y: -2 }, { x: 0, y: -2 }, { x: 1, y: -2 }, { x: 2, y: -2 },
            { x: -2, y: -3 }, { x: -1, y: -3 }, { x: 0, y: -3 }, { x: 1, y: -3 }, { x: 2, y: -3 }
        ],
        [CONST.DIRECTION.SOUTH]: [
            { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
            { x: -2, y: 2 }, { x: -1, y: 2 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
            { x: -2, y: 3 }, { x: -1, y: 3 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }
        ],
        [CONST.DIRECTION.EAST]: [
            { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
            { x: 2, y: -2 }, { x: 2, y: -1 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
            { x: 3, y: -2 }, { x: 3, y: -1 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }
        ],
        [CONST.DIRECTION.WEST]: [
            { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 },
            { x: -2, y: -2 }, { x: -2, y: -1 }, { x: -2, y: 0 }, { x: -2, y: 1 }, { x: -2, y: 2 },
            { x: -3, y: -2 }, { x: -3, y: -1 }, { x: -3, y: 0 }, { x: -3, y: 1 }, { x: -3, y: 2 }
        ]
    };

    const offsets = waveOffsets[direction] || waveOffsets[CONST.DIRECTION.NORTH];

    // Calculate damage
    let minDamage = 30 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 1);
    let maxDamage = 60 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 2);

    offsets.forEach(offset => {
        let targetPosition = this.position.addVector(offset.x, offset.y, 0);
        let targetTile = process.gameServer.world.getTileFromWorldPosition(targetPosition);

        if (targetTile === null) {
            return;
        }

        // Visual effect
        process.gameServer.world.sendMagicEffect(targetPosition, CONST.EFFECT.MAGIC.HITBYFIRE);

        let target = targetTile.getCreature();
        if (target !== null && target !== this) {
            let damage = Number.prototype.random(minDamage, maxDamage);
            target.decreaseHealth(this, damage);
        }
    });

    return 80; // Mana cost

}
