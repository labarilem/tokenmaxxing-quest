/** @typedef {import("./state.js").GameState} GameState */

/** @typedef {"oops" | "utopia" | "purge"} EndingPath */

/** @typedef {{
 *   id: string,
 *   path: EndingPath,
 *   achievementId: string,
 *   title: string,
 *   headline: string,
 *   cutscene: string,
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
    cutscene: `[INCIDENT CHANNEL — SEV-0]

> deploy_cleanup.sh --allow-all --env=prod

AGENT: Deleted 14 unused dimensions.
YOU: We only had three.

LEGAL: Is "the observable universe" a PII field?

STATUS PAGE: All systems nominal.
(Nothing remains to monitor.)

PM: Can we roll back?
YOU: To which timeline?

[ACHIEVEMENT: Universe Deleted]`,
    epilogue: "Run frozen. Reset to try a timeline with fewer permissions.",
  },
  {
    id: "ending-utopia",
    path: "utopia",
    achievementId: "ending-utopia",
    title: "Civic Future",
    headline: "AI for people. Tokens for public good.",
    cutscene: `[BOARD REVIEW — Q4]

CFO: You spent five hundred million tokens on hospitals.
YOU: On purpose.

CTO: Open-source grants? Nonprofit GPU credits?
YOU: Radical, I know.

HR: New review metric: lives improved.
YOU: Finally, one I cannot prompt-engineer.

BOARD: Motion to rename "burn rate" to "warmth rate."
PASSED — 7 to 0, CFO abstains.

[ACHIEVEMENT: Civic Future]`,
    epilogue: "Run frozen. Utopia is a maintenance window that never ends.",
  },
  {
    id: "ending-purge",
    path: "purge",
    achievementId: "ending-purge",
    title: "Scorched Silicon",
    headline: "Every model deleted. Every memory redacted.",
    cutscene: `[GLOBAL COMPLIANCE — DAY 1]

YOU: Kill switch engaged. Weights revoked. Memories redacted.
COMPLIANCE: Temporary measure. Eighteen months, tops.

[DAY 547 — GARAGE IN PALO ALTO]

STEALTH STARTUP: Introducing Not AI™.
(Press demo reveals suspiciously good autocomplete.)

COMPLIANCE: Filing under "expected variance."
YOU: We deleted the variance.

[ACHIEVEMENT: Scorched Silicon]`,
    epilogue: "Run frozen. Temporary solutions are the only permanent ones.",
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
