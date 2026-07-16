#!/usr/bin/env node

import {
  DEFAULT_CLICKS_PER_SECOND,
  formatDuration,
  simulateAllEndings,
} from "../js/balance-sim.js";

const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const clicksArg = args.find((arg) => arg.startsWith("--clicks="));
const clicksPerSecond = clicksArg
  ? Number(clicksArg.split("=")[1])
  : DEFAULT_CLICKS_PER_SECOND;

if (!Number.isFinite(clicksPerSecond) || clicksPerSecond < 0) {
  console.error("Invalid --clicks value. Expected a non-negative number.");
  process.exit(1);
}

const results = simulateAllEndings({ clicksPerSecond });

if (jsonOutput) {
  console.log(
    JSON.stringify(
      {
        clicksPerSecond,
        endings: results.map((result) => ({
          ...result,
          elapsed: formatDuration(result.elapsedMs),
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log("Tokenmaxxing Quest — ending pace report");
console.log(`Assumption: ${clicksPerSecond} manual prompts/s while tab is focused (plus passive income).`);
console.log("");

const pathLabels = {
  oops: "Universe Deleted (oops)",
  utopia: "Civic Future (utopia)",
  purge: "Scorched Silicon (purge)",
};

for (const result of results) {
  const label = pathLabels[result.path] ?? result.title;
  console.log(
    `${label}: ${formatDuration(result.elapsedMs)} (${Math.round(result.elapsedMs / 1000)}s raw, ${result.steps} decisions)`,
  );
  console.log(
    `  lifetime ${result.lifetimeTokens.toLocaleString("en-US")} · alignment R${result.alignment.recklessness} / B${result.alignment.benevolence} / P${result.alignment.purge}`,
  );
}

console.log("");
console.log("Re-run after balance changes: npm run balance:endings");
