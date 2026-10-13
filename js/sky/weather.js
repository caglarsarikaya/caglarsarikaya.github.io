// weather.js
// Open-Meteo (free, no key). Cloud cover becomes drifting cloud, wind its speed and direction, rain falls
import { loadJSON, save } from '../lib/storage.js';
import { state } from './state.js';

export async function loadWeather() {
  const { place } = state;
  const key = `ambient-sky:${place.lat.toFixed(1)},${place.lon.toFixed(1)}`;
  const cached = loadJSON('session', key);
  if (cached && Date.now() - cached.t < 1800000) return cached.w;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat.toFixed(2)}&longitude=${place.lon.toFixed(2)}&current=cloud_cover,wind_speed_10m,wind_direction_10m,precipitation`);
    if (!res.ok) return null;
    const c = (await res.json()).current;
    if (!c) return null;
    const w = { cloud: c.cloud_cover ?? 0, wind: c.wind_speed_10m ?? 0, dir: c.wind_direction_10m ?? 250, rain: c.precipitation ?? 0 };
    save('session', key, { t: Date.now(), w });
    return w;
  } catch {
    return null; // offline or blocked: clear and calm
  }
}
