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
   *   openSource?: number,
   *   nonprofits?: number,
   *   publicApis?: number,
   *   modelSunsets?: number,
   *   memoryRedactions?: number,
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
    openSource = 0,
    nonprofits = 0,
    publicApis = 0,
    modelSunsets = 0,
    memoryRedactions = 0,
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
    this.openSource = openSource;
    /** @type {number} */
    this.nonprofits = nonprofits;
    /** @type {number} */
    this.publicApis = publicApis;

    /** @type {number} */
    this.modelSunsets = modelSunsets;
    /** @type {number} */
    this.memoryRedactions = memoryRedactions;

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
      openSource: this.openSource,
      nonprofits: this.nonprofits,
      publicApis: this.publicApis,
      modelSunsets: this.modelSunsets,
      memoryRedactions: this.memoryRedactions,
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
    state.openSource = GameState.readCount(record.openSource);
    state.nonprofits = GameState.readCount(record.nonprofits);
    state.publicApis = GameState.readCount(record.publicApis);
    state.modelSunsets = GameState.readCount(record.modelSunsets);
    state.memoryRedactions = GameState.readCount(record.memoryRedactions);
    state.alignmentRecklessness = GameState.readCount(record.alignmentRecklessness);
    state.alignmentBenevolence = GameState.readCount(record.alignmentBenevolence);
    state.alignmentPurge = GameState.readCount(record.alignmentPurge);

    if (record.strategyPath === "oops" || record.strategyPath === "utopia" || record.strategyPath === "purge") {
      state.strategyPath = record.strategyPath;
    }

    return state;
  }
}
