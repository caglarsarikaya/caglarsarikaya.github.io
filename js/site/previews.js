// previews.js
// Live previews for project tiles: each .preview[data-preview] gets a scaled-down, non-interactive
// iframe of the site while the tile is near the viewport. Far away the iframe is dropped,
// so the previewed sites (some are games) don't keep running and holding memory.
const PREVIEW_WIDTH = 1280;

const previewResize = new ResizeObserver(entries => {
  entries.forEach(e => e.target.style.setProperty('--scale', e.contentRect.width / PREVIEW_WIDTH));
});

function attach(tile) {
  if (tile.querySelector('iframe')) return;
  const frame = document.createElement('iframe');
  frame.src = tile.dataset.preview;
  frame.tabIndex = -1;
  frame.loading = 'lazy';
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  frame.addEventListener('load', () => tile.classList.add('loaded'), { once: true });
  tile.append(frame);
}

function detach(tile) {
  tile.classList.remove('loaded');
  tile.querySelector('iframe')?.remove();
}

// Loads a little before a tile scrolls in; unloads once it is well out of view
const previewLoad = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) attach(entry.target);
    else detach(entry.target);
  });
}, { rootMargin: '600px 0px' });

export function mountPreviews() {
  document.querySelectorAll('.preview[data-preview]:not([data-mounted])').forEach(tile => {
    tile.dataset.mounted = '';
    previewResize.observe(tile);
    previewLoad.observe(tile);
  });
}
