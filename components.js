// components.js

// 1. Shared Head Tag Imports (Fonts & Google Analytics)
function injectGlobalHead() {
  const head = document.head;
  
  // Add font preconnects and stylesheet
  head.insertAdjacentHTML('beforeend', `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
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
    if (href.includes('-portal') || link.closest('#projects')) {
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

// 3. Shared Header Component
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header role="banner">
        <nav aria-label="Main navigation" class="nav-centered">
          <a href="index.html#about">About</a>
          <span class="nav-divider">/</span>
          <a href="index.html#experience">Experience</a>
          <span class="nav-divider">/</span>
          <a href="index.html#projects">Projects</a>
          <span class="nav-divider">/</span>
          <a href="index.html#latest">Latest</a>
          <span class="nav-divider">/</span>
          <a href="index.html#contact">Contact</a>
        </nav>
      </header>
    `;
  }
}
customElements.define('site-header', SiteHeader);

// 4. Shared Footer Component
class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="footer-content">
          <p>&copy; 2026 Çağlar Can Sarıkaya</p>
        </div>
      </footer>
    `;
  }
}
customElements.define('site-footer', SiteFooter);

// 5. Latest feeds (Medium, YouTube, GitHub) from data/feeds.json
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

async function renderFeeds() {
  const section = document.getElementById('latest');
  if (!section) return;

  let data;
  try {
    const res = await fetch('data/feeds.json');
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return; // the "All posts / channel / repos" links still work
  }

  const medium = section.querySelector('[data-feed="medium"]');
  (data.medium || []).forEach(post => {
    const li = el('li');
    li.append(link(post.url, post.title), el('span', 'feed-meta', formatDate(post.date)));
    medium.append(li);
  });

  const youtube = section.querySelector('[data-feed="youtube"]');
  (data.youtube || []).forEach(video => {
    const a = link(video.url, '');
    const img = el('img');
    img.src = video.thumbnail;
    img.alt = video.title;
    img.loading = 'lazy';
    a.append(img, el('span', 'video-title', video.title));
    youtube.append(a);
  });

  const github = section.querySelector('[data-feed="github"]');
  (data.github || []).forEach(repo => {
    const li = el('li');
    const meta = [repo.language, repo.stars ? `★ ${repo.stars}` : ''].filter(Boolean).join(' · ');
    li.append(link(repo.url, repo.name));
    if (meta) li.append(el('span', 'feed-meta', meta));
    if (repo.description) li.append(el('span', 'feed-desc', repo.description));
    github.append(li);
  });
}

// Execute head injection when the script loads
injectGlobalHead();

// Initialize analytics and feeds after DOM is ready
function onReady() {
  initAnalytics();
  renderFeeds();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}