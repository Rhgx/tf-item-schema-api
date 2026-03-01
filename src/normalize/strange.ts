import type { StrangeRankSet } from "../schema/catalog.js";
import type {
  NormalizedAttribute,
  StrangeCounter,
  StrangeCounterRank,
  StrangeRankProgress,
  StrangeRankTier,
} from "./types.js";

function parseCounterSlot(attributeName: string): number {
  const match = attributeName.toLowerCase().match(/(\d+)\s*$/);
  if (!match || !match[1]) {
    return 0;
  }
  const slot = Number(match[1]);
  return Number.isFinite(slot) ? slot : 0;
}

export function extractStrangeCounters(
  attributes: NormalizedAttribute[],
  scoreTypeNames: Record<number, string>,
): StrangeCounter[] {
  const scoreTypesBySlot = new Map<number, number>();
  const scoreValuesBySlot = new Map<number, number>();

  for (const attribute of attributes) {
    if (!attribute.name) {
      continue;
    }
    const lower = attribute.name.toLowerCase();
    if (!lower.includes("kill eater")) {
      continue;
    }

    if (lower.includes("score type")) {
      const slot = parseCounterSlot(lower);
      scoreTypesBySlot.set(slot, Math.round(attribute.value));
      continue;
    }

    if (lower.includes("kill type")) {
      continue;
    }

    const slot = parseCounterSlot(lower);
    scoreValuesBySlot.set(slot, Math.floor(attribute.value));
  }

  const counters: StrangeCounter[] = [];
  for (const slot of scoreValuesBySlot.keys()) {
    let scoreTypeId = scoreTypesBySlot.get(slot);
    if (scoreTypeId === undefined) {
      if (slot === 0) {
        scoreTypeId = 0;
      } else {
        continue;
      }
    }

    const value = scoreValuesBySlot.get(slot);
    if (value === undefined) {
      continue;
    }

    counters.push({
      slot,
      scoreTypeId,
      scoreTypeName: scoreTypeNames[scoreTypeId] ?? `Type ${scoreTypeId}`,
      value,
    });
  }

  counters.sort((left, right) => left.slot - right.slot || left.scoreTypeId - right.scoreTypeId);
  return counters;
}

export function getPrimaryCounter(counters: StrangeCounter[]): StrangeCounter | null {
  if (counters.length === 0) {
    return null;
  }
  const slotZero = counters.find((counter) => counter.slot === 0);
  if (slotZero) {
    return slotZero;
  }
  return [...counters].sort((left, right) => left.slot - right.slot)[0] ?? null;
}

export function getStrangeParts(counters: StrangeCounter[]): StrangeCounter[] {
  const primary = getPrimaryCounter(counters);
  if (!primary) {
    return [];
  }
  return counters.filter((counter) => counter.slot !== primary.slot);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesRankSet(counter: StrangeCounter, set: StrangeRankSet): boolean {
  const counterName = normalizeText(counter.scoreTypeName);
  const setName = normalizeText(set.name);
  if (!counterName || !setName) {
    return false;
  }

  if (counterName === setName) {
    return true;
  }
  if (setName.includes(counterName) || counterName.includes(setName)) {
    return true;
  }
  if (counter.scoreTypeId === 0 && /kill/.test(counterName) && /kill/.test(setName)) {
    return true;
  }

  return false;
}

function resolveRankSetForCounter(counter: StrangeCounter, rankSets: StrangeRankSet[]): StrangeRankSet | null {
  for (const set of rankSets) {
    if (matchesRankSet(counter, set)) {
      return set;
    }
  }
  return null;
}

function toTier(tier: StrangeRankSet["tiers"][number] | undefined): StrangeRankTier | null {
  if (!tier) {
    return null;
  }
  return {
    rank: tier.rank,
    requiredScore: tier.requiredScore,
    name: tier.name,
  };
}

function resolveProgressForCounter(counter: StrangeCounter, rankSets: StrangeRankSet[]): StrangeRankProgress | null {
  const set = resolveRankSetForCounter(counter, rankSets);
  if (!set || set.tiers.length === 0) {
    return null;
  }

  let current = set.tiers[0];
  let next: StrangeRankSet["tiers"][number] | undefined;

  for (const tier of set.tiers) {
    if (counter.value >= tier.requiredScore) {
      current = tier;
      continue;
    }
    next = tier;
    break;
  }

  return {
    setName: set.name,
    currentTier: toTier(current),
    nextTier: toTier(next),
  };
}

export function resolveStrangeRankMetadata(
  counters: StrangeCounter[],
  primaryCounter: StrangeCounter | null,
  rankSets: StrangeRankSet[],
): {
  primaryRank: StrangeRankProgress | null;
  counterRanks: StrangeCounterRank[];
} {
  if (rankSets.length === 0 || counters.length === 0) {
    return {
      primaryRank: null,
      counterRanks: [],
    };
  }

  const counterRanks: StrangeCounterRank[] = [];
  for (const counter of counters) {
    const progress = resolveProgressForCounter(counter, rankSets);
    if (!progress) {
      continue;
    }
    counterRanks.push({
      slot: counter.slot,
      scoreTypeId: counter.scoreTypeId,
      value: counter.value,
      progress,
    });
  }

  const primaryRank = primaryCounter
    ? counterRanks.find((entry) => entry.slot === primaryCounter.slot)?.progress ?? null
    : null;

  return {
    primaryRank,
    counterRanks,
  };
}
