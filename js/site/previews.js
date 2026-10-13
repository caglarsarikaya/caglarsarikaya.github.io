// previews.js
// Live previews for project tiles: each .preview[data-preview] gets a scaled-down, non-interactive
// iframe of the site, created only when the tile comes near the viewport
const PREVIEW_WIDTH = 1280;

const previewResize = new ResizeObserver(entries => {
  entries.forEach(e => e.target.style.setProperty('--scale', e.contentRect.width / PREVIEW_WIDTH));
});

const previewLoad = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    const frame = document.createElement('iframe');
    frame.src = entry.target.dataset.preview;
    frame.tabIndex = -1;
    frame.loading = 'lazy';
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.addEventListener('load', () => entry.target.classList.add('loaded'), { once: true });
    entry.target.append(frame);
  });
}, { rootMargin: '300px' });

export function mountPreviews() {
  document.querySelectorAll('.preview[data-preview]:not([data-mounted])').forEach(tile => {
    tile.dataset.mounted = '';
    previewResize.observe(tile);
    previewLoad.observe(tile);
  });
}
