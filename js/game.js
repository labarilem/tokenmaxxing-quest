import { evaluateAchievements } from "./achievements.js";
import {
  AUTOSAVE_TICKS,
  SAVE_KEY,
  TOKENS_PER_TICK,
  getAgentCost,
  getTokensPerSecond,
} from "./resources.js";
import { GameState } from "./state.js";
import { SystemClock } from "./clock.js";

/** @typedef {import("./clock.js").Clock} Clock */
/** @typedef {import("./storage.js").KeyValueStore} KeyValueStore */

/**
 * Game engine — owns the rules, tick progression, and persistence coordination
 * for a {@link GameState}.
 *
 * Collaborators (clock + storage) are injected as abstractions, so the exact
 * same logic runs headlessly in tests: supply a `ManualClock` to advance time
 * without waiting, and a `MemoryStorage` to exercise save/load without a
 * browser. In the browser, `main.js` injects `SystemClock` + `LocalStorageAdapter`.
 */
export class Game {
  /**
   * @param {{
   *   clock?: Clock,
   *   storage?: KeyValueStore | null,
   *   state?: GameState | null,
   *   saveKey?: string,
   * }} [deps]
   */
  constructor({ clock = new SystemClock(), storage = null, state = null, saveKey = SAVE_KEY } = {}) {
    /** @type {Clock} */
    this.clock = clock;

    /** @type {KeyValueStore | null} */
    this.storage = storage;

    /** @type {string} */
    this.saveKey = saveKey;

    /** @type {GameState} */
    this.state = state ?? new GameState({ lastTickAt: clock.now() });
  }

  /** @returns {number} */
  get tokens() {
    return this.state.tokens;
  }

  /** @returns {number} */
  get agents() {
    return this.state.agents;
  }

  /** @returns {number} passive tokens generated per second */
  get tokensPerSecond() {
    return getTokensPerSecond(this.state.agents);
  }

  /** @returns {number} cost of the next agent */
  get agentCost() {
    return getAgentCost(this.state.agents);
  }

  /** @returns {boolean} */
  canBuyAgent() {
    return this.state.tokens >= this.agentCost;
  }

  /**
   * Manual action: consume one token.
   * @returns {import("./achievements.js").AchievementDef[]} newly unlocked achievements
   */
  sendPrompt() {
    this.state.tokens += 1;
    return evaluateAchievements(this.state, "sendPrompt");
  }

  /**
   * Buy one background agent if affordable.
   * @returns {{ purchased: boolean, unlocked: import("./achievements.js").AchievementDef[] }}
   */
  buyAgent() {
    if (!this.canBuyAgent()) {
      return { purchased: false, unlocked: [] };
    }
    this.state.tokens -= this.agentCost;
    this.state.agents += 1;
    return {
      purchased: true,
      unlocked: evaluateAchievements(this.state, "buyAgent"),
    };
  }

  /**
   * Advance the simulation by one tick.
   * @returns {import("./achievements.js").AchievementDef[]} newly unlocked achievements
   */
  tick() {
    if (this.tokensPerSecond > 0) {
      this.state.tokens += this.tokensPerSecond * TOKENS_PER_TICK;
    }
    this.state.lastTickAt = this.clock.now();
    this.state.ticksSinceSave += 1;
    return evaluateAchievements(this.state, "tick");
  }

  /**
   * Advance the last-tick timestamp without crediting passive income.
   * Used when the game is inactive so elapsed time does not accrue later.
   * @param {number} [now] current time in epoch ms (defaults to the clock)
   */
  syncLastTickAt(now = this.clock.now()) {
    this.state.lastTickAt = now;
  }

  /**
   * Reset tokens and agents. Optionally preserve earned achievements.
   * @param {{ keepAchievements?: boolean }} [options]
   */
  resetProgress({ keepAchievements = false } = {}) {
    const achievements = keepAchievements ? [...this.state.achievements] : [];
    this.state = new GameState({
      lastTickAt: this.clock.now(),
      achievements,
    });
    this.save();
  }

  markSaved() {
    this.state.ticksSinceSave = 0;
  }

  /** @returns {boolean} */
  shouldAutosave() {
    return this.state.ticksSinceSave >= AUTOSAVE_TICKS;
  }

  /**
   * Persist the current state through the injected store.
   * @returns {boolean} whether the save succeeded
   */
  save() {
    if (!this.storage) {
      return false;
    }
    try {
      this.storage.setItem(this.saveKey, JSON.stringify(this.state.toSaveData()));
      this.markSaved();
      return true;
    } catch {
      // Storage full or unavailable — gameplay continues without save.
      return false;
    }
  }

  /**
   * Load state from the injected store. Elapsed time while away is not credited.
   * @returns {boolean} whether a save was found and loaded
   */
  load() {
    if (!this.storage) {
      return false;
    }
    try {
      const raw = this.storage.getItem(this.saveKey);
      if (!raw) {
        return false;
      }
      const data = JSON.parse(raw);
      this.state = GameState.fromSaveData(data, { lastTickAt: this.clock.now() });
      this.syncLastTickAt();
      return true;
    } catch {
      return false;
    }
  }
}
