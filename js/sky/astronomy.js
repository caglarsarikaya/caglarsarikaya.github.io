// astronomy.js: where the sun and moon are
import { RAD } from './math.js';

// Low-precision solar position (about 0.01°, plenty for a sky)
export function sunPosition(date, lat, lon) {
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * RAD;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * d) * RAD;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const ha = (gmst * 15 + lon) * RAD - ra;
  const phi = lat * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha));
  return { elevation: alt / RAD, azimuth: (az / RAD + 360) % 360 };
}

const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
export const moonPhase = date => ((((date - NEW_MOON) / 86400000) % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC;
const PHASES = ['new moon', 'waxing crescent', 'first quarter moon', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter moon', 'waning crescent'];
export const phaseName = p => PHASES[p < 0.03 || p > 0.97 ? 0 : p < 0.22 ? 1 : p < 0.28 ? 2 : p < 0.47 ? 3 : p < 0.53 ? 4 : p < 0.72 ? 5 : p < 0.78 ? 6 : 7];
