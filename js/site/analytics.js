// analytics.js: engagement events sent to Google Analytics (gtag is set up by js/head.js)

export function initAnalytics() {
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
    // Every milestone sent: nothing left to time
    if (timeReached.size === timeIntervals.length) clearInterval(timeTimer);
  }

  const timeTimer = setInterval(trackTimeOnPage, 5000);

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
