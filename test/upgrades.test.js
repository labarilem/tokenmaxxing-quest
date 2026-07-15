import { test } from "node:test";
import assert from "node:assert/strict";

import { Game } from "../js/game.js";
import { GameState } from "../js/state.js";
import { ManualClock } from "../js/clock.js";
import { getEndingDef, ENDING_DEFS } from "../js/endings.js";
import { getNextModel } from "../js/resources.js";
import {
  BENEVOLENCE_UPGRADES,
  CAPSTONE_REVEAL_TOKENS,
  CAPSTONES,
  POWER_UPGRADES,
} from "../js/upgrades.js";
import { getTokensPerClickForState, getTokensPerSecondForState } from "../js/resources.js";

test("buyCatalog applies benevolence alignment for open source grant", () => {
  const openSource = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "open-source");
  assert.ok(openSource);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({ tokens: openSource.baseCost, lifetimeTokens: 1_000, lastTickAt: 0 }),
  });

  const result = game.buyCatalog(openSource);
  assert.equal(result.purchased, true);
  assert.equal(game.state.openSource, 1);
  assert.equal(game.state.alignmentBenevolence, 15);
});

test("buyCatalog shifts recklessness for allow-all profile", () => {
  const allowAll = POWER_UPGRADES.find((entry) => entry.id === "allow-all");
  assert.ok(allowAll);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: allowAll.baseCost,
      modelTier: 5,
      lifetimeTokens: 1_000_000,
      lastTickAt: 0,
    }),
  });

  const result = game.buyCatalog(allowAll);
  assert.equal(result.purchased, true);
  assert.equal(game.state.alignmentRecklessness, 8);
});

test("swarm and cluster increase passive income", () => {
  const state = new GameState({ agents: 30, swarms: 2, clusters: 1, lastTickAt: 0 });
  const passive = getTokensPerSecondForState(state);
  assert.ok(passive > 30);
});

test("context expander increases click income", () => {
  const base = getTokensPerClickForState(new GameState({ rules: 50, lastTickAt: 0 }));
  const expanded = getTokensPerClickForState(new GameState({ rules: 50, contexts: 3, lastTickAt: 0 }));
  assert.ok(expanded > base);
});

test("buyCapstone commits utopia ending when benevolence gate is met", () => {
  const utopia = CAPSTONES.find((capstone) => capstone.path === "utopia");
  assert.ok(utopia);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: utopia.cost,
      lifetimeTokens: CAPSTONE_REVEAL_TOKENS,
      alignmentBenevolence: 120,
      lastTickAt: 0,
    }),
  });

  const result = game.buyCapstone(utopia);
  assert.equal(result.purchased, true);
  assert.equal(game.state.strategyPath, "utopia");
  assert.equal(game.isRunComplete, true);
  assert.equal(game.state.hasAchievement("ending-utopia"), true);
  assert.equal(result.ending?.id, "ending-utopia");
  assert.equal(getEndingDef("utopia")?.title, "Civic Future");
});

test("buyCapstone fails when another strategy is already committed", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: 1_000_000_000,
      lifetimeTokens: CAPSTONE_REVEAL_TOKENS,
      alignmentBenevolence: 200,
      alignmentPurge: 200,
      strategyPath: "oops",
      lastTickAt: 0,
    }),
  });

  const utopia = CAPSTONES.find((capstone) => capstone.path === "utopia");
  assert.ok(utopia);
  assert.equal(game.canBuyCapstone(utopia), false);
});

test("run actions stop after ending is committed", () => {
  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: 100,
      rules: 0,
      strategyPath: "purge",
      lastTickAt: 0,
    }),
  });

  assert.deepEqual(game.sendPrompt(), []);
  assert.equal(game.tokens, 100);
  assert.equal(game.buyRule().purchased, false);
});

test("buyModel works after new-game reset following an ending", () => {
  const next = getNextModel(0);
  assert.ok(next);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: 0,
      agents: 0,
      modelTier: 0,
      strategyPath: "utopia",
      achievements: ["ending-utopia"],
      lastTickAt: 0,
    }),
  });

  assert.equal(game.isRunComplete, true);
  assert.equal(game.canBuyModel(), false);

  game.resetProgress({ keepAchievements: true });

  assert.equal(game.isRunComplete, false);
  assert.equal(game.state.strategyPath, null);
  assert.equal(game.canAct(), true);

  game.state.tokens = next.cost;
  game.state.agents = next.agentGate;

  assert.equal(game.canBuyModel(), true);
  const result = game.buyModel();
  assert.equal(result.purchased, true);
  assert.equal(game.modelTier, 1);
});

test("each ending has a unique cutscene", () => {
  const cutscenes = ENDING_DEFS.map((def) => def.cutscene);
  assert.equal(new Set(cutscenes).size, cutscenes.length);
  for (const def of ENDING_DEFS) {
    assert.ok(def.cutscene.includes("[ACHIEVEMENT:"));
    assert.notEqual(def.cutscene, def.headline);
  }
});
