// main.js
// Page entry, loaded as a module, so it runs once the document has been parsed.
// js/head.js (fonts, analytics setup) runs earlier as a classic script in <head>.
import './site/footer.js'; // defines <site-footer> before the feeds look for its "updated" line
import { initAnalytics } from './site/analytics.js';
import { mountRoomIndex } from './site/room-index.js';
import { mountPreviews } from './site/previews.js';
import { renderFeeds } from './feeds/feeds.js';
import './sky/sky.js'; // the visitor's sky behind the page

initAnalytics();
mountRoomIndex();
mountPreviews();
renderFeeds();
