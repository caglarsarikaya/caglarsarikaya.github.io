// year.js
// "Play year": a calm tour of the weather a year can bring, in a random order — snow to rain, rain to sun,
// sun to cloud, cloud to wind... The light stays as it is now; only the weather changes, blending stop to stop.
import { fromOpenMeteo } from './conditions.js';

export const STOPS = 9;

// [WMO code, wind km/h, gust km/h, family]; the same family never plays twice in a row
const ALWAYS = [
  [73, 10, 0, 'snow'], [63, 12, 0, 'rain'], [0, 8, 0, 'clear'],
  [3, 12, 0, 'cloud'], [2, 40, 55, 'wind'], [95, 25, 45, 'storm']
];
const EXTRA = [
  [75, 15, 0, 'snow'], [65, 18, 0, 'rain'], [53, 8, 0, 'rain'], [45, 5, 0, 'fog'],
  [99, 30, 50, 'storm'], [1, 8, 0, 'clear'], [66, 10, 0, 'snow']
];
const CLOUD = { 0: 0, 1: 30, 2: 60, 3: 95 };

const shuffle = list => {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

let tour = [];

export function startTour() {
  const picks = [...ALWAYS, ...shuffle([...EXTRA]).slice(0, STOPS - ALWAYS.length)];
  let order;
  do order = shuffle([...picks]);
  while (order.some((s, i) => i && s[3] === order[i - 1][3]));
  tour = order.map(([code, wind, gust]) => {
    const w = fromOpenMeteo({ weather_code: code, cloud_cover: CLOUD[code] ?? 0 });
    return { ...w, wind, gust };
  });
}

// progress: 0..1 through the tour, linear so every stop gets the same time
export function tourWeather(progress) {
  return tour[Math.min(STOPS - 1, Math.floor(progress * STOPS))];
}
