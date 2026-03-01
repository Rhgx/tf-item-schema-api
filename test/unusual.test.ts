import { describe, expect, test } from "vitest";
import type { SchemaCatalog } from "../src/schema/catalog.js";
import type { CommunityItemMetadata, NormalizedAttribute } from "../src/normalize/types.js";
import { resolveUnusualData } from "../src/normalize/unusual.js";

const schema: SchemaCatalog = {
  fetchedAt: 1,
  itemByDefindex: {},
  attributeByDefindex: {
    134: {
      defindex: 134,
      name: "particle effect",
      attributeClass: "set_attached_particle",
      storedAsInteger: true,
      lookupTable: null,
      descriptionFormat: null,
    },
  },
  attributeNameByDefindex: {
    134: "particle effect",
  },
  scoreTypeNameById: {},
  particleEffectNameById: {
    13: "Burning Flames",
    17: "Sunbeams",
  },
  qualityNameById: {},
  originNameById: {},
  stringLookupsByTable: {},
  strangeRankSets: [],
};

function baseAttribute(overrides: Partial<NormalizedAttribute>): NormalizedAttribute {
  return {
    defindex: 134,
    name: "particle effect",
    attributeClass: "set_attached_particle",
    storedAsInteger: true,
    lookupTable: null,
    decodedValue: null,
    floatValue: 13,
    value: 13,
    rawValue: 13,
    ...overrides,
  };
}

const emptyCommunity: CommunityItemMetadata = {
  assetId: "1",
  name: null,
  marketHashName: null,
  type: null,
  iconUrl: null,
  iconUrlLarge: null,
  tags: [],
  descriptions: [],
};

describe("unusual parsing", () => {
  test("prefers attribute effect id", () => {
    const data = resolveUnusualData([baseAttribute({})], schema, emptyCommunity);
    expect(data).toEqual({
      isUnusual: true,
      unusualEffectId: 13,
      unusualEffectName: "Burning Flames",
      unusualSource: "attribute",
    });
  });

  test("falls back to description line", () => {
    const data = resolveUnusualData(
      [],
      schema,
      {
        ...emptyCommunity,
        descriptions: [{ type: "html", value: "Unusual Effect: Sunbeams", color: null, label: null }],
      },
    );

    expect(data.isUnusual).toBe(true);
    expect(data.unusualEffectName).toBe("Sunbeams");
    expect(data.unusualSource).toBe("community_description");
    expect(data.unusualEffectId).toBe(17);
  });

  test("falls back to tag/type parsing", () => {
    const data = resolveUnusualData(
      [],
      schema,
      {
        ...emptyCommunity,
        type: "Unusual Hat - Burning Flames",
      },
    );
    expect(data.unusualSource).toBe("community_tags");
    expect(data.unusualEffectName).toBe("Burning Flames");
  });

  test("returns non-unusual when no signal exists", () => {
    const data = resolveUnusualData([], schema, emptyCommunity);
    expect(data).toEqual({
      isUnusual: false,
      unusualEffectId: null,
      unusualEffectName: null,
      unusualSource: null,
    });
  });
});
