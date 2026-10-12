// ambient.js
// "Window light": the wall behind the work is lit by the real sun (or moon) over the visitor,
// falling through an imaginary window just out of frame.
// - Location: the browser's time zone (no permission prompt), mapped to approximate coordinates
// - Light: real solar / lunar position for that place and moment; colour follows the sun's height
// - Weather: Open-Meteo (free, no key). Clouds soften the light, wind sways the leaf shadows, rain runs down the pane
// - Visitor: the pointer casts a faint body shadow into the light and stirs the dust in the beam
// - The work: card and preview shadows (--shadow) fall away from the light
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
  const rgba = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;

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

  // ---------- When: real clock, or a dev override (?at, ?speed for a time-lapse) ----------
  const at = Date.parse(params.get('at') || '');
  const speed = num('speed') ?? 1;
  const t0 = performance.now();
  const startMs = isNaN(at) ? Date.now() : at;
  const now = () => (isNaN(at) && speed === 1 ? new Date() : new Date(startMs + (performance.now() - t0) * speed));

  // ---------- Sky: sun and moon ----------
  // Low-precision solar position (about 0.01° — plenty for a wall)
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

  // Colour of daylight by solar elevation: blue twilight → amber horizon → golden → neutral white
  const SUN_STOPS = [[-6, [150, 168, 235]], [0, [255, 146, 92]], [6, [255, 188, 128]], [20, [255, 224, 188]], [45, [255, 243, 226]]];
  const MOON = [196, 210, 245];
  const SKYGLOW = [150, 165, 215]; // the city at night: the window is never fully dark

  function sunColor(elev) {
    if (elev <= SUN_STOPS[0][0]) return SUN_STOPS[0][1];
    for (let i = 1; i < SUN_STOPS.length; i++) {
      const [e1, c1] = SUN_STOPS[i];
      const [e0, c0] = SUN_STOPS[i - 1];
      if (elev <= e1) return mix(c0, c1, (elev - e0) / (e1 - e0));
    }
    return SUN_STOPS[SUN_STOPS.length - 1][1];
  }

  function sky(date) {
    const sun = sunPosition(date, place.lat, place.lon);
    const phase = moonPhase(date);
    // The moon trails the sun by its phase angle: roughly where the sun was phase × a lunar day ago
    const moon = sunPosition(new Date(date - phase * 24.84 * 3600e3), place.lat, place.lon);
    const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    const sunI = smooth(-6, 4, sun.elevation) * (0.6 + 0.4 * smooth(4, 35, sun.elevation));
    const moonI = illum * smooth(-3, 12, moon.elevation) * 0.45 * (1 - smooth(-6, 0, sun.elevation));
    const glowI = 0.2 * (1 - smooth(-8, 2, sun.elevation));
    const bySun = sunI >= Math.max(moonI, glowI);
    const byMoon = !bySun && moonI >= glowI;
    return {
      sun, moon, phase, bySun, byMoon,
      src: bySun ? sun : byMoon ? moon : { azimuth: sun.azimuth, elevation: 25 },
      intensity: Math.max(sunI, moonI, glowI),
      color: bySun ? sunColor(sun.elevation) : byMoon ? MOON : SKYGLOW
    };
  }

  // ---------- Weather ----------
  const weather = { cloud: num('cloud') ?? 0, wind: num('wind') ?? 6, rain: num('rain') ?? 0 };
  const target = { ...weather };
  let weatherKnown = ['cloud', 'wind', 'rain'].some(k => num(k) !== null);

  async function loadWeather() {
    const key = `ambient-weather:${place.lat.toFixed(1)},${place.lon.toFixed(1)}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key));
      if (cached && Date.now() - cached.t < 1800000) return cached.w;
    } catch { /* storage unavailable */ }
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat.toFixed(2)}&longitude=${place.lon.toFixed(2)}&current=cloud_cover,wind_speed_10m,precipitation`);
      if (!res.ok) return null;
      const c = (await res.json()).current;
      if (!c) return null;
      const w = { cloud: c.cloud_cover ?? 0, wind: c.wind_speed_10m ?? 0, rain: c.precipitation ?? 0 };
      try {
        sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), w }));
      } catch { /* storage unavailable */ }
      return w;
    } catch {
      return null; // offline or blocked: clear and calm
    }
  }

  // ---------- Canvases ----------
  const MARGIN = 48; // the blurred wall canvas overhangs the viewport so its edges never fade in
  const SCALE = 0.25; // the light is soft anyway: render it at quarter resolution

  const wall = document.createElement('canvas');
  wall.className = 'ambient ambient-wall';
  const dust = document.createElement('canvas');
  dust.className = 'ambient ambient-dust';
  [wall, dust].forEach(c => c.setAttribute('aria-hidden', 'true'));
  document.body.prepend(wall, dust);

  const ctx = wall.getContext('2d');
  const dctx = dust.getContext('2d');
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  function resize() {
    W = innerWidth;
    H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    mask.width = wall.width = Math.ceil((W + MARGIN * 2) * SCALE);
    mask.height = wall.height = Math.ceil((H + MARGIN * 2) * SCALE);
    dust.width = Math.ceil(W * dpr);
    dust.height = Math.ceil(H * dpr);
  }

  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)').matches;

  // ---------- Visitor ----------
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0, active: false };
  let scrollY = window.scrollY;

  // Seeded random, so the tree outside the window is the same tree on every visit
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const LEAVES = Array.from({ length: 9 }, () => ({
    u: -0.15 + rand() * 0.65, v: -0.15 + rand() * 0.55, r: 0.05 + rand() * 0.09, ph: rand() * 6.28
  }));
  const DROPS = Array.from({ length: 14 }, () => ({ u: rand(), v: rand() * 1.2 - 0.1, s: 0.4 + rand(), r: 0.6 + rand() * 0.8 }));
  const MOTES = Array.from({ length: 28 }, () => ({ x: -1, y: -1, vx: 0, vy: 0, r: 0.5 + rand() * 1.1, ph: rand() * 6.28 }));

  // ---------- Geometry: where the window's light lands on the wall ----------
  function geometry(s) {
    // Face the sun's side of the sky: in the north, morning light comes from the left
    const srcX = (place.lat >= 0 ? -1 : 1) * Math.sin(s.src.azimuth * RAD);
    const e = clamp(s.src.elevation / 60, 0, 1);
    const base = Math.min(W, H * 1.4);
    const pw = base * (0.5 + 0.18 * (1 - e)); // low light stretches the patch sideways
    const ph = H * (0.42 + 0.3 * e); // high light stretches it down the wall
    const cx = W * (0.5 - srcX * 0.24) + Math.sin(scrollY / 1400) * W * 0.03;
    const cy = H * (0.36 + 0.2 * e) - Math.min(scrollY * 0.04, H * 0.12);
    const shear = srcX * ph * 0.4 * (1 - 0.5 * e);
    // Shadows fall away from the light, longer when the light is low
    const shadowX = -srcX * (1 - 0.4 * e);
    const shadowY = 0.35 + 0.65 * e;
    return { srcX, e, pw, ph, cx, cy, shear, x0: cx - pw / 2 - shear / 2, y0: cy - ph / 2, shadowX, shadowY };
  }

  const at2 = (g, u, v) => [g.x0 + u * g.pw + v * g.shear, g.y0 + v * g.ph];

  // How deep a point sits inside the light patch: 0 outside, 1 well inside
  function inBeam(g, x, y) {
    const v = (y - g.y0) / g.ph;
    const u = (x - g.x0 - v * g.shear) / g.pw;
    return { u, v, k: smooth(0, 0.15, Math.min(u, 1 - u, v, 1 - v)) };
  }

  function panes(c, g) {
    const cols = 3, rows = 2, gap = 0.028;
    c.beginPath();
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const u0 = i / cols + gap / 2, u1 = (i + 1) / cols - gap / 2;
        const v0 = j / rows + gap / 2, v1 = (j + 1) / rows - gap / 2;
        c.moveTo(...at2(g, u0, v0));
        c.lineTo(...at2(g, u1, v0));
        c.lineTo(...at2(g, u1, v1));
        c.lineTo(...at2(g, u0, v1));
        c.closePath();
      }
    }
    c.fill();
  }

  // ---------- Drawing ----------
  function drawWall(t, s, g, dark) {
    const cloud = clamp(weather.cloud / 100, 0, 1);
    const raining = clamp(weather.rain / 1.5, 0, 1);
    const sharp = 1 - 0.7 * cloud; // overcast light casts faint shadows
    const full = [-MARGIN, -MARGIN, W + MARGIN * 2, H + MARGIN * 2];

    // 1. Light mask: window panes, falloff, then shadows cut out of it
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.globalCompositeOperation = 'source-over';
    mctx.clearRect(0, 0, mask.width, mask.height);
    mctx.setTransform(SCALE, 0, 0, SCALE, MARGIN * SCALE, MARGIN * SCALE);
    mctx.fillStyle = '#fff';
    panes(mctx, g);

    mctx.globalCompositeOperation = 'destination-in';
    const fall = mctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, Math.max(g.pw, g.ph) * 0.85);
    fall.addColorStop(0, 'rgba(0,0,0,1)');
    fall.addColorStop(1, 'rgba(0,0,0,0.3)');
    mctx.fillStyle = fall;
    mctx.fillRect(...full);

    mctx.globalCompositeOperation = 'destination-out';

    // Leaves of a tree outside, on the light's side, swaying with the real wind
    const wind = clamp(weather.wind, 0, 60);
    const w = 0.00035 + wind * 0.00003;
    const amp = 0.004 + wind * 0.0009;
    mctx.fillStyle = `rgba(0,0,0,${0.5 * sharp})`;
    for (const leaf of LEAVES) {
      const u = g.srcX <= 0 ? leaf.u : 1 - leaf.u;
      const sway = Math.sin(t * w + leaf.ph) * amp + Math.sin(t * w * 1.7 + leaf.ph * 2) * amp * 0.4;
      const [x, y] = at2(g, u + sway, leaf.v + sway * 0.4);
      mctx.beginPath();
      mctx.ellipse(x, y, leaf.r * g.pw, leaf.r * g.pw * 0.72, leaf.ph, 0, Math.PI * 2);
      mctx.fill();
    }

    // Rain running down the pane
    if (raining > 0.01) {
      mctx.fillStyle = `rgba(0,0,0,${0.35 * raining})`;
      for (const d of DROPS) {
        const [x, y] = at2(g, d.u, d.v);
        mctx.beginPath();
        mctx.ellipse(x, y, d.r * g.pw * 0.012, d.r * g.pw * 0.02, 0, 0, Math.PI * 2);
        mctx.fill();
      }
    }

    // The visitor, standing between the window and the wall
    if (pointer.active) {
      const len = Math.hypot(g.shadowX, g.shadowY) || 1;
      const x = pointer.sx + (g.shadowX / len) * 70;
      const y = pointer.sy + (g.shadowY / len) * 70;
      mctx.save();
      mctx.translate(x, y);
      mctx.scale(1, 1.7);
      const body = mctx.createRadialGradient(0, 0, 0, 0, 0, 110);
      body.addColorStop(0, `rgba(0,0,0,${0.24 * sharp})`);
      body.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = body;
      mctx.fillRect(-110, -110, 220, 220);
      mctx.restore();
    }

    // Tint the mask with the colour of the light
    mctx.globalCompositeOperation = 'source-in';
    mctx.fillStyle = rgba(s.color);
    mctx.fillRect(...full);

    // 2. Compose the wall
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, wall.width, wall.height);
    ctx.setTransform(SCALE, 0, 0, SCALE, MARGIN * SCALE, MARGIN * SCALE);

    const light = s.intensity * (1 - 0.6 * cloud) * (1 - 0.25 * raining);

    // A light-theme wall is shaded a touch, so the light has something to brighten
    if (!dark) {
      ctx.fillStyle = `rgba(70,55,35,${0.07 + 0.03 * (1 - light)})`;
      ctx.fillRect(...full);
    }

    // Light bouncing around the room tints the whole wall, very slightly
    ctx.fillStyle = rgba(s.color, (dark ? 0.035 : 0.06) * light);
    ctx.fillRect(...full);

    // Corners of the room recede
    const vig = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.hypot(W, H) * 0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(${dark ? '0,0,0,0.28' : '60,45,30,0.07'})`);
    ctx.fillStyle = vig;
    ctx.fillRect(...full);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = light * (dark ? 0.1 : 0.6);
    ctx.drawImage(mask, 0, 0);
    ctx.globalAlpha = 1;

    const blur = Math.round(6 + cloud * 18);
    if (blur !== drawWall.blur) {
      drawWall.blur = blur;
      wall.style.filter = `blur(${blur}px)`;
    }
  }

  function drawDust(dt, s, g, dark, animate) {
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.clearRect(0, 0, dust.width, dust.height);
    const cloud = clamp(weather.cloud / 100, 0, 1);
    const light = s.intensity * (1 - 0.75 * cloud);
    if (light < 0.05) return;
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const step = dt / 33;
    const t = performance.now();

    for (const m of MOTES) {
      let b = inBeam(g, m.x, m.y);
      if (m.x < 0 || b.u < -0.1 || b.u > 1.1 || b.v < -0.1 || b.v > 1.1) {
        [m.x, m.y] = at2(g, 0.05 + rand() * 0.9, 0.05 + rand() * 0.9);
        m.vx = m.vy = 0;
        b = inBeam(g, m.x, m.y);
      }
      if (animate) {
        if (pointer.active) {
          const d = Math.hypot(m.x - pointer.x, m.y - pointer.y);
          if (d < 180) {
            const f = (1 - d / 180) * 0.012;
            m.vx += pointer.vx * f;
            m.vy += pointer.vy * f;
          }
        }
        m.vx += Math.sin(t * 0.0003 + m.ph) * 0.003;
        m.vy += 0.0006 + Math.cos(t * 0.00023 + m.ph * 1.3) * 0.003;
        m.vx *= 0.97;
        m.vy *= 0.97;
        m.x += m.vx * step;
        m.y += m.vy * step;
      }
      const twinkle = 0.6 + 0.4 * Math.sin(t * 0.0015 + m.ph * 3);
      const a = b.k * light * twinkle * (dark ? 0.5 : 0.85);
      if (a < 0.01) continue;
      dctx.fillStyle = rgba(mix(s.color, [255, 255, 255], 0.5), a);
      dctx.beginPath();
      dctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      dctx.fill();
    }
  }

  // ---------- Shadows of the work, and the wall label ----------
  const root = document.documentElement;
  let shadowSet = [NaN, NaN];
  function setShadows(s, g) {
    const cloud = clamp(weather.cloud / 100, 0, 1);
    const len = 0.5 + 0.9 * s.intensity * (1 - 0.6 * cloud);
    const x = +(g.shadowX * len).toFixed(2);
    const y = +(g.shadowY * len).toFixed(2);
    if (Math.abs(x - shadowSet[0]) < 0.03 && Math.abs(y - shadowSet[1]) < 0.03) return;
    shadowSet = [x, y];
    root.style.setProperty('--light-x', x);
    root.style.setProperty('--light-y', y);
  }

  function clock(date) {
    try {
      return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: zone }).format(date);
    } catch {
      return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date);
    }
  }

  function writeLabel(date, s) {
    const label = document.querySelector('[data-ambient-label]');
    if (!label) return;
    const parts = [`Lit by the sky over ${place.label}`, clock(date)];
    const elev = s.sun.elevation;
    if (elev > 0) {
      parts.push(`sun ${Math.round(elev)}°`);
    } else if (elev > -6) {
      parts.push(s.sun.azimuth < 180 ? 'dawn' : 'dusk');
    } else {
      const name = phaseName(s.phase);
      const moon = name.includes('moon') ? name : `${name} moon`;
      parts.push(s.moon.elevation > 0 ? moon : `${moon}, below the horizon`);
    }
    if (weatherKnown) {
      const c = target.cloud;
      parts.push(target.rain > 0.1 ? 'rain' : c < 15 ? 'clear sky' : c < 45 ? 'light cloud' : c < 80 ? 'cloudy' : 'overcast');
      parts.push(`wind ${Math.round(target.wind)} km/h`);
    }
    label.textContent = parts.join(' · ');
  }

  // ---------- Loop ----------
  let last = 0;
  let lastLabel = 0;
  let running = false;

  function render(dt, animate) {
    const date = now();
    const s = sky(date);
    const g = geometry(s);
    const dark = darkQuery.matches;
    const ease = animate ? 1 - Math.pow(0.98, dt / 16) : 1;

    for (const k in weather) weather[k] += (target[k] - weather[k]) * ease;
    if (animate) {
      pointer.sx += (pointer.x - pointer.sx) * Math.min(1, 0.06 * dt / 16);
      pointer.sy += (pointer.y - pointer.sy) * Math.min(1, 0.06 * dt / 16);
      pointer.vx *= 0.9;
      pointer.vy *= 0.9;
      const fall = clamp(weather.rain / 1.5, 0, 1);
      if (fall > 0.01) {
        for (const d of DROPS) {
          d.v += d.s * 0.00012 * dt;
          if (d.v > 1.1) {
            d.v = -0.1;
            d.u = rand();
          }
        }
      }
    }

    // Leaves sway on real time, independent of a time-lapse
    drawWall(performance.now(), s, g, dark);
    drawDust(dt, s, g, dark, animate);
    setShadows(s, g);

    const tick = performance.now();
    if (tick - lastLabel > (speed === 1 ? 15000 : 250)) {
      lastLabel = tick;
      writeLabel(date, s);
    }
  }

  function frame(t) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (t - last < 32) return; // ~30 fps is plenty for light
    const dt = Math.min(t - last, 100);
    last = t;
    render(dt, true);
  }

  function start() {
    if (reducedQuery.matches) {
      running = false;
      render(16, false);
      return;
    }
    if (running || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  // ---------- Wiring ----------
  resize();
  addEventListener('resize', () => {
    resize();
    if (!running) render(16, false);
  });
  addEventListener('scroll', () => {
    const dy = window.scrollY - scrollY;
    scrollY = window.scrollY;
    for (const m of MOTES) m.y -= dy * 0.12; // the air moves a little as the visitor walks
  }, { passive: true });

  if (finePointer) {
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      if (!pointer.active) {
        pointer.sx = e.clientX;
        pointer.sy = e.clientY;
      }
      pointer.vx += (e.clientX - pointer.x) * 0.5;
      pointer.vy += (e.clientY - pointer.y) * 0.5;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });
    document.addEventListener('mouseleave', () => { pointer.active = false; });
  }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  darkQuery.addEventListener('change', () => { if (!running) render(16, false); });
  reducedQuery.addEventListener('change', () => { stop(); start(); });
  setInterval(() => { if (!running) render(16, false); }, 60000);

  render(16, false); // first frame right away, before the first animation tick
  start();

  if (['cloud', 'wind', 'rain'].some(k => num(k) === null)) {
    loadWeather().then(w => {
      if (!w) return;
      for (const k of ['cloud', 'wind', 'rain']) if (num(k) === null) target[k] = w[k];
      weatherKnown = true;
      lastLabel = 0;
      if (!running) render(16, false);
    });
  }
})();
