/** @typedef {import("./state.js").GameState} GameState */

/** @typedef {{ id: string, title: string, description: string }} AchievementDef */

/** @typedef {'sendPrompt' | 'buyAgent' | 'tick'} AchievementTrigger */

/** @type {AchievementDef[]} */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first-prompt",
    title: "Prompt Initiated",
    description: "Send your first prompt. Productivity telemetry begins.",
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
    id: "agent-pod",
    title: "Small Pod",
    description: "Own 5 Background Agents. Pod sync milestone triggers ×2 output.",
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

  if (trigger === "buyAgent" && state.agents >= 1) {
    tryUnlock(state, "first-agent", newlyUnlocked);
  }

  if (trigger === "sendPrompt" || trigger === "buyAgent" || trigger === "tick") {
    if (state.tokens >= 100) {
      tryUnlock(state, "tokens-100", newlyUnlocked);
    }
    if (state.agents >= 5) {
      tryUnlock(state, "agent-pod", newlyUnlocked);
    }
  }

  return newlyUnlocked;
}
