module.exports = function energyBeam(properties) {

    /*
     * Spell: Energy Beam (exevo vis lux)
     * Level: 23 | Mana: 100
     * Deals energy damage in a line in front of caster
     */

    const direction = this.getProperty(CONST.PROPERTIES.DIRECTION);

    // Beam pattern offsets based on direction (7 tiles)
    const beamOffsets = {
        [CONST.DIRECTION.NORTH]: [
            { x: 0, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -3 }, { x: 0, y: -4 }, { x: 0, y: -5 }, { x: 0, y: -6 }, { x: 0, y: -7 }
        ],
        [CONST.DIRECTION.SOUTH]: [
            { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }
        ],
        [CONST.DIRECTION.EAST]: [
            { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }
        ],
        [CONST.DIRECTION.WEST]: [
            { x: -1, y: 0 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: -5, y: 0 }, { x: -6, y: 0 }, { x: -7, y: 0 }
        ]
    };

    const offsets = beamOffsets[direction] || beamOffsets[CONST.DIRECTION.NORTH];

    // Calculate damage
    let minDamage = 50 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 1.5);
    let maxDamage = 100 + Math.floor(this.skills.getSkillLevel(CONST.PROPERTIES.MAGIC) * 2.5);

    offsets.forEach(offset => {
        let targetPosition = this.position.addVector(offset.x, offset.y, 0);
        let targetTile = process.gameServer.world.getTileFromWorldPosition(targetPosition);

        if (targetTile === null) {
            return;
        }

        // Visual effect
        process.gameServer.world.sendMagicEffect(targetPosition, CONST.EFFECT.MAGIC.ENERGYHIT);

        let target = targetTile.getCreature();
        if (target !== null && target !== this) {
            let damage = Number.prototype.random(minDamage, maxDamage);
            target.decreaseHealth(this, damage);
        }
    });

    return 100; // Mana cost

}
