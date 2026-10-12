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
// Repos with this topic are shown as playable fun projects instead of in the repo list
const FUN_TOPIC = 'fun-project';

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

// Top n by a numeric field; empty when nothing has a value (no data to rank by)
function top(items, field, n) {
  if (!items.some(i => i[field] > 0)) return [];
  return [...items].sort((a, b) => b[field] - a[field]).slice(0, n);
}

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

async function medium() {
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

// Fetched once, shared by github() and fun()
let reposPromise;
function ownRepos() {
  reposPromise ??= get(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`, 'json')
    .then(repos => repos.filter(r => !r.fork && !r.archived && r.name !== `${GITHUB_USER}.github.io`));
  return reposPromise;
}

const isFun = r => (r.topics || []).includes(FUN_TOPIC);

async function github() {
  const repos = (await ownRepos())
    .filter(r => !isFun(r))
    .map(r => ({
      name: r.name,
      url: r.html_url,
      description: r.description || '',
      language: r.language || '',
      stars: r.stargazers_count,
      pushed: r.pushed_at
    }));
  // API returns them most recently pushed first
  return { latest: repos.slice(0, 5), popular: top(repos, 'stars', 5) };
}

async function fun() {
  return (await ownRepos())
    .filter(r => isFun(r) && (r.homepage || r.has_pages))
    .map(r => ({
      name: r.name,
      url: r.homepage || `https://${GITHUB_USER}.github.io/${r.name}/`,
      repo: r.html_url,
      description: r.description || '',
      language: r.language || '',
      topics: (r.topics || []).filter(t => t !== FUN_TOPIC),
      pushed: r.pushed_at
    }));
}

let previous = {};
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch { /* first run */ }

function count(data) {
  return Array.isArray(data)
    ? `${data.length} items`
    : `${data.latest.length} latest, ${data.popular.length} popular`;
}

const sources = { medium, youtube, github, fun };
const result = { updated: new Date().toISOString() };

for (const [key, fn] of Object.entries(sources)) {
  try {
    result[key] = await fn();
    console.log(`${key}: ${count(result[key])}`);
  } catch (err) {
    // Keep last known data so one failing source never breaks the build
    result[key] = previous[key] || [];
    console.warn(`${key}: failed (${err.message}), kept previous (${count(result[key])})`);
  }
}

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify(result, null, 2) + '\n');
