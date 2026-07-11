import { formatNumber, formatRate } from "./resources.js";

/** @typedef {import("./game.js").Game} Game */

export class UI {
  /** @param {Game} game */
  constructor(game) {
    this.game = game;

    /** @type {HTMLElement | null} */
    this.tokensDisplay = document.getElementById("tokens-display");

    /** @type {HTMLElement | null} */
    this.rateDisplay = document.getElementById("rate-display");

    /** @type {HTMLButtonElement | null} */
    this.sendPromptBtn = document.getElementById("send-prompt-btn");

    /** @type {HTMLButtonElement | null} */
    this.buyAgentBtn = document.getElementById("buy-agent-btn");

    /** @type {HTMLElement | null} */
    this.agentCostDisplay = document.getElementById("agent-cost");

    /** @type {HTMLElement | null} */
    this.agentCountDisplay = document.getElementById("agent-count");

    this.cachedTokens = "";
    this.cachedRate = "";
    this.cachedAgentCost = "";
    this.cachedAgentCount = "";
    this.cachedCanBuy = null;

    this.bindEvents();
  }

  bindEvents() {
    this.sendPromptBtn?.addEventListener("click", () => {
      this.game.sendPrompt();
      this.update();
    });

    this.buyAgentBtn?.addEventListener("click", () => {
      if (this.game.buyAgent()) {
        this.update();
      }
    });
  }

  update() {
    const { game } = this;
    const tokensText = formatNumber(game.tokens);
    const rateText = formatRate(game.tokensPerSecond);
    const costText = String(game.agentCost);
    const countText = String(game.agents);
    const canBuy = game.canBuyAgent();

    if (tokensText !== this.cachedTokens) {
      this.cachedTokens = tokensText;
      if (this.tokensDisplay) {
        this.tokensDisplay.textContent = tokensText;
      }
    }

    if (rateText !== this.cachedRate) {
      this.cachedRate = rateText;
      if (this.rateDisplay) {
        this.rateDisplay.textContent = rateText;
      }
    }

    if (costText !== this.cachedAgentCost) {
      this.cachedAgentCost = costText;
      if (this.agentCostDisplay) {
        this.agentCostDisplay.textContent = costText;
      }
    }

    if (countText !== this.cachedAgentCount) {
      this.cachedAgentCount = countText;
      if (this.agentCountDisplay) {
        this.agentCountDisplay.textContent = countText;
      }
    }

    if (canBuy !== this.cachedCanBuy) {
      this.cachedCanBuy = canBuy;
      if (this.buyAgentBtn) {
        this.buyAgentBtn.disabled = !canBuy;
      }
    }
  }
}
