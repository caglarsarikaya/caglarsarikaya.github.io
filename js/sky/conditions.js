// conditions.js
// Turns raw weather into what the sky draws (intensities 0..1) and what the chip says.
// The WMO weather code decides the kind of weather; the measured amounts set how strong it is.
import { clamp } from './math.js';
import { num } from './state.js';

const DRIZZLE = new Set([51, 53, 55, 56, 57]);
const FREEZING = new Set([56, 57, 66, 67]);
// slight 0, moderate 1, heavy 2
const LEVEL = { 53: 1, 55: 2, 57: 2, 63: 1, 65: 2, 67: 2, 73: 1, 75: 2, 81: 1, 82: 2, 86: 2, 99: 2 };
const FLOOR = [0.35, 0.6, 0.9];

const inRange = (code, a, b) => code >= a && code <= b;

// c: Open-Meteo `current` (weather_code, cloud_cover, wind_*, rain, showers, snowfall, precipitation)
export function fromOpenMeteo(c) {
  const code = c.weather_code ?? -1;
  const level = LEVEL[code] ?? 0;
  const floor = FLOOR[level];
  const w = {
    code,
    cloud: c.cloud_cover ?? 0,
    wind: c.wind_speed_10m ?? 0,
    gust: c.wind_gusts_10m ?? 0,
    dir: c.wind_direction_10m ?? 250,
    rain: 0, snow: 0, hail: 0, fog: 0, storm: 0
  };
  const rainAmt = clamp(((c.rain ?? 0) + (c.showers ?? 0) || (c.precipitation ?? 0)) / 4, 0, 1); // mm/h, 4+ is heavy
  const snowAmt = clamp((c.snowfall ?? 0) / 1.5, 0, 1); // cm/h

  if (code === 45 || code === 48) w.fog = 1;
  else if (inRange(code, 51, 55)) w.rain = Math.max(rainAmt, [0.2, 0.3, 0.4][level]);
  else if (code === 56 || code === 57) { w.rain = 0.3; w.snow = 0.15; }
  else if (inRange(code, 61, 65) || inRange(code, 80, 82)) w.rain = Math.max(rainAmt, floor);
  else if (code === 66 || code === 67) { w.rain = Math.max(rainAmt, floor) * 0.6; w.snow = floor * 0.5; }
  else if (inRange(code, 71, 77) || code === 85 || code === 86) w.snow = Math.max(snowAmt, floor);
  else if (inRange(code, 95, 99)) {
    w.storm = 1;
    w.rain = Math.max(rainAmt, 0.6 + 0.2 * level);
    w.hail = code >= 96 ? 1 : 0;
  } else if (code < 0) {
    // No code: go by the amounts alone
    w.snow = snowAmt;
    w.rain = snowAmt ? 0 : rainAmt;
  }

  // Falling weather comes from a full sky
  if (w.rain || w.snow || w.storm) w.cloud = Math.max(w.cloud, 70 + 30 * Math.max(w.storm, floor));
  if (w.fog) w.cloud = Math.max(w.cloud, 40);
  return w;
}

// Dev overrides: ?code=<WMO> sets a whole condition; ?cloud, ?wind, ?gust (km/h) and
// ?rain, ?snow, ?hail, ?fog, ?storm (0..1) set single values on top
export function overrides() {
  const forced = {};
  const code = num('code');
  if (code !== null) {
    const { wind, gust, dir, ...rest } = fromOpenMeteo({ weather_code: code, cloud_cover: code <= 3 ? [0, 30, 60, 95][code] : 0 });
    Object.assign(forced, rest);
  }
  for (const k of ['cloud', 'wind', 'gust', 'rain', 'snow', 'hail', 'fog', 'storm']) {
    const v = num(k);
    if (v !== null) forced[k] = v;
  }
  return forced;
}

// Chip words, e.g. ['heavy snow', 'windy']
export function describe(t) {
  const words = [];
  const amount = (v, light, plain, heavy) => (v > 0.75 ? heavy : v < 0.4 ? light : plain);
  if (t.storm > 0.5) words.push(t.hail > 0.5 ? 'thunderstorm with hail' : 'thunderstorm');
  else if (t.hail > 0.5) words.push('hail');
  else if (FREEZING.has(t.code)) words.push(DRIZZLE.has(t.code) ? 'freezing drizzle' : 'freezing rain');
  else if (t.snow > 0.05 && t.rain > 0.05) words.push('sleet');
  else if (t.snow > 0.05) words.push(amount(t.snow, 'light snow', 'snow', 'heavy snow'));
  else if (t.rain > 0.05) words.push(DRIZZLE.has(t.code) ? 'drizzle' : amount(t.rain, 'light rain', 'rain', 'heavy rain'));
  else if (t.fog > 0.5) words.push('fog');
  else {
    const c = t.cloud;
    words.push(c < 15 ? 'clear' : c < 45 ? 'light cloud' : c < 80 ? 'cloudy' : 'overcast');
  }
  if (t.gust >= 60 || t.wind >= 50) words.push('gale');
  else if (t.wind > 25) words.push('windy');
  return words;
}
