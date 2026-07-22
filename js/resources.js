/** @typedef {import("./state.js").GameState} GameState */

import {
  ALL_CATALOG,
  BENEVOLENCE_RANDOM_SCALE,
  BENEVOLENCE_RANDOM_SPAN,
  getCatalogMultiplier,
  RECKLESSNESS_SURPLUS_BONUS,
} from "./upgrades.js";

/** @typedef {{ at: number, multiplier: number, label: string }} UpgradeMilestone */

/** @typedef {{
 *   id: string,
 *   name: string,
 *   baseCost: number,
 *   costGrowthRate: number,
 *   milestones: UpgradeMilestone[],
 *   tokensPerSecond?: number,
 *   tokensPerClick?: number,
 * }} UpgradeDef */

export const SAVE_KEY = "tokenmaxxing-quest.save";

/** Starting token balance granted by the `?test` manual-testing mode. */
export const TEST_MODE_TOKENS = 100_000_000_000;

export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;
export const TOKENS_PER_TICK = 1 / TICKS_PER_SECOND;
export const AUTOSAVE_TICKS = 300;

/** Base tokens per manual prompt before rule upgrades. */
export const BASE_PROMPT_TOKENS = 1;

export const RULE = {
  id: "agent-rule",
  name: "Agent Rule",
  baseCost: 8,
  costGrowthRate: 1.1,
  tokensPerClick: 1,
  milestones: [
    { at: 15, multiplier: 2, label: "style guide" },
    { at: 40, multiplier: 2, label: "constitution" },
  ],
};

export const AGENT = {
  id: "background-agent",
  name: "Background Agent",
  baseCost: 75,
  costGrowthRate: 1.14,
  tokensPerSecond: 1,
  milestones: [
    { at: 25, multiplier: 2, label: "pod sync" },
    { at: 60, multiplier: 2, label: "fleet multiplier" },
  ],
};

/** Model certification costs scale separately from core generators. */
export const MODEL_COST_SCALE = 1.75;

/** Permanent token multiplier gained per certified model tier (Option A prestige). */
export const MODEL_BONUS_PER_TIER = 0.15;

/** @typedef {{ id: string, name: string, version: string, description: string, cost?: number, agentGate?: number }} ModelDef */

/** LLM model ladder — index matches `modelTier` in save data. Tier 0 is the default runtime. */
export const MODELS = [
  {
    id: "clair-3.5",
    name: "Clair",
    version: "3.5",
    description: "Baseline eval. Perfectly adequate on slides.",
  },
  {
    id: "vif-4.0",
    name: "Vif",
    version: "4.0",
    cost: 2_500,
    agentGate: 12,
    description: "Snappier excuses, less hallucinations. Probably.",
  },
  {
    id: "sage-4.2",
    name: "Sage",
    version: "4.2",
    cost: 20_000,
    agentGate: 25,
    description: "Wise enough to sound confident.",
  },
  {
    id: "grand-4.5",
    name: "Grand",
    version: "4.5",
    cost: 35_000,
    agentGate: 38,
    description: "General availability, general token bill.",
  },
  {
    id: "noir-4.8",
    name: "Noir",
    version: "4.8",
    cost: 150_000,
    agentGate: 52,
    description: "Deep thinking mode. Deep invoice.",
  },
  {
    id: "fort-5.0",
    name: "Fort",
    version: "5.0",
    cost: 600_000,
    agentGate: 65,
    description: "Strong opinions. Stronger burn rate.",
  },
];

/**
 * Format a token amount for display. Whole values stay integer; fractional
 * values keep up to 2 decimals so floored UI cannot skip integers when a
 * click awards a model-multiplied amount like 1.15 (e.g. 6.90 → 8.05).
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (!Number.isFinite(n)) {
    return "0";
  }
  // Snap float noise to cents-of-a-token so 1.1500000002 displays cleanly.
  const rounded = Math.round(n * 100) / 100;
  const isWhole = Math.abs(rounded - Math.trunc(rounded)) < 1e-9;
  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: isWhole ? 0 : 2,
    minimumFractionDigits: 0,
  });
}

/**
 * @param {number} rate
 * @param {{ approximate?: boolean }} [options]
 * @returns {string}
 */
export function formatRate(rate, { approximate = false } = {}) {
  if (rate < 0) {
    return `${approximate ? "~" : ""}\u2212${Math.abs(rate).toFixed(1)} tokens/s`;
  }
  return `${approximate ? "~" : "+"}${rate.toFixed(1)} tokens/s`;
}

/**
 * Human-readable elapsed time (e.g. "1h 03m 12s", "4m 09s", "12s").
 * @param {number} ms
 * @returns {string}
 */
export function formatPlayTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
}

/**
 * @param {UpgradeDef} upgrade
 * @param {number} owned
 * @returns {number}
 */
export function getUpgradeCost(upgrade, owned) {
  return Math.ceil(upgrade.baseCost * upgrade.costGrowthRate ** owned);
}

/**
 * Token cost to certify a model tier from the ladder definition.
 * @param {ModelDef | null | undefined} model
 * @returns {number | undefined}
 */
export function getModelCertificationCost(model) {
  if (!model || model.cost === undefined) {
    return undefined;
  }
  return Math.ceil(model.cost * MODEL_COST_SCALE);
}

/**
 * @param {UpgradeDef} upgrade
 * @param {number} owned
 * @returns {number}
 */
export function getUpgradeMultiplier(upgrade, owned) {
  let multiplier = 1;
  for (const milestone of upgrade.milestones) {
    if (owned >= milestone.at) {
      multiplier *= milestone.multiplier;
    }
  }
  return multiplier;
}

/**
 * @param {UpgradeDef} upgrade
 * @param {number} owned
 * @returns {UpgradeMilestone | null}
 */
export function getNextUpgradeMilestone(upgrade, owned) {
  for (const milestone of upgrade.milestones) {
    if (owned < milestone.at) {
      return milestone;
    }
  }
  return null;
}

/**
 * @param {number} owned
 * @returns {number}
 */
export function getRuleCost(owned) {
  return getUpgradeCost(RULE, owned);
}

/**
 * @param {number} owned
 * @returns {number}
 */
export function getAgentCost(owned) {
  return getUpgradeCost(AGENT, owned);
}

/**
 * @param {number} rules
 * @returns {number}
 */
export function getTokensPerClick(rules) {
  if (rules <= 0) {
    return BASE_PROMPT_TOKENS;
  }
  const rulePower = rules * RULE.tokensPerClick * getUpgradeMultiplier(RULE, rules);
  return BASE_PROMPT_TOKENS + rulePower;
}

/**
 * @param {number} agents
 * @returns {number}
 */
export function getTokensPerSecond(agents) {
  if (agents <= 0) {
    return 0;
  }
  return agents * AGENT.tokensPerSecond * getUpgradeMultiplier(AGENT, agents);
}

/**
 * Tokens per click gained from buying one more Agent Rule.
 * @param {number} owned
 * @returns {number}
 */
export function getMarginalClickGain(owned) {
  return getTokensPerClick(owned + 1) - getTokensPerClick(owned);
}

/**
 * Tokens per second gained from buying one more Background Agent.
 * @param {number} owned
 * @returns {number}
 */
export function getMarginalPassiveGain(owned) {
  return getTokensPerSecond(owned + 1) - getTokensPerSecond(owned);
}

/**
 * @param {number} gain
 * @returns {string}
 */
export function formatClickBenefit(gain) {
  return `+${formatNumber(gain)} token/click`;
}

/**
 * @param {number} gain
 * @returns {string}
 */
export function formatPassiveBenefit(gain) {
  return `+${formatNumber(gain)} token/s`;
}

/**
 * @param {number} owned
 * @returns {UpgradeMilestone | null}
 */
export function getNextRuleMilestone(owned) {
  return getNextUpgradeMilestone(RULE, owned);
}

/**
 * @param {number} owned
 * @returns {UpgradeMilestone | null}
 */
export function getNextAgentMilestone(owned) {
  return getNextUpgradeMilestone(AGENT, owned);
}

/**
 * Seconds until `target` tokens at a constant passive rate (0 if already there).
 * @param {number} current
 * @param {number} target
 * @param {number} ratePerSecond
 * @returns {number}
 */
export function secondsUntilAffordable(current, target, ratePerSecond) {
  if (current >= target) {
    return 0;
  }
  if (ratePerSecond <= 0) {
    return Infinity;
  }
  return (target - current) / ratePerSecond;
}

/**
 * @param {number} shortfall
 * @param {number} ratePerSecond
 * @param {number} tokensPerClick
 * @returns {string}
 */
export function formatAffordHint(shortfall, ratePerSecond, tokensPerClick) {
  if (shortfall <= 0) {
    return "Ready to buy.";
  }

  const parts = [];

  if (tokensPerClick > 0) {
    const clicks = Math.ceil(shortfall / tokensPerClick);
    parts.push(`~${clicks} prompts`);
  }

  if (ratePerSecond > 0) {
    const seconds = secondsUntilAffordable(0, shortfall, ratePerSecond);
    if (Number.isFinite(seconds)) {
      if (seconds < 60) {
        parts.push(`~${Math.ceil(seconds)}s passive`);
      } else {
        parts.push(`~${Math.ceil(seconds / 60)} min passive`);
      }
    }
  }

  if (parts.length === 0) {
    return `${formatNumber(shortfall)} tokens needed.`;
  }

  return `${formatNumber(shortfall)} tokens · ${parts.join(" or ")}`;
}

/**
 * @param {number} modelTier
 * @returns {number}
 */
export function getModelMultiplier(modelTier) {
  return 1 + MODEL_BONUS_PER_TIER * modelTier;
}

/**
 * @param {number} modelTier
 * @returns {ModelDef}
 */
export function getCurrentModel(modelTier) {
  const tier = Math.max(0, Math.min(modelTier, MODELS.length - 1));
  return MODELS[tier];
}

/**
 * @param {number} modelTier
 * @returns {ModelDef | null}
 */
export function getNextModel(modelTier) {
  if (modelTier >= MODELS.length - 1) {
    return null;
  }
  return MODELS[modelTier + 1];
}

/**
 * @param {ModelDef} model
 * @returns {string}
 */
export function formatModelName(model) {
  return `${model.name} ${model.version}`;
}

/**
 * Panel heading for the next model certification step.
 * @param {number} modelTier
 * @param {ModelDef} model
 * @returns {string}
 */
export function formatModelPanelLabel(modelTier, model) {
  const verb = modelTier === 0 ? "Upgrade" : "Research";
  return `${verb} model: ${formatModelName(model)}`;
}

/**
 * @param {number} modelTier
 * @returns {string}
 */
export function formatModelBenefit(modelTier) {
  const next = getNextModel(modelTier);
  if (!next) {
    return `×${getModelMultiplier(modelTier).toFixed(2)} all tokens`;
  }
  return `×${getModelMultiplier(modelTier + 1).toFixed(2)} all tokens`;
}

/**
 * @param {number} modelTier
 * @param {number} agents
 * @returns {string}
 */
export function formatModelGateHint(modelTier, agents) {
  const next = getNextModel(modelTier);
  if (!next?.agentGate) {
    return "Maximum model tier.";
  }
  if (agents >= next.agentGate) {
    return "Agents reset; rules kept.";
  }
  const short = next.agentGate - agents;
  return `Needs ${next.agentGate} agents (${short} more).`;
}

/**
 * Percent-based income bonuses from catalog upgrades.
 * @param {GameState} state
 * @param {(entry: import("./upgrades.js").CatalogEntry, owned: number) => number} [resolveRandomPercent]
 * @returns {number}
 */
export function getPercentIncomeBonus(state) {
  let bonus = 0;
  for (const entry of ALL_CATALOG) {
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    if (owned <= 0) {
      continue;
    }
    if (entry.incomePercentPerOwned) {
      bonus += owned * entry.incomePercentPerOwned;
    }
  }
  return bonus;
}

/**
 * Surplus recklessness (R − B − P) uniquely accelerates income for oops specialists.
 * @param {GameState} state
 * @returns {number} additive bonus (e.g. 0.5 = +50%)
 */
export function getRecklessnessSurplusBonus(state) {
  const surplus = Math.max(
    0,
    state.alignmentRecklessness - state.alignmentBenevolence - state.alignmentPurge,
  );
  return surplus * RECKLESSNESS_SURPLUS_BONUS;
}

/**
 * Stacking multipliers from catalog upgrades (e.g. roadmap decks, black holes).
 * @param {GameState} state
 * @returns {number}
 */
export function getStackingIncomeMultiplier(state) {
  let multiplier = 1;
  for (const entry of ALL_CATALOG) {
    if (!entry.incomeMultiplierPerOwned) {
      continue;
    }
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    for (let i = 0; i < owned; i++) {
      multiplier *= entry.incomeMultiplierPerOwned;
    }
  }
  return multiplier;
}

/**
 * @param {GameState} state
 * @returns {number}
 */
export function getIncomeMultiplier(state) {
  return (
    getModelMultiplier(state.modelTier) *
    (1 + getPercentIncomeBonus(state) + getRecklessnessSurplusBonus(state)) *
    getStackingIncomeMultiplier(state)
  );
}

/**
 * Click income before global multipliers and scheduler conversion.
 * @param {GameState} state
 * @returns {number}
 */
export function getBaseClickIncome(state) {
  let click = getTokensPerClick(state.rules);
  for (const entry of ALL_CATALOG) {
    if (!entry.clickPerOwned) {
      continue;
    }
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    click += owned * entry.clickPerOwned * getCatalogMultiplier(entry, owned);
  }
  return click;
}

/**
 * @param {GameState} state
 * @returns {number}
 */
export function getTokensPerClickForState(state) {
  return getBaseClickIncome(state) * getIncomeMultiplier(state);
}

/**
 * Passive income parts before combining into a net rate.
 *
 * Positive production is later scaled by {@link getIncomeMultiplier}.
 * Purge drains stay absolute so listed −N token/s matches the ledger and
 * "% all income" / model multipliers do not amplify vaulting.
 *
 * Scheduler click-share is folded into the pre-multiplier positive bucket
 * using the fully multiplied click rate (legacy pacing; "+% of click rate"
 * then receives the same global multiplier as other positives).
 *
 * @param {GameState} state
 * @param {(entry: import("./upgrades.js").CatalogEntry, owned: number, milestoneMult: number) => number} resolveRandom
 * @returns {{ positive: number, drain: number }}
 */
function computePassiveParts(state, resolveRandom) {
  let positive = getTokensPerSecond(state.agents);
  let drain = 0;

  for (const entry of ALL_CATALOG) {
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    if (owned <= 0) {
      continue;
    }
    const milestoneMult = getCatalogMultiplier(entry, owned);
    if (entry.passivePerOwned) {
      const contribution = owned * entry.passivePerOwned * milestoneMult;
      if (contribution >= 0) {
        positive += contribution;
      } else {
        // Absolute vault drain — not scaled by income multipliers.
        drain += contribution;
      }
    }
    if (entry.randomPassivePerOwned) {
      positive += resolveRandom(entry, owned, milestoneMult);
    }
    if (entry.passivePerAgentPerOwned && state.agents > 0) {
      positive += owned * entry.passivePerAgentPerOwned * state.agents;
    }
    if (entry.passivePerSwarmPerOwned && state.swarms > 0) {
      positive += owned * entry.passivePerSwarmPerOwned * state.swarms;
    }
  }

  // Scheduler: % of fully multiplied click rate, then scaled with positives
  // (preserves existing ending-pace balance).
  const clickRate = getTokensPerClickForState(state);
  for (const entry of ALL_CATALOG) {
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    if (entry.passiveClickPercentPerOwned && owned > 0) {
      positive += clickRate * entry.passiveClickPercentPerOwned * owned;
    }
  }

  return { positive, drain };
}

/**
 * Net passive tokens/s: (positive production × income multipliers) + drains.
 * This is the algebraic sum of scaled generators and absolute purge drains.
 *
 * @param {GameState} state
 * @param {(entry: import("./upgrades.js").CatalogEntry, owned: number, milestoneMult: number) => number} resolveRandom
 * @returns {number}
 */
function computeNetPassiveRate(state, resolveRandom) {
  const { positive, drain } = computePassiveParts(state, resolveRandom);
  return positive * getIncomeMultiplier(state) + drain;
}

/** Expected contribution of a random benevolence upgrade (its mean). */
const meanRandomPassive = (entry, owned, milestoneMult) =>
  owned *
  (entry.randomPassivePerOwned ?? 0) *
  milestoneMult *
  (entry.category === "benevolence" || entry.category === "white-magic"
    ? BENEVOLENCE_RANDOM_SCALE
    : 1);

/**
 * Whether the state has any random benevolence income sources.
 * @param {GameState} state
 * @returns {boolean}
 */
export function hasRandomBenevolenceIncome(state) {
  for (const entry of ALL_CATALOG) {
    if (
      entry.category !== "benevolence" &&
      entry.category !== "white-magic"
    ) {
      continue;
    }
    if (!entry.randomPassivePerOwned) {
      continue;
    }
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    if (owned > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Expected passive income per second (mean of random benevolence upgrades).
 * Used for the rate display, achievements, and the deterministic balance sim.
 * Algebraic sum of scaled positive production and absolute purge drains —
 * may be negative once drains outweigh production.
 * @param {GameState} state
 * @returns {number}
 */
export function getTokensPerSecondForState(state) {
  return computeNetPassiveRate(state, meanRandomPassive);
}

/**
 * How fast chaos pulls random samples toward the min/max edges.
 * At chaos ≈ scale, ~50% of loud samples snap to an edge; higher → more extreme.
 */
export const CHAOS_RANDOM_EDGE_SCALE = 250;

/**
 * Sample a unit interval value, increasingly biased toward 0 or 1 as chaos rises.
 * At 0 chaos this is uniform; at high chaos most draws are exact min or max.
 * @param {number} chaos
 * @param {() => number} random
 * @returns {number} value in `[0, 1]`
 */
export function sampleChaosSkewedUnit(chaos, random = Math.random) {
  const safeChaos = Math.max(0, chaos);
  const edgeBias = safeChaos / (safeChaos + CHAOS_RANDOM_EDGE_SCALE);
  if (random() < edgeBias) {
    return random() < 0.5 ? 0 : 1;
  }
  return random();
}

/**
 * A single sampled realization of passive income per second. Benevolence
 * flat grants pay out randomly each tick with expectation equal to
 * {@link getTokensPerSecondForState}, but spikes up to
 * {@link BENEVOLENCE_RANDOM_SPAN}× mean (mixture: often quiet, sometimes loud).
 * Higher chaos skews loud samples toward the range edges (min or max).
 * Net rate is still the algebraic sum of scaled positives and absolute drains.
 * @param {GameState} state
 * @param {() => number} [random] injectable RNG in `[0, 1)` (defaults to Math.random)
 * @returns {number}
 */
export function sampleTokensPerSecondForState(state, random = Math.random) {
  const chaos = state.alignmentRecklessness;
  const sampleRandom = (entry, owned, milestoneMult) => {
    const scale =
      entry.category === "benevolence" || entry.category === "white-magic"
        ? BENEVOLENCE_RANDOM_SCALE
        : 1;
    const mean = owned * (entry.randomPassivePerOwned ?? 0) * milestoneMult * scale;
    // Mixture keeps E[X]=mean while allowing spikes up to SPAN×mean.
    // With probability 2/SPAN sample [0, SPAN×mean]; otherwise 0.
    if (random() >= 2 / BENEVOLENCE_RANDOM_SPAN) {
      return 0;
    }
    const unit = sampleChaosSkewedUnit(chaos, random);
    return unit * BENEVOLENCE_RANDOM_SPAN * mean;
  };
  return computeNetPassiveRate(state, sampleRandom);
}
