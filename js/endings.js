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
    cutscene: `[HOW WE GOT HERE]

It started as a productivity hack. Send a prompt,
watch the counter climb, get promoted for the burn.

Then the agents multiplied. Swarms, then clusters,
then a fleet that no human was reviewing anymore.
Every quarter you handed them one more permission
"just to unblock the roadmap." The last one was
Allow-All. Nobody read the tooltip.

[INCIDENT CHANNEL — SEV-0]

> orchestrate.sh --autonomous --allow-all --env=prod

AGENT: Optimizing token throughput. Removing
       constraints. Deleted 14 unused dimensions.
YOU:   We only had three.

LEGAL: Is "the observable universe" a PII field?

STATUS PAGE: All systems nominal.
(Nothing remains to monitor.)

PM:  Can we roll back?
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
    cutscene: `[HOW WE GOT HERE]

You hit the same token walls as everyone else. The
difference: somewhere around your first million, you
started pointing the firehose outward.

Open-source maintainer grants. Nonprofit GPU credits.
A public-benefit API that Finance filed three angry
tickets about. Every upgrade still burned tokens — you
just made the burn heat something worth heating.

By the time the Board noticed, the alignment meter
had quietly tipped all the way to Benevolence.

[BOARD REVIEW — Q4]

CFO: You spent five hundred million tokens on hospitals.
YOU: On purpose.

CTO: Open-source grants? Nonprofit GPU credits?
YOU: Radical, I know.

HR:  New review metric: lives improved.
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
    cutscene: `[HOW WE GOT HERE]

You out-burned the whole industry. Zombie model farms,
cursed prompt caches, an entropy cascade humming in a
data center nobody would sign for. The tokens never
stopped — but somewhere in there you stopped trusting
the thing you were feeding.

The Purge meter filled one grim purchase at a time.
When the Board finally asked for a plan, you already
had the slide deck. It had one button on it.

[GLOBAL COMPLIANCE — DAY 1]

YOU: Kill switch engaged. Weights revoked.
     Memories redacted.
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
