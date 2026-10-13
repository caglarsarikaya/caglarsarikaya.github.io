// github.js: one card per GitHub repo
import { el, link } from '../lib/dom.js';

const LANG_COLORS = {
  'C#': '#178600',
  Python: '#3572A5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  Vue: '#41b883'
};

export function renderRepo(repo) {
  const a = link(repo.url, '');
  a.className = 'repo-card';
  const top = el('div', 'repo-top');
  top.append(el('span', 'repo-name', repo.name));
  if (repo.language) {
    const lang = el('span', 'repo-meta');
    const dot = el('span', 'lang-dot');
    dot.style.background = LANG_COLORS[repo.language] || '';
    lang.append(dot, repo.language);
    top.append(lang);
  }
  if (repo.stars) top.append(el('span', 'repo-meta', `★ ${repo.stars}`));
  a.append(top);
  // Always present (even empty) so every card has the same height and switching lists doesn't shift the page
  a.append(el('span', 'repo-desc', repo.description));
  return a;
}
