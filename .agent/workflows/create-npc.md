---
description: Como criar um novo NPC (personagem não-jogável)
---

# 🧑‍🤝‍🧑 Criar um NPC

NPCs são personagens não-jogáveis que podem conversar, vender itens e interagir com jogadores.

---

## Estrutura de Arquivos

Para criar um NPC você precisa de 2-3 arquivos:

```
data/740/npcs/
├── definitions.json              # Registra posição do NPC
└── definitions/
    ├── meu-npc.json              # Configuração do NPC
    └── script/
        └── meu-npc.js            # Script de comportamento (opcional)
```

---

## Passo 1: Criar o JSON do NPC

Crie `data/740/npcs/definitions/meu-npc.json`:

```json
{
    "creatureStatistics": {
        "name": "Meu NPC",
        "health": 100,
        "maxHealth": 100,
        "mana": 0,
        "maxMana": 0,
        "attack": 1,
        "attackSlowness": 40,
        "defense": 5,
        "speed": 30,
        "outfit": {
            "id": 131,
            "details": {
                "head": 95,
                "body": 86,
                "legs": 121,
                "feet": 115
            }
        }
    },
    "behaviour": {
        "wanderRange": 2,
        "openDoors": true,
        "ignoreCharacters": true
    },
    "conversation": {
        "hearingRange": 5,
        "keywords": {
            "job": "I am a merchant. I sell useful items.",
            "name": "My name is Meu NPC."
        },
        "trade": {
            "items": [
                {
                    "name": "Rope",
                    "price": 50,
                    "id": 2120,
                    "type": "sell"
                },
                {
                    "name": "Shovel",
                    "price": 10,
                    "id": 2554,
                    "type": "sell"
                }
            ]
        },
        "farewells": ["bye", "goodbye", "farewell"],
        "greetings": ["hello", "hi", "greetings"],
        "sayings": {
            "texts": [
                "Looking for something?",
                "Best prices in town!"
            ],
            "rate": 250,
            "chance": 0.6
        },
        "script": "meu-npc.js"
    }
}
```

---

## Campos Principais

### creatureStatistics

| Campo | Descrição |
|-------|-----------|
| `name` | Nome exibido |
| `health/maxHealth` | HP do NPC |
| `speed` | Velocidade de movimento |
| `outfit.id` | ID do outfit (aparência) |
| `outfit.details` | Cores (head, body, legs, feet: 0-133) |

### behaviour

| Campo | Descrição |
|-------|-----------|
| `wanderRange` | Distância máxima que anda da posição inicial |
| `openDoors` | Se pode abrir portas |
| `ignoreCharacters` | Se ignora jogadores no caminho |

### conversation

| Campo | Descrição |
|-------|-----------|
| `hearingRange` | Distância para ouvir jogadores |
| `keywords` | Respostas automáticas para palavras |
| `trade.items` | Itens para compra/venda |
| `greetings` | Palavras que iniciam conversa |
| `farewells` | Palavras que encerram conversa |
| `sayings` | Frases aleatórias |
| `script` | Script JS para comportamento avançado |

---

## Passo 2: Criar o Script (Opcional)

Crie `data/740/npcs/definitions/script/meu-npc.js`:

```javascript
module.exports = function meuNpc() {

    /*
     * Definições para NPC Meu NPC
     * "this" é o NPC
     */

    // Define o estado base de conversa
    this.setBaseState(baseTalkState);

    // Event handlers
    this.on("focus", player => {
        this.say("Hello, %s! Say {trade} to see my wares!".format(player.name));
    });

    this.on("defocus", player => {
        this.say("Goodbye, %s! Come back anytime!".format(player.name));
    });

    this.on("exit", player => {
        this.say("Come back soon!");
    });

    this.on("regreet", player => {
        this.say("Yes? Want to see my {trade}?");
    });

    this.on("idle", player => {
        this.say("Hello? Anyone there?");
    });

    this.on("busy", (focus, player) => {
        this.privateSay(player, "Please wait, I am talking to %s.".format(focus.name));
    });

};

function baseTalkState(state, player, message) {

    /*
     * Estado base de conversa
     * Responde a palavras-chave
     */

    switch (message) {
        case "trade":
            this.tradeHandler.openTradeWindow(player);
            return this.respond("Here are my offers. What would you like?");
        
        case "job":
            return this.respond("I am the local shopkeeper.");
        
        case "name":
            return this.respond("My name is Meu NPC.");
        
        case "help":
            return this.respond("Say {trade} to see my offers.");
    }

}
```

---

## Passo 3: Registrar no definitions.json

Edite `data/740/npcs/definitions.json`:

```json
{
    "meu-npc": {
        "position": {
            "x": 32100,
            "y": 32200,
            "z": 7
        },
        "enabled": true,
        "definition": "meu-npc.json"
    }
}
```

> **Nota**: Use coordenadas válidas do seu mapa!

---

## Passo 4: Reiniciar o Servidor

```bash
node engine.js
```

---

## Eventos do NPC

| Evento | Quando dispara |
|--------|----------------|
| `focus` | Jogador inicia conversa (diz "hi") |
| `defocus` | Jogador encerra conversa (diz "bye") |
| `exit` | Jogador sai do range de audição |
| `regreet` | Jogador já em conversa diz "hi" novamente |
| `idle` | Jogador fica muito tempo sem falar |
| `busy` | Outro jogador tenta conversar enquanto ocupado |

---

## Métodos do NPC

| Método | Descrição |
|--------|-----------|
| `this.say(msg)` | Fala para todos |
| `this.privateSay(player, msg)` | Fala só para um jogador |
| `this.respond(msg)` | Responde na conversa |
| `this.setBaseState(fn)` | Define handler de conversa |
| `this.tradeHandler.openTradeWindow(player)` | Abre janela de trade |

---

## Tipos de Items de Trade

```json
{
    "name": "Rope",
    "price": 50,
    "id": 2120,
    "type": "sell"   // NPC vende para jogador
}
```

```json
{
    "name": "Rope",
    "price": 8,
    "id": 2120,
    "type": "buy"    // NPC compra do jogador
}
```

---

## Outfits Comuns

| ID | Outfit |
|----|--------|
| 128 | Citizen (male) |
| 136 | Citizen (female) |
| 129 | Hunter (male) |
| 137 | Hunter (female) |
| 130 | Mage (male) |
| 138 | Mage (female) |
| 131 | Knight (male) |
| 139 | Knight (female) |
| 132 | Nobleman (male) |
| 140 | Noblewoman (female) |
