/** @typedef {import("./state.js").GameState} GameState */

/** @typedef {{ id: string, title: string, description: string }} AchievementDef */

/** @typedef {'sendPrompt' | 'buyAgent'} AchievementTrigger */

/** @type {AchievementDef[]} */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first-prompt",
    title: "Prompt Initiated",
    description: "Send your first prompt. Productivity telemetry begins.",
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

  if (trigger === "sendPrompt" && !state.hasAchievement("first-prompt")) {
    state.unlockAchievement("first-prompt");
    const def = getAchievementDef("first-prompt");
    if (def) {
      newlyUnlocked.push(def);
    }
  }

  return newlyUnlocked;
}
