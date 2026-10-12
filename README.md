# caglarsarikaya.github.io

Personal portfolio site — static HTML/CSS/JS, deployed on GitHub Pages.


## Local Development

Serve the folder (`npx serve .`) and open the printed localhost URL. Opening `index.html` directly from disk leaves the feeds empty, because browsers block `fetch` of `data/feeds.json` on `file://`.


## Content

- **Real projects**: static cards in `index.html` (`#projects`).
- **Fun projects**: static tiles in `index.html` (`#fun`). To add one, copy an `<article class="exhibit">` block and change the URLs, name, initial and description. The live preview is picked up automatically.
- **Medium / YouTube / GitHub**: fetched by `scripts/fetch-feeds.mjs` into `data/feeds.json` (latest + popular lists).

The deploy workflow refreshes everything on push, daily at 06:00 UTC, and on manual "Run workflow".
To preview locally, serve the folder (`npx serve .`) instead of opening the file, so `data/feeds.json` can load.
