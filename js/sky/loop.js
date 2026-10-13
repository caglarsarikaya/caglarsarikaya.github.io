// loop.js
// Draws the sky about 30 times a second while animating, or once on demand in still mode (reduced motion,
// hidden tab, no WebGL). Slow devices step down to fewer pixels and frames.
import { load, save } from '../lib/storage.js';
import { RAD, clamp, smooth } from './math.js';
import { state, weather, target, darkQuery, reducedQuery, root } from './state.js';
import { now, speed, PLAY, playElapsed } from './clock.js';
import { tourWeather } from './year.js';
import { sky } from './palette.js';
import { canvas, gl, program, U, setScale } from './shader.js';
import { column, spots, scrollRange } from './layout.js';
import { pointer, scroll } from './visitor.js';
import { chip, writeChip, setPlaying } from './chip.js';
import { updateGlass, clearGlass, setGlassRatio } from './glass.js';

const EASED = ['cloud', 'wind', 'gust', 'rain', 'snow', 'hail', 'fog', 'storm'];

// Lightning during a storm: a flicker, then the main glow, at most once every 6 s and gentle at its peak
// (far below the 3-flashes-a-second photosensitivity threshold). None with reduced motion.
let nextFlash = 0;
let flashAt = -1e9;
let flashX = 0.5;
function lightning(tNow, still, dark) {
  if (still || weather.storm < 0.5) {
    nextFlash = 0;
    return 0;
  }
  // A storm on the weather tour lasts only a stop, so its first flash comes soon
  const first = state.play?.kind === 'year' ? 400 + Math.random() * 800 : 2000 + Math.random() * 5000;
  if (!nextFlash) nextFlash = Math.max(tNow + first, flashAt + 6000);
  if (tNow >= nextFlash) {
    flashAt = tNow;
    flashX = 0.15 + Math.random() * 0.7;
    nextFlash = tNow + 6000 + Math.random() * 12000;
  }
  const k = tNow - flashAt;
  if (k > 900) return 0;
  const flicker = k < 60 ? k / 60 : Math.exp(-(k - 60) / 70);
  const glow = k < 180 ? 0 : k < 240 ? (k - 180) / 60 : Math.exp(-(k - 240) / 200);
  return Math.max(flicker * 0.6, glow) * (dark ? 0.6 : 0.35) * weather.storm;
}

let revealStart = performance.now();
const revealed = load('session', 'sky-revealed') === '1';
save('session', 'sky-revealed', '1');
if (revealed || reducedQuery.matches || !program) revealStart = -1e9;

let flow = 0;
let last = performance.now();
let lastChip = -Infinity;
let running = false;
let pending = false;
let lastBackground = '';

// Quality: the sky is soft and slow, so fewer pixels and frames look the same. Start one step down on
// devices that say they are weak; step down further while frames come too slowly (never back up).
const QUALITY = [
  { scale: 0.5, fps: 30, glass: 1.5 },
  { scale: 0.35, fps: 30, glass: 1 },
  { scale: 0.25, fps: 24, glass: 1 }
];
const weak = navigator.connection?.saveData || navigator.deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;
let tier = 0;
let slowSum = 0, slowN = 0;
function setTier(t) {
  tier = t;
  setScale(QUALITY[t].scale);
  setGlassRatio(QUALITY[t].glass);
}
if (weak) setTier(1);

// dt of each drawn frame; every ~2 s, step down if frames came well slower than the target
function adapt(dt) {
  if (tier >= QUALITY.length - 1) return;
  slowSum += dt;
  slowN++;
  if (slowSum < 2000) return;
  if (slowSum / slowN > 1500 / QUALITY[tier].fps) setTier(tier + 1);
  slowSum = slowN = 0;
}

function render() {
  const tNow = performance.now();
  const dt = Math.min(tNow - last, 100);
  last = tNow;
  const still = reducedQuery.matches;
  const dark = darkQuery.matches;

  if (state.play && tNow - state.play.start >= PLAY[state.play.kind].ms) {
    state.play = null;
    setPlaying(null);
    lastChip = -Infinity;
  }

  const date = now();
  const s = sky(date, dark);

  // While a year plays, the weather follows the tour; the live target is left alone and returns after
  const goal = state.play?.kind === 'year' ? tourWeather(playElapsed()) : target;
  const ease = still ? 1 : 1 - Math.pow(0.97, dt / 16);
  for (const k of EASED) weather[k] += (goal[k] - weather[k]) * ease;
  weather.dir = goal.dir;
  weather.code = goal.code;

  // Visitor easing
  const follow = still ? 1 : Math.min(1, dt / 160);
  pointer.sx += (pointer.x - pointer.sx) * follow;
  pointer.sy += (pointer.y - pointer.sy) * follow;
  const present = pointer.seen && tNow - pointer.seen < 4000 ? 1 : 0;
  pointer.presence += (present - pointer.presence) * Math.min(1, dt / 500);
  pointer.energy *= Math.pow(0.9, dt / 16);
  scroll.energy *= Math.pow(0.92, dt / 16);
  // Gusty wind moves the clouds in bursts
  const gusty = clamp((weather.gust - weather.wind) / 40, 0, 1) * (0.5 + 0.5 * Math.sin(tNow / 1300));
  if (!still) flow += (dt / 1000) * (0.35 + Math.min(weather.wind, 60) / 18) * (1 + gusty) * (1 + scroll.energy * 2 + pointer.energy);

  // Where the sun or moon sits on screen: east on the left in the north (facing south), mirrored in the south
  const facing = state.place.lat >= 0 ? -1 : 1;
  const elevN = clamp(s.body.elevation / 55, -0.4, 1);
  const reveal = smooth(0, 2400, tNow - revealStart);
  const scrolled = clamp(scroll.y / scrollRange, 0, 1);
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
    gl.uniform1f(U.uRain, clamp(weather.rain, 0, 1));
    gl.uniform1f(U.uSnow, clamp(weather.snow, 0, 1));
    gl.uniform1f(U.uHail, clamp(weather.hail, 0, 1));
    gl.uniform1f(U.uFog, clamp(weather.fog, 0, 1));
    gl.uniform1f(U.uStorm, clamp(weather.storm, 0, 1));
    gl.uniform2f(U.uFlash, lightning(tNow, still, dark), flashX);
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
    const [rects, alphas, count] = spots(still ? 1e4 : dt);
    gl.uniform4fv(U.uSpots, rects);
    gl.uniform1fv(U.uSpotA, alphas);
    gl.uniform1f(U.uSpotN, count);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else {
    // No WebGL: the same sky as a plain gradient, drawn on demand (see start), and set only when it changes
    // since every change repaints the whole page
    const css = c => `rgb(${c.map(v => Math.round(v * 255)).join(',')})`;
    const background = `linear-gradient(to bottom, ${css(s.zenith)}, ${css(s.horizon)}) fixed`;
    if (background !== lastBackground) root.style.background = lastBackground = background;
  }

  if (still || !program) clearGlass();
  else updateGlass(dt, weather, column, dark, Math.sin(windRad) * facing * Math.min(weather.wind / 40, 1));

  if (tNow - lastChip >(state.play || speed !== 1 ? 120 : 10000)) {
    lastChip = tNow;
    writeChip(date, s, goal);
  }
  if (chip && chip.hidden && reveal > 0.35) {
    chip.hidden = false;
    requestAnimationFrame(() => chip.classList.add('is-shown'));
  }
  return dt;
}

function frame() {
  pending = false;
  if (!running) {
    render();
    return;
  }
  requestAnimationFrame(frame);
  // Skip screen refreshes until the frame is due (a few ms early is fine, refreshes jitter)
  if (performance.now() - last < 1000 / QUALITY[tier].fps - 4) return;
  adapt(render());
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
  if (!program || reducedQuery.matches || document.hidden || running) {
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
