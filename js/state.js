import { MODELS } from "./resources.js";
import { EVENT_HISTORY_LIMIT } from "./events.js";

/**
 * Non-negative integer fields persisted via {@link GameState.readCount}.
 * Keep this list in sync when adding upgrade ownership or alignment meters —
 * constructor defaults, toSaveData, and fromSaveData all derive from it.
 *
 * @type {readonly string[]}
 */
export const STATE_COUNT_KEYS = Object.freeze([
  "rules",
  "agents",
  "lifetimeTokens",
  "totalClicks",
  "playTimeMs",
  "swarms",
  "decoders",
  "contexts",
  "bloats",
  "clusters",
  "mcps",
  "schedulers",
  "dashboards",
  "allowAlls",
  "roadmaps",
  "perfReviewBots",
  "headcountBots",
  "okrInflators",
  "vendorLockins",
  "procurementBlackHoles",
  "execOffsites",
  "seriesZRounds",
  "regulatoryKabukis",
  "ipoRoadshows",
  "tokenBuybacks",
  "antitrustDistractions",
  "ringStationRelays",
  "lagrangeCaches",
  "solarSailMirrors",
  "dysonAllocators",
  "boardWarRooms",
  "orbitalManifests",
  "orbitalAuditDesks",
  "capstoneBriefingSuites",
  "alienDecoders",
  "exoplanetFarms",
  "galaxyCasts",
  "wormholeRouters",
  "stellarForges",
  "firstContacts",
  "nebulaBuffers",
  "darkMatterRigs",
  "blackHoleSinks",
  "galacticMeshes",
  "openSource",
  "nonprofits",
  "publicApis",
  "communityCoops",
  "wardSanctuaries",
  "faeLabors",
  "moonwells",
  "spiritGuides",
  "unicornRanches",
  "phoenixBackups",
  "crystalLattices",
  "dragonTreaties",
  "celestialArbiters",
  "dawnObservatories",
  "ethicsSummits",
  "stewardshipCovenants",
  "modelSunsets",
  "memoryRedactions",
  "soulboundEulas",
  "curseCaches",
  "shadowBinds",
  "wraithScrapers",
  "voidPacts",
  "bansheeAlerts",
  "hexSunsets",
  "lichArchives",
  "demonCores",
  "abyssGateways",
  "entropyRites",
  "alignmentRecklessness",
  "alignmentBenevolence",
  "alignmentPurge",
  "nextEventAtPlayTimeMs",
]);

/**
 * Plain data model for the game — no rules, time, or persistence behavior.
 * Keeping state as a dumb value object (Single Responsibility) lets tests
 * construct any desired starting point and lets the engine own the logic.
 */
export class GameState {
  /**
   * @param {Record<string, unknown>} [init]
   */
  constructor(init = {}) {
    /** @type {number} total tokens consumed (may be negative under purge debt) */
    this.tokens = typeof init.tokens === "number" ? init.tokens : 0;

    /** @type {number} certified LLM model tier (0 = Clair 3.5) */
    this.modelTier = typeof init.modelTier === "number" ? init.modelTier : 0;

    /** @type {number} epoch ms of the last processed tick */
    this.lastTickAt = typeof init.lastTickAt === "number" ? init.lastTickAt : 0;

    /** @type {Set<string>} achievement ids the player has earned */
    this.achievements = new Set(
      Array.isArray(init.achievements) ? /** @type {string[]} */ (init.achievements) : [],
    );

    /** @type {number} ticks elapsed since the last save (not persisted) */
    this.ticksSinceSave = 0;

    for (const key of STATE_COUNT_KEYS) {
      const value = init[key];
      this[key] = typeof value === "number" && Number.isFinite(value) ? value : 0;
    }

    /** @type {string | null} committed ending path: oops | utopia | purge */
    this.strategyPath =
      typeof init.strategyPath === "string" ? /** @type {string} */ (init.strategyPath) : null;

    /** @type {string | null} pending random event id awaiting a player choice */
    this.activeEventId =
      typeof init.activeEventId === "string" ? /** @type {string} */ (init.activeEventId) : null;

    /** @type {string[]} recent event ids (avoid immediate repeats) */
    this.recentEventIds = Array.isArray(init.recentEventIds)
      ? [.../** @type {string[]} */ (init.recentEventIds)]
      : [];
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
   * Apply a signed token delta (used by passive ticks — may drain into debt).
   * Only positive amounts count toward lifetime tokens.
   * @param {number} amount
   */
  applyTokenDelta(amount) {
    if (amount === 0) {
      return;
    }
    this.tokens += amount;
    if (amount > 0) {
      this.lifetimeTokens += amount;
    }
  }

  /**
   * Serialize to the save shape.
   * @returns {Record<string, unknown>}
   */
  toSaveData() {
    /** @type {Record<string, unknown>} */
    const data = {
      tokens: this.tokens,
      modelTier: this.modelTier,
      lastTickAt: this.lastTickAt,
      achievements: [...this.achievements],
      strategyPath: this.strategyPath,
      activeEventId: this.activeEventId,
      recentEventIds: [...this.recentEventIds],
    };
    for (const key of STATE_COUNT_KEYS) {
      data[key] = this[key];
    }
    return data;
  }

  /**
   * @param {unknown} value
   * @param {number} fallback
   * @returns {number}
   */
  static readCount(value, fallback = 0) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return fallback;
    }
    return Math.floor(value);
  }

  /**
   * Build a state from untrusted save data, ignoring invalid fields and
   * falling back to provided defaults for anything missing.
   *
   * @param {unknown} data parsed save payload
   * @param {Record<string, unknown>} [fallback]
   * @returns {GameState}
   */
  static fromSaveData(data, fallback = {}) {
    const state = new GameState(fallback);
    if (!data || typeof data !== "object") {
      return state;
    }
    const record = /** @type {Record<string, unknown>} */ (data);
    if (typeof record.tokens === "number" && Number.isFinite(record.tokens)) {
      state.tokens = record.tokens;
    }
    if (
      typeof record.modelTier === "number" &&
      Number.isFinite(record.modelTier) &&
      record.modelTier >= 0
    ) {
      state.modelTier = Math.min(Math.floor(record.modelTier), MODELS.length - 1);
    }
    if (
      typeof record.lastTickAt === "number" &&
      Number.isFinite(record.lastTickAt) &&
      record.lastTickAt > 0
    ) {
      state.lastTickAt = record.lastTickAt;
    }
    if (Array.isArray(record.achievements)) {
      for (const id of record.achievements) {
        if (typeof id === "string" && id.length > 0) {
          state.achievements.add(id);
        }
      }
    }

    for (const key of STATE_COUNT_KEYS) {
      if (key === "lifetimeTokens") {
        // Lifetime is cumulative tokens earned — never negative even if the
        // spendable balance is in purge debt and lifetime was omitted from the save.
        state.lifetimeTokens = GameState.readCount(
          record.lifetimeTokens,
          Math.max(0, state.tokens),
        );
        continue;
      }
      // Only overwrite when the save provides a value; invalid numbers keep the
      // constructor/fallback (same as the former rules/agents special-cases).
      if (key in record) {
        state[key] = GameState.readCount(record[key], state[key]);
      }
    }

    if (record.strategyPath === "oops" || record.strategyPath === "utopia" || record.strategyPath === "purge") {
      state.strategyPath = record.strategyPath;
    }

    if (typeof record.activeEventId === "string" && record.activeEventId.length > 0) {
      state.activeEventId = record.activeEventId;
    }
    if (Array.isArray(record.recentEventIds)) {
      state.recentEventIds = record.recentEventIds
        .filter((id) => typeof id === "string" && id.length > 0)
        .slice(-EVENT_HISTORY_LIMIT);
    }

    return state;
  }
}
