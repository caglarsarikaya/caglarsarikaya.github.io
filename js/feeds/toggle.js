// toggle.js: fills a feed list, with a Latest / Popular switch when there is a popular list
import { load, save } from '../lib/storage.js';

function fillFeed(selector, items, render) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.replaceChildren(...items.map(render));
  container.classList.remove('skeleton');
}

// Feeds are { latest, popular }; older feeds.json files were a plain array
function feedLists(feed) {
  if (Array.isArray(feed)) return { latest: feed, popular: [] };
  return { latest: feed?.latest || [], popular: feed?.popular || [] };
}

// Renders a feed with a Latest / Popular toggle; the toggle stays hidden when there is no popular list.
// Starts on the visitor's last choice, else the toggle's data-default, else latest.
export function fillToggledFeed(key, feed, render) {
  const lists = feedLists(feed);
  const toggle = document.querySelector(`[data-toggle="${key}"]`);
  const show = mode => {
    fillFeed(`[data-feed="${key}"]`, lists[mode], render);
    toggle?.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  };

  if (!toggle || !lists.popular.length) {
    show('latest');
    return;
  }

  toggle.hidden = false;
  toggle.addEventListener('click', e => {
    const button = e.target.closest('button[data-mode]');
    if (!button) return;
    save('local', `feed-mode:${key}`, button.dataset.mode);
    show(button.dataset.mode);
  });
  const mode = load('local', `feed-mode:${key}`) || toggle.dataset.default;
  show(mode === 'popular' ? 'popular' : 'latest');
}
