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
  tokensPerSecond: 1,
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
 * @param {number} owned
 * @returns {number}
 */
export function getAgentCost(owned) {
  return AGENT.baseCost;
}
