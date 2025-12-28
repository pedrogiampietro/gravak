---
description: Como adicionar uma nova spell (magia)
---

# ✨ Adicionar uma Spell

Spells são magias que o jogador pode usar através de palavras mágicas no chat.

---

## Passo 1: Criar o Script

Crie um arquivo em `data/740/spells/definitions/NOME_DA_SPELL.js`:

```javascript
// Exemplo: data/740/spells/definitions/minha_spell.js

const Condition = requireModule("combat/condition");

module.exports = function minhaSpell(properties) {

    /*
     * Function minhaSpell
     * Descrição da spell
     *
     * "this" é o jogador que castou a spell
     * @param properties - Propriedades da spell (definidas no JSON)
     */

    // Exemplo: curar o jogador
    this.addCondition(Condition.prototype.HEALING, 5, 20);

    // Exemplo: enviar efeito mágico
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.BLUEBUBBLE);

    // Retorne um número para animação (ou false para falha)
    return 100;
};
```

---

## Passo 2: Registrar no definitions.json

Edite `data/740/spells/definitions.json` e adicione:

```json
{
    "20": {
        "script": "minha_spell.js",
        "name": "Minha Spell",
        "words": "exura minha",
        "mana": 50,
        "level": 10,
        "vocations": ["sorcerer", "druid", "paladin", "knight"]
    }
}
```

> **Nota**: O número `"20"` deve ser único (próximo ID disponível).

### Campos Obrigatórios

| Campo | Descrição |
|-------|-----------|
| `script` | Nome do arquivo JS |
| `name` | Nome da spell |
| `words` | Palavras para ativar |
| `mana` | Custo de mana |
| `level` | Nível mínimo |
| `vocations` | Lista de vocações permitidas |

---

## Passo 3: Reiniciar o Servidor

```bash
node engine.js
```

---

## Tipos de Spells

### Spell de Cura

```javascript
const Condition = requireModule("combat/condition");

module.exports = function exura(properties) {
    // Cura 5 ticks de 10 HP cada
    this.addCondition(Condition.prototype.HEALING, 5, 10);
    return 100;
};
```

### Spell de Dano (Target)

```javascript
module.exports = function deathStrike(properties) {
    let target = this.getTarget();
    
    if (!target) {
        this.sendCancelMessage("You have no target.");
        return false;
    }
    
    // Efeito de projétil
    process.gameServer.world.sendDistanceEffect(
        this.position, 
        target.position, 
        CONST.EFFECT.PROJECTILE.DEATH
    );
    
    // Aplicar dano
    let damage = Math.floor(Math.random() * 50) + 30;
    target.decreaseHealth(this, damage);
    
    return 100;
};
```

### Spell de Área

```javascript
const Position = requireModule("utils/position");

module.exports = function explosion(properties) {
    // Posições em volta do player
    let positions = Position.prototype.getCirclePositions(this.position, 2);
    
    positions.forEach(pos => {
        let tile = process.gameServer.world.getTileFromWorldPosition(pos);
        if (tile) {
            // Efeito e dano em cada tile
            process.gameServer.world.sendMagicEffect(pos, CONST.EFFECT.MAGIC.EXPLOSION);
            
            tile.getCreatures().forEach(creature => {
                if (creature !== this) {
                    creature.decreaseHealth(this, 50);
                }
            });
        }
    });
    
    return 100;
};
```

### Spell de Buff

```javascript
const Condition = requireModule("combat/condition");

module.exports = function haste(properties) {
    // Adiciona condição de velocidade por 30 segundos
    this.addCondition(Condition.prototype.HASTE, 50, 30000);
    
    process.gameServer.world.sendMagicEffect(this.position, CONST.EFFECT.MAGIC.TELEPORT);
    
    return 100;
};
```

---

## Conditions Disponíveis

| Condition | Descrição |
|-----------|-----------|
| `HEALING` | Cura HP ao longo do tempo |
| `MANA_REGENERATION` | Regenera mana |
| `HASTE` | Aumenta velocidade |
| `INVISIBLE` | Invisibilidade |
| `MAGIC_SHIELD` | Dano vai para mana |
| `SATED` | Alimentado (não pode comer mais) |
| `BURNING` | Dano de fogo |
| `POISONED` | Dano de veneno |
| `ELECTRIFIED` | Dano de energia |

---

## Efeitos Mágicos Comuns

```javascript
CONST.EFFECT.MAGIC.HEALING     // Cura verde
CONST.EFFECT.MAGIC.BLUEBUBBLE  // Bolhas azuis
CONST.EFFECT.MAGIC.EXPLOSION   // Explosão
CONST.EFFECT.MAGIC.TELEPORT    // Teleporte
CONST.EFFECT.MAGIC.POFF        // Fumaça
CONST.EFFECT.MAGIC.FIRE        // Fogo
CONST.EFFECT.MAGIC.ENERGY      // Energia/Raio
```

---

## Efeitos de Projétil

```javascript
CONST.EFFECT.PROJECTILE.FIRE       // Bola de fogo
CONST.EFFECT.PROJECTILE.ENERGY     // Raio
CONST.EFFECT.PROJECTILE.DEATH      // Morte súbita
CONST.EFFECT.PROJECTILE.ARROW      // Flecha
CONST.EFFECT.PROJECTILE.BOLT       // Bolt
CONST.EFFECT.PROJECTILE.POISONARROW // Flecha envenenada
```
