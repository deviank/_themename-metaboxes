const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

const CELL = 24;
const COLS = Math.floor(canvas.width / CELL);
const ROWS = Math.floor(canvas.height / CELL);

const STATE = {
  running: false,
  gameOver: false,
  score: 0,
  best: Number(localStorage.getItem('best') || 0),
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  snake: [],
  food: { x: 0, y: 0 },
  tickMs: 120,
  accumulator: 0,
  lastTime: 0,
};

function resetGame() {
  STATE.running = false;
  STATE.gameOver = false;
  STATE.score = 0;
  STATE.dir = { x: 1, y: 0 };
  STATE.nextDir = { x: 1, y: 0 };
  STATE.snake = [
    { x: Math.floor(COLS/2), y: Math.floor(ROWS/2) },
    { x: Math.floor(COLS/2)-1, y: Math.floor(ROWS/2) },
  ];
  spawnFood();
  scoreEl.textContent = STATE.score;
  bestEl.textContent = STATE.best;
  overlay.hidden = false;
  messageEl.textContent = 'Press Space or Tap to Start';
}

function spawnFood() {
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (!STATE.snake.some(s => s.x === x && s.y === y)) {
      STATE.food = { x, y };
      return;
    }
  }
}

function startGame() {
  if (STATE.running) return;
  STATE.running = true;
  overlay.hidden = true;
}

function endGame() {
  STATE.running = false;
  STATE.gameOver = true;
  if (STATE.score > STATE.best) {
    STATE.best = STATE.score;
    localStorage.setItem('best', String(STATE.best));
  }
  overlay.hidden = false;
  messageEl.textContent = 'Game Over — Press Space or Tap to Restart';
}

function setDirection(nx, ny) {
  // Prevent reversing into self
  if (nx === -STATE.dir.x && ny === -STATE.dir.y) return;
  STATE.nextDir = { x: nx, y: ny };
}

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': setDirection(0, -1); break;
    case 'ArrowDown': case 's': case 'S': setDirection(0, 1); break;
    case 'ArrowLeft': case 'a': case 'A': setDirection(-1, 0); break;
    case 'ArrowRight': case 'd': case 'D': setDirection(1, 0); break;
    case ' ': if (STATE.gameOver) { resetGame(); } startGame(); break;
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
  startGame();
});

// Touch controls (swipe)
let touchStart = null;
window.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
});
window.addEventListener('touchend', (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const absx = Math.abs(dx), absy = Math.abs(dy);
  if (Math.max(absx, absy) < 24) {
    if (!STATE.running) { if (STATE.gameOver) resetGame(); startGame(); }
    return;
  }
  if (absx > absy) setDirection(Math.sign(dx), 0); else setDirection(0, Math.sign(dy));
});

function update(dt) {
  if (!STATE.running) return;
  STATE.accumulator += dt;
  if (STATE.accumulator < STATE.tickMs) return;
  STATE.accumulator = 0;

  STATE.dir = STATE.nextDir;
  const head = { x: STATE.snake[0].x + STATE.dir.x, y: STATE.snake[0].y + STATE.dir.y };

  // Wrap around edges
  if (head.x < 0) head.x = COLS - 1;
  if (head.x >= COLS) head.x = 0;
  if (head.y < 0) head.y = ROWS - 1;
  if (head.y >= ROWS) head.y = 0;

  // Collision with self
  if (STATE.snake.some(s => s.x === head.x && s.y === head.y)) {
    endGame();
    return;
  }

  STATE.snake.unshift(head);

  // Eating food
  if (head.x === STATE.food.x && head.y === STATE.food.y) {
    STATE.score += 1;
    scoreEl.textContent = STATE.score;
    if (STATE.score % 5 === 0 && STATE.tickMs > 60) STATE.tickMs -= 5;
    spawnFood();
  } else {
    STATE.snake.pop();
  }
}

function drawCell(x, y, fill, stroke) {
  const px = x * CELL;
  const py = y * CELL;
  ctx.fillStyle = fill;
  ctx.fillRect(px, py, CELL, CELL);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Grid ambient
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#ffffff';
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      ctx.strokeRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
    }
  }
  ctx.globalAlpha = 1;

  // Food
  drawCell(STATE.food.x, STATE.food.y, '#46d6a7', '#2ab188');

  // Snake
  STATE.snake.forEach((s, i) => {
    const isHead = i === 0;
    const fill = isHead ? '#7c63ff' : '#5b78e6';
    const stroke = isHead ? '#b4a6ff' : '#7993ff';
    drawCell(s.x, s.y, fill, stroke);
  });
}

function loop(ts) {
  const dt = ts - (STATE.lastTime || ts);
  STATE.lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);