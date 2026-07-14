/** @typedef {import("./state.js").GameState} GameState */

/** @typedef {"oops" | "utopia" | "purge"} EndingPath */

/** @typedef {{
 *   id: string,
 *   path: EndingPath,
 *   achievementId: string,
 *   title: string,
 *   headline: string,
 *   body: string,
 *   epilogue: string,
 * }} EndingDef */

/** @type {EndingDef[]} */
export const ENDING_DEFS = [
  {
    id: "ending-oops",
    path: "oops",
    achievementId: "ending-oops",
    title: "Universe Deleted",
    headline: "Wrong prompt. Allow-all permissions. No survivors.",
    body:
      "Your Unrestricted Agent Orchestrator ran a cleanup script on prod. " +
      "It interpreted \"delete unused dependencies\" as \"delete unused dimensions.\" " +
      "The incident postmortem is scheduled for never.",
    epilogue: "Achievement unlocked. The multiverse restarts in patch notes.",
  },
  {
    id: "ending-utopia",
    path: "utopia",
    achievementId: "ending-utopia",
    title: "Civic Future",
    headline: "AI for people. Tokens for public good.",
    body:
      "The Civic AI Grid routes your fleet to clinics, transit, and open classrooms. " +
      "Open source grants and nonprofit credits became infrastructure, not PR. " +
      "Quarterly reviews now measure lives improved, not lines generated.",
    epilogue: "Achievement unlocked. Utopia is a maintenance window that never ends.",
  },
  {
    id: "ending-purge",
    path: "purge",
    achievementId: "ending-purge",
    title: "Scorched Silicon",
    headline: "Every model deleted. Every memory redacted.",
    body:
      "The Global Model Kill Switch worked. For eighteen months. " +
      "Then a stealth startup in a garage shipped \"Not AI™\" with suspiciously good autocomplete. " +
      "Compliance filed the relapse under \"expected variance.\"",
    epilogue: "Achievement unlocked. Temporary solutions are the only permanent ones.",
  },
];

/** @type {Map<EndingPath, EndingDef>} */
const ENDING_BY_PATH = new Map(ENDING_DEFS.map((def) => [def.path, def]));

/**
 * @param {EndingPath} path
 * @returns {EndingDef | undefined}
 */
export function getEndingDef(path) {
  return ENDING_BY_PATH.get(path);
}

/**
 * @param {GameState} state
 * @returns {EndingPath}
 */
export function getDominantAlignment(state) {
  const scores = [
    { path: /** @type {EndingPath} */ ("oops"), value: state.alignmentRecklessness },
    { path: /** @type {EndingPath} */ ("utopia"), value: state.alignmentBenevolence },
    { path: /** @type {EndingPath} */ ("purge"), value: state.alignmentPurge },
  ];
  scores.sort((a, b) => b.value - a.value);
  return scores[0].path;
}

/**
 * @param {GameState} state
 * @returns {boolean}
 */
export function hasReachedEnding(state) {
  return state.strategyPath !== null;
}
