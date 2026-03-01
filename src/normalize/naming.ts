import type { SchemaCatalog } from "../schema/catalog.js";
import type { CommunityItemMetadata, NormalizedAttribute, RawInventoryItem } from "./types.js";

const QUALITY_PREFIXES = [
  "Normal",
  "Unique",
  "Strange",
  "Unusual",
  "Vintage",
  "Genuine",
  "Haunted",
  "Community",
  "Valve",
  "Self-Made",
  "Collector's",
  "Collectors",
  "Decorated",
  "Festivized",
  "Festive",
  "Australium",
];
const KILLSTREAK_PREFIXES = ["Professional Killstreak", "Specialized Killstreak", "Killstreak"];
const WEAR_SUFFIX_RE = /\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle Scarred)\)$/i;
const DECORATED_GRADE_NAMES = [
  "Civilian Grade",
  "Freelance Grade",
  "Mercenary Grade",
  "Commando Grade",
  "Assassin Grade",
  "Elite Grade",
];
const DECORATED_GRADE_RE = /\b(Civilian|Freelance|Mercenary|Commando|Assassin|Elite)\s+Grade\b/i;

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function findNumericAttribute(attributes: NormalizedAttribute[], attributeName: string): number {
  const wanted = attributeName.toLowerCase();
  const match = attributes.find((attribute) => attribute.name?.toLowerCase() === wanted);
  if (!match) {
    return 0;
  }
  return Number.isFinite(match.value) ? match.value : 0;
}

export function getKillstreakTierLabel(tier: number): string | null {
  if (tier === 1) {
    return "Killstreak";
  }
  if (tier === 2) {
    return "Specialized Killstreak";
  }
  if (tier === 3) {
    return "Professional Killstreak";
  }
  return null;
}

function readQualityNameFromCommunity(metadata: CommunityItemMetadata | null): string | null {
  if (!metadata) {
    return null;
  }
  const qualityTag = metadata.tags.find((tag) => tag.category.toLowerCase() === "quality");
  return qualityTag?.localizedTagName ?? null;
}

export function resolveQualityName(
  qualityId: number | null,
  schema: SchemaCatalog,
  communityMetadata: CommunityItemMetadata | null,
  options?: {
    isWarPaint?: boolean;
  },
): string | null {
  const fromCommunity = readQualityNameFromCommunity(communityMetadata);
  const fromSchema = qualityId === null ? null : (schema.qualityNameById[qualityId] ?? null);

  if (options?.isWarPaint && fromCommunity?.trim().toLowerCase() === "decorated weapon") {
    return fromSchema ?? "Decorated";
  }

  if (fromCommunity) {
    return fromCommunity;
  }
  return fromSchema;
}

export function resolveQualityGrade(communityMetadata: CommunityItemMetadata | null): string | null {
  if (!communityMetadata) {
    return null;
  }

  for (const tag of communityMetadata.tags) {
    const tagName = tag.localizedTagName.trim();
    const match = DECORATED_GRADE_NAMES.find(
      (grade) => grade.toLowerCase() === tagName.toLowerCase(),
    );
    if (match) {
      return match;
    }
  }

  const textCandidates = [
    communityMetadata.type ?? "",
    communityMetadata.name ?? "",
    communityMetadata.marketHashName ?? "",
    ...communityMetadata.descriptions.map((line) => stripHtml(line.value)),
  ];

  for (const text of textCandidates) {
    const match = text.match(DECORATED_GRADE_RE);
    if (match?.[0]) {
      const normalized = match[0].replace(/\s+/g, " ").trim();
      const known = DECORATED_GRADE_NAMES.find(
        (grade) => grade.toLowerCase() === normalized.toLowerCase(),
      );
      if (known) {
        return known;
      }
      return normalized;
    }
  }

  return null;
}

function cleanPrefixes(value: string): string {
  let current = value.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of [...KILLSTREAK_PREFIXES, ...QUALITY_PREFIXES]) {
      if (current.toLowerCase().startsWith(`${prefix.toLowerCase()} `)) {
        current = current.slice(prefix.length).trimStart();
        changed = true;
      }
    }
    if (current.toLowerCase().startsWith("the ")) {
      current = current.slice(4).trimStart();
      changed = true;
    }
  }
  return current;
}

function getComparableBaseNames(localizedName: string): string[] {
  const names = new Set<string>();
  const trimmed = localizedName.trim();
  if (!trimmed) {
    return [];
  }
  names.add(trimmed);
  if (trimmed.toLowerCase().startsWith("the ")) {
    names.add(trimmed.slice(4).trim());
  } else {
    names.add(`The ${trimmed}`);
  }
  return [...names];
}

function stripWeaponSuffix(name: string, localizedName: string): string {
  const candidate = name.trim();
  if (!candidate) {
    return candidate;
  }

  const comparableNames = getComparableBaseNames(localizedName);
  let current = candidate;

  for (const baseName of comparableNames) {
    const suffixRe = new RegExp(`\\s+${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    if (suffixRe.test(current)) {
      current = current.replace(suffixRe, "").trim();
      break;
    }
  }
  return current;
}

export function inferPaintkitNameFromMetadata(
  metadata: CommunityItemMetadata | null,
  localizedName: string,
): string | null {
  if (!metadata) {
    return null;
  }

  const source = metadata.marketHashName ?? metadata.name;
  if (!source) {
    return null;
  }

  let candidate = source.trim();

  if (/war paint/i.test(candidate)) {
    candidate = candidate.replace(/\s*War Paint.*$/i, "").trim();
    return candidate || null;
  }

  candidate = cleanPrefixes(candidate);
  candidate = candidate.replace(WEAR_SUFFIX_RE, "").trim();
  candidate = stripWeaponSuffix(candidate, localizedName);

  if (!candidate) {
    return null;
  }

  if (candidate.toLowerCase() === localizedName.toLowerCase()) {
    return null;
  }
  return candidate;
}

export function resolveCustomName(raw: RawInventoryItem, attributes: NormalizedAttribute[]): string | null {
  if (raw.custom_name && raw.custom_name.trim()) {
    return raw.custom_name.trim();
  }
  for (const attribute of attributes) {
    if (attribute.defindex !== 500) {
      continue;
    }
    if (typeof attribute.rawValue === "string" && attribute.rawValue.trim()) {
      return attribute.rawValue.trim();
    }
  }
  return null;
}

export function resolveKillstreakTier(attributes: NormalizedAttribute[]): number {
  return Math.round(findNumericAttribute(attributes, "killstreak tier"));
}

export function resolvePaintkitId(attributes: NormalizedAttribute[]): number | null {
  const id = Math.round(findNumericAttribute(attributes, "paintkit_proto_def_index"));
  return id > 0 ? id : null;
}

export function resolveIsFestivized(attributes: NormalizedAttribute[]): boolean {
  return findNumericAttribute(attributes, "is_festivized") > 0;
}

export function resolveWear(marketHashName: string | null): string | null {
  if (!marketHashName) {
    return null;
  }
  const match = marketHashName.match(WEAR_SUFFIX_RE);
  if (!match?.[1]) {
    return null;
  }
  return match[1];
}

function hasCommunityTag(metadata: CommunityItemMetadata | null, pattern: RegExp): boolean {
  if (!metadata) {
    return false;
  }
  return metadata.tags.some(
    (tag) => pattern.test(tag.localizedTagName) || pattern.test(tag.category),
  );
}

export function resolveTradable(raw: RawInventoryItem, metadata: CommunityItemMetadata | null): boolean {
  const cannotTradeFlag = raw.flag_cannot_trade;
  if (cannotTradeFlag === true || cannotTradeFlag === 1) {
    return false;
  }
  if (hasCommunityTag(metadata, /not tradable/i)) {
    return false;
  }
  return true;
}

export function resolveCraftable(
  raw: RawInventoryItem,
  attributes: NormalizedAttribute[],
  metadata: CommunityItemMetadata | null,
): boolean {
  const cannotCraftFlag = raw.flag_cannot_craft;
  if (cannotCraftFlag === true || cannotCraftFlag === 1) {
    return false;
  }
  const hasCannotCraftAttribute = attributes.some(
    (attribute) => attribute.name?.toLowerCase().includes("cannot craft") && attribute.value > 0,
  );
  if (hasCannotCraftAttribute) {
    return false;
  }
  if (hasCommunityTag(metadata, /non-craftable|not usable in crafting/i)) {
    return false;
  }
  return true;
}

export function buildDisplayName(input: {
  localizedName: string;
  customName: string | null;
  communityName: string | null;
  communityMarketHashName: string | null;
  qualityName: string | null;
  killstreakTier: number;
  isFestivized: boolean;
  paintkitId: number | null;
  paintkitName: string | null;
}): string {
  const base = input.communityName ?? input.communityMarketHashName ?? buildFallbackName(input);
  if (!input.customName) {
    return base;
  }
  if (input.customName.toLowerCase() === base.toLowerCase()) {
    return base;
  }
  return `"${input.customName}" (${base})`;
}

function buildFallbackName(input: {
  localizedName: string;
  qualityName: string | null;
  killstreakTier: number;
  isFestivized: boolean;
  paintkitId: number | null;
  paintkitName: string | null;
}): string {
  const tokens: string[] = [];
  if (input.qualityName && input.qualityName.toLowerCase() !== "unique") {
    tokens.push(input.qualityName);
  }

  const killstreak = getKillstreakTierLabel(input.killstreakTier);
  if (killstreak) {
    tokens.push(killstreak);
  }

  if (input.isFestivized) {
    tokens.push("Festivized");
  }

  if (input.paintkitId !== null) {
    tokens.push(input.paintkitName ?? `Paintkit #${input.paintkitId}`);
  }

  tokens.push(input.localizedName);
  return tokens.join(" ").replace(/\s+/g, " ").trim();
}
