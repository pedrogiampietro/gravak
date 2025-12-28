---
description: Como adicionar uma nova rune
---

# 🔮 Adicionar uma Rune

Runas são itens mágicos que podem ser usados em um alvo (tile, criatura, etc).

---

## Passo 1: Identificar o ID da Rune

Runas são itens com IDs específicos. Exemplos:

| Item ID | Rune |
|---------|------|
| 2268 | Sudden Death |
| 2311 | Heavy Magic Missile |
| 2304 | Fireball |
| 2301 | Fire Field |
| 2277 | Energy Field |
| 2285 | Poison Field |
| 2293 | Magic Wall |
| 2273 | Ultimate Healing Rune |

Para novas runas, você precisa de um item com a flag de runa no `items.otb`.

---

## Passo 2: Criar o Script

Crie um arquivo em `data/740/runes/definitions/NOME_DA_RUNE.js`:

```javascript
// Exemplo: data/740/runes/definitions/minha-rune.js

const Position = requireModule("utils/position");

module.exports = function minhaRune(source, target) {

    /*
     * Function minhaRune
     * Código que executa quando a rune é usada
     *
     * @param source - O jogador que usou a rune
     * @param target - O tile alvo
     */

    // Efeito de projétil do jogador até o alvo
    process.gameServer.world.sendDistanceEffect(
        source.position, 
        target.position, 
        CONST.EFFECT.PROJECTILE.FIRE
    );

    // Efeito mágico no alvo
    process.gameServer.world.sendMagicEffect(target.position, CONST.EFFECT.MAGIC.EXPLOSION);

    // Aplicar dano a criaturas no tile
    target.getCreatures().forEach(creature => {
        if (creature !== source) {
            let damage = Math.floor(Math.random() * 100) + 50;
            creature.decreaseHealth(source, damage);
        }
    });

    return true;
};
```

---

## Passo 3: Registrar no definitions.json

Edite `data/740/runes/definitions.json`:

```json
{
    "2268": "sudden-death.js",
    "2311": "heavy-magic-missile.js",
    "2304": "fireball.js",
    "ITEM_ID_DA_RUNE": "minha-rune.js"
}
```

> **Nota**: A chave é o ID do item (como string), o valor é o nome do script.

---

## Passo 4: Reiniciar o Servidor

```bash
node engine.js
```

---

## Tipos de Runas

### Rune de Dano Direto

```javascript
module.exports = function suddenDeath(source, target) {
    // Projétil
    process.gameServer.world.sendDistanceEffect(
        source.position, 
        target.position, 
        CONST.EFFECT.PROJECTILE.DEATH
    );

    // Dano nas criaturas
    target.getCreatures().forEach(creature => {
        if (creature !== source) {
            let damage = Math.floor(Math.random() * 150) + 100;
            creature.decreaseHealth(source, damage);
            
            // Efeito no alvo
            process.gameServer.world.sendMagicEffect(
                creature.position, 
                CONST.EFFECT.MAGIC.MORTAREA
            );
        }
    });

    return true;
};
```

### Rune de Campo (Field)

```javascript
module.exports = function fireField(source, target) {
    // Projétil
    process.gameServer.world.sendDistanceEffect(
        source.position, 
        target.position, 
        CONST.EFFECT.PROJECTILE.FIRE
    );

    // Adiciona item de campo de fogo no tile
    // 1487 = fire field (small)
    target.addItem(process.gameServer.database.createThing(1487));

    return true;
};
```

### Rune de Área (AoE)

```javascript
const Position = requireModule("utils/position");

module.exports = function fireBomb(source, target) {
    // Posições em volta do alvo (raio 1)
    let positions = Position.prototype.getCirclePositions(target.position, 1);

    // Projétil
    process.gameServer.world.sendDistanceEffect(
        source.position, 
        target.position, 
        CONST.EFFECT.PROJECTILE.FIRE
    );

    // Adiciona campos de fogo em cada posição
    positions.forEach(pos => {
        let tile = process.gameServer.world.getTileFromWorldPosition(pos);
        if (tile && tile.isWalkable()) {
            tile.addItem(process.gameServer.database.createThing(1487));
        }
    });

    return true;
};
```

### Rune de Cura

```javascript
module.exports = function ultimateHealingRune(source, target) {
    // Encontra criatura no tile
    let creatures = target.getCreatures();
    
    if (creatures.length === 0) {
        source.sendCancelMessage("There is no target.");
        return false;
    }

    let targetCreature = creatures[0];
    
    // Calcula cura (baseado em magic level)
    let heal = Math.floor(source.getMagicLevel() * 10) + 100;
    
    targetCreature.increaseHealth(heal);
    
    process.gameServer.world.sendMagicEffect(
        targetCreature.position, 
        CONST.EFFECT.MAGIC.HEALING
    );

    return true;
};
```

### Rune de Teleporte

```javascript
module.exports = function teleportRune(source, target) {
    // Verifica se o tile é walkable
    if (!target.isWalkable()) {
        source.sendCancelMessage("You cannot teleport there.");
        return false;
    }

    // Efeito na posição atual
    process.gameServer.world.sendMagicEffect(
        source.position, 
        CONST.EFFECT.MAGIC.TELEPORT
    );

    // Teleporta
    source.teleport(target.position);

    // Efeito na nova posição
    process.gameServer.world.sendMagicEffect(
        source.position, 
        CONST.EFFECT.MAGIC.TELEPORT
    );

    return true;
};
```

---

## IDs de Campos Mágicos

| Item ID | Tipo |
|---------|------|
| 1487 | Fire Field (small) |
| 1488 | Fire Field (medium) |
| 1489 | Fire Field (large) |
| 1490-1492 | Energy Fields |
| 1493-1495 | Poison Fields |
| 1496-1498 | Magic Walls |

---

## Métodos Úteis

| Método | Descrição |
|--------|-----------|
| `target.getCreatures()` | Lista de criaturas no tile |
| `target.isWalkable()` | Verifica se pode andar |
| `target.addItem(item)` | Adiciona item ao tile |
| `source.teleport(pos)` | Teleporta o jogador |
| `creature.decreaseHealth(src, dmg)` | Aplica dano |
| `creature.increaseHealth(amount)` | Cura |
