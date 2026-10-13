// layout.js: the parts of the page the light reacts to

// Called when something here changes, so a still sky (drawn only on demand) redraws
let changed = () => {};
export const onLayoutChange = fn => { changed = fn; };

// The content column, where text sits
export let column = [0, 1];
const container = document.querySelector('.container');
export const measureColumn = () => {
  const r = container?.getBoundingClientRect();
  column = r ? [r.left / innerWidth, r.right / innerWidth] : [0, 1];
};

// How far the page scrolls, kept up to date here rather than read every frame
export let scrollRange = 1;
export const measureScroll = () => {
  scrollRange = Math.max(1, document.documentElement.scrollHeight - innerHeight);
};
new ResizeObserver(() => { measureColumn(); measureScroll(); changed(); }).observe(document.body);

// Previews in view get stage light; each fades in as it arrives.
// An observer keeps the in-view set, so each frame only measures the few tiles on screen.
const MAX_SPOTS = 6;
const spotAlpha = new Map();
const inView = new Set();
const watcher = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) inView.add(e.target);
    else {
      inView.delete(e.target);
      spotAlpha.delete(e.target);
    }
  }
  changed();
});
export const refreshSpots = () => {
  watcher.disconnect();
  inView.clear();
  spotAlpha.clear();
  document.querySelectorAll('.preview, .video-thumb').forEach(el => watcher.observe(el));
};

// Reused every frame
const rects = new Float32Array(MAX_SPOTS * 4);
const alphas = new Float32Array(MAX_SPOTS);

// Returns [rects, alphas, count]
export function spots(dt) {
  const W = innerWidth, H = innerHeight;
  const k = Math.min(1, dt / 600);
  let n = 0;
  for (const el of inView) {
    if (n >= MAX_SPOTS) break;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= H || r.width <= 0) continue;
    const a = spotAlpha.get(el) || 0;
    const next = a + (1 - a) * k;
    spotAlpha.set(el, next);
    rects[n * 4] = r.left / W;
    rects[n * 4 + 1] = 1 - r.bottom / H;
    rects[n * 4 + 2] = r.right / W;
    rects[n * 4 + 3] = 1 - r.top / H;
    alphas[n++] = next;
  }
  return [rects, alphas, n];
}
