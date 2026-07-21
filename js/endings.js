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

const SECTION_RE = /^\[([^\]]+)\]$/;
const DIALOGUE_RE = /^([A-Z][A-Z0-9 /()—.\-™]*):\s*(.*)$/;
const COMMAND_RE = /^>\s*(.+)$/;

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * @param {string[]} lines
 * @returns {string[][]}
 */
function splitParagraphs(lines) {
  /** @type {string[][]} */
  const paragraphs = [];
  /** @type {string[]} */
  let current = [];

  for (const line of lines) {
    if (!line.trim()) {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
      continue;
    }
    current.push(line);
  }

  if (current.length > 0) {
    paragraphs.push(current);
  }

  return paragraphs;
}

/**
 * @param {string[]} lines
 * @returns {boolean}
 */
function isDialogueBlock(lines) {
  return lines.some((line) => DIALOGUE_RE.test(line.trim()));
}

/**
 * @param {string[]} lines
 * @returns {string}
 */
function formatDialogueBlock(lines) {
  /** @type {{ speaker: string, text: string }[]} */
  const entries = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const match = trimmed.match(DIALOGUE_RE);
    if (match) {
      entries.push({ speaker: match[1], text: match[2] });
      continue;
    }

    if (entries.length > 0) {
      const last = entries[entries.length - 1];
      last.text = last.text ? `${last.text} ${trimmed}` : trimmed;
    }
  }

  const linesHtml = entries.map(
    (entry) =>
      `<p class="ending-cutscene__line"><span class="ending-cutscene__speaker">${escapeHtml(entry.speaker)}</span> ${escapeHtml(entry.text)}</p>`,
  );

  return `<div class="ending-cutscene__dialogue">${linesHtml.join("")}</div>`;
}

/**
 * Turn a plain-text ending cutscene into structured, readable HTML.
 * @param {string} cutscene
 * @returns {string}
 */
export function formatEndingCutscene(cutscene) {
  const blocks = cutscene.trim().split(/\n\n+/);
  /** @type {string[]} */
  const html = [];

  for (const block of blocks) {
    const rawLines = block.split("\n");
    let start = 0;
    const firstTrimmed = rawLines[0].trim();

    if (SECTION_RE.test(firstTrimmed)) {
      const label = firstTrimmed.slice(1, -1);
      if (label.startsWith("ACHIEVEMENT:")) {
        html.push(
          `<p class="ending-cutscene__achievement">${escapeHtml(label)}</p>`,
        );
      } else {
        html.push(
          `<h3 class="ending-cutscene__section">${escapeHtml(label)}</h3>`,
        );
      }
      start = 1;
    }

    const contentLines = rawLines.slice(start);
    const paragraphs = splitParagraphs(contentLines);

    for (const paragraphLines of paragraphs) {
      if (paragraphLines.length === 1) {
        const trimmed = paragraphLines[0].trim();
        const commandMatch = trimmed.match(COMMAND_RE);
        if (commandMatch) {
          html.push(
            `<p class="ending-cutscene__command">${escapeHtml(commandMatch[1])}</p>`,
          );
          continue;
        }
      }

      if (isDialogueBlock(paragraphLines)) {
        html.push(formatDialogueBlock(paragraphLines));
        continue;
      }

      const text = paragraphLines.map((line) => line.trim()).join(" ");
      if (text) {
        html.push(`<p class="ending-cutscene__para">${escapeHtml(text)}</p>`);
      }
    }
  }

  return html.join("");
}

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
