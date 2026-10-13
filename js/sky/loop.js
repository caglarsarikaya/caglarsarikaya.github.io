// loop.js
// Draws the sky each frame while animating, or once on demand in still mode (reduced motion, hidden tab)
import { load, save } from '../lib/storage.js';
import { RAD, clamp, smooth } from './math.js';
import { state, weather, target, darkQuery, reducedQuery, root } from './state.js';
import { now, speed, LAPSE_MS } from './clock.js';
import { sky } from './palette.js';
import { canvas, gl, program, U } from './shader.js';
import { column, spots } from './layout.js';
import { pointer, ripple, scroll } from './visitor.js';
import { chip, writeChip, setPlaying } from './chip.js';

let revealStart = performance.now();
const revealed = load('session', 'sky-revealed') === '1';
save('session', 'sky-revealed', '1');
if (revealed || reducedQuery.matches) revealStart = -1e9;

let flow = 0;
let last = performance.now();
let lastChip = -Infinity;
let running = false;
let pending = false;

function render() {
  const tNow = performance.now();
  const dt = Math.min(tNow - last, 100);
  last = tNow;
  const still = reducedQuery.matches;
  const dark = darkQuery.matches;

  if (state.lapse && tNow - state.lapse >= LAPSE_MS) {
    state.lapse = 0;
    setPlaying(false);
    lastChip = -Infinity;
  }

  const date = now();
  const s = sky(date, dark);

  const ease = still ? 1 : 1 - Math.pow(0.97, dt / 16);
  for (const k of ['cloud', 'wind', 'rain']) weather[k] += (target[k] - weather[k]) * ease;
  weather.dir = target.dir;

  // Visitor easing
  const follow = still ? 1 : Math.min(1, dt / 160);
  pointer.sx += (pointer.x - pointer.sx) * follow;
  pointer.sy += (pointer.y - pointer.sy) * follow;
  const present = pointer.seen && tNow - pointer.seen < 4000 ? 1 : 0;
  pointer.presence += (present - pointer.presence) * Math.min(1, dt / 500);
  pointer.energy *= Math.pow(0.9, dt / 16);
  scroll.energy *= Math.pow(0.92, dt / 16);
  if (!still) flow += (dt / 1000) * (0.35 + Math.min(weather.wind, 60) / 18) * (1 + scroll.energy * 2 + pointer.energy);

  // Where the sun or moon sits on screen: east on the left in the north (facing south), mirrored in the south
  const facing = state.place.lat >= 0 ? -1 : 1;
  const elevN = clamp(s.body.elevation / 55, -0.4, 1);
  const reveal = smooth(0, 2400, tNow - revealStart);
  const scrolled = clamp(scroll.y / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1);
  // Low light sits out in the margins; high light glows down from the top edge
  const bodyX = 0.5 + facing * Math.sin(s.body.azimuth * RAD) * 0.48;
  const bodyY = Math.min(0.4 + elevN * 0.95, 1.02) - scrolled * 0.3 - (1 - reveal) * 0.45;

  const windRad = (weather.dir + 180) * RAD; // wind blows *from* dir
  if (program) {
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, still ? 0 : tNow / 1000);
    gl.uniform1f(U.uFlow, flow);
    gl.uniform1f(U.uScroll, scrolled);
    gl.uniform1f(U.uDark, dark ? 1 : 0);
    gl.uniform1f(U.uReveal, 0.15 + 0.85 * reveal);
    gl.uniform1f(U.uNight, s.night);
    gl.uniform1f(U.uCloud, clamp(weather.cloud / 100, 0, 1));
    gl.uniform1f(U.uRain, clamp(weather.rain / 1.5, 0, 1));
    gl.uniform1f(U.uPresence, pointer.presence);
    gl.uniform1f(U.uEnergy, Math.min(pointer.energy, 2));
    gl.uniform3fv(U.uZenith, s.zenith);
    gl.uniform3fv(U.uHorizon, s.horizon);
    gl.uniform3fv(U.uBodyCol, s.bodyColor);
    gl.uniform3fv(U.uGlow, s.glow);
    gl.uniform3f(U.uBody, bodyX, bodyY, s.bodyStrength * (0.5 + 0.5 * reveal));
    gl.uniform2f(U.uWind, Math.sin(windRad) * facing, Math.cos(windRad) * 0.3);
    gl.uniform2f(U.uPointer, pointer.sx, pointer.sy);
    gl.uniform2f(U.uColumn, column[0], column[1]);
    gl.uniform3f(U.uRipple, ripple.x, ripple.y, still ? 99 : (tNow - ripple.start) / 1000);
    const [rects, alphas] = spots(still ? 1e4 : dt);
    gl.uniform4fv(U.uSpots, rects);
    gl.uniform1fv(U.uSpotA, alphas);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else {
    // No WebGL: the same sky as a plain gradient
    const css = c => `rgb(${c.map(v => Math.round(v * 255)).join(',')})`;
    root.style.background = `linear-gradient(to bottom, ${css(s.zenith)}, ${css(s.horizon)}) fixed`;
  }

  if (tNow - lastChip > (state.lapse || speed !== 1 ? 120 : 10000)) {
    lastChip = tNow;
    writeChip(date, s);
  }
  if (chip && chip.hidden && reveal > 0.35) {
    chip.hidden = false;
    requestAnimationFrame(() => chip.classList.add('is-shown'));
  }
}

function frame() {
  pending = false;
  if (!running) {
    render();
    return;
  }
  render();
  requestAnimationFrame(frame);
}

export const isRunning = () => running;

// Draw once soon (still mode, or while paused)
export function invalidate() {
  if (running || pending) return;
  pending = true;
  requestAnimationFrame(frame);
}

// Rewrite the chip on the next frame (the place, weather or played day changed)
export function refreshChip() {
  lastChip = -Infinity;
  invalidate();
}

export function start() {
  if (reducedQuery.matches || document.hidden || running) {
    invalidate();
    return;
  }
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

export function pause() {
  running = false;
}
