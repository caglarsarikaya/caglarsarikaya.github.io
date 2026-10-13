// sky.js
// "Your sky, on stage": the page background is the visitor's real sky at this moment, rendered as a stage backdrop.
// - Where: IP city lookup (geojs.io) when it agrees with the browser's time zone, otherwise the time zone
//   mapped to approximate coordinates (no permission prompt either way)       → location.js
// - When: real solar / lunar position there; the sky's colours follow the sun, and the sun or moon glows on screen
//   where it stands: left in the morning, overhead at noon, right in the evening → clock.js, astronomy.js, palette.js
// - Weather: Open-Meteo (free, no key). Cloud, fog, wind and gusts, rain, drizzle, sleet, snow, hail and thunderstorms
//   with lightning, in the sky and, faintly, on the glass beside the text      → weather.js, conditions.js, glass.js
// - The work: every project and video preview in view gets a halo of that light, like stage lighting on a product
//                                                                              → layout.js, shader.js
// - Visitor: the cursor is a light that parts the clouds, scrolling tilts the view to the horizon
//                                                                              → visitor.js
// - The chip in the intro names the sky ("Istanbul · 17:20 · golden hour · clear") and plays a day or a year
//                                                                              → chip.js, year.js
// This file wires them together; loop.js draws.
// Dev overrides: ?at=2026-06-21T06:30%2B03:00&tz=Asia/Tokyo&speed=600, and weather (see conditions.js):
// ?code=95 (a WMO weather code), ?cloud=80&wind=30&gust=70 and ?rain, ?snow, ?hail, ?fog, ?storm from 0 to 1
import { params, num, zone, state, weather, target, darkQuery, reducedQuery } from './state.js';
import { locateByIp } from './location.js';
import { loadWeather } from './weather.js';
import { overrides } from './conditions.js';
import { resize } from './shader.js';
import { resizeGlass } from './glass.js';
import { measureColumn, refreshSpots } from './layout.js';
import { onScroll, onPointerMove, onPointerLeave } from './visitor.js';
import { chip, setPlaying } from './chip.js';
import { startTour } from './year.js';
import { start, pause, invalidate, refreshChip, isRunning } from './loop.js';

// Overrides show at once and stay on top of the live weather
const forced = overrides();
Object.assign(weather, forced);
Object.assign(target, forced);
state.weatherKnown = Object.keys(forced).length > 0;

resize();
resizeGlass();
measureColumn();
refreshSpots();
setInterval(refreshSpots, 1500); // feeds add video tiles after load

addEventListener('resize', () => { resize(); resizeGlass(); measureColumn(); invalidate(); });
addEventListener('scroll', () => { onScroll(); invalidate(); }, { passive: true });
addEventListener('pointermove', onPointerMove, { passive: true });
document.addEventListener('mouseleave', onPointerLeave);

// Play a day or a year; a second click restarts it, and either can take over from the other
chip?.addEventListener('click', e => {
  const button = e.target.closest('[data-sky-play]');
  if (!button) return;
  if (button.dataset.skyPlay === 'year') startTour();
  state.play = { kind: button.dataset.skyPlay, start: performance.now() };
  setPlaying(state.play.kind);
  refreshChip();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
  else start();
});
darkQuery.addEventListener('change', invalidate);
reducedQuery.addEventListener('change', () => { pause(); start(); });
// Still mode: follow the sun once a minute, and step through a played day
setInterval(() => { if (!isRunning() && !document.hidden) invalidate(); }, 60000);
setInterval(() => { if (state.play && !isRunning()) invalidate(); }, 1000);

start();

// A ?tz override keeps the time-zone place, so dev views stay deterministic
const refined = params.get('tz') ? Promise.resolve(null) : locateByIp(zone, state.place.label);
refined.then(p => {
  if (p) {
    state.place = p;
    refreshChip();
  }
  // Weather after the location settles, so it is fetched once, for the refined place.
  // A ?code override is a complete condition, so it skips the fetch.
  if (num('code') === null) {
    loadWeather().then(w => {
      if (!w) return;
      Object.assign(target, w, forced);
      state.weatherKnown = true;
      refreshChip();
    });
  }
});
