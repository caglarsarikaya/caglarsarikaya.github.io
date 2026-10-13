// chip.js
// The chip in the intro names the sky ("Istanbul · 17:20 · golden hour · clear") and plays a day or a year of it
import { phaseName } from './astronomy.js';
import { describe } from './conditions.js';
import { state, zone, root } from './state.js';

export const chip = document.querySelector('[data-sky-chip]');
const chipLabel = chip?.querySelector('[data-sky-label]');

// Built once: the chip is rewritten often while a day plays
const CLOCK = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
let clockFormat;
try {
  clockFormat = new Intl.DateTimeFormat('en-GB', { ...CLOCK, timeZone: zone });
} catch {
  clockFormat = new Intl.DateTimeFormat('en-GB', CLOCK);
}
const clock = date => clockFormat.format(date);
let sunColor = '';

function hourWord(s, time) {
  const elev = s.sun.elevation;
  if (elev < -6) {
    const name = phaseName(s.phase);
    const moon = name.includes('moon') ? name : `${name} moon`;
    return s.moon.elevation > 0 ? moon : 'starry night';
  }
  if (elev < 0) return Number(time.slice(0, 2)) < 12 ? 'dawn' : 'dusk';
  if (elev < 10) return 'golden hour';
  const h = Number(time.slice(0, 2));
  return h < 11 ? 'morning sun' : h < 15 ? 'midday sun' : 'afternoon sun';
}

// goal: the weather being shown (the tour's stop while a year plays, else the live weather)
export function writeChip(date, s, goal) {
  if (!chipLabel) return;
  const { place } = state;
  const time = clock(date);
  const parts = [place.label, time, hourWord(s, time)];
  if (state.weatherKnown || state.play?.kind === 'year') parts.push(...describe(goal));
  const text = parts.join(' · ');
  if (chipLabel.textContent !== text) chipLabel.textContent = text;
  // Set on the root, so a change restyles the page: only when the colour really changes
  const color = `rgb(${s.bodyColor.map(v => Math.round(v * 255)).join(',')})`;
  if (color !== sunColor) root.style.setProperty('--sky-sun', sunColor = color);
}

// kind: 'day', 'year' or null. The playing button reads "Playing now" until it ends;
// each button keeps the width of its own label, so swapping the text moves nothing.
export function setPlaying(kind) {
  chip?.classList.toggle('is-playing', Boolean(kind));
  chip?.querySelectorAll('[data-sky-play]').forEach(b => {
    if (!b.dataset.label) {
      b.dataset.label = b.textContent;
      b.style.minWidth = `${b.getBoundingClientRect().width}px`;
    }
    const playing = b.dataset.skyPlay === kind;
    b.setAttribute('aria-pressed', String(playing));
    b.textContent = playing ? 'Playing now' : b.dataset.label;
  });
}
