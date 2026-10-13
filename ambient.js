// ambient.js
// "Your sky, on stage": the page background is the visitor's real sky at this moment, rendered as a stage backdrop.
// - Where: the browser's time zone (no permission prompt), mapped to approximate coordinates
// - When: real solar / lunar position there; the sky's colours follow the sun, and the sun or moon glows on screen
//   where it stands: left in the morning, overhead at noon, right in the evening
// - Weather: Open-Meteo (free, no key). Cloud cover becomes drifting cloud, wind its speed and direction, rain falls
// - The work: every project and video preview in view gets a halo of that light, like stage lighting on a product
// - Visitor: the cursor is a light that parts the clouds, a click sends a ripple, scrolling tilts the view to the horizon
// - The chip in the intro names the sky ("Your sky now · Istanbul · 17:20 · golden hour") and plays a day on click
// Dev overrides: ?at=2026-06-21T06:30%2B03:00&tz=Asia/Tokyo&cloud=80&wind=30&rain=1&speed=600
(() => {
  const RAD = Math.PI / 180;
  const params = new URLSearchParams(location.search);
  const num = key => {
    const v = params.get(key);
    return v !== null && v !== '' && !isNaN(v) ? Number(v) : null;
  };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  // ---------- Where: time zone → approximate coordinates ----------
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

  function locate(zone) {
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

  let zone = params.get('tz') || '';
  try {
    zone = zone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    zone = 'UTC';
  }
  const place = locate(zone);

  // ---------- When: real clock, a dev override (?at, ?speed), or a played day ----------
  const at = Date.parse(params.get('at') || '');
  const speed = num('speed') ?? 1;
  const t0 = performance.now();
  const startMs = isNaN(at) ? Date.now() : at;
  const LAPSE_MS = 9000;
  let lapse = 0; // performance.now() when "play a day" started, 0 when not playing

  function now() {
    const base = isNaN(at) && speed === 1 ? Date.now() : startMs + (performance.now() - t0) * speed;
    if (!lapse) return new Date(base);
    const k = clamp((performance.now() - lapse) / LAPSE_MS, 0, 1);
    const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    return new Date(base + eased * 86400000);
  }

  // ---------- Sky: sun and moon ----------
  // ---------- Sky: sun and moon ----------
  // Low-precision solar position (about 0.01°, plenty for a sky)
  function sunPosition(date, lat, lon) {
    const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
    const g = (357.529 + 0.98560028 * d) * RAD;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * d) * RAD;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const ha = (gmst * 15 + lon) * RAD - ra;
    const phi = lat * RAD;
    const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
    const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha));
    return { elevation: alt / RAD, azimuth: (az / RAD + 360) % 360 };
  }

  const SYNODIC = 29.530588853;
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const moonPhase = date => ((((date - NEW_MOON) / 86400000) % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC;
  const PHASES = ['new moon', 'waxing crescent', 'first quarter moon', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter moon', 'waning crescent'];
  const phaseName = p => PHASES[p < 0.03 || p > 0.97 ? 0 : p < 0.22 ? 1 : p < 0.28 ? 2 : p < 0.47 ? 3 : p < 0.53 ? 4 : p < 0.72 ? 5 : p < 0.78 ? 6 : 7];

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

  function sky(date, dark) {
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

  // ---------- Weather ----------
  const weather = { cloud: num('cloud') ?? 0, wind: num('wind') ?? 8, dir: 250, rain: num('rain') ?? 0 };
  const target = { ...weather };
  let weatherKnown = ['cloud', 'wind', 'rain'].some(k => num(k) !== null);

  async function loadWeather() {
    const key = `ambient-sky:${place.lat.toFixed(1)},${place.lon.toFixed(1)}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key));
      if (cached && Date.now() - cached.t < 1800000) return cached.w;
    } catch { /* storage unavailable */ }
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat.toFixed(2)}&longitude=${place.lon.toFixed(2)}&current=cloud_cover,wind_speed_10m,wind_direction_10m,precipitation`);
      if (!res.ok) return null;
      const c = (await res.json()).current;
      if (!c) return null;
      const w = { cloud: c.cloud_cover ?? 0, wind: c.wind_speed_10m ?? 0, dir: c.wind_direction_10m ?? 250, rain: c.precipitation ?? 0 };
      try {
        sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), w }));
      } catch { /* storage unavailable */ }
      return w;
    } catch {
      return null; // offline or blocked: clear and calm
    }
  }

  // ---------- Stage shader ----------
  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime, uFlow, uScroll, uDark, uReveal, uNight, uCloud, uRain, uPresence, uEnergy;
uniform vec3 uZenith, uHorizon, uBodyCol, uGlow;
uniform vec3 uBody;     // screen x, screen y, strength
uniform vec2 uWind;     // drift direction
uniform vec2 uPointer;
uniform vec2 uColumn;   // content column, x0..x1 in uv
uniform vec3 uRipple;   // x, y, age in seconds
uniform vec4 uSpots[6]; // preview rects in uv (x0, y0, x1, y1)
uniform float uSpotA[6];

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0., a = .5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= .5; }
  return v;
}
// Light on a dark stage adds up; on a pale stage it tints
vec3 lit(vec3 col, vec3 c, float a) {
  return uDark > .5 ? col + c * a : mix(col, c, clamp(a * .55, 0., 1.));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 ptr = vec2(uPointer.x * asp, uPointer.y);
  vec2 body = vec2(uBody.x * asp, uBody.y);

  // Sky: scrolling down tilts the view toward the horizon
  float hY = mix(-.55, .1, uScroll);
  float g = clamp((uv.y - hY) / 1.5, 0., 1.);
  vec3 col = mix(uHorizon, uZenith, pow(g, .55));
  col = mix(col, uHorizon * (uDark > .5 ? .45 : .96), smoothstep(0., -.08, uv.y - hY));
  float hz = exp(-abs(uv.y - hY) * 5.);
  col = lit(col, uBodyCol, hz * .3 * (.35 + .65 * exp(-abs(p.x - body.x) * 1.2)) * uBody.z);

  // Stars
  vec2 sc = p * 140.;
  float sh = hash(floor(sc));
  float star = step(.993, sh) * smoothstep(.4, 0., length(fract(sc) - .5)) * (.55 + .45 * sin(uTime * 1.7 + sh * 60.));
  col = lit(col, vec3(1.), star * uNight * (1. - uCloud) * .85 * g);

  // Visitor and ripple push the air around
  vec2 d = p - ptr;
  float pd = length(d);
  vec2 push = d / (pd + 1e-4) * exp(-pd * pd * 16.) * .25 * uPresence;
  vec2 rp = vec2(uRipple.x * asp, uRipple.y);
  float rd = length(p - rp);
  float ring = exp(-pow((rd - uRipple.z * .55) * 9., 2.)) * exp(-uRipple.z * .9);
  push += (p - rp) / (rd + 1e-4) * ring * .1;

  // Clouds: cover from the real cloud cover, drift from the real wind
  vec2 q = p * 1.35 + push - uWind * uFlow * .02;
  float w = fbm(q + vec2(uFlow * .011, -uFlow * .008));
  float f = fbm(q + w * 1.7 + vec2(0., uFlow * .015));
  float cover = .3 + .62 * uCloud;
  float c = smoothstep(1. - cover, 1. - cover + .42, f);
  c *= 1. - .8 * exp(-pd * pd * 20.) * uPresence; // clouds part around the visitor
  float nearBody = exp(-length(p - body) * 1.5) * uBody.z;
  vec3 cloud = uDark > .5
    ? mix(col * 1.35 + vec3(.012, .016, .03), uGlow * .5, .12 + .4 * nearBody)
    : mix(col * .9, uGlow, .1 + .3 * nearBody);
  col = mix(col, cloud, c * .85);

  // Sun or moon, dimmed behind cloud
  float bd = length(p - body);
  col = lit(col, uBodyCol, (.4 * exp(-bd * 3.) + .4 * exp(-bd * bd * 150.)) * uBody.z * (1. - .7 * uCloud));

  // Rain
  vec2 r = vec2(p.x * 70. + p.y * 12., p.y * 2.5 + uTime * 3.5);
  float rh = hash(vec2(floor(r.x), 1.));
  float drop = smoothstep(.88, 1., fract(r.y + rh * 7.)) * (1. - smoothstep(0., .1, abs(fract(r.x) - .5)));
  col = lit(col, mix(uGlow, vec3(1.), .5), drop * clamp(uRain, 0., 1.) * .09);

  // Stage light on the work
  for (int i = 0; i < 6; i++) {
    vec4 s = uSpots[i];
    vec2 c0 = vec2((s.x + s.z) * .5 * asp, (s.y + s.w) * .5);
    vec2 hs = vec2((s.z - s.x) * .5 * asp, (s.w - s.y) * .5);
    float sd = length(max(abs(p - c0) - hs, 0.));
    float above = .25 + .75 * smoothstep(c0.y - hs.y - .02, c0.y, p.y); // lit from above, so text under a tile stays clear
    col = lit(col, mix(uGlow, uHorizon, .3), exp(-sd * 9.) * .4 * above * uSpotA[i]);
  }

  // The visitor's light and the ripple
  col = lit(col, uGlow, exp(-pd * pd * 28.) * .14 * uPresence * (1. + uEnergy));
  col = lit(col, uGlow, ring * .2);

  // Keep text readable: compress highlights inside the content column on dark; margins and the top band keep their glow
  if (uDark > .5) {
    float outside = max(uColumn.x - uv.x, uv.x - uColumn.y); // < 0 inside the column
    float inCol = 1. - smoothstep(-.12, .14, outside);
    inCol *= 1. - .6 * smoothstep(.8, 1.05, uv.y);
    float l = dot(col, vec3(.2126, .7152, .0722));
    col /= 1. + max(l - mix(.26, .16, inCol), 0.) * mix(1., 2.6, inCol);
  }

  col *= uDark > .5 ? uReveal : 1.;
  if (uDark < .5) col = mix(vec3(1.), col, uReveal);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - .5) / 128.; // grain against banding
  gl_FragColor = vec4(col, 1.);
}`;

  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;

  const canvas = document.createElement('canvas');
  canvas.className = 'ambient';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });

  let program = null;
  const U = {};
  if (gl) {
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(program, 'a');
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      for (const name of ['uRes', 'uTime', 'uFlow', 'uScroll', 'uDark', 'uReveal', 'uNight', 'uCloud', 'uRain', 'uPresence',
        'uEnergy', 'uColumn', 'uZenith', 'uHorizon', 'uBodyCol', 'uGlow', 'uBody', 'uWind', 'uPointer', 'uRipple', 'uSpots', 'uSpotA']) {
        U[name] = gl.getUniformLocation(program, name);
      }
      document.body.prepend(canvas);
    } catch (err) {
      console.warn('ambient: falling back to a CSS sky', err);
      program = null;
    }
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2) * 0.5; // soft by nature: half resolution is plenty
    canvas.width = Math.max(1, Math.round(innerWidth * ratio));
    canvas.height = Math.max(1, Math.round(innerHeight * ratio));
    if (program) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // The content column, where text sits
  let column = [0, 1];
  const container = document.querySelector('.container');
  const measureColumn = () => {
    const r = container?.getBoundingClientRect();
    column = r ? [r.left / innerWidth, r.right / innerWidth] : [0, 1];
  };

  // ---------- Visitor ----------
  const pointer = { x: 0.5, y: 0.6, sx: 0.5, sy: 0.6, presence: 0, energy: 0, seen: 0 };
  const ripple = { x: 0.5, y: 0.5, start: -1e9 };
  let scrollY = window.scrollY;
  let scrollEnergy = 0;

  // Previews in view get stage light; each fades in as it arrives
  const spotAlpha = new WeakMap();
  let spotEls = [];
  const refreshSpots = () => { spotEls = [...document.querySelectorAll('.preview, .video-thumb')]; };

  function spots(dt) {
    const rects = new Float32Array(24);
    const alphas = new Float32Array(6);
    const W = innerWidth, H = innerHeight;
    let n = 0;
    for (const el of spotEls) {
      const r = el.getBoundingClientRect();
      const inView = r.bottom > 0 && r.top < H && r.width > 0;
      const a = (spotAlpha.get(el) || 0) + ((inView ? 1 : 0) - (spotAlpha.get(el) || 0)) * Math.min(1, dt / 600);
      spotAlpha.set(el, a);
      if (!inView || n >= 6) continue;
      rects.set([r.left / W, 1 - r.bottom / H, r.right / W, 1 - r.top / H], n * 4);
      alphas[n++] = a;
    }
    return [rects, alphas];
  }

  // ---------- The chip: names the sky, plays a day ----------
  const chip = document.querySelector('[data-sky-chip]');
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

  function writeChip(date, s) {
    if (!chipLabel) return;
    const time = clock(date);
    const parts = [lapse ? 'A day of your sky' : 'Your sky now', place.label, time, hourWord(s, time)];
    if (weatherKnown && !lapse) {
      const c = target.cloud;
      parts.push(target.rain > 0.1 ? 'rain' : c < 15 ? 'clear' : c < 45 ? 'light cloud' : c < 80 ? 'cloudy' : 'overcast');
      if (target.wind > 25) parts.push('windy');
    }
    const text = parts.join(' · ');
    if (chipLabel.textContent !== text) chipLabel.textContent = text;
    root.style.setProperty('--sky-sun', `rgb(${s.bodyColor.map(v => Math.round(v * 255)).join(',')})`);
  }

  chip?.addEventListener('click', () => {
    lapse = performance.now();
    chip.classList.add('is-playing');
    chip.setAttribute('aria-pressed', 'true');
    invalidate();
  });

  // ---------- Loop ----------
  let revealStart = performance.now();
  let revealed = false;
  try {
    revealed = sessionStorage.getItem('sky-revealed') === '1';
    sessionStorage.setItem('sky-revealed', '1');
  } catch { /* storage unavailable */ }
  if (revealed || reducedQuery.matches) revealStart = -1e9;

  let flow = 0;
  let last = performance.now();
  let lastChip = -Infinity;
  let running = false;
  let pending = false;

  function render() {
    const tNow = performance.now();
    const dt = Math.min(tNow - last, 100);
    last = tNow;
    const still = reducedQuery.matches;
    const dark = darkQuery.matches;

    if (lapse && tNow - lapse >= LAPSE_MS) {
      lapse = 0;
      chip?.classList.remove('is-playing');
      chip?.setAttribute('aria-pressed', 'false');
      lastChip = -Infinity;
    }

    const date = now();
    const s = sky(date, dark);

    const ease = still ? 1 : 1 - Math.pow(0.97, dt / 16);
    for (const k of ['cloud', 'wind', 'rain']) weather[k] += (target[k] - weather[k]) * ease;
    weather.dir = target.dir;

    // Visitor easing
    const follow = still ? 1 : Math.min(1, dt / 160);
    pointer.sx += (pointer.x - pointer.sx) * follow;
    pointer.sy += (pointer.y - pointer.sy) * follow;
    const present = pointer.seen && tNow - pointer.seen < 4000 ? 1 : 0;
    pointer.presence += (present - pointer.presence) * Math.min(1, dt / 500);
    pointer.energy *= Math.pow(0.9, dt / 16);
    scrollEnergy *= Math.pow(0.92, dt / 16);
    if (!still) flow += (dt / 1000) * (0.35 + Math.min(weather.wind, 60) / 18) * (1 + scrollEnergy * 2 + pointer.energy);

    // Where the sun or moon sits on screen: east on the left in the north (facing south), mirrored in the south
    const facing = place.lat >= 0 ? -1 : 1;
    const elevN = clamp(s.body.elevation / 55, -0.4, 1);
    const reveal = smooth(0, 2400, tNow - revealStart);
    const scroll = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1);
    // Low light sits out in the margins; high light glows down from the top edge
    const bodyX = 0.5 + facing * Math.sin(s.body.azimuth * RAD) * 0.48;
    const bodyY = Math.min(0.4 + elevN * 0.95, 1.02) - scroll * 0.3 - (1 - reveal) * 0.45;

    const windRad = (weather.dir + 180) * RAD; // wind blows *from* dir
    if (program) {
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, still ? 0 : tNow / 1000);
      gl.uniform1f(U.uFlow, flow);
      gl.uniform1f(U.uScroll, scroll);
      gl.uniform1f(U.uDark, dark ? 1 : 0);
      gl.uniform1f(U.uReveal, 0.15 + 0.85 * reveal);
      gl.uniform1f(U.uNight, s.night);
      gl.uniform1f(U.uCloud, clamp(weather.cloud / 100, 0, 1));
      gl.uniform1f(U.uRain, clamp(weather.rain / 1.5, 0, 1));
      gl.uniform1f(U.uPresence, pointer.presence);
      gl.uniform1f(U.uEnergy, Math.min(pointer.energy, 2));
      gl.uniform3fv(U.uZenith, s.zenith);
      gl.uniform3fv(U.uHorizon, s.horizon);
      gl.uniform3fv(U.uBodyCol, s.bodyColor);
      gl.uniform3fv(U.uGlow, s.glow);
      gl.uniform3f(U.uBody, bodyX, bodyY, s.bodyStrength * (0.5 + 0.5 * reveal));
      gl.uniform2f(U.uWind, Math.sin(windRad) * facing, Math.cos(windRad) * 0.3);
      gl.uniform2f(U.uPointer, pointer.sx, pointer.sy);
      gl.uniform2f(U.uColumn, column[0], column[1]);
      gl.uniform3f(U.uRipple, ripple.x, ripple.y, still ? 99 : (tNow - ripple.start) / 1000);
      const [rects, alphas] = spots(still ? 1e4 : dt);
      gl.uniform4fv(U.uSpots, rects);
      gl.uniform1fv(U.uSpotA, alphas);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      // No WebGL: the same sky as a plain gradient
      const css = c => `rgb(${c.map(v => Math.round(v * 255)).join(',')})`;
      root.style.background = `linear-gradient(to bottom, ${css(s.zenith)}, ${css(s.horizon)}) fixed`;
    }

    if (tNow - lastChip > (lapse || speed !== 1 ? 120 : 10000)) {
      lastChip = tNow;
      writeChip(date, s);
    }
    if (chip && chip.hidden && reveal > 0.35) {
      chip.hidden = false;
      requestAnimationFrame(() => chip.classList.add('is-shown'));
    }
  }

  function frame() {
    pending = false;
    if (!running) {
      render();
      return;
    }
    render();
    requestAnimationFrame(frame);
  }

  // Draw once soon (still mode, or while paused)
  function invalidate() {
    if (running || pending) return;
    pending = true;
    requestAnimationFrame(frame);
  }

  function start() {
    if (reducedQuery.matches || document.hidden || running) {
      invalidate();
      return;
    }
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  // ---------- Wiring ----------
  resize();
  measureColumn();
  refreshSpots();
  setInterval(refreshSpots, 1500); // feeds add video tiles after load

  addEventListener('resize', () => { resize(); measureColumn(); invalidate(); });
  addEventListener('scroll', () => {
    const dy = window.scrollY - scrollY;
    scrollY = window.scrollY;
    scrollEnergy = Math.min(2, scrollEnergy + Math.abs(dy) / 400);
    invalidate();
  }, { passive: true });

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const x = e.clientX / innerWidth, y = 1 - e.clientY / innerHeight;
    if (pointer.presence < 0.05) { pointer.sx = x; pointer.sy = y; }
    pointer.energy = Math.min(2, pointer.energy + Math.hypot(x - pointer.x, y - pointer.y) * 6);
    pointer.x = x;
    pointer.y = y;
    pointer.seen = performance.now();
  }, { passive: true });
  document.addEventListener('mouseleave', () => { pointer.seen = 0; });
  addEventListener('pointerdown', e => {
    ripple.x = e.clientX / innerWidth;
    ripple.y = 1 - e.clientY / innerHeight;
    ripple.start = performance.now();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else start();
  });
  darkQuery.addEventListener('change', invalidate);
  reducedQuery.addEventListener('change', () => { running = false; start(); });
  // Still mode: follow the sun once a minute, and step through a played day
  setInterval(() => { if (!running && !document.hidden) invalidate(); }, 60000);
  setInterval(() => { if (lapse && !running) invalidate(); }, 1000);

  start();

  if (['cloud', 'wind', 'rain'].some(k => num(k) === null)) {
    loadWeather().then(w => {
      if (!w) return;
      for (const k of ['cloud', 'wind', 'rain']) if (num(k) === null) target[k] = w[k];
      target.dir = w.dir;
      weatherKnown = true;
      lastChip = -Infinity;
      invalidate();
    });
  }
})();
