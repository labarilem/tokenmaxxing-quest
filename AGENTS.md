# Tokenmaxxing Quest

A satirical incremental browser game built with plain HTML, CSS, and vanilla JavaScript (ES modules). No build step, no game engine, no backend. Deployed as static files to GitHub Pages via `.github/workflows/deploy-pages.yml`.

See `README.md` for gameplay/deploy details and `docs/DESIGN.md` for architecture.

## Cursor Cloud specific instructions

- This project has **no runtime dependencies and no build step**. There is nothing to install; `python3` (3.12) and `node` (22) are preinstalled and sufficient.
- ES modules require serving over HTTP — opening `index.html` via `file://` will fail with CORS/module errors. Run a static server from the repo root:
  - `python3 -m http.server 8080` (then open `http://localhost:8080`), or `npx serve .`.
- **Tests:** run `node --test` (or `npm test`). Node's built-in runner is used — no test framework is installed, so do not add one. `package.json` sets `"type": "module"`, which is why `.js` files run as ESM under Node; this is invisible to the browser.
- The core logic is intentionally DOM-free and dependency-injected so it is testable without a browser: `Game` (engine, `js/game.js`) takes a `Clock` (`js/clock.js`) and a `KeyValueStore` (`js/storage.js`). In tests use `ManualClock` (advance time instantly, no real waiting) and `MemoryStorage`. Keep `Date.now()`/`localStorage` out of engine code — only `main.js` (the composition root) wires the real `SystemClock` + `LocalStorageAdapter`.
- There is still no linter configured. UI/gameplay changes should also be verified in a browser (Send Prompt increments tokens; buying a Background Agent adds +1 token/sec passive income).
- Game progress is stored in `localStorage` under the key `tokenmaxxing-quest.save`. To test from a clean slate, clear that key (or use a fresh browser profile) — otherwise a prior save will load on start. **Alpha:** the save format has no version field and may change without notice.
- The tick loop pauses when the tab is hidden or the window loses focus (`visibilitychange`, `blur`), so passive token income only advances while the game tab is visible and focused. There is no offline catch-up.
