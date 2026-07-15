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
  TICKS_PER_SECOND,
  getAgentCost,
  getModelCertificationCost,
  getModelMultiplier,
  getNextModel,
  getRuleCost,
} from "../js/resources.js";

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

test("load returns false when there is no save", () => {
  const game = new Game({ clock: new ManualClock(0), storage: new MemoryStorage() });
  assert.equal(game.load(), false);
});

test("engine works with no storage injected (save/load are no-ops)", () => {
  const game = new Game({ clock: new ManualClock(0) });
  assert.equal(game.save(), false);
  assert.equal(game.load(), false);
});
