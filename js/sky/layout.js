// layout.js: the parts of the page the light reacts to

// The content column, where text sits
export let column = [0, 1];
const container = document.querySelector('.container');
export const measureColumn = () => {
  const r = container?.getBoundingClientRect();
  column = r ? [r.left / innerWidth, r.right / innerWidth] : [0, 1];
};

// Previews in view get stage light; each fades in as it arrives
const spotAlpha = new WeakMap();
let spotEls = [];
export const refreshSpots = () => { spotEls = [...document.querySelectorAll('.preview, .video-thumb')]; };

export function spots(dt) {
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
