// clock.js
// When: real clock, a dev override (?at, ?speed), or a played day
import { clamp } from './math.js';
import { params, num, state } from './state.js';

const at = Date.parse(params.get('at') || '');
export const speed = num('speed') ?? 1;
const t0 = performance.now();
const startMs = isNaN(at) ? Date.now() : at;
export const LAPSE_MS = 9000;

export function now() {
  const base = isNaN(at) && speed === 1 ? Date.now() : startMs + (performance.now() - t0) * speed;
  if (!state.lapse) return new Date(base);
  const k = clamp((performance.now() - state.lapse) / LAPSE_MS, 0, 1);
  const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  return new Date(base + eased * 86400000);
}
