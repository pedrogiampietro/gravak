/**
 * Special Lever Handler
 * Handles levers with specific actionIds to perform custom actions
 * 
 * Usage: Set actionId on a lever in RME (Remere's Map Editor)
 * ActionId 50001: Creates/removes a bridge (toggle)
 */

// Track lever states (on/off) by position key
const leverBridgeStates = new Map();

// Configuration for special levers by actionId
const specialLevers = {
    // ActionId 50001: Bridge toggle
    50001: {
        bridges: [
            {
                x: 32100, y: 32205, z: 7,
                bridgeItemId: 405,
                borderItemId: 508
            },
            {
                x: 32101, y: 32205, z: 7,
                bridgeItemId: 405,
                borderItemId: 509
            }
        ],
        effectCreate: CONST.EFFECT.MAGIC.MAGIC_GREEN,
        effectRemove: CONST.EFFECT.MAGIC.POFF,
        messageCreate: "A bridge appears!",
        messageRemove: "The bridge disappears!"
    }
};

// Lever toggle mapping (on/off states)
const leverStates = {
    1945: 1946,
    1946: 1945
};

function getPositionKey(tile) {
    return `${tile.position.x}_${tile.position.y}_${tile.position.z}`;
}

function handleBridgeLever(player, tile, item, config) {
    const posKey = getPositionKey(tile);
    const bridgeExists = leverBridgeStates.get(posKey) || false;

    if (!bridgeExists) {
        // Create bridge
        for (const bridgeDef of config.bridges) {
            const pos = { x: bridgeDef.x, y: bridgeDef.y, z: bridgeDef.z };
            const targetTile = process.gameServer.world.getTileFromWorldPosition(pos);

            if (targetTile) {
                // Remove border items if they exist
                const items = targetTile.getItems();
                for (let i = items.length - 1; i >= 0; i--) {
                    if (items[i].id === bridgeDef.borderItemId) {
                        items[i].delete();
                    }
                }

                // Replace tile or add item on top
                if (targetTile.id === bridgeDef.borderItemId) {
                    targetTile.replace(bridgeDef.bridgeItemId);
                } else {
                    const bridgeItem = process.gameServer.database.createThing(bridgeDef.bridgeItemId);
                    targetTile.addTopThing(bridgeItem);
                }

                if (config.effectCreate !== undefined) {
                    process.gameServer.world.sendMagicEffect(pos, config.effectCreate);
                }
            }
        }

        leverBridgeStates.set(posKey, true);
        if (config.messageCreate) {
            player.sendCancelMessage(config.messageCreate);
        }

    } else {
        // Remove bridge
        for (const bridgeDef of config.bridges) {
            const pos = { x: bridgeDef.x, y: bridgeDef.y, z: bridgeDef.z };
            const targetTile = process.gameServer.world.getTileFromWorldPosition(pos);

            if (targetTile) {
                // Remove bridge items
                const items = targetTile.getItems();
                for (let i = items.length - 1; i >= 0; i--) {
                    if (items[i].id === bridgeDef.bridgeItemId) {
                        items[i].delete();
                    }
                }

                // Restore original tile or add border item
                if (targetTile.id === bridgeDef.bridgeItemId) {
                    targetTile.replace(bridgeDef.borderItemId);
                } else {
                    const borderItem = process.gameServer.database.createThing(bridgeDef.borderItemId);
                    targetTile.addTopThing(borderItem);
                }

                if (config.effectRemove !== undefined) {
                    process.gameServer.world.sendMagicEffect(pos, config.effectRemove);
                }
            }
        }

        leverBridgeStates.set(posKey, false);
        if (config.messageRemove) {
            player.sendCancelMessage(config.messageRemove);
        }
    }
}

module.exports = function handleSpecialLever(player, tile, index, item) {
    if (player.isMoving()) {
        return player.sendCancelMessage("You can't do that while moving.");
    }

    if (!player.isBesidesThing(tile)) {
        return player.sendCancelMessage("You have to move closer.");
    }

    const actionId = item.actionId;

    if (actionId && specialLevers.hasOwnProperty(actionId)) {
        const config = specialLevers[actionId];
        if (actionId === 50001) {
            handleBridgeLever(player, tile, item, config);
        }
    }

    // Toggle lever state
    if (leverStates.hasOwnProperty(item.id)) {
        const newLeverId = leverStates[item.id];
        const newLever = process.gameServer.database.createThing(newLeverId);

        if (actionId) {
            newLever.setActionId(actionId);
        }

        item.replace(newLever);
        process.gameServer.world.sendMagicEffect(tile.position, CONST.EFFECT.MAGIC.POFF);
    }

    return true;
};
