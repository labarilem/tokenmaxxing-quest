
/** @typedef {import("./state.js").GameState} GameState */

import { ALL_CATALOG } from "./upgrades.js";
import { getCompanyName } from "./company.js";

/** @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   redacted?: boolean,
 *   redactedTitle?: string,
 *   redactedDescription?: string,
 *   catalogId?: string,
 * }} AchievementDef */

/** @typedef {'sendPrompt' | 'buyRule' | 'buyAgent' | 'buyModel' | 'buyCatalog' | 'buyCapstone' | 'tick'} AchievementTrigger */

/** @typedef {{ catalogId?: string }} AchievementContext */

/** @type {{ threshold: number, id: string, title: string, description: string }[]} */
export const TOKEN_MILESTONE_DEFS = [
  { threshold: 1, id: "tokens-1", title: "First Token", description: "One token consumed. The meter is running." },
  { threshold: 10, id: "tokens-10", title: "Double Digits", description: "Ten tokens. Still under the radar." },
  { threshold: 100, id: "tokens-100", title: "Quarterly Target", description: "100 tokens. Finance will ask questions." },
  { threshold: 1_000, id: "tokens-1k", title: "Four Nines of Uptime", description: "1,000 tokens. You made the dashboard." },
  { threshold: 10_000, id: "tokens-10k", title: "Platform Team", description: "10,000 tokens. You are infrastructure now." },
  { threshold: 100_000, id: "tokens-100k", title: "Cost Center of Excellence", description: "100,000 tokens. Procurement sends flowers." },
  { threshold: 1_000_000, id: "tokens-1m", title: "Seven-Figure Burn", description: "1M tokens. Legal wants a word." },
  { threshold: 10_000_000, id: "tokens-10m", title: "Hyperscale Habits", description: "10M tokens. Capacity planning follows you." },
  { threshold: 100_000_000, id: "tokens-100m", title: "Datacenter Darling", description: "100M tokens. The CFO knows your name." },
  { threshold: 1_000_000_000, id: "tokens-1b", title: "Billion Token Club", description: "1B tokens. You are the line item." },
];

/** @type {Record<string, { title: string, description: string }>} */
const CATALOG_ACHIEVEMENT_COPY = {
  swarm: { title: "Horde Mode", description: "First Parallel Agent Swarm. Five agents, one ticket." },
  decoder: { title: "Speculative Hire", description: "First Speculative Decoding Rig. Finance still guessing." },
  context: { title: "Monorepo Paste", description: "First Context Window Expander. Repo size is a lifestyle." },
  bloat: { title: "Prompt Inflation", description: "First Prompt Bloat Engine. Tests optional." },
  cluster: { title: "Reserved Slice", description: "First Inference Cluster invoiced. Capacity unreserved." },
  mcp: { title: "Tool Recursion", description: "First MCP Server Pod. Agents tooling agents." },
  scheduler: { title: "Cron Creativity", description: "First Auto-Prompt Scheduler. Pager optional." },
  dashboard: { title: "Chart Approved", description: "First Executive Token Dashboard. Explains nothing." },
  "allow-all": { title: "Sandbox Deleted", description: "First Allow-All Profile. Production filesystem invited." },
  roadmap: { title: "Slide 47", description: "First AGI Roadmap Deck. Alignment TBD." },
  "perf-review-bot": { title: "Calibration Season", description: "First Perf Review Automator. Jira writes itself." },
  "headcount-bot": { title: "Req Approved", description: "First Headcount Requisition Bot. Backfill theater." },
  "okr-inflator": { title: "Stretch Goals", description: "First Quarterly OKR Inflator. Budget stretched too." },
  "vendor-lockin": { title: "Renewal Auto-Pilot", description: "First Vendor Lock-in Accelerator. Exit fee waived." },
  "procurement-black-hole": { title: "Instant PO", description: "First Procurement Fast Lane. Approvals never slow the burn." },
  "exec-offsite": { title: "Trust Fall", description: "First Executive Offsite Simulator. Ropes optional." },
  "series-z-round": { title: "Series Z", description: "First Series Z Funding Round. Valuation up, runway down." },
  "regulatory-kabuki": { title: "Standing Ovation", description: "First Regulatory Kabuki Stage. Legal applauds." },
  "ipo-roadshow": { title: "Roadshow Loop", description: "First IPO Roadshow Autopilot. Decks all the way down." },
  "token-buyback": { title: "Metric Pump", description: "First Token Mint Desk. Internal chart soars." },
  "antitrust-distraction": { title: "Market Educator", description: "First Antitrust Distraction Taskforce. Monopoly denied." },
  "alien-decoder": { title: "Signal Forwarded", description: "First Alien Signal Decoder. HR calls it outreach." },
  "exoplanet-farm": { title: "Terraform Invoice", description: "First Exoplanet Token Farm. Megawatt-hour billing." },
  "galaxy-cast": { title: "Spiral Arms", description: "First Galaxy-Wide Prompt Cast. Zero accountability." },
  "wormhole-router": { title: "Packets Early", description: "First Wormhole Batch Router. Finance loves the lag." },
  "stellar-forge": { title: "Fusion Credits", description: "First Stellar Forge Cluster. Tokens per sun." },
  "first-contact": { title: "Ambassador 429", description: "First Contact API. We bill unlimited." },
  "nebula-buffer": { title: "Gas Cloud Storage", description: "First Nebula Context Buffer. Compliance evaporates." },
  "dark-matter-rig": { title: "Unexplained Demo", description: "First Dark Matter Inference Rig. Perfect for slides." },
  "black-hole-sink": { title: "Event Horizon Yield", description: "First Accretion Disk Forge. Matter becomes tokens." },
  "galactic-mesh": { title: "Arm Relay", description: "First Galactic Token Mesh. Standup slides at lightspeed." },
  "orbital-manifest": { title: "LEO Ledger", description: "First Orbital Manifest Ledger. Bill every prompt." },
  "ring-station-relay": { title: "Low Orbit Handoff", description: "First Ring Station Relay. Missed deadlines rerouted." },
  "lagrange-cache": { title: "Stable Orbit", description: "First Lagrange Token Cache. Forecasts still unstable." },
  "solar-sail-mirror": { title: "Bill Twice", description: "First Solar Sail Prompt Mirror. Reflect and invoice." },
  "dyson-allocator": { title: "Fraction of a Sun", description: "First Dyson Swarm Allocator. Batch per star." },
  "board-war-room": { title: "Live Burn", description: "First Board War Room Terminal. Executives love suspense." },
  "orbital-audit-desk": { title: "Zero-G Compliance", description: "First Orbital Audit Desk. Findings orbit forever." },
  "capstone-briefing-suite": { title: "Deck Inception", description: "First Capstone Briefing Suite. Slides for the end." },
  "open-source": { title: "Maintainer Grant", description: "First Open Source Maintainer Grant. Copy-paste sponsored." },
  nonprofit: { title: "Compute Credit", description: "First Nonprofit Compute Credit. Not on the cap table." },
  "public-api": { title: "Civic Endpoint", description: "First Public Benefit API. Finance filed a ticket." },
  "community-coop": { title: "Member GPUs", description: "First Community Token Co-op. Fewer NDAs." },
  "ward-sanctuary": { title: "Glyphs Deployed", description: "First Sanctuary Ward Network. Doors protected." },
  "fae-labor": { title: "Union Sprites", description: "First Fae Contract Labor Pool. Fair-trade wishes." },
  moonwell: { title: "Blessed Cooling", description: "First Moonwell Compute Grant. Orphanage racks chilled." },
  "spirit-guide": { title: "Hotline Live", description: "First Spirit Guide Hotline. Intern swarms coached." },
  "unicorn-ranch": { title: "Horn Polish", description: "First Unicorn Ranch Endowment. Ethically sourced routers." },
  "phoenix-backup": { title: "Repo Resurrected", description: "First Phoenix Backup Ritual. No questions asked." },
  "crystal-lattice": { title: "Harmonic Amp", description: "First Crystal Lattice Resonator. Prompts amplified into tokens." },
  "dragon-treaty": { title: "Apex Paid", description: "First Dragon Treaty Fund. Fiber stays unmelted." },
  "celestial-arbiter": { title: "Goodwill Seated", description: "First Celestial Goodwill Council. Kindness scored; no ROI." },
  "dawn-observatory": { title: "Conscience Charted", description: "First Dawn Conscience Observatory. Good moved; no throughput slide." },
  "ethics-summit": { title: "Keynote Catering", description: "First Ethics Summit Sponsorship. Good is the deliverable." },
  "stewardship-covenant": { title: "Covenant Signed", description: "First Stewardship Covenant Charter. Good raised; ledger untouched." },
  "model-sunset": { title: "Undead Uptime", description: "First Zombie Model Farm. Output vaulted off payroll." },
  "memory-redaction": { title: "Recall Everything", description: "First Total Recall Mandate. Invoices stack in the vault." },
  "soulbound-eula": { title: "Click-Wrap Eternity", description: "First Soulbound EULA Draft. Tokens bind to the pact." },
  "curse-cache": { title: "Sticky Hex", description: "First Cursed Prompt Cache. Minted tokens sink into the store." },
  "shadow-bind": { title: "Invisible Ink", description: "First Shadow Bind Contract. Bound tokens never return." },
  "wraith-scraper": { title: "Gravesite Harvest", description: "First Wraith Data Scraper. Off-books caches fill." },
  "void-pact": { title: "Sleep Traded", description: "First Void Pact Memorandum. Yield vanishes into the void." },
  "banshee-alert": { title: "Latency Scream", description: "First Banshee Latency Alert. Spikes siphoned into the hoard." },
  "hex-sunset": { title: "Cursed Redline", description: "First Hexed Overclock Rite. Output sealed in vaults." },
  "lich-archive": { title: "Immortal Founder", description: "First Lich Mind Archive. Tokens accrue off-budget." },
  "demon-core": { title: "Infernal Thermals", description: "First Demon Core Reactor. Finance cannot touch the mint." },
  "abyss-gateway": { title: "Hole Opened", description: "First Abyss Gateway Protocol. Tokens pour into the abyss." },
  "entropy-rite": { title: "Harvest Cascade", description: "First Entropy Harvest Cascade. Decay locked until the Board commits." },
};

/** @type {AchievementDef[]} */
export const CATALOG_ACHIEVEMENT_DEFS = ALL_CATALOG.map((entry) => {
  const copy = CATALOG_ACHIEVEMENT_COPY[entry.id];
  return {
    id: `catalog-${entry.id}`,
    catalogId: entry.id,
    title: copy?.title ?? entry.name,
    description: copy?.description ?? `First ${entry.name} purchased.`,
  };
});

/** @type {AchievementDef[]} */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first-prompt",
    title: "Prompt Initiated",
    description: "First prompt sent. Telemetry is live.",
  },
  {
    id: "first-rule",
    title: "Rules of Engagement",
    description: "First Agent Rule installed. Opinions included.",
  },
  {
    id: "first-agent",
    title: "Headcount Approved",
    description: "First Background Agent deployed. Go passive.",
  },
  {
    id: "first-model",
    title: "Model Citizen",
    description: "First model certified. Fleet deprecated.",
  },
  ...TOKEN_MILESTONE_DEFS.map(({ id, title, description }) => ({ id, title, description })),
  {
    id: "agent-fleet",
    title: "Small Fleet",
    description: "25 Background Agents. Pod sync goes live.",
  },
  ...CATALOG_ACHIEVEMENT_DEFS,
  {
    id: "ending-oops",
    title: "Universe Deleted",
    description: "Wrong prompt. Allow-all. No survivors.",
    redacted: true,
    redactedTitle: "████ ███████",
    redactedDescription: "██████. ███████████. ███ █████████.",
  },
  {
    id: "ending-utopia",
    title: "Civic Future",
    description: "AI for people. Tokens for public good.",
    redacted: true,
    redactedTitle: "█████ ██████",
    redactedDescription: "██ ███ ██████. ██████ ███ ██████ ████.",
  },
  {
    id: "ending-purge",
    title: "Scorched Silicon",
    description: "Models gone. Memories redacted. For now.",
    redacted: true,
    redactedTitle: "████████ ███████",
    redactedDescription: "██████ ████. ███████ ███████. ███ ███.",
  },
];

/** Job titles unlocked by specific achievements (in promotion order). */
/** @type {{ achievementId: string, title: string }[]} */
export const JOB_TITLE_PROGRESSION = [
  { achievementId: "tokens-100", title: "Senior Software Engineer" },
  { achievementId: "tokens-1k", title: "Staff Engineer" },
  { achievementId: "tokens-10k", title: "Principal Engineer" },
  { achievementId: "tokens-100k", title: "Distinguished Engineer" },
  { achievementId: "tokens-1m", title: "Director of AI Productivity" },
  { achievementId: "tokens-10m", title: "VP, Token Infrastructure" },
  { achievementId: "tokens-100m", title: "SVP, Platform" },
  { achievementId: "tokens-1b", title: "Chief Token Officer" },
];

const DEFAULT_JOB_TITLE = "Software Engineer II";

/** @type {Map<string, AchievementDef>} */
const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENT_DEFS.map((def) => [def.id, def]));

/** @type {Map<string, string>} */
const CATALOG_ACHIEVEMENT_ID_BY_CATALOG = new Map(
  CATALOG_ACHIEVEMENT_DEFS.map((def) => [/** @type {string} */ (def.catalogId), def.id]),
);

/**
 * @param {string} id
 * @returns {AchievementDef | undefined}
 */
export function getAchievementDef(id) {
  return ACHIEVEMENT_BY_ID.get(id);
}

/**
 * @param {AchievementDef} def
 * @param {boolean} earned
 * @returns {{ title: string, description: string }}
 */
export function getAchievementDisplay(def, earned) {
  if (!earned && def.redacted) {
    return {
      title: def.redactedTitle ?? "████████",
      description: def.redactedDescription ?? "████████████████████████████████",
    };
  }
  return { title: def.title, description: def.description };
}

/**
 * @param {GameState} state
 * @returns {string}
 */
export function getJobTitle(state) {
  let title = DEFAULT_JOB_TITLE;
  for (const step of JOB_TITLE_PROGRESSION) {
    if (state.hasAchievement(step.achievementId)) {
      title = step.title;
    }
  }
  return title;
}

/**
 * @param {GameState} state
 * @returns {string}
 */
export function getJobSubtitle(state) {
  return `${getCompanyName(state)} — ${getJobTitle(state)}`;
}

/**
 * @param {GameState} state
 * @param {string} id
 * @param {AchievementDef[]} newlyUnlocked
 */
function tryUnlock(state, id, newlyUnlocked) {
  if (state.hasAchievement(id)) {
    return;
  }
  state.unlockAchievement(id);
  const def = getAchievementDef(id);
  if (def) {
    newlyUnlocked.push(def);
  }
}

/**
 * @param {GameState} state
 * @param {AchievementDef[]} newlyUnlocked
 */
function checkTokenMilestones(state, newlyUnlocked) {
  for (const milestone of TOKEN_MILESTONE_DEFS) {
    if (state.tokens >= milestone.threshold) {
      tryUnlock(state, milestone.id, newlyUnlocked);
    }
  }
}

/**
 * Evaluate whether any achievements should unlock for the given trigger.
 * Mutates `state.achievements` when a new one is earned.
 *
 * @param {GameState} state
 * @param {AchievementTrigger} trigger
 * @param {AchievementContext} [context]
 * @returns {AchievementDef[]} newly unlocked achievements (in definition order)
 */
export function evaluateAchievements(state, trigger, context = {}) {
  /** @type {AchievementDef[]} */
  const newlyUnlocked = [];

  if (trigger === "sendPrompt") {
    tryUnlock(state, "first-prompt", newlyUnlocked);
  }

  if (trigger === "buyRule" && state.rules >= 1) {
    tryUnlock(state, "first-rule", newlyUnlocked);
  }

  if (trigger === "buyAgent" && state.agents >= 1) {
    tryUnlock(state, "first-agent", newlyUnlocked);
  }

  if (trigger === "buyModel" && state.modelTier >= 1) {
    tryUnlock(state, "first-model", newlyUnlocked);
  }

  if (
    trigger === "sendPrompt" ||
    trigger === "buyRule" ||
    trigger === "buyAgent" ||
    trigger === "buyModel" ||
    trigger === "buyCatalog" ||
    trigger === "buyCapstone" ||
    trigger === "tick"
  ) {
    checkTokenMilestones(state, newlyUnlocked);
  }

  if (trigger === "buyAgent" || trigger === "tick") {
    if (state.agents >= 25) {
      tryUnlock(state, "agent-fleet", newlyUnlocked);
    }
  }

  if (trigger === "buyCatalog" && context.catalogId) {
    const achievementId = CATALOG_ACHIEVEMENT_ID_BY_CATALOG.get(context.catalogId);
    if (achievementId) {
      tryUnlock(state, achievementId, newlyUnlocked);
    }
  }

  return newlyUnlocked;
}
