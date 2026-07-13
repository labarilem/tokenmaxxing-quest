---
name: incremental-game-design
description: Apply idle/incremental game design principles when adding or changing mechanics, economy, pacing, upgrades, prestige, achievements, or player-facing progression copy in Tokenmaxxing Quest. Use for any gameplay design decision, balance tuning, or new feature that affects the earn-spend-accelerate loop.
paths:
  - "docs/DESIGN.md"
  - "js/resources.js"
  - "js/game.js"
  - "js/achievements.js"
  - "js/ui.js"
  - "index.html"
  - "css/main.css"
---

# Incremental / Idle Game Design

Condensed from industry writing (Anthony Pecorella, Eric Guan, Bugnet, Machinations, Solana Garden, Sam Novak, Subpixel, André Guerrero). Apply this skill **before** proposing or implementing any gameplay change.

## When to use

- Adding or changing upgrades, generators, currencies, prestige, events, achievements
- Tuning costs, production rates, or pacing
- Designing UI that surfaces progression (rates, next goals, milestones)
- Writing player-facing copy for upgrades and milestones
- Reviewing whether a planned mechanic fits the current version scope

## Tokenmaxxing Quest constraints (project-specific)

Respect `docs/DESIGN.md` hard requirements. Notable design choices already locked in:

| Choice | Implication for incremental design |
|--------|-------------------------------------|
| **Active-only ticks** (no offline catch-up) | This is an *incremental* browser game, not a classic mobile idle. Passive income only while tab is visible and focused. Design pacing for short sessions and return visits, not 8-hour offline claims. |
| **V0.1 scope** | Single primary currency (tokens). No prestige until V0.5. Do not scope-creep; park ideas in DESIGN.md **Planned**. |
| **Satirical tone** | Upgrades and milestones should read like internal tooling / perf theater, not fantasy loot. |
| **Mobile-first, 5 Hz tick** | Show rates and next goals clearly; avoid micromanagement that needs constant attention. |

---

## 1. Core engagement model

The surface is numbers going up. Depth comes from three pillars ([Bugnet](https://bugnet.io/blog/how-to-design-an-idle-or-incremental-game)):

1. **Satisfying growth loop** — spend resources on things that increase accumulation (compounding feel).
2. **Meaningful upgrade decisions** — limited resources + different upgrade benefits = real choices, not a fixed buy order.
3. **Well-paced revealed layers** — unlock new mechanics/systems as old layers flatten; a new currency, generator tier, or prestige layer before boredom sets in.

Always offer an **interesting next goal**: close enough to feel reachable, significant enough to matter. Respect player time — reward engagement without demanding constant attention or punishing absence.

### Core loop (canonical)

```
Earn → Spend → Accelerate → Hit wall → (breakthrough / new layer / prestige)
```

([Solana Garden](https://solana.garden/guides/game-idle-game-design-explained/), [Pecorella GDC](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf))

---

## 2. Math foundations

### Production vs cost (the seesaw)

At the most basic level, **costs grow exponentially** while **production grows linearly or polynomially**. Eventually costs outpace income; that wall drives waiting, optimization, or prestige.

```
cost_next     = base_cost × (growth_rate ^ owned)
production    = (base_rate × owned) × multipliers
```

([Math of Idle Games Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i))

- Typical `growth_rate`: **1.07–1.15** per purchase/level.
- Exponential costs always overtake polynomial production — tune *when*, not *if*.
- **Perceived growth** must stay noticeable: humans notice ratios (~×1.2), not flat +N at high baselines ([Eric Guan](https://ericguan.substack.com/p/idle-game-design-principles)). Use % multipliers and milestone spikes, not only linear +1.

### Bulk-buy formulas (when scaling costs)

For simple exponential costs (no shifting exponents):

```
bulk_cost = b × (r^k × (r^n − 1)) / (r − 1)
max_buy   = floor(log_r((c × (r−1)) / (b × r^k) + 1))
```

Where `b` = base price, `r` = growth rate, `k` = owned, `n` = to buy, `c` = currency.

### Milestone / threshold bonuses

Flat exponentials feel monotonous. Inject **visible spikes**:

- Every 25/50 owned: ×2 output on that generator
- Unlock generator N+1 only after generator N reaches level 10
- Achievement or UI callout at each spike

Each spike should teach a new optimization (which generator to prioritize, when to stop leveling vs buy new). ([Pecorella](https://www.kongregate.com/pages/quest-for-progress-the-math-of-idle-games), [Solana Garden](https://solana.garden/guides/game-idle-game-design-explained/))

### Multiple generators

Without careful tuning, the **newest generator dominates** and older ones become irrelevant — boring.

**Fix:** vary milestone multipliers and unlock gates so **different generators are optimal at different stages**. Player should sometimes reconsider priorities. Model optimal income:cost ratio when balancing ([Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)).

---

## 3. Economy: sinks, sources, and failure modes

Every sink **destroys** a resource and **grants** something else. Define sinks by **resource_in** (what is eaten), not resource_out ([Sam Novak / DEV](https://dev.to/sam_novak_574b07811e18495/idle-game-economy-design-what-your-currency-sinks-actually-eat-1non)).

| Sink type | Resource paid | Source | You receive | Fails when |
|-----------|---------------|--------|-------------|------------|
| **Progression** | Soft currency (≈ time) | Production / clicks | Permanent power | Source outpaces maxed sink → inflation |
| **Engagement** | Energy / time / attention | Regen clock | Permission to act | Regen mistuned vs session length |
| **Reset prestige** | Entire run progress | Current run | Meta-multiplier | Multiplier doesn't justify loss |
| **Status prestige** | Premium / money | Wallet | Cosmetics / ego | Top spenders cap out |

**Cost curves are the clock of the game** — they set pacing, not flavor.

When something feels wrong, diagnose:

1. **Inflation** — faucet open, drain capped
2. **Mistuned rate** — conversion price wrong for target session length
3. **Exhausted meaning** — paying no longer feels costly

Simulate over **14-day curves**, not single spreadsheet snapshots.

---

## 4. Pacing and session design

### Engagement decay ([Eric Guan](https://ericguan.substack.com/p/idle-game-design-principles))

Players start active (15–60 min first session), then check in less often. Ideal pacing **follows that decay**:

- Short clocks for engaged players (collect every 20–30 min)
- Long clocks for casual players (caps at hours/days)
- Heterogeneous clocks let different playstyles each feel optimized

For Tokenmaxxing Quest (active-only): lean on **clear next purchase**, **achievement nudges**, and **layer reveals** rather than offline caps.

### Three retention phases ([GridInc](https://gridinc.co.za/blog/idle-games-best-practices), general industry pattern)

| Phase | Window | Goal |
|-------|--------|------|
| **Hook** | 0–30 min | Immediate gratification, first automation, first achievement |
| **Habit** | 1–7 days | Regular check-ins, meaningful daily progress, second generator tier |
| **Hobby** | Weeks+ | Deep systems, prestige, long-term goals |

**First minutes are highest-leverage** — more players quit early than late ([Bugnet](https://bugnet.io/blog/how-to-design-an-idle-or-incremental-game)). Get to the interesting loop fast; watch first-time behavior, not opinions.

### Anti-idle paradox

Total automation kills engagement. Strong designs alternate **idle accumulation** with **short active bursts** — events, timed bonuses, manual actions that matter ([Solana Garden](https://solana.garden/guides/game-idle-game-design-explained/), [Subpixel](https://www.patreon.com/Subpixel/posts/10-rules-for-160530914)).

Tokenmaxxing Quest: **Send Prompt** is the active burst; agents are automation. Keep manual play relevant early; don't make clicking obsolete in V0.1.

### Active vs passive split (guideline)

~**60% idle / 40% active** is a common target for full idle games ([GridInc](https://gridinc.co.za/blog/idle-games-best-practices)). Adjust for active-only browser context.

---

## 5. Prestige (V0.5+ for this project)

Prestige serves two purposes ([Part III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)):

1. **Ladder climbing** — reset with a huge boost; feels powerful
2. **Growth compression** — reins in runaway numbers

### Timing

- Reset when income growth **plateaus** — rule of thumb: when next prestige currency would be **+50% to +200%** vs current ([Pecorella PDF](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf))
- Or when progress slows to **10–20% of peak speed**
- First prestige: after one full **wall → breakthrough** cycle — often **30–90 min** browser / **2–4 hr** mobile ([Solana Garden](https://solana.garden/guides/game-idle-game-design-explained/))
- **Second run should feel 40–60% faster** to the same milestone

### Prestige currency formula

Use **log or fractional exponent** so returns diminish but never fully plateau:

```
prestige_points = floor((lifetime_earnings / scale) ^ exponent)   # exponent ~0.4–0.6
```

Decide: does prestige unlock **new mechanics** (extends content) or only **multiply** (cheaper but exhausts faster)?

### Cycle feel

- Early part of each run should be **fast** (power fantasy)
- Player must get **noticeably farther** than last run
- Vary cycle length (bumps in prestige gains) to avoid flat resets ([Part III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii))

Tokenmaxxing V0.5 **Promotion** prestige: frame as corporate promotion reset — permanent multiplier, satirical copy, align with DESIGN.md Planned table.

---

## 6. UI / UX for incrementals

([Mind Studios](https://games.themindstudios.com/post/idle-clicker-game-design-and-monetization/), [Machinations](https://machinations.io/articles/idle-games-and-how-to-design-them))

- **Clean, simple UI** — focus on numbers and next action; secondary actions in chips/modals (already project pattern)
- **Show production rate** prominently (`+X / sec`) when passive income exists
- **Clear next goal** — affordable upgrade highlighted; cost on buy button (`Buy · 25 tokens`)
- **Achievement counter / milestones** — visible progress beyond main number
- **Frequent small rewards early**, larger sparser rewards later
- **Tabular nums** for counters (project standard)
- **Minimum 44×44px** touch targets

Avoid: overwhelming menus at start, hiding the core loop, upgrade lines with no perceived impact.

---

## 7. Achievements as incremental hooks

Achievements are **collection/completion** motivators ([Pecorella PDF](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf)) — use them to:

- Onboard (First Prompt ✓)
- Mark **layer transitions** (first agent, first 100 tokens, first swarm)
- Tease upcoming systems without implementing them yet

Do not gate core progression behind achievements.

---

## 8. Design ethics

([Bugnet](https://bugnet.io/blog/how-to-design-an-idle-or-incremental-game), [Solana Garden](https://solana.garden/guides/game-idle-game-design-explained/))

- Reward engagement; don't punish healthy absence (especially with no offline catch-up — don't add FOMO that contradicts DESIGN.md)
- **Meaningful progress** over artificial gates
- If monetization is ever added: sell **convenience**, not mandatory power; prestige math fair for non-payers
- **Ship small, finish, learn** — scope to completable milestones ([Bugnet](https://bugnet.io/blog/how-to-design-an-idle-or-incremental-game))
- **Cut features** that compete for attention with the core loop

---

## 9. Pre-implementation checklist

Before any gameplay change, answer:

1. **Which loop phase does this serve?** (hook / habit / hobby)
2. **What is resource_in and resource_out?** Pair sink with source.
3. **What is the next goal after this change?** Always leave one reachable step ahead.
4. **Does this add a revealed layer or flatten progression?** Prefer layers over bigger numbers alone.
5. **Does production:cost ratio create a wall at the intended time?** Sketch with constants, don't guess.
6. **Does manual play still matter?** (anti-idle paradox)
7. **Is scope appropriate for current version?** If not, add to DESIGN.md Planned only.
8. **Will UI show the change clearly?** Rate, cost, milestone feedback.
9. **Update DESIGN.md** Mechanics table + Changelog after shipping.

### Quick balance sanity (single generator)

- Time to next purchase ≈ `cost / (income_per_sec)`
- After buying, income should jump enough to **feel** the purchase (×1.1+ effective)
- First automation (Background Agent): should pay for itself in **tens of seconds to a few minutes**, not hours

Current V0.1: agent costs 25 tokens, +1/sec → ~25s payback at constant click rate 0 — ensure early clicking gets player there in first session.

---

## 10. Subpixel's incremental rules (condensed)

([Subpixel Patreon](https://www.patreon.com/Subpixel/posts/10-rules-for-160530914))

1. Keep the player "buzzed" — numbers must get more exciting over time
2. Always dangle something **just outside** current reach (next layer, multiplier, secret)
3. Give players **something to do** besides waiting
4. Balance **clicker** (active) and **idler** (passive) modes — neither extreme
5. Exponential pacing prolongs the initial euphoria
6. Endgame: numbers too big to fit screen → contented mastery, not boredom

---

## Reference bibliography

| Resource | Author / source | Topics |
|----------|-----------------|--------|
| [The Math of Idle Games, Parts I–III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i) | Anthony Pecorella | Growth, cost, bulk buy, generator balance, prestige cycles |
| [Quest for Progress (GDC slides + spreadsheets)](https://www.kongregate.com/pages/quest-for-progress-the-math-of-idle-games) | Anthony Pecorella | Simulation models, optimal purchase paths |
| [Idle Game Design Principles](https://ericguan.substack.com/p/idle-game-design-principles) | Eric Guan | Reengagement clocks, playstyle differentiation, psychophysics of growth |
| [How to Design an Idle or Incremental Game](https://bugnet.io/blog/how-to-design-an-idle-or-incremental-game) | Bugnet | Growth/decisions/layers, ethics, first impression, scope |
| [Idle games and how to design them](https://machinations.io/articles/idle-games-and-how-to-design-them) | Machinations | Core vs meta loop, balance, active/idle modes |
| [Idle Game Economy: What Sinks Eat](https://dev.to/sam_novak_574b07811e18495/idle-game-economy-design-what-your-currency-sinks-actually-eat-1non) | Sam Novak | Sink/source framework, failure modes |
| [Idle Game Design Explained](https://solana.garden/guides/game-idle-game-design-explained/) | Solana Garden | Full loop, offline caps, prestige timing, anti-idle |
| [Idle vs Incremental vs Tycoon](https://medium.com/tindalos-games/idle-vs-incremental-vs-tycoon-understanding-the-core-mechanics-f12d62f4b9f7) | André Guerrero | Genre definitions, automation layers |
| [10 Rules for Making an Incremental Game](https://www.patreon.com/Subpixel/posts/10-rules-for-160530914) | Subpixel | Pacing, dangling goals, clicker/idler balance |
| [Idle Clicker Best Practices](https://games.themindstudios.com/post/idle-clicker-game-design-and-monetization/) | Mind Studios | UI, progression indicators, pacing |
| [Idle Games Best Practices](https://gridinc.co.za/blog/idle-games-best-practices) | GridInc | Prestige timing, retention phases |

Pecorella's [spreadsheet models](https://www.kongregate.com/pages/quest-for-progress-the-math-of-idle-games) are the gold standard for tuning before coding.
