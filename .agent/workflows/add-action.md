---
description: Como adicionar uma nova action (interação com item)
---

# 🔧 Adicionar uma Action

Actions são interações que ocorrem quando um jogador usa um item, seja sozinho (`use`) ou em outro objeto (`useWith`).

## Tipos de Trigger

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `use` | Clicar com botão direito e usar | Comer comida, usar escada |
| `useWith` | Usar item em outro objeto/tile | Pescar com vara, usar pá |
| `enter` | Pisar em um tile | Tiles de pressão |
| `exit` | Sair de um tile | Tiles de pressão |

---

## Passo 1: Criar o Script

Crie um arquivo em `data/740/actions/definitions/NOME_DA_ACTION.js`:

```javascript
// Exemplo: data/740/actions/definitions/minha-action.js

const Condition = requireModule("combat/condition");

module.exports = function minhaAction(player, thing, index, item) {

    /*
     * Function minhaAction
     * Descrição do que a action faz
     *
     * @param player - O jogador que usou o item
     * @param thing - Container ou tile onde o item está
     * @param index - Índice do item no container
     * @param item - O item que foi usado
     */

    // Verificar se é o item correto
    if (item.id !== 1234) {
        return false;
    }

    // Enviar mensagem ao jogador
    player.sendCancelMessage("Você usou o item!");

    // Mostrar efeito mágico na posição do jogador
    process.gameServer.world.sendMagicEffect(player.position, CONST.EFFECT.MAGIC.POFF);

    // Remover 1 do item (se consumível)
    thing.removeIndex(index, 1);

    return true;
};
```

---

## Passo 2: Registrar no definitions.json

Edite `data/740/actions/definitions.json` e adicione a entrada:

### Para um ID único:

```json
{
    "id": 1234,
    "on": "use",
    "callback": "minha-action.js"
}
```

### Para um range de IDs:

```json
{
    "from": 1234,
    "to": 1240,
    "on": "use",
    "callback": "minha-action.js"
}
```

### Para múltiplos IDs específicos:

```json
{
    "ids": [1234, 1235, 1240],
    "on": "use",
    "callback": "minha-action.js"
}
```

### Para useWith (usar em outro objeto):

```json
{
    "id": 2580,
    "on": "useWith",
    "callback": "fish.js"
}
```

---

## Passo 3: Reiniciar o Servidor

```bash
# Pare o engine.js (Ctrl+C) e reinicie
node engine.js
```

---

## Exemplos Existentes

### Comida (`food.js`)

```javascript
const Condition = requireModule("combat/condition");

const lookup = {
    "2666": { "ticks": 15, "sound": "Munch." },
    "2667": { "ticks": 12, "sound": "Munch." }
};

module.exports = function playerEatFood(player, thing, index, item) {
    if (!lookup.hasOwnProperty(item.id)) {
        return false;
    }

    let { ticks, sound } = lookup[item.id];

    if (player.isSated(ticks)) {
        return player.sendCancelMessage("You are sated.");
    }

    player.extendCondition(Condition.prototype.SATED, ticks, 600, null);
    player.speechHandler.internalCreatureSay(sound, CONST.COLOR.ORANGE);
    thing.removeIndex(index, 1);
};
```

### Escada (`ladder.js`)

```javascript
module.exports = function useLadder(player, thing, index, item) {
    let position = item.getPosition().up();
    
    if (!process.gameServer.world.getTileFromWorldPosition(position)) {
        return player.sendCancelMessage("Sorry, not possible.");
    }
    
    player.teleport(position);
};
```

---

## Métodos Úteis

| Método | Descrição |
|--------|-----------|
| `player.sendCancelMessage(msg)` | Mostra mensagem de erro |
| `player.teleport(position)` | Teleporta o jogador |
| `thing.removeIndex(index, count)` | Remove items |
| `process.gameServer.world.sendMagicEffect(pos, effect)` | Mostra efeito |
| `process.gameServer.database.createThing(id)` | Cria item |
| `item.getPosition()` | Posição do item |
