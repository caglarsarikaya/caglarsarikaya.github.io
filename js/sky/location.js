// location.js
// Where the visitor is. First the browser time zone mapped to approximate coordinates (instant, no prompt),
// then refined to city level from the IP address when that agrees with the time zone.
import { clamp } from './math.js';
import { loadJSON, save } from '../lib/storage.js';

// [lat, lon, label?]; the label defaults to the zone's city part
const ZONES = {
  'Europe/Istanbul': [41.01, 28.98], 'Europe/London': [51.51, -0.13], 'Europe/Dublin': [53.35, -6.26],
  'Europe/Lisbon': [38.72, -9.14], 'Europe/Madrid': [40.42, -3.7], 'Europe/Paris': [48.86, 2.35],
  'Europe/Brussels': [50.85, 4.35], 'Europe/Amsterdam': [52.37, 4.9], 'Europe/Berlin': [52.52, 13.4],
  'Europe/Zurich': [47.38, 8.54], 'Europe/Rome': [41.9, 12.5], 'Europe/Vienna': [48.21, 16.37],
  'Europe/Prague': [50.08, 14.44], 'Europe/Warsaw': [52.23, 21.01], 'Europe/Stockholm': [59.33, 18.07],
  'Europe/Oslo': [59.91, 10.75], 'Europe/Copenhagen': [55.68, 12.57], 'Europe/Helsinki': [60.17, 24.94],
  'Europe/Athens': [37.98, 23.73], 'Europe/Bucharest': [44.43, 26.1], 'Europe/Sofia': [42.7, 23.32],
  'Europe/Kyiv': [50.45, 30.52, 'Kyiv'], 'Europe/Kiev': [50.45, 30.52, 'Kyiv'], 'Europe/Moscow': [55.76, 37.62],
  'Asia/Nicosia': [35.17, 33.36], 'Asia/Baku': [40.41, 49.87], 'Asia/Tbilisi': [41.72, 44.79],
  'Asia/Tehran': [35.69, 51.39], 'Asia/Dubai': [25.2, 55.27], 'Asia/Riyadh': [24.71, 46.68],
  'Asia/Jerusalem': [31.77, 35.21], 'Africa/Cairo': [30.04, 31.24], 'Africa/Lagos': [6.52, 3.38],
  'Africa/Nairobi': [-1.29, 36.82], 'Africa/Johannesburg': [-26.2, 28.05], 'Asia/Karachi': [24.86, 67.01],
  'Asia/Kolkata': [28.61, 77.21, 'India'], 'Asia/Calcutta': [28.61, 77.21, 'India'], 'Asia/Dhaka': [23.81, 90.41],
  'Asia/Bangkok': [13.76, 100.5], 'Asia/Jakarta': [-6.21, 106.85], 'Asia/Singapore': [1.35, 103.82],
  'Asia/Kuala_Lumpur': [3.14, 101.69], 'Asia/Manila': [14.6, 120.98], 'Asia/Shanghai': [31.23, 121.47, 'China'],
  'Asia/Hong_Kong': [22.32, 114.17], 'Asia/Taipei': [25.03, 121.57], 'Asia/Seoul': [37.57, 126.98],
  'Asia/Tokyo': [35.68, 139.69], 'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96],
  'Australia/Brisbane': [-27.47, 153.03], 'Australia/Perth': [-31.95, 115.86], 'Pacific/Auckland': [-36.85, 174.76],
  'America/New_York': [40.71, -74.01], 'America/Toronto': [43.65, -79.38], 'America/Chicago': [41.88, -87.63],
  'America/Denver': [39.74, -104.99], 'America/Phoenix': [33.45, -112.07], 'America/Los_Angeles': [34.05, -118.24],
  'America/Vancouver': [49.28, -123.12], 'America/Mexico_City': [19.43, -99.13], 'America/Bogota': [4.71, -74.07],
  'America/Lima': [-12.05, -77.04], 'America/Santiago': [-33.45, -70.67], 'America/Sao_Paulo': [-23.55, -46.63],
  'America/Argentina/Buenos_Aires': [-34.6, -58.38], 'Pacific/Honolulu': [21.31, -157.86]
};

export function locate(zone) {
  const city = (zone.split('/').pop() || 'here').replace(/_/g, ' ');
  const known = ZONES[zone];
  if (known) return { lat: known[0], lon: known[1], label: known[2] || city };
  // Unknown zone: longitude from the UTC offset, latitude a rough guess by region
  const lon = clamp(-new Date().getTimezoneOffset() / 4, -180, 180);
  const lat = /^(Australia|Antarctica|Pacific\/(Fiji|Tongatapu))/.test(zone) ? -30
    : /^Africa/.test(zone) ? 5
    : 40;
  return { lat, lon, label: city };
}

// Refine to city level from the visitor IP, trusted only when it agrees with the browser time zone
// (so a VPN never puts a Frankfurt sky on a Tokyo clock). Resolves to null to keep the time-zone guess.
export async function locateByIp(zone, fallbackLabel) {
  const key = 'ambient-place';
  const cached = loadJSON('session', key);
  if (cached && cached.zone === zone && Date.now() - cached.t < 21600000) return cached.p;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: ctrl.signal });
    if (!res.ok) return null;
    const geo = await res.json();
    const lat = parseFloat(geo.latitude), lon = parseFloat(geo.longitude);
    if (geo.timezone !== zone || isNaN(lat) || isNaN(lon)) return null;
    const p = { lat, lon, label: geo.city || geo.country || fallbackLabel };
    save('session', key, { t: Date.now(), zone, p });
    return p;
  } catch {
    return null; // offline, blocked or slow: keep the time-zone guess
  } finally {
    clearTimeout(timer);
  }
}
