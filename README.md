# caglarsarikaya.github.io

Personal portfolio site — static HTML/CSS/JS, deployed on GitHub Pages.


## Local Development

Serve the folder (`npx serve .`) and open the printed localhost URL. Opening `index.html` directly from disk leaves the feeds empty, because browsers block `fetch` of `data/feeds.json` on `file://`.


## Structure

- `css/`: one stylesheet per page part (`base`, `stage`, `intro`, `rooms`, `exhibits`, `feeds`, `footer`), loaded in that order. Each file holds its own responsive rules.
- `js/head.js`: fonts and Google Analytics, loaded early as a classic script.
- `js/main.js`: the ES module entry point.
  - `js/site/`: analytics, footer, room index, live previews.
  - `js/feeds/`: renders `data/feeds.json` (one renderer per source, plus the Latest / Popular toggle).
  - `js/sky/`: the visitor's sky behind the page. `sky.js` wires the parts together (location, clock, astronomy, palette, weather, shader, layout, visitor, chip, loop).
  - `js/lib/`: shared DOM, format and storage helpers.
- `assets/logo/`: logo (SVG + PNG), favicon and Apple touch icon. `assets/images/`: the social share image.
- `scripts/fetch-feeds.mjs`: the build-time feed fetcher, with one module per source in `scripts/feeds/`.


## Content

- **Real projects**: static cards in `index.html` (`#projects`).
- **Fun projects**: static tiles in `index.html` (`#fun`). To add one, copy an `<article class="exhibit">` block and change the URLs, name, initial and description. The live preview is picked up automatically.
- **Medium / YouTube / GitHub**: fetched by `scripts/fetch-feeds.mjs` into `data/feeds.json` (latest + popular lists).

The deploy workflow refreshes everything on push, daily at 06:00 UTC, and on manual "Run workflow".
To preview locally, serve the folder (`npx serve .`) instead of opening the file, so `data/feeds.json` can load.
