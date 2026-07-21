/** @typedef {import("./state.js").GameState} GameState */

import {
  ALL_CATALOG,
  getCatalogMultiplier,
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
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  return Math.floor(n).toLocaleString("en-US");
}

/**
 * @param {number} rate
 * @returns {string}
 */
export function formatRate(rate) {
  return `+${rate.toFixed(1)} tokens/s`;
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
 * @returns {number}
 */
export function getPercentIncomeBonus(state) {
  let bonus = 0;
  for (const entry of ALL_CATALOG) {
    if (!entry.incomePercentPerOwned) {
      continue;
    }
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    bonus += owned * entry.incomePercentPerOwned;
  }
  return bonus;
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
  return getModelMultiplier(state.modelTier) * (1 + getPercentIncomeBonus(state)) * getStackingIncomeMultiplier(state);
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
 * @param {GameState} state
 * @returns {number}
 */
export function getTokensPerSecondForState(state) {
  let passive = getTokensPerSecond(state.agents);

  for (const entry of ALL_CATALOG) {
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    if (entry.passivePerOwned) {
      passive += owned * entry.passivePerOwned * getCatalogMultiplier(entry, owned);
    }
    if (entry.passivePerAgentPerOwned && state.agents > 0) {
      passive += owned * entry.passivePerAgentPerOwned * state.agents;
    }
    if (entry.passivePerSwarmPerOwned && state.swarms > 0) {
      passive += owned * entry.passivePerSwarmPerOwned * state.swarms;
    }
  }

  const clickBeforeMultiplier =
    getBaseClickIncome(state) *
    getModelMultiplier(state.modelTier) *
    (1 + getPercentIncomeBonus(state)) *
    getStackingIncomeMultiplier(state);

  for (const entry of ALL_CATALOG) {
    const owned = state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    if (entry.passiveClickPercentPerOwned && owned > 0) {
      passive += clickBeforeMultiplier * entry.passiveClickPercentPerOwned * owned;
    }
  }

  return passive * getIncomeMultiplier(state);
}
