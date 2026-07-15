# Tokenmaxxing Quest — Design Document

Living design doc for the incremental browser game. Update this file whenever mechanics, architecture, or requirements change.

## Vision & Theme

**Tokenmaxxing Quest** is a satirical incremental game about a software engineer at a big tech company that incentivizes LLM token spending as a proxy for productivity — a practice known as [token maxxing](https://en.wikipedia.org/wiki/Workplace_impact_of_artificial_intelligence#Token_maxxing).

The player embarks on a career quest: consume as many AI tokens as possible to earn promotions and recognition. Early on it feels like a clever hack. Over time, the systems scale — parallel agents, bloated prompts, manager dashboards — until things get **too big**.

Tone: dry corporate satire. Player-facing copy should sound like internal tooling, standups, and perf reviews.

## Development status: Alpha

The game is in **alpha**. Save format, balance, and mechanics may change without notice — **breaking changes are expected** and there is no save migration layer. Players may need to clear progress or start fresh after updates.

## Hard Requirements

These are non-negotiable constraints for all versions:

| Requirement | Detail |
|-------------|--------|
| **Browser-only** | Must run in a modern web browser with no install step |
| **Mobile-friendly** | Usable on phones: touch targets, readable text, single-column layout |
| **No game engine** | Render with HTML, CSS, and JavaScript only — no Phaser, Pixi, Unity, etc. |
| **GitHub Pages** | Static files deployable to a free public GitHub Pages repo |
| **Performance** | Snappy UI, low battery drain on mobile — no rAF game loop, pause when tab hidden |

## Non-Goals (V0.1)

- No backend or server-side logic
- No WebGL / canvas rendering loop
- No npm build step (keep deploy simple)
- No sound, prestige, narrative events, or multiple resources

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
  upgrades.js       → power/benevolence/purge catalog + capstones + alignment
  endings.js        → ending narratives + resolution helpers
  ui.js             → DOM bindings, update-on-change only
test/
  game.test.js      → engine behavior (actions, ticks, save/load, reset)
  state.test.js     → save (de)serialization + validation
  achievements.test.js → achievement unlock rules
  upgrades.test.js     → catalog purchases, alignment, capstone endings
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
  "openSource": 0,
  "nonprofits": 0,
  "publicApis": 0,
  "modelSunsets": 0,
  "memoryRedactions": 0,
  "alignmentRecklessness": 0,
  "alignmentBenevolence": 0,
  "alignmentPurge": 0,
  "strategyPath": null
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
| **LLM model certification** | Prestige-style upgrade panel; costs tokens + requires agent gate; **+15% all token income per tier** (×1.15, ×1.30, …); **resets agents to 0** on certify (**rules kept**); persists across new game |
| **Model ladder** | Clair 3.5 (start) → Vif 4.0 (12 agents, 2.5k) → Sage 4.2 (25, 20k) → Grand 4.5 (38, 35k) → Noir 4.8 (52, 150k) → Fort 5.0 (65, 600k) |
| **Model Citizen** | Achievement: certify first model upgrade |
| **Achievements** | Milestones that unlock from gameplay; persisted in save; top overlay banner on earn; toolbar shows earned count |
| **First Prompt** | Achievement: send your first prompt |
| **Rules of Engagement** | Achievement: buy first Agent Rule |
| **Headcount Approved** | Achievement: buy first Background Agent |
| **Quarterly Target** | Achievement: reach 100 tokens |
| **Token powers of ten** | Achievements at 1, 10, 100 … 1B tokens (10 milestones) |
| **Job title progression** | Header subtitle promotes on token milestones (100 → Senior, 1k → Staff, … 1B → CTO); company + job title only (no model name) |
| **Small Fleet** | Achievement: own 25 Background Agents |
| **Next goal UI** | Each upgrade shows afford hint (prompts and/or passive ETA) and next milestone |
| **Upgrade benefit labels** | Each upgrade shows marginal gain for the next purchase (e.g. +1 token/click, +1 token/s; scales at milestones) |
| **Full token display** | Token counter always shows full digits with grouping (no K/M/B abbreviations) |
| **One-line flavor copy** | Satirical upgrade/achievement descriptions stay short; no CSS ellipsis truncation |
| **Active-only ticks** | Passive income and tick loop run only while the tab is visible and the window is focused |
| **Reset progress** | New game (keep achievements + model tier) or full reset (clear achievements + model tier); modal confirmation required |
| **Parallel Agent Swarm** | +5 tokens/s each; base 500, ×1.16; gate 30 agents; milestones 20/50 |
| **Speculative Decoding Rig** | +3% all income per owned; base 2k; gate 10 swarms |
| **Context Window Expander** | +8 tokens/click per owned; base 3.5k; gate 50 rules; milestones 15/40 |
| **Prompt Bloat Engine** | +5% all income per owned; base 5k; gate 25 swarms |
| **Inference Cluster** | +50 tokens/s each; base 12k; gate Sage 4.2; milestones 10/25 |
| **MCP Server Pod** | +1 token/s per agent per pod; base 20k; gate 50 agents + 5 clusters |
| **Auto-Prompt Scheduler** | +4% of click rate as passive per owned; base 40k; gate Grand 4.5 |
| **Executive Token Dashboard** | +10% all income per owned; base 80k; gate Noir 4.8 |
| **Allow-All Permissions Profile** | +30% all income per owned; +8 recklessness; base 200k; gate Fort 5.0 + 1M lifetime |
| **AGI Roadmap Deck** | ×2 all income per deck (max 3); base 1M; gate 100M lifetime |
| **Open Source Maintainer Grant** | +15 benevolence; base 8k; no/minimal income |
| **Nonprofit Compute Credit** | +25 benevolence; base 25k |
| **Public Benefit API** | +40 benevolence, +2% income; base 60k |
| **Model Sunset Program** | +12 purge alignment; base 15k |
| **Memory Redaction Mandate** | +20 purge alignment; base 45k |
| **Org alignment meters** | Recklessness / Benevolence / Purge tracked from purchases; panel reveals at 10M lifetime tokens |
| **Board strategy capstones** | Mutually exclusive 500M-token commits at 100M lifetime: Oops / Utopia / Purge |
| **Ending achievements** | Persistent unlock + text cutscene modal on capstone purchase; run freezes until reset |

### Planned

| Version | Mechanic | Notes |
|---------|----------|-------|
| V0.2 | Manager Review events | Random events; burnout debuff if over-tokenmaxxing |

## Incremental design guidance

Gameplay and economy changes should follow the project skill **incremental-game-design** (`.cursor/skills/incremental-game-design/SKILL.md`). It condenses idle/incremental design literature (Pecorella, Eric Guan, Bugnet, Machinations, and others) into actionable checklists: core loop, cost/production math, sink/source balance, pacing phases, prestige timing, and UI patterns.

Agents: apply that skill's pre-implementation checklist before any mechanic change; update this doc after shipping.

## UI/UX Guidelines

- Single-column card layout, max-width 480px
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
