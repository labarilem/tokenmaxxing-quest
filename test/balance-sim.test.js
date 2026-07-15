import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatDuration,
  getCatalogForPath,
  simulateAllEndings,
  simulateEnding,
} from "../js/balance-sim.js";
import { CAPSTONE_COST, CAPSTONE_REVEAL_TOKENS } from "../js/upgrades.js";

test("getCatalogForPath includes alignment lines per ending", () => {
  const oops = getCatalogForPath("oops");
  const utopia = getCatalogForPath("utopia");
  const purge = getCatalogForPath("purge");

  assert.ok(oops.some((entry) => entry.id === "swarm"));
  assert.ok(!oops.some((entry) => entry.id === "open-source"));
  assert.ok(utopia.some((entry) => entry.id === "open-source"));
  assert.ok(purge.some((entry) => entry.id === "model-sunset"));
});

test("formatDuration renders human-readable pacing", () => {
  assert.equal(formatDuration(4500), "4.5s");
  assert.equal(formatDuration(125_000), "2m 5s");
  assert.equal(formatDuration(3_720_000), "1h 2m");
});

test("simulateEnding reaches oops capstone", () => {
  const result = simulateEnding("oops");
  assert.ok(result.elapsedMs > 0);
  assert.ok(result.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS);
  assert.ok(result.steps > 0);
});

test("simulateEnding reaches utopia capstone with benevolence gate", () => {
  const result = simulateEnding("utopia");
  assert.ok(result.alignment.benevolence >= 150);
  assert.ok(result.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS);
});

test("simulateEnding reaches purge capstone with purge gate", () => {
  const result = simulateEnding("purge");
  assert.ok(result.alignment.purge >= 120);
  assert.ok(result.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS);
});

test("simulateAllEndings completes every path under step budget", () => {
  const results = simulateAllEndings();
  assert.equal(results.length, 3);
  for (const result of results) {
    assert.ok(result.elapsedMs > 0);
    assert.ok(result.lifetimeTokens >= CAPSTONE_COST);
  }
});

test("simulateAllEndings reaches each ending in at least one hour of optimal play", () => {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const results = simulateAllEndings();
  for (const result of results) {
    assert.ok(
      result.elapsedMs >= ONE_HOUR_MS,
      `${result.path} ended in ${result.elapsedMs}ms, expected >= ${ONE_HOUR_MS}ms`,
    );
  }
});
