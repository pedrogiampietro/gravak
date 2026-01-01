# 📋 TODO - Tibia Browser Engine

This document tracks planned features, improvements, and known issues for the project.

---

## 🚀 High Priority

### Core Gameplay
- [ ] **PvP System** - Player vs Player combat with skull system
- [ ] **Party System** - Group up with other players, shared experience
- [ ] **Guild System** - Create and manage guilds
- [ ] **VIP List** - Friends list with online status notifications
- [x] **Depot System** - Secure storage in depots across cities
- [x] **Parcel System** - click in mail to restore a parcels;

### Combat & Balance
- [ ] **Combat Formulas Review** - Balance damage calculations for all vocations
- [ ] **Missing Spells** - Add remaining 7.4 spells (summons, area attacks)
- [ ] **Shielding Mechanics** - Block chance and shield skill integration
- [ ] **Distance Fighting** - Bow/crossbow with ammunition system

### World & Content
- [ ] **More NPCs** - Add remaining city NPCs (bankers, boat captains, etc.)
- [ ] **Quest Scripting** - Implement classic quests (Demon Helmet, Annihilator, etc.)
- [ ] **Loot System** - Monster drops based on XML loot tables
- [ ] **Rare Items** - Unique item spawns and respawn timers

---

## 🎨 UI/UX Improvements

### Client Interface
- [ ] **Container Improvements** - Drag & drop between containers
- [ ] **Equipment Slots** - Visual equipment management window
- [ ] **Minimap Markers** - Save and display custom markers
- [ ] **Chat Improvements** - Tab management, ignore list, spam filter
- [ ] **Options Menu** - Graphics settings, keybindings, audio controls

### Visual Polish
- [ ] **Spell Animations** - More detailed spell effects
- [ ] **Hit Effects** - Blood splatter, sparks on impact
- [ ] **Ambient Effects** - Weather, torches, magical areas
- [ ] **Loading Screen** - Progress indicator during map loading

---

## 🔧 Technical Improvements

### Performance
- [ ] **Chunk Loading Optimization** - Lazy load distant chunks
- [ ] **Sprite Caching** - Better memory management for sprites
- [ ] **Network Optimization** - Reduce packet size, batch updates
- [ ] **Database Query Optimization** - Index and query improvements

### Architecture
- [ ] **Unit Tests** - Expand test coverage for core systems
- [ ] **Integration Tests** - End-to-end testing with headless browser
- [ ] **Error Handling** - Graceful error recovery, better logging
- [ ] **Code Documentation** - JSDoc comments for public APIs

### DevOps
- [ ] **CI/CD Pipeline** - Automated testing and deployment
- [ ] **Monitoring** - Server metrics, player statistics
- [ ] **Backup System** - Automated database backups
- [ ] **Admin Panel** - Web-based server administration

---

## 📱 Future Features

### Multiplayer
- [ ] **Multiple Game Worlds** - Support for multiple server instances
- [ ] **World Transfer** - Move characters between worlds
- [ ] **Global Chat** - Cross-world communication

### Economy
- [ ] **Market System** - Player-to-player trading marketplace
- [ ] **Bank System** - Gold storage with interest
- [ ] **Premium Features** - Premium account benefits

### Social
- [ ] **Highscores** - Top players by level, skills, achievements
- [ ] **Character Profile** - Public player information page
- [ ] **Achievements UI** - Display earned achievements

---

## 🐛 Known Issues

### Gameplay Bugs
- [ ] Creatures sometimes get stuck on corners
- [ ] Magic wall placement on certain tiles
- [ ] Door access on house entrance tiles

### Client Bugs
- [ ] Battle list occasionally shows duplicate entries
- [ ] Quest log loading state on certain conditions
- [ ] Hotbar icons not saving correctly on some browsers

### Server Bugs
- [ ] Memory leak on long-running sessions
- [ ] Spawns not respecting max count in some areas

---

## ✅ Recently Completed

- [x] Quest system with persistence
- [x] Quest log UI with mission tracking
- [x] Combat modes (Full Attack, Balanced, Full Defense)
- [x] Battle list with creature filtering
- [x] Railway deployment configuration
- [x] PostgreSQL database integration
- [x] Level up notifications and effects
- [x] NPC conversation system
- [x] NPC trading system
- [x] Spell casting with cooldowns
- [x] Rune usage
- [x] Condition effects (burning, poison, haste, etc.)
- [x] World clock with day/night cycle
- [x] Housing with doors
- [x] Skill progression system

---

## 📝 Notes

### Priority Levels
- 🚀 **High** - Core features needed for playable experience
- 🎨 **UI/UX** - User interface improvements
- 🔧 **Technical** - Code quality and infrastructure
- 📱 **Future** - Nice-to-have features for later

### Contributing
Pick any item from the TODO list and create a pull request! For larger features, please open an issue first to discuss the approach.

---

*Last updated: 2026-01-01*
