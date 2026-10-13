// glass.js
// Weather on the window: snowflakes settle and melt, raindrops bead and slide, hail ticks, fog clouds the corners.
// Kept beside the content column (or to thin top and bottom bands on narrow screens), small and faint,
// so it never gets in the way of reading. A transparent 2D canvas above the page that ignores the pointer.

const MAX = 30;
const canvas = document.createElement('canvas');
canvas.className = 'glass';
canvas.setAttribute('aria-hidden', 'true');
const ctx = canvas.getContext('2d');
if (ctx) document.body.append(canvas);

let W = 1, H = 1;
const drops = [];
const debt = { rain: 0, snow: 0, hail: 0 }; // fractional spawns carried between frames
let mist = 0;
let dirty = false;

export function resizeGlass() {
  if (!ctx) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(H * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  dirty = true;
}

const rand = (a, b) => a + Math.random() * (b - a);

// Where a drop may land: the margins beside the text, else thin bands at the top and bottom
function landing(column) {
  const x0 = column[0] * W - 24, x1 = column[1] * W + 24;
  if (Math.min(x0, W - x1) >= 48) {
    return { x: Math.random() < 0.5 ? rand(0, x0) : rand(x1, W), y: rand(0, H), fade: 1 };
  }
  return { x: rand(0, W), y: Math.random() < 0.5 ? rand(0, H * 0.15) : rand(H * 0.85, H), fade: 0.5 };
}

function spawn(kind, column, drift) {
  if (drops.length >= MAX) return;
  const d = { kind, ...landing(column), age: 0 };
  if (kind === 'snow') Object.assign(d, { r: rand(1.6, 3.4), life: rand(3, 5), turn: rand(0, Math.PI) });
  else if (kind === 'hail') Object.assign(d, { r: rand(1.2, 2.2), life: 0.6 });
  else {
    const slides = Math.random() < 0.35;
    Object.assign(d, {
      r: rand(1.5, 4),
      life: rand(2, 6),
      vy: slides ? rand(8, 20) : 0,
      vx: slides ? drift * rand(4, 12) : 0
    });
  }
  drops.push(d);
}

function drawDrop(x, y, r, a, dark) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = dark ? `rgba(200,215,255,${0.1 * a})` : `rgba(255,255,255,${0.3 * a})`;
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = dark ? `rgba(255,255,255,${0.35 * a})` : `rgba(29,33,39,${0.22 * a})`;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`;
  ctx.fill();
}

function drawFlake(x, y, r, turn, a, dark) {
  ctx.lineCap = 'round';
  for (const [color, width] of dark ? [['255,255,255', 0.9]] : [['29,33,39', 1.8], ['255,255,255', 0.9]]) {
    ctx.strokeStyle = `rgba(${color},${(color === '255,255,255' ? 0.8 : 0.15) * a})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const t = turn + (i * Math.PI) / 3;
      ctx.moveTo(x - Math.cos(t) * r, y - Math.sin(t) * r);
      ctx.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
    }
    ctx.stroke();
  }
}

// Faint condensation in the corners
function drawMist(a, dark) {
  const rgb = dark ? '190,200,225' : '255,255,255';
  const R = Math.max(W, H) * 0.35;
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, `rgba(${rgb},${(dark ? 0.16 : 0.35) * a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(cx ? cx - R : 0, cy ? cy - R : 0, R, R);
  }
}

export function clearGlass() {
  if (!ctx || (!drops.length && !dirty)) return;
  drops.length = 0;
  ctx.clearRect(0, 0, W, H);
  dirty = false;
}

// dt in ms; w is the eased weather; drift is the sideways wind on screen, -1..1
export function updateGlass(dt, w, column, dark, drift) {
  if (!ctx) return;
  const s = dt / 1000;
  const narrow = Math.min(column[0] * W, W - column[1] * W) < 72;
  const rate = { rain: w.rain * 2, snow: w.snow * 1.6, hail: w.hail * 1.5 }; // per second
  for (const kind in rate) {
    debt[kind] += rate[kind] * (narrow ? 0.3 : 1) * s;
    while (debt[kind] >= 1) {
      debt[kind] -= 1;
      spawn(kind, column, drift);
    }
  }
  mist += (Math.max(w.fog, w.snow * 0.5) - mist) * Math.min(1, s / 3);

  if (!drops.length && mist < 0.01) {
    if (dirty) clearGlass();
    return;
  }
  dirty = true;
  ctx.clearRect(0, 0, W, H);
  if (mist >= 0.01) drawMist(mist, dark);

  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.age += s;
    const k = d.age / d.life;
    if (k >= 1) {
      drops.splice(i, 1);
      continue;
    }
    const appear = Math.min(1, d.age / 0.15);
    const a = d.fade * appear * (k > 0.7 ? (1 - k) / 0.3 : 1);
    if (d.kind === 'snow') {
      // Lands, sits, then melts into a small bead
      if (k < 0.5) drawFlake(d.x, d.y, d.r * appear, d.turn, a, dark);
      else drawDrop(d.x, d.y, d.r * (1 - (k - 0.5) * 1.2), a, dark);
    } else if (d.kind === 'hail') {
      drawDrop(d.x, d.y - Math.sin(k * Math.PI) * 3, d.r, a, dark);
    } else {
      if (d.age > 0.5) {
        d.x += d.vx * s;
        d.y += d.vy * s;
      }
      drawDrop(d.x, d.y, d.r, a, dark);
    }
  }
}
