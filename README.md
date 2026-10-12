# caglarsarikaya.github.io

Personal portfolio site — static HTML/CSS/JS, deployed on GitHub Pages.


## Local Development

Just open `index.html` in your browser. No build tools required.


## Content

- **Real projects**: static cards in `index.html` (`#projects`).
- **Fun projects**: any of my repos with the GitHub topic `fun-project`. The card links to the repo's homepage URL, or to `https://caglarsarikaya.github.io/<repo>/` if GitHub Pages is on. The repo description is used as the card text.
- **Medium / YouTube / GitHub**: fetched by `scripts/fetch-feeds.mjs` into `data/feeds.json` (latest + popular lists).

The deploy workflow refreshes everything on push, daily at 06:00 UTC, and on manual "Run workflow".
To preview locally, serve the folder (`npx serve .`) instead of opening the file, so `data/feeds.json` can load.
