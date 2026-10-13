// github.mjs: recently pushed and most-starred GitHub repos
import { get, top } from './http.mjs';

const GITHUB_USER = 'caglarsarikaya';

export async function github() {
  const repos = (await get(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`, 'json'))
    .filter(r => !r.fork && !r.archived && r.name !== `${GITHUB_USER}.github.io`)
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
