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
    description: "Snappier excuses, same hallucinations.",
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
 * @param {UpgradeDef} upgrade
 * @param {number} owned
 * @returns {number}
 */
export function getUpgradeCost(upgrade, owned) {
  return Math.ceil(upgrade.baseCost * upgrade.costGrowthRate ** owned);
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
