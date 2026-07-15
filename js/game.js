import { evaluateAchievements, getAchievementDef } from "./achievements.js";
import { getEndingDef, hasReachedEnding } from "./endings.js";
import {
  AUTOSAVE_TICKS,
  SAVE_KEY,
  TOKENS_PER_TICK,
  getAgentCost,
  getModelCertificationCost,
  getModelMultiplier,
  getNextModel,
  getRuleCost,
  getTokensPerClickForState,
  getTokensPerSecondForState,
} from "./resources.js";
import { GameState } from "./state.js";
import { SystemClock } from "./clock.js";
import {
  CAPSTONES,
  canBuyCatalogEntry,
  getCatalogCostForState,
  getOwnedCount,
  isCatalogUnlocked,
  applyAlignmentDelta,
} from "./upgrades.js";

/** @typedef {import("./clock.js").Clock} Clock */
/** @typedef {import("./storage.js").KeyValueStore} KeyValueStore */
/** @typedef {import("./upgrades.js").CatalogEntry} CatalogEntry */
/** @typedef {import("./upgrades.js").CapstoneDef} CapstoneDef */
/** @typedef {import("./endings.js").EndingDef} EndingDef */

/**
 * Game engine — owns the rules, tick progression, and persistence coordination
 * for a {@link GameState}.
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
  get rules() {
    return this.state.rules;
  }

  /** @returns {number} */
  get agents() {
    return this.state.agents;
  }

  /** @returns {number} */
  get modelTier() {
    return this.state.modelTier;
  }

  /** @returns {number} permanent multiplier from certified LLM models */
  get modelMultiplier() {
    return getModelMultiplier(this.state.modelTier);
  }

  /** @returns {number} tokens earned per manual prompt */
  get tokensPerClick() {
    return getTokensPerClickForState(this.state);
  }

  /** @returns {number} passive tokens generated per second */
  get tokensPerSecond() {
    return getTokensPerSecondForState(this.state);
  }

  /** @returns {number} cost of the next rule */
  get ruleCost() {
    return getRuleCost(this.state.rules);
  }

  /** @returns {number} cost of the next agent */
  get agentCost() {
    return getAgentCost(this.state.agents);
  }

  /** @returns {number | null} token cost of the next model, if any */
  get modelCost() {
    const next = getNextModel(this.state.modelTier);
    return getModelCertificationCost(next) ?? null;
  }

  /** @returns {boolean} */
  get isRunComplete() {
    return hasReachedEnding(this.state);
  }

  /** @returns {boolean} */
  canAct() {
    return !this.isRunComplete;
  }

  /** @returns {boolean} */
  canBuyRule() {
    return this.canAct() && this.state.tokens >= this.ruleCost;
  }

  /** @returns {boolean} */
  canBuyAgent() {
    return this.canAct() && this.state.tokens >= this.agentCost;
  }

  /** @returns {boolean} */
  canBuyModel() {
    if (!this.canAct()) {
      return false;
    }
    const next = getNextModel(this.state.modelTier);
    const cost = getModelCertificationCost(next);
    if (!next || cost === undefined || next.agentGate === undefined) {
      return false;
    }
    return (
      this.state.agents >= next.agentGate &&
      this.state.tokens >= cost
    );
  }

  /**
   * @param {CatalogEntry} entry
   * @returns {boolean}
   */
  canBuyCatalog(entry) {
    return this.canAct() && canBuyCatalogEntry(this.state, entry);
  }

  /**
   * @param {CapstoneDef} capstone
   * @returns {boolean}
   */
  canBuyCapstone(capstone) {
    if (!this.canAct() || this.state.strategyPath !== null) {
      return false;
    }
    if (!capstone.gate(this.state)) {
      return false;
    }
    return this.state.tokens >= capstone.cost;
  }

  /**
   * Manual action: send a prompt.
   * @returns {import("./achievements.js").AchievementDef[]} newly unlocked achievements
   */
  sendPrompt() {
    if (!this.canAct()) {
      return [];
    }
    this.state.creditTokens(this.tokensPerClick);
    return evaluateAchievements(this.state, "sendPrompt");
  }

  /**
   * Buy one agent rule if affordable.
   * @returns {{ purchased: boolean, unlocked: import("./achievements.js").AchievementDef[] }}
   */
  buyRule() {
    if (!this.canBuyRule()) {
      return { purchased: false, unlocked: [] };
    }
    this.state.tokens -= this.ruleCost;
    this.state.rules += 1;
    return {
      purchased: true,
      unlocked: evaluateAchievements(this.state, "buyRule"),
    };
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
   * Certify the next LLM model if affordable and the agent gate is met.
   * Resets background agents to zero; rules and tokens are kept.
   * @returns {{ purchased: boolean, unlocked: import("./achievements.js").AchievementDef[] }}
   */
  buyModel() {
    const next = getNextModel(this.state.modelTier);
    const cost = getModelCertificationCost(next);
    if (!next || cost === undefined || next.agentGate === undefined || !this.canBuyModel()) {
      return { purchased: false, unlocked: [] };
    }
    this.state.tokens -= cost;
    this.state.modelTier += 1;
    this.state.agents = 0;
    return {
      purchased: true,
      unlocked: evaluateAchievements(this.state, "buyModel"),
    };
  }

  /**
   * @param {CatalogEntry} entry
   * @returns {{ purchased: boolean, unlocked: import("./achievements.js").AchievementDef[] }}
   */
  buyCatalog(entry) {
    if (!this.canBuyCatalog(entry)) {
      return { purchased: false, unlocked: [] };
    }
    const owned = getOwnedCount(this.state, entry);
    const cost = getCatalogCostForState(this.state, entry);
    this.state.tokens -= cost;
    this.state[/** @type {keyof GameState} */ (entry.stateKey)] = owned + 1;
    if (entry.alignment) {
      applyAlignmentDelta(entry.alignment, this.state);
    }
    return {
      purchased: true,
      unlocked: evaluateAchievements(this.state, "buyCatalog"),
    };
  }

  /**
   * @param {CapstoneDef} capstone
   * @returns {{ purchased: boolean, ending: EndingDef | null, unlocked: import("./achievements.js").AchievementDef[] }}
   */
  buyCapstone(capstone) {
    if (!this.canBuyCapstone(capstone)) {
      return { purchased: false, ending: null, unlocked: [] };
    }
    this.state.tokens -= capstone.cost;
    this.state.strategyPath = capstone.path;
    const ending = getEndingDef(capstone.path) ?? null;
    const unlocked = evaluateAchievements(this.state, "buyCapstone");
    if (ending && !this.state.hasAchievement(ending.achievementId)) {
      this.state.unlockAchievement(ending.achievementId);
      const def = getAchievementDef(ending.achievementId);
      if (def) {
        unlocked.push(def);
      }
    }
    this.save();
    return { purchased: true, ending, unlocked };
  }

  /**
   * @param {CatalogEntry} entry
   * @returns {boolean}
   */
  isCatalogVisible(entry) {
    return isCatalogUnlocked(this.state, entry);
  }

  /**
   * Advance the simulation by one tick.
   * @returns {import("./achievements.js").AchievementDef[]} newly unlocked achievements
   */
  tick() {
    if (this.tokensPerSecond > 0) {
      this.state.creditTokens(this.tokensPerSecond * TOKENS_PER_TICK);
    }
    this.state.lastTickAt = this.clock.now();
    this.state.ticksSinceSave += 1;
    return evaluateAchievements(this.state, "tick");
  }

  /**
   * Advance the last-tick timestamp without crediting passive income.
   * @param {number} [now] current time in epoch ms (defaults to the clock)
   */
  syncLastTickAt(now = this.clock.now()) {
    this.state.lastTickAt = now;
  }

  /**
   * Reset tokens, rules, and agents. Optionally preserve earned achievements.
   * @param {{ keepAchievements?: boolean }} [options]
   */
  resetProgress({ keepAchievements = false } = {}) {
    const achievements = keepAchievements ? [...this.state.achievements] : [];
    const modelTier = keepAchievements ? this.state.modelTier : 0;
    this.state = new GameState({
      lastTickAt: this.clock.now(),
      achievements,
      modelTier,
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
