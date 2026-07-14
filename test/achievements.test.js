import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ACHIEVEMENT_DEFS,
  TOKEN_MILESTONE_DEFS,
  evaluateAchievements,
  getAchievementDef,
  getJobSubtitle,
  getJobTitle,
} from "../js/achievements.js";
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

test("evaluateAchievements unlocks all token power-of-10 milestones up to current total", () => {
  const state = new GameState({ tokens: 100_000 });
  const unlocked = evaluateAchievements(state, "tick");

  assert.deepEqual(
    unlocked.map((def) => def.id),
    TOKEN_MILESTONE_DEFS.filter((m) => m.threshold <= 100_000).map((m) => m.id),
  );
});

test("evaluateAchievements unlocks billion-token milestone", () => {
  const state = new GameState({ tokens: 1_000_000_000 });
  const unlocked = evaluateAchievements(state, "tick");

  assert.ok(unlocked.some((def) => def.id === "tokens-1b"));
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

test("getJobTitle advances only on token milestone achievements", () => {
  const fresh = new GameState();
  assert.equal(getJobTitle(fresh), "Software Engineer II");

  const withPrompt = new GameState({ achievements: ["first-prompt", "first-rule", "first-agent"] });
  assert.equal(getJobTitle(withPrompt), "Software Engineer II");

  const senior = new GameState({ achievements: ["tokens-100"] });
  assert.equal(getJobTitle(senior), "Senior Software Engineer");

  const cto = new GameState({ achievements: ["tokens-1b"] });
  assert.equal(getJobTitle(cto), "Chief Token Officer");
});

test("getJobSubtitle formats company, title, and model", () => {
  const state = new GameState({ achievements: ["tokens-1k"], modelTier: 1 });
  assert.equal(getJobSubtitle(state), "Big Tech Corp — Staff Engineer · Vif 4.0");
});

test("achievement catalog has fifteen milestones", () => {
  assert.equal(ACHIEVEMENT_DEFS.length, 15);
});

test("token milestones cover every power of ten through one billion", () => {
  const thresholds = TOKEN_MILESTONE_DEFS.map((m) => m.threshold);
  assert.deepEqual(thresholds, [
    1,
    10,
    100,
    1_000,
    10_000,
    100_000,
    1_000_000,
    10_000_000,
    100_000_000,
    1_000_000_000,
  ]);
});
