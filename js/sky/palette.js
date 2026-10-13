// palette.js: the sky's colours and light at a given moment
import { smooth, mix } from './math.js';
import { sunPosition, moonPhase } from './astronomy.js';
import { state } from './state.js';

// Sky colours by solar elevation: [elevation, zenith, horizon, sun]. Dark stays deep enough for light text,
// light stays pale enough for dark text; both carry the colour of the hour.
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const PALETTES = {
  dark: [
    [-18, '#0b1033', '#26205e', '#c3cdff'],
    [-8, '#0e1645', '#43307a', '#9fa9ff'],
    [-2, '#141b52', '#7b3768', '#ff8f78'],
    [3, '#16245c', '#9a4a3a', '#ffb06e'],
    [10, '#102a62', '#7a5040', '#ffd09a'],
    [25, '#0b2d63', '#2a5a85', '#fff0d8'],
    [60, '#0a2e66', '#275d8c', '#ffffff']
  ],
  light: [
    [-18, '#d9ddf2', '#e6dcef', '#8a96d8'],
    [-8, '#d8dff7', '#ead5ee', '#8c9cf0'],
    [-2, '#dde3f8', '#f8cfcf', '#ff8a6e'],
    [3, '#dce6f8', '#fcd6b6', '#ffa660'],
    [10, '#d9e8fa', '#fde3c8', '#ffc27a'],
    [25, '#d4e6fb', '#e8f2fb', '#ffd9a0'],
    [60, '#d0e4fc', '#eaf3fb', '#ffe2b0']
  ]
};
for (const key in PALETTES) PALETTES[key] = PALETTES[key].map(([e, ...c]) => [e, ...c.map(hex)]);

function palette(elev, dark) {
  const stops = PALETTES[dark ? 'dark' : 'light'];
  if (elev <= stops[0][0]) return stops[0].slice(1);
  for (let i = 1; i < stops.length; i++) {
    if (elev <= stops[i][0]) {
      const k = (elev - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      return [1, 2, 3].map(j => mix(stops[i - 1][j], stops[i][j], k));
    }
  }
  return stops[stops.length - 1].slice(1);
}

const MOON_LIGHT = { dark: hex('#c9d3ff'), light: hex('#7f8bd0') };

export function sky(date, dark) {
  const { place } = state;
  const sun = sunPosition(date, place.lat, place.lon);
  const phase = moonPhase(date);
  // The moon trails the sun by its phase angle: roughly where the sun was phase × a lunar day ago
  const moon = sunPosition(new Date(date - phase * 24.84 * 3600e3), place.lat, place.lon);
  const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const [zenith, horizon, sunCol] = palette(sun.elevation, dark);
  const sunI = smooth(-4, 6, sun.elevation);
  const moonI = (0.25 + 0.75 * illum) * smooth(-2, 8, moon.elevation) * (1 - smooth(-6, 0, sun.elevation));
  const bySun = sunI >= moonI;
  return {
    sun, moon, phase, zenith, horizon,
    body: bySun ? sun : moon,
    bodyColor: bySun ? sunCol : MOON_LIGHT[dark ? 'dark' : 'light'],
    bodyStrength: bySun ? sunI : moonI * 0.7,
    night: 1 - smooth(-12, -4, sun.elevation),
    glow: bySun ? sunCol : mix(sunCol, MOON_LIGHT[dark ? 'dark' : 'light'], 0.5) // stage light colour
  };
}
