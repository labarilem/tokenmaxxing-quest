import { test } from "node:test";
import assert from "node:assert/strict";

import { evaluateAchievements, getAchievementDef } from "../js/achievements.js";
import { GameState } from "../js/state.js";

test("getAchievementDef returns the first-prompt definition", () => {
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

test("evaluateAchievements does not re-unlock an earned achievement", () => {
  const state = new GameState({ achievements: ["first-prompt"] });
  const unlocked = evaluateAchievements(state, "sendPrompt");

  assert.equal(unlocked.length, 0);
  assert.equal(state.achievements.size, 1);
});

test("evaluateAchievements returns nothing for unrelated triggers", () => {
  const state = new GameState();
  const unlocked = evaluateAchievements(state, "buyAgent");

  assert.equal(unlocked.length, 0);
  assert.equal(state.hasAchievement("first-prompt"), false);
});
