# Tokenmaxxing Quest

A satirical incremental browser game built with plain HTML, CSS, and vanilla JavaScript (ES modules). No build step, no game engine, no backend. Deployed as static files to GitHub Pages via `.github/workflows/deploy-pages.yml`.

See `README.md` for gameplay/deploy details and `docs/DESIGN.md` for architecture.

## Cursor Cloud specific instructions

- This project has **no dependencies, no build step, and no test suite**. There is nothing to install; `python3` (3.12) and `node` (22) are preinstalled and sufficient.
- ES modules require serving over HTTP — opening `index.html` via `file://` will fail with CORS/module errors. Run a static server from the repo root:
  - `python3 -m http.server 8080` (then open `http://localhost:8080`), or `npx serve .`.
- There is no linter or automated test configured. "Testing" means loading the served page in a browser and exercising gameplay (Send Prompt increments tokens; buying a Background Agent adds +1 token/sec passive income).
- Game progress is stored in `localStorage` under the key `tokenmaxxing-quest.save.v1`. To test from a clean slate, clear that key (or use a fresh browser profile) — otherwise a prior save (including up to 8h of offline token gains) will load on start.
- The tick loop pauses when the tab is hidden (`visibilitychange`), so passive token income only advances while the tab is focused/visible.
