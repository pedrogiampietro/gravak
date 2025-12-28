# 📏 Convenções de Código

## Estrutura de Arquivos

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos JS | `kebab-case.js` | `npc-conversation-handler.js` |
| Arquivos JSON | `kebab-case.json` ou `nome.json` | `rat.json`, `definitions.json` |
| Classes | `PascalCase` | `GameServer`, `NPC`, `Monster` |
| Funções | `camelCase` | `handleActionWander`, `decreaseHealth` |
| Constantes | `UPPER_SNAKE_CASE` | `GLOBAL_COOLDOWN`, `MAX_HEALTH` |

---

## Padrões de Código

### Módulos

Sempre use `requireModule` para imports internos:

```javascript
// ✅ Correto
const Creature = requireModule("entities/creature");
const { HealthPacket } = requireModule("network/protocol");

// ❌ Incorreto
const Creature = require("../../entities/creature");
```

### Classes (Prototype Pattern)

O projeto usa o padrão prototype-based ao invés de ES6 classes:

```javascript
// Definição da classe
const Monster = function(cid, data) {
    Creature.call(this, data.creatureStatistics);
    this.experience = data.experience;
};

// Herança
Monster.prototype = Object.create(Creature.prototype);
Monster.prototype.constructor = Monster;

// Métodos
Monster.prototype.getExperience = function() {
    return this.experience;
};

// Export
module.exports = Monster;
```

### Funções com Comentários

Toda função deve ter um comentário explicando seu propósito:

```javascript
Monster.prototype.createCorpse = function() {

    /*
     * Function Monster.createCorpse
     * Creates a corpse when the monster dies
     */

    // ... código
};
```

---

## Estrutura de Dados

### Definições JSON

#### Monstros (`data/740/monsters/definitions/*.json`)

```json
{
    "creatureStatistics": {
        "name": "Rat",
        "health": 20,
        "maxHealth": 20,
        "mana": 0,
        "maxMana": 0,
        "speed": 67,
        "attack": 8,
        "attackSpeed": 2000,
        "defense": 1,
        "outfit": { "id": 21 },
        "armor": 1
    },
    "experience": 5,
    "corpse": 2813,
    "behaviour": {
        "type": 2,
        "fleeHealth": 5
    },
    "attacks": [...],
    "loot": [...],
    "flags": {...}
}
```

#### NPCs (`data/740/npcs/definitions/*.json`)

```json
{
    "creatureStatistics": {
        "name": "Obi",
        "health": 100,
        "maxHealth": 100,
        "outfit": {
            "id": 131,
            "details": { "head": 95, "body": 86, "legs": 121, "feet": 115 }
        }
    },
    "behaviour": {
        "wanderRange": 2,
        "openDoors": true
    },
    "conversation": {
        "hearingRange": 5,
        "keywords": { ... },
        "trade": { ... },
        "script": "obi.js"
    }
}
```

---

## Scripts

### Actions (`data/740/actions/definitions/*.js`)

```javascript
const Condition = requireModule("combat/condition");

module.exports = function actionName(player, thing, index, item) {
    // player: jogador que usou o item
    // thing: container ou tile onde o item está
    // index: índice do item no container
    // item: o item usado

    // Retorne false se a action falhar
    return true;
};
```

### Spells (`data/740/spells/definitions/*.js`)

```javascript
const Condition = requireModule("combat/condition");

module.exports = function spellName(properties) {
    // "this" é o jogador que castou
    
    this.addCondition(Condition.prototype.HEALING, 5, 10);
    
    // Retorne um número para animação, ou false para falha
    return 100;
};
```

### Runes (`data/740/runes/definitions/*.js`)

```javascript
module.exports = function runeName(source, target) {
    // source: jogador que usou a runa
    // target: tile alvo
    
    // Lógica da runa
    target.addItem(process.gameServer.database.createThing(1487));
    
    return true;
};
```

### NPC Scripts (`data/740/npcs/definitions/script/*.js`)

```javascript
module.exports = function npcName() {
    // "this" é o NPC
    
    this.setBaseState(baseTalkState);
    
    // Event handlers
    this.on("focus", player => this.say("Hello, %s!".format(player.name)));
    this.on("defocus", player => this.say("Goodbye!"));
    this.on("exit", player => this.say("Come back!"));
    this.on("regreet", player => this.say("Yes?"));
    this.on("idle", player => this.say("Hello?"));
    this.on("busy", (focus, player) => this.privateSay(player, "Wait..."));
};

function baseTalkState(state, player, message) {
    switch (message) {
        case "trade":
            this.tradeHandler.openTradeWindow(player);
            return this.respond("Here are my offers.");
        case "job":
            return this.respond("I am a shopkeeper.");
    }
}
```

---

## Commits

Use mensagens descritivas em inglês:

```
feat: add new spell "Fire Wave"
fix: correct gold calculation in trade
refactor: simplify monster behaviour logic
docs: update NPC creation workflow
```
