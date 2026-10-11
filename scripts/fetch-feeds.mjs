// fetch-feeds.mjs
// Runs at build time (GitHub Actions) and writes data/feeds.json.
// GitHub Pages is static and Medium/YouTube RSS block browser requests (CORS),
// so the feeds are fetched here instead. No dependencies, Node 20+.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const OUT = new URL('../data/feeds.json', import.meta.url);
const MEDIUM_FEED = 'https://medium.com/feed/@caglarcansarikaya';
const YOUTUBE_HANDLE = 'https://www.youtube.com/@caglarcansarikaya';
const YOUTUBE_CHANNEL_ID = 'UCMWjbVnHmh2kKnqNYTYkj8Q'; // if empty, resolved from the handle page
// Videos to keep off the site (personal / not portfolio material)
const YOUTUBE_HIDDEN = ['ajCpDP_ZVPQ'];
const GITHUB_USER = 'caglarsarikaya';

const UA = { 'User-Agent': 'Mozilla/5.0 (caglarsarikaya.github.io feed builder)' };

async function get(url, type = 'text') {
  const headers = { ...UA };
  // Authenticated GitHub API calls avoid the shared-runner rate limit
  if (url.startsWith('https://api.github.com') && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return type === 'json' ? res.json() : res.text();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
}

function attr(xml, name, attribute) {
  const m = xml.match(new RegExp(`<${name}[^>]*\\s${attribute}="([^"]*)"`));
  return m ? m[1] : '';
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
}

async function medium() {
  const xml = await get(MEDIUM_FEED);
  const items = xml.split('<item>').slice(1);
  return items.slice(0, 5).map(item => ({
    title: decode(tag(item, 'title')),
    url: tag(item, 'link').split('?')[0],
    date: new Date(tag(item, 'pubDate')).toISOString().slice(0, 10)
  }));
}

async function youtube() {
  let id = YOUTUBE_CHANNEL_ID;
  if (!id) {
    const html = await get(YOUTUBE_HANDLE);
    const m = html.match(/"externalId":"(UC[\w-]{22})"/) || html.match(/channel\/(UC[\w-]{22})/);
    if (!m) throw new Error('YouTube channel id not found');
    id = m[1];
  }
  const xml = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  const entries = xml.split('<entry>').slice(1);
  return entries
    .map(entry => ({ entry, videoId: tag(entry, 'yt:videoId') }))
    .filter(({ videoId }) => !YOUTUBE_HIDDEN.includes(videoId))
    .slice(0, 4)
    .map(({ entry, videoId }) => ({
      title: decode(tag(entry, 'title')),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      views: Number(attr(entry, 'media:statistics', 'views')) || 0,
      date: tag(entry, 'published').slice(0, 10)
    }));
}

async function github() {
  const repos = await get(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`, 'json');
  return repos
    .filter(r => !r.fork && !r.archived && r.name !== `${GITHUB_USER}.github.io`)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      url: r.html_url,
      description: r.description || '',
      language: r.language || '',
      stars: r.stargazers_count
    }));
}

let previous = {};
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch { /* first run */ }

const sources = { medium, youtube, github };
const result = { updated: new Date().toISOString() };

for (const [key, fn] of Object.entries(sources)) {
  try {
    result[key] = await fn();
    console.log(`${key}: ${result[key].length} items`);
  } catch (err) {
    // Keep last known data so one failing source never breaks the build
    result[key] = previous[key] || [];
    console.warn(`${key}: failed (${err.message}), kept ${result[key].length} previous items`);
  }
}

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify(result, null, 2) + '\n');
