import { test } from "node:test";
import assert from "node:assert/strict";

import { Game } from "../js/game.js";
import { GameState } from "../js/state.js";
import { ManualClock } from "../js/clock.js";
import { MemoryStorage } from "../js/storage.js";
import {
  AGENT,
  AUTOSAVE_TICKS,
  RULE,
  TEST_MODE_TOKENS,
  TICKS_PER_SECOND,
  getAgentCost,
  getModelCertificationCost,
  getModelMultiplier,
  getNextModel,
  getRuleCost,
} from "../js/resources.js";
import { ALL_CATALOG, CAPSTONES } from "../js/upgrades.js";

/**
 * @param {Game} game
 * @param {ManualClock} clock
 * @param {number} seconds
 */
function runSeconds(game, clock, seconds) {
  const ticks = seconds * TICKS_PER_SECOND;
  const stepMs = 1000 / TICKS_PER_SECOND;
  for (let i = 0; i < ticks; i++) {
    clock.advance(stepMs);
    game.tick();
  }
}

test("sendPrompt adds base tokens and unlocks first-prompt once", () => {
  const game = new Game({ clock: new ManualClock(0) });
  const first = game.sendPrompt();
  assert.equal(first.length, 2);
  assert.deepEqual(
    first.map((def) => def.id),
    ["first-prompt", "tokens-1"],
  );
  assert.equal(game.tokens, 1);
  assert.deepEqual(game.sendPrompt(), []);
  assert.equal(game.tokens, 2);
});

test("sendPrompt counts manual clicks for run stats", () => {
  const game = new Game({ clock: new ManualClock(0) });
  game.sendPrompt();
  game.sendPrompt();
  assert.equal(game.state.totalClicks, 2);
});

test("clicks are not counted once the run is complete", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ tokens: 100, strategyPath: "purge", lastTickAt: 0 }),
  });
  game.sendPrompt();
  assert.equal(game.state.totalClicks, 0);
});

test("ticks accrue focused play time but ignore large away gaps", () => {
  const clock = new ManualClock(0);
  const game = new Game({ clock, state: new GameState({ lastTickAt: 0 }) });

  runSeconds(game, clock, 2);
  assert.equal(game.state.playTimeMs, 2000);

  // Simulate returning after being away: the reference is synced, so the gap
  // is not credited as play time.
  clock.setTime(clock.now() + 60_000);
  game.syncLastTickAt();
  clock.advance(200);
  game.tick();
  assert.equal(game.state.playTimeMs, 2200);
});

test("anomalous tick gaps skip income as well as play time", () => {
  const clock = new ManualClock(0);
  const game = new Game({
    clock,
    state: new GameState({ agents: 10, tokens: 0, lifetimeTokens: 0, lastTickAt: 0 }),
  });

  // Jump far past the focused-tick cap without syncing — neither play time
  // nor passive income should apply for that stale gap.
  clock.setTime(60_000);
  game.tick();
  assert.equal(game.state.playTimeMs, 0);
  assert.equal(game.state.tokens, 0);
  assert.equal(game.state.lastTickAt, 60_000);
});

test("sendPrompt scales with owned rules", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ rules: 2, lastTickAt: 0 }),
  });
  game.sendPrompt();
  assert.equal(game.tokens, 3);
});

test("buyRule fails when tokens are insufficient", () => {
  const game = new Game({ clock: new ManualClock(0) });
  assert.equal(game.canBuyRule(), false);
  const result = game.buyRule();
  assert.equal(result.purchased, false);
  assert.equal(game.rules, 0);
});

test("buyRule spends tokens, increments rules, and boosts click power", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ tokens: getRuleCost(0), lastTickAt: 0 }),
  });

  const result = game.buyRule();
  assert.equal(result.purchased, true);
  assert.equal(result.unlocked[0].id, "first-rule");
  assert.equal(game.rules, 1);
  assert.equal(game.tokens, 0);
  assert.equal(game.tokensPerClick, 2);
  assert.equal(game.ruleCost, getRuleCost(1));
});

test("model multiplier boosts click and passive income", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ rules: 2, agents: 2, modelTier: 2, lastTickAt: 0 }),
  });
  assert.equal(game.modelMultiplier, getModelMultiplier(2));
  assert.equal(game.tokensPerClick, 3 * getModelMultiplier(2));
  assert.equal(game.tokensPerSecond, 2 * getModelMultiplier(2));
});

test("buyModel requires agent gate and tokens, resets agents, keeps rules", () => {
  const next = getNextModel(0);
  assert.ok(next);
  const cost = getModelCertificationCost(next);
  assert.ok(cost !== undefined);
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: cost - 1,
      agents: next.agentGate,
      rules: 7,
      lastTickAt: 0,
    }),
  });
  assert.equal(game.canBuyModel(), false);

  game.state.tokens = cost;
  assert.equal(game.canBuyModel(), true);

  const result = game.buyModel();
  assert.equal(result.purchased, true);
  assert.equal(result.unlocked[0].id, "first-model");
  assert.equal(game.modelTier, 1);
  assert.equal(game.agents, 0);
  assert.equal(game.rules, 7);
  assert.equal(game.tokens, 0);
  assert.equal(game.modelMultiplier, getModelMultiplier(1));
});

test("buyModel fails when agent gate is not met", () => {
  const next = getNextModel(0);
  assert.ok(next);
  const cost = getModelCertificationCost(next);
  assert.ok(cost !== undefined);
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: cost,
      agents: next.agentGate - 1,
      lastTickAt: 0,
    }),
  });
  assert.equal(game.canBuyModel(), false);
  const result = game.buyModel();
  assert.equal(result.purchased, false);
  assert.equal(game.modelTier, 0);
});

test("buyAgent fails when tokens are insufficient", () => {
  const game = new Game({ clock: new ManualClock(0) });
  assert.equal(game.canBuyAgent(), false);
  const result = game.buyAgent();
  assert.equal(result.purchased, false);
  assert.equal(game.agents, 0);
});

test("buyAgent spends tokens, increments agents, and raises passive rate", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ tokens: getAgentCost(0), lastTickAt: 0 }),
  });

  const result = game.buyAgent();
  assert.equal(result.purchased, true);
  assert.equal(game.agents, 1);
  assert.equal(game.tokens, 0);
  assert.equal(game.tokensPerSecond, AGENT.tokensPerSecond);
  assert.equal(game.agentCost, getAgentCost(1));
});

test("agent cost rises after each purchase", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ tokens: 500, lastTickAt: 0 }),
  });

  const firstCost = game.agentCost;
  game.buyAgent();
  assert.ok(game.agentCost > firstCost);
});

test("milestone bonuses increase passive output at 25 agents", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ agents: 25, lastTickAt: 0 }),
  });
  assert.equal(game.tokensPerSecond, 50);
});

test("ticks accrue passive tokens using a mocked clock (no real waiting)", () => {
  const clock = new ManualClock(0);
  const game = new Game({
    clock,
    state: new GameState({ agents: 2, lastTickAt: 0 }),
  });

  runSeconds(game, clock, 3);

  assert.ok(Math.abs(game.tokens - 6) < 1e-9, `expected ~6, got ${game.tokens}`);
  assert.equal(game.state.lastTickAt, 3000);
});

test("ticks with net-negative rate drain the spendable balance", () => {
  const clock = new ManualClock(0);
  const game = new Game({
    clock,
    random: () => 0.99,
    state: new GameState({
      lastTickAt: 0,
      tokens: 50,
      lifetimeTokens: 1_000,
      agents: 2, // +2/s
      modelSunsets: 1, // −12/s → net −10/s
    }),
  });
  assert.equal(game.tokensPerSecond, -10);
  runSeconds(game, clock, 2);
  assert.ok(Math.abs(game.tokens - 30) < 1e-9, `expected 30, got ${game.tokens}`);
});

test("idle game does not accrue tokens from ticks", () => {
  const clock = new ManualClock(0);
  const game = new Game({ clock, state: new GameState({ lastTickAt: 0 }) });
  runSeconds(game, clock, 10);
  assert.equal(game.tokens, 0);
});

test("syncLastTickAt updates lastTickAt without crediting tokens", () => {
  const clock = new ManualClock(0);
  const game = new Game({ clock, state: new GameState({ agents: 1, tokens: 0, lastTickAt: 0 }) });

  clock.setTime(10_000);
  game.syncLastTickAt();

  assert.equal(game.tokens, 0);
  assert.equal(game.state.lastTickAt, 10_000);
});

test("load does not credit elapsed time while away", () => {
  const storage = new MemoryStorage();

  const writer = new Game({
    clock: new ManualClock(1_000),
    storage,
    state: new GameState({ tokens: 0, agents: 1, lastTickAt: 1_000 }),
  });
  assert.equal(writer.save(), true);

  const reader = new Game({ clock: new ManualClock(31_000), storage });
  assert.equal(reader.load(), true);
  assert.equal(reader.tokens, 0);
  assert.equal(reader.state.lastTickAt, 31_000);
});

test("shouldAutosave flips after AUTOSAVE_TICKS and resets on save", () => {
  const clock = new ManualClock(0);
  const storage = new MemoryStorage();
  const game = new Game({ clock, storage });

  for (let i = 0; i < AUTOSAVE_TICKS - 1; i++) {
    clock.advance(200);
    game.tick();
  }
  assert.equal(game.shouldAutosave(), false);

  clock.advance(200);
  game.tick();
  assert.equal(game.shouldAutosave(), true);

  assert.equal(game.save(), true);
  assert.equal(game.shouldAutosave(), false);
});

test("save and load roundtrip through an injected key/value store", () => {
  const storage = new MemoryStorage();

  const writer = new Game({
    clock: new ManualClock(1000),
    storage,
    state: new GameState({
      tokens: 42,
      rules: 2,
      agents: 3,
      lastTickAt: 1000,
      achievements: ["first-prompt"],
    }),
  });
  assert.equal(writer.save(), true);

  const reader = new Game({ clock: new ManualClock(1000), storage });
  assert.equal(reader.load(), true);
  assert.equal(reader.tokens, 42);
  assert.equal(reader.rules, 2);
  assert.equal(reader.agents, 3);
  assert.equal(reader.state.modelTier, 0);
  assert.equal(reader.state.hasAchievement("first-prompt"), true);
});

test("resetProgress clears resources and optionally keeps achievements", () => {
  const storage = new MemoryStorage();
  const clock = new ManualClock(5000);
  const game = new Game({
    clock,
    storage,
    state: new GameState({
      tokens: 100,
      rules: 2,
      agents: 3,
      lastTickAt: 1000,
      achievements: ["first-prompt"],
    }),
  });

  game.resetProgress({ keepAchievements: true });
  assert.equal(game.tokens, 0);
  assert.equal(game.rules, 0);
  assert.equal(game.agents, 0);
  assert.equal(game.modelTier, 0);
  assert.equal(game.state.hasAchievement("first-prompt"), true);
  assert.equal(game.state.lastTickAt, 5000);

  game.state.tokens = 50;
  game.state.rules = 1;
  game.state.agents = 2;
  game.state.modelTier = 2;
  game.resetProgress({ keepAchievements: true });
  assert.equal(game.modelTier, 2);

  game.state.tokens = 50;
  game.state.rules = 1;
  game.state.agents = 2;
  game.resetProgress({ keepAchievements: false });
  assert.equal(game.tokens, 0);
  assert.equal(game.rules, 0);
  assert.equal(game.agents, 0);
  assert.equal(game.modelTier, 0);
  assert.equal(game.state.hasAchievement("first-prompt"), false);

  const reloaded = new Game({ clock, storage });
  assert.equal(reloaded.load(), true);
  assert.equal(reloaded.tokens, 0);
  assert.equal(reloaded.state.hasAchievement("first-prompt"), false);
});

test("new-game reset clears catalog upgrades but keeps model click multiplier", () => {
  const game = new Game({
    clock: new ManualClock(0),
    storage: new MemoryStorage(),
    state: new GameState({
      tokens: 1_000_000,
      rules: 12,
      agents: 40,
      modelTier: 2,
      contexts: 5,
      swarms: 8,
      bloats: 3,
      alignmentRecklessness: 40,
      strategyPath: "oops",
      achievements: ["first-prompt", "model-citizen"],
      lastTickAt: 0,
    }),
  });

  game.resetProgress({ keepAchievements: true });

  assert.equal(game.rules, 0);
  assert.equal(game.agents, 0);
  assert.equal(game.state.contexts, 0);
  assert.equal(game.state.swarms, 0);
  assert.equal(game.state.bloats, 0);
  assert.equal(game.state.alignmentRecklessness, 0);
  assert.equal(game.state.strategyPath, null);
  assert.equal(game.modelTier, 2);
  assert.equal(game.tokensPerClick, getModelMultiplier(2));

  game.sendPrompt();
  assert.equal(game.tokens, getModelMultiplier(2));
});

test("full reset restores base +1 token per prompt", () => {
  const game = new Game({
    clock: new ManualClock(0),
    storage: new MemoryStorage(),
    state: new GameState({
      tokens: 50_000,
      rules: 4,
      agents: 10,
      modelTier: 3,
      contexts: 2,
      achievements: ["first-prompt"],
      lastTickAt: 0,
    }),
  });

  game.resetProgress({ keepAchievements: false });

  assert.equal(game.modelTier, 0);
  assert.equal(game.tokensPerClick, 1);
  game.sendPrompt();
  assert.equal(game.tokens, 1);
});

test("startTestMode resets to starting state with 100B tokens", () => {
  const clock = new ManualClock(7000);
  const game = new Game({
    clock,
    state: new GameState({ tokens: 5, rules: 9, agents: 4, modelTier: 3, lastTickAt: 1000 }),
  });

  game.startTestMode();

  assert.equal(game.testMode, true);
  assert.equal(game.tokens, TEST_MODE_TOKENS);
  assert.equal(game.state.lifetimeTokens, TEST_MODE_TOKENS);
  assert.equal(game.rules, 0);
  assert.equal(game.agents, 0);
  assert.equal(game.modelTier, 0);
  assert.equal(game.state.lastTickAt, 7000);
});

test("test mode unlocks every catalog upgrade and capstone gate", () => {
  const game = new Game({ clock: new ManualClock(0), testMode: true });
  game.startTestMode();

  for (const entry of ALL_CATALOG) {
    assert.equal(game.isCatalogVisible(entry), true, `${entry.id} should be visible`);
    assert.equal(game.isCatalogUnlocked(entry), true, `${entry.id} should be unlocked`);
    assert.equal(game.canBuyCatalog(entry), true, `${entry.id} should be buyable`);
  }

  for (const capstone of CAPSTONES) {
    assert.equal(game.isCapstoneGateMet(capstone), true, `${capstone.id} gate should pass`);
    assert.equal(game.canBuyCapstone(capstone), true, `${capstone.id} should be buyable`);
  }

  assert.equal(game.state.agents, 0);
  assert.equal(game.canBuyModel(), true, "test mode should bypass model agent gates");
});

test("test mode does not persist progress to storage", () => {
  const storage = new MemoryStorage();
  const game = new Game({ clock: new ManualClock(0), storage, testMode: true });
  game.startTestMode();

  assert.equal(game.save(), false);
  assert.equal(storage.getItem(game.saveKey), null);
});

test("gates still apply when test mode is off", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ tokens: TEST_MODE_TOKENS, lastTickAt: 0 }),
  });
  const gated = ALL_CATALOG.find((entry) => entry.id === "swarm");
  assert.ok(gated);
  assert.equal(game.isCatalogVisible(gated), false);
  assert.equal(game.canBuyCatalog(gated), false);
});

test("load returns false when there is no save", () => {
  const game = new Game({ clock: new ManualClock(0), storage: new MemoryStorage() });
  assert.equal(game.load(), false);
});

test("engine works with no storage injected (save/load are no-ops)", () => {
  const game = new Game({ clock: new ManualClock(0) });
  assert.equal(game.save(), false);
  assert.equal(game.load(), false);
});
