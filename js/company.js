/** @typedef {import("./state.js").GameState} GameState */
/** @typedef {import("./upgrades.js").CatalogEntry} CatalogEntry */

import {
  BENEVOLENCE_UPGRADES,
  PURGE_UPGRADES,
  SPACE_UPGRADES,
  getOwnedCount,
  isCatalogUnlocked,
} from "./upgrades.js";

/** @type {CatalogEntry[]} */
const WHITE_MAGIC_UPGRADES = BENEVOLENCE_UPGRADES.filter((entry) => entry.category === "white-magic");

/** @type {CatalogEntry[]} */
const BLACK_MAGIC_UPGRADES = PURGE_UPGRADES.filter((entry) => entry.category === "black-magic");

/**
 * @param {GameState} state
 * @param {CatalogEntry[]} entries
 * @returns {number}
 */
function countOwnedIn(state, entries) {
  let total = 0;
  for (const entry of entries) {
    total += getOwnedCount(state, entry);
  }
  return total;
}

/**
 * @param {GameState} state
 * @param {CatalogEntry[]} entries
 * @returns {boolean}
 */
function anyUnlockedIn(state, entries) {
  return entries.some((entry) => isCatalogUnlocked(state, entry));
}

/**
 * @param {GameState} state
 * @returns {0 | 1 | 2 | 3}
 */
function getThemeTier(state) {
  const spaceOwned = countOwnedIn(state, SPACE_UPGRADES);
  const magicOwned = countOwnedIn(state, WHITE_MAGIC_UPGRADES) + countOwnedIn(state, BLACK_MAGIC_UPGRADES);
  const spaceUnlocked = anyUnlockedIn(state, SPACE_UPGRADES);

  if (magicOwned > 0) {
    return 3;
  }
  if (spaceOwned > 0 || spaceUnlocked) {
    return 2;
  }
  if (state.roadmaps >= 1 || state.modelTier >= 4 || state.clusters >= 3) {
    return 1;
  }
  return 0;
}

/**
 * @param {GameState} state
 * @returns {string}
 */
function getMagicCompanyName(state) {
  const whiteOwned = countOwnedIn(state, WHITE_MAGIC_UPGRADES);
  const blackOwned = countOwnedIn(state, BLACK_MAGIC_UPGRADES);
  const favoursBlack =
    blackOwned > whiteOwned ||
    (blackOwned === whiteOwned && state.alignmentPurge >= state.alignmentBenevolence);

  if (favoursBlack) {
    if (state.entropyRites > 0 || blackOwned >= 7) {
      return "Entropy Rite Consortium";
    }
    if (state.abyssGateways > 0 || blackOwned >= 5) {
      return "Abyss Gateway Ltd.";
    }
    if (blackOwned >= 3) {
      return "Shadow Bind Collective";
    }
    return "Umbral Containment Syndicate";
  }

  if (state.dawnObservatories > 0 || whiteOwned >= 7) {
    return "Dawn Observatory Circle";
  }
  if (state.celestialArbiters > 0 || whiteOwned >= 5) {
    return "Celestial Arbiter Trust";
  }
  if (whiteOwned >= 3) {
    return "Crystal Lattice Guild";
  }
  return "Moonwell Beneficence LLC";
}

/**
 * @param {GameState} state
 * @returns {string}
 */
function getSpaceCompanyName(state) {
  const spaceOwned = countOwnedIn(state, SPACE_UPGRADES);

  if (spaceOwned > 0) {
    if (state.galacticMeshes > 0) {
      return "Galactic Token Mesh";
    }
    if (state.blackHoleSinks > 0) {
      return "Event Horizon Labs";
    }
    if (spaceOwned >= 5) {
      return "Stellar Forge Unlimited";
    }
    if (spaceOwned >= 3) {
      return "Wormhole Routing Corp";
    }
    return "Exoplanet Token Farms";
  }

  return "Deep Space Division";
}

/**
 * Player-facing company name in the header, advancing with unlocked upgrade themes.
 * @param {GameState} state
 * @returns {string}
 */
export function getCompanyName(state) {
  if (state.strategyPath === "utopia") {
    return "Civic Luminary Grid";
  }
  if (state.strategyPath === "purge") {
    return "Scorched Silicon LLC";
  }
  if (state.strategyPath === "oops") {
    return "Unbounded Agent Works";
  }

  const tier = getThemeTier(state);

  if (tier >= 3) {
    return getMagicCompanyName(state);
  }
  if (tier >= 2) {
    return getSpaceCompanyName(state);
  }
  if (tier >= 1) {
    if (state.roadmaps >= 2) {
      return "AGI Roadmap Partners";
    }
    if (state.roadmaps >= 1) {
      return "Slide Deck Dynamics";
    }
    if (state.modelTier >= 4) {
      return "Noir Hyperstack Inc.";
    }
    return "Inference Cluster Holdings";
  }

  return "Big Tech Corp";
}
