# 🎮 Gravak

An **HTML5 Open Tibia Client & Server** built with modern web technologies. Play Tibia 7.4 directly in your browser!

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![Client Version](https://img.shields.io/badge/tibia-7.4-green)
![Node.js](https://img.shields.io/badge/node.js-18%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ✨ Features

### 🖥️ Server-Side
- **WebSocket Game Engine** - Real-time communication with token-based authentication
- **PostgreSQL Database** - Powered by Drizzle ORM with migration support
- **1170+ Monsters** - Complete creature database with AI behaviors and spawning
- **14 NPCs** - Interactive NPCs with conversation system, trading, and scripting
- **21 Spells** - Attack, healing, support, and utility spells
- **12 Runes** - Magic runes including damage, fields, and utility
- **24 Actions** - Item interactions (food, tools, fishing, ladders, etc.)
- **15 Conditions** - Status effects (burning, poisoned, haste, invisible, etc.)
- **Quest System** - Persistent quest progress with storage values
- **Housing System** - Player-owned houses with doors
- **World Clock** - In-game day/night cycle
- **Combat System** - Melee, ranged, and magic combat with damage calculations
- **Skill System** - Experience and skill progression with vocation multipliers
- **Docker Support** - Ready for containerized deployment

### 🎨 Client-Side
- **HTML5 Canvas Rendering** - Smooth 2D graphics with sprite rendering
- **UI System** - Battle list, quest log, skills, hotbar, settings
- **15 Modals** - Outfit, map, spellbook, trade, death screen, etc.
- **Audio System** - Sound effects and background music
- **Hotbar Manager** - Configurable spell/item shortcuts
- **Chat System** - Multiple channels, private messages
- **Minimap** - Interactive map navigation
- **Responsive Design** - Adapts to different screen sizes

### 🚀 Deployment
- **Railway Ready** - Configured for cloud deployment
- **Docker Compose** - Local development with PostgreSQL
- **Nginx Support** - Production-ready static file serving

---

## 📋 Requirements

- **Node.js** 18+
- **Python** 3.x (for client server)
- **PostgreSQL** (or use Docker)
- **Modern Browser** (Chrome, Firefox, Edge)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clonehttps://github.com/pedrogiampietro/gravak.git
cd gravak
npm install
```

### 2. Database Setup

**Option A: With Docker (Recommended)**
```bash
npm run setup
```

**Option B: Manual PostgreSQL**
1. Create a PostgreSQL database
2. Copy `.env.example` to `.env` and configure `DATABASE_URL`
3. Run migrations: `npm run db:push`

### 3. Start the Servers

Start all three processes in separate terminals:

```bash
# Terminal 1 - Client Server (Static Files)
python client-server.py

# Terminal 2 - Game Engine
node engine.js

# Terminal 3 - Login Server
node login.js
```

### 4. Play!

Open your browser at `http://127.0.0.1:8000/`

**Default Login:**
- Account: `111111`
- Password: `tibia`

---

## 📁 Project Structure

```
tibia-browser-engine/
├── client/                 # HTML5 Client
│   ├── src/               # Source code
│   │   ├── ui/            # UI components & modals
│   │   ├── rendering/     # Canvas rendering
│   │   ├── network/       # WebSocket communication
│   │   └── entities/      # Client-side entities
│   ├── css/               # Stylesheets
│   └── sounds/            # Audio files
│
├── src/                    # Server Source
│   ├── core/              # Game loop, world, database
│   ├── entities/          # Things, creatures, items
│   ├── player/            # Player logic & handlers
│   ├── monster/           # Monster AI
│   ├── npc/               # NPC conversation & trading
│   ├── combat/            # Combat, conditions, spells
│   └── network/           # Packet handling
│
├── data/740/               # Game Data
│   ├── monsters/          # 1170+ monster definitions
│   ├── npcs/              # NPC definitions & scripts
│   ├── spells/            # Spell definitions
│   ├── runes/             # Rune definitions
│   ├── actions/           # Item action scripts
│   ├── conditions/        # Status effect scripts
│   ├── world/             # OTBM map files
│   └── quests.json        # Quest definitions
│
├── drizzle/                # Database migrations
├── scripts/                # Build scripts
└── tools/                  # Development tools
```

---

## 🗺️ Exploring the World

Use the `/waypoint <location>` command to teleport:

| Location | Command |
|----------|---------|
| Rookgaard | `/waypoint rookgaard` |
| Thais | `/waypoint thais` |
| Carlin | `/waypoint carlin` |
| Ab'Dendriel | `/waypoint ab'dendriel` |
| Venore | `/waypoint venore` |
| Edron | `/waypoint edron` |
| Kazordoon | `/waypoint kazordoon` |
| Ankrahmun | `/waypoint ankrahmun` |
| Fibula | `/waypoint fibula` |
| GM Island | `/waypoint gm-island` |

<details>
<summary>More locations...</summary>

- `senja`, `dracona`, `orc-fortress`, `darama`, `cormaya`
- `poh`, `white-flower`, `femur-hills`, `ghost-ship`
- `mintwallin`, `cyclopolis`, `annihilator`

</details>

---

## ⚙️ Configuration

Edit `config.json` to customize:

- **Server ports** - Login, game, IPC
- **World settings** - Clock speed, spawns, NPCs
- **Skill multipliers** - Per-vocation progression rates
- **Idle timeouts** - Warning and kick thresholds
- **Compression** - WebSocket message compression

---

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
npm run db:push
node engine.js
```

### Production (Railway)
The project is configured for Railway deployment with:
- PostgreSQL addon
- WebSocket support
- Health check endpoint at `/health`

---

## 🛠️ Development

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | Start Docker + push database schema |
| `npm run start` | Start game engine |
| `npm run start:login` | Start login server |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |
| `npm run build:client` | Build production client |

### Workflows

The project includes development workflows in `.agent/workflows/`:
- `/add-spell` - Adding new spells
- `/add-rune` - Adding new runes
- `/add-action` - Adding item actions
- `/create-monster` - Creating monsters
- `/create-npc` - Creating NPCs

---

## 🤝 Contributing

Contributions are welcome! See [TODO.md](TODO.md) for planned features and known issues.

---

## 📜 License

This project is open source. See individual files for licensing details.

---

## 🙏 Acknowledgments

- Original Tibia by CipSoft GmbH
- Open Tibia community
- [Inconcessus/Tibia74-JS-Engine](https://github.com/Inconcessus/Tibia74-JS-Engine) - Original inspiration
