# 🎮 Tibia Browser Engine - Documentação para IA

Esta pasta contém documentação estruturada para ajudar IAs a entender e modificar o projeto.

## 📁 Estrutura

```
.agent/
├── README.md              # Este arquivo
├── architecture.md        # Visão geral da arquitetura
├── conventions.md         # Convenções de código
└── workflows/             # Guias passo-a-passo
    ├── add-action.md      # Como adicionar uma action
    ├── add-spell.md       # Como adicionar uma spell
    ├── add-rune.md        # Como adicionar uma rune
    ├── create-npc.md      # Como criar um NPC
    ├── create-monster.md  # Como criar um monstro
    └── deploy.md          # Como fazer deploy
```

## 🚀 Início Rápido

### Executar o Projeto

```bash
# Terminal 1: Servidor de arquivos do cliente
py client-server.py

# Terminal 2: Servidor de login
node login.js

# Terminal 3: Engine do jogo
node engine.js
```

Acesse: `http://localhost:8080`

## 📂 Estrutura do Projeto

| Pasta | Descrição |
|-------|-----------|
| `client/` | Frontend do jogo (HTML, CSS, JS) |
| `src/` | Código fonte do servidor (Node.js) |
| `data/740/` | Dados do jogo (NPCs, monstros, spells, etc.) |
| `drizzle/` | Migrações do banco de dados |
| `tools/` | Ferramentas auxiliares |

## 🎯 Workflows Disponíveis

1. **[Adicionar Action](./workflows/add-action.md)** - Criar interações com itens
2. **[Adicionar Spell](./workflows/add-spell.md)** - Criar novas magias
3. **[Adicionar Rune](./workflows/add-rune.md)** - Criar novas runas
4. **[Criar NPC](./workflows/create-npc.md)** - Criar personagens não-jogáveis
5. **[Criar Monstro](./workflows/create-monster.md)** - Criar novas criaturas
6. **[Deploy](./workflows/deploy.md)** - Fazer deploy do projeto
