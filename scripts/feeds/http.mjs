// http.mjs: fetching and light XML parsing shared by the feed sources

const UA = { 'User-Agent': 'Mozilla/5.0 (caglarsarikaya.github.io feed builder)' };

export async function get(url, type = 'text') {
  const headers = { ...UA };
  // Authenticated GitHub API calls avoid the shared-runner rate limit
  if (url.startsWith('https://api.github.com') && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return type === 'json' ? res.json() : res.text();
}

export function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
}

export function attr(xml, name, attribute) {
  const m = xml.match(new RegExp(`<${name}[^>]*\\s${attribute}="([^"]*)"`));
  return m ? m[1] : '';
}

export function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
}

// Top n by a numeric field; empty when nothing has a value (no data to rank by)
export function top(items, field, n) {
  if (!items.some(i => i[field] > 0)) return [];
  return [...items].sort((a, b) => b[field] - a[field]).slice(0, n);
}
