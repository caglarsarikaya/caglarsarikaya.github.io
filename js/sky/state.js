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

// weather eases toward target, which is set from Open-Meteo or the ?cloud / ?wind / ?rain overrides
export const weather = { cloud: num('cloud') ?? 0, wind: num('wind') ?? 8, dir: 250, rain: num('rain') ?? 0 };
export const target = { ...weather };

export const state = {
  place: locate(zone),
  lapse: 0, // performance.now() when "play a day" started, 0 when not playing
  weatherKnown: ['cloud', 'wind', 'rain'].some(k => num(k) !== null)
};

export const darkQuery = matchMedia('(prefers-color-scheme: dark)');
export const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
export const root = document.documentElement;
