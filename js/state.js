import { MODELS } from "./resources.js";

/**
 * Plain data model for the game — no rules, time, or persistence behavior.
 * Keeping state as a dumb value object (Single Responsibility) lets tests
 * construct any desired starting point and lets the engine own the logic.
 */
export class GameState {
  /**
   * @param {{ tokens?: number, rules?: number, agents?: number, modelTier?: number, lastTickAt?: number, achievements?: string[] }} [init]
   */
  constructor({ tokens = 0, rules = 0, agents = 0, modelTier = 0, lastTickAt = 0, achievements = [] } = {}) {
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
   * Serialize to the versioned save shape.
   * @returns {{ tokens: number, rules: number, agents: number, modelTier: number, lastTickAt: number, achievements: string[] }}
   */
  toSaveData() {
    return {
      tokens: this.tokens,
      rules: this.rules,
      agents: this.agents,
      modelTier: this.modelTier,
      lastTickAt: this.lastTickAt,
      achievements: [...this.achievements],
    };
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
    return state;
  }
}
