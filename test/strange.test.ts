import { describe, expect, test } from "vitest";
import { extractStrangeCounters, getPrimaryCounter, getStrangeParts, resolveStrangeRankMetadata } from "../src/normalize/strange.js";
import type { NormalizedAttribute } from "../src/normalize/types.js";

describe("strange extraction", () => {
  test("extracts primary and part counters", () => {
    const attributes: NormalizedAttribute[] = [
      {
        defindex: 1,
        name: "kill eater score type",
        attributeClass: null,
        storedAsInteger: true,
        lookupTable: null,
        decodedValue: null,
        floatValue: 0,
        value: 0,
        rawValue: 0,
      },
      {
        defindex: 2,
        name: "kill eater",
        attributeClass: null,
        storedAsInteger: true,
        lookupTable: null,
        decodedValue: null,
        floatValue: 120,
        value: 120,
        rawValue: 120,
      },
      {
        defindex: 3,
        name: "kill eater score type 2",
        attributeClass: null,
        storedAsInteger: true,
        lookupTable: null,
        decodedValue: null,
        floatValue: 61,
        value: 61,
        rawValue: 61,
      },
      {
        defindex: 4,
        name: "kill eater 2",
        attributeClass: null,
        storedAsInteger: true,
        lookupTable: null,
        decodedValue: null,
        floatValue: 14,
        value: 14,
        rawValue: 14,
      },
    ];

    const counters = extractStrangeCounters(attributes, { 0: "Kills", 61: "Robots Destroyed" });
    expect(counters).toHaveLength(2);
    expect(getPrimaryCounter(counters)?.scoreTypeName).toBe("Kills");
    expect(getStrangeParts(counters)).toEqual([
      { slot: 2, scoreTypeId: 61, scoreTypeName: "Robots Destroyed", value: 14 },
    ]);
  });

  test("ignores score type without value", () => {
    const attributes: NormalizedAttribute[] = [
      {
        defindex: 1,
        name: "kill eater score type",
        attributeClass: null,
        storedAsInteger: true,
        lookupTable: null,
        decodedValue: null,
        floatValue: 0,
        value: 0,
        rawValue: 0,
      },
    ];
    const counters = extractStrangeCounters(attributes, { 0: "Kills" });
    expect(counters).toEqual([]);
  });

  test("resolves strange rank progress from item_levels", () => {
    const counters = [{ slot: 0, scoreTypeId: 0, scoreTypeName: "Kills", value: 120 }];
    const primary = getPrimaryCounter(counters);
    const ranks = resolveStrangeRankMetadata(counters, primary, [
      {
        name: "Kills",
        tiers: [
          { rank: 1, requiredScore: 0, name: "Strange" },
          { rank: 2, requiredScore: 10, name: "Unremarkable" },
          { rank: 3, requiredScore: 100, name: "Scarcely Lethal" },
          { rank: 4, requiredScore: 500, name: "Mildly Menacing" },
        ],
      },
    ]);

    expect(ranks.primaryRank?.setName).toBe("Kills");
    expect(ranks.primaryRank?.currentTier?.name).toBe("Scarcely Lethal");
    expect(ranks.primaryRank?.nextTier?.name).toBe("Mildly Menacing");
  });
});
