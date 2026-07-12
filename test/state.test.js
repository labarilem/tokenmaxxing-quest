import { test } from "node:test";
import assert from "node:assert/strict";

import { GameState } from "../js/state.js";
import { SAVE_VERSION } from "../js/resources.js";

test("toSaveData emits the versioned save shape", () => {
  const state = new GameState({ tokens: 12, agents: 4, lastTickAt: 999, achievements: ["first-prompt"] });
  assert.deepEqual(state.toSaveData(), {
    version: SAVE_VERSION,
    tokens: 12,
    agents: 4,
    lastTickAt: 999,
    achievements: ["first-prompt"],
  });
});

test("fromSaveData restores valid fields", () => {
  const state = GameState.fromSaveData({
    tokens: 7,
    agents: 2,
    lastTickAt: 123,
    achievements: ["first-prompt"],
  });
  assert.equal(state.tokens, 7);
  assert.equal(state.agents, 2);
  assert.equal(state.lastTickAt, 123);
  assert.equal(state.hasAchievement("first-prompt"), true);
});

test("fromSaveData rejects invalid fields and uses fallbacks", () => {
  const state = GameState.fromSaveData(
    { tokens: -5, agents: 2.9, lastTickAt: "nope" },
    { lastTickAt: 555 },
  );
  assert.equal(state.tokens, 0); // negative rejected -> default
  assert.equal(state.agents, 2); // fractional floored
  assert.equal(state.lastTickAt, 555); // non-number -> fallback
});

test("fromSaveData tolerates non-object payloads", () => {
  for (const bad of [null, undefined, 42, "x", []]) {
    const state = GameState.fromSaveData(bad, { tokens: 1, agents: 1, lastTickAt: 1 });
    assert.equal(state.tokens, 1);
    assert.equal(state.agents, 1);
    assert.equal(state.lastTickAt, 1);
  }
});
