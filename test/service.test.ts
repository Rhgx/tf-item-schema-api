import { describe, expect, test } from "vitest";
import type { CommunityItemMetadata, InventoryResponse } from "../src/normalize/types.js";
import type { SchemaCatalog } from "../src/schema/catalog.js";
import { InventoryService } from "../src/service/inventoryService.js";
import { SteamApiError } from "../src/steam/errors.js";

const schema: SchemaCatalog = {
  fetchedAt: 1,
  itemByDefindex: {
    205: {
      defindex: 205,
      displayName: "Rocket Launcher",
      itemClass: "tf_weapon_rocketlauncher",
      craftClass: "weapon",
      itemSlot: "primary",
      imageUrl: "https://example.test/image.png",
      imageUrlLarge: "https://example.test/image-large.png",
      usedByClasses: [],
      perClassLoadoutSlots: {},
      styles: [],
      tool: null,
      capabilities: [],
    },
    5022: {
      defindex: 5022,
      displayName: "Mann Co. Supply Crate",
      itemClass: "supply_crate",
      craftClass: "supply_crate",
      itemSlot: null,
      imageUrl: "https://example.test/crate.png",
      imageUrlLarge: "https://example.test/crate-large.png",
      usedByClasses: [],
      perClassLoadoutSlots: {},
      styles: [],
      tool: null,
      capabilities: [],
    },
    9100: {
      defindex: 9100,
      displayName: "Cosmetic Case",
      itemClass: "tool",
      craftClass: "supply_crate",
      itemSlot: null,
      imageUrl: "https://example.test/case.png",
      imageUrlLarge: "https://example.test/case-large.png",
      usedByClasses: [],
      perClassLoadoutSlots: {},
      styles: [],
      tool: null,
      capabilities: [],
    },
  },
  attributeByDefindex: {},
  attributeNameByDefindex: {},
  scoreTypeNameById: {},
  particleEffectNameById: {},
  qualityNameById: {
    11: "Strange",
  },
  originNameById: {},
  stringLookupsByTable: {},
  strangeRankSets: [],
};

const playerItems: InventoryResponse["raw"]["playerItemsResult"] = {
  status: 1,
  numBackpackSlots: 3000,
  items: [{ id: "1", defindex: 205, quality: 11, attributes: [] }],
};

const communityByAsset = new Map<string, CommunityItemMetadata>([
  [
    "1",
    {
      assetId: "1",
      name: "Strange Rocket Launcher",
      marketHashName: "Strange Rocket Launcher",
      type: "Strange Rocket Launcher - Kills: 10",
      iconUrl: "https://community.akamai.steamstatic.com/economy/image/test-icon",
      iconUrlLarge: "https://community.akamai.steamstatic.com/economy/image/test-icon-large",
      tags: [{ category: "Quality", localizedTagName: "Strange", color: null }],
      descriptions: [],
    },
  ],
]);

describe("InventoryService", () => {
  test("returns normalized inventory payload", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return playerItems;
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return schema;
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return communityByAsset;
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    expect(response.target.steamId).toBe("76561198012345678");
    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.names.display).toBe("Strange Rocket Launcher");
    expect(response.items[0]?.quality.grade).toBeNull();
    expect(response.items[0]?.classification.kind).toBe("weapon");
    expect(response.items[0]?.flags.isCrate).toBe(false);
    expect(response.items[0]?.flags.isCommunityCrate).toBe(false);
    expect(response.items[0]?.crate.series).toBeNull();
    expect(response.items[0]?.crate.type).toBeNull();
    expect(response.items[0]?.media.imageUrl).toBe("https://community.akamai.steamstatic.com/economy/image/test-icon");
    expect(response.items[0]?.media.imageUrlLarge).toBe(
      "https://community.akamai.steamstatic.com/economy/image/test-icon-large",
    );
    expect(response.items[0]?.killstreak.tier).toBe(0);
    expect(response.items[0]?.killstreak.effectName).toBeNull();
    expect(response.items[0]?.trade.cannotTrade).toBe(false);
    expect(response.items[0]?.crafting.cannotCraft).toBe(false);
    expect(response.items[0]?.tool.targetDefindex).toBeNull();
    expect(response.items[0]?.paint.rgbPrimary).toBeNull();
    expect(response.items[0]?.paint.primaryName).toBeNull();
    expect(response.items[0]?.paint.secondaryName).toBeNull();
    expect(response.items[0]?.spells.paint).toBeNull();
    expect(response.items[0]?.strangeRestrictions.entries).toEqual([]);
    expect(response.items[0]?.source.quantity).toBe(1);
    expect(response.items[0]?.schema.usedByClasses).toEqual([]);
    expect(response.raw.playerItemsResult.items).toHaveLength(1);
  });

  test("maps origin names, schema capabilities, and lookup-decoded attributes", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return {
            status: 1,
            numBackpackSlots: 3000,
            items: [
              {
                id: "1",
                defindex: 205,
                quality: 11,
                origin: 3,
                quantity: 2,
                style: 1,
                original_id: "0",
                attributes: [{ defindex: 9000, value: 2002, float_value: 2002 }],
              },
            ],
          };
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return {
            ...schema,
            itemByDefindex: {
              ...schema.itemByDefindex,
              205: {
                ...schema.itemByDefindex[205],
                usedByClasses: ["Soldier"],
                perClassLoadoutSlots: { Soldier: ["primary"] },
                styles: [{ id: 1, name: "Alt Style", selectable: true }],
                tool: { type: "paint_can" },
                capabilities: ["paintable", "nameable"],
              },
            },
            attributeByDefindex: {
              9000: {
                defindex: 9000,
                name: "killstreak effect",
                attributeClass: null,
                storedAsInteger: true,
                lookupTable: "killstreakeffect",
                descriptionFormat: null,
              },
            },
            attributeNameByDefindex: {
              9000: "killstreak effect",
            },
            originNameById: {
              3: "Crafted",
            },
            stringLookupsByTable: {
              killstreakeffect: {
                2002: "Fire Horns",
              },
            },
          };
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return communityByAsset;
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    expect(response.items[0]?.source.originId).toBe(3);
    expect(response.items[0]?.source.originName).toBe("Crafted");
    expect(response.items[0]?.source.quantity).toBe(2);
    expect(response.items[0]?.schema.capabilities).toContain("paintable");
    expect(response.items[0]?.schema.usedByClasses).toEqual(["Soldier"]);
    expect(response.items[0]?.attributes[0]?.decodedValue).toBe("Fire Horns");
    expect(response.items[0]?.attributes[0]?.lookupTable).toBe("killstreakeffect");
  });

  test("parses decorated quality grade from community metadata tags/type", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return {
            status: 1,
            numBackpackSlots: 3000,
            items: [{ id: "1", defindex: 205, quality: 6, attributes: [] }],
          };
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return {
            ...schema,
            qualityNameById: {
              ...schema.qualityNameById,
              6: "Unique",
            },
          };
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return new Map<string, CommunityItemMetadata>([
            [
              "1",
              {
                assetId: "1",
                name: "Sand Cannon Rocket Launcher",
                marketHashName: "Sand Cannon Rocket Launcher (Field-Tested)",
                type: "Mercenary Grade Rocket Launcher",
                iconUrl: null,
                iconUrlLarge: null,
                tags: [
                  { category: "Quality", localizedTagName: "Unique", color: null },
                  { category: "Rarity", localizedTagName: "Mercenary Grade", color: null },
                ],
                descriptions: [],
              },
            ],
          ]);
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    expect(response.items[0]?.quality.name).toBe("Unique");
    expect(response.items[0]?.quality.grade).toBe("Mercenary Grade");
  });

  test("uses schema decorated quality name for unused war paints", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return {
            status: 1,
            numBackpackSlots: 3000,
            items: [{ id: "wp1", defindex: 16391, quality: 15, attributes: [] }],
          };
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return {
            ...schema,
            itemByDefindex: {
              ...schema.itemByDefindex,
              16391: {
                defindex: 16391,
                displayName: "War Paint",
                itemClass: "tool",
                craftClass: null,
                itemSlot: null,
                imageUrl: null,
                imageUrlLarge: null,
                usedByClasses: [],
                perClassLoadoutSlots: {},
                styles: [],
                tool: { type: "paintkit" },
                capabilities: [],
              },
            },
            qualityNameById: {
              ...schema.qualityNameById,
              15: "Decorated",
            },
          };
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return new Map<string, CommunityItemMetadata>([
            [
              "wp1",
              {
                assetId: "wp1",
                name: "Smissmas Sweater War Paint",
                marketHashName: "Smissmas Sweater War Paint (Factory New)",
                type: "Commando Grade War Paint",
                iconUrl: null,
                iconUrlLarge: null,
                tags: [
                  { category: "Quality", localizedTagName: "Decorated Weapon", color: null },
                  { category: "Type", localizedTagName: "War Paint", color: null },
                  { category: "Rarity", localizedTagName: "Commando", color: null },
                ],
                descriptions: [],
              },
            ],
          ]);
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    expect(response.items[0]?.quality.id).toBe(15);
    expect(response.items[0]?.quality.name).toBe("Decorated");
    expect(response.items[0]?.quality.grade).toBe("Commando Grade");
  });

  test("parses trade/crafting/tool/paint/spells/strange-restriction metadata", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return {
            status: 1,
            numBackpackSlots: 3000,
            items: [
              {
                id: "meta1",
                defindex: 205,
                quality: 6,
                flag_cannot_trade: 1,
                flag_cannot_craft: 1,
                attributes: [
                  { defindex: 2028, value: 1, float_value: 1 },
                  { defindex: 211, value: 1742886000, float_value: 1742886000 },
                  { defindex: 449, value: 1, float_value: 1 },
                  { defindex: 785, value: 1, float_value: 1 },
                  { defindex: 786, value: 1, float_value: 1 },
                  { defindex: 2012, value: 205, float_value: 205 },
                  { defindex: 2000, value: 406, float_value: 406 },
                  { defindex: 2001, value: 132, float_value: 132 },
                  { defindex: 805, value: "SomeTemplateName" },
                  { defindex: 142, value: 7511618, float_value: 7511618 },
                  { defindex: 261, value: 3100495, float_value: 3100495 },
                  { defindex: 542, value: 2, float_value: 2 },
                  { defindex: 725, value: 1056964608, float_value: 0.5 },
                  { defindex: 749, value: 1045220557, float_value: 0.2 },
                  { defindex: 866, value: 4281512587, float_value: 4281512587 },
                  { defindex: 867, value: 1, float_value: 1 },
                  { defindex: 1004, value: 2, float_value: 2 },
                  { defindex: 1005, value: 8421376, float_value: 8421376 },
                  { defindex: 1006, value: 1, float_value: 1 },
                  { defindex: 1007, value: 1, float_value: 1 },
                  { defindex: 1008, value: 1, float_value: 1 },
                  { defindex: 1009, value: 1, float_value: 1 },
                  { defindex: 2016, value: 1, float_value: 1 },
                  { defindex: 468, value: 1, float_value: 1 },
                  { defindex: 385, value: 61, float_value: 61 },
                  { defindex: 454, value: 2, float_value: 2 },
                  { defindex: 455, value: 10, float_value: 10 },
                ],
              },
            ],
          };
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return {
            ...schema,
            itemByDefindex: {
              ...schema.itemByDefindex,
              132: {
                defindex: 132,
                displayName: "Eyelander",
                itemClass: "tf_weapon_sword",
                craftClass: "weapon",
                itemSlot: "melee",
                imageUrl: null,
                imageUrlLarge: null,
                usedByClasses: ["Demoman"],
                perClassLoadoutSlots: { Demoman: ["melee"] },
                styles: [],
                tool: null,
                capabilities: [],
              },
            },
            attributeByDefindex: {
              1004: {
                defindex: 1004,
                name: "SPELL: set item tint RGB",
                attributeClass: "set_item_tint_rgb_override",
                storedAsInteger: true,
                lookupTable: "SPELL: set item tint RGB",
                descriptionFormat: "value_is_from_lookup_table",
              },
              1005: {
                defindex: 1005,
                name: "SPELL: set Halloween footstep type",
                attributeClass: "halloween_footstep_type",
                storedAsInteger: true,
                lookupTable: "SPELL: set Halloween footstep type",
                descriptionFormat: "value_is_from_lookup_table",
              },
            },
            attributeNameByDefindex: {
              1004: "SPELL: set item tint RGB",
              1005: "SPELL: set Halloween footstep type",
            },
            stringLookupsByTable: {
              "SPELL: set item tint RGB": {
                2: "#TF_HalloweenSpell_Paint_1_Attr",
              },
              "SPELL: set Halloween footstep type": {
                8421376: "#TF_HalloweenSpell_Footprints_8421376_Attr",
              },
            },
          };
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return new Map();
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    const item = response.items[0];
    expect(item?.trade.cannotTrade).toBe(true);
    expect(item?.trade.isMarketable).toBe(true);
    expect(item?.trade.tradableAfter).toBe(1742886000);
    expect(item?.crafting.neverCraftable).toBe(true);
    expect(item?.crafting.cannotCraft).toBe(true);
    expect(item?.crafting.cannotGiftWrap).toBe(true);
    expect(item?.crafting.toolNeedsGiftWrap).toBe(true);
    expect(item?.tool.targetDefindex).toBe(205);
    expect(item?.tool.targetItemName).toBe("Rocket Launcher");
    expect(item?.tool.recipeComponents).toEqual([406, 132]);
    expect(item?.tool.unusualifierTemplate).toBe("SomeTemplateName");
    expect(item?.paint.rgbPrimary).toBe("#729E42");
    expect(item?.paint.rgbSecondary).toBe("#2F4F4F");
    expect(item?.paint.primaryName).toBe("Indubitably Green");
    expect(item?.paint.secondaryName).toBe("A Color Similar to Slate");
    expect(item?.paint.styleOverride).toBe(2);
    expect(item?.spells.paint).toBe("Putrescent Pigmentation");
    expect(item?.spells.footsteps).toBe("Gangreen Footprints");
    expect(item?.spells.voices).toBe(true);
    expect(item?.spells.spellbookPages).toContain("Spellbook Page 2016");
    const textureWearAttr = item?.attributes.find((entry) => entry.defindex === 725);
    expect(textureWearAttr?.lookupTable).toBeNull();
    expect(textureWearAttr?.decodedValue).toBeNull();
    expect(item?.strangeRestrictions.selector).toBe(1);
    expect(item?.strangeRestrictions.newCounterId).toBe(61);
    expect(item?.strangeRestrictions.entries).toEqual([
      { scope: "item", slot: 1, type: 2, value: 10 },
    ]);
  });

  test("decodes killstreaker and sheen via description_format fallback", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return {
            status: 1,
            numBackpackSlots: 3000,
            items: [
              {
                id: "ks1",
                defindex: 205,
                quality: 6,
                attributes: [
                  { defindex: 2013, value: 1157267456, float_value: 2004 },
                  { defindex: 2014, value: 1084227584, float_value: 5 },
                  { defindex: 2025, value: 1077936128, float_value: 3 },
                ],
              },
            ],
          };
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return {
            ...schema,
            attributeByDefindex: {
              2013: {
                defindex: 2013,
                name: "killstreak effect",
                attributeClass: "killstreak_effect",
                storedAsInteger: false,
                lookupTable: null,
                descriptionFormat: "value_is_killstreakeffect_index",
              },
              2014: {
                defindex: 2014,
                name: "killstreak idleeffect",
                attributeClass: "killstreak_idleeffect",
                storedAsInteger: false,
                lookupTable: null,
                descriptionFormat: "value_is_killstreak_idleeffect_index",
              },
              2025: {
                defindex: 2025,
                name: "killstreak tier",
                attributeClass: "killstreak_tier",
                storedAsInteger: false,
                lookupTable: null,
                descriptionFormat: null,
              },
            },
            attributeNameByDefindex: {
              2013: "killstreak effect",
              2014: "killstreak idleeffect",
              2025: "killstreak tier",
            },
          };
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return new Map();
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    const effect = response.items[0]?.attributes.find((entry) => entry.defindex === 2013);
    const sheen = response.items[0]?.attributes.find((entry) => entry.defindex === 2014);
    expect(response.items[0]?.killstreak.tier).toBe(3);
    expect(response.items[0]?.killstreak.tierName).toBe("Professional Killstreak");
    expect(response.items[0]?.killstreak.effectId).toBe(2004);
    expect(response.items[0]?.killstreak.effectName).toBe("Tornado");
    expect(response.items[0]?.killstreak.sheenId).toBe(5);
    expect(response.items[0]?.killstreak.sheenName).toBe("Agonizing Emerald");
    expect(effect?.lookupTable).toBe("killstreakeffect");
    expect(effect?.decodedValue).toBe("Tornado");
    expect(sheen?.lookupTable).toBe("killstreak_idleeffect");
    expect(sheen?.decodedValue).toBe("Agonizing Emerald");
  });

  test("throws invalid_key when api key is missing", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return playerItems;
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return schema;
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return communityByAsset;
        },
      },
    });

    await expect(service.getInventory({ target: "gaben", language: "en" })).rejects.toMatchObject({
      kind: "invalid_key",
    });
  });

  test("falls back to schema image when community metadata missing", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return playerItems;
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return schema;
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return new Map();
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    expect(response.items[0]?.media.imageUrl).toBe("https://example.test/image.png");
    expect(response.items[0]?.media.imageUrlLarge).toBe("https://example.test/image-large.png");
  });

  test("parses supply crate series from attribute 187", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return {
            status: 1,
            numBackpackSlots: 3000,
            items: [
              {
                id: "crate1",
                defindex: 5022,
                quality: 6,
                attributes: [{ defindex: 187, value: 30, float_value: 30 }],
              },
            ],
          };
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return schema;
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return new Map<string, CommunityItemMetadata>([
            [
              "crate1",
              {
                assetId: "crate1",
                name: "Mann Co. Supply Crate",
                marketHashName: "Mann Co. Supply Crate",
                type: "Supply Crate",
                iconUrl: null,
                iconUrlLarge: null,
                tags: [{ category: "Type", localizedTagName: "Supply Crate", color: null }],
                descriptions: [],
              },
            ],
          ]);
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    expect(response.items[0]?.flags.isCrate).toBe(true);
    expect(response.items[0]?.flags.isCommunityCrate).toBe(false);
    expect(response.items[0]?.crate.series).toBe(30);
    expect(response.items[0]?.crate.type).toContain("Crate");
  });

  test("parses community crate series from description fallback", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return {
            status: 1,
            numBackpackSlots: 3000,
            items: [{ id: "case1", defindex: 9100, quality: 6, attributes: [] }],
          };
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return schema;
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return new Map<string, CommunityItemMetadata>([
            [
              "case1",
              {
                assetId: "case1",
                name: "Winter 2024 Cosmetic Case",
                marketHashName: "Winter 2024 Cosmetic Case",
                type: "Cosmetic Case",
                iconUrl: null,
                iconUrlLarge: null,
                tags: [{ category: "Type", localizedTagName: "Cosmetic Case", color: null }],
                descriptions: [{ type: "html", value: "Series #124", color: null, label: null }],
              },
            ],
          ]);
        },
      },
    });

    const response = await service.getInventory({
      target: "gaben",
      apiKey: "key",
      language: "en",
      apiKeySource: "sdk",
    });

    expect(response.items[0]?.flags.isCrate).toBe(true);
    expect(response.items[0]?.flags.isCommunityCrate).toBe(true);
    expect(response.items[0]?.crate.series).toBe(124);
    expect(response.items[0]?.crate.type).toBe("Cosmetic Case");
  });

  test("passes through private inventory errors", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          throw new SteamApiError("private_inventory", "private");
        },
        async resolveVanityUrl() {
          return "76561198012345678";
        },
      },
      schemaCache: {
        async getCatalog() {
          return schema;
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return communityByAsset;
        },
      },
    });

    await expect(service.getInventory({ target: "gaben", apiKey: "key" })).rejects.toMatchObject({
      kind: "private_inventory",
    });
  });

  test("passes through vanity resolution errors", async () => {
    const service = new InventoryService({
      steamApiClient: {
        async getPlayerItems() {
          return playerItems;
        },
        async resolveVanityUrl() {
          throw new SteamApiError("vanity_not_found", "missing");
        },
      },
      schemaCache: {
        async getCatalog() {
          return schema;
        },
      },
      communityInventoryClient: {
        async getItemMetadataByAssetId() {
          return communityByAsset;
        },
      },
    });

    await expect(service.getInventory({ target: "gaben", apiKey: "key" })).rejects.toMatchObject({
      kind: "vanity_not_found",
    });
  });
});
