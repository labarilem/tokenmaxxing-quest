import { ACHIEVEMENT_DEFS } from "./achievements.js";
import { formatNumber, formatRate } from "./resources.js";

/** @typedef {import("./achievements.js").AchievementDef} AchievementDef */
/** @typedef {import("./game.js").Game} Game */

const TOAST_VISIBLE_MS = 4000;
const TOAST_EXIT_MS = 300;

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

    /** @type {HTMLButtonElement | null} */
    this.achievementsToggle = document.getElementById("achievements-toggle");

    /** @type {HTMLElement | null} */
    this.achievementsPanel = document.getElementById("achievements-panel");

    /** @type {HTMLElement | null} */
    this.achievementsList = document.getElementById("achievements-list");

    /** @type {HTMLElement | null} */
    this.toastContainer = document.getElementById("toast-container");

    this.cachedTokens = "";
    this.cachedRate = "";
    this.cachedAgentCost = "";
    this.cachedAgentCount = "";
    this.cachedCanBuy = null;
    this.cachedAchievementKey = "";

    this.bindEvents();
  }

  bindEvents() {
    this.sendPromptBtn?.addEventListener("click", () => {
      const unlocked = this.game.sendPrompt();
      this.update();
      this.handleNewAchievements(unlocked);
    });

    this.buyAgentBtn?.addEventListener("click", () => {
      const { purchased, unlocked } = this.game.buyAgent();
      if (purchased) {
        this.update();
        this.handleNewAchievements(unlocked);
      }
    });

    this.achievementsToggle?.addEventListener("click", () => {
      this.toggleAchievementsPanel();
    });
  }

  toggleAchievementsPanel() {
    if (!this.achievementsPanel || !this.achievementsToggle) {
      return;
    }
    const isHidden = this.achievementsPanel.hidden;
    this.achievementsPanel.hidden = !isHidden;
    this.achievementsToggle.setAttribute("aria-expanded", String(isHidden));
  }

  /**
   * @param {AchievementDef[]} unlocked
   */
  handleNewAchievements(unlocked) {
    for (const achievement of unlocked) {
      this.showAchievementToast(achievement);
    }
    if (unlocked.length > 0) {
      this.updateAchievementsList();
    }
  }

  /**
   * @param {AchievementDef} achievement
   */
  showAchievementToast(achievement) {
    if (!this.toastContainer) {
      return;
    }

    const toast = document.createElement("div");
    toast.className = "toast toast--achievement";
    toast.setAttribute("role", "status");

    const title = document.createElement("p");
    title.className = "toast__title";
    title.textContent = `Achievement unlocked: ${achievement.title}`;

    const description = document.createElement("p");
    description.className = "toast__body";
    description.textContent = achievement.description;

    toast.append(title, description);
    this.toastContainer.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("toast--leaving");
      window.setTimeout(() => {
        toast.remove();
      }, TOAST_EXIT_MS);
    }, TOAST_VISIBLE_MS);
  }

  updateAchievementsList() {
    if (!this.achievementsList) {
      return;
    }

    const { achievements } = this.game.state;
    const key = ACHIEVEMENT_DEFS.map((def) => `${def.id}:${achievements.has(def.id)}`).join("|");
    if (key === this.cachedAchievementKey) {
      return;
    }
    this.cachedAchievementKey = key;

    this.achievementsList.replaceChildren();
    for (const def of ACHIEVEMENT_DEFS) {
      const earned = achievements.has(def.id);
      const item = document.createElement("li");
      item.className = `achievement${earned ? " achievement--earned" : " achievement--locked"}`;

      const status = document.createElement("span");
      status.className = "achievement__status";
      status.textContent = earned ? "Unlocked" : "Locked";
      status.setAttribute("aria-hidden", "true");

      const title = document.createElement("p");
      title.className = "achievement__title";
      title.textContent = def.title;

      const description = document.createElement("p");
      description.className = "achievement__desc";
      description.textContent = def.description;

      item.append(status, title, description);
      this.achievementsList.appendChild(item);
    }
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

    this.updateAchievementsList();
  }
}
