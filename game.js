// Pixel Plumber - A Retro NES-Style Platformer
// Built with vanilla JavaScript and HTML5 Canvas

const GAME_WIDTH = 800;
const GAME_HEIGHT = 480;
const TILE_SIZE = 32;
const GRAVITY = 0.6;
const FRICTION = 0.85;

// Game state
const game = {
  state: 'start', // start, playing, gameover, win
  score: 0,
  coins: 0,
  lives: 3,
  world: 1,
  level: 1,
  time: 400,
  camera: { x: 0 },
  lastTime: 0,
  accumulator: 0,
  frameTime: 1000 / 60
};

// Audio context for retro sound effects
let audioCtx = null;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  switch (type) {
    case 'jump':
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
      break;
    case 'coin':
      oscillator.frequency.setValueAtTime(988, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1319, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
      break;
    case 'stomp':
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
      break;
    case 'powerup':
      oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
      break;
    case 'break':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
      break;
    case 'bump':
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.05);
      break;
    case 'death':
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
      break;
    case 'flagpole':
      for (let i = 0; i < 6; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(392 * Math.pow(1.26, i), audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.15);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.15);
      }
      break;
  }
}

// Color palette (NES-inspired)
const COLORS = {
  sky: '#5c94fc',
  ground: '#c84c0c',
  groundDark: '#a02800',
  brick: '#d07030',
  brickDark: '#a04000',
  question: '#fbd000',
  questionDark: '#c89000',
  pipe: '#43b047',
  pipeDark: '#2a7a2e',
  player: '#e52521',
  playerSkin: '#ffb8a0',
  playerShirt: '#e52521',
  playerOveralls: '#0038f8',
  enemy: '#d07030',
  enemyDark: '#a04000',
  coin: '#fbd000',
  white: '#fcfcfc',
  black: '#000000'
};

// Input handling
const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  run: false
};

// Player
const player = {
  x: 80,
  y: 0,
  width: 24,
  height: 32,
  vx: 0,
  vy: 0,
  grounded: false,
  facing: 1,
  state: 'small', // small, big, fire
  animFrame: 0,
  animTimer: 0,
  invincible: 0,
  dead: false,
  deathTimer: 0
};

// Entities
let enemies = [];
let items = [];
let particles = [];
let floatingTexts = [];

// Level data
let level = {
  width: 0,
  height: 15,
  tiles: [],
  entities: []
};

// Tile types
const TILES = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  QUESTION_EMPTY: 4,
  PIPE_TL: 5,
  PIPE_TR: 6,
  PIPE_BL: 7,
  PIPE_BR: 8,
  BLOCK: 9,
  FLAGPOLE: 10,
  FLAG_TOP: 11,
  CASTLE: 12
};

// Entity types
const ENTITIES = {
  GOOMBA: 'goomba',
  KOOPA: 'koopa',
  COIN: 'coin',
  MUSHROOM: 'mushroom'
};

// Level generation
function generateLevel(worldNum, levelNum) {
  const width = 200 + worldNum * 20;
  level.width = width;
  level.tiles = [];
  level.entities = [];
  enemies = [];
  items = [];
  particles = [];
  floatingTexts = [];

  // Initialize empty level
  for (let y = 0; y < level.height; y++) {
    level.tiles[y] = [];
    for (let x = 0; x < width; x++) {
      level.tiles[y][x] = TILES.EMPTY;
    }
  }

  // Ground layer
  let groundHeight = 2;
  let gapStart = -1;

  for (let x = 0; x < width - 10; x++) {
    // Random gaps (not at start or end)
    if (x > 20 && x < width - 30 && Math.random() < 0.02 && gapStart === -1) {
      gapStart = x;
    }

    if (gapStart !== -1 && x - gapStart > 2 + Math.floor(Math.random() * 2)) {
      gapStart = -1;
    }

    if (gapStart === -1) {
      for (let y = level.height - groundHeight; y < level.height; y++) {
        level.tiles[y][x] = TILES.GROUND;
      }
    }
  }

  // Pipes
  let lastPipe = 0;
  for (let x = 20; x < width - 30; x++) {
    if (x - lastPipe > 15 && Math.random() < 0.05) {
      const pipeHeight = 2 + Math.floor(Math.random() * 3);
      const baseY = level.height - groundHeight - pipeHeight;

      // Check if ground exists
      if (level.tiles[level.height - 1][x] === TILES.GROUND) {
        for (let py = 0; py < pipeHeight; py++) {
          if (py === 0) {
            level.tiles[baseY + py][x] = TILES.PIPE_TL;
            level.tiles[baseY + py][x + 1] = TILES.PIPE_TR;
          } else {
            level.tiles[baseY + py][x] = TILES.PIPE_BL;
            level.tiles[baseY + py][x + 1] = TILES.PIPE_BR;
          }
        }
        lastPipe = x;
        x += 2;
      }
    }
  }

  // Floating platforms with bricks and question blocks
  for (let x = 15; x < width - 20; x++) {
    if (Math.random() < 0.04) {
      const platformY = level.height - groundHeight - 4 - Math.floor(Math.random() * 3);
      const platformLength = 3 + Math.floor(Math.random() * 5);

      for (let px = 0; px < platformLength; px++) {
        if (x + px < width) {
          if (Math.random() < 0.3) {
            level.tiles[platformY][x + px] = TILES.QUESTION;
          } else {
            level.tiles[platformY][x + px] = TILES.BRICK;
          }
        }
      }
      x += platformLength + 2;
    }
  }

  // Single question blocks
  for (let x = 10; x < width - 20; x++) {
    if (Math.random() < 0.02) {
      const blockY = level.height - groundHeight - 4;
      if (level.tiles[blockY][x] === TILES.EMPTY) {
        level.tiles[blockY][x] = TILES.QUESTION;
      }
    }
  }

  // Stairs near end
  const stairsStart = width - 25;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j <= i; j++) {
      const y = level.height - groundHeight - j - 1;
      const x = stairsStart + i;
      if (y >= 0) {
        level.tiles[y][x] = TILES.BLOCK;
      }
    }
  }

  // Flagpole
  const flagX = width - 12;
  level.tiles[level.height - groundHeight - 1][flagX] = TILES.BLOCK;
  for (let y = level.height - groundHeight - 9; y < level.height - groundHeight - 1; y++) {
    level.tiles[y][flagX] = TILES.FLAGPOLE;
  }
  level.tiles[level.height - groundHeight - 9][flagX] = TILES.FLAG_TOP;

  // Ground at end
  for (let x = width - 10; x < width; x++) {
    for (let y = level.height - groundHeight; y < level.height; y++) {
      level.tiles[y][x] = TILES.GROUND;
    }
  }

  // Castle
  for (let cy = 0; cy < 5; cy++) {
    for (let cx = 0; cx < 5; cx++) {
      level.tiles[level.height - groundHeight - 5 + cy][width - 7 + cx] = TILES.CASTLE;
    }
  }

  // Enemies
  for (let x = 25; x < width - 30; x++) {
    if (Math.random() < 0.03) {
      // Check if there's ground below
      if (level.tiles[level.height - 1][x] === TILES.GROUND) {
        enemies.push({
          type: Math.random() < 0.7 ? ENTITIES.GOOMBA : ENTITIES.KOOPA,
          x: x * TILE_SIZE,
          y: (level.height - groundHeight - 1) * TILE_SIZE,
          width: 28,
          height: 28,
          vx: -1.5,
          vy: 0,
          grounded: false,
          dead: false,
          deadTimer: 0,
          animFrame: 0,
          animTimer: 0,
          shell: false,
          shellMoving: false
        });
      }
    }
  }

  // Floating coins
  for (let x = 15; x < width - 20; x++) {
    if (Math.random() < 0.015) {
      const coinY = level.height - groundHeight - 3 - Math.floor(Math.random() * 4);
      if (level.tiles[coinY][x] === TILES.EMPTY) {
        items.push({
          type: ENTITIES.COIN,
          x: x * TILE_SIZE + 8,
          y: coinY * TILE_SIZE + 8,
          width: 16,
          height: 16,
          collected: false,
          animFrame: 0
        });
      }
    }
  }

  // Reset player position
  player.x = 80;
  player.y = (level.height - 4) * TILE_SIZE;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.dead = false;
  player.deathTimer = 0;
  player.invincible = 0;

  // Reset camera
  game.camera.x = 0;
  game.time = 400;
}

// Collision detection
function getTile(x, y) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  if (tileX < 0 || tileX >= level.width || tileY < 0 || tileY >= level.height) {
    return tileY >= level.height ? TILES.GROUND : TILES.EMPTY;
  }

  return level.tiles[tileY][tileX];
}

function isSolid(tile) {
  return tile === TILES.GROUND ||
         tile === TILES.BRICK ||
         tile === TILES.QUESTION ||
         tile === TILES.QUESTION_EMPTY ||
         tile === TILES.BLOCK ||
         tile === TILES.PIPE_TL ||
         tile === TILES.PIPE_TR ||
         tile === TILES.PIPE_BL ||
         tile === TILES.PIPE_BR ||
         tile === TILES.CASTLE;
}

function checkCollision(entity, offsetX = 0, offsetY = 0) {
  const left = entity.x + offsetX + 2;
  const right = entity.x + offsetX + entity.width - 2;
  const top = entity.y + offsetY;
  const bottom = entity.y + offsetY + entity.height;

  return isSolid(getTile(left, top)) ||
         isSolid(getTile(right, top)) ||
         isSolid(getTile(left, bottom - 1)) ||
         isSolid(getTile(right, bottom - 1));
}

function hitBlock(tileX, tileY) {
  const tile = level.tiles[tileY][tileX];

  if (tile === TILES.QUESTION) {
    level.tiles[tileY][tileX] = TILES.QUESTION_EMPTY;
    playSound('coin');

    // Spawn coin
    game.coins++;
    game.score += 200;

    floatingTexts.push({
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE,
      text: '200',
      timer: 60
    });

    particles.push({
      type: 'coin',
      x: tileX * TILE_SIZE + 8,
      y: tileY * TILE_SIZE - 16,
      vy: -10,
      timer: 30
    });

    // Random chance for mushroom
    if (Math.random() < 0.2 && player.state === 'small') {
      items.push({
        type: ENTITIES.MUSHROOM,
        x: tileX * TILE_SIZE,
        y: tileY * TILE_SIZE - TILE_SIZE,
        width: 28,
        height: 28,
        vx: 2,
        vy: 0,
        emerging: true,
        emergeY: tileY * TILE_SIZE
      });
    }
  } else if (tile === TILES.BRICK) {
    if (player.state !== 'small') {
      // Break brick
      level.tiles[tileY][tileX] = TILES.EMPTY;
      playSound('break');
      game.score += 50;

      // Spawn brick particles
      for (let i = 0; i < 4; i++) {
        particles.push({
          type: 'brick',
          x: tileX * TILE_SIZE + (i % 2) * 16,
          y: tileY * TILE_SIZE + Math.floor(i / 2) * 16,
          vx: (i % 2 === 0 ? -2 : 2) + Math.random() * 2,
          vy: -8 - Math.random() * 4,
          timer: 60
        });
      }
    } else {
      playSound('bump');
      // Bump animation could go here
    }
  } else if (tile === TILES.QUESTION_EMPTY || tile === TILES.BLOCK) {
    playSound('bump');
  }
}

// Update player
function updatePlayer() {
  if (player.dead) {
    player.deathTimer++;
    if (player.deathTimer < 20) {
      player.vy = -8;
    } else {
      player.vy += GRAVITY;
    }
    player.y += player.vy;

    if (player.deathTimer > 120) {
      game.lives--;
      if (game.lives <= 0) {
        game.state = 'gameover';
      } else {
        generateLevel(game.world, game.level);
      }
    }
    return;
  }

  // Invincibility timer
  if (player.invincible > 0) player.invincible--;

  // Horizontal movement
  const maxSpeed = keys.run ? 6 : 4;
  const accel = player.grounded ? 0.5 : 0.3;

  if (keys.left) {
    player.vx -= accel;
    player.facing = -1;
  }
  if (keys.right) {
    player.vx += accel;
    player.facing = 1;
  }

  // Apply friction
  if (!keys.left && !keys.right) {
    player.vx *= FRICTION;
  }

  // Clamp velocity
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
  if (Math.abs(player.vx) < 0.1) player.vx = 0;

  // Jump
  if (keys.jump && player.grounded) {
    player.vy = -12;
    player.grounded = false;
    playSound('jump');
  }

  // Variable jump height
  if (!keys.jump && player.vy < -4) {
    player.vy = -4;
  }

  // Gravity
  player.vy += GRAVITY;
  player.vy = Math.min(player.vy, 15);

  // Horizontal collision
  if (player.vx !== 0) {
    if (checkCollision(player, player.vx, 0)) {
      while (!checkCollision(player, Math.sign(player.vx), 0)) {
        player.x += Math.sign(player.vx);
      }
      player.vx = 0;
    } else {
      player.x += player.vx;
    }
  }

  // Vertical collision
  player.grounded = false;
  if (player.vy !== 0) {
    if (checkCollision(player, 0, player.vy)) {
      if (player.vy > 0) {
        player.grounded = true;
      } else {
        // Hit block above
        const headX = player.x + player.width / 2;
        const headY = player.y + player.vy;
        const tileX = Math.floor(headX / TILE_SIZE);
        const tileY = Math.floor(headY / TILE_SIZE);
        hitBlock(tileX, tileY);
      }

      while (!checkCollision(player, 0, Math.sign(player.vy))) {
        player.y += Math.sign(player.vy);
      }
      player.vy = 0;
    } else {
      player.y += player.vy;
    }
  }

  // Keep player in bounds (left side only)
  player.x = Math.max(game.camera.x, player.x);

  // Fall death
  if (player.y > level.height * TILE_SIZE) {
    playerDeath();
  }

  // Animation
  player.animTimer++;
  if (player.animTimer > 8) {
    player.animTimer = 0;
    player.animFrame = (player.animFrame + 1) % 4;
  }

  // Check flagpole
  const tileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
  const tileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
  if (getTile(player.x + player.width / 2, player.y + player.height / 2) === TILES.FLAGPOLE ||
      getTile(player.x + player.width / 2, player.y + player.height / 2) === TILES.FLAG_TOP) {
    // Level complete!
    game.score += game.time * 50;
    playSound('flagpole');

    if (game.level < 4) {
      game.level++;
    } else {
      game.level = 1;
      game.world++;
    }

    if (game.world > 4) {
      game.state = 'win';
    } else {
      generateLevel(game.world, game.level);
    }
  }
}

function playerDeath() {
  if (player.dead) return;
  player.dead = true;
  player.deathTimer = 0;
  player.vy = 0;
  playSound('death');
}

// Update enemies
function updateEnemies() {
  for (const enemy of enemies) {
    if (enemy.dead) {
      enemy.deadTimer++;
      if (enemy.deadTimer > 30) {
        enemy.remove = true;
      }
      continue;
    }

    // Shell physics
    if (enemy.shell && enemy.shellMoving) {
      enemy.vx = enemy.shellDir * 8;
    }

    // Movement
    enemy.x += enemy.vx;

    // Gravity
    enemy.vy += GRAVITY;
    enemy.vy = Math.min(enemy.vy, 15);

    // Ground collision
    enemy.grounded = false;
    const testY = enemy.y + enemy.vy + enemy.height;
    if (isSolid(getTile(enemy.x + 4, testY)) || isSolid(getTile(enemy.x + enemy.width - 4, testY))) {
      enemy.grounded = true;
      enemy.y = Math.floor(testY / TILE_SIZE) * TILE_SIZE - enemy.height;
      enemy.vy = 0;
    } else {
      enemy.y += enemy.vy;
    }

    // Wall collision (turn around)
    if (isSolid(getTile(enemy.x + (enemy.vx > 0 ? enemy.width : 0), enemy.y + enemy.height / 2))) {
      enemy.vx *= -1;
      if (enemy.shell) enemy.shellDir *= -1;
    }

    // Ledge detection (for non-shell enemies)
    if (!enemy.shell && enemy.grounded) {
      const checkX = enemy.vx > 0 ? enemy.x + enemy.width + 4 : enemy.x - 4;
      if (!isSolid(getTile(checkX, enemy.y + enemy.height + 4))) {
        enemy.vx *= -1;
      }
    }

    // Fall death
    if (enemy.y > level.height * TILE_SIZE) {
      enemy.remove = true;
    }

    // Animation
    enemy.animTimer++;
    if (enemy.animTimer > 15) {
      enemy.animTimer = 0;
      enemy.animFrame = (enemy.animFrame + 1) % 2;
    }

    // Player collision
    if (!player.dead && player.invincible === 0) {
      if (player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y) {

        // Check if stomping
        if (player.vy > 0 && player.y + player.height < enemy.y + enemy.height / 2 + 10) {
          // Stomp!
          if (enemy.type === ENTITIES.KOOPA && !enemy.shell) {
            enemy.shell = true;
            enemy.shellMoving = false;
            enemy.vx = 0;
            enemy.height = 20;
          } else if (enemy.shell && !enemy.shellMoving) {
            enemy.shellMoving = true;
            enemy.shellDir = player.x < enemy.x ? 1 : -1;
          } else {
            enemy.dead = true;
          }

          player.vy = -8;
          game.score += 100;
          playSound('stomp');

          floatingTexts.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y,
            text: '100',
            timer: 60
          });
        } else if (enemy.shell && !enemy.shellMoving) {
          // Kick shell
          enemy.shellMoving = true;
          enemy.shellDir = player.x < enemy.x ? 1 : -1;
          playSound('stomp');
        } else {
          // Player hit
          if (player.state !== 'small') {
            player.state = 'small';
            player.height = 32;
            player.invincible = 120;
            playSound('break');
          } else {
            playerDeath();
          }
        }
      }
    }

    // Shell hitting other enemies
    if (enemy.shell && enemy.shellMoving) {
      for (const other of enemies) {
        if (other !== enemy && !other.dead && !other.shell) {
          if (enemy.x < other.x + other.width &&
              enemy.x + enemy.width > other.x &&
              enemy.y < other.y + other.height &&
              enemy.y + enemy.height > other.y) {
            other.dead = true;
            game.score += 100;
            playSound('stomp');
          }
        }
      }
    }
  }

  // Remove dead enemies
  enemies = enemies.filter(e => !e.remove);
}

// Update items
function updateItems() {
  for (const item of items) {
    if (item.collected) continue;

    if (item.type === ENTITIES.COIN) {
      item.animFrame = (item.animFrame + 1) % 4;

      // Player collision
      if (player.x < item.x + item.width &&
          player.x + player.width > item.x &&
          player.y < item.y + item.height &&
          player.y + player.height > item.y) {
        item.collected = true;
        game.coins++;
        game.score += 200;
        playSound('coin');

        if (game.coins >= 100) {
          game.coins = 0;
          game.lives++;
        }
      }
    } else if (item.type === ENTITIES.MUSHROOM) {
      if (item.emerging) {
        item.y -= 1;
        if (item.y <= item.emergeY - TILE_SIZE) {
          item.emerging = false;
        }
        continue;
      }

      // Movement
      item.x += item.vx;

      // Gravity
      item.vy = (item.vy || 0) + GRAVITY;
      item.vy = Math.min(item.vy, 15);

      // Ground collision
      const testY = item.y + item.vy + item.height;
      if (isSolid(getTile(item.x + 4, testY)) || isSolid(getTile(item.x + item.width - 4, testY))) {
        item.y = Math.floor(testY / TILE_SIZE) * TILE_SIZE - item.height;
        item.vy = 0;
      } else {
        item.y += item.vy;
      }

      // Wall collision
      if (isSolid(getTile(item.x + (item.vx > 0 ? item.width : 0), item.y + item.height / 2))) {
        item.vx *= -1;
      }

      // Player collision
      if (player.x < item.x + item.width &&
          player.x + player.width > item.x &&
          player.y < item.y + item.height &&
          player.y + player.height > item.y) {
        item.collected = true;

        if (player.state === 'small') {
          player.state = 'big';
          player.height = 48;
          player.y -= 16;
        }

        game.score += 1000;
        playSound('powerup');

        floatingTexts.push({
          x: item.x,
          y: item.y,
          text: '1000',
          timer: 60
        });
      }
    }
  }

  items = items.filter(i => !i.collected);
}

// Update particles
function updateParticles() {
  for (const p of particles) {
    p.timer--;

    if (p.type === 'coin') {
      p.vy += 0.5;
      p.y += p.vy;
    } else if (p.type === 'brick') {
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  particles = particles.filter(p => p.timer > 0);
}

// Update floating texts
function updateFloatingTexts() {
  for (const ft of floatingTexts) {
    ft.timer--;
    ft.y -= 1;
  }

  floatingTexts = floatingTexts.filter(ft => ft.timer > 0);
}

// Update camera
function updateCamera() {
  const targetX = player.x - GAME_WIDTH / 3;
  game.camera.x = Math.max(game.camera.x, targetX);
  game.camera.x = Math.max(0, Math.min(game.camera.x, level.width * TILE_SIZE - GAME_WIDTH));
}

// Drawing functions
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

function drawTile(type, x, y) {
  const screenX = x * TILE_SIZE - game.camera.x;
  const screenY = y * TILE_SIZE;

  if (screenX < -TILE_SIZE || screenX > GAME_WIDTH) return;

  switch (type) {
    case TILES.GROUND:
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = COLORS.groundDark;
      ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
      // Add texture
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(screenX + 4 + i * 10, screenY + 12, 6, 4);
        ctx.fillRect(screenX + 8 + i * 10, screenY + 22, 6, 4);
      }
      break;

    case TILES.BRICK:
      ctx.fillStyle = COLORS.brick;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = COLORS.brickDark;
      ctx.fillRect(screenX, screenY + 14, TILE_SIZE, 2);
      ctx.fillRect(screenX + 14, screenY, 2, TILE_SIZE);
      ctx.fillRect(screenX + 6, screenY + 14, 2, 18);
      ctx.fillRect(screenX + 22, screenY + 14, 2, 18);
      break;

    case TILES.QUESTION:
      ctx.fillStyle = COLORS.question;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = COLORS.questionDark;
      ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
      ctx.fillRect(screenX + TILE_SIZE - 4, screenY, 4, TILE_SIZE);
      // Question mark
      ctx.fillStyle = COLORS.black;
      ctx.fillRect(screenX + 12, screenY + 6, 8, 4);
      ctx.fillRect(screenX + 16, screenY + 10, 4, 6);
      ctx.fillRect(screenX + 12, screenY + 14, 8, 4);
      ctx.fillRect(screenX + 12, screenY + 18, 4, 4);
      ctx.fillRect(screenX + 12, screenY + 24, 4, 4);
      break;

    case TILES.QUESTION_EMPTY:
      ctx.fillStyle = '#886644';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#664422';
      ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
      ctx.fillRect(screenX + TILE_SIZE - 4, screenY, 4, TILE_SIZE);
      break;

    case TILES.BLOCK:
      ctx.fillStyle = '#886644';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#664422';
      ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
      ctx.fillRect(screenX + TILE_SIZE - 4, screenY, 4, TILE_SIZE);
      ctx.fillStyle = '#aa8866';
      ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      break;

    case TILES.PIPE_TL:
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(screenX, screenY, 8, TILE_SIZE);
      ctx.fillStyle = '#6dd072';
      ctx.fillRect(screenX + 8, screenY, 8, TILE_SIZE);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
      break;

    case TILES.PIPE_TR:
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#6dd072';
      ctx.fillRect(screenX, screenY, 8, TILE_SIZE);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(screenX + TILE_SIZE - 8, screenY, 8, TILE_SIZE);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
      break;

    case TILES.PIPE_BL:
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(screenX + 4, screenY, 4, TILE_SIZE);
      ctx.fillStyle = '#6dd072';
      ctx.fillRect(screenX + 12, screenY, 8, TILE_SIZE);
      break;

    case TILES.PIPE_BR:
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#6dd072';
      ctx.fillRect(screenX + 4, screenY, 8, TILE_SIZE);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(screenX + TILE_SIZE - 8, screenY, 4, TILE_SIZE);
      break;

    case TILES.FLAGPOLE:
      ctx.fillStyle = '#00aa00';
      ctx.fillRect(screenX + 14, screenY, 4, TILE_SIZE);
      break;

    case TILES.FLAG_TOP:
      ctx.fillStyle = '#00aa00';
      ctx.fillRect(screenX + 14, screenY + 8, 4, TILE_SIZE - 8);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(screenX + 14, screenY, 4, 8);
      // Flag
      ctx.fillStyle = '#e52521';
      ctx.beginPath();
      ctx.moveTo(screenX + 14, screenY + 4);
      ctx.lineTo(screenX - 4, screenY + 12);
      ctx.lineTo(screenX + 14, screenY + 20);
      ctx.fill();
      break;

    case TILES.CASTLE:
      ctx.fillStyle = '#888888';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#666666';
      ctx.fillRect(screenX + 4, screenY + 4, 8, 8);
      ctx.fillRect(screenX + 20, screenY + 4, 8, 8);
      ctx.fillRect(screenX + 12, screenY + 16, 8, TILE_SIZE - 16);
      break;
  }
}

function drawPlayer() {
  if (player.dead) {
    // Death animation
    const screenX = player.x - game.camera.x;
    const screenY = player.y;

    ctx.fillStyle = COLORS.playerOveralls;
    ctx.fillRect(screenX + 4, screenY + 16, 16, 16);
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(screenX + 4, screenY + 4, 16, 12);
    ctx.fillStyle = COLORS.playerSkin;
    ctx.fillRect(screenX + 6, screenY, 12, 8);
    return;
  }

  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
    return; // Blinking
  }

  const screenX = player.x - game.camera.x;
  const screenY = player.y;
  const isBig = player.state !== 'small';
  const height = isBig ? 48 : 32;
  const flip = player.facing === -1;

  ctx.save();

  if (flip) {
    ctx.translate(screenX + player.width, 0);
    ctx.scale(-1, 1);
    ctx.translate(-screenX, 0);
  }

  if (isBig) {
    // Big player
    // Boots
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(screenX + 2, screenY + 40, 8, 8);
    ctx.fillRect(screenX + 14, screenY + 40, 8, 8);

    // Legs (overalls)
    ctx.fillStyle = COLORS.playerOveralls;
    ctx.fillRect(screenX + 4, screenY + 28, 6, 14);
    ctx.fillRect(screenX + 14, screenY + 28, 6, 14);

    // Body (overalls)
    ctx.fillStyle = COLORS.playerOveralls;
    ctx.fillRect(screenX + 2, screenY + 18, 20, 14);

    // Arms/Shirt
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(screenX, screenY + 18, 4, 12);
    ctx.fillRect(screenX + 20, screenY + 18, 4, 12);

    // Hands
    ctx.fillStyle = COLORS.playerSkin;
    ctx.fillRect(screenX, screenY + 26, 4, 6);
    ctx.fillRect(screenX + 20, screenY + 26, 4, 6);

    // Head
    ctx.fillStyle = COLORS.playerSkin;
    ctx.fillRect(screenX + 4, screenY + 8, 16, 12);

    // Hat
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(screenX + 2, screenY + 4, 20, 6);
    ctx.fillRect(screenX + 6, screenY, 12, 6);

    // Face
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(screenX + 14, screenY + 12, 3, 3);
    ctx.fillStyle = '#e8a060';
    ctx.fillRect(screenX + 16, screenY + 16, 4, 3);
  } else {
    // Small player
    // Boots
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(screenX + 4, screenY + 26, 6, 6);
    ctx.fillRect(screenX + 14, screenY + 26, 6, 6);

    // Body (overalls)
    ctx.fillStyle = COLORS.playerOveralls;
    ctx.fillRect(screenX + 4, screenY + 16, 16, 12);

    // Arms
    ctx.fillStyle = COLORS.playerSkin;
    ctx.fillRect(screenX + 2, screenY + 16, 4, 8);
    ctx.fillRect(screenX + 18, screenY + 16, 4, 8);

    // Head
    ctx.fillStyle = COLORS.playerSkin;
    ctx.fillRect(screenX + 6, screenY + 6, 12, 12);

    // Hat
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(screenX + 4, screenY + 4, 16, 6);
    ctx.fillRect(screenX + 8, screenY, 8, 6);

    // Face
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(screenX + 14, screenY + 10, 2, 2);
    ctx.fillStyle = '#e8a060';
    ctx.fillRect(screenX + 16, screenY + 12, 3, 2);
  }

  ctx.restore();
}

function drawEnemy(enemy) {
  const screenX = enemy.x - game.camera.x;
  const screenY = enemy.y;

  if (screenX < -TILE_SIZE || screenX > GAME_WIDTH + TILE_SIZE) return;

  if (enemy.dead) {
    // Squished
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(screenX + 4, screenY + 20, 20, 8);
    return;
  }

  if (enemy.type === ENTITIES.GOOMBA) {
    // Body
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(screenX + 4, screenY + 4, 20, 16);

    // Head
    ctx.fillStyle = COLORS.enemyDark;
    ctx.fillRect(screenX + 2, screenY, 24, 8);

    // Eyes
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(screenX + 6, screenY + 8, 6, 6);
    ctx.fillRect(screenX + 16, screenY + 8, 6, 6);
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(screenX + 8, screenY + 10, 3, 3);
    ctx.fillRect(screenX + 18, screenY + 10, 3, 3);

    // Feet
    ctx.fillStyle = COLORS.enemyDark;
    const footOffset = enemy.animFrame * 4;
    ctx.fillRect(screenX + 2 - footOffset, screenY + 20, 10, 8);
    ctx.fillRect(screenX + 16 + footOffset, screenY + 20, 10, 8);
  } else if (enemy.type === ENTITIES.KOOPA) {
    if (enemy.shell) {
      // Shell
      ctx.fillStyle = '#43b047';
      ctx.fillRect(screenX + 4, screenY + 4, 20, 16);
      ctx.fillStyle = '#2a7a2e';
      ctx.fillRect(screenX + 6, screenY + 6, 16, 4);
      ctx.fillRect(screenX + 8, screenY + 10, 12, 6);
    } else {
      // Body (green shell)
      ctx.fillStyle = '#43b047';
      ctx.fillRect(screenX + 4, screenY + 8, 20, 12);

      // Head
      ctx.fillStyle = '#fbd000';
      ctx.fillRect(screenX + 6, screenY, 12, 10);

      // Eyes
      ctx.fillStyle = COLORS.black;
      ctx.fillRect(screenX + 8, screenY + 4, 3, 3);

      // Feet
      ctx.fillStyle = '#fbd000';
      const footOffset = enemy.animFrame * 3;
      ctx.fillRect(screenX + 4 - footOffset, screenY + 20, 8, 8);
      ctx.fillRect(screenX + 16 + footOffset, screenY + 20, 8, 8);
    }
  }
}

function drawItem(item) {
  const screenX = item.x - game.camera.x;
  const screenY = item.y;

  if (screenX < -TILE_SIZE || screenX > GAME_WIDTH + TILE_SIZE) return;

  if (item.type === ENTITIES.COIN) {
    // Animated coin
    const frame = Math.floor(item.animFrame / 2) % 4;
    const widths = [16, 12, 4, 12];
    const width = widths[frame];
    const offsetX = (16 - width) / 2;

    ctx.fillStyle = COLORS.coin;
    ctx.fillRect(screenX + offsetX, screenY, width, 16);

    if (width > 8) {
      ctx.fillStyle = COLORS.questionDark;
      ctx.fillRect(screenX + offsetX + 2, screenY + 4, width - 4, 8);
    }
  } else if (item.type === ENTITIES.MUSHROOM) {
    // Cap
    ctx.fillStyle = '#e52521';
    ctx.fillRect(screenX + 2, screenY, 24, 14);

    // Spots
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(screenX + 6, screenY + 4, 6, 6);
    ctx.fillRect(screenX + 16, screenY + 4, 6, 6);

    // Stem
    ctx.fillStyle = '#f0d0b0';
    ctx.fillRect(screenX + 6, screenY + 14, 16, 14);

    // Eyes
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(screenX + 10, screenY + 18, 3, 3);
    ctx.fillRect(screenX + 16, screenY + 18, 3, 3);
  }
}

function drawParticle(p) {
  const screenX = p.x - game.camera.x;

  if (p.type === 'coin') {
    ctx.fillStyle = COLORS.coin;
    ctx.fillRect(screenX, p.y, 16, 16);
  } else if (p.type === 'brick') {
    ctx.fillStyle = COLORS.brick;
    ctx.fillRect(screenX, p.y, 12, 12);
    ctx.fillStyle = COLORS.brickDark;
    ctx.fillRect(screenX + 6, p.y, 2, 12);
    ctx.fillRect(screenX, p.y + 6, 12, 2);
  }
}

function drawFloatingText(ft) {
  const screenX = ft.x - game.camera.x;

  ctx.fillStyle = COLORS.white;
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillText(ft.text, screenX - 16, ft.y);
}

function drawBackground() {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#5c94fc');
  gradient.addColorStop(1, '#88b4fc');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Clouds
  ctx.fillStyle = '#fcfcfc';
  const cloudPositions = [100, 350, 650, 950, 1300, 1700, 2100, 2500, 2900, 3300, 3700, 4100];

  for (const baseX of cloudPositions) {
    const x = baseX - (game.camera.x * 0.3) % 500;
    if (x > -100 && x < GAME_WIDTH + 100) {
      // Simple cloud shape
      ctx.beginPath();
      ctx.arc(x, 80, 24, 0, Math.PI * 2);
      ctx.arc(x + 30, 80, 32, 0, Math.PI * 2);
      ctx.arc(x + 60, 80, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hills
  ctx.fillStyle = '#43b047';
  for (let i = 0; i < 6; i++) {
    const hillX = i * 400 - (game.camera.x * 0.5) % 400;
    ctx.beginPath();
    ctx.arc(hillX, GAME_HEIGHT - 60, 100, Math.PI, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(hillX + 200, GAME_HEIGHT - 60, 60, Math.PI, 0);
    ctx.fill();
  }

  // Bushes
  ctx.fillStyle = '#2a7a2e';
  for (let i = 0; i < 10; i++) {
    const bushX = i * 250 - (game.camera.x * 0.7) % 250 + 50;
    ctx.beginPath();
    ctx.arc(bushX, GAME_HEIGHT - 60, 20, Math.PI, 0);
    ctx.arc(bushX + 25, GAME_HEIGHT - 60, 25, Math.PI, 0);
    ctx.arc(bushX + 50, GAME_HEIGHT - 60, 20, Math.PI, 0);
    ctx.fill();
  }
}

function render() {
  // Clear
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Draw background
  drawBackground();

  // Draw tiles
  const startTile = Math.floor(game.camera.x / TILE_SIZE);
  const endTile = Math.ceil((game.camera.x + GAME_WIDTH) / TILE_SIZE);

  for (let y = 0; y < level.height; y++) {
    for (let x = startTile; x <= endTile && x < level.width; x++) {
      const tile = level.tiles[y][x];
      if (tile !== TILES.EMPTY) {
        drawTile(tile, x, y);
      }
    }
  }

  // Draw items
  for (const item of items) {
    drawItem(item);
  }

  // Draw enemies
  for (const enemy of enemies) {
    drawEnemy(enemy);
  }

  // Draw particles
  for (const p of particles) {
    drawParticle(p);
  }

  // Draw player
  drawPlayer();

  // Draw floating texts
  for (const ft of floatingTexts) {
    drawFloatingText(ft);
  }
}

// Update UI
function updateUI() {
  document.getElementById('score').textContent = game.score.toString().padStart(6, '0');
  document.getElementById('coins').textContent = 'x' + game.coins.toString().padStart(2, '0');
  document.getElementById('world').textContent = game.world + '-' + game.level;
  document.getElementById('time').textContent = Math.ceil(game.time).toString();
  document.getElementById('lives').textContent = 'x' + game.lives;
}

// Game loop
function gameLoop(timestamp) {
  if (!game.lastTime) game.lastTime = timestamp;
  const deltaTime = timestamp - game.lastTime;
  game.lastTime = timestamp;

  if (game.state === 'playing') {
    game.accumulator += deltaTime;

    while (game.accumulator >= game.frameTime) {
      // Update game time
      game.time -= game.frameTime / 1000;
      if (game.time <= 0) {
        game.time = 0;
        playerDeath();
      }

      updatePlayer();
      updateEnemies();
      updateItems();
      updateParticles();
      updateFloatingTexts();
      updateCamera();

      game.accumulator -= game.frameTime;
    }

    render();
    updateUI();
  }

  requestAnimationFrame(gameLoop);
}

// Input handlers
function handleKeyDown(e) {
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = true;
      break;
    case 'ArrowUp':
    case 'KeyW':
    case 'Space':
      keys.jump = true;
      if (game.state === 'start') {
        startGame();
      } else if (game.state === 'gameover' || game.state === 'win') {
        resetGame();
      }
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.down = true;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      keys.run = true;
      break;
    case 'Enter':
      if (game.state === 'start') {
        startGame();
      } else if (game.state === 'gameover' || game.state === 'win') {
        resetGame();
      }
      break;
  }
}

function handleKeyUp(e) {
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = false;
      break;
    case 'ArrowUp':
    case 'KeyW':
    case 'Space':
      keys.jump = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.down = false;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      keys.run = false;
      break;
  }
}

// Mobile controls
function setupMobileControls() {
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnA = document.getElementById('btn-a');
  const btnB = document.getElementById('btn-b');

  function addTouchEvents(btn, keyName) {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      keys[keyName] = true;
      if (keyName === 'jump' && (game.state === 'start' || game.state === 'gameover' || game.state === 'win')) {
        if (game.state === 'start') startGame();
        else resetGame();
      }
    });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      keys[keyName] = false;
    });
  }

  addTouchEvents(btnUp, 'jump');
  addTouchEvents(btnLeft, 'left');
  addTouchEvents(btnRight, 'right');
  addTouchEvents(btnDown, 'down');
  addTouchEvents(btnA, 'jump');
  addTouchEvents(btnB, 'run');
}

// Game state functions
function startGame() {
  initAudio();
  game.state = 'playing';
  document.getElementById('start-screen').classList.add('hidden');
  generateLevel(game.world, game.level);
}

function resetGame() {
  game.score = 0;
  game.coins = 0;
  game.lives = 3;
  game.world = 1;
  game.level = 1;
  game.state = 'playing';
  player.state = 'small';
  player.height = 32;

  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('win-screen').classList.add('hidden');

  generateLevel(game.world, game.level);
}

function showGameOver() {
  document.getElementById('final-score').textContent = game.score;
  document.getElementById('game-over-screen').classList.remove('hidden');
}

function showWin() {
  document.getElementById('win-score').textContent = game.score;
  document.getElementById('win-screen').classList.remove('hidden');
}

// Watch for game over/win states
setInterval(() => {
  if (game.state === 'gameover') {
    showGameOver();
  } else if (game.state === 'win') {
    showWin();
  }
}, 100);

// Initialize
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
setupMobileControls();

// Scale canvas for crisp pixels
function resizeCanvas() {
  const container = document.getElementById('game-container');
  const maxWidth = window.innerWidth - 32;
  const maxHeight = window.innerHeight - 32;

  const scale = Math.min(maxWidth / GAME_WIDTH, maxHeight / GAME_HEIGHT, 2);

  canvas.style.width = (GAME_WIDTH * scale) + 'px';
  canvas.style.height = (GAME_HEIGHT * scale) + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Start game loop
requestAnimationFrame(gameLoop);

console.log('Pixel Plumber loaded! Press Enter to start.');
