// chip.js
// The chip in the intro names the sky ("Your sky now · Istanbul · 17:20 · golden hour") and plays a day on click
import { phaseName } from './astronomy.js';
import { state, target, zone, root } from './state.js';

export const chip = document.querySelector('[data-sky-chip]');
const chipLabel = chip?.querySelector('[data-sky-label]');

function clock(date) {
  const opts = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  try {
    return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: zone }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', opts).format(date);
  }
}

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

export function writeChip(date, s) {
  if (!chipLabel) return;
  const time = clock(date);
  const parts = [state.lapse ? 'A day of your sky' : 'Your sky now', state.place.label, time, hourWord(s, time)];
  if (state.weatherKnown && !state.lapse) {
    const c = target.cloud;
    parts.push(target.rain > 0.1 ? 'rain' : c < 15 ? 'clear' : c < 45 ? 'light cloud' : c < 80 ? 'cloudy' : 'overcast');
    if (target.wind > 25) parts.push('windy');
  }
  const text = parts.join(' · ');
  if (chipLabel.textContent !== text) chipLabel.textContent = text;
  root.style.setProperty('--sky-sun', `rgb(${s.bodyColor.map(v => Math.round(v * 255)).join(',')})`);
}

export function setPlaying(playing) {
  chip?.classList.toggle('is-playing', playing);
  chip?.setAttribute('aria-pressed', String(playing));
}
