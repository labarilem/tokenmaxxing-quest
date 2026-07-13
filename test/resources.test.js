import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGENT,
  RULE,
  formatAffordHint,
  formatNumber,
  getMarginalTokensPerClick,
  getMarginalTokensPerSecond,
  formatClickGain,
  formatRateGain,
  getAgentCost,
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

test("getMarginalTokensPerClick reflects the next purchase", () => {
  assert.equal(getMarginalTokensPerClick(0), 1);
  assert.equal(getMarginalTokensPerClick(2), 1);
  assert.equal(getMarginalTokensPerClick(14), 16);
});

test("getMarginalTokensPerSecond reflects the next purchase", () => {
  assert.equal(getMarginalTokensPerSecond(0), 1);
  assert.equal(getMarginalTokensPerSecond(2), 1);
  assert.equal(getMarginalTokensPerSecond(24), 26);
});

test("formatClickGain and formatRateGain use compact labels", () => {
  assert.equal(formatClickGain(2), "+2 token/click");
  assert.equal(formatRateGain(30), "+30 token/s");
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

test("secondsUntilAffordable estimates passive wait time", () => {
  assert.equal(secondsUntilAffordable(20, 25, 1), 5);
  assert.equal(secondsUntilAffordable(30, 25, 1), 0);
  assert.equal(secondsUntilAffordable(0, 25, 0), Infinity);
});
