import { describe, expect, test } from "vitest";
import { buildInventorySummary, filterInventoryResponse } from "../src/sdk/client.js";
import type { InventoryResponse, NormalizedInventoryItem } from "../src/normalize/types.js";

function makeItem(overrides: Partial<NormalizedInventoryItem>): NormalizedInventoryItem {
  return {
    identity: {
      itemId: "1",
      defindex: 205,
      level: 1,
    },
    classification: {
      kind: "weapon",
      itemClass: "tf_weapon_rocketlauncher",
      craftClass: "weapon",
      itemSlot: "primary",
    },
    quality: {
      id: 11,
      name: "Strange",
      grade: null,
    },
    names: {
      display: "Strange Rocket Launcher",
      localized: "Rocket Launcher",
      custom: null,
      community: "Strange Rocket Launcher",
      marketHash: "Strange Rocket Launcher",
    },
    flags: {
      isStrange: true,
      isUnusual: false,
      isCrate: false,
      isCommunityCrate: false,
      isFestivized: false,
      isCraftable: true,
      isTradable: true,
    },
    strange: {
      primaryCounter: null,
      counters: [],
      parts: [],
      primaryRank: null,
      counterRanks: [],
    },
    unusual: {
      effectId: null,
      effectName: null,
      source: null,
    },
    crate: {
      series: null,
      type: null,
    },
    killstreak: {
      tier: 0,
      tierName: null,
      effectId: null,
      effectName: null,
      effectLookupTable: null,
      sheenId: null,
      sheenName: null,
      sheenLookupTable: null,
    },
    cosmetics: {
      paintkitId: null,
      paintkitName: null,
    },
    media: {
      imageUrl: "https://example.test/image.png",
      imageUrlLarge: "https://example.test/image-large.png",
      wear: null,
      tags: [],
    },
    trade: {
      alwaysTradable: false,
      cannotTrade: false,
      isMarketable: null,
      tradableAfter: null,
    },
    crafting: {
      neverCraftable: false,
      cannotCraft: false,
      cannotGiftWrap: false,
      toolNeedsGiftWrap: false,
    },
    tool: {
      targetDefindex: null,
      targetItemName: null,
      recipeComponents: [],
      unusualifierTemplate: null,
    },
    paint: {
      rgbPrimary: null,
      rgbSecondary: null,
      primaryName: null,
      secondaryName: null,
      styleOverride: null,
      textureWear: null,
      textureWearDefault: null,
      seedLow: null,
      seedHigh: null,
    },
    spells: {
      paint: null,
      footsteps: null,
      voices: false,
      pumpkinBombs: false,
      greenFlames: false,
      deathGhosts: false,
      spellbookPages: [],
    },
    strangeRestrictions: {
      selector: null,
      newCounterId: null,
      entries: [],
    },
    source: {
      originalItemId: null,
      quantity: 1,
      originId: null,
      originName: null,
      customDescription: null,
      style: null,
      accountInfo: null,
      equipped: [],
      containedItem: null,
    },
    schema: {
      usedByClasses: ["Soldier"],
      perClassLoadoutSlots: { Soldier: ["primary"] },
      styles: [],
      tool: null,
      capabilities: [],
    },
    attributes: [],
    rawItem: {
      id: "1",
      defindex: 205,
    },
    ...overrides,
  };
}

describe("SDK helpers", () => {
  test("buildInventorySummary aggregates quality/effects and counts", () => {
    const response: InventoryResponse = {
      request: {
        language: "en",
        apiKeySource: "sdk",
        communityMetadataLoaded: true,
        warnings: [],
      },
      target: {
        input: "76561198012345678",
        steamId: "76561198012345678",
        resolvedFrom: "steamid64",
      },
      inventory: {
        totalItems: 3,
        public: true,
        fetchedAt: Date.now(),
      },
      items: [
        makeItem({ identity: { itemId: "1", defindex: 205, level: 1 } }),
        makeItem({
          identity: { itemId: "2", defindex: 200, level: 1 },
          quality: { id: 5, name: "Unusual", grade: null },
          flags: {
            isStrange: true,
            isUnusual: true,
            isCrate: false,
            isCommunityCrate: false,
            isFestivized: false,
            isCraftable: true,
            isTradable: true,
          },
          unusual: {
            effectId: null,
            effectName: "Sunbeams",
            source: null,
          },
        }),
        makeItem({
          identity: { itemId: "3", defindex: 200, level: 1 },
          quality: { id: 5, name: "Unusual", grade: null },
          flags: {
            isStrange: true,
            isUnusual: true,
            isCrate: false,
            isCommunityCrate: false,
            isFestivized: true,
            isCraftable: true,
            isTradable: true,
          },
          unusual: {
            effectId: null,
            effectName: "Sunbeams",
            source: null,
          },
        }),
      ],
      raw: {
        playerItemsResult: { status: 1, numBackpackSlots: 3000, items: [] },
        schemaFetchedAt: Date.now(),
      },
    };

    const summary = buildInventorySummary(response);
    expect(summary.totalItems).toBe(3);
    expect(summary.strangeItems).toBe(3);
    expect(summary.unusualItems).toBe(2);
    expect(summary.festivizedItems).toBe(1);
    expect(summary.uniqueDefindexes).toBe(2);
    expect(summary.qualityCounts.Unusual).toBe(2);
    expect(summary.unusualEffectCounts.Sunbeams).toBe(2);
  });

  test("filterInventoryResponse applies SDK-side filters and can strip raw fields", () => {
    const response: InventoryResponse = {
      request: {
        language: "en",
        apiKeySource: "sdk",
        communityMetadataLoaded: true,
        warnings: [],
      },
      target: {
        input: "76561198012345678",
        steamId: "76561198012345678",
        resolvedFrom: "steamid64",
      },
      inventory: {
        totalItems: 3,
        public: true,
        fetchedAt: Date.now(),
      },
      items: [
        makeItem({ identity: { itemId: "1", defindex: 205, level: 10 } }),
        makeItem({
          identity: { itemId: "2", defindex: 200, level: 5 },
          quality: { id: 5, name: "Unusual", grade: null },
          flags: {
            isStrange: false,
            isUnusual: true,
            isCrate: false,
            isCommunityCrate: false,
            isFestivized: false,
            isCraftable: true,
            isTradable: true,
          },
        }),
        makeItem({
          identity: { itemId: "3", defindex: 5022, level: 1 },
          flags: {
            isStrange: false,
            isUnusual: false,
            isCrate: true,
            isCommunityCrate: false,
            isFestivized: false,
            isCraftable: true,
            isTradable: true,
          },
          crate: { series: 30, type: "Mann Co. Supply Crate" },
        }),
      ],
      raw: {
        playerItemsResult: { status: 1, numBackpackSlots: 3000, items: [] },
        schemaFetchedAt: Date.now(),
      },
    };

    const filtered = filterInventoryResponse(response, {
      isCrate: true,
      crateSeries: [30],
      includeRaw: false,
    });

    expect(filtered.inventory.totalItems).toBe(1);
    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0]?.identity.itemId).toBe("3");
    expect("raw" in filtered).toBe(false);
    expect("rawItem" in filtered.items[0]!).toBe(false);
  });

  test("filterInventoryResponse supports compact detail level", () => {
    const response: InventoryResponse = {
      request: {
        language: "en",
        apiKeySource: "sdk",
        communityMetadataLoaded: true,
        warnings: [],
      },
      target: {
        input: "76561198012345678",
        steamId: "76561198012345678",
        resolvedFrom: "steamid64",
      },
      inventory: {
        totalItems: 1,
        public: true,
        fetchedAt: Date.now(),
      },
      items: [makeItem({ flags: { isStrange: false, isUnusual: false, isCrate: false, isCommunityCrate: false, isFestivized: false, isCraftable: true, isTradable: true } })],
      raw: {
        playerItemsResult: { status: 1, numBackpackSlots: 3000, items: [] },
        schemaFetchedAt: Date.now(),
      },
    };

    const compact = filterInventoryResponse(response, {
      includeRaw: false,
      detailLevel: "compact",
    });

    expect(compact.items).toHaveLength(1);
    expect("raw" in compact).toBe(false);
    const first = compact.items[0] as Record<string, unknown>;
    expect(first.crate).toBeUndefined();
    expect(first.killstreak).toBeUndefined();
  });
});
