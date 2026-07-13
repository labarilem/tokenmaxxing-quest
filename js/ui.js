import { ACHIEVEMENT_DEFS } from "./achievements.js";
import {
  formatNumber,
  formatRate,
  getNextAgentMilestone,
  secondsUntilAffordable,
} from "./resources.js";

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

    /** @type {HTMLElement | null} */
    this.goalDisplay = document.getElementById("goal-display");

    /** @type {HTMLElement | null} */
    this.milestoneDisplay = document.getElementById("milestone-display");

    /** @type {HTMLElement | null} */
    this.achievementsCountDisplay = document.getElementById("achievements-count");

    /** @type {HTMLButtonElement | null} */
    this.achievementsOpenBtn = document.getElementById("achievements-open-btn");

    /** @type {HTMLElement | null} */
    this.achievementsModal = document.getElementById("achievements-modal");

    /** @type {HTMLElement | null} */
    this.achievementsList = document.getElementById("achievements-list");

    /** @type {HTMLElement | null} */
    this.achievementOverlay = document.getElementById("achievement-overlay");

    /** @type {HTMLButtonElement | null} */
    this.resetOpenBtn = document.getElementById("reset-open-btn");

    /** @type {HTMLElement | null} */
    this.resetModal = document.getElementById("reset-modal");

    /** @type {HTMLButtonElement | null} */
    this.resetNewGameBtn = document.getElementById("reset-new-game-btn");

    /** @type {HTMLButtonElement | null} */
    this.resetFullBtn = document.getElementById("reset-full-btn");

    /** @type {HTMLElement | null} */
    this.activeModal = null;

    /** @type {HTMLElement | null} */
    this.modalTrigger = null;

    this.cachedTokens = "";
    this.cachedRate = "";
    this.cachedAgentCost = "";
    this.cachedAgentCount = "";
    this.cachedCanBuy = null;
    this.cachedGoal = "";
    this.cachedMilestone = "";
    this.cachedAchievementsCount = "";
    this.cachedAchievementKey = "";

    this.handleKeydown = this.handleKeydown.bind(this);

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

    this.achievementsOpenBtn?.addEventListener("click", () => {
      this.openAchievementsModal();
    });

    this.resetOpenBtn?.addEventListener("click", () => {
      this.openResetModal();
    });

    this.resetNewGameBtn?.addEventListener("click", () => {
      this.game.resetProgress({ keepAchievements: true });
      this.closeResetModal();
      this.update();
    });

    this.resetFullBtn?.addEventListener("click", () => {
      this.game.resetProgress({ keepAchievements: false });
      this.closeResetModal();
      this.update();
    });

    for (const modal of [this.achievementsModal, this.resetModal]) {
      if (!modal) {
        continue;
      }
      for (const closeEl of modal.querySelectorAll("[data-modal-close]")) {
        closeEl.addEventListener("click", () => {
          this.closeModal(modal);
        });
      }
    }
  }

  handleKeydown(event) {
    if (event.key !== "Escape" || !this.activeModal) {
      return;
    }
    event.preventDefault();
    this.closeModal(this.activeModal);
  }

  /**
   * @param {HTMLElement} modal
   * @param {HTMLElement | null} trigger
   */
  openModal(modal, trigger) {
    if (!modal.hidden) {
      return;
    }

    this.updateAchievementsList();
    modal.hidden = false;
    this.activeModal = modal;
    this.modalTrigger = trigger;
    document.body.classList.add("modal-open");
    document.addEventListener("keydown", this.handleKeydown);

    const closeBtn = modal.querySelector(".modal__close");
    if (closeBtn instanceof HTMLElement) {
      closeBtn.focus();
    }
  }

  /** @param {HTMLElement} modal */
  closeModal(modal) {
    if (modal.hidden) {
      return;
    }

    modal.hidden = true;

    if (this.activeModal === modal) {
      this.activeModal = null;
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", this.handleKeydown);
      this.modalTrigger?.focus();
      this.modalTrigger = null;
    }
  }

  openAchievementsModal() {
    if (!this.achievementsModal) {
      return;
    }
    this.openModal(this.achievementsModal, this.achievementsOpenBtn);
  }

  closeAchievementsModal() {
    if (!this.achievementsModal) {
      return;
    }
    this.closeModal(this.achievementsModal);
  }

  openResetModal() {
    if (!this.resetModal) {
      return;
    }
    this.openModal(this.resetModal, this.resetOpenBtn);
  }

  closeResetModal() {
    if (!this.resetModal) {
      return;
    }
    this.closeModal(this.resetModal);
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

  /**
   * @returns {string}
   */
  formatGoalText() {
    const { game } = this;
    const cost = game.agentCost;

    if (game.canBuyAgent()) {
      return "Next agent ready — buy to accelerate output.";
    }

    const shortfall = cost - game.tokens;
    const rate = game.tokensPerSecond;

    if (rate <= 0) {
      return `${formatNumber(shortfall)} tokens to first agent — send prompts to start.`;
    }

    const seconds = secondsUntilAffordable(game.tokens, cost, rate);
    if (!Number.isFinite(seconds)) {
      return `${formatNumber(shortfall)} tokens to next agent.`;
    }

    if (seconds < 60) {
      return `${formatNumber(shortfall)} tokens to next agent (~${Math.ceil(seconds)}s).`;
    }

    const minutes = Math.ceil(seconds / 60);
    return `${formatNumber(shortfall)} tokens to next agent (~${minutes} min).`;
  }

  /**
   * @returns {string}
   */
  formatMilestoneText() {
    const next = getNextAgentMilestone(this.game.agents);
    if (!next) {
      return "All output milestones reached for this tier.";
    }
    const remaining = next.at - this.game.agents;
    return `${remaining} more for ${next.label} (×${next.multiplier} output).`;
  }

  update() {
    const { game } = this;
    const tokensText = formatNumber(game.tokens);
    const rateText = formatRate(game.tokensPerSecond);
    const costText = formatNumber(game.agentCost);
    const countText = String(game.agents);
    const canBuy = game.canBuyAgent();
    const goalText = this.formatGoalText();
    const milestoneText = this.formatMilestoneText();
    const earnedCount = ACHIEVEMENT_DEFS.filter((def) => game.state.hasAchievement(def.id)).length;
    const achievementsCountText = `${earnedCount}/${ACHIEVEMENT_DEFS.length}`;

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
        this.buyAgentBtn.classList.toggle("btn--ready", canBuy);
      }
    }

    if (goalText !== this.cachedGoal) {
      this.cachedGoal = goalText;
      if (this.goalDisplay) {
        this.goalDisplay.textContent = goalText;
      }
    }

    if (milestoneText !== this.cachedMilestone) {
      this.cachedMilestone = milestoneText;
      if (this.milestoneDisplay) {
        this.milestoneDisplay.textContent = milestoneText;
      }
    }

    if (achievementsCountText !== this.cachedAchievementsCount) {
      this.cachedAchievementsCount = achievementsCountText;
      if (this.achievementsCountDisplay) {
        this.achievementsCountDisplay.textContent = achievementsCountText;
      }
    }

    this.updateAchievementsList();
  }
}
