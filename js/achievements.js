/** @typedef {import("./state.js").GameState} GameState */

/** @typedef {{ id: string, title: string, description: string }} AchievementDef */

/** @typedef {'sendPrompt' | 'buyRule' | 'buyAgent' | 'tick'} AchievementTrigger */

/** @type {AchievementDef[]} */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first-prompt",
    title: "Prompt Initiated",
    description: "Send your first prompt. Productivity telemetry begins.",
  },
  {
    id: "first-rule",
    title: "Rules of Engagement",
    description: "Install your first Cursor Rule. The model now has opinions.",
  },
  {
    id: "first-agent",
    title: "Headcount Approved",
    description: "Deploy your first Background Agent. Passive tokenmaxxing unlocked.",
  },
  {
    id: "tokens-100",
    title: "Quarterly Target",
    description: "Consume 100 tokens. Finance will ask questions later.",
  },
  {
    id: "tokens-1k",
    title: "Four Nines of Uptime",
    description: "Hit 1,000 tokens. Leadership adds you to the dashboard.",
  },
  {
    id: "tokens-10k",
    title: "Platform Team",
    description: "Hit 10,000 tokens. You are now infrastructure.",
  },
  {
    id: "tokens-100k",
    title: "Cost Center of Excellence",
    description: "Hit 100,000 tokens. Procurement sends flowers.",
  },
  {
    id: "agent-fleet",
    title: "Small Fleet",
    description: "Own 25 Background Agents. Pod sync goes live.",
  },
];

/** @type {Map<string, AchievementDef>} */
const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENT_DEFS.map((def) => [def.id, def]));

/**
 * @param {string} id
 * @returns {AchievementDef | undefined}
 */
export function getAchievementDef(id) {
  return ACHIEVEMENT_BY_ID.get(id);
}

/**
 * @param {GameState} state
 * @param {string} id
 * @param {AchievementDef[]} newlyUnlocked
 */
function tryUnlock(state, id, newlyUnlocked) {
  if (state.hasAchievement(id)) {
    return;
  }
  state.unlockAchievement(id);
  const def = getAchievementDef(id);
  if (def) {
    newlyUnlocked.push(def);
  }
}

/**
 * @param {GameState} state
 * @param {AchievementDef[]} newlyUnlocked
 */
function checkTokenMilestones(state, newlyUnlocked) {
  if (state.tokens >= 100) {
    tryUnlock(state, "tokens-100", newlyUnlocked);
  }
  if (state.tokens >= 1_000) {
    tryUnlock(state, "tokens-1k", newlyUnlocked);
  }
  if (state.tokens >= 10_000) {
    tryUnlock(state, "tokens-10k", newlyUnlocked);
  }
  if (state.tokens >= 100_000) {
    tryUnlock(state, "tokens-100k", newlyUnlocked);
  }
}

/**
 * Evaluate whether any achievements should unlock for the given trigger.
 * Mutates `state.achievements` when a new one is earned.
 *
 * @param {GameState} state
 * @param {AchievementTrigger} trigger
 * @returns {AchievementDef[]} newly unlocked achievements (in definition order)
 */
export function evaluateAchievements(state, trigger) {
  /** @type {AchievementDef[]} */
  const newlyUnlocked = [];

  if (trigger === "sendPrompt") {
    tryUnlock(state, "first-prompt", newlyUnlocked);
  }

  if (trigger === "buyRule" && state.rules >= 1) {
    tryUnlock(state, "first-rule", newlyUnlocked);
  }

  if (trigger === "buyAgent" && state.agents >= 1) {
    tryUnlock(state, "first-agent", newlyUnlocked);
  }

  if (trigger === "sendPrompt" || trigger === "buyRule" || trigger === "buyAgent" || trigger === "tick") {
    checkTokenMilestones(state, newlyUnlocked);
  }

  if (trigger === "buyAgent" || trigger === "tick") {
    if (state.agents >= 25) {
      tryUnlock(state, "agent-fleet", newlyUnlocked);
    }
  }

  return newlyUnlocked;
}
