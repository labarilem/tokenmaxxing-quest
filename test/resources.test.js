import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGENT,
  RULE,
  formatAffordHint,
  formatClickBenefit,
  formatNumber,
  formatPassiveBenefit,
  getAgentCost,
  getCurrentModel,
  getMarginalClickGain,
  getMarginalPassiveGain,
  getModelMultiplier,
  getNextModel,
  getRuleCost,
  getTokensPerClick,
  getTokensPerSecond,
  getUpgradeMultiplier,
  getNextAgentMilestone,
  getNextRuleMilestone,
  secondsUntilAffordable,
} from "../js/resources.js";

test("formatNumber always shows full digits with grouping", () => {
  assert.equal(formatNumber(999), "999");
  assert.equal(formatNumber(1000), "1,000");
  assert.equal(formatNumber(1_234_567), "1,234,567");
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
