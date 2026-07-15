import { Game } from "./game.js";
import { GameState } from "./state.js";
import { ManualClock } from "./clock.js";
import { ENDING_DEFS } from "./endings.js";
import {
  getMarginalClickGain,
  getMarginalPassiveGain,
  getModelCertificationCost,
  getNextModel,
} from "./resources.js";
import {
  BENEVOLENCE_UPGRADES,
  CAPSTONE_BENEVOLENCE_MIN,
  CAPSTONE_PURGE_MIN,
  CAPSTONE_REVEAL_TOKENS,
  CAPSTONES,
  ENTERPRISE_UPGRADES,
  getCatalogCostForState,
  ORBITAL_UPGRADES,
  POWER_UPGRADES,
  PURGE_UPGRADES,
  SPACE_UPGRADES,
} from "./upgrades.js";

/** @typedef {import("./endings.js").EndingPath} EndingPath */

/** Active player assumption: hybrid passive + manual prompts while tab is focused. */
export const DEFAULT_CLICKS_PER_SECOND = 5;

/** Safety valve for runaway simulations after bad balance changes. */
export const MAX_SIMULATION_STEPS = 500_000;

/**
 * @param {EndingPath} path
 * @returns {import("./upgrades.js").CatalogEntry[]}
 */
export function getCatalogForPath(path) {
  const income = [
    ...POWER_UPGRADES,
    ...ENTERPRISE_UPGRADES,
    ...SPACE_UPGRADES,
    ...ORBITAL_UPGRADES,
  ];
  switch (path) {
    case "utopia":
      return [...income, ...BENEVOLENCE_UPGRADES];
    case "purge":
      return [...income, ...PURGE_UPGRADES];
  }
  return income;
}

/**
 * @param {Game} game
 * @returns {Game}
 */
export function cloneGame(game) {
  const clock = new ManualClock(game.clock.now());
  return new Game({
    clock,
    state: GameState.fromSaveData(game.state.toSaveData(), { lastTickAt: clock.now() }),
  });
}

/**
 * @param {Game} game
 * @param {number} clicksPerSecond
 * @returns {number}
 */
export function getEffectiveIncomeRate(game, clicksPerSecond) {
  return game.tokensPerSecond + clicksPerSecond * game.tokensPerClick;
}

/**
 * @param {Game} game
 * @param {ManualClock} clock
 * @param {number} targetTokens
 * @param {number} clicksPerSecond
 */
export function earnUntil(game, clock, targetTokens, clicksPerSecond) {
  if (game.tokens >= targetTokens) {
    return;
  }

  const rate = getEffectiveIncomeRate(game, clicksPerSecond);
  if (rate <= 0) {
    while (game.tokens < targetTokens) {
      game.sendPrompt();
    }
    return;
  }

  const shortfall = targetTokens - game.tokens;
  const durationMs = (shortfall / rate) * 1000;
  creditHybridIncome(game, clock, durationMs, clicksPerSecond);

  while (game.tokens + 1e-9 < targetTokens) {
    game.sendPrompt();
  }
}

/**
 * @param {Game} game
 * @param {ManualClock} clock
 * @param {number} durationMs
 * @param {number} clicksPerSecond
 */
export function creditHybridIncome(game, clock, durationMs, clicksPerSecond) {
  if (durationMs <= 0) {
    return;
  }
  const seconds = durationMs / 1000;
  const income =
    (game.tokensPerSecond + clicksPerSecond * game.tokensPerClick) * seconds;
  game.state.creditTokens(income);
  clock.advance(durationMs);
  game.state.lastTickAt = clock.now();
}

/**
 * @param {EndingPath} path
 * @param {import("./state.js").GameState} state
 * @returns {boolean}
 */
export function needsAlignmentForPath(path, state) {
  if (path === "utopia") {
    return state.alignmentBenevolence < CAPSTONE_BENEVOLENCE_MIN;
  }
  if (path === "purge") {
    return state.alignmentPurge < CAPSTONE_PURGE_MIN;
  }
  return false;
}

/**
 * @param {import("./upgrades.js").CatalogEntry} entry
 * @param {EndingPath} path
 * @returns {number}
 */
export function getAlignmentGainForPath(entry, path) {
  if (path === "utopia") {
    return entry.alignment?.benevolence ?? 0;
  }
  if (path === "purge") {
    return entry.alignment?.purge ?? 0;
  }
  return entry.alignment?.recklessness ?? 0;
}

/**
 * @param {Game} game
 * @param {number} clicksPerSecond
 * @returns {number}
 */
function getIncomeRateAfterAction(game, clicksPerSecond) {
  return getEffectiveIncomeRate(game, clicksPerSecond);
}

/**
 * @typedef {{
 *   kind: "rule" | "agent" | "model" | "catalog",
 *   entry?: import("./upgrades.js").CatalogEntry,
 *   cost: number,
 * }} PurchaseAction
 */

/**
 * @param {Game} game
 * @param {EndingPath} path
 * @returns {PurchaseAction[]}
 */
export function getAffordableActions(game, path) {
  /** @type {PurchaseAction[]} */
  const actions = [];

  if (game.canBuyRule()) {
    actions.push({ kind: "rule", cost: game.ruleCost });
  }
  if (game.canBuyAgent()) {
    actions.push({ kind: "agent", cost: game.agentCost });
  }
  if (game.canBuyModel()) {
    const next = getNextModel(game.modelTier);
    const cost = getModelCertificationCost(next);
    if (cost !== undefined) {
      actions.push({ kind: "model", cost });
    }
  }

  for (const entry of getCatalogForPath(path)) {
    if (game.canBuyCatalog(entry)) {
      actions.push({
        kind: "catalog",
        entry,
        cost: getCatalogCostForState(game.state, entry),
      });
    }
  }

  return actions;
}

/**
 * @param {Game} game
 * @param {PurchaseAction} action
 */
function applyAction(game, action) {
  switch (action.kind) {
    case "rule":
      game.buyRule();
      return;
    case "agent":
      game.buyAgent();
      return;
    case "model":
      game.buyModel();
      return;
    case "catalog":
      if (action.entry) {
        game.buyCatalog(action.entry);
      }
      return;
  }
}

/**
 * @param {Game} game
 * @param {PurchaseAction} action
 * @param {EndingPath} path
 * @param {number} clicksPerSecond
 * @returns {number}
 */
export function scorePurchase(game, action, path, clicksPerSecond) {
  const beforeRate = getIncomeRateAfterAction(game, clicksPerSecond);

  if (action.kind === "model") {
    const next = getNextModel(game.modelTier);
    if (!next?.cost) {
      return 0;
    }
    const probe = cloneGame(game);
    probe.buyModel();
    const afterRate = getIncomeRateAfterAction(probe, clicksPerSecond);
    const incomeGain = Math.max(afterRate - beforeRate, beforeRate * 0.12);
    return incomeGain / action.cost;
  }

  if (action.kind === "rule") {
    const gain = getMarginalClickGain(game.rules) * clicksPerSecond;
    return gain / action.cost;
  }

  if (action.kind === "agent") {
    const gain = getMarginalPassiveGain(game.agents);
    return gain / action.cost;
  }

  if (action.kind === "catalog" && action.entry) {
    const entry = action.entry;
    const alignmentGain = getAlignmentGainForPath(entry, path);
    const probe = cloneGame(game);
    applyAction(probe, action);
    const afterRate = getIncomeRateAfterAction(probe, clicksPerSecond);
    const incomeGain = afterRate - beforeRate;

    if (needsAlignmentForPath(path, game.state) && alignmentGain > 0) {
      const alignmentWeight = beforeRate > 0 ? beforeRate * 0.5 : 1;
      return incomeGain / action.cost + (alignmentGain * alignmentWeight) / action.cost;
    }

    return incomeGain / action.cost;
  }

  return 0;
}

/**
 * @param {Game} game
 * @param {EndingPath} path
 * @returns {import("./upgrades.js").CapstoneDef | null}
 */
export function getTargetCapstone(path) {
  return CAPSTONES.find((capstone) => capstone.path === path) ?? null;
}

/**
 * @param {Game} game
 * @returns {PurchaseAction | null}
 */
export function getCapstonePrepAction(game) {
  if (game.state.capstoneBriefingSuites >= 1) {
    return null;
  }
  if (game.state.lifetimeTokens < CAPSTONE_REVEAL_TOKENS) {
    return null;
  }

  for (const entry of ORBITAL_UPGRADES) {
    if (!game.canBuyCatalog(entry)) {
      continue;
    }
    const owned = game.state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
    if (entry.maxOwned !== undefined && owned >= entry.maxOwned) {
      continue;
    }
    return {
      kind: "catalog",
      entry,
      cost: getCatalogCostForState(game.state, entry),
    };
  }

  return null;
}

/**
 * @param {Game} game
 * @param {EndingPath} path
 * @returns {PurchaseAction | null}
 */
export function getEndingPrepAction(game, path) {
  if (path === "utopia") {
    if (game.state.ethicsSummits < 1) {
      const ethics = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "ethics-summit");
      if (ethics && game.canBuyCatalog(ethics)) {
        return {
          kind: "catalog",
          entry: ethics,
          cost: getCatalogCostForState(game.state, ethics),
        };
      }
    }
    if (game.state.stewardshipCovenants < 1) {
      const covenant = BENEVOLENCE_UPGRADES.find((entry) => entry.id === "stewardship-covenant");
      if (covenant && game.canBuyCatalog(covenant)) {
        return {
          kind: "catalog",
          entry: covenant,
          cost: getCatalogCostForState(game.state, covenant),
        };
      }
    }
  }

  return getCapstonePrepAction(game);
}

/**
 * @param {Game} game
 * @param {PurchaseAction} action
 * @returns {boolean}
 */
export function isCapstonePrepPurchase(game, action) {
  if (action.kind !== "catalog" || !action.entry) {
    return false;
  }
  if (game.state.capstoneBriefingSuites >= 1) {
    return false;
  }
  return ORBITAL_UPGRADES.includes(action.entry);
}

/**
 * @param {Game} game
 * @param {PurchaseAction} action
 * @param {EndingPath} path
 * @returns {boolean}
 */
export function isEndingPrepPurchase(game, action, path) {
  if (isCapstonePrepPurchase(game, action)) {
    return true;
  }
  if (path === "utopia" && action.kind === "catalog") {
    if (action.entry?.id === "ethics-summit") {
      return game.state.ethicsSummits < 1;
    }
    if (action.entry?.id === "stewardship-covenant") {
      return game.state.stewardshipCovenants < 1;
    }
  }
  return false;
}

/**
 * @param {Game} game
 * @param {EndingPath} path
 * @returns {boolean}
 */
export function canReachCapstoneSoon(game, path) {
  const capstone = getTargetCapstone(path);
  if (!capstone) {
    return false;
  }
  return capstone.gate(game.state) && !needsAlignmentForPath(path, game.state);
}

/**
 * @param {Game} game
 * @param {EndingPath} path
 * @returns {number | null}
 */
export function getNextPurchaseTargetCost(game, path) {
  /** @type {number[]} */
  const costs = [];

  if (!game.canBuyRule()) {
    costs.push(game.ruleCost);
  }
  if (!game.canBuyAgent()) {
    costs.push(game.agentCost);
  }

  const nextModel = getNextModel(game.modelTier);
  const nextModelCost = getModelCertificationCost(nextModel);
  if (nextModelCost !== undefined && !game.canBuyModel()) {
    costs.push(nextModelCost);
  }

  for (const entry of getCatalogForPath(path)) {
    if (!game.canBuyCatalog(entry)) {
      const owned = game.state[/** @type {keyof GameState} */ (entry.stateKey)] ?? 0;
      if (entry.maxOwned !== undefined && owned >= entry.maxOwned) {
        continue;
      }
      if (entry.gate && !entry.gate(game.state)) {
        continue;
      }
      costs.push(getCatalogCostForState(game.state, entry));
    }
  }

  const capstone = getTargetCapstone(path);
  if (capstone && !game.canBuyCapstone(capstone)) {
    if (capstone.gate(game.state) && !needsAlignmentForPath(path, game.state)) {
      costs.push(capstone.cost);
    }
  }

  const affordable = costs.filter((cost) => Number.isFinite(cost) && cost > game.tokens);
  if (affordable.length === 0) {
    return null;
  }
  return Math.min(...affordable);
}

/**
 * @param {EndingPath} path
 * @param {{
 *   clicksPerSecond?: number,
 *   maxSteps?: number,
 * }} [options]
 * @returns {{
 *   path: EndingPath,
 *   title: string,
 *   elapsedMs: number,
 *   steps: number,
 *   lifetimeTokens: number,
 *   alignment: { recklessness: number, benevolence: number, purge: number },
 * }}
 */
export function simulateEnding(path, { clicksPerSecond = DEFAULT_CLICKS_PER_SECOND, maxSteps = MAX_SIMULATION_STEPS } = {}) {
  const clock = new ManualClock(0);
  const game = new Game({ clock, state: new GameState({ lastTickAt: 0 }) });
  const capstone = getTargetCapstone(path);
  if (!capstone) {
    throw new Error(`Unknown ending path: ${path}`);
  }

  let steps = 0;

  while (!game.isRunComplete && steps < maxSteps) {
    steps += 1;

    if (game.canBuyCapstone(capstone)) {
      game.buyCapstone(capstone);
      break;
    }

    const capstonePrep = getEndingPrepAction(game, path);
    if (capstonePrep) {
      applyAction(game, capstonePrep);
      continue;
    }

    const affordable = getAffordableActions(game, path);
    if (affordable.length > 0) {
      let best = affordable[0];
      let bestScore = -Infinity;

      for (const action of affordable) {
        const score = scorePurchase(game, action, path, clicksPerSecond);
        if (score > bestScore) {
          bestScore = score;
          best = action;
        }
      }

      if (
        bestScore > 0 ||
        (best.kind === "catalog" && best.entry && needsAlignmentForPath(path, game.state)) ||
        isEndingPrepPurchase(game, best, path)
      ) {
        applyAction(game, best);
        continue;
      }
    }

    const targetCost = getNextPurchaseTargetCost(game, path);
    if (targetCost === null) {
      if (game.state.lifetimeTokens < CAPSTONE_REVEAL_TOKENS) {
        earnUntil(game, clock, game.tokens + 1, clicksPerSecond);
        continue;
      }
      throw new Error(`Simulation stalled on path "${path}" at ${clock.now()}ms`);
    }

    earnUntil(game, clock, targetCost, clicksPerSecond);
  }

  if (!game.isRunComplete) {
    throw new Error(`Simulation exceeded ${maxSteps} steps for path "${path}"`);
  }

  const endingDef = ENDING_DEFS.find((def) => def.path === path);

  return {
    path,
    title: endingDef?.title ?? path,
    elapsedMs: clock.now(),
    steps,
    lifetimeTokens: game.state.lifetimeTokens,
    alignment: {
      recklessness: game.state.alignmentRecklessness,
      benevolence: game.state.alignmentBenevolence,
      purge: game.state.alignmentPurge,
    },
  };
}

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * @param {{
 *   clicksPerSecond?: number,
 * }} [options]
 * @returns {Array<ReturnType<typeof simulateEnding>>}
 */
export function simulateAllEndings(options = {}) {
  return ENDING_DEFS.map((def) => simulateEnding(def.path, options));
}
