// visitor.js
// The cursor is a light that parts the clouds, scrolling tilts the view to the horizon

export const pointer = { x: 0.5, y: 0.6, sx: 0.5, sy: 0.6, presence: 0, energy: 0, seen: 0 };
export const scroll = { y: window.scrollY, energy: 0 };

export function onScroll() {
  const dy = window.scrollY - scroll.y;
  scroll.y = window.scrollY;
  scroll.energy = Math.min(2, scroll.energy + Math.abs(dy) / 400);
}

export function onPointerMove(e) {
  if (e.pointerType !== 'mouse') return;
  const x = e.clientX / innerWidth, y = 1 - e.clientY / innerHeight;
  if (pointer.presence < 0.05) { pointer.sx = x; pointer.sy = y; }
  pointer.energy = Math.min(2, pointer.energy + Math.hypot(x - pointer.x, y - pointer.y) * 6);
  pointer.x = x;
  pointer.y = y;
  pointer.seen = performance.now();
}

export function onPointerLeave() {
  pointer.seen = 0;
}
