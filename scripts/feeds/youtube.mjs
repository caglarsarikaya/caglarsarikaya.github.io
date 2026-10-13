// youtube.mjs: latest and most-viewed YouTube videos
import { get, tag, attr, decode, top } from './http.mjs';

const YOUTUBE_HANDLE = 'https://www.youtube.com/@caglarcansarikaya';
const YOUTUBE_CHANNEL_ID = 'UCMWjbVnHmh2kKnqNYTYkj8Q'; // if empty, resolved from the handle page
// Videos to keep off the site (personal / not portfolio material)
const YOUTUBE_HIDDEN = ['ajCpDP_ZVPQ'];

export async function youtube() {
  let id = YOUTUBE_CHANNEL_ID;
  if (!id) {
    const html = await get(YOUTUBE_HANDLE);
    const m = html.match(/"externalId":"(UC[\w-]{22})"/) || html.match(/channel\/(UC[\w-]{22})/);
    if (!m) throw new Error('YouTube channel id not found');
    id = m[1];
  }
  const xml = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  const entries = xml.split('<entry>').slice(1);
  const videos = entries
    .map(entry => ({ entry, videoId: tag(entry, 'yt:videoId') }))
    .filter(({ videoId }) => !YOUTUBE_HIDDEN.includes(videoId))
    .map(({ entry, videoId }) => ({
      title: decode(tag(entry, 'title')),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      views: Number(attr(entry, 'media:statistics', 'views')) || 0,
      date: tag(entry, 'published').slice(0, 10)
    }));
  return { latest: videos.slice(0, 4), popular: top(videos, 'views', 4) };
}
