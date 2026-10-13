// room-index.js
// Room index in the intro: one link per visible room, numbered like the CSS room counter
import { el } from '../lib/dom.js';

const ARROW_ICON = '<svg><use href="#i-arrow"/></svg>';

export function mountRoomIndex() {
  const list = document.querySelector('[data-room-index]');
  if (!list) return;
  const rooms = [...document.querySelectorAll('.room[id]')].filter(room => !room.closest('[hidden]'));
  list.replaceChildren(...rooms.map((room, i) => {
    const li = el('li');
    const a = el('a');
    a.href = `#${room.id}`;
    a.append(
      el('span', 'post-num', String(i + 1).padStart(2, '0')),
      el('span', 'room-index-title', room.querySelector('.eyebrow')?.textContent.trim() || room.id)
    );
    a.insertAdjacentHTML('beforeend', ARROW_ICON); // static markup
    li.append(a);
    return li;
  }));
}
