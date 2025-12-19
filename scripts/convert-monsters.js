/**
 * Monster XML to JSON Converter
 * Converts all XML monster files from /monsters to JSON format in /data/740/monsters/definitions
 */

const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

const MONSTERS_XML_DIR = path.join(__dirname, '..', 'monsters');
const MONSTERS_JSON_DIR = path.join(__dirname, '..', 'data', '740', 'monsters', 'definitions');
const DEFINITIONS_FILE = path.join(__dirname, '..', 'data', '740', 'monsters', 'definitions.json');

// Race to fluidType mapping
const RACE_TO_FLUID = {
    'blood': 1,
    'undead': 2,
    'fire': 0,
    'venom': 3,
    'energy': 4,
    'default': 0
};

// Corpse ID mapping for 740 version (monster name -> corpse ID)
// These IDs are from 740-items.xml
const CORPSE_MAP = {
    'rat': 2813,
    'cave rat': 2813,
    'troll': 2806,
    'frost troll': 2806,
    'swamp troll': 2806,
    'island troll': 2806,
    'spider': 2807,
    'poison spider': 2822,
    'giant spider': 2857,
    'tarantula': 2857,
    'cyclops': 2808,
    'skeleton': 2843,
    'skeleton warrior': 2843,
    'snake': 2817,
    'cobra': 2817,
    'orc': 2820,
    'orc spearman': 2820,
    'orc warrior': 2860,
    'orc berserker': 2860,
    'orc leader': 2860,
    'orc shaman': 2860,
    'orc warlord': 2860,
    'rotworm': 2824,
    'carrion worm': 2824,
    'wolf': 2826,
    'war wolf': 2826,
    'winter wolf': 2826,
    'minotaur': 2830,
    'minotaur guard': 2866,
    'minotaur mage': 2871,
    'minotaur archer': 2876,
    'deer': 2835,
    'dog': 2839,
    'dragon': 2844,
    'dragon lord': 2881,
    'ghoul': 2846,
    'bear': 2849,
    'lion': 2889,
    'scorpion': 2897,
    'wasp': 2899,
    'bug': 2902,
    'sheep': 2905,
    'black sheep': 2905,
    'beholder': 2908,
    'fire devil': 2886,
    'demon': 2916,
    'slime': 2963,
    'rabbit': 3008,
    'pig': 2909, // placeholder
    'chicken': 2909, // placeholder
    'cat': 2909, // placeholder
    'default': 2813 // fallback to dead rat
};

// Item name to ID mapping for 740 version (for loot conversion)
// These IDs are from 740-items.xml
const ITEM_MAP = {
    // Currency
    'gold coin': 2148,
    'platinum coin': 2152,
    'crystal coin': 2160,

    // Gems
    'small ruby': 2147,
    'small emerald': 2149,
    'small amethyst': 2150,
    'small diamond': 2145,
    'small sapphire': 2146,
    'small topaz': 2144,
    'ruby': 2156,
    'emerald': 2153,
    'sapphire': 2158,
    'talon': 2151,
    'red gem': 2156,
    'blue gem': 2158,
    'green gem': 2153,
    'yellow gem': 2155,

    // Food
    'meat': 2666,
    'ham': 2671,
    'dragon ham': 2672,
    'bread': 2689,
    'cheese': 2696,
    'fish': 2667,
    'apple': 2674,
    'orange': 2675,
    'banana': 2676,
    'grape': 2681,
    'cherry': 2679,
    'cookie': 2687,
    'egg': 2695,
    'carrot': 2684,
    'blueberry': 2677,

    // Mushrooms
    'white mushroom': 2787,
    'red mushroom': 2788,
    'brown mushroom': 2789,
    'orange mushroom': 2790,
    'fire mushroom': 2795,

    // Potions
    'mana potion': 2268,
    'health potion': 2269,
    'great mana potion': 2273,
    'great health potion': 2274,
    'strong mana potion': 2270,
    'strong health potion': 2271,

    // Weapons - Swords
    'sword': 2376,
    'two handed sword': 2377,
    'short sword': 2406,
    'sabre': 2385,
    'rapier': 2384,
    'longsword': 2397,
    'broad sword': 2389,
    'fire sword': 2392,
    'magic sword': 2400,
    'giant sword': 2393,
    'serpent sword': 2409,
    'spike sword': 2383,
    'bright sword': 2407,
    'ice rapier': 2396,
    'carlin sword': 2395,

    // Weapons - Axes
    'axe': 2386,
    'hatchet': 2388,
    'battle axe': 2378,
    'double axe': 2387,
    'halberd': 2381,
    'fire axe': 2432,
    'stonecutter axe': 2431,
    'knight axe': 2430,
    'guardian halberd': 2427,

    // Weapons - Clubs
    'club': 2382,
    'mace': 2398,
    'morning star': 2394,
    'clerical mace': 2423,
    'war hammer': 2391,
    'skull staff': 2436,
    'wand of inferno': 2187,
    'wand of decay': 2188,
    'wand of cosmic energy': 2189,

    // Weapons - Distance
    'bow': 2456,
    'crossbow': 2455,
    'arrow': 2544,
    'bolt': 2543,
    'poison arrow': 2545,
    'burst arrow': 2546,
    'power bolt': 2547,
    'throwing star': 2399,
    'throwing knife': 2410,
    'spear': 2389,

    // Armor
    'leather armor': 2467,
    'chain armor': 2464,
    'brass armor': 2465,
    'plate armor': 2463,
    'knight armor': 2476,
    'crown armor': 2487,
    'golden armor': 2466,
    'magic plate armor': 2472,
    'scale armor': 2483,

    // Helmets
    'leather helmet': 2461,
    'chain helmet': 2458,
    'brass helmet': 2460,
    'iron helmet': 2459,
    'steel helmet': 2457,
    'viking helmet': 2473,
    'devil helmet': 2462,
    'crown helmet': 2491,
    'crusader helmet': 2497,
    'warrior helmet': 2475,

    // Legs
    'leather legs': 2649,
    'chain legs': 2648,
    'brass legs': 2478,
    'plate legs': 2647,
    'crown legs': 2488,
    'knight legs': 2477,
    'golden legs': 2470,

    // Boots
    'leather boots': 2643,
    'steel boots': 2645,
    'bunny slippers': 2644,
    'patched boots': 2641,
    'boots of haste': 2195,

    // Shields
    'wooden shield': 2512,
    'brass shield': 2511,
    'plate shield': 2510,
    'battle shield': 2513,
    'dragon shield': 2516,
    'tower shield': 2528,
    'guardian shield': 2515,
    'demon shield': 2520,
    'mastermind shield': 2514,
    'vampire shield': 2534,
    'blessed shield': 2523,
    'crown shield': 2519,
    'medusa shield': 2536,
    'amazon shield': 2535,

    // Rings and Amulets
    'gold ring': 2179,
    'silver ring': 2177,
    'platinum amulet': 2171,
    'gold amulet': 2172,
    'silver amulet': 2170,
    'ring of healing': 2214,
    'stealth ring': 2165,
    'might ring': 2164,
    'time ring': 2166,
    'life ring': 2168,
    'energy ring': 2167,
    'power ring': 2169,
    'sword ring': 2207,
    'axe ring': 2208,
    'club ring': 2209,

    // Runes
    'blank rune': 2260,
    'sudden death rune': 2268,
    'heavy magic missile rune': 2311,
    'explosion rune': 2313,
    'fireball rune': 2302,
    'great fireball rune': 2303,
    'fire bomb rune': 2305,
    'fire wall rune': 2303,
    'fire field rune': 2301,
    'energy bomb rune': 2262,
    'energy wall rune': 2279,
    'paralyze rune': 2278,
    'ultimate healing rune': 2273,
    'intense healing rune': 2265,

    // Monster parts
    'wolf paw': 2413,
    'minotaur horn': 2182,
    'minotaur leather': 2184,
    'dragon scale': 2218,
    'hardened bone': 2221,
    'bone': 2230,
    'skull': 2229,
    'orc tooth': 2186,
    'orcish axe': 2428,
    'cyclops toe': 2203,
    'spider silk': 2219,

    // Miscellaneous
    'torch': 2050,
    'key': 2088,
    'bag': 1987,
    'backpack': 1988,
    'rope': 2120,
    'shovel': 2554,
    'pick': 2553,
    'fishing rod': 2580,
    'worm': 2575,
    'letter': 2597,
    'scroll': 2814,
    'book': 1973,
    'document': 1968,
    'parchment': 2817,
    'magic light wand': 2163,

    // Trophy items
    'demon trophy': 2373,
    'dragon trophy': 2374,
    'lion trophy': 2375,
    'wolf trophy': 2370
};

/**
 * Parse attack/spell from XML
 */
function parseAttack(attack) {
    const attrs = attack.$ || {};
    const result = {
        name: attrs.name || 'melee',
        interval: parseInt(attrs.interval) || 2000,
        chance: attrs.chance ? parseFloat(attrs.chance) / 100 : 1,
        min: attrs.min ? Math.abs(parseInt(attrs.min)) : 0,
        max: attrs.max ? Math.abs(parseInt(attrs.max)) : 0
    };

    // Optional fields
    if (attrs.range) result.range = parseInt(attrs.range);
    if (attrs.radius) result.radius = parseInt(attrs.radius);
    if (attrs.length) result.length = parseInt(attrs.length);
    if (attrs.spread) result.spread = parseInt(attrs.spread);
    if (attrs.target) result.target = attrs.target === '1';
    if (attrs.speedchange) result.speedChange = parseInt(attrs.speedchange);
    if (attrs.duration) result.duration = parseInt(attrs.duration);

    // Parse attributes (shootEffect, areaEffect)
    if (attack.attribute) {
        attack.attribute.forEach(attr => {
            const key = attr.$.key;
            const value = attr.$.value;
            if (key === 'shootEffect') result.shootEffect = value;
            if (key === 'areaEffect') result.areaEffect = value;
        });
    }

    return result;
}

/**
 * Parse defense spell from XML
 */
function parseDefense(defense) {
    const attrs = defense.$ || {};
    const result = {
        name: attrs.name || 'defense',
        interval: parseInt(attrs.interval) || 2000,
        chance: attrs.chance ? parseFloat(attrs.chance) / 100 : 1
    };

    if (attrs.min) result.min = Math.abs(parseInt(attrs.min));
    if (attrs.max) result.max = Math.abs(parseInt(attrs.max));
    if (attrs.speedchange) result.speedChange = parseInt(attrs.speedchange);
    if (attrs.duration) result.duration = parseInt(attrs.duration);

    // Parse attributes
    if (defense.attribute) {
        defense.attribute.forEach(attr => {
            const key = attr.$.key;
            const value = attr.$.value;
            if (key === 'areaEffect') result.areaEffect = value;
        });
    }

    return result;
}

/**
 * Parse loot item from XML
 */
function parseLootItem(item) {
    const attrs = item.$ || {};

    // Get the item ID - first try from id attribute, then from ITEM_MAP using name
    let itemId = parseInt(attrs.id);
    const itemName = (attrs.name || '').toLowerCase();

    // If id is null/NaN, try to get from ITEM_MAP
    if (isNaN(itemId) || !itemId) {
        itemId = ITEM_MAP[itemName];
    }

    // If still not found, skip this item
    if (!itemId) {
        console.warn(`  ⚠️  Unknown item: "${attrs.name}" - skipping`);
        return null;
    }

    const result = {
        id: itemId,
        probability: attrs.chance ? parseFloat(attrs.chance) / 100000 : 0
    };

    if (attrs.name) result.name = attrs.name;
    if (attrs.countmax) {
        result.min = 1;
        result.max = parseInt(attrs.countmax);
    }

    return result;
}

/**
 * Parse flags from XML
 */
function parseFlags(flags) {
    const result = {};
    if (!flags || !flags.flag) return result;

    flags.flag.forEach(flag => {
        const attrs = flag.$ || {};
        Object.keys(attrs).forEach(key => {
            result[key] = attrs[key] === '1' ? true : (attrs[key] === '0' ? false : parseInt(attrs[key]));
        });
    });

    return result;
}

/**
 * Parse elements (resistances) from XML
 */
function parseElements(elements) {
    const result = {};
    if (!elements || !elements.element) return result;

    elements.element.forEach(el => {
        const attrs = el.$ || {};
        Object.keys(attrs).forEach(key => {
            // Convert "firePercent" to "fire"
            const elementName = key.replace('Percent', '');
            result[elementName] = parseInt(attrs[key]);
        });
    });

    return result;
}

/**
 * Parse immunities from XML
 */
function parseImmunities(immunities) {
    const result = {};
    if (!immunities || !immunities.immunity) return result;

    immunities.immunity.forEach(imm => {
        const attrs = imm.$ || {};
        Object.keys(attrs).forEach(key => {
            result[key] = attrs[key] === '1';
        });
    });

    return result;
}

/**
 * Parse summons from XML
 */
function parseSummons(summons) {
    const result = [];
    if (!summons) return result;

    const maxSummons = summons.$ ? parseInt(summons.$.maxSummons) || 1 : 1;

    if (summons.summon) {
        summons.summon.forEach(s => {
            const attrs = s.$ || {};
            result.push({
                name: attrs.name,
                interval: parseInt(attrs.interval) || 2000,
                chance: attrs.chance ? parseFloat(attrs.chance) / 100 : 1,
                maxSummons
            });
        });
    }

    return result;
}

/**
 * Parse voices/sayings from XML
 */
function parseVoices(voices) {
    const result = {
        texts: [],
        slowness: 300,
        chance: 0.1
    };

    if (!voices) return null;

    const attrs = voices.$ || {};
    if (attrs.interval) result.slowness = parseInt(attrs.interval) / 1000;
    if (attrs.chance) result.chance = parseFloat(attrs.chance) / 100;

    if (voices.voice) {
        voices.voice.forEach(v => {
            if (v.$ && v.$.sentence) {
                result.texts.push(v.$.sentence);
            }
        });
    }

    return result.texts.length > 0 ? result : null;
}

/**
 * Convert a single monster XML to JSON
 */
function convertMonster(xmlData) {
    const monster = xmlData.monster;
    if (!monster) return null;

    const attrs = monster.$ || {};
    const health = monster.health ? monster.health[0].$ : {};
    const look = monster.look ? monster.look[0].$ : {};
    const flags = parseFlags(monster.flags ? monster.flags[0] : null);

    // Determine behaviour type (numbers match MonsterBehaviour prototype)
    // 0 = NEUTRAL, 1 = FRIENDLY, 2 = HOSTILE, 3 = HOSTILE_ON_ATTACK, 4 = RANGED, 5 = FLEEING
    const behaviourType = flags.hostile === true ? 2 : 0;

    // Get monster name for corpse lookup
    const monsterName = (attrs.name || 'Unknown').toLowerCase();

    // Find the best matching corpse ID from CORPSE_MAP
    let corpseId = CORPSE_MAP[monsterName];
    if (!corpseId) {
        // Try partial matches (e.g., "frost troll" matches "troll")
        for (const [key, value] of Object.entries(CORPSE_MAP)) {
            if (monsterName.includes(key) || key.includes(monsterName)) {
                corpseId = value;
                break;
            }
        }
    }
    if (!corpseId) {
        corpseId = CORPSE_MAP['default'];
    }

    // Build the JSON structure
    const result = {
        creatureStatistics: {
            name: attrs.name || 'Unknown',
            health: parseInt(health.now) || 0,
            maxHealth: parseInt(health.max) || parseInt(health.now) || 0,
            mana: 0,
            maxMana: 0,
            speed: parseInt(attrs.speed) || 100,
            attack: 0,  // Will be set from attacks array
            attackSpeed: 2000,  // Default attack speed
            defense: 0,  // Will be overwritten if defenses exist
            outfit: {
                id: parseInt(look.type) || parseInt(attrs.raceId) || 0
            }
        },
        experience: parseInt(attrs.experience) || 0,
        corpse: corpseId,
        fluidType: RACE_TO_FLUID[attrs.race] || RACE_TO_FLUID['default'],
        behaviour: {
            type: behaviourType,
            fleeHealth: flags.runonhealth || 0,
            openDoors: flags.canpushitems === true,
            senseInvisible: flags.staticattack ? false : true
        }
    };

    // Parse defenses (armor, defense values)
    if (monster.defenses && monster.defenses[0]) {
        const defAttrs = monster.defenses[0].$ || {};
        result.creatureStatistics.armor = parseInt(defAttrs.armor) || 0;
        result.creatureStatistics.defense = parseInt(defAttrs.defense) || 0;

        // Parse defense spells (healing, speed buffs, etc.)
        if (monster.defenses[0].defense) {
            result.defenseSpells = monster.defenses[0].defense.map(parseDefense);
        }
    }

    // Parse attacks
    if (monster.attacks && monster.attacks[0] && monster.attacks[0].attack) {
        result.attacks = monster.attacks[0].attack.map(parseAttack);

        // Set attack property from melee attack max damage
        const meleeAttack = result.attacks.find(a => a.name === 'melee');
        if (meleeAttack) {
            result.creatureStatistics.attack = meleeAttack.max || 0;
            result.creatureStatistics.attackSpeed = meleeAttack.interval || 2000;
        }
    }

    // Parse elements (resistances)
    if (monster.elements && monster.elements[0]) {
        result.elements = parseElements(monster.elements[0]);
    }

    // Parse immunities
    if (monster.immunities && monster.immunities[0]) {
        result.immunities = parseImmunities(monster.immunities[0]);
    }

    // Parse summons
    if (monster.summons && monster.summons[0]) {
        result.summons = parseSummons(monster.summons[0]);
    }

    // Parse voices/sayings
    const sayings = parseVoices(monster.voices ? monster.voices[0] : null);
    if (sayings) {
        result.sayings = sayings;
    }

    // Parse loot
    if (monster.loot && monster.loot[0] && monster.loot[0].item) {
        result.loot = monster.loot[0].item.map(parseLootItem).filter(item => item !== null);
    }

    // Add flags for additional info
    result.flags = {
        summonable: flags.summonable === true,
        attackable: flags.attackable === true,
        convinceable: flags.convinceable === true,
        pushable: flags.pushable === true,
        canPushItems: flags.canpushitems === true,
        canPushCreatures: flags.canpushcreatures === true,
        illusionable: flags.illusionable === true,
        targetDistance: flags.targetdistance || 1
    };

    return result;
}

/**
 * Sanitize filename for JSON output
 */
function sanitizeFilename(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Main function
 */
async function main() {
    console.log('🔄 Starting Monster XML to JSON Conversion...\n');

    // Ensure output directory exists
    if (!fs.existsSync(MONSTERS_JSON_DIR)) {
        fs.mkdirSync(MONSTERS_JSON_DIR, { recursive: true });
    }

    // Get all XML files
    const xmlFiles = fs.readdirSync(MONSTERS_XML_DIR)
        .filter(f => f.endsWith('.xml'));

    console.log(`📁 Found ${xmlFiles.length} XML files to convert\n`);

    const definitions = {};
    let converted = 0;
    let failed = 0;
    const errors = [];

    for (const xmlFile of xmlFiles) {
        const xmlPath = path.join(MONSTERS_XML_DIR, xmlFile);

        try {
            const xmlContent = fs.readFileSync(xmlPath, 'utf8');

            // Parse XML
            await new Promise((resolve, reject) => {
                parseString(xmlContent, { explicitArray: true }, (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const jsonData = convertMonster(result);
                    if (!jsonData) {
                        reject(new Error('Failed to convert monster data'));
                        return;
                    }

                    // Use source XML filename (without .xml) for JSON filename
                    const baseName = xmlFile.replace('.xml', '').replace(/[^a-z0-9_-]/gi, '_');
                    const jsonFilename = `${baseName}.json`;
                    const jsonPath = path.join(MONSTERS_JSON_DIR, jsonFilename);

                    // Write JSON file
                    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

                    // Add to definitions (use outfit ID as the key)
                    const monsterId = jsonData.creatureStatistics.outfit.id;
                    definitions[monsterId] = jsonFilename;

                    converted++;
                    resolve();
                });
            });

        } catch (err) {
            failed++;
            errors.push(`${xmlFile}: ${err.message}`);
        }
    }

    // Write definitions.json
    fs.writeFileSync(DEFINITIONS_FILE, JSON.stringify(definitions, null, 2));

    console.log('✅ Conversion Complete!\n');
    console.log(`   📊 Converted: ${converted}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📄 Definitions file updated: ${DEFINITIONS_FILE}\n`);

    if (errors.length > 0) {
        console.log('⚠️  Errors:');
        errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
        if (errors.length > 10) {
            console.log(`   ... and ${errors.length - 10} more errors`);
        }
    }
}

main().catch(console.error);
