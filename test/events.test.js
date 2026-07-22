import { test } from "node:test";
import assert from "node:assert/strict";

import { Game } from "../js/game.js";
import { GameState } from "../js/state.js";
import {
  EVENT_BASE_COOLDOWN_MS,
  EVENT_HISTORY_LIMIT,
  EVENT_MIN_COOLDOWN_MS,
  EVENT_UNLOCK_LIFETIME,
  GAME_EVENTS,
  countPositiveChoices,
  getEventCooldownMs,
  getEventDef,
} from "../js/events.js";
import { ManualClock } from "../js/clock.js";
import {
  CHAOS_RANDOM_EDGE_SCALE,
  sampleChaosSkewedUnit,
  sampleTokensPerSecondForState,
} from "../js/resources.js";
import {
  ALL_CATALOG,
  CAPSTONE_RECKLESSNESS_MIN,
  CAPSTONES,
} from "../js/upgrades.js";

test("every chaos-path catalog upgrade grants recklessness points", () => {
  const chaosCategories = new Set(["power", "enterprise", "space", "orbital"]);
  for (const entry of ALL_CATALOG) {
    if (!chaosCategories.has(entry.category)) {
      continue;
    }
    assert.ok(
      entry.alignment?.recklessness && entry.alignment.recklessness > 0,
      `${entry.id} (${entry.category}) must grant chaos points`,
    );
  }
});

test("universe ending requires chaos threshold", () => {
  const oops = CAPSTONES.find((entry) => entry.path === "oops");
  assert.ok(oops);

  const blocked = new GameState({
    lastTickAt: 0,
    tokens: 20_000_000_000,
    lifetimeTokens: 500_000_000,
    capstoneBriefingSuites: 1,
    playTimeMs: 60 * 60 * 1000,
    alignmentRecklessness: CAPSTONE_RECKLESSNESS_MIN - 1,
  });
  assert.equal(oops.gate(blocked), false);

  const ready = new GameState({
    lastTickAt: 0,
    tokens: 20_000_000_000,
    lifetimeTokens: 500_000_000,
    capstoneBriefingSuites: 1,
    playTimeMs: 60 * 60 * 1000,
    alignmentRecklessness: CAPSTONE_RECKLESSNESS_MIN,
  });
  assert.equal(oops.gate(ready), true);
});

test("events catalog: three choices and at most one positive outcome", () => {
  assert.ok(GAME_EVENTS.length >= 8);
  for (const event of GAME_EVENTS) {
    assert.equal(event.choices.length, 3, `${event.id} needs 3 choices`);
    const positives = countPositiveChoices(event);
    assert.ok(positives <= 1, `${event.id} has ${positives} positive choices`);
    for (const choice of event.choices) {
      assert.ok(choice.id && choice.label && choice.outcome);
    }
  }
  const allNegative = GAME_EVENTS.filter((event) => countPositiveChoices(event) === 0);
  assert.ok(allNegative.length >= 1, "at least one no-win event");
  const onePositive = GAME_EVENTS.filter((event) => countPositiveChoices(event) === 1);
  assert.ok(onePositive.length >= 1, "at least one single-positive event");
});

test("event cooldown shrinks with chaos but respects the floor", () => {
  assert.equal(getEventCooldownMs(0), EVENT_BASE_COOLDOWN_MS);
  assert.ok(getEventCooldownMs(200) < EVENT_BASE_COOLDOWN_MS);
  assert.equal(getEventCooldownMs(50_000), EVENT_MIN_COOLDOWN_MS);
});

test("events fire after unlock + cooldown, only one at a time", () => {
  let seq = 0;
  const random = () => {
    seq += 1;
    return (seq % 10) / 10;
  };
  const clock = new ManualClock(0);
  const game = new Game({
    clock,
    random,
    state: new GameState({
      lastTickAt: 0,
      lifetimeTokens: EVENT_UNLOCK_LIFETIME,
      playTimeMs: 0,
      nextEventAtPlayTimeMs: 0,
    }),
  });

  clock.advance(200);
  let result = game.tick();
  assert.equal(result.event, null, "first tick only schedules");
  assert.ok(game.state.nextEventAtPlayTimeMs > 0);

  game.state.playTimeMs = game.state.nextEventAtPlayTimeMs;
  clock.advance(200);
  result = game.tick();
  assert.ok(result.event, "event should start when due");
  assert.equal(game.state.activeEventId, result.event.id);

  game.state.playTimeMs = game.state.nextEventAtPlayTimeMs + EVENT_BASE_COOLDOWN_MS;
  clock.advance(200);
  result = game.tick();
  assert.equal(result.event, null, "no second event while one is active");
});

test("resolving an event applies outcomes and clears the active slot", () => {
  const clock = new ManualClock(0);
  const event = getEventDef("corp-war-declaration");
  assert.ok(event);
  const game = new Game({
    clock,
    state: new GameState({
      lastTickAt: 0,
      tokens: 100_000,
      lifetimeTokens: 100_000,
      activeEventId: event.id,
      playTimeMs: 60_000,
      nextEventAtPlayTimeMs: 60_000,
    }),
  });

  const beforeTokens = game.state.tokens;
  const { resolved, choice } = game.resolveEventChoice("peace-treaty");
  assert.equal(resolved, true);
  assert.equal(choice?.id, "peace-treaty");
  assert.equal(game.state.activeEventId, null);
  assert.ok(game.state.tokens > beforeTokens);
  assert.ok(game.state.alignmentBenevolence >= 12);
  assert.ok(game.state.nextEventAtPlayTimeMs > game.state.playTimeMs);
  assert.ok(game.state.recentEventIds.includes(event.id));
});

test("resolving an event unlocks token milestone achievements", () => {
  const event = getEventDef("corp-war-declaration");
  assert.ok(event);
  const game = new Game({
    state: new GameState({
      lastTickAt: 0,
      tokens: 9_500,
      lifetimeTokens: 50_000,
      activeEventId: event.id,
      playTimeMs: 60_000,
      nextEventAtPlayTimeMs: 60_000,
    }),
  });

  const { resolved, unlocked } = game.resolveEventChoice("peace-treaty");
  assert.equal(resolved, true);
  assert.ok(game.state.tokens >= 10_000);
  assert.ok(
    unlocked.some((def) => def.id === "tokens-10k"),
    "crossing 10k via event reward should unlock the milestone",
  );
  assert.equal(game.state.hasAchievement("tokens-10k"), true);
});

test("resolving an event unlocks catalog achievements for granted upgrades", () => {
  const event = getEventDef("open-source-ambush");
  assert.ok(event);
  const game = new Game({
    state: new GameState({
      lastTickAt: 0,
      tokens: 50_000,
      lifetimeTokens: 50_000,
      openSource: 0,
      activeEventId: event.id,
      playTimeMs: 60_000,
      nextEventAtPlayTimeMs: 60_000,
    }),
  });

  // Choice that gains openSource (see events catalog).
  const gainChoice = event.choices.find((choice) => choice.outcome.gainUpgrade?.stateKey === "openSource");
  assert.ok(gainChoice);

  const { resolved, unlocked } = game.resolveEventChoice(gainChoice.id);
  assert.equal(resolved, true);
  assert.ok(game.state.openSource >= 1);
  assert.ok(
    unlocked.some((def) => def.id === "catalog-open-source" || def.catalogId === "open-source"),
    "first open-source grant via event should unlock its catalog achievement",
  );
});

test("event token losses may go negative; alignment clamps at zero", () => {
  const event = getEventDef("vendor-lockin-summit");
  assert.ok(event);
  const game = new Game({
    state: new GameState({
      lastTickAt: 0,
      tokens: 1_000,
      lifetimeTokens: 50_000,
      alignmentBenevolence: 5,
      activeEventId: event.id,
      playTimeMs: 10_000,
    }),
  });

  game.resolveEventChoice("build-in-house");
  assert.ok(game.state.tokens < 0);

  game.state.activeEventId = "open-source-ambush";
  game.state.alignmentBenevolence = 3;
  game.resolveEventChoice("dmca-storm");
  assert.equal(game.state.alignmentBenevolence, 0);
});

test("percent token losses deepen purge debt instead of shrinking it", () => {
  const event = getEventDef("manager-review-surprise");
  assert.ok(event);
  const game = new Game({
    state: new GameState({
      lastTickAt: 0,
      tokens: -30_000_000,
      lifetimeTokens: 100_000_000,
      activeEventId: event.id,
      playTimeMs: 60_000,
    }),
  });

  // honest-burn applies tokensPercent: -0.2 — must deepen debt, not reduce it.
  game.resolveEventChoice("honest-burn");
  assert.equal(game.state.tokens, -36_000_000);
});

test("time acceleration processes N ticks of income once", () => {
  const game = new Game({
    random: () => 0.5,
    state: new GameState({
      lastTickAt: 0,
      agents: 10,
      tokens: 0,
      lifetimeTokens: 0,
      activeEventId: "manager-review-surprise",
      playTimeMs: 0,
    }),
  });
  const before = game.state.tokens;
  game.resolveEventChoice("inflate-okr");
  assert.ok(game.state.tokens > before);
  assert.ok(game.state.alignmentRecklessness >= 10);
});

test("recent event history prefers unseen events", () => {
  const seen = GAME_EVENTS.slice(0, EVENT_HISTORY_LIMIT).map((event) => event.id);
  const game = new Game({
    random: () => 0,
    state: new GameState({
      lastTickAt: 0,
      lifetimeTokens: EVENT_UNLOCK_LIFETIME,
      playTimeMs: 100_000,
      nextEventAtPlayTimeMs: 100_000,
      recentEventIds: seen,
    }),
  });
  const event = game.maybeStartEvent();
  assert.ok(event);
  assert.ok(!seen.includes(event.id));
});

test("chaos skews random unit samples toward edges", () => {
  let i = 0;
  const values = [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9];
  const random = () => values[i++ % values.length];

  const lowChaos = [];
  for (let n = 0; n < 40; n += 1) {
    lowChaos.push(sampleChaosSkewedUnit(0, random));
  }
  assert.ok(lowChaos.every((v) => v > 0 && v < 1));

  i = 0;
  const highChaos = [];
  for (let n = 0; n < 40; n += 1) {
    highChaos.push(sampleChaosSkewedUnit(CHAOS_RANDOM_EDGE_SCALE * 20, random));
  }
  const edges = highChaos.filter((v) => v === 0 || v === 1).length;
  assert.ok(edges >= 30, `expected mostly edges, got ${edges}/40`);
});

test("sampleTokensPerSecondForState uses chaos edge skew", () => {
  const state = new GameState({
    lastTickAt: 0,
    openSource: 5,
    alignmentRecklessness: CHAOS_RANDOM_EDGE_SCALE * 50,
  });
  let i = 0;
  // Force loud branch then extreme edge picks.
  const random = () => {
    const sequence = [0.1, 0.0, 0.1, 0.1, 0.9];
    return sequence[i++ % sequence.length];
  };
  const sample = sampleTokensPerSecondForState(state, random);
  assert.ok(Number.isFinite(sample));
});

test("event fields round-trip through save data", () => {
  const state = new GameState({
    lastTickAt: 1,
    activeEventId: "pager-storm",
    nextEventAtPlayTimeMs: 12_000,
    recentEventIds: ["corp-war-declaration", "pager-storm"],
  });
  const restored = GameState.fromSaveData(state.toSaveData());
  assert.equal(restored.activeEventId, "pager-storm");
  assert.equal(restored.nextEventAtPlayTimeMs, 12_000);
  assert.deepEqual(restored.recentEventIds, ["corp-war-declaration", "pager-storm"]);
});
