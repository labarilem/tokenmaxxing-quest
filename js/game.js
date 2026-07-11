import {
  AGENT,
  AUTOSAVE_TICKS,
  OFFLINE_CAP_MS,
  SAVE_KEY,
  SAVE_VERSION,
  TOKENS_PER_TICK,
  getAgentCost,
} from "./resources.js";

export class GameState {
  /** @type {number} */
  tokens = 0;

  /** @type {number} */
  agents = 0;

  /** @type {number} */
  lastTickAt = Date.now();

  /** @type {number} */
  ticksSinceSave = 0;

  get tokensPerSecond() {
    return this.agents * AGENT.tokensPerSecond;
  }

  get agentCost() {
    return getAgentCost(this.agents);
  }

  canBuyAgent() {
    return this.tokens >= this.agentCost;
  }

  sendPrompt() {
    this.tokens += 1;
  }

  buyAgent() {
    if (!this.canBuyAgent()) {
      return false;
    }
    this.tokens -= this.agentCost;
    this.agents += 1;
    return true;
  }

  tick() {
    if (this.tokensPerSecond > 0) {
      this.tokens += this.tokensPerSecond * TOKENS_PER_TICK;
    }
    this.lastTickAt = Date.now();
    this.ticksSinceSave += 1;
  }

  applyOfflineProgress(now = Date.now()) {
    const elapsed = Math.min(now - this.lastTickAt, OFFLINE_CAP_MS);
    if (elapsed <= 0 || this.tokensPerSecond <= 0) {
      this.lastTickAt = now;
      return;
    }
    this.tokens += (elapsed / 1000) * this.tokensPerSecond;
    this.lastTickAt = now;
  }

  markSaved() {
    this.ticksSinceSave = 0;
  }

  shouldAutosave() {
    return this.ticksSinceSave >= AUTOSAVE_TICKS;
  }

  /** @returns {object} */
  toSaveData() {
    return {
      version: SAVE_VERSION,
      tokens: this.tokens,
      agents: this.agents,
      lastTickAt: this.lastTickAt,
    };
  }

  /** @param {object} data */
  loadFromSaveData(data) {
    if (!data || typeof data !== "object") {
      return;
    }
    if (typeof data.tokens === "number" && data.tokens >= 0) {
      this.tokens = data.tokens;
    }
    if (typeof data.agents === "number" && data.agents >= 0) {
      this.agents = Math.floor(data.agents);
    }
    if (typeof data.lastTickAt === "number" && data.lastTickAt > 0) {
      this.lastTickAt = data.lastTickAt;
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.toSaveData()));
      this.markSaved();
    } catch {
      // Storage full or unavailable — gameplay continues without save.
    }
  }

  /** @returns {boolean} */
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return false;
      }
      const data = JSON.parse(raw);
      this.loadFromSaveData(data);
      this.applyOfflineProgress();
      return true;
    } catch {
      return false;
    }
  }
}
