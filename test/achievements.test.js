import { test } from "node:test";
import assert from "node:assert/strict";

import { ACHIEVEMENT_DEFS, evaluateAchievements, getAchievementDef } from "../js/achievements.js";
import { GameState } from "../js/state.js";

test("getAchievementDef returns known definitions", () => {
  const def = getAchievementDef("first-prompt");
  assert.ok(def);
  assert.equal(def.id, "first-prompt");
  assert.equal(def.title, "Prompt Initiated");
});

test("evaluateAchievements unlocks first-prompt on sendPrompt trigger", () => {
  const state = new GameState();
  const unlocked = evaluateAchievements(state, "sendPrompt");

  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].id, "first-prompt");
  assert.equal(state.hasAchievement("first-prompt"), true);
});

test("evaluateAchievements unlocks first-agent on buyAgent trigger", () => {
  const state = new GameState({ agents: 1 });
  const unlocked = evaluateAchievements(state, "buyAgent");

  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].id, "first-agent");
});

test("evaluateAchievements unlocks token and agent milestones", () => {
  const state = new GameState({ tokens: 100, agents: 5 });
  const unlocked = evaluateAchievements(state, "tick");

  assert.equal(unlocked.length, 2);
  assert.deepEqual(
    unlocked.map((def) => def.id),
    ["tokens-100", "agent-pod"],
  );
});

test("evaluateAchievements does not re-unlock an earned achievement", () => {
  const state = new GameState({ achievements: ["first-prompt"] });
  const unlocked = evaluateAchievements(state, "sendPrompt");

  assert.equal(unlocked.length, 0);
  assert.equal(state.achievements.size, 1);
});

test("evaluateAchievements returns nothing for unrelated buyAgent state", () => {
  const state = new GameState();
  const unlocked = evaluateAchievements(state, "buyAgent");

  assert.equal(unlocked.length, 0);
  assert.equal(state.hasAchievement("first-prompt"), false);
});

test("achievement catalog has four hook-phase milestones", () => {
  assert.equal(ACHIEVEMENT_DEFS.length, 4);
});
