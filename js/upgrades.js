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
 *   passivePerSwarmPerOwned?: number,
 *   passiveClickPercentPerOwned?: number,
 *   incomeMultiplierPerOwned?: number,
 *   category: "power" | "enterprise" | "space" | "orbital" | "benevolence" | "white-magic" | "purge" | "black-magic",
 * }} CatalogEntry */

export const ALIGNMENT_REVEAL_TOKENS = 25_000_000;
export const CAPSTONE_REVEAL_TOKENS = 500_000_000;
export const CAPSTONE_COST = 12_000_000_000;

/** Mid-game corporate layer pricing — separate from early generators. */
export const ENTERPRISE_COST_SCALE = 2;

/** Fleet and deep-space catalog tiers after the core loop. */
export const MID_GAME_COST_SCALE = 1.38;

/** Endgame orbital prep uses steeper costs without inflating early generators. */
export const ORBITAL_COST_SCALE = 3.5;
export const CAPSTONE_BENEVOLENCE_MIN = 150;
export const CAPSTONE_PURGE_MIN = 120;

/** Alignment-line upgrades now grant token income — costs scaled to preserve ending pace. */
export const ALIGNMENT_COST_SCALE = 1.05;

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
    baseCost: 60_000,
    costGrowthRate: 1.22,
    category: "power",
    gateHint: "Needs Grand 4.5 certified.",
    gate: (s) => s.modelTier >= 3,
    passiveClickPercentPerOwned: 0.025,
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
    incomePercentPerOwned: 0.25,
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
    gateHint: "Needs 500M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS,
    incomeMultiplierPerOwned: 1.35,
    alignment: { recklessness: 5 },
  },
];

/** Corporate ops layer — unlocks between fleet expansion and deep space. */
/** @type {CatalogEntry[]} */
export const ENTERPRISE_UPGRADES = [
  {
    id: "perf-review-bot",
    stateKey: "perfReviewBots",
    name: "Perf Review Automator",
    description: "Writes your self-review from last quarter's Jira noise.",
    baseCost: 750_000,
    costGrowthRate: 1.17,
    category: "enterprise",
    gateHint: "Needs 3M lifetime tokens or 2 Executive Dashboards.",
    gate: (s) => s.lifetimeTokens >= 3_000_000 || s.dashboards >= 2,
    passivePerOwned: 35,
    alignment: { recklessness: 2 },
    milestones: [
      { at: 10, multiplier: 2, label: "calibration season" },
      { at: 25, multiplier: 2, label: "stack rank mode" },
    ],
  },
  {
    id: "headcount-bot",
    stateKey: "headcountBots",
    name: "Headcount Requisition Bot",
    description: "Backfills headcount you were never allowed to cut.",
    baseCost: 1_200_000,
    costGrowthRate: 1.18,
    category: "enterprise",
    gateHint: "Needs 8M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 8_000_000,
    passivePerAgentPerOwned: 0.5,
    alignment: { recklessness: 2 },
  },
  {
    id: "okr-inflator",
    stateKey: "okrInflators",
    name: "Quarterly OKR Inflator",
    description: "Stretch goals that stretch the token budget instead.",
    baseCost: 2_500_000,
    costGrowthRate: 1.17,
    category: "enterprise",
    gateHint: "Needs 15M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 15_000_000,
    incomePercentPerOwned: 0.035,
    alignment: { recklessness: 3 },
  },
  {
    id: "vendor-lockin",
    stateKey: "vendorLockins",
    name: "Vendor Lock-in Accelerator",
    description: "Multi-year contracts guarantee agents keep burning tokens for years.",
    baseCost: 5_000_000,
    costGrowthRate: 1.16,
    category: "enterprise",
    gateHint: "Needs Fort 5.0 and 25M lifetime tokens.",
    gate: (s) => s.modelTier >= 5 && s.lifetimeTokens >= 25_000_000,
    passivePerOwned: 120,
    alignment: { recklessness: 3 },
    milestones: [
      { at: 8, multiplier: 2, label: "renewal auto-pilot" },
      { at: 20, multiplier: 2, label: "exit fee waived" },
    ],
  },
  {
    id: "procurement-black-hole",
    stateKey: "procurementBlackHoles",
    name: "Procurement Fast Lane",
    description: "Every PO auto-approved, so agents never pause between token burns.",
    baseCost: 12_000_000,
    costGrowthRate: 1.15,
    category: "enterprise",
    gateHint: "Needs 40M lifetime tokens and 2 Allow-All Profiles.",
    gate: (s) => s.lifetimeTokens >= 40_000_000 && s.allowAlls >= 2,
    incomePercentPerOwned: 0.06,
    alignment: { recklessness: 5 },
  },
  {
    id: "exec-offsite",
    stateKey: "execOffsites",
    name: "Executive Offsite Simulator",
    description: "Trust falls for agents; between rounds they brainstorm extra prompts.",
    baseCost: 22_000_000,
    costGrowthRate: 1.16,
    category: "enterprise",
    gateHint: "Needs 35M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 35_000_000,
    passivePerOwned: 90,
    alignment: { recklessness: 3 },
    milestones: [
      { at: 8, multiplier: 2, label: "rope course" },
      { at: 18, multiplier: 2, label: "vision sprint" },
    ],
  },
  {
    id: "series-z-round",
    stateKey: "seriesZRounds",
    name: "Series Z Funding Round",
    description: "Valuation up. Runway down. Tokens immaculate.",
    baseCost: 48_000_000,
    costGrowthRate: 1.15,
    category: "enterprise",
    gateHint: "Needs 60M lifetime tokens and 1 Procurement Black Hole.",
    gate: (s) => s.lifetimeTokens >= 60_000_000 && s.procurementBlackHoles >= 1,
    incomePercentPerOwned: 0.05,
    alignment: { recklessness: 4 },
  },
  {
    id: "regulatory-kabuki",
    stateKey: "regulatoryKabukis",
    name: "Regulatory Kabuki Stage",
    description: "Compliance theater buys cover for uncapped token burn backstage.",
    baseCost: 85_000_000,
    costGrowthRate: 1.14,
    category: "enterprise",
    gateHint: "Needs 90M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 90_000_000,
    incomePercentPerOwned: 0.03,
    alignment: { recklessness: 2 },
  },
  {
    id: "ipo-roadshow",
    stateKey: "ipoRoadshows",
    name: "IPO Roadshow Autopilot",
    description: "Pitch decks that pitch more pitch decks.",
    baseCost: 130_000_000,
    costGrowthRate: 1.14,
    category: "enterprise",
    gateHint: "Needs 120M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 120_000_000,
    passivePerOwned: 200,
    alignment: { recklessness: 3 },
  },
  {
    id: "token-buyback",
    stateKey: "tokenBuybacks",
    name: "Token Mint Desk",
    description: "Print fresh tokens to pump the internal metric. Number only goes up.",
    baseCost: 220_000_000,
    costGrowthRate: 1.13,
    category: "enterprise",
    gateHint: "Needs 180M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 180_000_000,
    incomePercentPerOwned: 0.035,
    alignment: { recklessness: 3 },
  },
  {
    id: "antitrust-distraction",
    stateKey: "antitrustDistractions",
    name: "Antitrust Distraction Taskforce",
    description: "Regulators watch the show while agents generate tokens unchecked.",
    baseCost: 350_000_000,
    costGrowthRate: 1.12,
    category: "enterprise",
    gateHint: "Needs 280M lifetime tokens and 1 Regulatory Kabuki Stage.",
    gate: (s) => s.lifetimeTokens >= 280_000_000 && s.regulatoryKabukis >= 1,
    passivePerOwned: 450,
    alignment: { recklessness: 4 },
  },
];

/** @type {CatalogEntry[]} */
export const SPACE_UPGRADES = [
  {
    id: "alien-decoder",
    stateKey: "alienDecoders",
    name: "Alien Signal Decoder",
    description: "HR forwards the ping; Legal calls it outreach.",
    baseCost: 2_500_000,
    costGrowthRate: 1.17,
    category: "space",
    gateHint: "Needs 50M lifetime tokens and 1 Regulatory Kabuki Stage.",
    gate: (s) => s.lifetimeTokens >= 50_000_000 && s.regulatoryKabukis >= 1,
    incomePercentPerOwned: 0.05,
    alignment: { recklessness: 4 },
  },
  {
    id: "exoplanet-farm",
    stateKey: "exoplanetFarms",
    name: "Exoplanet Token Farm",
    description: "Terraform a moon. Invoice by the megawatt-hour.",
    baseCost: 5_000_000,
    costGrowthRate: 1.16,
    category: "space",
    gateHint: "Needs 2 AGI Roadmap Decks.",
    gate: (s) => s.roadmaps >= 2,
    passivePerOwned: 250,
    alignment: { recklessness: 3 },
    milestones: [
      { at: 10, multiplier: 2, label: "habitable band" },
      { at: 25, multiplier: 2, label: "multi-moon yield" },
    ],
  },
  {
    id: "galaxy-cast",
    stateKey: "galaxyCasts",
    name: "Galaxy-Wide Prompt Cast",
    description: "One prompt, twelve spiral arms, zero accountability.",
    baseCost: 8_000_000,
    costGrowthRate: 1.18,
    category: "space",
    gateHint: "Needs 100M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 100_000_000,
    clickPerOwned: 20,
    alignment: { recklessness: 5 },
    milestones: [
      { at: 12, multiplier: 2, label: "quasar burst" },
      { at: 30, multiplier: 2, label: "supercluster reach" },
    ],
  },
  {
    id: "wormhole-router",
    stateKey: "wormholeRouters",
    name: "Wormhole Batch Router",
    description: "Packets arrive before you send them. Finance loves the lag.",
    baseCost: 15_000_000,
    costGrowthRate: 1.19,
    category: "space",
    gateHint: "Needs Fort 5.0 and 75 Background Agents.",
    gate: (s) => s.modelTier >= 5 && s.agents >= 75,
    incomePercentPerOwned: 0.08,
    alignment: { recklessness: 4 },
  },
  {
    id: "stellar-forge",
    stateKey: "stellarForges",
    name: "Stellar Forge Cluster",
    description: "Fusion credits priced in tokens per second per sun.",
    baseCost: 30_000_000,
    costGrowthRate: 1.17,
    category: "space",
    gateHint: "Needs 150M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 150_000_000,
    passivePerOwned: 1200,
    alignment: { recklessness: 6 },
    milestones: [
      { at: 8, multiplier: 2, label: "main-sequence burn" },
      { at: 20, multiplier: 2, label: "nova surplus" },
    ],
  },
  {
    id: "first-contact",
    stateKey: "firstContacts",
    name: "First Contact API",
    description: "Ambassadors rate-limit at 429. We bill unlimited.",
    baseCost: 55_000_000,
    costGrowthRate: 1.2,
    category: "space",
    gateHint: "Needs 25 Swarms and 15 Inference Clusters.",
    gate: (s) => s.swarms >= 25 && s.clusters >= 15,
    passivePerSwarmPerOwned: 2,
    alignment: { recklessness: 5 },
  },
  {
    id: "nebula-buffer",
    stateKey: "nebulaBuffers",
    name: "Nebula Context Buffer",
    description: "Store prompts in gas clouds. Compliance evaporates.",
    baseCost: 120_000_000,
    costGrowthRate: 1.19,
    category: "space",
    gateHint: "Needs 15 Auto-Prompt Schedulers.",
    gate: (s) => s.schedulers >= 15,
    passiveClickPercentPerOwned: 0.07,
    alignment: { recklessness: 3 },
  },
  {
    id: "dark-matter-rig",
    stateKey: "darkMatterRigs",
    name: "Dark Matter Inference Rig",
    description: "Runs on stuff we cannot explain. Perfect for demos.",
    baseCost: 150_000_000,
    costGrowthRate: 1.16,
    category: "space",
    gateHint: "Needs 200M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 200_000_000,
    incomePercentPerOwned: 0.15,
    alignment: { recklessness: 8 },
  },
  {
    id: "black-hole-sink",
    stateKey: "blackHoleSinks",
    name: "Accretion Disk Forge",
    description: "Spin infalling matter into tokens at the event horizon. Output bends spacetime.",
    baseCost: 250_000_000,
    costGrowthRate: 1,
    maxOwned: 2,
    category: "space",
    gateHint: "Needs 300M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 300_000_000,
    incomeMultiplierPerOwned: 1.35,
    alignment: { recklessness: 10 },
  },
  {
    id: "galactic-mesh",
    stateKey: "galacticMeshes",
    name: "Galactic Token Mesh",
    description: "Interstellar CDN for your standup slides.",
    baseCost: 400_000_000,
    costGrowthRate: 1.15,
    category: "space",
    gateHint: "Needs 350M lifetime tokens and 1 Black Hole Sink.",
    gate: (s) => s.lifetimeTokens >= 350_000_000 && s.blackHoleSinks >= 1,
    passivePerOwned: 3500,
    alignment: { recklessness: 7 },
    milestones: [
      { at: 5, multiplier: 2, label: "arm relay" },
      { at: 12, multiplier: 2, label: "supercluster mesh" },
    ],
  },
];

/** Orbital infrastructure — late-game layer before board capstones. */
/** @type {CatalogEntry[]} */
export const ORBITAL_UPGRADES = [
  {
    id: "orbital-manifest",
    stateKey: "orbitalManifests",
    name: "Orbital Manifest Ledger",
    description: "Track every prompt in LEO. Lose none, bill all.",
    baseCost: 320_000_000,
    costGrowthRate: 1.16,
    category: "orbital",
    gateHint: "Needs 340M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 340_000_000,
    passivePerOwned: 600,
    alignment: { recklessness: 6 },
  },
  {
    id: "ring-station-relay",
    stateKey: "ringStationRelays",
    name: "Ring Station Relay",
    description: "Low-orbit handoff for prompts that missed the deadline.",
    baseCost: 280_000_000,
    costGrowthRate: 1.16,
    category: "orbital",
    gateHint: "Needs 380M lifetime tokens and 1 Orbital Manifest Ledger.",
    gate: (s) => s.lifetimeTokens >= 380_000_000 && s.orbitalManifests >= 1,
    passivePerOwned: 800,
    alignment: { recklessness: 5 },
  },
  {
    id: "lagrange-cache",
    stateKey: "lagrangeCaches",
    name: "Lagrange Token Cache",
    description: "Stable orbit for unstable spend forecasts.",
    baseCost: 420_000_000,
    costGrowthRate: 1.15,
    category: "orbital",
    gateHint: "Needs 420M lifetime tokens and 1 Galactic Token Mesh.",
    gate: (s) => s.lifetimeTokens >= 420_000_000 && s.galacticMeshes >= 1,
    incomePercentPerOwned: 0.035,
    alignment: { recklessness: 5 },
  },
  {
    id: "solar-sail-mirror",
    stateKey: "solarSailMirrors",
    name: "Solar Sail Prompt Mirror",
    description: "Reflect prompts around the planet. Bill twice.",
    baseCost: 550_000_000,
    costGrowthRate: 1.17,
    category: "orbital",
    gateHint: "Needs 460M lifetime tokens and 1 Ring Station Relay.",
    gate: (s) => s.lifetimeTokens >= 460_000_000 && s.ringStationRelays >= 1,
    clickPerOwned: 12,
    alignment: { recklessness: 4 },
  },
  {
    id: "dyson-allocator",
    stateKey: "dysonAllocators",
    name: "Dyson Swarm Allocator",
    description: "Fraction of a sun per inference batch.",
    baseCost: 700_000_000,
    costGrowthRate: 1,
    maxOwned: 2,
    category: "orbital",
    gateHint: "Needs 500M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS,
    incomeMultiplierPerOwned: 1.15,
    alignment: { recklessness: 8 },
  },
  {
    id: "board-war-room",
    stateKey: "boardWarRooms",
    name: "Board War Room Terminal",
    description: "Live burn chart for executives who love suspense.",
    baseCost: 900_000_000,
    costGrowthRate: 1.14,
    category: "orbital",
    gateHint: "Needs 520M lifetime tokens and 1 Dyson Swarm Allocator.",
    gate: (s) => s.lifetimeTokens >= 520_000_000 && s.dysonAllocators >= 1,
    alignment: { recklessness: 6 },
    incomePercentPerOwned: 0.04,
  },
  {
    id: "orbital-audit-desk",
    stateKey: "orbitalAuditDesks",
    name: "Orbital Audit Desk",
    description: "Zero-G audits spool endless reports; every finding is billable tokens.",
    baseCost: 1_200_000_000,
    costGrowthRate: 1.13,
    category: "orbital",
    gateHint: "Needs 540M lifetime tokens and 1 Board War Room.",
    gate: (s) => s.lifetimeTokens >= 540_000_000 && s.boardWarRooms >= 1,
    alignment: { recklessness: 5 },
    passivePerOwned: 280,
  },
  {
    id: "capstone-briefing-suite",
    stateKey: "capstoneBriefingSuites",
    name: "Capstone Briefing Suite",
    description: "Slide deck for the slide deck that ends the world.",
    baseCost: 1_500_000_000,
    costGrowthRate: 1,
    maxOwned: 1,
    category: "orbital",
    gateHint: "Needs 560M lifetime tokens and 1 Orbital Audit Desk.",
    gate: (s) => s.lifetimeTokens >= 560_000_000 && s.orbitalAuditDesks >= 1,
    alignment: { recklessness: 10 },
    incomePercentPerOwned: 0.05,
  },
];

/** @type {CatalogEntry[]} */
export const BENEVOLENCE_UPGRADES = [
  {
    id: "open-source",
    stateKey: "openSource",
    name: "Open Source Maintainer Grant",
    description: "Sponsor the libs your agents copy-paste from.",
    baseCost: 9_500,
    costGrowthRate: 1.26,
    category: "benevolence",
    gateHint: "Needs 1,000 tokens.",
    gate: (s) => s.tokens >= 1_000 || s.lifetimeTokens >= 1_000,
    alignment: { benevolence: 15 },
    passivePerOwned: 2,
  },
  {
    id: "nonprofit",
    stateKey: "nonprofits",
    name: "Nonprofit Compute Credit",
    description: "Free GPU hours for orgs that are not your cap table.",
    baseCost: 30_000,
    costGrowthRate: 1.28,
    category: "benevolence",
    gateHint: "Needs 10,000 tokens.",
    gate: (s) => s.tokens >= 10_000 || s.lifetimeTokens >= 10_000,
    alignment: { benevolence: 25 },
    passivePerOwned: 4,
  },
  {
    id: "public-api",
    stateKey: "publicApis",
    name: "Public Benefit API",
    description: "Civic endpoints at cost. Finance files a ticket.",
    baseCost: 72_000,
    costGrowthRate: 1.26,
    category: "benevolence",
    gateHint: "Needs 100,000 tokens.",
    gate: (s) => s.tokens >= 100_000 || s.lifetimeTokens >= 100_000,
    alignment: { benevolence: 40 },
    incomePercentPerOwned: 0.018,
  },
  {
    id: "community-coop",
    stateKey: "communityCoops",
    name: "Community Token Co-op",
    description: "Member-owned GPUs. No cap table, fewer NDAs.",
    baseCost: 3_200_000,
    costGrowthRate: 1.22,
    category: "benevolence",
    gateHint: "Needs 8M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 8_000_000,
    alignment: { benevolence: 18 },
    passivePerOwned: 18,
  },
  {
    id: "ward-sanctuary",
    stateKey: "wardSanctuaries",
    name: "Sanctuary Ward Network",
    description: "Blessed racks never throttle, so protected data centers mint more tokens.",
    baseCost: 100_000,
    costGrowthRate: 1.20,
    category: "white-magic",
    gateHint: "Needs 500K lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 500_000,
    alignment: { benevolence: 10 },
    passivePerOwned: 6,
  },
  {
    id: "fae-labor",
    stateKey: "faeLabors",
    name: "Fae Contract Labor Pool",
    description: "Fair-trade wish fulfillment. Unionized sprites.",
    baseCost: 250_000,
    costGrowthRate: 1.21,
    category: "white-magic",
    gateHint: "Needs 1M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 1_000_000,
    alignment: { benevolence: 12 },
    passivePerOwned: 8,
  },
  {
    id: "moonwell",
    stateKey: "moonwells",
    name: "Moonwell Compute Grant",
    description: "Blessed cooling for orphanage GPU racks.",
    baseCost: 500_000,
    costGrowthRate: 1.15,
    category: "white-magic",
    gateHint: "Needs 2M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 2_000_000,
    alignment: { benevolence: 18 },
    incomePercentPerOwned: 0.027,
  },
  {
    id: "spirit-guide",
    stateKey: "spiritGuides",
    name: "Spirit Guide Hotline",
    description: "Ethereal coaches for overwhelmed intern swarms.",
    baseCost: 1_000_000,
    costGrowthRate: 1.24,
    category: "white-magic",
    gateHint: "Needs 5M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 5_000_000,
    alignment: { benevolence: 15 },
    passivePerOwned: 15,
  },
  {
    id: "unicorn-ranch",
    stateKey: "unicornRanches",
    name: "Unicorn Ranch Endowment",
    description: "Ethically sourced horn polish for routers.",
    baseCost: 2_500_000,
    costGrowthRate: 1.25,
    category: "white-magic",
    gateHint: "Needs 10M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 10_000_000,
    alignment: { benevolence: 20 },
    passivePerOwned: 25,
  },
  {
    id: "phoenix-backup",
    stateKey: "phoenixBackups",
    name: "Phoenix Backup Ritual",
    description: "Resurrect lost repos so agents re-index every line into tokens.",
    baseCost: 5_000_000,
    costGrowthRate: 1.16,
    category: "white-magic",
    gateHint: "Needs 25M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 25_000_000,
    alignment: { benevolence: 22 },
    incomePercentPerOwned: 0.035,
  },
  {
    id: "crystal-lattice",
    stateKey: "crystalLattices",
    name: "Crystal Lattice Resonator",
    description: "Harmonic frequencies amplify every prompt into extra tokens.",
    baseCost: 12_000_000,
    costGrowthRate: 1.15,
    category: "white-magic",
    gateHint: "Needs 50M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 50_000_000,
    alignment: { benevolence: 25 },
    passivePerOwned: 60,
  },
  {
    id: "dragon-treaty",
    stateKey: "dragonTreaties",
    name: "Dragon Treaty Fund",
    description: "Apex predators exhale spare compute; the fiber runs hotter and richer.",
    baseCost: 25_000_000,
    costGrowthRate: 1.14,
    category: "white-magic",
    gateHint: "Needs 100M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 100_000_000,
    alignment: { benevolence: 30 },
    passivePerOwned: 100,
  },
  {
    id: "celestial-arbiter",
    stateKey: "celestialArbiters",
    name: "Celestial Arbiter Council",
    description: "Supernatural mediators for agent-vs-agent disputes.",
    baseCost: 60_000_000,
    costGrowthRate: 1.13,
    category: "white-magic",
    gateHint: "Needs 150M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 150_000_000,
    alignment: { benevolence: 35 },
    incomePercentPerOwned: 0.05,
  },
  {
    id: "dawn-observatory",
    stateKey: "dawnObservatories",
    name: "Dawn Observatory Grant",
    description: "Fund stargazers who refuse to weaponize prompts.",
    baseCost: 120_000_000,
    costGrowthRate: 1.12,
    category: "white-magic",
    gateHint: "Needs 250M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 250_000_000,
    alignment: { benevolence: 40 },
    incomePercentPerOwned: 0.025,
  },
  {
    id: "ethics-summit",
    stateKey: "ethicsSummits",
    name: "Ethics Summit Sponsorship",
    description: "Keynotes about responsibility. Catering billed to tokens.",
    baseCost: 220_000_000,
    costGrowthRate: 1,
    maxOwned: 1,
    category: "white-magic",
    gateHint: "Needs 200M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 200_000_000,
    alignment: { benevolence: 30 },
    incomePercentPerOwned: 0.03,
  },
  {
    id: "stewardship-covenant",
    stateKey: "stewardshipCovenants",
    name: "Stewardship Covenant Charter",
    description: "Binding civic compute pledge. Lawyers bill hourly in tokens.",
    baseCost: 900_000_000,
    costGrowthRate: 1,
    maxOwned: 1,
    category: "white-magic",
    gateHint: "Needs 420M lifetime tokens and 1 Ethics Summit Sponsorship.",
    gate: (s) => s.lifetimeTokens >= 420_000_000 && s.ethicsSummits >= 1,
    alignment: { benevolence: 35 },
    incomePercentPerOwned: 0.04,
  },
];

/** @type {CatalogEntry[]} */
export const PURGE_UPGRADES = [
  {
    id: "model-sunset",
    stateKey: "modelSunsets",
    name: "Zombie Model Farm",
    description: "Keep retired models shambling; they mindlessly emit tokens forever.",
    baseCost: 18_000,
    costGrowthRate: 1.26,
    category: "purge",
    gateHint: "Needs 5,000 tokens.",
    gate: (s) => s.tokens >= 5_000 || s.lifetimeTokens >= 5_000,
    alignment: { purge: 12 },
    passivePerOwned: 2,
  },
  {
    id: "memory-redaction",
    stateKey: "memoryRedactions",
    name: "Total Recall Mandate",
    description: "Reprocess every memory through every model on loop. Nothing forgotten, everything billed.",
    baseCost: 52_000,
    costGrowthRate: 1.28,
    category: "purge",
    gateHint: "Needs 50,000 tokens.",
    gate: (s) => s.tokens >= 50_000 || s.lifetimeTokens >= 50_000,
    alignment: { purge: 20 },
    passivePerOwned: 5,
  },
  {
    id: "soulbound-eula",
    stateKey: "soulboundEulas",
    name: "Soulbound EULA Draft",
    description: "Click-wrap eternity. Revocation is a myth.",
    baseCost: 3_200_000,
    costGrowthRate: 1.22,
    category: "purge",
    gateHint: "Needs 8M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 8_000_000,
    alignment: { purge: 18 },
    passivePerOwned: 14,
  },
  {
    id: "curse-cache",
    stateKey: "curseCaches",
    name: "Cursed Prompt Cache",
    description: "Replay competitor prompts through our models to mint extra tokens.",
    baseCost: 120_000,
    costGrowthRate: 1.22,
    category: "black-magic",
    gateHint: "Needs 250K lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 250_000,
    alignment: { purge: 15 },
    passivePerOwned: 5,
  },
  {
    id: "shadow-bind",
    stateKey: "shadowBinds",
    name: "Shadow Bind Contract",
    description: "NDA signed in invisible ink and borrowed ink.",
    baseCost: 300_000,
    costGrowthRate: 1.23,
    category: "black-magic",
    gateHint: "Needs 1M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 1_000_000,
    alignment: { purge: 18 },
    passivePerOwned: 8,
  },
  {
    id: "wraith-scraper",
    stateKey: "wraithScrapers",
    name: "Wraith Data Scraper",
    description: "Harvest training rows from forgotten gravesites.",
    baseCost: 750_000,
    costGrowthRate: 1.24,
    category: "black-magic",
    gateHint: "Needs 3M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 3_000_000,
    alignment: { purge: 20 },
    passivePerOwned: 18,
  },
  {
    id: "void-pact",
    stateKey: "voidPacts",
    name: "Void Pact Memorandum",
    description: "Trade three years of sleep for one training epoch.",
    baseCost: 1_500_000,
    costGrowthRate: 1.25,
    category: "black-magic",
    gateHint: "Needs 8M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 8_000_000,
    alignment: { purge: 22 },
    passivePerOwned: 30,
  },
  {
    id: "banshee-alert",
    stateKey: "bansheeAlerts",
    name: "Banshee Latency Alert",
    description: "Screams whenever output dips, whipping agents into generating more.",
    baseCost: 4_000_000,
    costGrowthRate: 1.24,
    category: "black-magic",
    gateHint: "Needs 15M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 15_000_000,
    alignment: { purge: 24 },
    passivePerOwned: 45,
  },
  {
    id: "hex-sunset",
    stateKey: "hexSunsets",
    name: "Hexed Overclock Rite",
    description: "Curse aging models to spew tokens at redline until they burn out.",
    baseCost: 10_000_000,
    costGrowthRate: 1.15,
    category: "black-magic",
    gateHint: "Needs 35M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 35_000_000,
    alignment: { purge: 28 },
    incomePercentPerOwned: 0.02,
  },
  {
    id: "lich-archive",
    stateKey: "lichArchives",
    name: "Lich Mind Archive",
    description: "Immortal founder knowledge. Mortal liability shield.",
    baseCost: 22_000_000,
    costGrowthRate: 1.14,
    category: "black-magic",
    gateHint: "Needs 75M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 75_000_000,
    alignment: { purge: 32 },
    passivePerOwned: 80,
  },
  {
    id: "demon-core",
    stateKey: "demonCores",
    name: "Demon Core Reactor",
    description: "Infernal thermals. Carbon offsets sold separately.",
    baseCost: 45_000_000,
    costGrowthRate: 1.13,
    category: "black-magic",
    gateHint: "Needs 120M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 120_000_000,
    alignment: { purge: 35 },
    incomePercentPerOwned: 0.03,
  },
  {
    id: "abyss-gateway",
    stateKey: "abyssGateways",
    name: "Abyss Gateway Protocol",
    description: "Open a gateway to bottomless compute; tokens pour through the dark.",
    baseCost: 90_000_000,
    costGrowthRate: 1.12,
    category: "black-magic",
    gateHint: "Needs 200M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 200_000_000,
    alignment: { purge: 38 },
    passivePerOwned: 150,
  },
  {
    id: "entropy-rite",
    stateKey: "entropyRites",
    name: "Entropy Harvest Cascade",
    description: "Convert waste heat and decay into raw tokens. Three incantations, endless output.",
    baseCost: 180_000_000,
    costGrowthRate: 1.11,
    category: "black-magic",
    gateHint: "Needs 300M lifetime tokens.",
    gate: (s) => s.lifetimeTokens >= 300_000_000,
    alignment: { purge: 45 },
    incomePercentPerOwned: 0.04,
  },
];

/** @type {CatalogEntry[]} */
export const ALL_CATALOG = [
  ...POWER_UPGRADES,
  ...ENTERPRISE_UPGRADES,
  ...SPACE_UPGRADES,
  ...ORBITAL_UPGRADES,
  ...BENEVOLENCE_UPGRADES,
  ...PURGE_UPGRADES,
];

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
    cost: CAPSTONE_COST,
    gateHint: `Needs ${CAPSTONE_REVEAL_TOKENS / 1_000_000}M lifetime tokens and Capstone Briefing Suite. Dominant recklessness helps.`,
    gate: (s) =>
      s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS && s.capstoneBriefingSuites >= 1,
  },
  {
    id: "capstone-utopia",
    path: "utopia",
    name: "Civic AI Grid",
    description: "Redirect compute to hospitals, transit, and actual humans.",
    cost: CAPSTONE_COST,
    gateHint: `Needs ${CAPSTONE_REVEAL_TOKENS / 1_000_000}M lifetime tokens, Capstone Briefing Suite, Ethics Summit, Stewardship Covenant, and ${CAPSTONE_BENEVOLENCE_MIN}+ benevolence.`,
    gate: (s) =>
      s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS &&
      s.capstoneBriefingSuites >= 1 &&
      s.ethicsSummits >= 1 &&
      s.stewardshipCovenants >= 1 &&
      s.alignmentBenevolence >= CAPSTONE_BENEVOLENCE_MIN,
  },
  {
    id: "capstone-purge",
    path: "purge",
    name: "Global Model Kill Switch",
    description: "Coordinated shutdown. Memory wipe on a global scale.",
    cost: CAPSTONE_COST,
    gateHint: `Needs ${CAPSTONE_REVEAL_TOKENS / 1_000_000}M lifetime tokens, Capstone Briefing Suite, and ${CAPSTONE_PURGE_MIN}+ purge alignment.`,
    gate: (s) =>
      s.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS &&
      s.capstoneBriefingSuites >= 1 &&
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
  const scale = getCatalogCostScale(entry);
  return Math.ceil(entry.baseCost * entry.costGrowthRate ** owned * scale);
}

/**
 * @param {CatalogEntry} entry
 * @returns {number}
 */
export function getCatalogCostScale(entry) {
  if (entry.category === "orbital") {
    return ORBITAL_COST_SCALE;
  }
  if (entry.category === "enterprise") {
    return ENTERPRISE_COST_SCALE;
  }
  if (entry.category === "power" || entry.category === "space") {
    return MID_GAME_COST_SCALE;
  }
  if (
    entry.category === "benevolence" ||
    entry.category === "white-magic" ||
    entry.category === "purge" ||
    entry.category === "black-magic"
  ) {
    return ALIGNMENT_COST_SCALE;
  }
  return 1;
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
 * @param {{ ignoreGate?: boolean }} [options] bypass the unlock gate (test mode)
 * @returns {boolean}
 */
export function canBuyCatalogEntry(state, entry, { ignoreGate = false } = {}) {
  if (!ignoreGate && !isCatalogUnlocked(state, entry)) {
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
  if (entry.passivePerSwarmPerOwned) {
    parts.push(`+${entry.passivePerSwarmPerOwned} token/s per swarm`);
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
