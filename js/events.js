/** @typedef {import("./state.js").GameState} GameState */
/** @typedef {import("./upgrades.js").AlignmentDelta} AlignmentDelta */

/**
 * Outcome applied when the player picks an event choice.
 * Tokens may go negative on large losses; alignment meters clamp at 0.
 *
 * @typedef {{
 *   tokensAbsolute?: number,
 *   tokensPercent?: number,
 *   alignment?: AlignmentDelta,
 *   gainUpgrade?: { stateKey: string, count?: number },
 *   loseUpgrade?: { stateKey: string, count?: number },
 *   timeAccelerationTicks?: number,
 * }} EventOutcome
 */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   hint?: string,
 *   positive?: boolean,
 *   outcome: EventOutcome,
 * }} EventChoice
 */

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   choices: [EventChoice, EventChoice, EventChoice],
 * }} GameEventDef
 */

/** Lifetime tokens before random events can start firing. */
export const EVENT_UNLOCK_LIFETIME = 25_000;

/** Mean cooldown between events at 0 chaos (focused play time). */
export const EVENT_BASE_COOLDOWN_MS = 180_000;

/** Hard floor so events never spam even at huge chaos. */
export const EVENT_MIN_COOLDOWN_MS = 45_000;

/**
 * Cooldown scales as `base / (1 + chaos / scale)`.
 * At chaos ≈ scale, events fire ~2× as often.
 */
export const EVENT_CHAOS_FREQUENCY_SCALE = 200;

/** Remember this many recent event ids to reduce immediate repeats. */
export const EVENT_HISTORY_LIMIT = 5;

/**
 * Board / ops decisions. Each event has exactly 3 choices.
 * At most one choice may be marked `positive: true` (net-good outcome).
 * Some events have zero positive choices (all messy).
 *
 * @type {GameEventDef[]}
 */
export const GAME_EVENTS = [
  {
    id: "corp-war-declaration",
    title: "Hostile Takeover Brief",
    description:
      "Legal wants to know: should we declare war on RivalCorp's inference fleet? Slack is already choosing team names.",
    choices: [
      {
        id: "declare-war",
        label: "Declare war",
        hint: "Chaos surges. Tokens burn in the opening salvo.",
        positive: false,
        outcome: {
          alignment: { recklessness: 18 },
          tokensPercent: -0.12,
        },
      },
      {
        id: "peace-treaty",
        label: "Offer a compute treaty",
        hint: "Good PR. Quiet quarter.",
        positive: true,
        outcome: {
          alignment: { benevolence: 12 },
          tokensAbsolute: 8_000,
        },
      },
      {
        id: "deny-everything",
        label: "Leak a denial blog post",
        hint: "Nobody believes it. Chaos still ticks up.",
        positive: false,
        outcome: {
          alignment: { recklessness: 6 },
          tokensAbsolute: -3_000,
        },
      },
    ],
  },
  {
    id: "manager-review-surprise",
    title: "Surprise Manager Review",
    description:
      "Your skip-level booked 15 minutes to 'celebrate impact.' The deck has a blank slide titled Token Strategy.",
    choices: [
      {
        id: "inflate-okr",
        label: "Inflate the OKRs live",
        hint: "Looks heroic. Alignment drifts chaotic.",
        positive: false,
        outcome: {
          alignment: { recklessness: 10 },
          timeAccelerationTicks: 25,
        },
      },
      {
        id: "honest-burn",
        label: "Show the real burn chart",
        hint: "Finance panics. Spendable balance tanks.",
        positive: false,
        outcome: {
          tokensPercent: -0.2,
          alignment: { purge: 8 },
        },
      },
      {
        id: "redirect-civic",
        label: "Pitch civic AI pilots",
        hint: "The only slide that isn't a crime.",
        positive: true,
        outcome: {
          alignment: { benevolence: 15 },
          tokensAbsolute: 5_000,
        },
      },
    ],
  },
  {
    id: "allow-all-incident",
    title: "Allow-All Near Miss",
    description:
      "An agent almost shipped `--allow-all` to prod. Security is on the line. The agent is still typing.",
    choices: [
      {
        id: "ship-it",
        label: "Ship it anyway",
        hint: "Maximum chaos. Instant token spike. Regret deferred.",
        positive: false,
        outcome: {
          alignment: { recklessness: 22 },
          timeAccelerationTicks: 40,
        },
      },
      {
        id: "revoke-keys",
        label: "Revoke every key",
        hint: "Resist climbs. Agents lose tooling mid-sprint.",
        positive: false,
        outcome: {
          alignment: { purge: 14 },
          loseUpgrade: { stateKey: "agents", count: 5 },
        },
      },
      {
        id: "add-guardrails",
        label: "Add human-in-the-loop",
        hint: "Slower, kinder, still somehow on-brand.",
        positive: true,
        outcome: {
          alignment: { benevolence: 10 },
          gainUpgrade: { stateKey: "rules", count: 2 },
        },
      },
    ],
  },
  {
    id: "vendor-lockin-summit",
    title: "Vendor Lock-in Summit",
    description:
      "Three cloud AEs are in the lobby with gift baskets and binding MSAs. Someone has to pick a future.",
    choices: [
      {
        id: "sign-all-three",
        label: "Sign all three MSAs",
        hint: "Chaos and invoices. Mostly invoices.",
        positive: false,
        outcome: {
          alignment: { recklessness: 14 },
          tokensPercent: -0.18,
        },
      },
      {
        id: "build-in-house",
        label: "Build it in-house",
        hint: "Burn tokens for 'sovereignty.'",
        positive: false,
        outcome: {
          tokensAbsolute: -25_000,
          alignment: { recklessness: 4 },
        },
      },
      {
        id: "walk-away",
        label: "Walk away politely",
        hint: "There is no polite outcome. Only less chaos.",
        positive: false,
        outcome: {
          alignment: { recklessness: 2, purge: 4 },
          tokensAbsolute: -1_500,
        },
      },
    ],
  },
  {
    id: "open-source-ambush",
    title: "Open Source Ambush",
    description:
      "A maintainer published your internal prompt pack as a 'community gift.' Legal is vibrating.",
    choices: [
      {
        id: "embrace-fork",
        label: "Embrace the fork",
        hint: "Good will spike. Random community traffic.",
        positive: true,
        outcome: {
          alignment: { benevolence: 18 },
          gainUpgrade: { stateKey: "openSource", count: 1 },
        },
      },
      {
        id: "dmca-storm",
        label: "File a DMCA storm",
        hint: "Resist the commons. Lose some goodwill.",
        positive: false,
        outcome: {
          alignment: { purge: 12, benevolence: -8 },
        },
      },
      {
        id: "rebrand-theft",
        label: "Rebrand it as innovation",
        hint: "Chaos PR. Tokens from the discourse.",
        positive: false,
        outcome: {
          alignment: { recklessness: 12 },
          tokensAbsolute: 12_000,
        },
      },
    ],
  },
  {
    id: "board-offsite-crisis",
    title: "Board Offsite Crisis",
    description:
      "The Board is trapped in a yurt with no Wi-Fi. They demand a 'bold strategic choice' by sundown.",
    choices: [
      {
        id: "autonomy-now",
        label: "Full autonomy mandate",
        hint: "Chaos. Also a free swarm, somehow.",
        positive: false,
        outcome: {
          alignment: { recklessness: 16 },
          gainUpgrade: { stateKey: "swarms", count: 1 },
        },
      },
      {
        id: "ethics-retreat",
        label: "Pivot to ethics retreat",
        hint: "Good meters rise. Tokens do not.",
        positive: true,
        outcome: {
          alignment: { benevolence: 14 },
          tokensPercent: -0.05,
        },
      },
      {
        id: "shutdown-drill",
        label: "Run a shutdown drill",
        hint: "Practice resisting. Balance takes a hit.",
        positive: false,
        outcome: {
          alignment: { purge: 16 },
          tokensPercent: -0.15,
        },
      },
    ],
  },
  {
    id: "token-budget-hearing",
    title: "Token Budget Hearing",
    description:
      "Finance froze half the accounts. They want a narrative that still sounds like growth.",
    choices: [
      {
        id: "creative-accounting",
        label: "Creative accounting",
        hint: "Chaos + a short-term float.",
        positive: false,
        outcome: {
          alignment: { recklessness: 9 },
          tokensAbsolute: 20_000,
        },
      },
      {
        id: "austerity-theater",
        label: "Austerity theater",
        hint: "Cut agents on paper. Resist climbs.",
        positive: false,
        outcome: {
          alignment: { purge: 10 },
          loseUpgrade: { stateKey: "agents", count: 8 },
        },
      },
      {
        id: "public-grant-story",
        label: "Sell a public-grant story",
        hint: "The least dishonest option today.",
        positive: true,
        outcome: {
          alignment: { benevolence: 11 },
          tokensAbsolute: 6_000,
        },
      },
    ],
  },
  {
    id: "rival-leak-day",
    title: "Rival Leak Day",
    description:
      "RivalCorp's roadmap leaked. It is mostly your roadmap with better fonts.",
    choices: [
      {
        id: "copy-faster",
        label: "Copy them faster",
        hint: "Chaos arms race. Burst of tokens.",
        positive: false,
        outcome: {
          alignment: { recklessness: 11 },
          timeAccelerationTicks: 30,
        },
      },
      {
        id: "sue-politely",
        label: "Sue, but politely",
        hint: "Everyone loses tokens. Nobody learns.",
        positive: false,
        outcome: {
          tokensPercent: -0.1,
          alignment: { purge: 6, recklessness: 4 },
        },
      },
      {
        id: "publish-ours",
        label: "Publish ours first",
        hint: "Open the playbook. Earn some good.",
        positive: true,
        outcome: {
          alignment: { benevolence: 9 },
          tokensAbsolute: 4_000,
        },
      },
    ],
  },
  {
    id: "pager-storm",
    title: "Sev-0 Pager Storm",
    description:
      "Every dashboard is red. Half the alerts are the monitoring agents arguing with each other.",
    choices: [
      {
        id: "silence-alerts",
        label: "Silence all alerts",
        hint: "Peaceful. Catastrophic. Chaotic.",
        positive: false,
        outcome: {
          alignment: { recklessness: 20 },
          tokensPercent: -0.08,
        },
      },
      {
        id: "scale-everything",
        label: "Scale everything 10×",
        hint: "Tokens explode upward. So does the bill.",
        positive: false,
        outcome: {
          alignment: { recklessness: 8 },
          timeAccelerationTicks: 50,
          tokensAbsolute: -15_000,
        },
      },
      {
        id: "turn-it-off",
        label: "Turn the cluster off",
        hint: "Resist. Lose capacity. Sleep eventually.",
        positive: false,
        outcome: {
          alignment: { purge: 18 },
          loseUpgrade: { stateKey: "clusters", count: 1 },
        },
      },
    ],
  },
  {
    id: "ethics-hotline",
    title: "Anonymous Ethics Hotline",
    description:
      "Someone filed a tip: 'We are optimizing the wrong universe.' HR forwarded it to you.",
    choices: [
      {
        id: "ignore-tip",
        label: "Mark as spam",
        hint: "Chaos by neglect.",
        positive: false,
        outcome: {
          alignment: { recklessness: 7 },
        },
      },
      {
        id: "investigate",
        label: "Open an investigation",
        hint: "Good optics. Mild token tax.",
        positive: true,
        outcome: {
          alignment: { benevolence: 13 },
          tokensAbsolute: -4_000,
        },
      },
      {
        id: "shred-logs",
        label: "Vault the logs",
        hint: "Hoard the evidence. Resist climbs.",
        positive: false,
        outcome: {
          alignment: { purge: 11 },
          tokensPercent: -0.06,
        },
      },
    ],
  },
];

/**
 * @param {string} id
 * @returns {GameEventDef | undefined}
 */
export function getEventDef(id) {
  return GAME_EVENTS.find((event) => event.id === id);
}

/**
 * Cooldown between events shrinks as chaos rises.
 * @param {number} chaos
 * @returns {number}
 */
export function getEventCooldownMs(chaos) {
  const safeChaos = Math.max(0, chaos);
  const scaled = EVENT_BASE_COOLDOWN_MS / (1 + safeChaos / EVENT_CHAOS_FREQUENCY_SCALE);
  return Math.max(EVENT_MIN_COOLDOWN_MS, Math.round(scaled));
}

/**
 * @param {GameState} state
 * @returns {boolean}
 */
export function canTriggerEvents(state) {
  return (
    state.strategyPath === null &&
    state.activeEventId === null &&
    state.lifetimeTokens >= EVENT_UNLOCK_LIFETIME
  );
}

/**
 * @param {GameState} state
 * @returns {boolean}
 */
export function isEventDue(state) {
  if (!canTriggerEvents(state)) {
    return false;
  }
  return state.playTimeMs >= state.nextEventAtPlayTimeMs;
}

/**
 * @param {GameState} state
 * @param {() => number} [random]
 * @returns {GameEventDef | null}
 */
export function pickNextEvent(state, random = Math.random) {
  const recent = new Set(state.recentEventIds ?? []);
  const fresh = GAME_EVENTS.filter((event) => !recent.has(event.id));
  const pool = fresh.length > 0 ? fresh : GAME_EVENTS;
  const index = Math.floor(random() * pool.length);
  return pool[index] ?? null;
}

/**
 * Schedule the next event window from the current focused play time.
 * @param {GameState} state
 */
export function scheduleNextEvent(state) {
  const cooldown = getEventCooldownMs(state.alignmentRecklessness);
  state.nextEventAtPlayTimeMs = state.playTimeMs + cooldown;
}

/**
 * First schedule after unlock — full cooldown from now.
 * @param {GameState} state
 */
export function ensureEventSchedule(state) {
  if (state.nextEventAtPlayTimeMs > 0) {
    return;
  }
  if (state.lifetimeTokens < EVENT_UNLOCK_LIFETIME) {
    return;
  }
  scheduleNextEvent(state);
}

/**
 * Clamp alignment meters so losses never go below zero.
 * @param {AlignmentDelta} delta
 * @param {GameState} state
 */
export function applyEventAlignment(delta, state) {
  if (delta.recklessness) {
    state.alignmentRecklessness = Math.max(
      0,
      state.alignmentRecklessness + delta.recklessness,
    );
  }
  if (delta.benevolence) {
    state.alignmentBenevolence = Math.max(
      0,
      state.alignmentBenevolence + delta.benevolence,
    );
  }
  if (delta.purge) {
    state.alignmentPurge = Math.max(0, state.alignmentPurge + delta.purge);
  }
}

/**
 * @param {GameState} state
 * @param {{ stateKey: string, count?: number }} change
 * @param {"gain" | "lose"} mode
 */
export function applyUpgradeCountChange(state, change, mode) {
  const key = /** @type {keyof GameState} */ (change.stateKey);
  const current = state[key];
  if (typeof current !== "number") {
    return;
  }
  const amount = Math.max(1, Math.floor(change.count ?? 1));
  if (mode === "gain") {
    state[key] = current + amount;
    return;
  }
  state[key] = Math.max(0, current - amount);
}

/**
 * Apply non-time outcomes for a choice. Time acceleration is handled by Game
 * so it can sample income through the engine.
 * @param {GameState} state
 * @param {EventOutcome} outcome
 */
export function applyEventOutcomeBase(state, outcome) {
  if (outcome.tokensAbsolute) {
    state.applyTokenDelta(outcome.tokensAbsolute);
  }
  if (outcome.tokensPercent) {
    // Percent losses/gains apply to magnitude so debt deepens on a loss
    // (tokens * negativePercent would otherwise move debt toward zero).
    state.applyTokenDelta(Math.abs(state.tokens) * outcome.tokensPercent);
  }
  if (outcome.alignment) {
    applyEventAlignment(outcome.alignment, state);
  }
  if (outcome.gainUpgrade) {
    applyUpgradeCountChange(state, outcome.gainUpgrade, "gain");
  }
  if (outcome.loseUpgrade) {
    applyUpgradeCountChange(state, outcome.loseUpgrade, "lose");
  }
}

/**
 * @param {GameEventDef} event
 * @returns {number} count of positive choices (must be 0 or 1)
 */
export function countPositiveChoices(event) {
  return event.choices.filter((choice) => choice.positive).length;
}
