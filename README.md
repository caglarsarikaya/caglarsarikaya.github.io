# caglarsarikaya.github.io

This is Çağlar's personal website

## What is it?

It's a one-page portfolio. As you scroll down, you'll find:
- the games and experiments Çağlar has built
- real projects that are live and in use
- Çağlar's blog posts, code and videos

To feel real and interactive, the page reacts to where you are and the sky you have right now: sun or moon, clouds, rain. It also responds to your mouse, clicks and scrolling.

Your location comes from your time zone and internet connection. The page never asks for it.


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



