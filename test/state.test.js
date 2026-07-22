import { test } from "node:test";
import assert from "node:assert/strict";

import { GameState } from "../js/state.js";

test("toSaveData emits the save shape", () => {
  const state = new GameState({ tokens: 12, rules: 3, agents: 4, lastTickAt: 999, achievements: ["first-prompt"] });
  const save = state.toSaveData();
  assert.equal(save.tokens, 12);
  assert.equal(save.rules, 3);
  assert.equal(save.agents, 4);
  assert.equal(save.modelTier, 0);
  assert.equal(save.lastTickAt, 999);
  assert.deepEqual(save.achievements, ["first-prompt"]);
  assert.equal(save.lifetimeTokens, 0);
  assert.equal(save.strategyPath, null);
  assert.equal(save.alignmentBenevolence, 0);
});

test("toSaveData and fromSaveData roundtrip run stats", () => {
  const state = new GameState({ totalClicks: 42, playTimeMs: 61_000, lastTickAt: 1 });
  const save = state.toSaveData();
  assert.equal(save.totalClicks, 42);
  assert.equal(save.playTimeMs, 61_000);

  const restored = GameState.fromSaveData(save);
  assert.equal(restored.totalClicks, 42);
  assert.equal(restored.playTimeMs, 61_000);
});

test("fromSaveData defaults run stats and rejects invalid values", () => {
  const missing = GameState.fromSaveData({ tokens: 5 });
  assert.equal(missing.totalClicks, 0);
  assert.equal(missing.playTimeMs, 0);

  const invalid = GameState.fromSaveData({ totalClicks: -3, playTimeMs: "nope" });
  assert.equal(invalid.totalClicks, 0);
  assert.equal(invalid.playTimeMs, 0);
});

test("fromSaveData restores modelTier", () => {
  const state = GameState.fromSaveData({ modelTier: 2 });
  assert.equal(state.modelTier, 2);
});

test("fromSaveData clamps modelTier to the model ladder", () => {
  const state = GameState.fromSaveData({ modelTier: 99 });
  assert.equal(state.modelTier, 5);
});

test("fromSaveData restores valid fields", () => {
  const state = GameState.fromSaveData({
    tokens: 7,
    rules: 1,
    agents: 2,
    lastTickAt: 123,
    achievements: ["first-prompt"],
  });
  assert.equal(state.tokens, 7);
  assert.equal(state.rules, 1);
  assert.equal(state.agents, 2);
  assert.equal(state.lastTickAt, 123);
  assert.equal(state.hasAchievement("first-prompt"), true);
});

test("fromSaveData restores negative token balances for purge debt", () => {
  const state = GameState.fromSaveData(
    { tokens: -5, agents: 2.9, lastTickAt: "nope" },
    { lastTickAt: 555 },
  );
  assert.equal(state.tokens, -5);
  assert.equal(state.agents, 2); // fractional floored
  assert.equal(state.lastTickAt, 555); // non-number -> fallback
});

test("fromSaveData rejects non-finite numeric fields", () => {
  const infinite = GameState.fromSaveData(
    { tokens: 1e309, rules: Number.POSITIVE_INFINITY, agents: Number.NaN, lastTickAt: 1 },
    { tokens: 3, rules: 1, agents: 2, lastTickAt: 1 },
  );
  assert.equal(infinite.tokens, 3);
  assert.equal(infinite.rules, 1);
  assert.equal(infinite.agents, 2);
  assert.equal(Number.isFinite(infinite.lifetimeTokens), true);

  const debtWithoutLifetime = GameState.fromSaveData({ tokens: -100, lastTickAt: 1 });
  assert.equal(debtWithoutLifetime.tokens, -100);
  assert.equal(debtWithoutLifetime.lifetimeTokens, 0);
});

test("fromSaveData caps recentEventIds to history limit", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g"];
  const state = GameState.fromSaveData({ recentEventIds: ids, lastTickAt: 1 });
  assert.deepEqual(state.recentEventIds, ["c", "d", "e", "f", "g"]);
});

test("fromSaveData tolerates non-object payloads", () => {
  for (const bad of [null, undefined, 42, "x", []]) {
    const state = GameState.fromSaveData(bad, { tokens: 1, agents: 1, lastTickAt: 1 });
    assert.equal(state.tokens, 1);
    assert.equal(state.agents, 1);
    assert.equal(state.lastTickAt, 1);
  }
});
