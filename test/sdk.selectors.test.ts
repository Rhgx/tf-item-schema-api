import { describe, expect, test } from "vitest";
import { TF2_ATTRIBUTE_DEFINDEX } from "../src/sdk/constants.js";
import {
  getActiveSpells,
  getCrateMetadata,
  getKillstreakMetadata,
  getPrimaryImageUrl,
  getUnusualMetadata,
  isCraftableItem,
  isTradableItem,
} from "../src/sdk/selectors.js";
import type { NormalizedInventoryItem } from "../src/normalize/types.js";

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

describe("SDK constants and selectors", () => {
  test("exports stable defindex constants", () => {
    expect(TF2_ATTRIBUTE_DEFINDEX.trade.cannotTrade).toBe(153);
    expect(TF2_ATTRIBUTE_DEFINDEX.crafting.neverCraftable).toBe(449);
    expect(TF2_ATTRIBUTE_DEFINDEX.crate.series).toBe(187);
    expect(TF2_ATTRIBUTE_DEFINDEX.tool.recipeComponents).toHaveLength(9);
  });

  test("extracts high-level metadata with selector helpers", () => {
    const item = makeItem({
      flags: {
        isStrange: false,
        isUnusual: true,
        isCrate: true,
        isCommunityCrate: false,
        isFestivized: false,
        isCraftable: false,
        isTradable: false,
      },
      unusual: {
        effectId: 17,
        effectName: "Sunbeams",
        source: "attribute",
      },
      crate: {
        series: 30,
        type: "Mann Co. Supply Crate",
      },
      killstreak: {
        tier: 3,
        tierName: "Professional Killstreak",
        effectId: 2002,
        effectName: "Fire Horns",
        effectLookupTable: "killstreakeffect",
        sheenId: 5,
        sheenName: "Agonizing Emerald",
        sheenLookupTable: "killstreak_idleeffect",
      },
      trade: {
        alwaysTradable: false,
        cannotTrade: true,
        isMarketable: false,
        tradableAfter: 0,
      },
      crafting: {
        neverCraftable: false,
        cannotCraft: true,
        cannotGiftWrap: false,
        toolNeedsGiftWrap: false,
      },
      spells: {
        paint: "Die Job",
        footsteps: null,
        voices: true,
        pumpkinBombs: false,
        greenFlames: true,
        deathGhosts: false,
        spellbookPages: ["Spellbook Page 2016"],
      },
      media: {
        imageUrl: "https://example.test/image.png",
        imageUrlLarge: "https://example.test/image-large.png",
        wear: null,
        tags: [],
      },
    });

    expect(isTradableItem(item)).toBe(false);
    expect(isCraftableItem(item)).toBe(false);
    expect(getUnusualMetadata(item).effectName).toBe("Sunbeams");
    expect(getCrateMetadata(item)?.series).toBe(30);
    expect(getKillstreakMetadata(item)?.tierName).toBe("Professional Killstreak");
    expect(getActiveSpells(item)?.toggles).toEqual(["voices", "greenFlames"]);
    expect(getPrimaryImageUrl(item)).toBe("https://example.test/image-large.png");
  });
});
