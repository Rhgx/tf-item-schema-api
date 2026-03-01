import type {
  InventoryResponse,
  InventoryResponsePublic,
  NormalizedInventoryItem,
  NormalizedInventoryItemPublic,
} from "../normalize/types.js";

export interface InventoryFilterOptions {
  defindex?: number[];
  qualityId?: number[];
  quality?: string[];
  name?: string;
  isStrange?: boolean;
  isUnusual?: boolean;
  isCrate?: boolean;
  isCommunityCrate?: boolean;
  isFestivized?: boolean;
  isCraftable?: boolean;
  isTradable?: boolean;
  crateSeries?: number[];
  hasPaintkit?: boolean;
  minLevel?: number;
  maxLevel?: number;
  limit?: number;
  offset?: number;
}

export interface InventoryFilterResult {
  totalMatched: number;
  items: NormalizedInventoryItem[];
}

export function filterInventoryItems(
  items: NormalizedInventoryItem[],
  filters: InventoryFilterOptions = {},
): InventoryFilterResult {
  const qualityNames = new Set((filters.quality ?? []).map((name) => name.toLowerCase()));
  const nameFilter = filters.name?.trim().toLowerCase();

  const matched = items.filter((item) => {
    if (filters.defindex && !filters.defindex.includes(item.identity.defindex)) {
      return false;
    }
    if (filters.qualityId) {
      if (item.quality.id === null || !filters.qualityId.includes(item.quality.id)) {
        return false;
      }
    }
    if (qualityNames.size > 0) {
      const qualityName = item.quality.name?.toLowerCase();
      if (!qualityName || !qualityNames.has(qualityName)) {
        return false;
      }
    }
    if (nameFilter) {
      const candidates = [
        item.names.display,
        item.names.localized,
        item.names.custom ?? "",
        item.names.community ?? "",
        item.names.marketHash ?? "",
      ].map((value) => value.toLowerCase());
      if (!candidates.some((value) => value.includes(nameFilter))) {
        return false;
      }
    }
    if (filters.isStrange !== undefined && item.flags.isStrange !== filters.isStrange) {
      return false;
    }
    if (filters.isUnusual !== undefined && item.flags.isUnusual !== filters.isUnusual) {
      return false;
    }
    if (filters.isCrate !== undefined && item.flags.isCrate !== filters.isCrate) {
      return false;
    }
    if (
      filters.isCommunityCrate !== undefined &&
      item.flags.isCommunityCrate !== filters.isCommunityCrate
    ) {
      return false;
    }
    if (filters.isFestivized !== undefined && item.flags.isFestivized !== filters.isFestivized) {
      return false;
    }
    if (filters.isCraftable !== undefined && item.flags.isCraftable !== filters.isCraftable) {
      return false;
    }
    if (filters.isTradable !== undefined && item.flags.isTradable !== filters.isTradable) {
      return false;
    }
    if (filters.crateSeries) {
      if (item.crate.series === null || !filters.crateSeries.includes(item.crate.series)) {
        return false;
      }
    }
    if (filters.hasPaintkit !== undefined) {
      const hasPaintkit = item.cosmetics.paintkitId !== null;
      if (hasPaintkit !== filters.hasPaintkit) {
        return false;
      }
    }
    if (filters.minLevel !== undefined) {
      if (item.identity.level === null || item.identity.level < filters.minLevel) {
        return false;
      }
    }
    if (filters.maxLevel !== undefined) {
      if (item.identity.level === null || item.identity.level > filters.maxLevel) {
        return false;
      }
    }
    return true;
  });

  const offset = filters.offset ?? 0;
  const paged =
    filters.limit !== undefined ? matched.slice(offset, offset + filters.limit) : matched.slice(offset);

  return {
    totalMatched: matched.length,
    items: paged,
  };
}

export function stripRawFromInventory(response: InventoryResponse): InventoryResponsePublic {
  const { raw: _raw, ...base } = response;
  const items = response.items.map(({ rawItem: _rawItem, ...item }): NormalizedInventoryItemPublic => item);
  return {
    ...base,
    items,
  };
}
