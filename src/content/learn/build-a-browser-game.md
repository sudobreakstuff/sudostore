---
title: "Build a Browser Game"
description: "HTML5 Canvas game built from scratch with JavaScript, deployed to Cloudflare Pages for free."
published: 2026-09-10
level: "beginner"
tags: ["diy-kit", "beginner", "javascript", "canvas", "game", "html5"]
faqs:
  - q: "What game do you build?"
    a: "A side-scroller where you jump over obstacles, collect coins and avoid enemies."
  - q: "Do I need a server?"
    a: "No. Cloudflare Pages hosts it as static files, no backend needed."
  - q: "Can I change the game?"
    a: "Everything is explained. Add levels, power-ups, new characters — it's your code."
---

## What you need

No physical hardware. Just a computer with:

- A code editor (VS Code recommended)
- A web browser (Chrome, Firefox, Edge)
- A free Cloudflare Pages account (or any static hosting)
- Git (optional, for deploying)

## Step 1: Understand the game loop

Every game has a loop that runs 60 times per second:

```
   Game Loop:
   ┌─────────────────────────────────────┐
   │                                     │
   │  1. READ INPUT                      │
   │     (keyboard, mouse, touch)        │
   │             │                       │
   │             ▼                       │
   │  2. UPDATE WORLD                    │
   │     (move player, gravity,         │
   │      collisions, spawn enemies)    │
   │             │                       │
   │             ▼                       │
   │  3. DRAW FRAME                    │
   │     (clear canvas, draw all        │
   │      objects, HUD, score)         │
   │             │                       │
   │             ▼                       │
   │  4. WAIT ~16ms                      │
   │     (to hit 60fps)                │
   │             │                       │
   │             └──────→ (back to 1)   │
   └─────────────────────────────────────┘
```

## Step 2: Set up the project

Create a folder called `my-game` and these files:

```
   my-game/
   ├── index.html     ← loads the game
   ├── style.css      ← styles the page
   ├── game.js        ← all game logic
   └── assets/        ← images and sounds (optional)
       ├── player.png
       ├── obstacle.png
       └── coin.png
```

**index.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Game</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="game" width="800" height="400"></canvas>
  <script src="game.js"></script>
</body>
</html>
```

**style.css:**
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a14; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
canvas { border: 2px solid #3da9ff; border-radius: 4px; }
```

## Step 3: The canvas and game state

```javascript
// game.js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
const state = {
  player: { x: 50, y: 300, width: 30, height: 40, vy: 0, jumping: false },
  obstacles: [],
  coins: [],
  score: 0,
  speed: 5,
  frame: 0,
  keys: {}
};

// Read keyboard input
document.addEventListener('keydown', (e) => state.keys[e.code] = true);
document.addEventListener('keyup', (e) => state.keys[e.code] = false);
```

**Result:** The game canvas is set up and we can track the player, obstacles, coins and keyboard input.

## Step 4: Player physics

```javascript
function updatePlayer() {
  const p = state.player;

  // Gravity
  p.vy += 0.5;
  p.y += p.vy;

  // Ground collision
  if (p.y + p.height > 360) {
    p.y = 360 - p.height;
    p.vy = 0;
    p.jumping = false;
  }

  // Jump (only when on ground)
  if (state.keys['Space'] && !p.jumping) {
    p.vy = -12;
    p.jumping = true;
  }
}

function drawPlayer() {
  const p = state.player;
  ctx.fillStyle = '#3da9ff';
  ctx.fillRect(p.x, p.y, p.width, p.height);
  // Eyes
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(p.x + 8, p.y + 8, 6, 6);
  ctx.fillRect(p.x + 18, p.y + 8, 6, 6);
}
```

**Result:** The player falls with gravity, stands on the ground and jumps with the space bar.

## Step 5: Spawn and move obstacles

```javascript
function spawnObstacle() {
  if (Math.random() < 0.02) { // 2% chance per frame
    state.obstacles.push({
      x: 800,
      y: 360 - 30,
      width: 25,
      height: 30
    });
  }
}

function updateObstacles() {
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const obs = state.obstacles[i];
    obs.x -= state.speed;

    // Remove off-screen
    if (obs.x + obs.width < 0) {
      state.obstacles.splice(i, 1);
      state.score += 10;
    }
  }
}

function drawObstacles() {
  ctx.fillStyle = '#ff2b2b';
  state.obstacles.forEach(obs => {
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });
}
```

**Result:** Red obstacles spawn on the right, move left, and award 10 points each when dodged.

## Step 6: Collision detection

```javascript
function checkCollisions() {
  const p = state.player;
  for (const obs of state.obstacles) {
    if (p.x < obs.x + obs.width &&
        p.x + p.width > obs.x &&
        p.y < obs.y + obs.height &&
        p.y + p.height > obs.y) {
      return true; // collision!
    }
  }
  return false;
}
```

Add to the game loop:

```javascript
function gameOver() {
  ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
  ctx.fillRect(0, 0, 800, 400);
  ctx.fillStyle = '#ff2b2b';
  ctx.font = '48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', 400, 190);
  ctx.fillStyle = '#3da9ff';
  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${state.score}`, 400, 240);
  ctx.fillText('Press R to restart', 400, 290);

  if (state.keys['KeyR']) restartGame();
}

function restartGame() {
  state.player = { x: 50, y: 300, width: 30, height: 40, vy: 0, jumping: false };
  state.obstacles = [];
  state.coins = [];
  state.score = 0;
  state.speed = 5;
  state.frame = 0;
}
```

**Result:** Hitting an obstacle ends the game with a "GAME OVER" screen. Press R to restart.

## Step 7: Coin collection

```javascript
function spawnCoins() {
  if (Math.random() < 0.01) {
    state.coins.push({
      x: 800,
      y: 360 - 40 - Math.random() * 100, // various heights
      width: 20,
      height: 20
    });
  }
}

function updateCoins() {
  for (let i = state.coins.length - 1; i >= 0; i--) {
    state.coins[i].x -= state.speed;
    if (state.coins[i].x + state.coins[i].width < 0) {
      state.coins.splice(i, 1);
    }
  }
}

function checkCoinCollision() {
  const p = state.player;
  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i];
    if (p.x < c.x + c.width && p.x + p.width > c.x &&
        p.y < c.y + c.height && p.y + p.height > c.y) {
      state.coins.splice(i, 1);
      state.score += 5;
    }
  }
}

function drawCoins() {
  ctx.fillStyle = '#f0f4ff';
  state.coins.forEach(c => {
    ctx.fillRect(c.x, c.y, c.width, c.height);
  });
}
```

## Step 8: Draw everything — the full loop

```javascript
function gameLoop() {
  ctx.clearRect(0, 0, 800, 400);

  // Background
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, 800, 400);

  // Ground
  ctx.fillStyle = '#ff2b2b';
  ctx.fillRect(0, 360, 800, 40);

  // Spawn
  spawnObstacles();
  spawnCoins();

  // Update
  updatePlayer();
  updateObstacles();
  updateCoins();

  // Draw
  drawObstacles();
  drawCoins();
  drawPlayer();

  // HUD
  ctx.fillStyle = '#3da9ff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 10, 30);
  ctx.fillText(`Speed: ${state.speed.toFixed(1)}`, 10, 55);

  // Collision check
  if (checkCollisions()) {
    gameOver();
  } else {
    checkCoinCollision();
    state.frame++;
    if (state.frame % 300 === 0) state.speed += 0.2; // get harder
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
```

**Result:** A working side-scroller with jumping, obstacles, coins, scoring and increasing difficulty.

## Step 9: Deploy to Cloudflare Pages

```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Log in to Cloudflare
wrangler login

# Create the Pages project
wrangler pages deploy ./my-game
```

**Result:** Your game is live at `https://my-game-abc123.pages.dev`.

## Step 10: Customise it

- Add sprite art — replace rectangles with images
- Add sound effects — use the Web Audio API
- Add levels — increase speed and spawn rate
- Add power-ups — shields, slow-mo, double jump
- Save high scores — use localStorage

## What's next?

Build a **Personal Dashboard** — another software project that displays your data.
