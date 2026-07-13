import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AGENT,
  getAgentCost,
  getAgentProductionMultiplier,
  getNextAgentMilestone,
  getTokensPerSecond,
  secondsUntilAffordable,
} from "../js/resources.js";

test("getAgentCost grows exponentially from base cost", () => {
  assert.equal(getAgentCost(0), AGENT.baseCost);
  assert.equal(getAgentCost(1), Math.ceil(AGENT.baseCost * AGENT.costGrowthRate));
  assert.ok(getAgentCost(5) > getAgentCost(1));
});

test("getAgentProductionMultiplier stacks milestone bonuses", () => {
  assert.equal(getAgentProductionMultiplier(0), 1);
  assert.equal(getAgentProductionMultiplier(4), 1);
  assert.equal(getAgentProductionMultiplier(5), 2);
  assert.equal(getAgentProductionMultiplier(10), 4);
});

test("getTokensPerSecond applies milestone multipliers", () => {
  assert.equal(getTokensPerSecond(2), 2);
  assert.equal(getTokensPerSecond(5), 10);
  assert.equal(getTokensPerSecond(10), 40);
});

test("getNextAgentMilestone returns the next threshold", () => {
  assert.equal(getNextAgentMilestone(0)?.at, 5);
  assert.equal(getNextAgentMilestone(7)?.at, 10);
  assert.equal(getNextAgentMilestone(10), null);
});

test("secondsUntilAffordable estimates passive wait time", () => {
  assert.equal(secondsUntilAffordable(20, 25, 1), 5);
  assert.equal(secondsUntilAffordable(30, 25, 1), 0);
  assert.equal(secondsUntilAffordable(0, 25, 0), Infinity);
});
