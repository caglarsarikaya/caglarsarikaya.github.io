// youtube.js: one thumbnail tile per YouTube video
import { el, link } from '../lib/dom.js';
import { formatDate, formatViews } from '../lib/format.js';

const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

export function renderVideo(video) {
  const a = link(video.url, '');
  a.className = 'video-tile';
  const thumb = el('span', 'video-thumb');
  const img = el('img');
  img.src = video.thumbnail;
  img.alt = '';
  img.loading = 'lazy';
  const play = el('span', 'play');
  play.innerHTML = PLAY_ICON; // static markup, no feed data
  thumb.append(img, play);
  const meta = [formatViews(video.views), formatDate(video.date)].filter(Boolean).join(' · ');
  a.append(thumb, el('span', 'video-title', video.title), el('span', 'video-meta', meta));
  return a;
}
