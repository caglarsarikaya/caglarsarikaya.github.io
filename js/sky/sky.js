// sky.js
// "Your sky, on stage": the page background is the visitor's real sky at this moment, rendered as a stage backdrop.
// - Where: IP city lookup (geojs.io) when it agrees with the browser's time zone, otherwise the time zone
//   mapped to approximate coordinates (no permission prompt either way)       → location.js
// - When: real solar / lunar position there; the sky's colours follow the sun, and the sun or moon glows on screen
//   where it stands: left in the morning, overhead at noon, right in the evening → clock.js, astronomy.js, palette.js
// - Weather: Open-Meteo (free, no key). Cloud cover becomes drifting cloud, wind its speed and direction, rain falls
//                                                                              → weather.js
// - The work: every project and video preview in view gets a halo of that light, like stage lighting on a product
//                                                                              → layout.js, shader.js
// - Visitor: the cursor is a light that parts the clouds, a click sends a ripple, scrolling tilts the view to the horizon
//                                                                              → visitor.js
// - The chip in the intro names the sky ("Your sky now · Istanbul · 17:20 · golden hour") and plays a day on click
//                                                                              → chip.js
// This file wires them together; loop.js draws.
// Dev overrides: ?at=2026-06-21T06:30%2B03:00&tz=Asia/Tokyo&cloud=80&wind=30&rain=1&speed=600
import { params, num, zone, state, target, darkQuery, reducedQuery } from './state.js';
import { locateByIp } from './location.js';
import { loadWeather } from './weather.js';
import { resize } from './shader.js';
import { measureColumn, refreshSpots } from './layout.js';
import { onScroll, onPointerMove, onPointerLeave, onPointerDown } from './visitor.js';
import { chip, setPlaying } from './chip.js';
import { start, pause, invalidate, refreshChip, isRunning } from './loop.js';

resize();
measureColumn();
refreshSpots();
setInterval(refreshSpots, 1500); // feeds add video tiles after load

addEventListener('resize', () => { resize(); measureColumn(); invalidate(); });
addEventListener('scroll', () => { onScroll(); invalidate(); }, { passive: true });
addEventListener('pointermove', onPointerMove, { passive: true });
document.addEventListener('mouseleave', onPointerLeave);
addEventListener('pointerdown', onPointerDown, { passive: true });

chip?.addEventListener('click', () => {
  state.lapse = performance.now();
  setPlaying(true);
  invalidate();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
  else start();
});
darkQuery.addEventListener('change', invalidate);
reducedQuery.addEventListener('change', () => { pause(); start(); });
// Still mode: follow the sun once a minute, and step through a played day
setInterval(() => { if (!isRunning() && !document.hidden) invalidate(); }, 60000);
setInterval(() => { if (state.lapse && !isRunning()) invalidate(); }, 1000);

start();

// A ?tz override keeps the time-zone place, so dev views stay deterministic
const refined = params.get('tz') ? Promise.resolve(null) : locateByIp(zone, state.place.label);
refined.then(p => {
  if (p) {
    state.place = p;
    refreshChip();
  }
  // Weather after the location settles, so it is fetched once, for the refined place
  if (['cloud', 'wind', 'rain'].some(k => num(k) === null)) {
    loadWeather().then(w => {
      if (!w) return;
      for (const k of ['cloud', 'wind', 'rain']) if (num(k) === null) target[k] = w[k];
      target.dir = w.dir;
      state.weatherKnown = true;
      refreshChip();
    });
  }
});
