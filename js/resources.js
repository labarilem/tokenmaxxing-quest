/** @typedef {{ id: string, label: string, value: number }} Resource */

export const SAVE_KEY = "tokenmaxxing-quest.save.v1";
export const SAVE_VERSION = 1;

export const TICKS_PER_SECOND = 5;
export const TICK_MS = 1000 / TICKS_PER_SECOND;
export const TOKENS_PER_TICK = 1 / TICKS_PER_SECOND;
export const AUTOSAVE_TICKS = 300;

export const AGENT = {
  id: "background-agent",
  name: "Background Agent",
  baseCost: 25,
  /** Exponential cost growth per owned agent (genre norm: 1.07–1.15). */
  costGrowthRate: 1.12,
  tokensPerSecond: 1,
  /**
   * Threshold output bonuses — visible pacing spikes between cost walls.
   * @type {{ at: number, multiplier: number, label: string }[]}
   */
  milestones: [
    { at: 5, multiplier: 2, label: "Pod sync" },
    { at: 10, multiplier: 2, label: "Fleet multiplier" },
  ],
};

/**
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (n < 1000) {
    return Math.floor(n).toLocaleString("en-US");
  }
  if (n < 1_000_000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  if (n < 1_000_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
}

/**
 * @param {number} rate
 * @returns {string}
 */
export function formatRate(rate) {
  return `+${rate.toFixed(1)} / sec`;
}

/**
 * Cost of the next agent: base × growth^owned (exponential pacing clock).
 * @param {number} owned
 * @returns {number}
 */
export function getAgentCost(owned) {
  return Math.ceil(AGENT.baseCost * AGENT.costGrowthRate ** owned);
}

/**
 * Stacking production multiplier from milestone thresholds.
 * @param {number} owned
 * @returns {number}
 */
export function getAgentProductionMultiplier(owned) {
  let multiplier = 1;
  for (const milestone of AGENT.milestones) {
    if (owned >= milestone.at) {
      multiplier *= milestone.multiplier;
    }
  }
  return multiplier;
}

/**
 * Passive tokens per second for a given agent count.
 * @param {number} agents
 * @returns {number}
 */
export function getTokensPerSecond(agents) {
  return agents * AGENT.tokensPerSecond * getAgentProductionMultiplier(agents);
}

/**
 * Next milestone not yet reached, if any.
 * @param {number} owned
 * @returns {{ at: number, multiplier: number, label: string } | null}
 */
export function getNextAgentMilestone(owned) {
  for (const milestone of AGENT.milestones) {
    if (owned < milestone.at) {
      return milestone;
    }
  }
  return null;
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
