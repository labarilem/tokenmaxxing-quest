import { test } from "node:test";
import assert from "node:assert/strict";

import { Game } from "../js/game.js";
import { GameState } from "../js/state.js";
import { ManualClock } from "../js/clock.js";
import { getEndingDef, ENDING_DEFS, formatEndingCutscene } from "../js/endings.js";
import { getModelCertificationCost, getNextModel } from "../js/resources.js";
import {
  ALL_CATALOG,
  BENEVOLENCE_UPGRADES,
  CAPSTONE_REVEAL_TOKENS,
  CAPSTONE_UTOPIA_PLAYTIME_MS,
  CAPSTONES,
  formatCatalogBenefit,
  getCatalogCost,
  POWER_UPGRADES,
  PURGE_UPGRADES,
} from "../js/upgrades.js";
import { getTokensPerClickForState, getTokensPerSecondForState } from "../js/resources.js";

test("buyCatalog applies benevolence alignment for open source grant", () => {
  const openSource = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "open-source");
  assert.ok(openSource);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: getCatalogCost(openSource, 0),
      lifetimeTokens: 1_000,
      lastTickAt: 0,
    }),
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
      tokens: getCatalogCost(allowAll, 0),
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

test("exoplanet farm increases passive income", () => {
  const state = new GameState({ exoplanetFarms: 2, lastTickAt: 0 });
  const passive = getTokensPerSecondForState(state);
  assert.ok(passive >= 500);
});

test("galaxy cast increases click income", () => {
  const base = getTokensPerClickForState(new GameState({ lastTickAt: 0 }));
  const expanded = getTokensPerClickForState(new GameState({ galaxyCasts: 2, lastTickAt: 0 }));
  assert.ok(expanded > base);
});

test("white magic grant increases benevolence alignment", () => {
  const ward = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "ward-sanctuary");
  assert.ok(ward);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: getCatalogCost(ward, 0),
      lifetimeTokens: 500_000,
      lastTickAt: 0,
    }),
  });

  const result = game.buyCatalog(ward);
  assert.equal(result.purchased, true);
  assert.equal(game.state.alignmentBenevolence, 10);
});

test("black magic cache increases purge alignment", () => {
  const curse = PURGE_UPGRADES.find((entry) => entry.id === "curse-cache");
  assert.ok(curse);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: getCatalogCost(curse, 0),
      lifetimeTokens: 250_000,
      lastTickAt: 0,
    }),
  });

  const result = game.buyCatalog(curse);
  assert.equal(result.purchased, true);
  assert.equal(game.state.alignmentPurge, 15);
});

test("buyCapstone commits utopia ending when benevolence gate is met", () => {
  const utopia = CAPSTONES.find((capstone) => capstone.path === "utopia");
  assert.ok(utopia);

  const game = new Game({
    clock: new ManualClock(0),
    state: new GameState({
      tokens: utopia.cost,
      lifetimeTokens: CAPSTONE_REVEAL_TOKENS,
      alignmentBenevolence: 420,
      capstoneBriefingSuites: 1,
      ethicsSummits: 1,
      stewardshipCovenants: 1,
      playTimeMs: CAPSTONE_UTOPIA_PLAYTIME_MS,
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

  const cost = getModelCertificationCost(next);
  assert.ok(cost !== undefined);
  game.state.tokens = cost;
  game.state.agents = next.agentGate;

  assert.equal(game.canBuyModel(), true);
  const result = game.buyModel();
  assert.equal(result.purchased, true);
  assert.equal(game.modelTier, 1);
});

test("no catalog upgrade describes destroying or reducing tokens (plot rule)", () => {
  // Plot rule (docs/DESIGN.md): every upgrade must be framed as increasing LLM
  // token generation. Names/descriptions must not describe destroying, disposing,
  // deprecating, wiping, blocking, or repurchasing tokens/models/prompts/data.
  const forbidden = [
    /\bdispos(e|al|ing|ed)\b/i,
    /\bredact/i,
    /\bdeprecat/i,
    /\bwip(e|ed|ing)\b/i,
    /\bdelet(e|ed|ing)\b/i,
    /\bbuyback\b/i,
    /\brepurchas/i,
    /\bshut ?down\b/i,
    /\bkill switch\b/i,
    /\blose the keys\b/i,
    /\bblock\w*\s+(hostile\s+)?prompts?\b/i,
    /\bmodels?\s+die\b/i,
  ];

  for (const entry of ALL_CATALOG) {
    const text = `${entry.name} ${entry.description}`;
    for (const pattern of forbidden) {
      assert.ok(
        !pattern.test(text),
        `Upgrade "${entry.id}" violates the token-positive plot rule (matched ${pattern}): "${text}"`,
      );
    }
  }
});

test("purge upgrades drain tokens and never grant positive percent income", () => {
  for (const entry of PURGE_UPGRADES) {
    assert.ok(
      (entry.passivePerOwned ?? 0) < 0,
      `${entry.id} should have negative passivePerOwned`,
    );
    assert.equal(
      entry.incomePercentPerOwned,
      undefined,
      `${entry.id} must not have incomePercentPerOwned`,
    );
    assert.equal(
      entry.randomPassivePerOwned,
      undefined,
      `${entry.id} must not have randomPassivePerOwned`,
    );
  }
});

test("benevolence percent grants are fixed; flat grants are random; alignment-only boost good", () => {
  for (const entry of BENEVOLENCE_UPGRADES) {
    const hasRandomFlat = (entry.randomPassivePerOwned ?? 0) > 0;
    const hasFixedPercent = (entry.incomePercentPerOwned ?? 0) > 0;
    const hasDeterministicPassive = (entry.passivePerOwned ?? 0) > 0;
    const hasTokenBonus = hasRandomFlat || hasFixedPercent || hasDeterministicPassive;

    assert.equal(
      /** @type {Record<string, unknown>} */ (entry).randomIncomePercentPerOwned,
      undefined,
      `${entry.id} must not use random percent income`,
    );
    assert.ok(
      !hasDeterministicPassive,
      `${entry.id} should not use deterministic passivePerOwned`,
    );

    if (!hasTokenBonus) {
      assert.ok(
        (entry.alignment?.benevolence ?? 0) >= 50,
        `${entry.id} is alignment-only and should grant higher good`,
      );
    } else {
      assert.ok(
        hasRandomFlat || hasFixedPercent,
        `${entry.id} should grant random flat or fixed percent income`,
      );
      if (hasFixedPercent) {
        assert.ok(!hasRandomFlat, `${entry.id} should not mix random flat with fixed %`);
      }
    }
  }
});

test("formatCatalogBenefit drops avg and uses short alignment names", () => {
  const openSource = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "open-source");
  const publicApi = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "public-api");
  const ethics = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "ethics-summit");
  assert.ok(openSource && publicApi && ethics);

  const empty = new GameState({ lastTickAt: 0 });
  const randomLabel = formatCatalogBenefit(openSource, empty);
  assert.match(randomLabel, /~0\u2013[1-9]\d* token\/s \(random\)/);
  assert.ok(!/avg/i.test(randomLabel));
  assert.match(randomLabel, /good/);

  const percentLabel = formatCatalogBenefit(publicApi, empty);
  assert.match(percentLabel, /\+[\d.]+% all tokens/);
  assert.ok(!/random/i.test(percentLabel));

  const alignmentOnly = formatCatalogBenefit(ethics, empty);
  assert.equal(alignmentOnly.includes("token"), false);
  assert.match(alignmentOnly, /\+\d+ good/);
});

test("each ending has a unique cutscene", () => {
  const cutscenes = ENDING_DEFS.map((def) => def.cutscene);
  assert.equal(new Set(cutscenes).size, cutscenes.length);
  for (const def of ENDING_DEFS) {
    assert.ok(def.cutscene.includes("[ACHIEVEMENT:"));
    assert.notEqual(def.cutscene, def.headline);
  }
});

test("formatEndingCutscene renders structured readable HTML", () => {
  const html = formatEndingCutscene(getEndingDef("oops").cutscene);

  assert.ok(html.includes('class="ending-cutscene__section"'));
  assert.ok(html.includes("HOW WE GOT HERE"));
  assert.ok(html.includes('class="ending-cutscene__para"'));
  assert.ok(html.includes('class="ending-cutscene__command"'));
  assert.ok(html.includes("orchestrate.sh"));
  assert.ok(html.includes('class="ending-cutscene__dialogue"'));
  assert.ok(html.includes('class="ending-cutscene__speaker"'));
  assert.ok(html.includes("AGENT"));
  assert.ok(html.includes('class="ending-cutscene__achievement"'));
  assert.ok(html.includes("ACHIEVEMENT: Universe Deleted"));
  assert.ok(!html.includes("<script"));
});
