import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGENT,
  RULE,
  TICK_MS,
  formatAffordHint,
  formatClickBenefit,
  formatModelPanelLabel,
  formatNumber,
  formatPassiveBenefit,
  formatRate,
  getAgentCost,
  getCurrentModel,
  getIncomeMultiplier,
  getMarginalClickGain,
  getMarginalPassiveGain,
  getModelMultiplier,
  getNextModel,
  getRuleCost,
  getTokensPerClick,
  getTokensPerClickForState,
  getTokensPerSecond,
  getTokensPerSecondForState,
  getUpgradeMultiplier,
  getNextAgentMilestone,
  getNextRuleMilestone,
  sampleTokensPerSecondForState,
  secondsUntilAffordable,
} from "../js/resources.js";
import { GameState } from "../js/state.js";
import { ManualClock } from "../js/clock.js";
import { Game } from "../js/game.js";
import { POWER_UPGRADES } from "../js/upgrades.js";

test("formatNumber always shows full digits with grouping", () => {
  assert.equal(formatNumber(999), "999");
  assert.equal(formatNumber(1000), "1,000");
  assert.equal(formatNumber(1_234_567), "1,234,567");
});

test("formatNumber keeps fractional tokens so display cannot skip integers", () => {
  assert.equal(formatNumber(1.15), "1.15");
  assert.equal(formatNumber(6.9), "6.9");
  assert.equal(formatNumber(8.05), "8.05");
  assert.equal(formatNumber(1_000.25), "1,000.25");
  // Float noise snaps to 2 decimals instead of flooring away.
  assert.equal(formatNumber(1.1500000002), "1.15");
});

test("getRuleCost grows exponentially and stays cheaper than agents early", () => {
  assert.equal(getRuleCost(0), RULE.baseCost);
  assert.ok(getRuleCost(0) < getAgentCost(0));
  assert.equal(getRuleCost(1), Math.ceil(RULE.baseCost * RULE.costGrowthRate));
});

test("getAgentCost is pricier than before", () => {
  assert.equal(getAgentCost(0), 75);
  assert.ok(getAgentCost(0) > getRuleCost(0) * 5);
});

test("rule milestones require a larger fleet than the old agent thresholds", () => {
  assert.equal(getUpgradeMultiplier(RULE, 14), 1);
  assert.equal(getUpgradeMultiplier(RULE, 15), 2);
  assert.equal(getUpgradeMultiplier(RULE, 40), 4);
});

test("agent milestones require a larger fleet", () => {
  assert.equal(getUpgradeMultiplier(AGENT, 24), 1);
  assert.equal(getUpgradeMultiplier(AGENT, 25), 2);
  assert.equal(getUpgradeMultiplier(AGENT, 60), 4);
});

test("getTokensPerClick scales with rules and milestones", () => {
  assert.equal(getTokensPerClick(0), 1);
  assert.equal(getTokensPerClick(3), 4);
  assert.equal(getTokensPerClick(15), 31);
});

test("getTokensPerSecond applies agent milestone multipliers", () => {
  assert.equal(getTokensPerSecond(2), 2);
  assert.equal(getTokensPerSecond(25), 50);
  assert.equal(getTokensPerSecond(60), 240);
});

test("getNextRuleMilestone and getNextAgentMilestone return upcoming thresholds", () => {
  assert.equal(getNextRuleMilestone(0)?.at, 15);
  assert.equal(getNextAgentMilestone(0)?.at, 25);
  assert.equal(getNextAgentMilestone(60), null);
});

test("formatAffordHint suggests prompts and passive income", () => {
  assert.equal(formatAffordHint(0, 0, 1), "Ready to buy.");
  assert.match(formatAffordHint(8, 0, 1), /8 prompts/);
  assert.match(formatAffordHint(10, 2, 1), /passive/);
});

test("getMarginalClickGain and getMarginalPassiveGain reflect next purchase", () => {
  assert.equal(getMarginalClickGain(0), 1);
  assert.equal(getMarginalClickGain(14), 16);
  assert.equal(getMarginalPassiveGain(0), 1);
  assert.equal(getMarginalPassiveGain(24), 26);
});

test("formatClickBenefit and formatPassiveBenefit label upgrade gains", () => {
  assert.equal(formatClickBenefit(1), "+1 token/click");
  assert.equal(formatClickBenefit(16), "+16 token/click");
  assert.equal(formatPassiveBenefit(1), "+1 token/s");
  assert.equal(formatPassiveBenefit(26), "+26 token/s");
});

test("secondsUntilAffordable estimates passive wait time", () => {
  assert.equal(secondsUntilAffordable(20, 25, 1), 5);
  assert.equal(secondsUntilAffordable(30, 25, 1), 0);
  assert.equal(secondsUntilAffordable(0, 25, 0), Infinity);
});

test("model ladder uses short French names and gates aligned to fleet milestones", () => {
  assert.equal(getCurrentModel(0).name, "Clair");
  assert.equal(getCurrentModel(0).version, "3.5");
  assert.equal(getNextModel(0)?.name, "Vif");
  assert.equal(getNextModel(0)?.agentGate, 12);
  assert.equal(getNextModel(1)?.agentGate, 25);
  assert.equal(getNextModel(4)?.name, "Fort");
  assert.equal(getNextModel(5), null);
});

test("getModelMultiplier stacks +15% per certified tier", () => {
  assert.equal(getModelMultiplier(0), 1);
  assert.equal(getModelMultiplier(1), 1.15);
  assert.equal(getModelMultiplier(5), 1.75);
});

test("formatModelPanelLabel distinguishes first upgrade from later research", () => {
  const vif = getNextModel(0);
  const sage = getNextModel(1);
  assert.ok(vif);
  assert.ok(sage);
  assert.equal(formatModelPanelLabel(0, vif), "Upgrade model: Vif 4.0");
  assert.equal(formatModelPanelLabel(1, sage), "Research model: Sage 4.2");
});

test("net tokens/s is an algebraic sum of positive production and absolute drains", () => {
  // 10 agents = +10/s; one Zombie Model Farm = −12/s; no multipliers.
  const state = new GameState({
    lastTickAt: 0,
    agents: 10,
    modelSunsets: 1,
  });
  assert.equal(getTokensPerSecondForState(state), 10 - 12);
  assert.equal(formatRate(getTokensPerSecondForState(state)), "\u22122.0 tokens/s");
});

test("income multipliers scale production but never amplify purge drains", () => {
  const base = new GameState({
    lastTickAt: 0,
    agents: 10,
    modelSunsets: 1,
    modelTier: 1, // ×1.15
  });
  const mult = getIncomeMultiplier(base);
  assert.equal(mult, 1.15);
  // (10 × 1.15) + (−12) = −0.5 — drain stays −12, not −12×1.15.
  assert.ok(Math.abs(getTokensPerSecondForState(base) - (10 * 1.15 - 12)) < 1e-9);

  const withPercent = new GameState({
    lastTickAt: 0,
    agents: 10,
    modelSunsets: 1,
    modelTier: 1,
    bloats: 2, // +5% each → +10%
  });
  const expectedPositive = 10 * getIncomeMultiplier(withPercent);
  assert.ok(
    Math.abs(getTokensPerSecondForState(withPercent) - (expectedPositive - 12)) < 1e-9,
  );
});

test("multiple positive and negative passives algebraically combine", () => {
  const state = new GameState({
    lastTickAt: 0,
    agents: 5, // +5
    swarms: 2, // +14
    modelSunsets: 1, // −12
    memoryRedactions: 1, // −28
  });
  // No multipliers: 5 + 14 − 12 − 28 = −21
  assert.equal(getTokensPerSecondForState(state), 5 + 14 - 12 - 28);
});

test("scheduler click-share still compounds with income multipliers (legacy pacing)", () => {
  const state = new GameState({
    lastTickAt: 0,
    rules: 0, // base click = 1
    modelTier: 1, // ×1.15
    schedulers: 1, // +2.5% of fully multiplied click, then × mult again
  });
  const mult = getIncomeMultiplier(state);
  const click = getTokensPerClickForState(state);
  const expected = click * 0.025 * mult;
  assert.ok(Math.abs(getTokensPerSecondForState(state) - expected) < 1e-9);
});

test("sampled passive rate also applies algebraic drain offset", () => {
  const state = new GameState({
    lastTickAt: 0,
    agents: 20,
    modelSunsets: 2, // −24 absolute
  });
  const sample = sampleTokensPerSecondForState(state, () => 0.5);
  assert.ok(Math.abs(sample - (20 - 24)) < 1e-9);
});

test("ticks apply negative net rate into token debt", () => {
  const clock = new ManualClock(0);
  const game = new Game({
    clock,
    random: () => 0.5,
    state: new GameState({
      lastTickAt: 0,
      tokens: 100,
      lifetimeTokens: 100,
      agents: 0,
      modelSunsets: 1, // −12/s
    }),
  });
  assert.equal(game.tokensPerSecond, -12);

  // 1 second = 5 ticks → −12 tokens.
  for (let i = 0; i < 5; i += 1) {
    clock.advance(TICK_MS);
    game.tick();
  }
  assert.ok(Math.abs(game.tokens - 88) < 1e-9, `expected 88, got ${game.tokens}`);
  assert.equal(game.state.lifetimeTokens, 100, "drains must not inflate lifetime");
});

test("positive swarm and purge drain cancel correctly under model mult", () => {
  const swarm = POWER_UPGRADES.find((entry) => entry.id === "swarm");
  assert.ok(swarm);
  const state = new GameState({
    lastTickAt: 0,
    swarms: 1, // +7
    modelSunsets: 1, // −12
    modelTier: 2, // ×1.30
  });
  const expected = 7 * getIncomeMultiplier(state) - 12;
  assert.ok(Math.abs(getTokensPerSecondForState(state) - expected) < 1e-9);
  assert.ok(getTokensPerClickForState(state) > 1);
});
