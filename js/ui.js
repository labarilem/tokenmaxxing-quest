import { ACHIEVEMENT_DEFS, getJobSubtitle } from "./achievements.js";
import {
  AGENT,
  RULE,
  formatAffordHint,
  formatClickBenefit,
  formatModelBenefit,
  formatModelGateHint,
  formatModelName,
  formatModelPanelLabel,
  formatNumber,
  formatPassiveBenefit,
  formatRate,
  getCurrentModel,
  getMarginalClickGain,
  getMarginalPassiveGain,
  getNextAgentMilestone,
  getNextModel,
  getNextRuleMilestone,
} from "./resources.js";
import {
  ALIGNMENT_REVEAL_TOKENS,
  BENEVOLENCE_UPGRADES,
  CAPSTONE_REVEAL_TOKENS,
  CAPSTONES,
  POWER_UPGRADES,
  PURGE_UPGRADES,
  SPACE_UPGRADES,
  formatCatalogBenefit,
  formatCatalogMilestone,
  getCatalogCostForState,
  getOwnedCount,
  isCatalogUnlocked,
} from "./upgrades.js";

/** @typedef {import("./achievements.js").AchievementDef} AchievementDef */
/** @typedef {import("./game.js").Game} Game */
/** @typedef {import("./upgrades.js").CatalogEntry} CatalogEntry */
/** @typedef {import("./upgrades.js").CapstoneDef} CapstoneDef */
/** @typedef {import("./endings.js").EndingDef} EndingDef */

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
    this.ruleBenefitDisplay = document.getElementById("rule-benefit-display");

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
    this.agentBenefitDisplay = document.getElementById("agent-benefit-display");

    /** @type {HTMLElement | null} */
    this.agentCostDisplay = document.getElementById("agent-cost");

    /** @type {HTMLElement | null} */
    this.agentCountDisplay = document.getElementById("agent-count");

    /** @type {HTMLElement | null} */
    this.agentGoalDisplay = document.getElementById("agent-goal-display");

    /** @type {HTMLElement | null} */
    this.agentMilestoneDisplay = document.getElementById("agent-milestone-display");

    /** @type {HTMLElement | null} */
    this.modelPanel = document.getElementById("model-panel");

    /** @type {HTMLElement | null} */
    this.modelLabel = document.getElementById("model-label");

    /** @type {HTMLElement | null} */
    this.modelBenefitDisplay = document.getElementById("model-benefit-display");

    /** @type {HTMLElement | null} */
    this.modelDescDisplay = document.getElementById("model-desc-display");

    /** @type {HTMLElement | null} */
    this.modelGoalDisplay = document.getElementById("model-goal-display");

    /** @type {HTMLElement | null} */
    this.modelGateDisplay = document.getElementById("model-gate-display");

    /** @type {HTMLButtonElement | null} */
    this.buyModelBtn = document.getElementById("buy-model-btn");

    /** @type {HTMLElement | null} */
    this.modelCostDisplay = document.getElementById("model-cost");

    /** @type {HTMLElement | null} */
    this.modelRunningDisplay = document.getElementById("model-running");

    /** @type {HTMLElement | null} */
    this.jobSubtitleDisplay = document.getElementById("job-subtitle");

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
    this.alignmentPanel = document.getElementById("alignment-panel");

    /** @type {HTMLElement | null} */
    this.alignmentRecklessness = document.getElementById("alignment-recklessness");

    /** @type {HTMLElement | null} */
    this.alignmentBenevolence = document.getElementById("alignment-benevolence");

    /** @type {HTMLElement | null} */
    this.alignmentPurge = document.getElementById("alignment-purge");

    /** @type {HTMLElement | null} */
    this.powerSection = document.getElementById("power-section");

    /** @type {HTMLElement | null} */
    this.spaceSection = document.getElementById("space-section");

    /** @type {HTMLElement | null} */
    this.benevolenceSection = document.getElementById("benevolence-section");

    /** @type {HTMLElement | null} */
    this.purgeSection = document.getElementById("purge-section");

    /** @type {HTMLElement | null} */
    this.capstoneSection = document.getElementById("capstone-section");

    /** @type {HTMLElement | null} */
    this.powerUpgrades = document.getElementById("power-upgrades");

    /** @type {HTMLElement | null} */
    this.spaceUpgrades = document.getElementById("space-upgrades");

    /** @type {HTMLElement | null} */
    this.benevolenceUpgrades = document.getElementById("benevolence-upgrades");

    /** @type {HTMLElement | null} */
    this.purgeUpgrades = document.getElementById("purge-upgrades");

    /** @type {HTMLElement | null} */
    this.capstoneUpgrades = document.getElementById("capstone-upgrades");

    /** @type {HTMLElement | null} */
    this.runCompleteBanner = document.getElementById("run-complete-banner");

    /** @type {HTMLElement | null} */
    this.endingModal = document.getElementById("ending-modal");

    /** @type {HTMLElement | null} */
    this.endingTitle = document.getElementById("ending-modal-title");

    /** @type {HTMLElement | null} */
    this.endingHeadline = document.getElementById("ending-headline");

    /** @type {HTMLElement | null} */
    this.endingCutscene = document.getElementById("ending-cutscene");

    /** @type {HTMLElement | null} */
    this.endingEpilogue = document.getElementById("ending-epilogue");

    /** @type {HTMLElement | null} */
    this.activeModal = null;

    /** @type {HTMLElement | null} */
    this.modalTrigger = null;

    this.cachedTokens = "";
    this.cachedRate = "";
    this.cachedPromptLabel = "";
    this.cachedRuleBenefit = "";
    this.cachedRuleCost = "";
    this.cachedRuleCount = "";
    this.cachedCanBuyRule = null;
    this.cachedRuleGoal = "";
    this.cachedRuleMilestone = "";
    this.cachedAgentBenefit = "";
    this.cachedAgentCost = "";
    this.cachedAgentCount = "";
    this.cachedCanBuyAgent = null;
    this.cachedAgentGoal = "";
    this.cachedAgentMilestone = "";
    this.cachedModelLabel = "";
    this.cachedModelBenefit = "";
    this.cachedModelDesc = "";
    this.cachedModelGoal = "";
    this.cachedModelGate = "";
    this.cachedModelCost = "";
    this.cachedModelRunning = "";
    this.cachedCanBuyModel = null;
    this.cachedAchievementsCount = "";
    this.cachedAchievementKey = "";
    this.cachedJobSubtitle = "";

    /** @type {Map<string, HTMLElement>} */
    this.catalogPanels = new Map();

    /** @type {Map<string, HTMLElement>} */
    this.capstonePanels = new Map();

    /** @type {Map<string, {
     *   benefit?: HTMLElement,
     *   goal?: HTMLElement,
     *   milestone?: HTMLElement,
     *   cost?: HTMLElement,
     *   count?: HTMLElement,
     *   button?: HTMLButtonElement,
     * }}>} */
    this.catalogCache = new Map();

    /** @type {Map<string, {
     *   goal?: HTMLElement,
     *   button?: HTMLButtonElement,
     * }}>} */
    this.capstoneCache = new Map();

    this.cachedAlignmentKey = "";
    this.cachedRunComplete = null;

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

    this.buyModelBtn?.addEventListener("click", () => {
      const { purchased, unlocked } = this.game.buyModel();
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
      this.onProgressReset();
    });

    this.resetFullBtn?.addEventListener("click", () => {
      this.game.resetProgress({ keepAchievements: false });
      this.closeResetModal();
      this.onProgressReset();
    });

    for (const modal of [this.achievementsModal, this.resetModal, this.endingModal]) {
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
   * Clear cached affordance state after a reset so buy buttons resync.
   */
  onProgressReset() {
    this.cachedCanBuyRule = null;
    this.cachedCanBuyAgent = null;
    this.cachedCanBuyModel = null;
    this.cachedRunComplete = null;
    this.update();
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
   * @param {EndingDef} ending
   */
  openEndingModal(ending) {
    if (!this.endingModal) {
      return;
    }
    if (this.endingTitle) {
      this.endingTitle.textContent = ending.title;
    }
    if (this.endingHeadline) {
      this.endingHeadline.textContent = ending.headline;
    }
    if (this.endingCutscene) {
      this.endingCutscene.textContent = ending.cutscene;
    }
    if (this.endingEpilogue) {
      this.endingEpilogue.textContent = ending.epilogue;
    }
    this.openModal(this.endingModal, null);
  }

  /**
   * @param {HTMLElement} container
   * @param {CatalogEntry} entry
   * @returns {HTMLElement}
   */
  ensureCatalogPanel(container, entry) {
    let panel = this.catalogPanels.get(entry.id);
    if (panel) {
      return panel;
    }

    panel = document.createElement("section");
    panel.className = "panel panel--upgrade";
    panel.dataset.catalogId = entry.id;

    const label = document.createElement("h3");
    label.className = "panel__label";
    label.textContent = entry.name;

    const benefit = document.createElement("p");
    benefit.className = "upgrade__benefit";

    const desc = document.createElement("p");
    desc.className = "upgrade__desc";
    desc.textContent = entry.description;

    const goal = document.createElement("p");
    goal.className = "upgrade__hint";

    const milestone = document.createElement("p");
    milestone.className = "upgrade__milestone";

    const row = document.createElement("div");
    row.className = "upgrade__row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--secondary btn--buy";

    const costWrap = document.createElement("span");
    const cost = document.createElement("span");
    costWrap.append("Buy", document.createTextNode(" · "), cost, document.createTextNode(" tokens"));
    button.append(costWrap);

    const owned = document.createElement("span");
    owned.className = "upgrade__owned";
    const count = document.createElement("span");
    owned.append("Owned: ", count);

    row.append(button, owned);
    panel.append(label, benefit, desc, goal, milestone, row);
    container.appendChild(panel);

    button.addEventListener("click", () => {
      const { purchased, unlocked } = this.game.buyCatalog(entry);
      if (purchased) {
        this.update();
        this.handleNewAchievements(unlocked);
      }
    });

    this.catalogPanels.set(entry.id, panel);
    this.catalogCache.set(entry.id, { benefit, goal, milestone, cost, count, button });
    return panel;
  }

  /**
   * @param {CapstoneDef} capstone
   * @returns {HTMLElement}
   */
  ensureCapstonePanel(capstone) {
    const existing = this.capstonePanels.get(capstone.id);
    if (existing) {
      return existing;
    }
    if (!this.capstoneUpgrades) {
      return null;
    }

    const panel = document.createElement("section");
    panel.className = "panel panel--upgrade";
    panel.dataset.capstoneId = capstone.id;

    const label = document.createElement("h3");
    label.className = "panel__label";
    label.textContent = capstone.name;

    const desc = document.createElement("p");
    desc.className = "upgrade__desc";
    desc.textContent = capstone.description;

    const goal = document.createElement("p");
    goal.className = "upgrade__hint";

    const row = document.createElement("div");
    row.className = "upgrade__row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn btn--secondary btn--buy btn--capstone-${capstone.path}`;
    button.textContent = `Buy · ${formatNumber(capstone.cost)} tokens`;

    row.append(button);
    panel.append(label, desc, goal, row);
    this.capstoneUpgrades.appendChild(panel);

    button.addEventListener("click", () => {
      const { purchased, ending, unlocked } = this.game.buyCapstone(capstone);
      if (purchased) {
        this.update();
        this.handleNewAchievements(unlocked);
        if (ending) {
          this.openEndingModal(ending);
        }
      }
    });

    this.capstonePanels.set(capstone.id, panel);
    this.capstoneCache.set(capstone.id, { goal, button });
    return panel;
  }

  /**
   * @param {HTMLElement | null} section
   * @param {HTMLElement | null} container
   * @param {CatalogEntry[]} entries
   */
  updateCatalogSection(section, container, entries) {
    if (!section || !container) {
      return;
    }

    const visible = entries.filter((entry) => this.game.isCatalogVisible(entry));
    section.hidden = visible.length === 0;

    for (const entry of visible) {
      const panel = this.ensureCatalogPanel(container, entry);
      panel.hidden = false;
      const owned = getOwnedCount(this.game.state, entry);
      const cost = getCatalogCostForState(this.game.state, entry);
      const canBuy = this.game.canBuyCatalog(entry);
      const cache = this.catalogCache.get(entry.id);
      if (!cache) {
        continue;
      }

      if (cache.benefit) {
        cache.benefit.textContent = formatCatalogBenefit(entry, this.game.state);
      }
      if (cache.goal) {
        cache.goal.textContent = canBuy
          ? "Ready to buy."
          : isCatalogUnlocked(this.game.state, entry)
            ? this.formatUpgradeGoal(cost, false)
            : entry.gateHint;
      }
      if (cache.milestone) {
        cache.milestone.textContent = formatCatalogMilestone(entry, owned);
      }
      if (cache.cost) {
        cache.cost.textContent = Number.isFinite(cost) ? formatNumber(cost) : "Max";
      }
      if (cache.count) {
        cache.count.textContent = String(owned);
      }
      if (cache.button) {
        cache.button.disabled = !canBuy;
        cache.button.classList.toggle("btn--ready", canBuy);
      }
    }

    for (const [id, panel] of this.catalogPanels) {
      if (!entries.some((entry) => entry.id === id)) {
        continue;
      }
      if (!entries.some((entry) => entry.id === id && this.game.isCatalogVisible(entry))) {
        panel.hidden = true;
      }
    }
  }

  updateCapstoneSection() {
    if (!this.capstoneSection) {
      return;
    }

    const show = this.game.state.lifetimeTokens >= CAPSTONE_REVEAL_TOKENS || this.game.isRunComplete;
    this.capstoneSection.hidden = !show;

    for (const capstone of CAPSTONES) {
      this.ensureCapstonePanel(capstone);
      const cache = this.capstoneCache.get(capstone.id);
      if (!cache) {
        continue;
      }
      const canBuy = this.game.canBuyCapstone(capstone);
      const gateMet = capstone.gate(this.game.state);
      if (cache.goal) {
        if (this.game.state.strategyPath) {
          cache.goal.textContent =
            this.game.state.strategyPath === capstone.path
              ? "Strategy committed for this run."
              : "Another strategy was chosen.";
        } else if (canBuy) {
          cache.goal.textContent = "Ready to present to the Board.";
        } else if (!gateMet) {
          cache.goal.textContent = capstone.gateHint;
        } else {
          cache.goal.textContent = this.formatUpgradeGoal(capstone.cost, false);
        }
      }
      if (cache.button) {
        cache.button.disabled = !canBuy;
        cache.button.classList.toggle("btn--ready", canBuy);
      }
    }
  }

  updateAlignmentPanel() {
    const { state } = this.game;
    const show =
      state.lifetimeTokens >= ALIGNMENT_REVEAL_TOKENS ||
      state.alignmentRecklessness > 0 ||
      state.alignmentBenevolence > 0 ||
      state.alignmentPurge > 0 ||
      state.strategyPath !== null;

    if (this.alignmentPanel) {
      this.alignmentPanel.hidden = !show;
    }

    const key = `${state.alignmentRecklessness}|${state.alignmentBenevolence}|${state.alignmentPurge}`;
    if (key !== this.cachedAlignmentKey) {
      this.cachedAlignmentKey = key;

      if (this.alignmentRecklessness) {
        this.alignmentRecklessness.textContent = String(state.alignmentRecklessness);
      }
      if (this.alignmentBenevolence) {
        this.alignmentBenevolence.textContent = String(state.alignmentBenevolence);
      }
      if (this.alignmentPurge) {
        this.alignmentPurge.textContent = String(state.alignmentPurge);
      }
    }
  }

  updateRunCompleteState() {
    const complete = this.game.isRunComplete;
    if (complete === this.cachedRunComplete) {
      return;
    }
    const wasComplete = this.cachedRunComplete === true;
    this.cachedRunComplete = complete;

    if (this.runCompleteBanner) {
      this.runCompleteBanner.hidden = !complete;
    }
    if (this.sendPromptBtn) {
      this.sendPromptBtn.disabled = complete;
    }

    if (wasComplete && !complete) {
      this.cachedCanBuyRule = null;
      this.cachedCanBuyAgent = null;
      this.cachedCanBuyModel = null;
      this.setBuyButtonState(this.buyRuleBtn, this.game.canBuyRule());
      this.setBuyButtonState(this.buyAgentBtn, this.game.canBuyAgent());
      this.setBuyButtonState(this.buyModelBtn, this.game.canBuyModel());
    }
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
   * @param {number} cost
   * @param {boolean} canBuy
   * @returns {string}
   */
  formatModelGoal(cost, canBuy) {
    const { game } = this;
    if (canBuy) {
      return "Ready to buy.";
    }
    const shortfall = cost - game.tokens;
    if (shortfall <= 0) {
      return `${formatNumber(cost)} tokens`;
    }
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
    const ruleBenefitText = formatClickBenefit(getMarginalClickGain(game.rules));
    const ruleCostText = formatNumber(game.ruleCost);
    const ruleCountText = String(game.rules);
    const canBuyRule = game.canBuyRule();
    const ruleGoalText = this.formatUpgradeGoal(game.ruleCost, canBuyRule);
    const ruleMilestoneText = this.formatMilestoneText(RULE, game.rules, "click");
    const agentBenefitText = formatPassiveBenefit(getMarginalPassiveGain(game.agents));
    const agentCostText = formatNumber(game.agentCost);
    const agentCountText = String(game.agents);
    const canBuyAgent = game.canBuyAgent();
    const agentGoalText = this.formatUpgradeGoal(game.agentCost, canBuyAgent);
    const agentMilestoneText = this.formatMilestoneText(AGENT, game.agents, "sec");
    const nextModel = getNextModel(game.modelTier);
    const currentModel = getCurrentModel(game.modelTier);
    const modelLabelText = nextModel
      ? formatModelPanelLabel(game.modelTier, nextModel)
      : formatModelPanelLabel(game.modelTier, currentModel);
    const modelBenefitText = formatModelBenefit(game.modelTier);
    const modelDescText = nextModel?.description ?? currentModel.description;
    const modelCostText = nextModel?.cost ? formatNumber(nextModel.cost) : "";
    const canBuyModel = game.canBuyModel();
    const modelGoalText = nextModel?.cost
      ? this.formatModelGoal(nextModel.cost, canBuyModel)
      : "Maximum model tier.";
    const modelGateText = formatModelGateHint(game.modelTier, game.agents);
    const modelRunningText = formatModelName(currentModel);
    const earnedCount = ACHIEVEMENT_DEFS.filter((def) => game.state.hasAchievement(def.id)).length;
    const achievementsCountText = `${earnedCount}/${ACHIEVEMENT_DEFS.length}`;
    const jobSubtitleText = getJobSubtitle(game.state);

    if (jobSubtitleText !== this.cachedJobSubtitle) {
      this.cachedJobSubtitle = jobSubtitleText;
      if (this.jobSubtitleDisplay) {
        this.jobSubtitleDisplay.textContent = jobSubtitleText;
      }
    }

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

    if (ruleBenefitText !== this.cachedRuleBenefit) {
      this.cachedRuleBenefit = ruleBenefitText;
      if (this.ruleBenefitDisplay) {
        this.ruleBenefitDisplay.textContent = ruleBenefitText;
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

    if (agentBenefitText !== this.cachedAgentBenefit) {
      this.cachedAgentBenefit = agentBenefitText;
      if (this.agentBenefitDisplay) {
        this.agentBenefitDisplay.textContent = agentBenefitText;
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

    if (this.modelPanel) {
      this.modelPanel.hidden = !nextModel;
    }

    if (modelLabelText !== this.cachedModelLabel) {
      this.cachedModelLabel = modelLabelText;
      if (this.modelLabel) {
        this.modelLabel.textContent = modelLabelText;
      }
    }

    if (modelBenefitText !== this.cachedModelBenefit) {
      this.cachedModelBenefit = modelBenefitText;
      if (this.modelBenefitDisplay) {
        this.modelBenefitDisplay.textContent = modelBenefitText;
      }
    }

    if (modelDescText !== this.cachedModelDesc) {
      this.cachedModelDesc = modelDescText;
      if (this.modelDescDisplay) {
        this.modelDescDisplay.textContent = modelDescText;
      }
    }

    if (modelGoalText !== this.cachedModelGoal) {
      this.cachedModelGoal = modelGoalText;
      if (this.modelGoalDisplay) {
        this.modelGoalDisplay.textContent = modelGoalText;
      }
    }

    if (modelGateText !== this.cachedModelGate) {
      this.cachedModelGate = modelGateText;
      if (this.modelGateDisplay) {
        this.modelGateDisplay.textContent = modelGateText;
      }
    }

    if (modelCostText !== this.cachedModelCost) {
      this.cachedModelCost = modelCostText;
      if (this.modelCostDisplay) {
        this.modelCostDisplay.textContent = modelCostText;
      }
    }

    if (modelRunningText !== this.cachedModelRunning) {
      this.cachedModelRunning = modelRunningText;
      if (this.modelRunningDisplay) {
        this.modelRunningDisplay.textContent = modelRunningText;
      }
    }

    if (canBuyModel !== this.cachedCanBuyModel) {
      this.cachedCanBuyModel = canBuyModel;
      this.setBuyButtonState(this.buyModelBtn, canBuyModel);
    }

    if (achievementsCountText !== this.cachedAchievementsCount) {
      this.cachedAchievementsCount = achievementsCountText;
      if (this.achievementsCountDisplay) {
        this.achievementsCountDisplay.textContent = achievementsCountText;
      }
    }

    this.updateAlignmentPanel();
    this.updateCatalogSection(this.powerSection, this.powerUpgrades, POWER_UPGRADES);
    this.updateCatalogSection(this.spaceSection, this.spaceUpgrades, SPACE_UPGRADES);
    this.updateCatalogSection(this.benevolenceSection, this.benevolenceUpgrades, BENEVOLENCE_UPGRADES);
    this.updateCatalogSection(this.purgeSection, this.purgeUpgrades, PURGE_UPGRADES);
    this.updateCapstoneSection();
    this.updateRunCompleteState();

    this.updateAchievementsList();
  }
}
