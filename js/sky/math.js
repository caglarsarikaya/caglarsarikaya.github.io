// math.js: small numeric helpers shared by the sky

export const RAD = Math.PI / 180;

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
