"use strict";

// A self-contained arcade game: no libraries, build tools, or external assets.
const COLS = 20;
const ROWS = 12;
const TILE = 40;
const BEST_KEY = "pulse-runner-best";
const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

const LEVELS = [
  {
    name: "First Contact",
    time: 75,
    walls: [
      { axis: "v", fixed: 5, from: 1, to: 8, gaps: [4] },
      { axis: "v", fixed: 10, from: 3, to: 10, gaps: [7] },
      { axis: "v", fixed: 15, from: 1, to: 8, gaps: [5] },
      { axis: "h", fixed: 6, from: 11, to: 14, gaps: [13] },
    ],
    cores: [[3, 3], [8, 2], [13, 4], [17, 8]],
    guards: [[8, 8], [17, 3]],
    hazards: [[5, 4], [10, 7], [15, 5]],
  },
  {
    name: "Crossed Wires",
    time: 95,
    walls: [
      { axis: "v", fixed: 4, from: 1, to: 9, gaps: [7] },
      { axis: "v", fixed: 8, from: 2, to: 10, gaps: [4] },
      { axis: "v", fixed: 12, from: 1, to: 9, gaps: [6] },
      { axis: "v", fixed: 16, from: 2, to: 10, gaps: [8] },
      { axis: "h", fixed: 5, from: 5, to: 7, gaps: [6] },
      { axis: "h", fixed: 8, from: 9, to: 11, gaps: [10] },
      { axis: "h", fixed: 3, from: 13, to: 15, gaps: [14] },
    ],
    cores: [[2, 8], [6, 2], [10, 9], [14, 7], [18, 3]],
    guards: [[6, 9], [11, 2], [17, 9]],
    hazards: [[4, 7], [8, 4], [12, 6], [16, 8]],
  },
  {
    name: "Final Circuit",
    time: 115,
    walls: [
      { axis: "v", fixed: 4, from: 1, to: 10, gaps: [3, 8] },
      { axis: "v", fixed: 8, from: 1, to: 9, gaps: [5] },
      { axis: "v", fixed: 12, from: 2, to: 10, gaps: [7] },
      { axis: "v", fixed: 16, from: 1, to: 9, gaps: [4] },
      { axis: "h", fixed: 6, from: 1, to: 3, gaps: [2] },
      { axis: "h", fixed: 3, from: 5, to: 7, gaps: [6] },
      { axis: "h", fixed: 9, from: 9, to: 11, gaps: [10] },
      { axis: "h", fixed: 5, from: 13, to: 15, gaps: [14] },
    ],
    cores: [[2, 3], [6, 9], [10, 2], [14, 8], [18, 2], [18, 9]],
    guards: [[6, 6], [10, 8], [14, 2], [18, 7]],
    hazards: [[4, 3], [8, 5], [12, 7], [16, 4]],
  },
];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlayKicker");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const overlayButton = document.getElementById("overlayButton");
const overlayHint = document.getElementById("overlayHint");
const pauseButton = document.getElementById("pauseButton");
const soundButton = document.getElementById("soundButton");
const messageElement = document.getElementById("gameMessage");
const announcer = document.getElementById("announcer");

let overlayAction = () => {};
let audioContext = null;
let soundEnabled = false;
let lastFrame = performance.now();
let messageUntil = 0;

const game = {
  state: "start",
  levelIndex: 0,
  level: null,
  player: { x: 1, y: 1, dx: 1, dy: 0 },
  health: 3,
  score: 0,
  best: readBest(),
  elapsed: 0,
  timeLeft: 75,
  dashCooldown: 0,
  invulnerable: 0,
  lastMoveAt: 0,
  particles: [],
};

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  if (game.score <= game.best) return;
  game.best = game.score;
  try {
    localStorage.setItem(BEST_KEY, String(game.best));
  } catch {
    // The game still works when storage is blocked.
  }
}

function createLevel(config) {
  const walls = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1)
  );

  for (const segment of config.walls) {
    for (let position = segment.from; position <= segment.to; position++) {
      if (segment.gaps.includes(position)) continue;
      const x = segment.axis === "v" ? segment.fixed : position;
      const y = segment.axis === "v" ? position : segment.fixed;
      walls[y][x] = true;
    }
  }

  return {
    walls,
    cores: config.cores.map(([x, y]) => ({ x, y, collected: false })),
    guards: config.guards.map(([x, y], index) => ({ x, y, dx: 0, dy: 1, timer: index * 0.16 })),
    hazards: config.hazards.map(([x, y]) => ({ x, y })),
    exit: { x: 18, y: 10 },
  };
}

function loadLevel(index) {
  game.levelIndex = index;
  game.level = createLevel(LEVELS[index]);
  game.player = { x: 1, y: 1, dx: 1, dy: 0 };
  game.elapsed = 0;
  game.timeLeft = LEVELS[index].time;
  game.dashCooldown = 0;
  game.invulnerable = 0;
  game.lastMoveAt = 0;
  game.particles = [];
  setMessage("Collect the cores to unlock the portal.");
  updateHud();
}

function startNewGame() {
  game.health = 3;
  game.score = 0;
  loadLevel(0);
  game.state = "playing";
  hideOverlay();
  playCue("start");
  updateHud();
}

function nextLevel() {
  loadLevel(game.levelIndex + 1);
  game.state = "playing";
  hideOverlay();
  playCue("start");
  updateHud();
}

function showOverlay(kicker, title, body, buttonText, action, hint = "Move with WASD or arrow keys · Space to dash · P to pause") {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayBody.textContent = body;
  overlayButton.innerHTML = `${buttonText} <span aria-hidden="true">→</span>`;
  overlayHint.textContent = hint;
  overlayAction = action;
  overlay.classList.remove("hidden");
  updateHud();
}

function hideOverlay() {
  overlay.classList.add("hidden");
  updateHud();
}

function displayStateOverlay() {
  if (game.state === "start") {
    showOverlay("MISSION 01 / 03", "ENTER THE GRID", "Collect every energy core and reach the exit. Dodge moving sentries and lasers. You have three hearts.", "Start game", startNewGame);
  } else if (game.state === "paused") {
    showOverlay("MISSION PAUSED", "TAKE A BREATH", "Your timer and the sentries are frozen. Return when you are ready to continue.", "Resume game", resumeGame);
  } else if (game.state === "levelComplete") {
    showOverlay(`LEVEL ${String(game.levelIndex + 1).padStart(2, "0")} CLEARED`, "CIRCUIT RESTORED", `Score: ${formatScore(game.score)}. The next maze has more cores and sentries.`, "Next level", nextLevel);
  } else if (game.state === "won") {
    showOverlay("ALL SYSTEMS ONLINE", "YOU DID IT!", `You cleared all three levels with ${formatScore(game.score)} points. Best score: ${formatScore(game.best)}.`, "Play again", startNewGame);
  } else if (game.state === "gameOver") {
    showOverlay("CONNECTION LOST", "GAME OVER", `Final score: ${formatScore(game.score)}. Your best score is ${formatScore(game.best)}.`, "Try again", startNewGame);
  }
}

function pauseGame() {
  if (game.state !== "playing") return;
  game.state = "paused";
  displayStateOverlay();
  announce("Game paused");
}

function resumeGame() {
  if (game.state !== "paused") return;
  game.state = "playing";
  hideOverlay();
  announce("Game resumed");
}

function togglePause() {
  if (game.state === "playing") pauseGame();
  else if (game.state === "paused") resumeGame();
}

function showHelp() {
  const wasPlaying = game.state === "playing";
  if (wasPlaying) game.state = "paused";
  showOverlay(
    "HOW TO PLAY",
    "RUN THE CIRCUIT",
    "Move with WASD, arrow keys, or the touch pad. Press Space or DASH to burst up to three tiles. Collect all yellow cores, avoid red sentries and pulsing laser tiles, then reach the green portal.",
    wasPlaying ? "Resume game" : "Back",
    wasPlaying ? resumeGame : displayStateOverlay,
    "Dash recharges in five seconds · P or Esc pauses the game"
  );
}

function setMessage(message, duration = 0) {
  messageElement.textContent = message;
  messageUntil = duration ? performance.now() + duration : 0;
}

function defaultMessage() {
  return game.level.cores.every(core => core.collected)
    ? "All cores collected! Reach the green portal."
    : "Collect the cores to unlock the portal.";
}

function announce(message) {
  announcer.textContent = message;
}

function formatScore(value) {
  return Math.floor(value).toString().padStart(4, "0");
}

function laserState() {
  const phase = game.elapsed % 3.4;
  return phase < 2.2 ? "safe" : phase < 2.7 ? "charging" : "live";
}

function updateHud() {
  document.getElementById("levelName").textContent = LEVELS[game.levelIndex].name;
  document.getElementById("levelNumber").textContent = `${String(game.levelIndex + 1).padStart(2, "0")} / 03`;
  document.getElementById("coresFound").textContent = game.level.cores.filter(core => core.collected).length;
  document.getElementById("coresTotal").textContent = game.level.cores.length;
  const hearts = `${"♥ ".repeat(game.health)}${"♡ ".repeat(3 - game.health)}`.trim();
  document.getElementById("healthValue").textContent = hearts;
  document.getElementById("healthValue").setAttribute("aria-label", `${game.health} hearts remaining`);
  const timer = document.getElementById("timerValue");
  timer.textContent = Math.max(0, Math.ceil(game.timeLeft));
  timer.style.color = game.timeLeft <= 15 ? "#ff8593" : "#79edf1";
  document.getElementById("dashValue").textContent = game.dashCooldown <= 0 ? "READY" : `${game.dashCooldown.toFixed(1)}S`;
  const pulse = document.getElementById("pulseValue");
  pulse.textContent = laserState().toUpperCase();
  pulse.style.color = laserState() === "live" ? "#ff768f" : laserState() === "charging" ? "#ffd277" : "#63e4ed";
  document.getElementById("scoreValue").textContent = formatScore(game.score);
  document.getElementById("bestValue").textContent = formatScore(game.best);
  pauseButton.disabled = !["playing", "paused"].includes(game.state);
  pauseButton.innerHTML = game.state === "paused" ? "Resume <span aria-hidden=\"true\">▶</span>" : "Pause <span aria-hidden=\"true\">Ⅱ</span>";
}

function isFloor(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS && !game.level.walls[y][x];
}

function attemptMove(dx, dy) {
  if (game.state !== "playing") return;
  const now = performance.now();
  if (now - game.lastMoveAt < 85) return;
  game.lastMoveAt = now;
  game.player.dx = dx;
  game.player.dy = dy;
  const x = game.player.x + dx;
  const y = game.player.y + dy;
  if (!isFloor(x, y)) {
    playCue("wall");
    return;
  }
  game.player.x = x;
  game.player.y = y;
  visitTile();
  if (game.state === "playing") checkCollision();
  updateHud();
}

function dash() {
  if (game.state !== "playing") return;
  if (game.dashCooldown > 0) {
    setMessage(`Dash ready in ${game.dashCooldown.toFixed(1)} seconds.`, 1200);
    return;
  }
  let moved = 0;
  for (let step = 0; step < 3; step++) {
    const x = game.player.x + game.player.dx;
    const y = game.player.y + game.player.dy;
    if (!isFloor(x, y)) break;
    game.player.x = x;
    game.player.y = y;
    moved++;
    visitTile();
    if (game.state !== "playing") break;
  }
  if (moved === 0) {
    setMessage("A wall blocks your dash.", 1200);
    return;
  }
  game.dashCooldown = 5;
  spawnParticles(game.player.x, game.player.y, "#7bfff3", 14);
  playCue("dash");
  if (game.state === "playing") checkCollision();
  updateHud();
}

function visitTile() {
  for (const core of game.level.cores) {
    if (!core.collected && core.x === game.player.x && core.y === game.player.y) {
      core.collected = true;
      game.score += 100;
      saveBest();
      spawnParticles(core.x, core.y, "#ffdb79", 18);
      playCue("core");
      const remaining = game.level.cores.filter(item => !item.collected).length;
      setMessage(remaining ? `${remaining} core${remaining === 1 ? "" : "s"} left to collect.` : "All cores collected! Reach the green portal.", 2100);
      announce(remaining ? `Core collected. ${remaining} remaining.` : "All cores collected. Exit unlocked.");
    }
  }
  const exit = game.level.exit;
  if (game.player.x === exit.x && game.player.y === exit.y) {
    if (game.level.cores.every(core => core.collected)) finishLevel();
    else setMessage("The portal is locked. Collect every core first.", 1600);
  }
}

function checkCollision() {
  if (game.invulnerable > 0) return;
  const onGuard = game.level.guards.some(guard => guard.x === game.player.x && guard.y === game.player.y);
  const onLaser = laserState() === "live" && game.level.hazards.some(hazard => hazard.x === game.player.x && hazard.y === game.player.y);
  if (onGuard || onLaser) takeHit();
}

function takeHit() {
  if (game.state !== "playing" || game.invulnerable > 0) return;
  spawnParticles(game.player.x, game.player.y, "#ff6f8a", 22);
  game.health--;
  playCue("hit");
  announce(`${game.health} hearts remaining`);
  if (game.health <= 0) {
    endGame();
    return;
  }
  game.player.x = 1;
  game.player.y = 1;
  game.invulnerable = 1.5;
  setMessage("Signal disrupted! You have brief protection.", 1800);
  updateHud();
}

function finishLevel() {
  game.score += Math.ceil(game.timeLeft) * 10 + game.health * 50;
  saveBest();
  playCue("win");
  game.state = game.levelIndex === LEVELS.length - 1 ? "won" : "levelComplete";
  displayStateOverlay();
  announce(game.state === "won" ? "You completed all three levels!" : "Level complete!");
}

function endGame() {
  saveBest();
  game.state = "gameOver";
  displayStateOverlay();
  announce("Game over");
}

function nextStepTowards(start, target) {
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [{ x: start.x, y: start.y, first: null }];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current.x === target.x && current.y === target.y) return current.first;
    for (const direction of DIRECTIONS) {
      const x = current.x + direction.dx;
      const y = current.y + direction.dy;
      const key = `${x},${y}`;
      if (!isFloor(x, y) || seen.has(key)) continue;
      seen.add(key);
      queue.push({ x, y, first: current.first || direction });
    }
  }
  return null;
}

function moveGuard(guard) {
  const options = DIRECTIONS.filter(direction => {
    const x = guard.x + direction.dx;
    const y = guard.y + direction.dy;
    return isFloor(x, y) && !game.level.guards.some(other => other !== guard && other.x === x && other.y === y);
  });
  if (!options.length) return;
  const distance = Math.abs(guard.x - game.player.x) + Math.abs(guard.y - game.player.y);
  let choice = null;
  if (distance <= 6) {
    const chase = nextStepTowards(guard, game.player);
    choice = options.find(option => chase && option.dx === chase.dx && option.dy === chase.dy) || null;
  }
  if (!choice && Math.random() < 0.7) {
    choice = options.find(option => option.dx === guard.dx && option.dy === guard.dy) || null;
  }
  if (!choice) {
    const forwardChoices = options.filter(option => option.dx !== -guard.dx || option.dy !== -guard.dy);
    const pool = forwardChoices.length ? forwardChoices : options;
    choice = pool[Math.floor(Math.random() * pool.length)];
  }
  guard.x += choice.dx;
  guard.y += choice.dy;
  guard.dx = choice.dx;
  guard.dy = choice.dy;
  checkCollision();
}

function spawnParticles(x, y, color, count) {
  for (let index = 0; index < count; index++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 90;
    const life = 0.3 + Math.random() * 0.45;
    game.particles.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, color });
  }
}

function update(dt) {
  game.elapsed += dt;
  game.timeLeft = Math.max(0, game.timeLeft - dt);
  game.dashCooldown = Math.max(0, game.dashCooldown - dt);
  game.invulnerable = Math.max(0, game.invulnerable - dt);

  if (game.timeLeft <= 0) {
    setMessage("Time ran out.");
    endGame();
    return;
  }

  for (const guard of game.level.guards) {
    guard.timer += dt;
    if (guard.timer >= 0.62) {
      guard.timer -= 0.62;
      moveGuard(guard);
      if (game.state !== "playing") return;
    }
  }
  checkCollision();
  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter(particle => particle.life > 0);
  if (messageUntil && performance.now() > messageUntil) setMessage(defaultMessage());
  updateHud();
}

function drawFloor() {
  const background = ctx.createLinearGradient(0, 0, 800, 480);
  background.addColorStop(0, "#0d2637");
  background.addColorStop(1, "#091b2b");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 800, 480);
  ctx.strokeStyle = "#37607733";
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * TILE + 0.5, 0); ctx.lineTo(x * TILE + 0.5, 480); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * TILE + 0.5); ctx.lineTo(800, y * TILE + 0.5); ctx.stroke();
  }
  ctx.fillStyle = "#6ed7e41c";
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      ctx.fillRect(x * TILE + TILE / 2 - 1, y * TILE + TILE / 2 - 1, 2, 2);
    }
  }
}

function drawWalls() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!game.level.walls[y][x]) continue;
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = "#18384b";
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = "#254e61";
      ctx.fillRect(px + 3, py + 3, TILE - 6, 5);
      ctx.strokeStyle = "#38677a";
      ctx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
      ctx.fillStyle = "#79d5d81a";
      ctx.fillRect(px + 10, py + 17, TILE - 20, 2);
    }
  }
}

function drawHazards(t) {
  const state = laserState();
  const active = state === "live";
  const warning = state === "charging";
  for (const hazard of game.level.hazards) {
    const px = hazard.x * TILE;
    const py = hazard.y * TILE;
    ctx.save();
    ctx.fillStyle = active ? "#ff627d55" : warning ? "#ffcc6250" : "#40728a55";
    ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = active ? "#ff6d83" : warning ? "#ffd27a" : "#5c9aaa";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.beginPath();
    ctx.moveTo(px + 11, py + 30); ctx.lineTo(px + 19, py + 10);
    ctx.moveTo(px + 22, py + 30); ctx.lineTo(px + 30, py + 10);
    ctx.stroke();
    if (active) {
      ctx.shadowColor = "#ff6d83";
      ctx.shadowBlur = 18 + Math.sin(t * 10) * 5;
      ctx.fillStyle = "#ff8e9d";
      ctx.fillRect(px + 18, py + 4, 4, TILE - 8);
    }
    ctx.restore();
  }
}

function drawExit(t) {
  const unlocked = game.level.cores.every(core => core.collected);
  const { x, y } = game.level.exit;
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * (unlocked ? 0.7 : 0.15));
  ctx.strokeStyle = unlocked ? "#7cffc8" : "#9c8b61";
  ctx.shadowColor = unlocked ? "#4dffb6" : "#aa8457";
  ctx.shadowBlur = unlocked ? 18 : 4;
  ctx.lineWidth = 4;
  ctx.strokeRect(-13, -13, 26, 26);
  ctx.rotate(Math.PI / 4);
  ctx.lineWidth = 2;
  ctx.strokeRect(-9, -9, 18, 18);
  ctx.restore();
}

function drawCores(t) {
  for (const core of game.level.cores) {
    if (core.collected) continue;
    const cx = core.x * TILE + TILE / 2;
    const cy = core.y * TILE + TILE / 2 + Math.sin(t * 3 + core.x) * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4 + t * 0.5);
    ctx.fillStyle = "#ffe184";
    ctx.shadowColor = "#ffd15d";
    ctx.shadowBlur = 20;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = "#fff6c5";
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
}

function drawGuards(t) {
  for (const guard of game.level.guards) {
    const cx = guard.x * TILE + TILE / 2;
    const cy = guard.y * TILE + TILE / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#ff5d78";
    ctx.shadowColor = "#ff365e";
    ctx.shadowBlur = 16 + Math.sin(t * 6) * 4;
    ctx.fillRect(-12, -12, 24, 24);
    ctx.fillStyle = "#3a1d37";
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.fillStyle = "#fff2f1";
    ctx.fillRect(cx - 4, cy - 2, 3, 3);
    ctx.fillRect(cx + 2, cy - 2, 3, 3);
  }
}

function drawPlayer(t) {
  if (game.invulnerable > 0 && Math.floor(t * 12) % 2 === 0) return;
  const { x, y, dx, dy } = game.player;
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2);
  ctx.shadowColor = "#59f5ef";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#69f5ec";
  ctx.beginPath();
  ctx.moveTo(0, -16); ctx.lineTo(12, 12); ctx.lineTo(0, 6); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0f4b58";
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (const particle of game.particles) {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function render(t) {
  drawFloor();
  drawHazards(t);
  drawExit(t);
  drawCores(t);
  drawWalls();
  drawGuards(t);
  drawPlayer(t);
  drawParticles();
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (game.state === "playing") update(dt);
  render(now / 1000);
  requestAnimationFrame(frame);
}

function playCue(kind) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = {
      start: [330, 0.09], wall: [120, 0.05], core: [740, 0.11],
      dash: [420, 0.13], hit: [150, 0.2], win: [920, 0.28],
    };
    const [frequency, duration] = notes[kind];
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = kind === "hit" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, frequency * (kind === "hit" ? 0.45 : 1.3)), audioContext.currentTime + duration);
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    soundEnabled = false;
    soundButton.textContent = "Sound off";
    soundButton.setAttribute("aria-pressed", "false");
  }
}

overlayButton.addEventListener("click", () => overlayAction());
pauseButton.addEventListener("click", togglePause);
document.getElementById("helpButton").addEventListener("click", showHelp);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Sound on" : "Sound off";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) playCue("start");
});

window.addEventListener("keydown", event => {
  // Let Space activate a focused button instead of stealing its keyboard click.
  if (event.code === "Space" && event.target?.tagName === "BUTTON") return;
  const moves = {
    ArrowUp: [0, -1], KeyW: [0, -1],
    ArrowRight: [1, 0], KeyD: [1, 0],
    ArrowDown: [0, 1], KeyS: [0, 1],
    ArrowLeft: [-1, 0], KeyA: [-1, 0],
  };
  if (moves[event.code]) {
    event.preventDefault();
    attemptMove(...moves[event.code]);
  } else if (event.code === "Space") {
    event.preventDefault();
    dash();
  } else if (event.code === "KeyP" || event.code === "Escape") {
    event.preventDefault();
    togglePause();
  }
});

const touchDirections = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
for (const button of document.querySelectorAll("[data-move]")) {
  let interval = null;
  const stop = () => { clearInterval(interval); interval = null; };
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    attemptMove(...touchDirections[button.dataset.move]);
    stop();
    interval = setInterval(() => attemptMove(...touchDirections[button.dataset.move]), 145);
  });
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("lostpointercapture", stop);
}
document.getElementById("touchDash").addEventListener("click", dash);
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });

loadLevel(0);
displayStateOverlay();
requestAnimationFrame(frame);
