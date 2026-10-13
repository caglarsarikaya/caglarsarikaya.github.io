// fetch-feeds.mjs
// Runs at build time (GitHub Actions) and writes data/feeds.json.
// GitHub Pages is static and Medium/YouTube RSS block browser requests (CORS),
// so the feeds are fetched here instead. No dependencies, Node 20+.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { medium } from './feeds/medium.mjs';
import { youtube } from './feeds/youtube.mjs';
import { github } from './feeds/github.mjs';

const OUT = new URL('../data/feeds.json', import.meta.url);

let previous = {};
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch { /* first run */ }

function count(data) {
  return Array.isArray(data)
    ? `${data.length} items`
    : `${data.latest.length} latest, ${data.popular.length} popular`;
}

const sources = { medium, youtube, github };
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
