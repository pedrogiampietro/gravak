const fs = require('fs');
const path = require('path');

const definitionsPath = path.join(__dirname, '../data/740/items/definitions.json');
const rawData = fs.readFileSync(definitionsPath, 'utf8');
const definitions = JSON.parse(rawData);

let count = 0;
const runeIds = [];

for (const id in definitions) {
    const item = definitions[id];
    if (item.properties && item.properties.type === 'rune') {
        item.properties.stackable = true;
        runeIds.push(id);
        count++;
    }
}

fs.writeFileSync(definitionsPath, JSON.stringify(definitions, null, 4));

console.log(`Updated ${count} runes to be stackable.`);
console.log('Rune IDs:', runeIds.join(', '));
