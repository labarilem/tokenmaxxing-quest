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

export const SAVE_KEY = "tokenmaxxing-quest.save.v1";
export const SAVE_VERSION = 1;

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
