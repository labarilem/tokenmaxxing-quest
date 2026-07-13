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
    this.achievementOverlay = document.getElementById("achievement-overlay");

    /** @type {HTMLButtonElement | null} */
    this.resetToggle = document.getElementById("reset-toggle");

    /** @type {HTMLElement | null} */
    this.resetConfirm = document.getElementById("reset-confirm");

    /** @type {HTMLButtonElement | null} */
    this.resetNewGameBtn = document.getElementById("reset-new-game-btn");

    /** @type {HTMLButtonElement | null} */
    this.resetFullBtn = document.getElementById("reset-full-btn");

    /** @type {HTMLButtonElement | null} */
    this.resetCancelBtn = document.getElementById("reset-cancel-btn");

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

    this.resetToggle?.addEventListener("click", () => {
      this.toggleResetConfirm();
    });

    this.resetNewGameBtn?.addEventListener("click", () => {
      this.game.resetProgress({ keepAchievements: true });
      this.hideResetConfirm();
      this.update();
    });

    this.resetFullBtn?.addEventListener("click", () => {
      this.game.resetProgress({ keepAchievements: false });
      this.hideResetConfirm();
      this.update();
    });

    this.resetCancelBtn?.addEventListener("click", () => {
      this.hideResetConfirm();
    });
  }

  toggleResetConfirm() {
    if (!this.resetConfirm || !this.resetToggle) {
      return;
    }
    const isHidden = this.resetConfirm.hidden;
    this.resetConfirm.hidden = !isHidden;
    this.resetToggle.setAttribute("aria-expanded", String(isHidden));
  }

  hideResetConfirm() {
    if (!this.resetConfirm || !this.resetToggle) {
      return;
    }
    this.resetConfirm.hidden = true;
    this.resetToggle.setAttribute("aria-expanded", "false");
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
    if (!this.achievementOverlay) {
      return;
    }

    const banner = document.createElement("div");
    banner.className = "achievement-banner";
    banner.setAttribute("role", "status");

    const icon = document.createElement("div");
    icon.className = "achievement-banner__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🏆";

    const content = document.createElement("div");
    content.className = "achievement-banner__content";

    const label = document.createElement("p");
    label.className = "achievement-banner__label";
    label.textContent = "Achievement unlocked";

    const title = document.createElement("p");
    title.className = "achievement-banner__title";
    title.textContent = achievement.title;

    content.append(label, title);
    banner.append(icon, content);
    this.achievementOverlay.appendChild(banner);

    window.setTimeout(() => {
      banner.classList.add("achievement-banner--leaving");
      window.setTimeout(() => {
        banner.remove();
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
