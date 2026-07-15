import { test } from "node:test";
import assert from "node:assert/strict";

import { GameState } from "../js/state.js";
import { getCompanyName } from "../js/company.js";
import { getJobSubtitle } from "../js/achievements.js";

test("getCompanyName starts at Big Tech Corp", () => {
  assert.equal(getCompanyName(new GameState()), "Big Tech Corp");
});

test("getCompanyName advances through late big-tech fleet milestones", () => {
  assert.equal(getCompanyName(new GameState({ clusters: 3 })), "Inference Cluster Holdings");
  assert.equal(getCompanyName(new GameState({ roadmaps: 1 })), "Slide Deck Dynamics");
});

test("getCompanyName shifts to deep space when space theme unlocks", () => {
  assert.equal(
    getCompanyName(new GameState({ lifetimeTokens: 3_000_000 })),
    "Enterprise Ops Group",
  );
  assert.equal(
    getCompanyName(
      new GameState({ lifetimeTokens: 50_000_000, regulatoryKabukis: 1, alienDecoders: 1 }),
    ),
    "Exoplanet Token Farms",
  );
  assert.equal(
    getCompanyName(new GameState({ blackHoleSinks: 1, galacticMeshes: 0, alienDecoders: 2 })),
    "Event Horizon Labs",
  );
});

test("getCompanyName shifts to magic themes when white or black upgrades are owned", () => {
  assert.equal(
    getCompanyName(new GameState({ lifetimeTokens: 500_000, wardSanctuaries: 1 })),
    "Moonwell Beneficence LLC",
  );
  assert.equal(
    getCompanyName(new GameState({ lifetimeTokens: 250_000, curseCaches: 1 })),
    "Umbral Containment Syndicate",
  );
});

test("getCompanyName prefers magic over space when both themes are active", () => {
  assert.equal(
    getCompanyName(
      new GameState({
        lifetimeTokens: 100_000_000,
        alienDecoders: 3,
        wardSanctuaries: 1,
      }),
    ),
    "Moonwell Beneficence LLC",
  );
});

test("getCompanyName uses ending-specific names after capstone commit", () => {
  assert.equal(getCompanyName(new GameState({ strategyPath: "utopia" })), "Civic Luminary Grid");
  assert.equal(getCompanyName(new GameState({ strategyPath: "purge" })), "Scorched Silicon LLC");
  assert.equal(getCompanyName(new GameState({ strategyPath: "oops" })), "Unbounded Agent Works");
});

test("getJobSubtitle combines company name and job title", () => {
  const state = new GameState({ achievements: ["tokens-1k"], alienDecoders: 1, lifetimeTokens: 50_000_000 });
  assert.equal(getJobSubtitle(state), "Exoplanet Token Farms — Staff Engineer");
});
