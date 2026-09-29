# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` (or `npm start`) — start the Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built `dist/` locally

There is no test runner, linter, or type checker configured.

## Architecture

A single-page React 18 + Vite portfolio site with no backend. It's a **plain, readable scrolling page**: a hero plus About / Skills / Projects / Experience / Contact sections rendered from the portfolio data. A path route (`/admin`) exposes an admin panel that edits that data. (The site was previously an interactive terminal shell; that was removed in favor of a simple sectioned layout.)

### Data is the source of truth — `src/data/portfolio.js`

`DEFAULT_PORTFOLIO` holds all content (`profile`, `skills`, `projects`, `companies`, `contact`). `loadPortfolio()` merges any localStorage overrides on top; `savePortfolio()` / `resetPortfolio()` write them and dispatch a `portfolio:change` event. **This is the only place to change content** — every section and the admin panel read from here. There is no server: the admin panel persists to localStorage, and Export produces a `portfolio.json` you can paste back into `DEFAULT_PORTFOLIO` to make edits permanent across browsers.

### Rendering & routing

- **`src/App.jsx`** — the whole public site. `usePathRoute()` renders `AdminGate`/`Admin` when the path is `/admin`, otherwise the page. `usePortfolio()` reads `loadPortfolio()` and re-reads on `portfolio:change`/`storage` so admin edits reflect live. Section components (`Hero`, `About`, `Skills`, `Projects`, `Experience`, `Contact`) are defined in this file and read straight from the data; the shared `Section` wrapper renders the eyebrow + title. The hero's "Download résumé" button calls `downloadResume(p)`.
- **`src/lib/resume.js`** — dependency-free PDF résumé generator built from the portfolio data (`downloadResume(portfolio)` streams a real `application/pdf` download, fully offline).
- **`src/components/Nav/Nav.jsx`** — sticky top bar: brand, in-page anchor links to each section, and the theme toggle. Gains a blurred backdrop once scrolled.
- **`src/components/Admin/Admin.jsx`** — form UI over the whole data model with Save / Reset / Export / Import. Skills are stored as `{ Group: [{name, level}] }` but edited as an ordered array (`skillsToForm`/`formToSkills`) so groups can be renamed and reordered.

Styling is **CSS Modules** (`*.module.css` co-located with each component; page styles in `src/App.module.css`) plus global tokens in `src/styles/globals.css`. Fonts: Chakra Petch (display headings) and JetBrains Mono (body/UI).
