// medium.mjs: latest and most-clapped Medium posts
import { get, tag, decode, top } from './http.mjs';

const MEDIUM_FEED = 'https://medium.com/feed/@caglarcansarikaya';

// Medium's RSS has no clap counts; the post JSON does, but Medium often blocks it (403)
async function claps(url) {
  try {
    const text = await get(`${url}?format=json`);
    const json = JSON.parse(text.slice(text.indexOf('{')));
    return json.payload?.value?.virtuals?.totalClapCount || 0;
  } catch {
    return 0;
  }
}

export async function medium() {
  const xml = await get(MEDIUM_FEED);
  const items = xml.split('<item>').slice(1);
  const posts = items.map(item => ({
    title: decode(tag(item, 'title')),
    url: tag(item, 'link').split('?')[0],
    date: new Date(tag(item, 'pubDate')).toISOString().slice(0, 10)
  }));
  for (const post of posts) post.claps = await claps(post.url);
  return { latest: posts.slice(0, 5), popular: top(posts, 'claps', 5) };
}
