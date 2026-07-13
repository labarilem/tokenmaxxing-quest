import { test } from "node:test";
import assert from "node:assert/strict";

import { ACHIEVEMENT_DEFS, evaluateAchievements, getAchievementDef } from "../js/achievements.js";
import { GameState } from "../js/state.js";

test("getAchievementDef returns known definitions", () => {
  const def = getAchievementDef("first-prompt");
  assert.ok(def);
  assert.equal(def.id, "first-prompt");
});

test("evaluateAchievements unlocks first-prompt on sendPrompt trigger", () => {
  const state = new GameState();
  const unlocked = evaluateAchievements(state, "sendPrompt");

  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].id, "first-prompt");
});

test("evaluateAchievements unlocks first-rule on buyRule trigger", () => {
  const state = new GameState({ rules: 1 });
  const unlocked = evaluateAchievements(state, "buyRule");

  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].id, "first-rule");
});

test("evaluateAchievements unlocks first-agent on buyAgent trigger", () => {
  const state = new GameState({ agents: 1 });
  const unlocked = evaluateAchievements(state, "buyAgent");

  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].id, "first-agent");
});

test("evaluateAchievements unlocks token milestones at 1k, 10k, and 100k", () => {
  const state = new GameState({ tokens: 100_000 });
  const unlocked = evaluateAchievements(state, "tick");

  assert.deepEqual(
    unlocked.map((def) => def.id),
    ["tokens-100", "tokens-1k", "tokens-10k", "tokens-100k"],
  );
});

test("evaluateAchievements unlocks agent fleet at 25 agents", () => {
  const state = new GameState({ agents: 25 });
  const unlocked = evaluateAchievements(state, "tick");

  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].id, "agent-fleet");
});

test("evaluateAchievements does not re-unlock an earned achievement", () => {
  const state = new GameState({ achievements: ["first-prompt"] });
  const unlocked = evaluateAchievements(state, "sendPrompt");

  assert.equal(unlocked.length, 0);
});

test("achievement catalog has eight milestones", () => {
  assert.equal(ACHIEVEMENT_DEFS.length, 8);
});
