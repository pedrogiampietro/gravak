---
description: Como criar um novo monstro
---

# 👹 Criar um Monstro

Monstros são criaturas hostis que atacam jogadores e dropam loot.

---

## Estrutura de Arquivos

```
data/740/monsters/
├── definitions.json              # Mapeia ID -> arquivo
└── definitions/
    └── meu-monstro.json          # Configuração do monstro
```

---

## Passo 1: Criar o JSON do Monstro

Crie `data/740/monsters/definitions/meu-monstro.json`:

```json
{
    "creatureStatistics": {
        "name": "Meu Monstro",
        "health": 100,
        "maxHealth": 100,
        "mana": 0,
        "maxMana": 0,
        "speed": 80,
        "attack": 20,
        "attackSpeed": 2000,
        "defense": 5,
        "outfit": {
            "id": 21
        },
        "armor": 2
    },
    "experience": 50,
    "corpse": 2813,
    "fluidType": 0,
    "behaviour": {
        "type": 2,
        "fleeHealth": 10,
        "openDoors": false,
        "senseInvisible": false
    },
    "attacks": [
        {
            "name": "melee",
            "interval": 2000,
            "chance": 1,
            "min": 0,
            "max": 20
        }
    ],
    "elements": {
        "fire": 10,
        "ice": -10,
        "earth": 0,
        "energy": 0,
        "holy": 0,
        "death": 0
    },
    "sayings": {
        "texts": [
            "Grrrr!",
            "I will destroy you!"
        ],
        "slowness": 5,
        "chance": 0.1
    },
    "loot": [
        {
            "id": 2148,
            "probability": 1,
            "name": "gold coin",
            "min": 1,
            "max": 10
        },
        {
            "id": 2666,
            "probability": 0.5,
            "name": "meat"
        }
    ],
    "flags": {
        "summonable": false,
        "attackable": true,
        "convinceable": false,
        "pushable": false,
        "canPushItems": true,
        "canPushCreatures": false,
        "illusionable": true,
        "targetDistance": false
    }
}
```

---

## Campos Principais

### creatureStatistics

| Campo | Descrição |
|-------|-----------|
| `name` | Nome exibido |
| `health/maxHealth` | HP do monstro |
| `mana/maxMana` | Mana (para spells) |
| `speed` | Velocidade (67 = lento, 200 = rápido) |
| `attack` | Dano base |
| `attackSpeed` | Intervalo entre ataques (ms) |
| `defense` | Defesa |
| `armor` | Armadura |
| `outfit.id` | ID da aparência |

### behaviour

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | 0-3 | 0=passivo, 1=neutro, 2=agressivo, 3=boss |
| `fleeHealth` | int | HP para começar a fugir |
| `openDoors` | bool | Pode abrir portas |
| `senseInvisible` | bool | Detecta invisíveis |

### elements (Resistências)

Valores positivos = resistência, negativos = fraqueza

```json
"elements": {
    "fire": 10,      // 10% resistência a fogo
    "ice": -20,      // 20% fraqueza a gelo
    "earth": 0,      // neutro
    "energy": 0,
    "holy": 50,      // 50% resistência (undead weakness)
    "death": -30     // 30% fraqueza
}
```

---

## Passo 2: Registrar no definitions.json

Edite `data/740/monsters/definitions.json`:

```json
{
    "0": "wild_water_magic.json",
    "21": "rat.json",
    "1226": "meu-monstro.json"
}
```

> **Nota**: Use o próximo ID disponível (verifique o maior número atual).

---

## Passo 3: Adicionar ao Spawn (Opcional)

Para fazer o monstro aparecer automaticamente, edite `data/740/spawns/`:

```json
{
    "spawns": [
        {
            "position": { "x": 32100, "y": 32200, "z": 7 },
            "radius": 3,
            "monsters": [
                {
                    "id": 1226,
                    "count": 5,
                    "respawnTime": 60
                }
            ]
        }
    ]
}
```

---

## Passo 4: Reiniciar o Servidor

```bash
node engine.js
```

---

## Tipos de Ataque

### Melee (Corpo a Corpo)

```json
{
    "name": "melee",
    "interval": 2000,
    "chance": 1,
    "min": 0,
    "max": 50
}
```

### Distance (Projétil)

```json
{
    "name": "distance",
    "interval": 2000,
    "chance": 0.5,
    "min": 10,
    "max": 30,
    "effect": "bolt"
}
```

### Spell (Magia)

```json
{
    "name": "spell",
    "interval": 3000,
    "chance": 0.3,
    "spell": "fireball",
    "min": 20,
    "max": 60
}
```

### Self Healing

```json
{
    "name": "healing",
    "interval": 2000,
    "chance": 0.2,
    "min": 20,
    "max": 40
}
```

---

## Loot

### Drop Simples

```json
{
    "id": 2148,
    "probability": 1,
    "name": "gold coin"
}
```

### Drop com Quantidade

```json
{
    "id": 2148,
    "probability": 1,
    "name": "gold coin",
    "min": 1,
    "max": 50
}
```

### Drop Raro

```json
{
    "id": 2400,
    "probability": 0.01,
    "name": "magic sword"
}
```

> `probability`: 1 = 100%, 0.5 = 50%, 0.01 = 1%

---

## Outfits de Monstros Comuns

| ID | Monstro |
|----|---------|
| 21 | Rat |
| 26 | Rotworm |
| 33 | Orc |
| 39 | Skeleton |
| 35 | Dragon |
| 36 | Dragon Lord |
| 67 | Demon |
| 40 | Troll |
| 42 | Wolf |
| 64 | Spider |

---

## Corpses Comuns

| ID | Corpse |
|----|--------|
| 2813 | Rat (small) |
| 2831 | Spider |
| 2884 | Wolf |
| 2812 | Human |
| 2806 | Troll |
| 2881 | Orc |

---

## Exemplo Completo: Dragon

```json
{
    "creatureStatistics": {
        "name": "Dragon",
        "health": 1000,
        "maxHealth": 1000,
        "mana": 500,
        "maxMana": 500,
        "speed": 180,
        "attack": 80,
        "attackSpeed": 2000,
        "defense": 35,
        "outfit": { "id": 35 },
        "armor": 25
    },
    "experience": 700,
    "corpse": 2844,
    "fluidType": 1,
    "behaviour": {
        "type": 2,
        "fleeHealth": 100,
        "openDoors": true,
        "senseInvisible": true
    },
    "attacks": [
        {
            "name": "melee",
            "interval": 2000,
            "chance": 1,
            "min": 0,
            "max": 120
        },
        {
            "name": "fire_wave",
            "interval": 2500,
            "chance": 0.3,
            "min": 100,
            "max": 180
        }
    ],
    "elements": {
        "fire": 100,
        "ice": -10,
        "earth": 20,
        "energy": 0
    },
    "loot": [
        {
            "id": 2148,
            "probability": 1,
            "name": "gold coin",
            "min": 30,
            "max": 100
        },
        {
            "id": 2149,
            "probability": 0.3,
            "name": "small diamond"
        },
        {
            "id": 2144,
            "probability": 0.5,
            "name": "dragon ham"
        }
    ],
    "flags": {
        "summonable": false,
        "attackable": true,
        "convinceable": false,
        "pushable": false,
        "canPushItems": true,
        "canPushCreatures": true,
        "illusionable": false,
        "targetDistance": false
    }
}
```
