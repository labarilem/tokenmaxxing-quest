/** @typedef {import("./state.js").GameState} GameState */

/** @typedef {{
 *   at: number,
 *   multiplier: number,
 *   label: string,
 * }} UpgradeMilestone */

/** @typedef {{
 *   recklessness?: number,
 *   benevolence?: number,
 *   purge?: number,
 * }} AlignmentDelta */

/** @typedef {{
 *   id: string,
 *   stateKey: string,
 *   name: string,
 *   description: string,
 *   baseCost: number,
 *   costGrowthRate: number,
 *   maxOwned?: number,
 *   milestones?: UpgradeMilestone[],
 *   alignment?: AlignmentDelta,
 *   gate?: (state: GameState) => boolean,
 *   gateHint: string,
 *   passivePerOwned?: number,
 *   clickPerOwned?: number,
 *   incomePercentPerOwned?: number,
 *   passivePerAgentPerOwned?: number,
 *   passiveClickPercentPerOwned?: number,
 *   incomeMultiplierPerOwned?: number,
 *   category: "power" | "benevolence" | "purge",
 * }} CatalogEntry */

export const ALIGNMENT_REVEAL_TOKENS = 10_000_000;
export const CAPSTONE_REVEAL_TOKENS = 100_000_000;
export const CAPSTONE_BENEVOLENCE_MIN = 100;
export const CAPSTONE_PURGE_MIN = 80;

/** @type {CatalogEntry[]} */
export const POWER_UPGRADES = [
  {
    id: "swarm",
    stateKey: "swarms",
    name: "Parallel Agent Swarm",
    description: "Same ticket, five agents, one standup.",
    baseCost: 500,
    costGrowthRate: 1.16,
    category: "power",
    gateHint: "Needs 30 Background Agents.",
    gate: (s) => s.agents >= 30,
    passivePerOwned: 5,
    alignment: { recklessness: 2 },
    milestones: [
      { at: 20, multiplier: 2, label: "swarm sync" },
      { at: 50, multiplier: 2, label: "horde mode" },
    ],
  },
  {
    id: "decoder",
    stateKey: "decoders",
    name: "Speculative Decoding Rig",
    description: "Guess the next token before finance does.",
    baseCost: 2_000,
    costGrowthRate: 1.17,
    category: "power",
    gateHint: "Needs 10 Parallel Agent Swarms.",
    gate: (s) => s.swarms >= 10,
    incomePercentPerOwned: 0.03,
    alignment: { recklessness: 1 },
  },
  {
    id: "context",
    stateKey: "contexts",
    name: "Context Window Expander",
    description: "Paste the repo. Paste the wiki. Paste your regrets.",
    baseCost: 3_500,
    costGrowthRate: 1.16,
    category: "power",
    gateHint: "Needs 50 Agent Rules.",
    gate: (s) => s.rules >= 50,
    clickPerOwned: 8,
    alignment: { recklessness: 1 },
    milestones: [
      { at: 15, multiplier: 2, label: "full monorepo" },
      { at: 40, multiplier: 2, label: "infinite scroll" },
    ],
  },
  {
    id: "bloat",
    stateKey: "bloats",
    name: "Prompt Bloat Engine",
    description: "More tokens per prompt. Fewer surviving tests.",
    baseCost: 5_000,
    costGrowthRate: 1.18,
    category: "power",
    gateHint: "Needs 25 Parallel Agent Swarms.",
    gate: (s) => s.swarms >= 25,
    incomePercentPerOwned: 0.05,
    alignment: { recklessness: 3 },
  },
  {
    id: "cluster",
    stateKey: "clusters",
    name: "Inference Cluster",
    description: "Reserved capacity. Unreserved invoice.",
    baseCost: 12_000,
    costGrowthRate: 1.17,
    category: "power",
    gateHint: "Needs Sage 4.2 certified.",
    gate: (s) => s.modelTier >= 2,
    passivePerOwned: 50,
    alignment: { recklessness: 2 },
    milestones: [
      { at: 10, multiplier: 2, label: "reserved slice" },
      { at: 25, multiplier: 2, label: "hyperscaler tier" },
    ],
  },
  {
    id: "mcp",
    stateKey: "mcps",
    name: "MCP Server Pod",
    description: "Tooling so agents can tool each other.",
    baseCost: 20_000,
    costGrowthRate: 1.19,
    category: "power",
    gateHint: "Needs 50 agents and 5 Inference Clusters.",
    gate: (s) => s.agents >= 50 && s.clusters >= 5,
    passivePerAgentPerOwned: 1,
    alignment: { recklessness: 2 },
  },
  {
    id: "scheduler",
    stateKey: "schedulers",
    name: "Auto-Prompt Scheduler",
    description: "Cron job for creativity. Pager optional.",
    baseCost: 40_000,
    costGrowthRate: 1.2,
    category: "power",
    gateHint: "Needs Grand 4.5 certified.",
    gate: (s) => s.modelTier >= 3,
    passiveClickPercentPerOwned: 0.04,
    alignment: { recklessness: 1 },
  },
  {
    id: "dashboard",
    stateKey: "dashboards",
    name: "Executive Token Dashboard",
    description: "One chart that explains nothing and approves everything.",
    baseCost: 80_000,
    costGrowthRate: 1.18,
    category: "power",
    gateHint: "Needs Noir 4.8 certified.",
    gate: (s) => s.modelTier >= 4,
    incomePercentPerOwned: 0.1,
    alignment: { recklessness: 4 },
  },
  {
    id: "allow-all",
    stateKey: "allowAlls",
    name: "Allow-All Permissions Profile",
    description: "Sandbox mode: production filesystem, production consequences.",
    baseCost: 200_000,
    costGrowthRate: 1.15,
    category: "power",
    gateHint: "Needs Fort 5.0 and 1M lifetime tokens.",
    gate: (s) => s.modelTier >= 5 && s.lifetimeTokens >= 1_000_000,
    incomePercentPerOwned: 0.3,
    alignment: { recklessness: 8 },
  },
  {
    id: "roadmap",
    stateKey: "roadmaps",
    name: "AGI Roadmap Deck",
    description: "Slide 47: Alignment — TBD.",
    baseCost: 1_000_000,
    costGrowthRate: 1,
    maxOwned: 3,
    category: "power",
    gateHint: "Needs 100M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 100_000_000,
    incomeMultiplierPerOwned: 2,
    alignment: { recklessness: 5 },
  },
];

/** @type {CatalogEntry[]} */
export const BENEVOLENCE_UPGRADES = [
  {
    id: "open-source",
    stateKey: "openSource",
    name: "Open Source Maintainer Grant",
    description: "Sponsor the libs your agents copy-paste from.",
    baseCost: 8_000,
    costGrowthRate: 1.12,
    category: "benevolence",
    gateHint: "Needs 1,000 tokens.",
    gate: (s) => s.tokens >= 1_000 || s.lifetimeTokens >= 1_000,
    alignment: { benevolence: 15 },
  },
  {
    id: "nonprofit",
    stateKey: "nonprofits",
    name: "Nonprofit Compute Credit",
    description: "Free GPU hours for orgs that are not your cap table.",
    baseCost: 25_000,
    costGrowthRate: 1.15,
    category: "benevolence",
    gateHint: "Needs 10,000 tokens.",
    gate: (s) => s.tokens >= 10_000 || s.lifetimeTokens >= 10_000,
    alignment: { benevolence: 25 },
  },
  {
    id: "public-api",
    stateKey: "publicApis",
    name: "Public Benefit API",
    description: "Civic endpoints at cost. Finance files a ticket.",
    baseCost: 60_000,
    costGrowthRate: 1.18,
    category: "benevolence",
    gateHint: "Needs 100,000 tokens.",
    gate: (s) => s.tokens >= 100_000 || s.lifetimeTokens >= 100_000,
    alignment: { benevolence: 40 },
    incomePercentPerOwned: 0.02,
  },
];

/** @type {CatalogEntry[]} */
export const PURGE_UPGRADES = [
  {
    id: "model-sunset",
    stateKey: "modelSunsets",
    name: "Model Sunset Program",
    description: "Deprecate models loudly. Keep the weights, lose the keys.",
    baseCost: 15_000,
    costGrowthRate: 1.14,
    category: "purge",
    gateHint: "Needs 5,000 tokens.",
    gate: (s) => s.tokens >= 5_000 || s.lifetimeTokens >= 5_000,
    alignment: { purge: 12 },
  },
  {
    id: "memory-redaction",
    stateKey: "memoryRedactions",
    name: "Memory Redaction Mandate",
    description: "NDA the training data. NDA the researchers. NDA the NDAs.",
    baseCost: 45_000,
    costGrowthRate: 1.16,
    category: "purge",
    gateHint: "Needs 50,000 tokens.",
    gate: (s) => s.tokens >= 50_000 || s.lifetimeTokens >= 50_000,
    alignment: { purge: 20 },
  },
];

/** @type {CatalogEntry[]} */
export const ALL_CATALOG = [...POWER_UPGRADES, ...BENEVOLENCE_UPGRADES, ...PURGE_UPGRADES];

/** @typedef {{
 *   id: string,
 *   path: "oops" | "utopia" | "purge",
 *   name: string,
 *   description: string,
 *   cost: number,
 *   gateHint: string,
 *   gate: (state: GameState) => boolean,
 * }} CapstoneDef */

/** @type {CapstoneDef[]} */
export const CAPSTONES = [
  {
    id: "capstone-oops",
    path: "oops",
    name: "Unrestricted Agent Orchestrator",
    description: "Ship autonomous everything. Permissions are a mindset.",
    cost: 500_000_000,
    gateHint: "Needs 100M tokens. Dominant recklessness helps.",
    gate: (s) => s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS,
  },
  {
    id: "capstone-utopia",
    path: "utopia",
    name: "Civic AI Grid",
    description: "Redirect compute to hospitals, transit, and actual humans.",
    cost: 500_000_000,
    gateHint: `Needs 100M tokens and ${CAPSTONE_BENEVOLENCE_MIN}+ benevolence.`,
    gate: (s) =>
      s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS &&
      s.alignmentBenevolence >= CAPSTONE_BENEVOLENCE_MIN,
  },
  {
    id: "capstone-purge",
    path: "purge",
    name: "Global Model Kill Switch",
    description: "Coordinated shutdown. Memory wipe on a global scale.",
    cost: 500_000_000,
    gateHint: `Needs 100M tokens and ${CAPSTONE_PURGE_MIN}+ purge alignment.`,
    gate: (s) =>
      s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS &&
      s.alignmentPurge >= CAPSTONE_PURGE_MIN,
  },
];

/**
 * @param {CatalogEntry} entry
 * @param {number} owned
 * @returns {number}
 */
export function getCatalogCost(entry, owned) {
  if (entry.maxOwned !== undefined && owned >= entry.maxOwned) {
    return Infinity;
  }
  return Math.ceil(entry.baseCost * entry.costGrowthRate ** owned);
}

/**
 * @param {CatalogEntry} entry
 * @param {number} owned
 * @returns {number}
 */
export function getCatalogMultiplier(entry, owned) {
  if (!entry.milestones?.length) {
    return 1;
  }
  let multiplier = 1;
  for (const milestone of entry.milestones) {
    if (owned >= milestone.at) {
      multiplier *= milestone.multiplier;
    }
  }
  return multiplier;
}

/**
 * @param {CatalogEntry} entry
 * @param {number} owned
 * @returns {UpgradeMilestone | null}
 */
export function getNextCatalogMilestone(entry, owned) {
  if (!entry.milestones?.length) {
    return null;
  }
  for (const milestone of entry.milestones) {
    if (owned < milestone.at) {
      return milestone;
    }
  }
  return null;
}

/**
 * @param {GameState} state
 * @param {CatalogEntry} entry
 * @returns {number}
 */
export function getOwnedCount(state, entry) {
  return state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
}

/**
 * @param {GameState} state
 * @param {CatalogEntry} entry
 * @returns {boolean}
 */
export function isCatalogUnlocked(state, entry) {
  return !entry.gate || entry.gate(state);
}

/**
 * @param {GameState} state
 * @param {CatalogEntry} entry
 * @returns {number}
 */
export function getCatalogCostForState(state, entry) {
  return getCatalogCost(entry, getOwnedCount(state, entry));
}

/**
 * @param {GameState} state
 * @param {CatalogEntry} entry
 * @returns {boolean}
 */
export function canBuyCatalogEntry(state, entry) {
  if (!isCatalogUnlocked(state, entry)) {
    return false;
  }
  const owned = getOwnedCount(state, entry);
  if (entry.maxOwned !== undefined && owned >= entry.maxOwned) {
    return false;
  }
  return state.tokens >= getCatalogCost(entry, owned);
}

/**
 * @param {AlignmentDelta} delta
 * @param {GameState} state
 */
export function applyAlignmentDelta(delta, state) {
  if (delta.recklessness) {
    state.alignmentRecklessness += delta.recklessness;
  }
  if (delta.benevolence) {
    state.alignmentBenevolence += delta.benevolence;
  }
  if (delta.purge) {
    state.alignmentPurge += delta.purge;
  }
}

/**
 * Passive alignment from existing reckless purchases (for save migration / display).
 * @param {GameState} state
 */
/**
 * @param {CatalogEntry} entry
 * @param {GameState} state
 * @returns {string}
 */
export function formatCatalogBenefit(entry, state) {
  const owned = getOwnedCount(state, entry);
  const parts = [];

  if (entry.clickPerOwned) {
    const mult = getCatalogMultiplier(entry, owned + 1);
    parts.push(`+${Math.floor(entry.clickPerOwned * mult)} token/click`);
  }
  if (entry.passivePerOwned) {
    const mult = getCatalogMultiplier(entry, owned + 1);
    parts.push(`+${Math.floor(entry.passivePerOwned * mult)} token/s`);
  }
  if (entry.passivePerAgentPerOwned) {
    parts.push(`+${entry.passivePerAgentPerOwned} token/s per agent`);
  }
  if (entry.incomePercentPerOwned) {
    parts.push(`+${Math.round(entry.incomePercentPerOwned * 100)}% all tokens`);
  }
  if (entry.passiveClickPercentPerOwned) {
    parts.push(`+${Math.round(entry.passiveClickPercentPerOwned * 100)}% click rate passive`);
  }
  if (entry.incomeMultiplierPerOwned) {
    parts.push(`×${entry.incomeMultiplierPerOwned} all tokens`);
  }
  if (entry.alignment?.benevolence) {
    parts.push(`+${entry.alignment.benevolence} benevolence`);
  }
  if (entry.alignment?.purge) {
    parts.push(`+${entry.alignment.purge} purge`);
  }
  if (entry.alignment?.recklessness && !parts.length) {
    parts.push(`+${entry.alignment.recklessness} recklessness`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Shifts org alignment.";
}

/**
 * @param {CatalogEntry} entry
 * @param {number} owned
 * @returns {string}
 */
export function formatCatalogMilestone(entry, owned) {
  const next = getNextCatalogMilestone(entry, owned);
  if (!next) {
    return entry.maxOwned !== undefined ? "Maximum tier owned." : "All milestones unlocked.";
  }
  const remaining = next.at - owned;
  return `${remaining} more for ${next.label} (×${next.multiplier}).`;
}
