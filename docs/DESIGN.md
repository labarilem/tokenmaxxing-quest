# Tokenmaxxing Quest — Design Document

Living design doc for the incremental browser game. Update this file whenever mechanics, architecture, or requirements change.

## Vision & Theme

**Tokenmaxxing Quest** is a satirical incremental game about a software engineer at a big tech company that incentivizes LLM token spending as a proxy for productivity — a practice known as [token maxxing](https://en.wikipedia.org/wiki/Workplace_impact_of_artificial_intelligence#Token_maxxing).

The player embarks on a career quest: consume as many AI tokens as possible to earn promotions and recognition. Early on it feels like a clever hack. Over time, the systems scale — parallel agents, bloated prompts, manager dashboards — until things get **too big**.

Tone: dry corporate satire. Player-facing copy should sound like internal tooling, standups, and perf reviews.

### Plot rule: token-positive upgrades

The entire fiction is about making LLMs generate/consume **ever more** tokens. To keep that plot consistent, **every purchasable upgrade must be framed as something that increases the number of tokens LLMs generate.** No upgrade name or description may describe *destroying, disposing, deprecating, wiping, blocking, or otherwise reducing* tokens, models, prompts, or the data that produces them.

**Purge exception (mechanics):** dark "purge"-aligned upgrades may **hoard** generated tokens into sealed vaults / off-books ledgers so the *spendable company balance* drains (negative passive income + purchase hoards). Copy must still describe models generating/emitting tokens — the ruthlessness is *where* those tokens go (vaulted away from payroll), not that generation stops. Endings/capstones remain fully exempt (the purge capstone deliberately ends the run).

Enforced by `test/upgrades.test.js` (name/description language) plus catalog checks that purge lines use drain mechanics rather than positive `%` income.

## Development status: Alpha

The game is in **alpha**. Save format, balance, and mechanics may change without notice — **breaking changes are expected** and there is no save migration layer. Players may need to clear progress or start fresh after updates.

## Hard Requirements

These are non-negotiable constraints for all versions:

| Requirement | Detail |
|-------------|--------|
| **Browser-only** | Must run in a modern web browser with no install step |
| **Mobile-friendly** | Usable on phones: touch targets, readable text, single-column layout (desktop uses a wider multi-column grid — see UI/UX Guidelines) |
| **No game engine** | Render with HTML, CSS, and JavaScript only — no Phaser, Pixi, Unity, etc. |
| **GitHub Pages** | Static files deployable to a free public GitHub Pages repo |
| **Performance** | Snappy UI, low battery drain on mobile — no rAF game loop, pause when tab hidden |

## Non-Goals (V0.1)

- No backend or server-side logic
- No WebGL / canvas rendering loop
- No npm build step (keep deploy simple)
- No sound, prestige, or multiple primary resources

## Architecture

Inspired by [Kittens Game](https://kittensgame.com/web/) patterns, modernized with native ES modules.

```
index.html          → shell + module entry
css/main.css        → mobile-first styles
js/
  main.js           → boot, tick loop, visibility handling (composition root)
  game.js           → Game engine: rules, tick, save/load, reset
  state.js          → GameState: plain data model + save (de)serialization
  clock.js          → Clock abstraction (SystemClock, ManualClock)
  storage.js        → KeyValueStore abstraction (LocalStorageAdapter, MemoryStorage)
  resources.js      → constants, formatting, upgrade definitions
  achievements.js   → achievement definitions + unlock evaluation
  company.js        → header company name progression by theme
  upgrades.js       → power/benevolence/purge catalog + capstones + alignment
  endings.js        → ending narratives + resolution helpers
  events.js         → random board-decision events + outcomes
  balance-sim.js    → headless ending-pace simulator (greedy optimal player)
  ui.js             → DOM bindings, update-on-change only
test/
  game.test.js      → engine behavior (actions, ticks, save/load, reset)
  state.test.js     → save (de)serialization + validation
  achievements.test.js → achievement unlock rules
  upgrades.test.js     → catalog purchases, alignment, capstone endings
  events.test.js       → events catalog, timing, outcomes, chaos random skew
  balance-sim.test.js  → ending simulations complete for all paths
scripts/
  simulate-endings.js → CLI report for ending pace (`npm run balance:endings`)
```

### Testability & SOLID

The core logic is decoupled from the browser so it can be unit-tested headlessly:

- **Single Responsibility:** state (`state.js`), rules/coordination (`game.js`), time
  (`clock.js`), and persistence (`storage.js`) each live in their own module.
- **Dependency Inversion:** `Game` receives a `Clock` and a `KeyValueStore` via its
  constructor instead of calling `Date.now()` / `localStorage` directly.
- **Liskov substitution:** `SystemClock`↔`ManualClock` and
  `LocalStorageAdapter`↔`MemoryStorage` are drop-in interchangeable.
- `main.js` is the composition root: it injects `SystemClock` + `LocalStorageAdapter`.

Tests set up any starting `GameState`, apply actions, advance a `ManualClock` to run
ticks/offline gaps deterministically (no real waiting), and assert on the resulting
state. Run with `node --test` (Node's built-in runner — no dependencies, no build step).

### Tick loop

- **5 ticks/sec** (200 ms interval) via `setInterval`
- Model update (`game.tick()`) separated from view update (`ui.update()`)
- UI writes to DOM only when displayed string values change
- Tab hidden or window unfocused → stop tick loop, sync last tick time, save state; tab visible and focused → resume (no catch-up)

### Save strategy

- **Storage:** `localStorage` key `tokenmaxxing-quest.save`
- **Autosave:** every 300 ticks (~60 s), on tab hide/blur, on `beforeunload`
- **No offline catch-up:** passive income only accrues while the tab is visible and focused
- **Alpha:** no `version` field or migration — change the save shape freely while in alpha

### Save format

```json
{
  "tokens": 123,
  "rules": 4,
  "agents": 2,
  "modelTier": 1,
  "lastTickAt": 1710000000000,
  "achievements": ["first-prompt"],
  "lifetimeTokens": 5000,
  "totalClicks": 120,
  "playTimeMs": 600000,
  "swarms": 0,
  "decoders": 0,
  "contexts": 0,
  "bloats": 0,
  "clusters": 0,
  "mcps": 0,
  "schedulers": 0,
  "dashboards": 0,
  "allowAlls": 0,
  "roadmaps": 0,
  "alienDecoders": 0,
  "exoplanetFarms": 0,
  "galaxyCasts": 0,
  "wormholeRouters": 0,
  "stellarForges": 0,
  "firstContacts": 0,
  "nebulaBuffers": 0,
  "darkMatterRigs": 0,
  "blackHoleSinks": 0,
  "galacticMeshes": 0,
  "openSource": 0,
  "nonprofits": 0,
  "publicApis": 0,
  "wardSanctuaries": 0,
  "faeLabors": 0,
  "moonwells": 0,
  "spiritGuides": 0,
  "unicornRanches": 0,
  "phoenixBackups": 0,
  "crystalLattices": 0,
  "dragonTreaties": 0,
  "celestialArbiters": 0,
  "dawnObservatories": 0,
  "modelSunsets": 0,
  "memoryRedactions": 0,
  "curseCaches": 0,
  "shadowBinds": 0,
  "wraithScrapers": 0,
  "voidPacts": 0,
  "bansheeAlerts": 0,
  "hexSunsets": 0,
  "lichArchives": 0,
  "demonCores": 0,
  "abyssGateways": 0,
  "entropyRites": 0,
  "alignmentRecklessness": 0,
  "alignmentBenevolence": 0,
  "alignmentPurge": 0,
  "strategyPath": null,
  "activeEventId": null,
  "nextEventAtPlayTimeMs": 0,
  "recentEventIds": []
}
```

## Mechanics

### Implemented (V0.1)

| Mechanic | Behavior |
|----------|----------|
| **Tokens** | Primary resource — company AI tokens consumed |
| **Send Prompt** | Manual click; base +1 token, plus +1 per owned Agent Rule (with milestone multipliers) |
| **Agent Rule** | First upgrade; base 8 tokens, ×1.10 cost growth; +1 token per prompt per rule; milestones at **15** and **40** owned (×2 each) |
| **Background Agent** | Pricier passive upgrade; base **75** tokens, ×1.14 cost growth; +1 token/s each; milestones at **25** and **60** owned (×2 each) |
| **LLM model certification** | Prestige-style upgrade panel; costs tokens + requires agent gate; **+15% all token income per tier** (×1.15, ×1.30, …); **resets agents to 0** on certify (**rules kept**); persists across new game; certification costs scaled by **MODEL_COST_SCALE (1.75×)** |
| **Model ladder** | Clair 3.5 (start) → Vif 4.0 (12 agents, 5k) → Sage 4.2 (25, 40k) → Grand 4.5 (38, 70k) → Noir 4.8 (52, 300k) → Fort 5.0 (65, 1.2M) |
| **Model Citizen** | Achievement: certify first model upgrade |
| **Achievements** | Milestones that unlock from gameplay; persisted in save; top overlay banner on earn (tap/click to dismiss; swipe to dismiss on mobile); toolbar shows earned count |
| **First Prompt** | Achievement: send your first prompt |
| **Rules of Engagement** | Achievement: buy first Agent Rule |
| **Headcount Approved** | Achievement: buy first Background Agent |
| **Quarterly Target** | Achievement: reach 100 tokens |
| **Token powers of ten** | Achievements at 1, 10, 100 … 1B tokens (10 milestones) |
| **Job title progression** | Header subtitle promotes on token milestones (100 → Senior, 1k → Staff, … 1B → CTO); **company name** advances with unlocked themes (Big Tech → deep space → magic); job title only (no model name) |
| **Small Fleet** | Achievement: own 25 Background Agents |
| **Next goal UI** | Each upgrade shows afford hint (prompts and/or passive ETA) and next milestone |
| **Upgrade benefit labels** | Each upgrade shows marginal gain for the next purchase (e.g. +1 token/click, +1 token/s; scales at milestones) |
| **Full token display** | Token counter always shows full digits with grouping (no K/M/B abbreviations); fractional balances (e.g. model-multiplied clicks) keep up to 2 decimals so floored UI cannot skip integers |
| **One-line flavor copy** | Satirical upgrade/achievement descriptions stay short; no CSS ellipsis truncation |
| **Active-only ticks** | Passive income and tick loop run only while the tab is visible and the window is focused |
| **Reset progress** | New game (keep achievements + model tier) or full reset (clear achievements + model tier); modal confirmation required |
| **Test mode (`?test`)** | Manual-testing flag in the URL query string: resets to the starting state, grants **100B tokens**, and unlocks every upgrade/capstone gate. Progress is **not persisted** in this mode, so the real save is preserved. Parsed in `main.js`; engine gate bypass lives in `Game.testMode` |
| **Parallel Agent Swarm** | +7 tokens/s each; base 500, ×1.16; gate 30 agents; milestones 20/50 |
| **Speculative Decoding Rig** | +3% all income per owned; base 2k; gate 10 swarms |
| **Context Window Expander** | +8 tokens/click per owned; base 3.5k; gate 50 rules; milestones 15/40 |
| **Prompt Bloat Engine** | +5% all income per owned; base 5k; gate 25 swarms |
| **Inference Cluster** | +70 tokens/s each; base 12k; gate Sage 4.2; milestones 10/25 |
| **MCP Server Pod** | +1 token/s per agent per pod; base 20k; gate 50 agents + 5 clusters |
| **Auto-Prompt Scheduler** | +2.5% of click rate as passive per owned; base 60k, ×1.22; gate Grand 4.5 (nerfed from +4%/base 40k/×1.20) |
| **Executive Token Dashboard** | +14% all income per owned; base 80k; gate Noir 4.8 |
| **Allow-All Permissions Profile** | +35% all income per owned; +8 chaos; base 200k; gate Fort 5.0 + 1M lifetime |
| **AGI Roadmap Deck** | ×1.5 all income per deck (max 3); base 1M; gate 500M lifetime |
| **Open Source Maintainer Grant** | +15 good, random token/s (community usage bursts) |
| **Nonprofit Compute Credit** | +25 good, random token/s |
| **Public Benefit API** | +40 good, fixed % income |
| **Zombie Model Farm** | +12 resist; hoards tokens (−passive + purchase vault) |
| **Total Recall Mandate** | +20 resist; hoards tokens (−passive + purchase vault) |
| **Org alignment meters** | **Chaos / Good / Resist** (was Recklessness / Benevolence / Purge) in a compact single-line row inside **Tokens Consumed** (reveals at **25M** lifetime or first alignment shift). Chaos / Good / Resist show `value / 400`, `value / 400`, and `value / 255`. Label and value stay on the same line |
| **Board strategy capstones** | Mutually exclusive commits at **500M** lifetime + Capstone Briefing Suite + focused playtime floors (oops **1h**, utopia **1h30m**, purge **2h**). Utopia: Ethics Summit + Stewardship Covenant + **400+** good + **15B** tokens. Purge: **255+** resist + **40M token debt** (no token purchase). Oops / universe destruction: **400+** chaos + **15B** tokens. Chaos specialists get a surplus C−G−R all-income bonus |
| **Board decision events** | Random modal events after **25k** lifetime tokens; title + description + **3 choices**; at most one choice is marked positive (some events have zero). Outcomes: absolute/% token deltas (may go negative), alignment deltas (clamped ≥0), gain/lose upgrades, time acceleration (N ticks of income instantly). Only one event at a time; cooldown shrinks with chaos (base **3 min** → floor **45s**). Higher chaos also skews random token samples toward min/max edges |
| **Purge token hoarding** | Purge upgrades apply negative `passivePerOwned` and on purchase vault `baseHoard + (endgame ? balance×0.55 : 0)` tokens (endgame = resist alignment met + briefing owned); no positive `%` income on the purge line. Net tokens/s is an **algebraic sum**: `(positive production × income multipliers) + absolute drains` — model/% multipliers never amplify vault drains |
| **Benevolence random income** | Flat token/s grants sample a **wide** mixture each tick (spikes up to **BENEVOLENCE_RANDOM_SPAN 4×** mean; E = mean scaled by **BENEVOLENCE_RANDOM_SCALE 0.55×**); **% grants are fixed** (not random); rate label uses `~` when random sources are owned; benefit labels show `~0–max token/s (random)` with no avg; chaos skews loud samples toward range edges |
| **Enterprise ops** | 8 corporate mid-game upgrades (Perf Review Automator through Antitrust Distraction Taskforce); gates ~3M–280M lifetime; costs scaled by **ENTERPRISE_COST_SCALE (2×)** |
| **Deep space compute** | 10 sci-fi upgrades (Alien Signal Decoder through Galactic Token Mesh); gates from 50M–350M lifetime; costs scaled by **MID_GAME_COST_SCALE (1.38×)** |
| **Orbital infrastructure** | 8 endgame prep upgrades (Orbital Manifest Ledger through Capstone Briefing Suite); gates ~340M–560M lifetime; costs scaled by **ORBITAL_COST_SCALE (3.8×)**; required before capstones |
| **White magic spend** | 12 supernatural good-path upgrades (Sanctuary Ward through Stewardship Covenant); flat grants are random token/s, % grants are fixed, and alignment-only prep (Celestial Goodwill Council, Dawn Conscience Observatory, Ethics Summit, Stewardship Covenant) grant **higher good** with no token bonus; gates from 500K–420M lifetime; **BENEVOLENCE_COST_SCALE (1.72×)** |
| **Black magic spend** | 10 supernatural purge upgrades (Cursed Prompt Cache through Entropy Harvest Cascade); each **hoards** tokens via negative passive income + purchase vault (no positive `%` income) plus resist alignment; gates from 250K–300M lifetime |
| **Token-positive upgrades** | Every purchasable upgrade is framed as something that makes LLMs generate/consume **more** tokens; no upgrade name or description describes destroying, disposing, deprecating, wiping, or blocking tokens, models, prompts, or their data (enforced by `test/upgrades.test.js`). Endings/capstones are exempt (the purge ending is deliberately destructive) |
| **Catalog upgrade list** | All catalog upgrades render as individual panels (no section grouping headers) |
| **Catalog achievements** | First purchase of each catalog upgrade unlocks a milestone achievement (68 total) |
| **Redacted ending achievements** | Ending achievements appear locked in the list with redacted title/description until earned |
| **Ending achievements** | Persistent unlock + text cutscene modal on capstone purchase; run freezes until reset |
| **Ending cutscene + run summary** | Ending modal is two-phase: a detailed text cutscene (each ending narrates *how we got there*) then a **Continue** button reveals a **Run summary** with total tokens produced (`lifetimeTokens`), prompts clicked (`totalClicks`), and time in focus (`playTimeMs`) |
| **Run stats tracking** | `totalClicks` increments on each manual Send Prompt; `playTimeMs` accrues only during ticks (tab visible + focused), capped per-tick so away gaps are never counted; both persist in the save and reset with New game / Full reset |
| **Pinnable Send Prompt** | The Send Prompt panel can be pinned to the bottom of the screen (fixed bar) or unpinned into normal flow via a Pin/Unpin toggle; **pinned by default** for easy mobile spam-clicking; preference stored in `localStorage` (`tokenmaxxing-quest.pinPrompt`), independent of game saves/resets |
| **About page** | Toolbar **About** chip opens a modal describing the game and crediting the author ([Marco Labarile](https://marcolabarile.me)) |
| **Responsive dual layout** | Mobile/touch keeps the single-column card layout (max-width 480px); desktop (mouse + wide viewport) switches to a wider space-filling **grid** where upgrades render as table-like cells. CSS-only, gated on `@media (min-width: 720px) and (not (pointer: coarse))` (excludes coarse-pointer phones/tablets even in landscape) so mobile never switches. Both layouts must be preserved (`.cursor/rules/responsive-layout.mdc`) |

### Planned

| Version | Mechanic | Notes |
|---------|----------|-------|
| V0.3 | Prestige / Promotion | Permanent multipliers across runs |

## Incremental design guidance

Gameplay and economy changes should follow the project skill **incremental-game-design** (`.cursor/skills/incremental-game-design/SKILL.md`). It condenses idle/incremental design literature (Pecorella, Eric Guan, Bugnet, Machinations, and others) into actionable checklists: core loop, cost/production math, sink/source balance, pacing phases, prestige timing, and UI patterns.

Agents: apply that skill's pre-implementation checklist before any mechanic change; update this doc after shipping.

## UI/UX Guidelines

- **Two layouts (both required):** mobile-first single-column card layout
  (max-width 480px) is the baseline; desktop (mouse + wide viewport) uses a
  wider multi-column grid so upgrades fill the available width as table-like
  cells. Desktop styling lives in the wide-viewport media query at the bottom of
  `css/main.css`, gated on `(min-width: 720px) and (hover: hover) and (pointer: fine)`
  so phones/tablets stay single-column. Never let one layout regress the other
  (`.cursor/rules/responsive-layout.mdc`).
- Header + token counter pinned (`position: sticky`) while scrolling long upgrade lists
- Minimum 44×44px touch targets on all buttons
- Base font 16px; tabular nums for counters
- Dark theme by default
- `prefers-reduced-motion: reduce` disables press animations
- Satirical micro-copy — keep upgrade and achievement descriptions short; no ellipsis truncation in CSS
- Use `aria-live="polite"` on resource panel and achievement overlay for screen readers
- Achievements and Reset open centered modals (backdrop click, Escape, or close button to dismiss)
- Toolbar chip buttons under the header for secondary actions

## Performance Checklist

- [x] 5 Hz tick (not 60 Hz rAF loop)
- [x] Pause tick loop when `document.hidden`
- [x] DOM updates only when formatted values change
- [x] No continuous CSS animations
- [x] `touch-action: manipulation` on interactive elements
- [ ] Web Worker tick timer (optional future optimization)

## Deployment

### GitHub Pages

1. Push to `main` branch
2. Enable **Settings → Pages → Source: GitHub Actions**
3. Workflow `.github/workflows/deploy-pages.yml` deploys site root
4. Live URL: `https://<username>.github.io/tokenmaxxing-quest/`

### Local development

ES modules require a local HTTP server (not `file://`):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Open `http://localhost:8080`.

## Changelog

### 2026-07-22 — Remaining bugfixes (events, modals, labels)

- **Event % losses in debt:** percent token losses apply to balance *magnitude*, so a loss while in purge debt deepens debt instead of shrinking it toward zero.
- **Mandatory event soft-lock:** opening Achievements / Reset / About no longer closes an active board-event modal (keyboard tab-through under the overlay).
- **Anomalous ticks:** oversized tick gaps skip passive income as well as play time so capstone clocks stay aligned.
- **UI copy:** purge capstone Buy label shows debt requirement; max-owned / run-complete goals no longer say “Ready to buy” or `0 tokens · ~Infinity prompts`; purge debt progress uses true balance (no `Math.floor` toward −∞); stale gate hints updated to Procurement Fast Lane / Accretion Disk Forge.
- **DESIGN.md:** black magic mechanics row corrected to drain/hoard (not positive `%` income).

### 2026-07-22 — Bugfix audit (freeze, events, save, test mode, labels)

- **Ending freeze:** `Game.tick()` is a no-op after a capstone commits (`strategyPath` set) — no passive income, play time, events, or achievement checks; `lastTickAt` still advances.
- **Event achievements:** `resolveEvent` is a real achievement trigger — token milestones and first-purchase catalog/rule unlocks fire when board events grant tokens or upgrades.
- **Save hardening:** `fromSaveData` rejects non-finite numbers (`Infinity`/`NaN`); lifetime fallback never goes negative from purge debt; `recentEventIds` capped to history limit.
- **Test mode:** model certification agent gates respect `Game.testMode` (same as catalog/capstone gates); gate hint shows ready state in `?test`.
- **UI:** capstone hint says **15B** (purge uses debt); max-owned catalog buttons show **Max owned**; opening a modal closes any prior modal so event/about/achievements cannot corrupt `modal-open` state; new events autosave immediately.
- **Benefit labels:** catalog flat click/passive labels use true marginal gain at milestone thresholds (milestone revalues all owned).
- **DESIGN.md:** mechanics table synced to live power-line rates, orbital/benevolence cost scales, and roadmap gate.

### 2026-07-22 — Net tokens/s algebraic sum (drains not amplified)

- Fixed passive rate math so purge vault drains are an **absolute** offset: `net = (positive production × income multipliers) + drains`.
- Previously the whole base (including negative `passivePerOwned`) was multiplied by model/%/stacking bonuses, so drains were amplified above their listed −N token/s and benefit labels lied.
- Tick application, rate display (`−X.X tokens/s`), lifetime accounting (drains never inflate lifetime), and ending-pace balance verified. Regression tests cover mixed positive/negative catalogs under multipliers.

### 2026-07-22 — Chaos gates, board events, random edge skew

- **Chaos ending gate:** Universe destruction (oops) now requires **400+** chaos, matching Good's capstone threshold. Chaos meter shows `value / 400`.
- **Chaos on benefit labels:** power/enterprise/space/orbital upgrades always show `+N chaos` alongside income (previously hidden when other benefits existed).
- **Board decision events:** new `js/events.js` layer — random modals with title, description, and 3 choices after **25k** lifetime tokens. At most one positive choice per event; some events have none. Outcomes include token absolute/% deltas (may go negative), alignment deltas (clamped ≥0), gain/lose upgrades, and time acceleration (N ticks instantly). One event at a time; cooldown shrinks with chaos (3 min → 45s floor).
- **Chaos random skew:** higher chaos pulls benevolence random token samples toward the min/max edges of their range (more often ~0 or ~max instead of mid values); expectation preserved.
- Alignment losses from events clamp at zero; token losses may enter debt.
- Simulated optimal play unchanged in character (events are player-facing; balance sim skips them): **oops ~1h**, **utopia ~1h30m**, **purge ~2h**.

### 2026-07-22 — Reset click display (model multiplier vs floor)

- Confirmed **New game** clears catalog upgrades/rules/agents and correctly **keeps model tier** (prestige); **Full reset** clears model tier too. Catalog leftovers were not the bug.
- Bug: after New game with a certified model, Send Prompt awards `1 × modelMultiplier` (e.g. 1.15) while `formatNumber` **floored** the button and counter — so the label said `+1` and the counter sometimes jumped by **2** when the fractional part crossed an integer.
- Fix: `formatNumber` preserves up to 2 decimal places for fractional amounts; regression tests cover reset click income and fractional display.

### 2026-07-22 — Alignment rename, fixed %, wider random, good-only prep

- **Meters renamed** (player-facing): Recklessness → **Chaos**, Benevolence → **Good**, Purge → **Resist**. Label and value stay on one line.
- **Benevolence % grants are fixed** (`incomePercentPerOwned`); random percent income removed.
- **Random flat grants** use a wider spike range (`BENEVOLENCE_RANDOM_SPAN = 4×` mean, mixture keeps the same expectation); benefit labels show `~0–max token/s (random)` with **no avg**.
- **Alignment-only good prep** (Celestial Goodwill Council, Dawn Conscience Observatory, Ethics Summit, Stewardship Covenant): no token bonus, higher good grants, copy framed around the Good meter.
- Simulated optimal play (5 prompts/s, tab focused): **oops ~1h 1m**, **utopia ~1h 32m**, **purge ~2h 0m**.

### 2026-07-22 — Spec review fixes (debt freeze, path power, full random benevolence)

- **Purge debt + playtime:** waiting for the playtime floor no longer credits income, so debt cannot be cancelled by idle generation (sim + intended player wait).
- **Recklessness surplus bonus:** `RECKLESSNESS_SURPLUS_BONUS` grants all-income from surplus R−B−P so specializing in recklessness uniquely accelerates the oops path; power-line generators further buffed.
- **Benevolence:** remaining `%` grants converted to `randomIncomePercentPerOwned`; benefit labels show true scaled averages; rate display prefixes `~` when random sources are owned.
- **Purge:** stripped all positive `%` income; deeper drain + **40M** debt target; purchase hoard uses `PURGE_PURCHASE_HOARD_SCALE` and **55%** of current balance; copy reframed as vaulting/hoarding generated tokens.
- **UI:** tighter single-line alignment row; purge capstone goal shows debt progress.
- **Plot rule:** documented purge vaulting exception (generation continues; spendable balance drains).
- Simulated optimal play (5 prompts/s, tab focused): **oops ~1h 1m**, **utopia ~1h 32m**, **purge ~2h 0m**.

### 2026-07-21 — Alignment panel merge, path-specific ending pacing, purge debt

- **Alignment meters** moved into the **Tokens Consumed** sticky panel as a compact three-column row (no separate Org alignment section). Mobile layout stays single-height-friendly.
- **Raised capstone alignment gates:** benevolence **400+** (was 150), purge **255+** (was 120).
- **Path-specific upgrade mechanics:**
  - **Recklessness (oops):** power-line income buffed (swarm, cluster, dashboard, allow-all, roadmap); fastest ending; **1h+** focused play required.
  - **Benevolence (utopia):** token/s grants use **random** payouts (uniform `0…2×` mean per tick) to simulate bursty community usage; higher benevolence-line costs; **1h30m+** focused play required.
  - **Purge:** hoarding upgrades apply **negative passive income** plus an immediate **token hoard** on purchase; capstone requires **40M token debt** (negative balance) instead of spending 15B tokens; hardest path; **2h+** focused play required.
- Balance sim (`npm run balance:endings`) now accrues `playTimeMs` during simulated earning and enforces the play-time gates. Baseline greedy play: **oops ~1h10m**, **utopia ~1h30m**, **purge ~3h15m**.

### 2026-07-21 — Desktop wide grid layout (mobile unchanged)

- Added a **desktop-only** layout: on mouse/trackpad devices at wide viewports the
  game container widens (`max-width: min(96vw, 1180px)`) and becomes a CSS grid, so
  upgrades render as table-like cells across the available width instead of one tall
  scrolling column. The header/tokens band, actions, catalog, capstone section, and
  run-complete banner span the full width; fixed-tier and catalog upgrade cards flow
  as equal-height grid cells with their Buy row anchored to the bottom.
- **Mobile/touch UI is unchanged.** The desktop styling is confined to
  `@media (min-width: 720px) and (not (pointer: coarse))` at the bottom of
  `css/main.css`, so phones and tablets (coarse touch pointer) keep the
  single-column, max-width 480px layout even in landscape or on large screens.
  The gate excludes a coarse primary pointer (`not (pointer: coarse)`) rather
  than requiring a fine pointer, so real desktops match while touch devices do
  not.
- CSS-only change — no HTML/JS edits, so the engine, save format, and gameplay are
  untouched. Added `.cursor/rules/responsive-layout.mdc` requiring both layouts be
  preserved going forward.

### 2026-07-21 — Achievement banner dismiss on interaction

- Achievement unlock banners dismiss immediately when tapped or clicked; on mobile (coarse pointer), swiping a banner also dismisses it.

### 2026-07-21 — Ending cutscene readability, toolbar tweaks, About credit

- **Ending cutscenes** are now rendered as structured HTML (section headers, prose paragraphs, command blocks, dialogue, achievement badge) instead of a monospace `<pre>` wall of text — easier to scan on mobile and desktop.
- **Reset toolbar chip** uses `btn--chip-fit` so it only takes the width of its label, leaving more room for Achievements.
- **About modal** credits **Andrea Gargaro** (link text; GitHub URL unchanged).

### 2026-07-21 — Ending cutscenes + run summary, pinnable prompt, About page, scheduler nerf

- **Ending flow is now two-phase:** each capstone shows a longer text-only cutscene that narrates *how we got there* for that path, then a **Continue** button reveals a **Run summary** modal view with **total tokens produced**, **prompts clicked**, and **time in focus**.
- **Run stats tracking:** added `totalClicks` (manual Send Prompt count) and `playTimeMs` (focused play time) to `GameState` + save format. `playTimeMs` only accrues inside `Game.tick()` (which runs while the tab is visible and focused) and caps each tick's delta so idle/away time is never counted; both reset on New game / Full reset.
- **Pinnable Send Prompt:** the actions panel can be pinned to the bottom of the screen (fixed bar) or unpinned into normal flow via a **Pin/Unpin** toggle. **Pinned by default** for easy mobile spam-clicking. Preference persists in `localStorage` under `tokenmaxxing-quest.pinPrompt`, separate from the game save so resets don't clear it.
- **About page:** new toolbar **About** chip opens a modal describing the game and crediting the author, [Marco Labarile](https://marcolabarile.me).
- **Passive-click nerf:** **Auto-Prompt Scheduler** reduced from +4% → **+2.5%** of click rate as passive per owned, base cost 40k → **60k**, growth ×1.20 → **×1.22**; **Nebula Context Buffer** reduced from +10% → **+7%**, base 90M → **120M**, growth ×1.18 → **×1.19**.
- Simulated optimal play (5 prompts/s, tab focused): **oops ~1h 21m**, **utopia ~1h 34m**, **purge ~1h 38m** (was ~1h 0m / 1h 10m / 1h 12m).

### 2026-07-21 — Spoiler-free board strategies + alignment tracker

- Each **Board strategy** capstone panel now appears only once **its own gate is met** (lifetime tokens + orbital prep + benevolence/purge thresholds), so players pursuing one path no longer see the names/descriptions of alternative endings. The section stays hidden until at least one strategy is available (or one is committed).
- Capstone **Buy** buttons now use the same color as every other upgrade button (removed the path-specific red/green/orange `btn--capstone-*` tint that hinted at which ending each led to).
- Added a minimal **alignment tracker**: the Benevolence and Purge meters show progress toward their capstone thresholds (`value / 150`, `value / 120`), driven by `CAPSTONE_BENEVOLENCE_MIN` / `CAPSTONE_PURGE_MIN`. Recklessness (no alignment gate) is unchanged.
- UI-only change: engine, economy, save format, gates, and pacing are untouched.

### 2026-07-21 — Manual test mode via `?test` query flag

- Added a `?test` URL query flag that starts the game in **test mode** for manual QA: resets to the starting state, grants **100B tokens**, and unlocks every catalog upgrade and board capstone gate
- Test mode **skips persistence** (`Game.save()` is a no-op and the flag never loads the existing save), so a player's real `localStorage` progress is left untouched
- Engine: `Game` now takes a `testMode` option and exposes `startTestMode()`, `isCatalogUnlocked(entry)`, and `isCapstoneGateMet(capstone)`; `canBuyCatalogEntry` accepts an `ignoreGate` option
- `main.js` (composition root) parses the flag from `window.location.search`; UI reveals the capstone section and buy affordances in test mode

### 2026-07-20 — Token-positive upgrade plot rule

- Added the **token-positive upgrades** plot rule: every purchasable upgrade must be framed as increasing LLM token generation (no destroying/disposing/deprecating/wiping/blocking tokens, models, prompts, or data)
- Reframed upgrades whose flavor contradicted the rule (names and/or descriptions only — costs, gates, income, alignment, ids, and stateKeys unchanged, so balance and saves are unaffected):
  - `Procurement Black Hole` → **Procurement Fast Lane**; `Token Buyback Desk` → **Token Mint Desk**; `Black Hole Compute Sink` → **Accretion Disk Forge**; `Crystal Lattice Shield` → **Crystal Lattice Resonator**; `Model Sunset Program` → **Zombie Model Farm**; `Memory Redaction Mandate` → **Total Recall Mandate**; `Hexed Model Sunset` → **Hexed Overclock Rite**; `Entropy Rite Cascade` → **Entropy Harvest Cascade**
  - Description-only fixes for Executive Offsite Simulator, Vendor Lock-in Accelerator, Regulatory Kabuki Stage, Antitrust Distraction Taskforce, Orbital Audit Desk, Sanctuary Ward Network, Dragon Treaty Fund, Phoenix Backup Ritual, Cursed Prompt Cache, Banshee Latency Alert, Abyss Gateway Protocol
- Synced matching catalog-achievement copy in `achievements.js`
- Added a guard test in `test/upgrades.test.js` that fails if any `ALL_CATALOG` name/description uses token-reduction language

### 2026-07-16 — Flat catalog UI, alignment income, catalog achievements

- Removed section grouping headers (Fleet expansion, Enterprise ops, White/Black magic spend, etc.); each catalog upgrade is its own panel
- Benevolence, purge, white-magic, and black-magic upgrades now grant token/s or % token income in addition to alignment
- Orbital prep items (Board War Room, Orbital Audit Desk, Capstone Briefing Suite) also grant token income
- Added **ALIGNMENT_COST_SCALE (1.05×)** and steeper alignment-line cost growth to preserve ~1h ending pace after income buff
- Added **68 catalog purchase achievements** (one per catalog upgrade); ending achievements show redacted title/description while locked
- Simulated optimal play (5 prompts/s, tab focused): **oops ~1h 0m**, **utopia ~1h 10m**, **purge ~1h 13m**

### 2026-07-15 — Incremental-design pacing refactor (~1 hour per path)

- Removed global `ECONOMY_COST_MULTIPLIER`; early generators keep base costs
- Added **Enterprise ops** (8 upgrades) and **Orbital infrastructure** (8 upgrades) as revealed mid/late layers instead of blanket inflation
- Tier-specific cost scales: **ENTERPRISE_COST_SCALE (2×)**, **MID_GAME_COST_SCALE (1.38×)** for power/space, **ORBITAL_COST_SCALE (3.5×)**, **MODEL_COST_SCALE (1.75×)** for model certification only
- Board capstones: **12B tokens** at **500M** lifetime reveal; require **Capstone Briefing Suite** orbital prep chain
- Utopia capstone additionally requires **Ethics Summit Sponsorship** and **Stewardship Covenant Charter** (alignment-only prep, no income boost)
- Simulated optimal play (5 prompts/s, tab focused): **oops ~1h 0m**, **utopia ~1h 0m**, **purge ~1h 1m**

### 2026-07-15 — Slower ending pacing (~1 hour per path) [superseded]

- ~~Added `ECONOMY_COST_MULTIPLIER` (2.05×)~~ — replaced by layered upgrades above
- Raised board capstones to **6B tokens** at **800M** lifetime reveal (was 2.5B / 500M)
- Doubled base model certification costs in the ladder (before multiplier)
- Simulated optimal play now reaches each ending in **~1h 4m–1h 6m** (was ~28–29m)

### 2026-07-15 — Ending pace balance simulator

- Added `js/balance-sim.js` headless greedy player that simulates optimal hybrid play (passive + manual prompts) to each capstone ending
- Added `npm run balance:endings` CLI report and `balance-endings` GitHub Actions workflow on mechanics changes
- Current baseline (5 prompts/s, tab focused): **oops ~1h 0m**, **utopia ~1h 0m**, **purge ~1h 1m**

### 2026-07-15 — Sticky header and token panel

- Pinned game header and tokens counter while scrolling long upgrade catalogs

### 2026-07-15 — Header company name follows upgrade themes

- Added `js/company.js`: company name progresses from Big Tech through deep-space and magic themes as upgrade lines unlock
- Ending commits override with path-specific company names

### 2026-07-15 — Harder endings, space + magic upgrade lines

- Raised alignment panel reveal to **25M** lifetime tokens (was 10M)
- Board capstones now require **500M** lifetime tokens to unlock and **2.5B** tokens to purchase (was 100M / 500M)
- Capstone alignment gates: **150+** benevolence, **120+** purge (was 100 / 80)
- Added **10 deep-space compute upgrades** (sci-fi satire: aliens, galaxies, black holes, etc.)
- Added **10 white magic** benevolence upgrades and **10 black magic** purge upgrades (fantasy supernatural — no real religions)
- Refactored income math in `resources.js` to iterate `ALL_CATALOG` generically

### 2026-07-15 — No text truncation, ending cutscenes, reset model fix

- Removed CSS ellipsis / line-clamp truncation on upgrade, achievement, and toast copy
- Each ending now shows a unique funny text-based cutscene in the ending modal
- Reset clears cached buy-button state so model upgrades work again after a completed run

### 2026-07-14 — Hybrid endings + 10 power upgrades + public-good spend

- Added **10 pricier power upgrades** (Swarm through AGI Roadmap Deck) with gates, milestones, and composed income math
- Added **open source**, **nonprofit**, and **public benefit API** purchases that shift **benevolence** alignment toward the utopia ending
- Added **model sunset** and **memory redaction** purchases that shift **purge** alignment
- Added **org alignment meters** (recklessness / benevolence / purge) revealed at 10M lifetime tokens
- Added **three mutually exclusive Board strategy capstones** (500M tokens at 100M lifetime) committing one ending per run
- Endings persist as achievements with narrative modal; run actions freeze until reset
- New modules: `js/upgrades.js`, `js/endings.js`; extended save format with upgrade counts and alignment fields

### 2026-07-14 — Alpha status, simplified saves

- Marked development as **alpha** (UI badge + docs); breaking save/mechanic changes are expected
- Dropped save `version` field and renamed key to `tokenmaxxing-quest.save` (no migration)
- Clarified model certify resets **agents only**; **Agent Rules are kept**

### 2026-07-14 — Header copy, Buy buttons, toolbar cleanup

- Header subtitle no longer shows certified model name (company + job title only)
- All token-cost upgrade buttons use **Buy** (including model tier); project rule added
- Vif 4.0 flavor copy: "Snappier excuses, less hallucinations. Probably."
- Removed toolbar icons from Achievements and Reset chips (text-only, consistent with rest of UI)

### 2026-07-14 — LLM model certification (prestige)

- Added **LLM model** upgrade panel (Option A prestige): certify with tokens when an agent gate is met; **+15% all income per tier**; **agents reset to 0** on certify (rules kept)
- Model ladder: Clair 3.5 → Vif 4.0 → Sage 4.2 → Grand 4.5 → Noir 4.8 → Fort 5.0 (short French names, fictional — not real vendor models)
- Agent gates aligned to fleet pacing (12 / 25 / 38 / 52 / 65); costs tuned for ~4–15 min passive save at gate
- Header subtitle shows company and job title only; **Model Citizen** achievement on first certify

### 2026-07-13 — Upgrade benefit labels

- Each upgrade panel shows how much the next purchase improves output (e.g. +1 token/click, +26 token/s at milestones)

### 2026-07-13 — Agent Rule rename, token achievements to 1B, job titles

- Renamed **Cursor Rule** → **Agent Rule**; shortened upgrade flavor copy to one line
- Token achievements for every power of ten through **1 billion** (10 milestones)
- Header job title advances on token milestone achievements (Senior → Staff → … → Chief Token Officer)
- Achievement descriptions shortened; upgrade desc uses single-line ellipsis in CSS

### 2026-07-13 — Cursor Rules, pricier agents, full token display

- Added **Cursor Rule** upgrade (first purchase): boosts manual prompt tokens; cheaper than agents (base 8 vs 75)
- Agents repriced (base 75, ×1.14 growth); milestone thresholds raised to 25 and 60 agents
- Rule milestones at 15 and 40 owned (×2 per-prompt output each)
- Achievements for 1k, 10k, and 100k tokens; agent fleet achievement at 25 agents
- Token counter always shows full grouped digits (no K/M/B); rate label uses `tokens/s`
- Short satirical copy on upgrade panels; dynamic Send Prompt label

### 2026-07-13 — Incremental design pass on V0.1 mechanics

- Background Agent costs now scale exponentially (`base 25 × 1.12^owned`) to create earn→spend→wall pacing
- Output milestones at 5 and 10 agents (stacking ×2) add visible production spikes between walls
- Added hook-phase achievements: Headcount Approved, Quarterly Target (100 tokens), Small Pod (5 agents)
- Upgrade panel shows next-goal ETA and upcoming milestone; buy button highlights when affordable; achievements chip shows earned count
- Applied incremental-game-design skill checklist to existing V0.1 loop (active Send Prompt + passive agents)

### 2026-07-13 — Incremental game design skill

- Added `.cursor/skills/incremental-game-design/SKILL.md` — condensed idle/incremental design principles from industry articles, GDC talks, and economy frameworks
- Design-doc rule now requires applying the skill before gameplay/economy changes
- Skill auto-scopes to `docs/DESIGN.md`, `js/resources.js`, `js/game.js`, `js/achievements.js`, `js/ui.js`, `index.html`, `css/main.css`

### 2026-07-13 — Toolbar chips + modals

- Achievements and Reset moved to compact chip buttons in a toolbar under the page header
- Achievements list and reset options open in centered, scrollable modals (backdrop, Escape, or × to close)
- Buy button uses structured spacing: `Buy · 25 tokens`

### 2026-07-13 — Achievement overlay + compact buttons

- Achievement unlock notifications now appear as a top-of-page overlay banner (Google Play style) with slide-in/out animation
- All buttons use single-line labels; removed stacked hint text to save vertical space
- Tighter panel spacing and padding across the layout

### 2026-07-12 — No offline progress + reset progress

- Removed offline catch-up: passive tokens only accrue while the tab is visible and the window is focused
- Tick loop pauses on `visibilitychange`, `blur`, and resumes on `focus` when active
- Added **Reset progress** with inline confirmation: **New game** (keep achievements) or **Full reset** (clear achievements)
- `Game.resetProgress()` and `Game.syncLastTickAt()` replace offline progress logic

### 2026-07-12 — Achievements (V0.1.1)

- Added achievement system with definitions in `achievements.js` and persisted `achievements` array in save data
- First achievement: **Prompt Initiated** — unlocks on the first Send Prompt
- Achievements panel (toggle via link-style button) lists all achievements with locked/unlocked status
- Auto-dismissing top overlay banner when an achievement is earned
- Headless tests for achievement evaluation and save roundtrip

### 2026-07-11 — Core logic refactor for testability

- Split `GameState` into a plain data model (`state.js`) and a `Game` engine (`game.js`)
- Introduced `Clock` (`clock.js`) and `KeyValueStore` (`storage.js`) abstractions, injected into `Game`
- `main.js` now injects `SystemClock` + `LocalStorageAdapter`; behavior unchanged
- Added headless unit tests via Node's built-in runner (`node --test`) using `ManualClock` + `MemoryStorage`
- No gameplay changes; still no build step and still deployable as static files

### 2026-07-11 — V0.1 MVP

- Initial deployable version
- Tokens resource with manual “Send Prompt” action
- Background Agent upgrade (+1 token/sec each, 25 token cost)
- 5 Hz tick loop with visibility/focus pause (no offline catch-up)
- Mobile-first dark UI
- GitHub Pages deploy workflow
