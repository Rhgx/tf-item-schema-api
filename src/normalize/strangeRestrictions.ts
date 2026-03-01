import type { NormalizedAttribute, StrangeRestrictionEntry } from "./types.js";

const ITEM_TYPE_DEFINDEXES = [454, 456, 496];
const ITEM_VALUE_DEFINDEXES = [455, 457, 497];
const USER_TYPE_DEFINDEXES = [458, 460, 462];
const USER_VALUE_DEFINDEXES = [459, 461, 463];

function readIntegerAttribute(attributes: NormalizedAttribute[], defindex: number): number | null {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return null;
  }
  const value = Math.trunc(Number(attribute.value));
  return Number.isFinite(value) ? value : null;
}

function buildEntries(
  attributes: NormalizedAttribute[],
  scope: "item" | "user",
  typeDefindexes: number[],
  valueDefindexes: number[],
): StrangeRestrictionEntry[] {
  const entries: StrangeRestrictionEntry[] = [];
  for (let index = 0; index < typeDefindexes.length; index += 1) {
    const type = readIntegerAttribute(attributes, typeDefindexes[index] ?? -1);
    const value = readIntegerAttribute(attributes, valueDefindexes[index] ?? -1);
    if (type === null && value === null) {
      continue;
    }
    entries.push({
      scope,
      slot: index + 1,
      type,
      value,
    });
  }
  return entries;
}

export function resolveStrangeRestrictionsData(attributes: NormalizedAttribute[]): {
  selector: number | null;
  newCounterId: number | null;
  entries: StrangeRestrictionEntry[];
} {
  const itemEntries = buildEntries(attributes, "item", ITEM_TYPE_DEFINDEXES, ITEM_VALUE_DEFINDEXES);
  const userEntries = buildEntries(attributes, "user", USER_TYPE_DEFINDEXES, USER_VALUE_DEFINDEXES);

  return {
    selector: readIntegerAttribute(attributes, 468),
    newCounterId: readIntegerAttribute(attributes, 385),
    entries: [...itemEntries, ...userEntries],
  };
}
