import type { SchemaCatalog } from "../schema/catalog.js";
import {
  buildDisplayName,
  getKillstreakTierLabel,
  inferPaintkitNameFromMetadata,
  resolveCraftable,
  resolveCustomName,
  resolveIsFestivized,
  resolveKillstreakTier,
  resolvePaintkitId,
  resolveQualityGrade,
  resolveQualityName,
  resolveTradable,
  resolveWear,
} from "./naming.js";
import { resolveCrateData } from "./crates.js";
import { extractStrangeCounters, getPrimaryCounter, getStrangeParts, resolveStrangeRankMetadata } from "./strange.js";
import { resolveTradeData } from "./trade.js";
import { resolveCraftingData } from "./crafting.js";
import { resolveToolData } from "./tools.js";
import { resolvePaintData } from "./paint.js";
import { resolveSpellsData } from "./spells.js";
import { resolveStrangeRestrictionsData } from "./strangeRestrictions.js";
import type {
  CommunityItemMetadata,
  ItemKind,
  NormalizedAttribute,
  NormalizedInventoryItem,
  RawInventoryItem,
} from "./types.js";
import { resolveUnusualData } from "./unusual.js";

const KNOWN_INTEGER_COUNTER_DEFINDEXES = new Set([214, 294, 379, 381, 383, 494]);
const FALLBACK_KILLSTREAK_EFFECTS: Record<number, string> = {
  2002: "Fire Horns",
  2003: "Cerebral Discharge",
  2004: "Tornado",
  2005: "Flames",
  2006: "Singularity",
  2007: "Incinerator",
  2008: "Hypno-Beam",
};
const FALLBACK_KILLSTREAK_SHEENS: Record<number, string> = {
  1: "Team Shine",
  2: "Deadly Daffodil",
  3: "Manndarin",
  4: "Mean Green",
  5: "Agonizing Emerald",
  6: "Villainous Violet",
  7: "Hot Rod",
};
const CLASS_NAME_BY_ID: Record<number, string> = {
  0: "All Classes",
  1: "Scout",
  2: "Sniper",
  3: "Soldier",
  4: "Demoman",
  5: "Medic",
  6: "Heavy",
  7: "Pyro",
  8: "Spy",
  9: "Engineer",
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeAttributeValue(
  defindex: number,
  floatValueRaw: unknown,
  rawValue: unknown,
  schema: SchemaCatalog,
): number {
  const meta = schema.attributeByDefindex[defindex];
  const floatValue = Number(floatValueRaw);
  const rawNumeric = Number(rawValue);

  if (meta?.storedAsInteger && Number.isFinite(rawNumeric)) {
    return Math.trunc(rawNumeric);
  }

  if (KNOWN_INTEGER_COUNTER_DEFINDEXES.has(defindex) && Number.isFinite(rawNumeric)) {
    return Math.trunc(rawNumeric);
  }

  if (Number.isFinite(floatValue)) {
    return floatValue;
  }

  if (Number.isFinite(rawNumeric)) {
    return rawNumeric;
  }

  return 0;
}

function normalizeAttributes(raw: RawInventoryItem, schema: SchemaCatalog): NormalizedAttribute[] {
  const rawAttributes = Array.isArray(raw.attributes) ? raw.attributes : [];

  return rawAttributes.map((attribute) => {
    const defindex = Number(attribute.defindex);
    const numericValue = normalizeAttributeValue(defindex, attribute.float_value, attribute.value, schema);
    const floatValue = Number(attribute.float_value ?? 0);
    const attrMeta = schema.attributeByDefindex[defindex];
    const { decodedValue, lookupTable } = resolveAttributeLookupValue({
      defindex,
      value: numericValue,
      rawValue: attribute.value,
      schema,
    });

    return {
      defindex,
      name: schema.attributeNameByDefindex[defindex] ?? null,
      attributeClass: attrMeta?.attributeClass ?? null,
      storedAsInteger: Boolean(attrMeta?.storedAsInteger),
      lookupTable,
      decodedValue,
      floatValue: Number.isFinite(floatValue) ? floatValue : numericValue,
      value: numericValue,
      rawValue: attribute.value,
    };
  });
}

function resolveAttributeLookupValue(args: {
  defindex: number;
  value: number;
  rawValue: unknown;
  schema: SchemaCatalog;
}): { lookupTable: string | null; decodedValue: string | null } {
  const meta = args.schema.attributeByDefindex[args.defindex];
  const roundedValue = Number.isFinite(args.value) ? Math.round(args.value) : null;
  const lookupTable = meta?.lookupTable ?? null;

  if (lookupTable && roundedValue !== null) {
    const table = args.schema.stringLookupsByTable[lookupTable];
    const decoded = table?.[roundedValue];
    if (decoded) {
      return { lookupTable, decodedValue: decoded };
    }
  }

  const special = resolveSpecialLookupValue(meta?.descriptionFormat ?? null, roundedValue);
  if (special) {
    return special;
  }

  const defindexDecoded = resolveDefindexDecodedValue(args.defindex, roundedValue);
  if (defindexDecoded) {
    return { lookupTable, decodedValue: defindexDecoded };
  }

  if (roundedValue === null) {
    return { lookupTable, decodedValue: null };
  }

  // Do not do a global "scan every lookup table by rounded value" fallback.
  // It causes false positives (for example war paint texture wear values like 0/0.2
  // getting decoded as unrelated spell strings). Only decode when attribute metadata
  // explicitly points to a lookup table or special description-format handlers above.
  return { lookupTable, decodedValue: null };
}

function resolveDefindexDecodedValue(defindex: number, value: number | null): string | null {
  if (value === null) {
    return null;
  }

  if (defindex === 143) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return null;
    }
    const date = new Date(seconds * 1000);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().slice(0, 19);
  }

  return null;
}

function resolveSpecialLookupValue(
  descriptionFormat: string | null,
  value: number | null,
): { lookupTable: string | null; decodedValue: string | null } | null {
  if (value === null || !descriptionFormat) {
    return null;
  }

  const normalized = descriptionFormat.trim().toLowerCase();
  if (normalized === "value_is_killstreakeffect_index") {
    return {
      lookupTable: "killstreakeffect",
      decodedValue: FALLBACK_KILLSTREAK_EFFECTS[value] ?? null,
    };
  }

  if (normalized === "value_is_killstreak_idleeffect_index") {
    return {
      lookupTable: "killstreak_idleeffect",
      decodedValue: FALLBACK_KILLSTREAK_SHEENS[value] ?? null,
    };
  }

  return null;
}

function normalizeEquipped(raw: RawInventoryItem): Array<{ classId: number | null; className: string | null; slot: number | null }> {
  const equipped = Array.isArray(raw.equipped) ? raw.equipped : [];
  return equipped.map((entry) => {
    const classId = entry.class === undefined ? null : Number(entry.class);
    const slot = entry.slot === undefined ? null : Number(entry.slot);
    const safeClassId = Number.isFinite(classId) ? classId : null;
    return {
      classId: safeClassId,
      className: safeClassId !== null ? CLASS_NAME_BY_ID[safeClassId] ?? null : null,
      slot: Number.isFinite(slot) ? slot : null,
    };
  });
}

function normalizeContainedItem(raw: RawInventoryItem): {
  itemId: string | null;
  defindex: number | null;
  qualityId: number | null;
  level: number | null;
  quantity: number | null;
} | null {
  const contained = raw.contained_item;
  if (!contained || typeof contained !== "object") {
    return null;
  }

  const row = asRecord(contained);
  const itemId = row.id === undefined || row.id === null ? null : String(row.id);
  const defindex = Number(row.defindex ?? NaN);
  const qualityId = Number(row.quality ?? NaN);
  const level = Number(row.level ?? NaN);
  const quantity = Number(row.quantity ?? NaN);

  const normalized = {
    itemId,
    defindex: Number.isFinite(defindex) ? defindex : null,
    qualityId: Number.isFinite(qualityId) ? qualityId : null,
    level: Number.isFinite(level) ? level : null,
    quantity: Number.isFinite(quantity) ? quantity : null,
  };

  if (
    normalized.itemId === null &&
    normalized.defindex === null &&
    normalized.qualityId === null &&
    normalized.level === null &&
    normalized.quantity === null
  ) {
    return null;
  }

  return normalized;
}

function resolveItemKind(args: {
  isCrate: boolean;
  itemClass: string | null;
  craftClass: string | null;
  itemSlot: string | null;
  hasToolData: boolean;
}): ItemKind {
  if (args.isCrate) {
    return "crate";
  }

  const itemClass = (args.itemClass ?? "").toLowerCase();
  const craftClass = (args.craftClass ?? "").toLowerCase();
  const itemSlot = (args.itemSlot ?? "").toLowerCase();

  if (args.hasToolData || craftClass === "tool" || itemClass.includes("tool")) {
    return "tool";
  }

  if (itemClass.startsWith("tf_weapon") || craftClass === "weapon") {
    return "weapon";
  }

  if (
    craftClass === "hat" ||
    itemClass.includes("cosmetic") ||
    ["head", "misc", "face", "shirt", "belt", "medal"].includes(itemSlot)
  ) {
    return "cosmetic";
  }

  return "misc";
}

function isWarPaintItem(args: {
  schemaItem: SchemaCatalog["itemByDefindex"][number] | undefined;
  communityMetadata: CommunityItemMetadata | null;
  localizedName: string;
}): boolean {
  const toolType = typeof args.schemaItem?.tool?.type === "string" ? args.schemaItem.tool.type.toLowerCase() : "";
  if (toolType.includes("paintkit")) {
    return true;
  }

  const typeTag = args.communityMetadata?.tags.find((tag) => tag.category.toLowerCase() === "type");
  if (typeTag && /war paint/i.test(typeTag.localizedTagName)) {
    return true;
  }

  const text = [
    args.localizedName,
    args.communityMetadata?.type ?? "",
    args.communityMetadata?.name ?? "",
    args.communityMetadata?.marketHashName ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return text.includes("war paint");
}

function readKillstreakAttribute(
  attributes: NormalizedAttribute[],
  expectedName: string,
  fallbackDefindex: number,
): NormalizedAttribute | null {
  const lowered = expectedName.toLowerCase();
  return (
    attributes.find((attribute) => attribute.name?.toLowerCase() === lowered) ??
    attributes.find((attribute) => attribute.defindex === fallbackDefindex) ??
    null
  );
}

function readKillstreakId(attribute: NormalizedAttribute | null): number | null {
  if (!attribute) {
    return null;
  }
  const numeric = Math.round(attribute.value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
}

function resolveKillstreakData(attributes: NormalizedAttribute[]): {
  tier: number;
  tierName: string | null;
  effectId: number | null;
  effectName: string | null;
  effectLookupTable: string | null;
  sheenId: number | null;
  sheenName: string | null;
  sheenLookupTable: string | null;
} {
  const tier = resolveKillstreakTier(attributes);
  const effectAttribute = readKillstreakAttribute(attributes, "killstreak effect", 2013);
  const sheenAttribute = readKillstreakAttribute(attributes, "killstreak idleeffect", 2014);

  return {
    tier,
    tierName: getKillstreakTierLabel(tier),
    effectId: readKillstreakId(effectAttribute),
    effectName: effectAttribute?.decodedValue ?? null,
    effectLookupTable: effectAttribute?.lookupTable ?? null,
    sheenId: readKillstreakId(sheenAttribute),
    sheenName: sheenAttribute?.decodedValue ?? null,
    sheenLookupTable: sheenAttribute?.lookupTable ?? null,
  };
}

export function normalizeInventory(
  rawItems: RawInventoryItem[],
  schema: SchemaCatalog,
  communityByAssetId?: ReadonlyMap<string, CommunityItemMetadata> | null,
): NormalizedInventoryItem[] {
  const items = rawItems.map((rawItem) =>
    normalizeInventoryItem(rawItem, schema, communityByAssetId?.get(String(rawItem.id)) ?? null),
  );

  const paintkitNameById = new Map<number, string>();
  for (const item of items) {
    if (item.cosmetics.paintkitId !== null && item.cosmetics.paintkitName) {
      paintkitNameById.set(item.cosmetics.paintkitId, item.cosmetics.paintkitName);
    }
  }

  for (const item of items) {
    if (item.cosmetics.paintkitId !== null && !item.cosmetics.paintkitName) {
      const mapped = paintkitNameById.get(item.cosmetics.paintkitId);
      if (mapped) {
        item.cosmetics.paintkitName = mapped;
        item.names.display = buildItemDisplayName(item);
      }
    }
  }

  return items;
}

function normalizeInventoryItem(
  rawItem: RawInventoryItem,
  schema: SchemaCatalog,
  communityMetadata: CommunityItemMetadata | null,
): NormalizedInventoryItem {
  const schemaItem = schema.itemByDefindex[rawItem.defindex];
  const localizedName =
    schemaItem?.displayName || (typeof rawItem.item_name === "string" && rawItem.item_name) || `#${rawItem.defindex}`;
  const attributes = normalizeAttributes(rawItem, schema);
  const counters = extractStrangeCounters(attributes, schema.scoreTypeNameById);
  const primaryCounter = getPrimaryCounter(counters);
  const strangeParts = getStrangeParts(counters);
  const strangeRanks = resolveStrangeRankMetadata(counters, primaryCounter, schema.strangeRankSets ?? []);

  const qualityId = rawItem.quality === undefined ? null : Number(rawItem.quality);
  const qualityName = resolveQualityName(qualityId, schema, communityMetadata, {
    isWarPaint: isWarPaintItem({
      schemaItem,
      communityMetadata,
      localizedName,
    }),
  });
  const customName = resolveCustomName(rawItem, attributes);
  const killstreak = resolveKillstreakData(attributes);
  const paintkitId = resolvePaintkitId(attributes);
  const isFestivized = resolveIsFestivized(attributes);
  const wear = resolveWear(communityMetadata?.marketHashName ?? null);
  const unusualData = resolveUnusualData(attributes, schema, communityMetadata);
  const tradeData = resolveTradeData(rawItem, attributes);
  const craftingData = resolveCraftingData(rawItem, attributes);
  const toolData = resolveToolData(attributes, schema);
  const paintData = resolvePaintData(attributes);
  const spellsData = resolveSpellsData(attributes);
  const strangeRestrictionsData = resolveStrangeRestrictionsData(attributes);
  const crateData = resolveCrateData({
    attributes,
    localizedName,
    communityMetadata,
  });

  const normalized: NormalizedInventoryItem = {
    identity: {
      itemId: String(rawItem.id),
      defindex: Number(rawItem.defindex),
      level: rawItem.level === undefined ? null : Number(rawItem.level),
    },
    classification: {
      kind: resolveItemKind({
        isCrate: crateData.isCrate,
        itemClass: schemaItem?.itemClass ?? null,
        craftClass: schemaItem?.craftClass ?? null,
        itemSlot: schemaItem?.itemSlot ?? null,
        hasToolData: schemaItem?.tool !== null && schemaItem?.tool !== undefined,
      }),
      itemClass: schemaItem?.itemClass ?? null,
      craftClass: schemaItem?.craftClass ?? null,
      itemSlot: schemaItem?.itemSlot ?? null,
    },
    quality: {
      id: Number.isFinite(qualityId) ? qualityId : null,
      name: qualityName,
      grade: resolveQualityGrade(communityMetadata),
    },
    names: {
      display: "",
      localized: localizedName,
      custom: customName,
      community: communityMetadata?.name ?? null,
      marketHash: communityMetadata?.marketHashName ?? null,
    },
    flags: {
      isStrange:
        counters.length > 0 ||
        qualityId === 11 ||
        (qualityName ? qualityName.toLowerCase().includes("strange") : false),
      isUnusual: unusualData.isUnusual,
      isCrate: crateData.isCrate,
      isCommunityCrate: crateData.isCommunityCrate,
      isFestivized,
      isCraftable: resolveCraftable(rawItem, attributes, communityMetadata),
      isTradable: resolveTradable(rawItem, communityMetadata),
    },
    strange: {
      primaryCounter,
      counters,
      parts: strangeParts,
      primaryRank: strangeRanks.primaryRank,
      counterRanks: strangeRanks.counterRanks,
    },
    unusual: {
      effectId: unusualData.unusualEffectId,
      effectName: unusualData.unusualEffectName,
      source: unusualData.unusualSource,
    },
    crate: {
      series: crateData.crateSeries,
      type: crateData.crateType,
    },
    killstreak,
    cosmetics: {
      paintkitId,
      paintkitName: paintkitId ? inferPaintkitNameFromMetadata(communityMetadata, localizedName) : null,
    },
    media: {
      imageUrl: communityMetadata?.iconUrl ?? schemaItem?.imageUrl ?? null,
      imageUrlLarge:
        communityMetadata?.iconUrlLarge ??
        communityMetadata?.iconUrl ??
        schemaItem?.imageUrlLarge ??
        schemaItem?.imageUrl ??
        null,
      wear,
      tags: communityMetadata?.tags ?? [],
    },
    trade: tradeData,
    crafting: craftingData,
    tool: toolData,
    paint: paintData,
    spells: spellsData,
    strangeRestrictions: strangeRestrictionsData,
    source: {
      originalItemId: rawItem.original_id ?? null,
      quantity: rawItem.quantity ?? 1,
      originId: rawItem.origin ?? null,
      originName: rawItem.origin !== undefined ? (schema.originNameById?.[rawItem.origin] ?? null) : null,
      customDescription: rawItem.custom_desc ?? null,
      style: rawItem.style ?? null,
      accountInfo: rawItem.account_info ?? null,
      equipped: normalizeEquipped(rawItem),
      containedItem: normalizeContainedItem(rawItem),
    },
    schema: {
      usedByClasses: schemaItem?.usedByClasses ?? [],
      perClassLoadoutSlots: schemaItem?.perClassLoadoutSlots ?? {},
      styles: schemaItem?.styles ?? [],
      tool: schemaItem?.tool ?? null,
      capabilities: schemaItem?.capabilities ?? [],
    },
    attributes,
    rawItem,
  };

  normalized.names.display = buildItemDisplayName(normalized);

  return normalized;
}

function buildItemDisplayName(item: NormalizedInventoryItem): string {
  return buildDisplayName({
    localizedName: item.names.localized,
    customName: item.names.custom,
    communityName: item.names.community,
    communityMarketHashName: item.names.marketHash,
    qualityName: item.quality.name,
    killstreakTier: item.killstreak.tier,
    isFestivized: item.flags.isFestivized,
    paintkitId: item.cosmetics.paintkitId,
    paintkitName: item.cosmetics.paintkitName,
  });
}
