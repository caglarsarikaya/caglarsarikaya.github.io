// weather.js
// Open-Meteo (free, no key): the current weather at the visitor's place, mapped by conditions.js
import { loadJSON, save } from '../lib/storage.js';
import { state } from './state.js';
import { fromOpenMeteo } from './conditions.js';

const FIELDS = 'weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,rain,showers,snowfall';

export async function loadWeather() {
  const { place } = state;
  const key = `ambient-sky2:${place.lat.toFixed(1)},${place.lon.toFixed(1)}`;
  const cached = loadJSON('session', key);
  if (cached && Date.now() - cached.t < 1800000) return cached.w;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat.toFixed(2)}&longitude=${place.lon.toFixed(2)}&current=${FIELDS}`);
    if (!res.ok) return null;
    const c = (await res.json()).current;
    if (!c) return null;
    const w = fromOpenMeteo(c);
    save('session', key, { t: Date.now(), w });
    return w;
  } catch {
    return null; // offline or blocked: clear and calm
  }
}
