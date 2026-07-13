import { ACHIEVEMENT_DEFS } from "./achievements.js";
import {
  AGENT,
  RULE,
  formatAffordHint,
  formatNumber,
  formatRate,
  getNextAgentMilestone,
  getNextRuleMilestone,
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
    this.buyRuleBtn = document.getElementById("buy-rule-btn");

    /** @type {HTMLElement | null} */
    this.ruleCostDisplay = document.getElementById("rule-cost");

    /** @type {HTMLElement | null} */
    this.ruleCountDisplay = document.getElementById("rule-count");

    /** @type {HTMLElement | null} */
    this.ruleGoalDisplay = document.getElementById("rule-goal-display");

    /** @type {HTMLElement | null} */
    this.ruleMilestoneDisplay = document.getElementById("rule-milestone-display");

    /** @type {HTMLButtonElement | null} */
    this.buyAgentBtn = document.getElementById("buy-agent-btn");

    /** @type {HTMLElement | null} */
    this.agentCostDisplay = document.getElementById("agent-cost");

    /** @type {HTMLElement | null} */
    this.agentCountDisplay = document.getElementById("agent-count");

    /** @type {HTMLElement | null} */
    this.agentGoalDisplay = document.getElementById("agent-goal-display");

    /** @type {HTMLElement | null} */
    this.agentMilestoneDisplay = document.getElementById("agent-milestone-display");

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
    this.cachedPromptLabel = "";
    this.cachedRuleCost = "";
    this.cachedRuleCount = "";
    this.cachedCanBuyRule = null;
    this.cachedRuleGoal = "";
    this.cachedRuleMilestone = "";
    this.cachedAgentCost = "";
    this.cachedAgentCount = "";
    this.cachedCanBuyAgent = null;
    this.cachedAgentGoal = "";
    this.cachedAgentMilestone = "";
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

    this.buyRuleBtn?.addEventListener("click", () => {
      const { purchased, unlocked } = this.game.buyRule();
      if (purchased) {
        this.update();
        this.handleNewAchievements(unlocked);
      }
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
   * @param {number} cost
   * @param {boolean} canBuy
   * @returns {string}
   */
  formatUpgradeGoal(cost, canBuy) {
    const { game } = this;
    if (canBuy) {
      return "Ready to buy.";
    }
    const shortfall = cost - game.tokens;
    return formatAffordHint(shortfall, game.tokensPerSecond, game.tokensPerClick);
  }

  /**
   * @param {import("./resources.js").UpgradeDef} upgrade
   * @param {number} owned
   * @param {"click" | "sec"} unit
   * @returns {string}
   */
  formatMilestoneText(upgrade, owned, unit) {
    const next = unit === "click" ? getNextRuleMilestone(owned) : getNextAgentMilestone(owned);
    if (!next) {
      return "All milestones unlocked.";
    }
    const remaining = next.at - owned;
    const unitLabel = unit === "click" ? "per prompt" : "tokens/s";
    return `${remaining} more for ${next.label} (×${next.multiplier} ${unitLabel}).`;
  }

  /**
   * @param {HTMLButtonElement | null} button
   * @param {boolean} canBuy
   */
  setBuyButtonState(button, canBuy) {
    if (!button) {
      return;
    }
    button.disabled = !canBuy;
    button.classList.toggle("btn--ready", canBuy);
  }

  update() {
    const { game } = this;
    const tokensText = formatNumber(game.tokens);
    const rateText = formatRate(game.tokensPerSecond);
    const promptLabel = `Send Prompt (+${formatNumber(game.tokensPerClick)} tokens)`;
    const ruleCostText = formatNumber(game.ruleCost);
    const ruleCountText = String(game.rules);
    const canBuyRule = game.canBuyRule();
    const ruleGoalText = this.formatUpgradeGoal(game.ruleCost, canBuyRule);
    const ruleMilestoneText = this.formatMilestoneText(RULE, game.rules, "click");
    const agentCostText = formatNumber(game.agentCost);
    const agentCountText = String(game.agents);
    const canBuyAgent = game.canBuyAgent();
    const agentGoalText = this.formatUpgradeGoal(game.agentCost, canBuyAgent);
    const agentMilestoneText = this.formatMilestoneText(AGENT, game.agents, "sec");
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

    if (promptLabel !== this.cachedPromptLabel) {
      this.cachedPromptLabel = promptLabel;
      if (this.sendPromptBtn) {
        this.sendPromptBtn.textContent = promptLabel;
      }
    }

    if (ruleCostText !== this.cachedRuleCost) {
      this.cachedRuleCost = ruleCostText;
      if (this.ruleCostDisplay) {
        this.ruleCostDisplay.textContent = ruleCostText;
      }
    }

    if (ruleCountText !== this.cachedRuleCount) {
      this.cachedRuleCount = ruleCountText;
      if (this.ruleCountDisplay) {
        this.ruleCountDisplay.textContent = ruleCountText;
      }
    }

    if (canBuyRule !== this.cachedCanBuyRule) {
      this.cachedCanBuyRule = canBuyRule;
      this.setBuyButtonState(this.buyRuleBtn, canBuyRule);
    }

    if (ruleGoalText !== this.cachedRuleGoal) {
      this.cachedRuleGoal = ruleGoalText;
      if (this.ruleGoalDisplay) {
        this.ruleGoalDisplay.textContent = ruleGoalText;
      }
    }

    if (ruleMilestoneText !== this.cachedRuleMilestone) {
      this.cachedRuleMilestone = ruleMilestoneText;
      if (this.ruleMilestoneDisplay) {
        this.ruleMilestoneDisplay.textContent = ruleMilestoneText;
      }
    }

    if (agentCostText !== this.cachedAgentCost) {
      this.cachedAgentCost = agentCostText;
      if (this.agentCostDisplay) {
        this.agentCostDisplay.textContent = agentCostText;
      }
    }

    if (agentCountText !== this.cachedAgentCount) {
      this.cachedAgentCount = agentCountText;
      if (this.agentCountDisplay) {
        this.agentCountDisplay.textContent = agentCountText;
      }
    }

    if (canBuyAgent !== this.cachedCanBuyAgent) {
      this.cachedCanBuyAgent = canBuyAgent;
      this.setBuyButtonState(this.buyAgentBtn, canBuyAgent);
    }

    if (agentGoalText !== this.cachedAgentGoal) {
      this.cachedAgentGoal = agentGoalText;
      if (this.agentGoalDisplay) {
        this.agentGoalDisplay.textContent = agentGoalText;
      }
    }

    if (agentMilestoneText !== this.cachedAgentMilestone) {
      this.cachedAgentMilestone = agentMilestoneText;
      if (this.agentMilestoneDisplay) {
        this.agentMilestoneDisplay.textContent = agentMilestoneText;
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
