export const TF2_ATTRIBUTE_DEFINDEX = {
  trade: {
    cannotTrade: 153,
    alwaysTradable: 195,
    tradableAfter: 211,
    isMarketable: 2028,
  },
  crafting: {
    neverCraftable: 449,
    cannotGiftWrap: 785,
    toolNeedsGiftWrap: 786,
  },
  tool: {
    targetDefindex: 2012,
    unusualifierTemplate: 805,
    recipeComponents: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008],
  },
  paint: {
    rgbPrimary: 142,
    rgbSecondary: 261,
    styleOverride: 542,
    textureWear: 725,
    textureWearDefault: 749,
    seedLow: 866,
    seedHigh: 867,
  },
  spells: {
    paint: 1004,
    footsteps: 1005,
    voices: 1006,
    pumpkinBombs: 1007,
    greenFlames: 1008,
    deathGhosts: 1009,
    spellbookPages: [2016, 2017, 2018, 2019, 2020],
  },
  strangeRestrictions: {
    selector: 468,
    newCounterId: 385,
    item: {
      type: [454, 456, 496],
      value: [455, 457, 497],
    },
    user: {
      type: [458, 460, 462],
      value: [459, 461, 463],
    },
  },
  crate: {
    series: 187,
  },
  killstreak: {
    effect: 2013,
    sheen: 2014,
  },
  unusual: {
    particleLegacy: 134,
  },
  naming: {
    customName: 500,
  },
  integerCounters: [214, 294, 379, 381, 383, 494],
} as const;

export type Tf2AttributeDefindexMap = typeof TF2_ATTRIBUTE_DEFINDEX;
