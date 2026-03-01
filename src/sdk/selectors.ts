import type { NormalizedInventoryItem, NormalizedInventoryItemPublic } from "../normalize/types.js";

type AnyInventoryItem = NormalizedInventoryItem | NormalizedInventoryItemPublic;

export interface UnusualMetadataView {
  isUnusual: boolean;
  effectId: number | null;
  effectName: string | null;
  source: AnyInventoryItem["unusual"]["source"];
}

export interface KillstreakMetadataView {
  tier: number;
  tierName: string | null;
  effectId: number | null;
  effectName: string | null;
  sheenId: number | null;
  sheenName: string | null;
}

export interface CrateMetadataView {
  isCrate: boolean;
  isCommunityCrate: boolean;
  series: number | null;
  type: string | null;
}

export interface ActiveSpellsView {
  paint: string | null;
  footsteps: string | null;
  toggles: Array<"voices" | "pumpkinBombs" | "greenFlames" | "deathGhosts">;
  spellbookPages: string[];
}

export function isTradableItem(item: AnyInventoryItem): boolean {
  return item.flags.isTradable && !item.trade.cannotTrade;
}

export function isCraftableItem(item: AnyInventoryItem): boolean {
  return item.flags.isCraftable && !item.crafting.cannotCraft;
}

export function getUnusualMetadata(item: AnyInventoryItem): UnusualMetadataView {
  return {
    isUnusual: item.flags.isUnusual,
    effectId: item.unusual.effectId,
    effectName: item.unusual.effectName,
    source: item.unusual.source,
  };
}

export function getKillstreakMetadata(item: AnyInventoryItem): KillstreakMetadataView | null {
  const hasData =
    item.killstreak.tier > 0 ||
    item.killstreak.effectId !== null ||
    item.killstreak.sheenId !== null ||
    item.killstreak.tierName !== null;

  if (!hasData) {
    return null;
  }

  return {
    tier: item.killstreak.tier,
    tierName: item.killstreak.tierName,
    effectId: item.killstreak.effectId,
    effectName: item.killstreak.effectName,
    sheenId: item.killstreak.sheenId,
    sheenName: item.killstreak.sheenName,
  };
}

export function getCrateMetadata(item: AnyInventoryItem): CrateMetadataView | null {
  if (!item.flags.isCrate && item.crate.series === null && item.crate.type === null) {
    return null;
  }

  return {
    isCrate: item.flags.isCrate,
    isCommunityCrate: item.flags.isCommunityCrate,
    series: item.crate.series,
    type: item.crate.type,
  };
}

export function getActiveSpells(item: AnyInventoryItem): ActiveSpellsView | null {
  const toggles: Array<"voices" | "pumpkinBombs" | "greenFlames" | "deathGhosts"> = [];
  if (item.spells.voices) {
    toggles.push("voices");
  }
  if (item.spells.pumpkinBombs) {
    toggles.push("pumpkinBombs");
  }
  if (item.spells.greenFlames) {
    toggles.push("greenFlames");
  }
  if (item.spells.deathGhosts) {
    toggles.push("deathGhosts");
  }

  const hasData =
    item.spells.paint !== null ||
    item.spells.footsteps !== null ||
    toggles.length > 0 ||
    item.spells.spellbookPages.length > 0;

  if (!hasData) {
    return null;
  }

  return {
    paint: item.spells.paint,
    footsteps: item.spells.footsteps,
    toggles,
    spellbookPages: item.spells.spellbookPages,
  };
}

export function getPrimaryImageUrl(item: AnyInventoryItem): string | null {
  return item.media.imageUrlLarge ?? item.media.imageUrl ?? null;
}
