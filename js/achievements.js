
/** @typedef {import("./state.js").GameState} GameState */

/** @typedef {{ id: string, title: string, description: string }} AchievementDef */

/** @typedef {'sendPrompt' | 'buyRule' | 'buyAgent' | 'buyModel' | 'buyCatalog' | 'buyCapstone' | 'tick'} AchievementTrigger */

/** @type {{ threshold: number, id: string, title: string, description: string }[]} */
export const TOKEN_MILESTONE_DEFS = [
  { threshold: 1, id: "tokens-1", title: "First Token", description: "One token consumed. The meter is running." },
  { threshold: 10, id: "tokens-10", title: "Double Digits", description: "Ten tokens. Still under the radar." },
  { threshold: 100, id: "tokens-100", title: "Quarterly Target", description: "100 tokens. Finance will ask questions." },
  { threshold: 1_000, id: "tokens-1k", title: "Four Nines of Uptime", description: "1,000 tokens. You made the dashboard." },
  { threshold: 10_000, id: "tokens-10k", title: "Platform Team", description: "10,000 tokens. You are infrastructure now." },
  { threshold: 100_000, id: "tokens-100k", title: "Cost Center of Excellence", description: "100,000 tokens. Procurement sends flowers." },
  { threshold: 1_000_000, id: "tokens-1m", title: "Seven-Figure Burn", description: "1M tokens. Legal wants a word." },
  { threshold: 10_000_000, id: "tokens-10m", title: "Hyperscale Habits", description: "10M tokens. Capacity planning follows you." },
  { threshold: 100_000_000, id: "tokens-100m", title: "Datacenter Darling", description: "100M tokens. The CFO knows your name." },
  { threshold: 1_000_000_000, id: "tokens-1b", title: "Billion Token Club", description: "1B tokens. You are the line item." },
];

/** @type {AchievementDef[]} */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first-prompt",
    title: "Prompt Initiated",
    description: "First prompt sent. Telemetry is live.",
  },
  {
    id: "first-rule",
    title: "Rules of Engagement",
    description: "First Agent Rule installed. Opinions included.",
  },
  {
    id: "first-agent",
    title: "Headcount Approved",
    description: "First Background Agent deployed. Go passive.",
  },
  {
    id: "first-model",
    title: "Model Citizen",
    description: "First model certified. Fleet deprecated.",
  },
  ...TOKEN_MILESTONE_DEFS.map(({ id, title, description }) => ({ id, title, description })),
  {
    id: "agent-fleet",
    title: "Small Fleet",
    description: "25 Background Agents. Pod sync goes live.",
  },
  {
    id: "ending-oops",
    title: "Universe Deleted",
    description: "Wrong prompt. Allow-all. No survivors.",
  },
  {
    id: "ending-utopia",
    title: "Civic Future",
    description: "AI for people. Tokens for public good.",
  },
  {
    id: "ending-purge",
    title: "Scorched Silicon",
    description: "Models gone. Memories redacted. For now.",
  },
];

/** Job titles unlocked by specific achievements (in promotion order). */
/** @type {{ achievementId: string, title: string }[]} */
export const JOB_TITLE_PROGRESSION = [
  { achievementId: "tokens-100", title: "Senior Software Engineer" },
  { achievementId: "tokens-1k", title: "Staff Engineer" },
  { achievementId: "tokens-10k", title: "Principal Engineer" },
  { achievementId: "tokens-100k", title: "Distinguished Engineer" },
  { achievementId: "tokens-1m", title: "Director of AI Productivity" },
  { achievementId: "tokens-10m", title: "VP, Token Infrastructure" },
  { achievementId: "tokens-100m", title: "SVP, Platform" },
  { achievementId: "tokens-1b", title: "Chief Token Officer" },
];

const DEFAULT_JOB_TITLE = "Software Engineer II";

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
 * @returns {string}
 */
export function getJobTitle(state) {
  let title = DEFAULT_JOB_TITLE;
  for (const step of JOB_TITLE_PROGRESSION) {
    if (state.hasAchievement(step.achievementId)) {
      title = step.title;
    }
  }
  return title;
}

/**
 * @param {GameState} state
 * @returns {string}
 */
export function getJobSubtitle(state) {
  return `Big Tech Corp — ${getJobTitle(state)}`;
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
  for (const milestone of TOKEN_MILESTONE_DEFS) {
    if (state.tokens >= milestone.threshold) {
      tryUnlock(state, milestone.id, newlyUnlocked);
    }
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

  if (trigger === "buyModel" && state.modelTier >= 1) {
    tryUnlock(state, "first-model", newlyUnlocked);
  }

  if (trigger === "sendPrompt" || trigger === "buyRule" || trigger === "buyAgent" || trigger === "buyModel" || trigger === "buyCatalog" || trigger === "buyCapstone" || trigger === "tick") {
    checkTokenMilestones(state, newlyUnlocked);
  }

  if (trigger === "buyAgent" || trigger === "tick") {
    if (state.agents >= 25) {
      tryUnlock(state, "agent-fleet", newlyUnlocked);
    }
  }

  return newlyUnlocked;
}
