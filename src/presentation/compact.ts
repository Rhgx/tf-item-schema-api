import type {
  NormalizedInventoryItem,
  NormalizedInventoryItemPublic,
} from "../normalize/types.js";

type AnyInventoryItem = NormalizedInventoryItem | NormalizedInventoryItemPublic;

function isStrangeEmpty(item: AnyInventoryItem): boolean {
  return (
    item.strange.primaryCounter === null &&
    item.strange.primaryRank === null &&
    item.strange.counters.length === 0 &&
    item.strange.parts.length === 0 &&
    item.strange.counterRanks.length === 0
  );
}

function isUnusualEmpty(item: AnyInventoryItem): boolean {
  return (
    item.unusual.effectId === null &&
    item.unusual.effectName === null &&
    item.unusual.source === null
  );
}

function isCrateEmpty(item: AnyInventoryItem): boolean {
  return (
    item.crate.series === null &&
    item.crate.type === null &&
    (item.crate.possibleUnusualHints?.length ?? 0) === 0 &&
    item.crate.possibleContentsCollection == null &&
    (item.crate.possibleContentsItems?.length ?? 0) === 0
  );
}

function isKillstreakEmpty(item: AnyInventoryItem): boolean {
  return (
    item.killstreak.tier <= 0 &&
    item.killstreak.tierName === null &&
    item.killstreak.effectId === null &&
    item.killstreak.effectName === null &&
    item.killstreak.sheenId === null &&
    item.killstreak.sheenName === null
  );
}

function isCosmeticsEmpty(item: AnyInventoryItem): boolean {
  return item.cosmetics.paintkitId === null && item.cosmetics.paintkitName === null;
}

function isMediaEmpty(item: AnyInventoryItem): boolean {
  return (
    item.media.imageUrl === null &&
    item.media.imageUrlLarge === null &&
    item.media.wear === null &&
    item.media.tags.length === 0
  );
}

function isSourceEmpty(item: AnyInventoryItem): boolean {
  return (
    item.source.originalItemId === null &&
    item.source.quantity === 1 &&
    item.source.originId === null &&
    item.source.originName === null &&
    item.source.customDescription === null &&
    item.source.style === null &&
    item.source.accountInfo === null &&
    item.source.equipped.length === 0 &&
    item.source.containedItem === null
  );
}

function isTradeEmpty(item: AnyInventoryItem): boolean {
  return (
    item.trade.alwaysTradable === false &&
    item.trade.cannotTrade === false &&
    item.trade.isMarketable === null &&
    item.trade.tradableAfter === null
  );
}

function isCraftingEmpty(item: AnyInventoryItem): boolean {
  return (
    item.crafting.neverCraftable === false &&
    item.crafting.cannotCraft === false &&
    item.crafting.cannotGiftWrap === false &&
    item.crafting.toolNeedsGiftWrap === false
  );
}

function isToolEmpty(item: AnyInventoryItem): boolean {
  return (
    item.tool.targetDefindex === null &&
    item.tool.targetItemName === null &&
    item.tool.recipeComponents.length === 0 &&
    item.tool.unusualifierTemplate === null
  );
}

function isPaintEmpty(item: AnyInventoryItem): boolean {
  return (
    item.paint.rgbPrimary === null &&
    item.paint.rgbSecondary === null &&
    item.paint.primaryName === null &&
    item.paint.secondaryName === null &&
    item.paint.styleOverride === null &&
    item.paint.textureWear === null &&
    item.paint.textureWearDefault === null &&
    item.paint.seedLow === null &&
    item.paint.seedHigh === null
  );
}

function isSpellsEmpty(item: AnyInventoryItem): boolean {
  return (
    item.spells.paint === null &&
    item.spells.footsteps === null &&
    item.spells.voices === false &&
    item.spells.pumpkinBombs === false &&
    item.spells.greenFlames === false &&
    item.spells.deathGhosts === false &&
    item.spells.spellbookPages.length === 0
  );
}

function isStrangeRestrictionsEmpty(item: AnyInventoryItem): boolean {
  return (
    item.strangeRestrictions.selector === null &&
    item.strangeRestrictions.newCounterId === null &&
    item.strangeRestrictions.entries.length === 0
  );
}

function isSchemaEmpty(item: AnyInventoryItem): boolean {
  return (
    item.schema.usedByClasses.length === 0 &&
    Object.keys(item.schema.perClassLoadoutSlots).length === 0 &&
    item.schema.styles.length === 0 &&
    item.schema.tool === null &&
    item.schema.capabilities.length === 0
  );
}

export function compactInventoryItems(items: AnyInventoryItem[]): Record<string, unknown>[] {
  return items.map((item) => {
    const compact: Record<string, unknown> = { ...item };

    if (isStrangeEmpty(item)) {
      delete compact.strange;
    }
    if (isUnusualEmpty(item)) {
      delete compact.unusual;
    }
    if (isCrateEmpty(item)) {
      delete compact.crate;
    }
    if (isKillstreakEmpty(item)) {
      delete compact.killstreak;
    }
    if (isCosmeticsEmpty(item)) {
      delete compact.cosmetics;
    }
    if (isMediaEmpty(item)) {
      delete compact.media;
    }
    if (isSourceEmpty(item)) {
      delete compact.source;
    }
    if (isTradeEmpty(item)) {
      delete compact.trade;
    }
    if (isCraftingEmpty(item)) {
      delete compact.crafting;
    }
    if (isToolEmpty(item)) {
      delete compact.tool;
    }
    if (isPaintEmpty(item)) {
      delete compact.paint;
    }
    if (isSpellsEmpty(item)) {
      delete compact.spells;
    }
    if (isStrangeRestrictionsEmpty(item)) {
      delete compact.strangeRestrictions;
    }
    if (isSchemaEmpty(item)) {
      delete compact.schema;
    }
    if (item.attributes.length === 0) {
      delete compact.attributes;
    }

    return compact;
  });
}
