# Pixel Plumber

A modern NES-style platformer built from scratch with vanilla JavaScript and HTML5 Canvas. No frameworks, no build tools - just pure web technology delivering authentic retro gaming in your browser.

**[Play Now](https://daniel-henslowe.github.io/pixel-plumber/)**

---

## Table of Contents

- [About the Game](#about-the-game)
- [Features](#features)
- [How to Play](#how-to-play)
- [Game Mechanics](#game-mechanics)
- [Technical Architecture](#technical-architecture)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [How It Works](#how-it-works)
- [Customization](#customization)
- [Contributing](#contributing)
- [License](#license)

---

## About the Game

Pixel Plumber is a love letter to classic 8-bit platformers. You play as a pixel-art hero navigating procedurally generated worlds filled with enemies, obstacles, and secrets. Jump on enemies, collect coins, grab power-ups, and reach the flagpole to complete each level.

The game features 4 worlds with 4 levels each, progressively increasing in difficulty. Each playthrough generates unique level layouts while maintaining the classic platformer feel.

---

## Features

### Gameplay
- **16 Unique Levels** - 4 worlds × 4 levels, each procedurally generated
- **Classic Platforming** - Tight, responsive controls with variable jump height
- **Power-Up System** - Collect mushrooms to grow big and gain extra abilities
- **Multiple Enemy Types** - Goombas patrol, Koopas can be kicked as shells
- **Collectibles** - Coins scattered throughout levels and hidden in blocks
- **Score System** - Points for defeating enemies, collecting coins, and time bonuses
- **Lives System** - 3 lives to start, earn extras by collecting 100 coins

### Visual Design
- **NES Color Palette** - Authentic 8-bit aesthetic
- **Pixel-Perfect Rendering** - Crisp graphics at any screen size
- **Parallax Backgrounds** - Multi-layer scrolling clouds and hills
- **Sprite Animation** - Smooth character and enemy animations
- **Particle Effects** - Brick breaking, coin collection, and more

### Audio
- **Retro Sound Effects** - All sounds generated with Web Audio API
- **No External Files** - Audio synthesized in real-time for instant loading

### Technical
- **60 FPS Gameplay** - Smooth, consistent frame rate
- **Mobile Support** - Touch controls with virtual D-pad
- **Responsive Design** - Scales perfectly on any device
- **Zero Dependencies** - Pure vanilla JavaScript
- **Instant Loading** - No build step, runs directly in browser

---

## How to Play

### Keyboard Controls

| Action | Keys |
|--------|------|
| Move Left | `←` or `A` |
| Move Right | `→` or `D` |
| Jump | `Space`, `↑`, or `W` |
| Run | `Shift` (hold while moving) |
| Start Game | `Enter` |

### Mobile Controls

On touch devices, a virtual controller appears:
- **D-Pad** (left side) - Movement and jumping
- **A Button** - Jump
- **B Button** - Run (hold while moving)

### Tips

1. **Hold jump for higher leaps** - Tap for short hops, hold for maximum height
2. **Running jumps go further** - Hold Shift while running, then jump
3. **Stomp enemies from above** - Land on top of enemies to defeat them
4. **Hit blocks from below** - Jump into question blocks to get coins and power-ups
5. **Kick Koopa shells** - After stomping a Koopa, touch the shell to kick it

---

## Game Mechanics

### Player States

| State | Description |
|-------|-------------|
| **Small** | Default state. One hit from enemies = death |
| **Big** | After collecting a mushroom. Can break bricks. One hit = shrink to small |

### Enemies

| Enemy | Behavior | How to Defeat |
|-------|----------|---------------|
| **Goomba** | Walks back and forth, turns at edges | Stomp from above |
| **Koopa** | Walks back and forth | Stomp to create shell, then kick or avoid |

### Blocks

| Block | Appearance | Contents |
|-------|------------|----------|
| **Question Block** | Yellow with "?" | Coins, sometimes mushrooms |
| **Brick** | Brown/orange | Breakable when big, bumps when small |
| **Solid Block** | Dark brown | Indestructible, used for platforms |

### Scoring

| Action | Points |
|--------|--------|
| Collect coin | 200 |
| Stomp enemy | 100 |
| Break brick | 50 |
| Collect mushroom | 1,000 |
| Level complete | Time remaining × 50 |

### Level Completion

Reach the flagpole at the end of each level. Your remaining time is converted to bonus points. After completing World 4-4, you win the game!

---

## Technical Architecture

### Overview

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                 HTML5 Canvas                     │   │
│  │           (800 × 480 pixels)                    │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  UI Overlay                      │   │
│  │      Score | Coins | World | Time | Lives       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                       game.js                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Game Loop    │  │ Physics      │  │ Rendering    │  │
│  │ (60 FPS)     │  │ Engine       │  │ System       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Input        │  │ Collision    │  │ Audio        │  │
│  │ Handler      │  │ Detection    │  │ System       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Level        │  │ Entity       │  │ Particle     │  │
│  │ Generator    │  │ Manager      │  │ System       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Core Systems

#### Game Loop
- Fixed timestep at 60 FPS using `requestAnimationFrame`
- Delta time accumulator for consistent physics regardless of frame rate
- Separates update logic from rendering

#### Physics Engine
- Gravity constant applied each frame
- Velocity-based movement with acceleration and friction
- Separate horizontal and vertical collision resolution

#### Collision Detection
- Tile-based collision using grid lookup
- AABB (Axis-Aligned Bounding Box) for entity collisions
- Collision response includes bounce, stop, and damage

#### Level Generation
- Procedural generation based on world/level number
- Guarantees playable layouts with no impossible jumps
- Places ground, platforms, pipes, stairs, enemies, and collectibles
- Difficulty scales with progression

#### Rendering Pipeline
1. Clear canvas
2. Draw parallax background (clouds, hills, bushes)
3. Draw tile map (ground, blocks, pipes)
4. Draw items (coins, mushrooms)
5. Draw enemies
6. Draw particles
7. Draw player
8. Draw floating score text

#### Audio System
- All sounds synthesized using Web Audio API oscillators
- No external audio files required
- Sounds: jump, coin, stomp, powerup, brick break, bump, death, flagpole

---

## Project Structure

```
pixel-plumber/
├── index.html      # Game HTML structure and styling
├── game.js         # Complete game engine (~1,900 lines)
└── README.md       # This documentation
```

### Code Organization (game.js)

| Section | Lines | Description |
|---------|-------|-------------|
| Constants | 1-15 | Game dimensions, physics values |
| Game State | 17-30 | Score, lives, world tracking |
| Audio System | 32-120 | Web Audio API sound generation |
| Color Palette | 122-140 | NES-inspired color definitions |
| Input Handling | 142-160 | Keyboard state tracking |
| Player Object | 162-180 | Player state and properties |
| Entity Arrays | 182-190 | Enemies, items, particles |
| Tile System | 192-230 | Tile types and definitions |
| Level Generator | 232-380 | Procedural level creation |
| Collision System | 382-450 | Tile and entity collision |
| Player Update | 452-580 | Player physics and state |
| Enemy Update | 582-700 | Enemy AI and behavior |
| Item Update | 702-780 | Collectible logic |
| Particle System | 782-820 | Visual effects |
| Camera System | 822-840 | Viewport scrolling |
| Rendering | 842-1100 | All draw functions |
| UI Update | 1102-1120 | HUD elements |
| Game Loop | 1122-1160 | Main update/render cycle |
| Input Events | 1162-1240 | Keyboard and touch handlers |
| Mobile Controls | 1242-1280 | Touch control setup |
| Initialization | 1282-1320 | Game startup |

---

## Local Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/daniel-henslowe/pixel-plumber.git

# Navigate to directory
cd pixel-plumber

# Open directly in browser
open index.html

# Or use a local server (recommended for development)
npx serve .
# Then visit http://localhost:3000
```

### Development Tips

1. **Browser DevTools** - Use the Console to see game state, Network tab to verify no external requests
2. **Canvas Debugging** - Add `ctx.strokeRect()` calls to visualize collision boxes
3. **Slow Motion** - Change `game.frameTime` to slow down for debugging
4. **Level Testing** - Modify `generateLevel()` to create specific test scenarios

### Making Changes

Since there's no build step, changes are instant:
1. Edit `game.js` or `index.html`
2. Refresh browser
3. Test changes immediately

---

## How It Works

### Procedural Level Generation

Each level is generated based on the world and level number:

```javascript
function generateLevel(worldNum, levelNum) {
  // Level width increases with world number
  const width = 200 + worldNum * 20;

  // Create ground with random gaps
  // Place pipes at intervals
  // Generate floating platforms with bricks/question blocks
  // Build stairs near the end
  // Place flagpole and castle
  // Spawn enemies on valid ground
  // Scatter floating coins
}
```

### Physics Simulation

The player uses simple but effective physics:

```javascript
// Horizontal movement
if (keys.left) player.vx -= acceleration;
if (keys.right) player.vx += acceleration;
player.vx *= friction;  // Slow down when not pressing keys

// Gravity
player.vy += GRAVITY;

// Variable jump height
if (!keys.jump && player.vy < -4) {
  player.vy = -4;  // Cut jump short when releasing button
}
```

### Collision Resolution

Collisions are resolved in two passes:

```javascript
// 1. Horizontal collision
if (checkCollision(player, player.vx, 0)) {
  // Move as close as possible, then stop
  while (!checkCollision(player, Math.sign(player.vx), 0)) {
    player.x += Math.sign(player.vx);
  }
  player.vx = 0;
}

// 2. Vertical collision
if (checkCollision(player, 0, player.vy)) {
  if (player.vy > 0) player.grounded = true;
  // Same resolution process...
}
```

### Sound Synthesis

Sounds are created with oscillators:

```javascript
function playSound(type) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  // Jump sound: frequency sweep from 400Hz to 600Hz
  oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);

  // Quick fade out
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.15);
}
```

---

## Customization

### Changing Game Constants

At the top of `game.js`:

```javascript
const GAME_WIDTH = 800;    // Canvas width
const GAME_HEIGHT = 480;   // Canvas height
const TILE_SIZE = 32;      // Size of each tile
const GRAVITY = 0.6;       // Fall speed
const FRICTION = 0.85;     // Horizontal slowdown
```

### Modifying Colors

Edit the `COLORS` object:

```javascript
const COLORS = {
  sky: '#5c94fc',
  ground: '#c84c0c',
  player: '#e52521',
  // ... add your own palette
};
```

### Adding New Enemy Types

1. Add to `ENTITIES` enum
2. Create spawn logic in `generateLevel()`
3. Add behavior in `updateEnemies()`
4. Add rendering in `drawEnemy()`

### Creating Custom Levels

Replace procedural generation with hand-crafted levels:

```javascript
const customLevels = {
  '1-1': {
    tiles: [...],  // 2D array of tile types
    enemies: [...], // Enemy spawn positions
    items: [...]    // Item positions
  }
};
```

---

## Contributing

Contributions are welcome! Here are some ideas:

### Feature Ideas
- [ ] Fire flower power-up
- [ ] Swimming/water levels
- [ ] Moving platforms
- [ ] Boss battles
- [ ] Level editor
- [ ] Save/load game state
- [ ] Multiplayer mode
- [ ] Custom level sharing

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use descriptive variable names
- Comment complex logic
- Keep functions focused and small
- Test on both desktop and mobile

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | Full |
| Firefox | Full |
| Safari | Full |
| Edge | Full |
| Mobile Safari | Full (with touch controls) |
| Mobile Chrome | Full (with touch controls) |

Requires:
- HTML5 Canvas
- Web Audio API
- ES6+ JavaScript

---

## Performance

The game is optimized for smooth 60 FPS gameplay:

- **Efficient rendering** - Only draws visible tiles
- **Object pooling** - Reuses particle objects
- **Minimal garbage collection** - Avoids creating objects in loops
- **RequestAnimationFrame** - Syncs with display refresh rate

---

## License

MIT License - Feel free to use, modify, and distribute!

```
MIT License

Copyright (c) 2026 Daniel Henslowe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Credits

- **Development** - Built with [Claude Code](https://claude.ai/code)
- **Inspiration** - Classic NES platformers
- **Font** - Press Start 2P (Google Fonts)

---

*Made with pixels and passion*
