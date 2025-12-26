/**
 * Lever Action Handler
 * Delegates to special-lever.js for custom actionId handling
 */
const specialLever = require("./special-lever.js");

module.exports = function (player, tile, index, item) {
    return specialLever(player, tile, index, item);
};
