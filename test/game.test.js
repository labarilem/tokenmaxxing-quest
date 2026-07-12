import { test } from "node:test";
import assert from "node:assert/strict";

import { Game } from "../js/game.js";
import { GameState } from "../js/state.js";
import { ManualClock } from "../js/clock.js";
import { MemoryStorage } from "../js/storage.js";
import { AGENT, AUTOSAVE_TICKS, OFFLINE_CAP_MS, TICKS_PER_SECOND } from "../js/resources.js";

/**
 * Run a whole number of seconds of tick loop against a ManualClock, advancing
 * simulated time by one tick each step. No real time passes.
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

test("sendPrompt adds one token per call and unlocks first-prompt once", () => {
  const game = new Game({ clock: new ManualClock(0) });
  const first = game.sendPrompt();
  assert.equal(first.length, 1);
  assert.equal(first[0].id, "first-prompt");
  assert.deepEqual(game.sendPrompt(), []);
  assert.deepEqual(game.sendPrompt(), []);
  assert.equal(game.tokens, 3);
  assert.equal(game.state.hasAchievement("first-prompt"), true);
});

test("buyAgent fails when tokens are insufficient", () => {
  const game = new Game({ clock: new ManualClock(0) });
  assert.equal(game.canBuyAgent(), false);
  const result = game.buyAgent();
  assert.equal(result.purchased, false);
  assert.deepEqual(result.unlocked, []);
  assert.equal(game.agents, 0);
  assert.equal(game.tokens, 0);
});

test("buyAgent spends tokens, increments agents, and raises the rate", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ tokens: AGENT.baseCost, lastTickAt: 0 }),
  });

  assert.equal(game.tokensPerSecond, 0);
  const result = game.buyAgent();
  assert.equal(result.purchased, true);

  assert.equal(game.agents, 1);
  assert.equal(game.tokens, 0);
  assert.equal(game.tokensPerSecond, AGENT.tokensPerSecond);
});

test("ticks accrue passive tokens using a mocked clock (no real waiting)", () => {
  const clock = new ManualClock(0);
  const game = new Game({
    clock,
    state: new GameState({ agents: 2, lastTickAt: 0 }),
  });

  runSeconds(game, clock, 3); // 2 agents * 1 tok/s * 3s = 6

  assert.ok(Math.abs(game.tokens - 6) < 1e-9, `expected ~6, got ${game.tokens}`);
  assert.equal(game.state.lastTickAt, 3000);
});

test("idle game does not accrue tokens from ticks", () => {
  const clock = new ManualClock(0);
  const game = new Game({ clock, state: new GameState({ lastTickAt: 0 }) });
  runSeconds(game, clock, 10);
  assert.equal(game.tokens, 0);
});

test("applyOfflineProgress credits elapsed time via the clock", () => {
  const clock = new ManualClock(0);
  const game = new Game({ clock, state: new GameState({ agents: 1, lastTickAt: 0 }) });

  clock.setTime(10_000); // 10 seconds elapsed
  game.applyOfflineProgress();

  assert.ok(Math.abs(game.tokens - 10) < 1e-9, `expected ~10, got ${game.tokens}`);
  assert.equal(game.state.lastTickAt, 10_000);
});

test("offline progress is capped at OFFLINE_CAP_MS", () => {
  const clock = new ManualClock(0);
  const game = new Game({ clock, state: new GameState({ agents: 1, lastTickAt: 0 }) });

  clock.setTime(OFFLINE_CAP_MS + 5_000_000); // way past the cap
  game.applyOfflineProgress();

  const expected = OFFLINE_CAP_MS / 1000; // 1 tok/s for the capped window
  assert.ok(Math.abs(game.tokens - expected) < 1e-6, `expected ~${expected}, got ${game.tokens}`);
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
      agents: 3,
      lastTickAt: 1000,
      achievements: ["first-prompt"],
    }),
  });
  assert.equal(writer.save(), true);

  // Fresh engine, same clock time -> no offline gain, exact roundtrip.
  const reader = new Game({ clock: new ManualClock(1000), storage });
  assert.equal(reader.load(), true);
  assert.equal(reader.tokens, 42);
  assert.equal(reader.agents, 3);
  assert.equal(reader.state.hasAchievement("first-prompt"), true);
});

test("load applies offline progress based on the clock delta", () => {
  const storage = new MemoryStorage();

  const writer = new Game({
    clock: new ManualClock(1_000),
    storage,
    state: new GameState({ tokens: 0, agents: 1, lastTickAt: 1_000 }),
  });
  assert.equal(writer.save(), true);

  // Reader boots 30s later: 1 agent * 30s = 30 offline tokens.
  const reader = new Game({ clock: new ManualClock(31_000), storage });
  assert.equal(reader.load(), true);
  assert.ok(Math.abs(reader.tokens - 30) < 1e-9, `expected ~30, got ${reader.tokens}`);
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
