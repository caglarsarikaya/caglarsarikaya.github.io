// clock.js
// When: real clock, a dev override (?at, ?speed), or a played day or year
import { clamp } from './math.js';
import { params, num, state } from './state.js';
import { STOPS } from './year.js';

const at = Date.parse(params.get('at') || '');
export const speed = num('speed') ?? 1;
const t0 = performance.now();
const startMs = isNaN(at) ? Date.now() : at;

// How long each play lasts on screen, and how much clock time it covers.
// A year is a weather tour (year.js): the clock and the light stay as they are.
export const PLAY = {
  day: { ms: 11000, span: 86400000 },
  year: { ms: STOPS * 2400, span: 0 }
};

// 0..1 through the current play
export function playElapsed() {
  if (!state.play) return 0;
  return clamp((performance.now() - state.play.start) / PLAY[state.play.kind].ms, 0, 1);
}

// The same, eased in and out
export function playProgress() {
  const k = playElapsed();
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
}

export function now() {
  const base = isNaN(at) && speed === 1 ? Date.now() : startMs + (performance.now() - t0) * speed;
  if (!state.play) return new Date(base);
  return new Date(base + playProgress() * PLAY[state.play.kind].span);
}
