import type { CommunityItemMetadata, NormalizedAttribute } from "./types.js";

const CRATE_SERIES_DEFINDEXES = new Set([187]);
const SUPPLY_CRATE_HINTS = ["mann co. supply crate", "salvaged mann co. supply crate"];
const CRATE_WORD_RE = /\b(crate|case)\b/i;
const SERIES_RE = /series\s*#?\s*(\d+)/i;
const COLLECTION_RE = /\b(.+?\bcollection)\b/i;
const POSSIBLE_UNUSUAL_RE = /unusual effect:\s*(.+)$/i;
const POSSIBLE_UNUSUAL_WITH_RE = /\bmay be unusual with (?:an?\s+)?(.+?)\s+effect\b/i;

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseSeriesValue(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const integer = Math.trunc(numeric);
  return integer > 0 ? integer : null;
}

function parseSeriesFromText(text: string): number | null {
  const match = text.match(SERIES_RE);
  if (!match?.[1]) {
    return null;
  }
  return parseSeriesValue(match[1]);
}

function resolveCrateSeries(
  attributes: NormalizedAttribute[],
  communityMetadata: CommunityItemMetadata | null,
): number | null {
  for (const attribute of attributes) {
    const byDefindex = CRATE_SERIES_DEFINDEXES.has(attribute.defindex);
    const byName = attribute.name?.toLowerCase().includes("crate series") ?? false;
    if (!byDefindex && !byName) {
      continue;
    }
    const series = parseSeriesValue(attribute.value);
    if (series !== null) {
      return series;
    }
  }

  if (communityMetadata) {
    for (const line of communityMetadata.descriptions) {
      const series = parseSeriesFromText(stripHtml(line.value));
      if (series !== null) {
        return series;
      }
    }

    const textCandidates = [
      communityMetadata.type,
      communityMetadata.name,
      communityMetadata.marketHashName,
    ];
    for (const candidate of textCandidates) {
      if (!candidate) {
        continue;
      }
      const series = parseSeriesFromText(stripHtml(candidate));
      if (series !== null) {
        return series;
      }
    }
  }

  return null;
}

function resolveCrateType(localizedName: string, communityMetadata: CommunityItemMetadata | null): string | null {
  const metadataType = communityMetadata?.type?.trim();
  if (metadataType && CRATE_WORD_RE.test(metadataType)) {
    return metadataType;
  }

  if (communityMetadata) {
    const typeTag = communityMetadata.tags.find((tag) => tag.category.toLowerCase() === "type");
    if (typeTag && CRATE_WORD_RE.test(typeTag.localizedTagName)) {
      return typeTag.localizedTagName.trim();
    }
  }

  if (CRATE_WORD_RE.test(localizedName)) {
    return localizedName.trim();
  }

  return null;
}

function looksLikeSupplyCrate(value: string): boolean {
  const lower = value.toLowerCase();
  return SUPPLY_CRATE_HINTS.some((hint) => lower.includes(hint));
}

function readDescriptionLines(metadata: CommunityItemMetadata | null): string[] {
  if (!metadata) {
    return [];
  }
  return metadata.descriptions.map((line) => stripHtml(line.value)).filter((line) => line.length > 0);
}

function extractPossibleUnusualHints(descriptionLines: string[]): string[] {
  const hints = new Set<string>();

  for (const line of descriptionLines) {
    const direct = line.match(POSSIBLE_UNUSUAL_RE)?.[1]?.trim();
    if (direct) {
      hints.add(direct);
    }

    const mayBe = line.match(POSSIBLE_UNUSUAL_WITH_RE)?.[1]?.trim();
    if (mayBe) {
      hints.add(mayBe);
    }
  }

  return [...hints];
}

function extractPossibleCollectionAndItems(descriptionLines: string[]): {
  possibleContentsCollection: string | null;
  possibleContentsItems: string[];
} {
  let collection: string | null = null;
  let collectionLineIndex = -1;

  for (let index = 0; index < descriptionLines.length; index += 1) {
    const line = descriptionLines[index]!;
    const fromLine = line.match(/from the (.+?\bcollection)\b/i)?.[1]?.trim();
    if (fromLine) {
      collection = fromLine;
      collectionLineIndex = index;
      break;
    }
  }

  if (!collection) {
    for (let index = 0; index < descriptionLines.length; index += 1) {
      const line = descriptionLines[index]!;
      if (COLLECTION_RE.test(line) && !/contains .* collection/i.test(line)) {
        collection = line.match(COLLECTION_RE)?.[1]?.trim() ?? line.trim();
        collectionLineIndex = index;
        break;
      }
    }
  }

  if (!collection || collectionLineIndex < 0) {
    return { possibleContentsCollection: null, possibleContentsItems: [] };
  }

  // If collection was extracted from a sentence ("from the X Collection"),
  // prefer a standalone collection heading line when present.
  const collectionLower = collection.toLowerCase();
  for (let index = collectionLineIndex + 1; index < descriptionLines.length; index += 1) {
    if (descriptionLines[index]!.toLowerCase() === collectionLower) {
      collectionLineIndex = index;
      break;
    }
  }

  const items: string[] = [];
  for (let index = collectionLineIndex + 1; index < descriptionLines.length; index += 1) {
    const line = descriptionLines[index]!;
    const lower = line.toLowerCase();

    // Stop scanning once we hit another sentence-like metadata block.
    if (
      lower.includes("series") ||
      lower.includes("unusual effect") ||
      lower.includes("contains ") ||
      lower.includes("requires ") ||
      lower.includes("contents may")
    ) {
      break;
    }

    // Candidate lines are short title-like entries (item names), not metadata lines.
    const isCollectionLine = lower === collectionLower;
    const looksLikeMetadata =
      lower.includes("collection") ||
      lower.includes("case") ||
      lower.includes("key to open") ||
      lower.includes("strange") ||
      lower.includes("unusual");
    const hasSentencePunctuation = /[.!?]/.test(line);

    if (
      line.length > 0 &&
      line.length <= 64 &&
      !line.includes(":") &&
      !isCollectionLine &&
      !looksLikeMetadata &&
      !hasSentencePunctuation
    ) {
      items.push(line);
      continue;
    }

    break;
  }

  return {
    possibleContentsCollection: collection,
    possibleContentsItems: [...new Set(items)],
  };
}

export function resolveCrateData(input: {
  attributes: NormalizedAttribute[];
  localizedName: string;
  communityMetadata: CommunityItemMetadata | null;
}): {
  isCrate: boolean;
  isCommunityCrate: boolean;
  crateSeries: number | null;
  crateType: string | null;
  possibleUnusualHints: string[];
  possibleContentsCollection: string | null;
  possibleContentsItems: string[];
} {
  const crateSeries = resolveCrateSeries(input.attributes, input.communityMetadata);
  const crateType = resolveCrateType(input.localizedName, input.communityMetadata);
  const descriptionLines = readDescriptionLines(input.communityMetadata);
  const possibleUnusualHints = extractPossibleUnusualHints(descriptionLines);
  const { possibleContentsCollection, possibleContentsItems } = extractPossibleCollectionAndItems(descriptionLines);

  const combinedText = [
    input.localizedName,
    input.communityMetadata?.name ?? "",
    input.communityMetadata?.marketHashName ?? "",
    input.communityMetadata?.type ?? "",
    crateType ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const isCrate = crateSeries !== null || CRATE_WORD_RE.test(combinedText);
  const isSupplyCrate = looksLikeSupplyCrate(combinedText);
  const isCommunityCrate = isCrate && !isSupplyCrate && combinedText.includes("case");

  return {
    isCrate,
    isCommunityCrate,
    crateSeries,
    crateType,
    possibleUnusualHints,
    possibleContentsCollection,
    possibleContentsItems,
  };
}
