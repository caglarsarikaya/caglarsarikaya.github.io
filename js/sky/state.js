// state.js
// What the sky's parts share: dev overrides from the URL, where the visitor is, and the weather.
// Values that change after startup live on `state`, so every module sees the current one.
import { locate } from './location.js';

export const params = new URLSearchParams(location.search);
export const num = key => {
  const v = params.get(key);
  return v !== null && v !== '' && !isNaN(v) ? Number(v) : null;
};

let tz = params.get('tz') || '';
try {
  tz = tz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
} catch {
  tz = 'UTC';
}
export const zone = tz;

// weather eases toward target, which is set from Open-Meteo and the dev overrides (see conditions.js).
// cloud 0..100 %, wind and gust in km/h, dir in degrees, the rest 0..1
export const weather = { cloud: 0, wind: 8, gust: 0, dir: 250, rain: 0, snow: 0, hail: 0, fog: 0, storm: 0, code: -1 };
export const target = { ...weather };

export const state = {
  place: locate(zone),
  play: null, // { kind: 'day' | 'year', start: performance.now() } while a play runs
  weatherKnown: false
};

export const darkQuery = matchMedia('(prefers-color-scheme: dark)');
export const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
export const root = document.documentElement;
