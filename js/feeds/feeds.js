// feeds.js
// Latest feeds (Medium, YouTube, GitHub) from data/feeds.json, built daily by scripts/fetch-feeds.mjs
import { formatDate } from '../lib/format.js';
import { fillToggledFeed } from './toggle.js';
import { renderPost } from './medium.js';
import { renderRepo } from './github.js';
import { renderVideo } from './youtube.js';

export async function renderFeeds() {
  if (!document.querySelector('[data-feed]')) return;

  let data;
  try {
    const res = await fetch('data/feeds.json');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    // Feeds unavailable: drop the skeletons, the "see all" links still work
    document.querySelectorAll('[data-feed]').forEach(c => c.classList.remove('skeleton'));
    return;
  }

  fillToggledFeed('medium', data.medium, renderPost);
  fillToggledFeed('github', data.github, renderRepo);
  fillToggledFeed('youtube', data.youtube, renderVideo);

  const updated = document.querySelector('[data-feeds-updated]');
  if (updated && data.updated) updated.textContent = `Feeds updated ${formatDate(data.updated)}`;
}
