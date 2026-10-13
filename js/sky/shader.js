// shader.js
// The stage: a full-screen WebGL canvas behind the page, drawn by one fragment shader.
// Without WebGL, program stays null and the loop falls back to a CSS gradient.
const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime, uFlow, uScroll, uDark, uReveal, uNight, uCloud, uRain, uPresence, uEnergy;
uniform float uSnow, uHail, uFog, uStorm;
uniform vec2 uFlash;    // lightning: strength, strike x in uv
uniform vec3 uZenith, uHorizon, uBodyCol, uGlow;
uniform vec3 uBody;     // screen x, screen y, strength
uniform vec2 uWind;     // drift direction
uniform vec2 uPointer;
uniform vec2 uColumn;   // content column, x0..x1 in uv
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
  col = lit(col, vec3(1.), star * uNight * (1. - uCloud) * (1. - uFog) * .85 * g);

  // The visitor pushes the air around
  vec2 d = p - ptr;
  float pd = length(d);
  vec2 push = d / (pd + 1e-4) * exp(-pd * pd * 16.) * .25 * uPresence;

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
  cloud *= 1. - .3 * uStorm * (1. - f * .5); // storm clouds are heavy and dark
  col = mix(col, cloud, c * .85);

  // Sun or moon, dimmed behind cloud and fog
  float bd = length(p - body);
  col = lit(col, uBodyCol, (.4 * exp(-bd * 3.) + .4 * exp(-bd * bd * 150.)) * uBody.z * (1. - .7 * uCloud) * (1. - .6 * uFog));

  // Fog: a soft wall rising from the horizon, and a veil over the rest
  vec3 fogCol = uDark > .5 ? mix(uHorizon, vec3(.3, .33, .4), .55) : mix(uHorizon, vec3(.9, .91, .93), .6);
  float fogBand = smoothstep(1.6, .1, uv.y - hY) * (.7 + .3 * fbm(q * .6 + uFlow * .004));
  col = mix(col, fogCol, uFog * (.35 + .55 * fogBand));

  // Lightning: the clouds light up from inside, brightest near the strike
  float strike = exp(-abs(uv.x - uFlash.y) * 3.);
  col = lit(col, vec3(.85, .88, 1.), uFlash.x * (c * (.35 + .65 * strike) + .08));

  // Rain
  vec2 r = vec2(p.x * 70. + p.y * 12., p.y * 2.5 + uTime * 3.5);
  float rh = hash(vec2(floor(r.x), 1.));
  float drop = smoothstep(.88, 1., fract(r.y + rh * 7.)) * (1. - smoothstep(0., .1, abs(fract(r.x) - .5)));
  col = lit(col, mix(uGlow, vec3(1.), .5), drop * clamp(uRain, 0., 1.) * .11);

  // Hail: short, bright, fast pellets
  vec2 hr = vec2(p.x * 45. + p.y * 6., p.y * 1.6 + uTime * 6.);
  float hh = hash(vec2(floor(hr.x), 5.));
  float pellet = smoothstep(.95, 1., fract(hr.y + hh * 7.)) * (1. - smoothstep(0., .2, abs(fract(hr.x) - .5)));
  col = lit(col, vec3(1.), pellet * uHail * .25);

  // Snow: three depths of flakes, falling slowly, wobbling, drifting with the wind
  float snow = 0.;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float sc = 16. + fi * 12.;
    vec2 sp = vec2(p.x + uWind.x * uFlow * .012 * (1. - fi * .25), p.y + uTime * (.09 - fi * .02)) * sc;
    vec2 cell = floor(sp);
    float h = hash(cell + fi * 17.);
    vec2 fp = fract(sp) - .5 + (vec2(hash(cell + 3.1), hash(cell + 7.7)) - .5) * .5;
    fp.x += sin(uTime * (1. + h) + h * 40.) * .2;
    float rad = mix(.06, .13, h) * (1. - fi * .2);
    snow += step(1. - uSnow * .55, h) * smoothstep(rad, rad * .3, length(fp)) * (1. - fi * .25);
  }
  col = lit(col, vec3(1.), snow * (uDark > .5 ? .55 : 1.3));

  // Stage light on the work
  for (int i = 0; i < 6; i++) {
    vec4 s = uSpots[i];
    vec2 c0 = vec2((s.x + s.z) * .5 * asp, (s.y + s.w) * .5);
    vec2 hs = vec2((s.z - s.x) * .5 * asp, (s.w - s.y) * .5);
    float sd = length(max(abs(p - c0) - hs, 0.));
    float above = .25 + .75 * smoothstep(c0.y - hs.y - .02, c0.y, p.y); // lit from above, so text under a tile stays clear
    col = lit(col, mix(uGlow, uHorizon, .3), exp(-sd * 9.) * .4 * above * uSpotA[i]);
  }

  // The visitor's light
  col = lit(col, uGlow, exp(-pd * pd * 28.) * .14 * uPresence * (1. + uEnergy));

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

export const canvas = document.createElement('canvas');
canvas.className = 'ambient';
canvas.setAttribute('aria-hidden', 'true');
export const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });

export let program = null;
export const U = {};
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
      'uEnergy', 'uSnow', 'uHail', 'uFog', 'uStorm', 'uFlash', 'uColumn', 'uZenith', 'uHorizon', 'uBodyCol', 'uGlow', 'uBody', 'uWind', 'uPointer', 'uSpots', 'uSpotA']) {
      U[name] = gl.getUniformLocation(program, name);
    }
    document.body.prepend(canvas);
  } catch (err) {
    console.warn('ambient: falling back to a CSS sky', err);
    program = null;
  }
}

export function resize() {
  const ratio = Math.min(devicePixelRatio || 1, 2) * 0.5; // soft by nature: half resolution is plenty
  canvas.width = Math.max(1, Math.round(innerWidth * ratio));
  canvas.height = Math.max(1, Math.round(innerHeight * ratio));
  if (program) gl.viewport(0, 0, canvas.width, canvas.height);
}
