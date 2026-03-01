import type { CommunityItemMetadata, NormalizedAttribute } from "./types.js";

const CRATE_SERIES_DEFINDEXES = new Set([187]);
const SUPPLY_CRATE_HINTS = ["mann co. supply crate", "salvaged mann co. supply crate"];
const CRATE_WORD_RE = /\b(crate|case)\b/i;
const SERIES_RE = /series\s*#?\s*(\d+)/i;

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

export function resolveCrateData(input: {
  attributes: NormalizedAttribute[];
  localizedName: string;
  communityMetadata: CommunityItemMetadata | null;
}): {
  isCrate: boolean;
  isCommunityCrate: boolean;
  crateSeries: number | null;
  crateType: string | null;
} {
  const crateSeries = resolveCrateSeries(input.attributes, input.communityMetadata);
  const crateType = resolveCrateType(input.localizedName, input.communityMetadata);

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
  };
}
