import { MODELS } from "./resources.js";

/**
 * Plain data model for the game — no rules, time, or persistence behavior.
 * Keeping state as a dumb value object (Single Responsibility) lets tests
 * construct any desired starting point and lets the engine own the logic.
 */
export class GameState {
  /**
   * @param {{
   *   tokens?: number,
   *   rules?: number,
   *   agents?: number,
   *   modelTier?: number,
   *   lastTickAt?: number,
   *   achievements?: string[],
   *   lifetimeTokens?: number,
   *   swarms?: number,
   *   decoders?: number,
   *   contexts?: number,
   *   bloats?: number,
   *   clusters?: number,
   *   mcps?: number,
   *   schedulers?: number,
   *   dashboards?: number,
   *   allowAlls?: number,
   *   roadmaps?: number,
   *   alienDecoders?: number,
   *   exoplanetFarms?: number,
   *   galaxyCasts?: number,
   *   wormholeRouters?: number,
   *   stellarForges?: number,
   *   firstContacts?: number,
   *   nebulaBuffers?: number,
   *   darkMatterRigs?: number,
   *   blackHoleSinks?: number,
   *   galacticMeshes?: number,
   *   openSource?: number,
   *   nonprofits?: number,
   *   publicApis?: number,
   *   wardSanctuaries?: number,
   *   faeLabors?: number,
   *   moonwells?: number,
   *   spiritGuides?: number,
   *   unicornRanches?: number,
   *   phoenixBackups?: number,
   *   crystalLattices?: number,
   *   dragonTreaties?: number,
   *   celestialArbiters?: number,
   *   dawnObservatories?: number,
   *   modelSunsets?: number,
   *   memoryRedactions?: number,
   *   curseCaches?: number,
   *   shadowBinds?: number,
   *   wraithScrapers?: number,
   *   voidPacts?: number,
   *   bansheeAlerts?: number,
   *   hexSunsets?: number,
   *   lichArchives?: number,
   *   demonCores?: number,
   *   abyssGateways?: number,
   *   entropyRites?: number,
   *   alignmentRecklessness?: number,
   *   alignmentBenevolence?: number,
   *   alignmentPurge?: number,
   *   strategyPath?: string | null,
   * }} [init]
   */
  constructor({
    tokens = 0,
    rules = 0,
    agents = 0,
    modelTier = 0,
    lastTickAt = 0,
    achievements = [],
    lifetimeTokens = 0,
    swarms = 0,
    decoders = 0,
    contexts = 0,
    bloats = 0,
    clusters = 0,
    mcps = 0,
    schedulers = 0,
    dashboards = 0,
    allowAlls = 0,
    roadmaps = 0,
    alienDecoders = 0,
    exoplanetFarms = 0,
    galaxyCasts = 0,
    wormholeRouters = 0,
    stellarForges = 0,
    firstContacts = 0,
    nebulaBuffers = 0,
    darkMatterRigs = 0,
    blackHoleSinks = 0,
    galacticMeshes = 0,
    openSource = 0,
    nonprofits = 0,
    publicApis = 0,
    wardSanctuaries = 0,
    faeLabors = 0,
    moonwells = 0,
    spiritGuides = 0,
    unicornRanches = 0,
    phoenixBackups = 0,
    crystalLattices = 0,
    dragonTreaties = 0,
    celestialArbiters = 0,
    dawnObservatories = 0,
    modelSunsets = 0,
    memoryRedactions = 0,
    curseCaches = 0,
    shadowBinds = 0,
    wraithScrapers = 0,
    voidPacts = 0,
    bansheeAlerts = 0,
    hexSunsets = 0,
    lichArchives = 0,
    demonCores = 0,
    abyssGateways = 0,
    entropyRites = 0,
    alignmentRecklessness = 0,
    alignmentBenevolence = 0,
    alignmentPurge = 0,
    strategyPath = null,
  } = {}) {
    /** @type {number} total tokens consumed */
    this.tokens = tokens;

    /** @type {number} agent rules owned */
    this.rules = rules;

    /** @type {number} background agents owned */
    this.agents = agents;

    /** @type {number} certified LLM model tier (0 = Clair 3.5) */
    this.modelTier = modelTier;

    /** @type {number} epoch ms of the last processed tick */
    this.lastTickAt = lastTickAt;

    /** @type {Set<string>} achievement ids the player has earned */
    this.achievements = new Set(achievements);

    /** @type {number} ticks elapsed since the last save (not persisted) */
    this.ticksSinceSave = 0;

    /** @type {number} cumulative tokens earned across the run */
    this.lifetimeTokens = lifetimeTokens;

    /** @type {number} */
    this.swarms = swarms;
    /** @type {number} */
    this.decoders = decoders;
    /** @type {number} */
    this.contexts = contexts;
    /** @type {number} */
    this.bloats = bloats;
    /** @type {number} */
    this.clusters = clusters;
    /** @type {number} */
    this.mcps = mcps;
    /** @type {number} */
    this.schedulers = schedulers;
    /** @type {number} */
    this.dashboards = dashboards;
    /** @type {number} */
    this.allowAlls = allowAlls;
    /** @type {number} */
    this.roadmaps = roadmaps;

    /** @type {number} */
    this.alienDecoders = alienDecoders;
    /** @type {number} */
    this.exoplanetFarms = exoplanetFarms;
    /** @type {number} */
    this.galaxyCasts = galaxyCasts;
    /** @type {number} */
    this.wormholeRouters = wormholeRouters;
    /** @type {number} */
    this.stellarForges = stellarForges;
    /** @type {number} */
    this.firstContacts = firstContacts;
    /** @type {number} */
    this.nebulaBuffers = nebulaBuffers;
    /** @type {number} */
    this.darkMatterRigs = darkMatterRigs;
    /** @type {number} */
    this.blackHoleSinks = blackHoleSinks;
    /** @type {number} */
    this.galacticMeshes = galacticMeshes;

    /** @type {number} */
    this.openSource = openSource;
    /** @type {number} */
    this.nonprofits = nonprofits;
    /** @type {number} */
    this.publicApis = publicApis;

    /** @type {number} */
    this.wardSanctuaries = wardSanctuaries;
    /** @type {number} */
    this.faeLabors = faeLabors;
    /** @type {number} */
    this.moonwells = moonwells;
    /** @type {number} */
    this.spiritGuides = spiritGuides;
    /** @type {number} */
    this.unicornRanches = unicornRanches;
    /** @type {number} */
    this.phoenixBackups = phoenixBackups;
    /** @type {number} */
    this.crystalLattices = crystalLattices;
    /** @type {number} */
    this.dragonTreaties = dragonTreaties;
    /** @type {number} */
    this.celestialArbiters = celestialArbiters;
    /** @type {number} */
    this.dawnObservatories = dawnObservatories;

    /** @type {number} */
    this.modelSunsets = modelSunsets;
    /** @type {number} */
    this.memoryRedactions = memoryRedactions;

    /** @type {number} */
    this.curseCaches = curseCaches;
    /** @type {number} */
    this.shadowBinds = shadowBinds;
    /** @type {number} */
    this.wraithScrapers = wraithScrapers;
    /** @type {number} */
    this.voidPacts = voidPacts;
    /** @type {number} */
    this.bansheeAlerts = bansheeAlerts;
    /** @type {number} */
    this.hexSunsets = hexSunsets;
    /** @type {number} */
    this.lichArchives = lichArchives;
    /** @type {number} */
    this.demonCores = demonCores;
    /** @type {number} */
    this.abyssGateways = abyssGateways;
    /** @type {number} */
    this.entropyRites = entropyRites;

    /** @type {number} */
    this.alignmentRecklessness = alignmentRecklessness;
    /** @type {number} */
    this.alignmentBenevolence = alignmentBenevolence;
    /** @type {number} */
    this.alignmentPurge = alignmentPurge;

    /** @type {string | null} committed ending path: oops | utopia | purge */
    this.strategyPath = strategyPath;
  }

  /** @param {string} id */
  hasAchievement(id) {
    return this.achievements.has(id);
  }

  /** @param {string} id */
  unlockAchievement(id) {
    this.achievements.add(id);
  }

  /**
   * @param {number} amount
   */
  creditTokens(amount) {
    if (amount <= 0) {
      return;
    }
    this.tokens += amount;
    this.lifetimeTokens += amount;
  }

  /**
   * Serialize to the save shape.
   * @returns {Record<string, unknown>}
   */
  toSaveData() {
    return {
      tokens: this.tokens,
      rules: this.rules,
      agents: this.agents,
      modelTier: this.modelTier,
      lastTickAt: this.lastTickAt,
      achievements: [...this.achievements],
      lifetimeTokens: this.lifetimeTokens,
      swarms: this.swarms,
      decoders: this.decoders,
      contexts: this.contexts,
      bloats: this.bloats,
      clusters: this.clusters,
      mcps: this.mcps,
      schedulers: this.schedulers,
      dashboards: this.dashboards,
      allowAlls: this.allowAlls,
      roadmaps: this.roadmaps,
      alienDecoders: this.alienDecoders,
      exoplanetFarms: this.exoplanetFarms,
      galaxyCasts: this.galaxyCasts,
      wormholeRouters: this.wormholeRouters,
      stellarForges: this.stellarForges,
      firstContacts: this.firstContacts,
      nebulaBuffers: this.nebulaBuffers,
      darkMatterRigs: this.darkMatterRigs,
      blackHoleSinks: this.blackHoleSinks,
      galacticMeshes: this.galacticMeshes,
      openSource: this.openSource,
      nonprofits: this.nonprofits,
      publicApis: this.publicApis,
      wardSanctuaries: this.wardSanctuaries,
      faeLabors: this.faeLabors,
      moonwells: this.moonwells,
      spiritGuides: this.spiritGuides,
      unicornRanches: this.unicornRanches,
      phoenixBackups: this.phoenixBackups,
      crystalLattices: this.crystalLattices,
      dragonTreaties: this.dragonTreaties,
      celestialArbiters: this.celestialArbiters,
      dawnObservatories: this.dawnObservatories,
      modelSunsets: this.modelSunsets,
      memoryRedactions: this.memoryRedactions,
      curseCaches: this.curseCaches,
      shadowBinds: this.shadowBinds,
      wraithScrapers: this.wraithScrapers,
      voidPacts: this.voidPacts,
      bansheeAlerts: this.bansheeAlerts,
      hexSunsets: this.hexSunsets,
      lichArchives: this.lichArchives,
      demonCores: this.demonCores,
      abyssGateways: this.abyssGateways,
      entropyRites: this.entropyRites,
      alignmentRecklessness: this.alignmentRecklessness,
      alignmentBenevolence: this.alignmentBenevolence,
      alignmentPurge: this.alignmentPurge,
      strategyPath: this.strategyPath,
    };
  }

  /**
   * @param {unknown} value
   * @param {number} fallback
   * @returns {number}
   */
  static readCount(value, fallback = 0) {
    if (typeof value !== "number" || value < 0) {
      return fallback;
    }
    return Math.floor(value);
  }

  /**
   * Build a state from untrusted save data, ignoring invalid fields and
   * falling back to provided defaults for anything missing.
   *
   * @param {unknown} data parsed save payload
   * @param {{ tokens?: number, rules?: number, agents?: number, lastTickAt?: number }} [fallback]
   * @returns {GameState}
   */
  static fromSaveData(data, fallback = {}) {
    const state = new GameState(fallback);
    if (!data || typeof data !== "object") {
      return state;
    }
    const record = /** @type {Record<string, unknown>} */ (data);
    if (typeof record.tokens === "number" && record.tokens >= 0) {
      state.tokens = record.tokens;
    }
    if (typeof record.rules === "number" && record.rules >= 0) {
      state.rules = Math.floor(record.rules);
    }
    if (typeof record.agents === "number" && record.agents >= 0) {
      state.agents = Math.floor(record.agents);
    }
    if (typeof record.modelTier === "number" && record.modelTier >= 0) {
      state.modelTier = Math.min(Math.floor(record.modelTier), MODELS.length - 1);
    }
    if (typeof record.lastTickAt === "number" && record.lastTickAt > 0) {
      state.lastTickAt = record.lastTickAt;
    }
    if (Array.isArray(record.achievements)) {
      for (const id of record.achievements) {
        if (typeof id === "string" && id.length > 0) {
          state.achievements.add(id);
        }
      }
    }

    state.lifetimeTokens = GameState.readCount(record.lifetimeTokens, state.tokens);
    state.swarms = GameState.readCount(record.swarms);
    state.decoders = GameState.readCount(record.decoders);
    state.contexts = GameState.readCount(record.contexts);
    state.bloats = GameState.readCount(record.bloats);
    state.clusters = GameState.readCount(record.clusters);
    state.mcps = GameState.readCount(record.mcps);
    state.schedulers = GameState.readCount(record.schedulers);
    state.dashboards = GameState.readCount(record.dashboards);
    state.allowAlls = GameState.readCount(record.allowAlls);
    state.roadmaps = GameState.readCount(record.roadmaps);
    state.alienDecoders = GameState.readCount(record.alienDecoders);
    state.exoplanetFarms = GameState.readCount(record.exoplanetFarms);
    state.galaxyCasts = GameState.readCount(record.galaxyCasts);
    state.wormholeRouters = GameState.readCount(record.wormholeRouters);
    state.stellarForges = GameState.readCount(record.stellarForges);
    state.firstContacts = GameState.readCount(record.firstContacts);
    state.nebulaBuffers = GameState.readCount(record.nebulaBuffers);
    state.darkMatterRigs = GameState.readCount(record.darkMatterRigs);
    state.blackHoleSinks = GameState.readCount(record.blackHoleSinks);
    state.galacticMeshes = GameState.readCount(record.galacticMeshes);
    state.openSource = GameState.readCount(record.openSource);
    state.nonprofits = GameState.readCount(record.nonprofits);
    state.publicApis = GameState.readCount(record.publicApis);
    state.wardSanctuaries = GameState.readCount(record.wardSanctuaries);
    state.faeLabors = GameState.readCount(record.faeLabors);
    state.moonwells = GameState.readCount(record.moonwells);
    state.spiritGuides = GameState.readCount(record.spiritGuides);
    state.unicornRanches = GameState.readCount(record.unicornRanches);
    state.phoenixBackups = GameState.readCount(record.phoenixBackups);
    state.crystalLattices = GameState.readCount(record.crystalLattices);
    state.dragonTreaties = GameState.readCount(record.dragonTreaties);
    state.celestialArbiters = GameState.readCount(record.celestialArbiters);
    state.dawnObservatories = GameState.readCount(record.dawnObservatories);
    state.modelSunsets = GameState.readCount(record.modelSunsets);
    state.memoryRedactions = GameState.readCount(record.memoryRedactions);
    state.curseCaches = GameState.readCount(record.curseCaches);
    state.shadowBinds = GameState.readCount(record.shadowBinds);
    state.wraithScrapers = GameState.readCount(record.wraithScrapers);
    state.voidPacts = GameState.readCount(record.voidPacts);
    state.bansheeAlerts = GameState.readCount(record.bansheeAlerts);
    state.hexSunsets = GameState.readCount(record.hexSunsets);
    state.lichArchives = GameState.readCount(record.lichArchives);
    state.demonCores = GameState.readCount(record.demonCores);
    state.abyssGateways = GameState.readCount(record.abyssGateways);
    state.entropyRites = GameState.readCount(record.entropyRites);
    state.alignmentRecklessness = GameState.readCount(record.alignmentRecklessness);
    state.alignmentBenevolence = GameState.readCount(record.alignmentBenevolence);
    state.alignmentPurge = GameState.readCount(record.alignmentPurge);

    if (record.strategyPath === "oops" || record.strategyPath === "utopia" || record.strategyPath === "purge") {
      state.strategyPath = record.strategyPath;
    }

    return state;
  }
}
