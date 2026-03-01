import { describe, expect, test } from "vitest";
import { createApp } from "../src/server/app.js";
import type { InventoryServiceLike } from "../src/service/inventoryService.js";
import { SteamApiError } from "../src/steam/errors.js";
import type { NormalizedInventoryItem } from "../src/normalize/types.js";

function makeItem(overrides: Partial<NormalizedInventoryItem>): NormalizedInventoryItem {
  return {
    identity: {
      itemId: "1",
      defindex: 205,
      level: 10,
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
      imageUrl: null,
      imageUrlLarge: null,
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

function makeService(mode: "ok" | "invalid_key" | "private_inventory" | "vanity_not_found" | "rate_limited" | "upstream_http_error" | "response_parse_error"): InventoryServiceLike {
  return {
    async getInventory() {
      if (mode !== "ok") {
        throw new SteamApiError(mode, `boom: ${mode}`);
      }
      return {
        request: {
          language: "en",
          apiKeySource: "header",
          communityMetadataLoaded: true,
          warnings: [],
        },
        target: {
          input: "gaben",
          steamId: "76561198012345678",
          resolvedFrom: "vanity",
        },
        inventory: {
          totalItems: 3,
          public: true,
          fetchedAt: 1,
        },
        items: [
          makeItem({
            identity: { itemId: "1", defindex: 205, level: 10 },
          }),
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
            unusual: {
              effectId: 17,
              effectName: "Sunbeams",
              source: "attribute",
            },
            names: {
              display: "Unusual Hat",
              localized: "Hat",
              custom: null,
              community: "Unusual Hat",
              marketHash: "Unusual Hat",
            },
            attributes: [
              {
                defindex: 143,
                name: "custom employee number",
                attributeClass: "set_employee_number",
                storedAsInteger: true,
                lookupTable: null,
                decodedValue: "2023-03-03T11:18:24",
                floatValue: 9.580633588094823e21,
                value: 1677842304,
                rawValue: 1677842304,
              },
            ],
          }),
          makeItem({
            identity: { itemId: "3", defindex: 5022, level: 1 },
            quality: { id: 6, name: "Unique", grade: null },
            flags: {
              isStrange: false,
              isUnusual: false,
              isCrate: true,
              isCommunityCrate: false,
              isFestivized: false,
              isCraftable: true,
              isTradable: true,
            },
            crate: {
              series: 30,
              type: "Mann Co. Supply Crate",
            },
            names: {
              display: "Mann Co. Supply Crate #30",
              localized: "Mann Co. Supply Crate",
              custom: null,
              community: "Mann Co. Supply Crate",
              marketHash: "Mann Co. Supply Crate",
            },
            attributes: [
              {
                defindex: 153,
                name: "cannot trade",
                attributeClass: "cannot_trade",
                storedAsInteger: false,
                lookupTable: null,
                decodedValue: null,
                floatValue: 1,
                value: 1,
                rawValue: 1065353216,
              },
            ],
          }),
        ],
        raw: {
          playerItemsResult: {
            status: 1,
            numBackpackSlots: 100,
            items: [],
          },
          schemaFetchedAt: 1,
        },
      };
    },
  };
}

describe("HTTP routes", () => {
  test("returns expected response shape", async () => {
    const app = await createApp({ service: makeService("ok") });
    const response = await app.inject({
      method: "GET",
      url: "/v1/inventory/gaben?language=en",
      headers: { "x-steam-api-key": "key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.target.steamId).toBe("76561198012345678");
    expect(body.inventory.totalItems).toBe(3);
    expect(body.raw).toBeUndefined();
    expect(body.items[0]?.rawItem).toBeUndefined();
    await app.close();
  });

  test("includes raw payload when includeRaw=true", async () => {
    const app = await createApp({ service: makeService("ok") });
    const response = await app.inject({
      method: "GET",
      url: "/v1/inventory/gaben?includeRaw=true",
      headers: { "x-steam-api-key": "key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.raw).toBeDefined();
    expect(body.items[0]?.rawItem).toBeDefined();
    await app.close();
  });

  test("returns compact view when view=compact", async () => {
    const app = await createApp({ service: makeService("ok") });
    const response = await app.inject({
      method: "GET",
      url: "/v1/inventory/gaben?view=compact",
      headers: { "x-steam-api-key": "key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items[0]?.classification?.kind).toBe("weapon");
    expect(body.items[0]?.strange).toBeUndefined();
    expect(body.items[0]?.unusual).toBeUndefined();
    expect(body.items[0]?.crate).toBeUndefined();
    expect(body.items[0]?.killstreak).toBeUndefined();
    expect(body.items[0]?.cosmetics).toBeUndefined();
    expect(body.items[0]?.media).toBeUndefined();
    expect(body.items[0]?.trade).toBeUndefined();
    expect(body.items[0]?.crafting).toBeUndefined();
    expect(body.items[0]?.tool).toBeUndefined();
    expect(body.items[0]?.paint).toBeUndefined();
    expect(body.items[0]?.spells).toBeUndefined();
    expect(body.items[0]?.strangeRestrictions).toBeUndefined();
    expect(body.items[0]?.source).toBeUndefined();
    await app.close();
  });

  test("filters by URL args and paginates", async () => {
    const app = await createApp({ service: makeService("ok") });
    const response = await app.inject({
      method: "GET",
      url: "/v1/inventory/gaben?isUnusual=true&quality=Unusual&limit=1&offset=0",
      headers: { "x-steam-api-key": "key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.inventory.totalItems).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.identity?.itemId).toBe("2");
    expect(body.items[0]?.flags?.isUnusual).toBe(true);
    await app.close();
  });

  test("filters by crate series", async () => {
    const app = await createApp({ service: makeService("ok") });
    const response = await app.inject({
      method: "GET",
      url: "/v1/inventory/gaben?isCrate=true&crateSeries=30",
      headers: { "x-steam-api-key": "key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.inventory.totalItems).toBe(1);
    expect(body.items[0]?.identity?.itemId).toBe("3");
    expect(body.items[0]?.crate?.series).toBe(30);
    await app.close();
  });

  test("filters by assigned attributes", async () => {
    const app = await createApp({ service: makeService("ok") });
    const response = await app.inject({
      method: "GET",
      url: "/v1/inventory/gaben?attributeDefindex=143&attributeClass=employee&attributeDecodedValue=2023-03-03",
      headers: { "x-steam-api-key": "key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.inventory.totalItems).toBe(1);
    expect(body.items[0]?.identity?.itemId).toBe("2");
    expect(body.items[0]?.attributes?.[0]?.defindex).toBe(143);
    await app.close();
  });

  test.each([
    ["invalid_key", 401],
    ["private_inventory", 403],
    ["vanity_not_found", 404],
    ["rate_limited", 429],
    ["upstream_http_error", 502],
    ["response_parse_error", 500],
  ] as const)("maps %s to %d", async (kind, status) => {
    const app = await createApp({ service: makeService(kind) });
    const response = await app.inject({
      method: "GET",
      url: "/v1/inventory/gaben",
    });

    expect(response.statusCode).toBe(status);
    const body = response.json();
    expect(body.error.code).toBe(kind);
    await app.close();
  });
});
