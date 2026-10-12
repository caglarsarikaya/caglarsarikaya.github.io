// components.js

// 1. Shared Head Tag Imports (Fonts & Google Analytics)
function injectGlobalHead() {
  const head = document.head;
  
  // Add font preconnects and stylesheet
  head.insertAdjacentHTML('beforeend', `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Source+Code+Pro:wght@400;600&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  `);

  // Google Analytics - must use createElement for script to execute
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-6DJCPL0T9F';
  head.appendChild(gtagScript);

  window.dataLayer = window.dataLayer || [];

  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-6DJCPL0T9F');
}

// 2. Enhanced Analytics Tracking
function initAnalytics() {
  if (typeof gtag === 'undefined') return;

  // Track scroll depth milestones
  const scrollMilestones = [25, 50, 75, 90, 100];
  const milestoneReached = new Set();

  function getScrollPercent() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
  }

  function trackScrollDepth() {
    const percent = getScrollPercent();
    scrollMilestones.forEach(milestone => {
      if (percent >= milestone && !milestoneReached.has(milestone)) {
        milestoneReached.add(milestone);
        gtag('event', 'scroll_depth', {
          'event_category': 'engagement',
          'event_label': `${milestone}%`,
          'value': milestone
        });
      }
    });
  }

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScrollDepth, 150);
  }, {
    passive: true
  });

  // Track time on page
  const pageLoadTime = Date.now();
  const timeIntervals = [30, 60, 120, 300]; // seconds
  const timeReached = new Set();

  function trackTimeOnPage() {
    const secondsOnPage = Math.floor((Date.now() - pageLoadTime) / 1000);
    timeIntervals.forEach(interval => {
      if (secondsOnPage >= interval && !timeReached.has(interval)) {
        timeReached.add(interval);
        gtag('event', 'time_on_page', {
          'event_category': 'engagement',
          'event_label': `${interval}s`,
          'value': interval
        });
      }
    });
  }

  setInterval(trackTimeOnPage, 5000);

  // Track outbound link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Track outbound links
    if (href.startsWith('http') && !href.includes(window.location.hostname)) {
      const domain = new URL(href).hostname;
      gtag('event', 'outbound_click', {
        'event_category': 'outbound',
        'event_label': domain,
        'transport_type': 'beacon'
      });
    }

    // Track email clicks
    if (href.startsWith('mailto:')) {
      gtag('event', 'contact_click', {
        'event_category': 'contact',
        'event_label': 'email'
      });
    }

    // Track project link clicks
    if (link.closest('#projects, #fun')) {
      gtag('event', 'project_click', {
        'event_category': 'projects',
        'event_label': href
      });
    }
  });

  // Track section visibility using Intersection Observer
  const sections = document.querySelectorAll('section[id]');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gtag('event', 'section_view', {
          'event_category': 'engagement',
          'event_label': entry.target.id
        });
        sectionObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  sections.forEach(section => sectionObserver.observe(section));

  // Track page exit with engagement data
  window.addEventListener('beforeunload', () => {
    const secondsOnPage = Math.floor((Date.now() - pageLoadTime) / 1000);
    const maxScroll = Math.max(...Array.from(milestoneReached), 0);
    gtag('event', 'page_exit', {
      'event_category': 'engagement',
      'event_label': `${secondsOnPage}s_${maxScroll}%`,
      'value': secondsOnPage,
      'transport_type': 'beacon'
    });
  });
}

// 3. Shared Footer Component
class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="footer-content">
          <span>&copy; ${new Date().getFullYear()} Çağlar Can Sarıkaya</span>
          <span data-feeds-updated></span>
          <span data-ambient-label></span>
          <a href="#top" onclick="window.scrollTo({ top: 0 }); return false;">Back to top &uarr;</a>
        </div>
      </footer>
    `;
  }
}
customElements.define('site-footer', SiteFooter);

// 4. Latest feeds (Medium, YouTube, GitHub) from data/feeds.json
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function link(href, text) {
  const a = el('a', '', text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener';
  return a;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

const LANG_COLORS = {
  'C#': '#178600',
  Python: '#3572A5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  Vue: '#41b883'
};

const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

function formatViews(n) {
  if (!n) return '';
  return `${n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n} views`;
}

function fillFeed(selector, items, render) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.replaceChildren(...items.map(render));
  container.classList.remove('skeleton');
}

// Feeds are { latest, popular }; older feeds.json files were a plain array
function feedLists(feed) {
  if (Array.isArray(feed)) return { latest: feed, popular: [] };
  return { latest: feed?.latest || [], popular: feed?.popular || [] };
}

function savedMode(key) {
  try {
    return localStorage.getItem(`feed-mode:${key}`);
  } catch {
    return null;
  }
}

function saveMode(key, mode) {
  try {
    localStorage.setItem(`feed-mode:${key}`, mode);
  } catch { /* storage unavailable */ }
}

// Renders a feed with a Latest / Popular toggle; the toggle stays hidden when there is no popular list.
// Starts on the visitor's last choice, else the toggle's data-default, else latest.
function fillToggledFeed(key, feed, render) {
  const lists = feedLists(feed);
  const toggle = document.querySelector(`[data-toggle="${key}"]`);
  const show = mode => {
    fillFeed(`[data-feed="${key}"]`, lists[mode], render);
    toggle?.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  };

  if (!toggle || !lists.popular.length) {
    show('latest');
    return;
  }

  toggle.hidden = false;
  toggle.addEventListener('click', e => {
    const button = e.target.closest('button[data-mode]');
    if (!button) return;
    saveMode(key, button.dataset.mode);
    show(button.dataset.mode);
  });
  const mode = savedMode(key) || toggle.dataset.default;
  show(mode === 'popular' ? 'popular' : 'latest');
}

// Live previews for project tiles: each .preview[data-preview] gets a scaled-down, non-interactive
// iframe of the site, created only when the tile comes near the viewport
const PREVIEW_WIDTH = 1280;

const previewResize = new ResizeObserver(entries => {
  entries.forEach(e => e.target.style.setProperty('--scale', e.contentRect.width / PREVIEW_WIDTH));
});

const previewLoad = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    const frame = document.createElement('iframe');
    frame.src = entry.target.dataset.preview;
    frame.tabIndex = -1;
    frame.loading = 'lazy';
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.addEventListener('load', () => entry.target.classList.add('loaded'), { once: true });
    entry.target.append(frame);
  });
}, { rootMargin: '300px' });

function mountPreviews() {
  document.querySelectorAll('.preview[data-preview]:not([data-mounted])').forEach(tile => {
    tile.dataset.mounted = '';
    previewResize.observe(tile);
    previewLoad.observe(tile);
  });
}

// Room index in the intro: one link per visible room, numbered like the CSS room counter
const ARROW_ICON = '<svg><use href="#i-arrow"/></svg>';

function mountRoomIndex() {
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

async function renderFeeds() {
  if (!document.querySelector('[data-feed]')) return;

  let data;
  try {
    const res = await fetch('data/feeds.json');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    // Feeds unavailable: drop the skeletons, the "see all" links still work
    document.querySelectorAll('[data-feed]').forEach(c => c.classList.remove('skeleton'));
    return;
  }

  fillToggledFeed('medium', data.medium, (post, i) => {
    const li = el('li');
    const a = link(post.url, '');
    a.className = 'post';
    const time = el('time', '', formatDate(post.date));
    time.dateTime = post.date;
    a.append(el('span', 'post-num', String(i + 1).padStart(2, '0')), el('span', 'post-title', post.title), time);
    li.append(a);
    return li;
  });

  fillToggledFeed('github', data.github, repo => {
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
  });

  fillToggledFeed('youtube', data.youtube, video => {
    const a = link(video.url, '');
    a.className = 'video-tile';
    const thumb = el('span', 'video-thumb');
    const img = el('img');
    img.src = video.thumbnail;
    img.alt = '';
    img.loading = 'lazy';
    const play = el('span', 'play');
    play.innerHTML = PLAY_ICON; // static markup, no feed data
    thumb.append(img, play);
    const meta = [formatViews(video.views), formatDate(video.date)].filter(Boolean).join(' · ');
    a.append(thumb, el('span', 'video-title', video.title), el('span', 'video-meta', meta));
    return a;
  });

  const updated = document.querySelector('[data-feeds-updated]');
  if (updated && data.updated) updated.textContent = `Feeds updated ${formatDate(data.updated)}`;
}

// Execute head injection when the script loads
injectGlobalHead();

// Initialize analytics and feeds after DOM is ready
function onReady() {
  initAnalytics();
  mountRoomIndex();
  mountPreviews();
  renderFeeds();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}