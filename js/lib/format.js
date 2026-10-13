// format.js: dates and counts as shown on the page

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatViews(n) {
  if (!n) return '';
  return `${n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n} views`;
}
