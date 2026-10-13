// medium.js: one numbered row per Medium post
import { el, link } from '../lib/dom.js';
import { formatDate } from '../lib/format.js';

export function renderPost(post, i) {
  const li = el('li');
  const a = link(post.url, '');
  a.className = 'post';
  const time = el('time', '', formatDate(post.date));
  time.dateTime = post.date;
  a.append(el('span', 'post-num', String(i + 1).padStart(2, '0')), el('span', 'post-title', post.title), time);
  li.append(a);
  return li;
}
