import { SAVE_VERSION } from "./resources.js";

/**
 * Plain data model for the game — no rules, time, or persistence behavior.
 * Keeping state as a dumb value object (Single Responsibility) lets tests
 * construct any desired starting point and lets the engine own the logic.
 */
export class GameState {
  /**
   * @param {{ tokens?: number, agents?: number, lastTickAt?: number }} [init]
   */
  constructor({ tokens = 0, agents = 0, lastTickAt = 0 } = {}) {
    /** @type {number} total tokens consumed */
    this.tokens = tokens;

    /** @type {number} background agents owned */
    this.agents = agents;

    /** @type {number} epoch ms of the last processed tick */
    this.lastTickAt = lastTickAt;

    /** @type {number} ticks elapsed since the last save (not persisted) */
    this.ticksSinceSave = 0;
  }

  /**
   * Serialize to the versioned save shape.
   * @returns {{ version: number, tokens: number, agents: number, lastTickAt: number }}
   */
  toSaveData() {
    return {
      version: SAVE_VERSION,
      tokens: this.tokens,
      agents: this.agents,
      lastTickAt: this.lastTickAt,
    };
  }

  /**
   * Build a state from untrusted save data, ignoring invalid fields and
   * falling back to provided defaults for anything missing.
   *
   * @param {unknown} data parsed save payload
   * @param {{ tokens?: number, agents?: number, lastTickAt?: number }} [fallback]
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
    if (typeof record.agents === "number" && record.agents >= 0) {
      state.agents = Math.floor(record.agents);
    }
    if (typeof record.lastTickAt === "number" && record.lastTickAt > 0) {
      state.lastTickAt = record.lastTickAt;
    }
    return state;
  }
}
