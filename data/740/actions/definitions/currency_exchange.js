module.exports = function currencyExchange(player, tile, index, item) {

    /*
     * Function currencyExchange
     * Exchanges currency logic (Gold <-> Platinum <-> Crystal)
     * 
     * Arguments:
     *   player - the player executing the action
     *   tile - actually "packet.which", can be a Tile or Container/Equipment
     *   index - the index of the item within the container/tile
     *   item - the item being used
     */

    const ID_GOLD = 2148;
    const ID_PLATINUM = 2152;
    const ID_CRYSTAL = 2160;

    // Helper to create and set count
    const createMoney = function (id, count) {
        let money = process.gameServer.database.createThing(id);
        money.setCount(count);
        return money;
    }

    // Helper to safely exchange items: remove old, add new at same position
    const exchangeItem = function (container, itemIndex, oldItem, newItem) {
        // Remove the old item completely
        container.removeIndex(itemIndex, oldItem.count);

        // Add the new item at the same index
        container.addThing(newItem, itemIndex);
    }

    // Helper to add extra money to container
    const addExtraMoney = function (container, money) {
        if (container.constructor.name === "Tile") {
            container.addTopThing(money);
        } else if (container.addFirstEmpty) {
            container.addFirstEmpty(money);
        } else if (container.addThing) {
            container.addThing(money);
        }
    }

    // Determine the container holding this item
    // 'tile' argument is actually 'packet.which' from handleItemUse
    let container = tile;

    // 1. Gold -> Platinum (100 gold = 1 platinum)
    if (item.id === ID_GOLD) {
        if (item.count === 100) {
            let platinum = createMoney(ID_PLATINUM, 1);
            exchangeItem(container, index, item, platinum);
        }
        // If less than 100, do nothing (or show message)
    }

    // 2. Platinum -> Crystal OR Gold
    else if (item.id === ID_PLATINUM) {
        if (item.count === 100) {
            // Upgrade: 100 platinum = 1 crystal
            let crystal = createMoney(ID_CRYSTAL, 1);
            exchangeItem(container, index, item, crystal);
        } else {
            // Downgrade: 1 platinum = 100 gold
            if (item.count === 1) {
                let gold = createMoney(ID_GOLD, 100);
                exchangeItem(container, index, item, gold);
            } else {
                // Decrement the stack and add 100 gold separately
                item.setCount(item.count - 1);
                let gold = createMoney(ID_GOLD, 100);
                addExtraMoney(container, gold);
            }
        }
    }

    // 3. Crystal -> Platinum (1 crystal = 100 platinum)
    else if (item.id === ID_CRYSTAL) {
        if (item.count === 1) {
            let platinum = createMoney(ID_PLATINUM, 100);
            exchangeItem(container, index, item, platinum);
        } else {
            // Decrement the stack and add 100 platinum separately
            item.setCount(item.count - 1);
            let platinum = createMoney(ID_PLATINUM, 100);
            addExtraMoney(container, platinum);
        }
    }

}
