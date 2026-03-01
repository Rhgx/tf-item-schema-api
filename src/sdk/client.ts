import { filterInventoryItems, type InventoryFilterOptions, stripRawFromInventory } from "../filters/inventory.js";
import { compactInventoryItems } from "../presentation/compact.js";
import type { InventoryResponse, InventoryResponsePublic, ResolvedTarget } from "../normalize/types.js";
import type { SchemaCatalog } from "../schema/catalog.js";
import { SchemaCache } from "../schema/cache.js";
import { InventoryService, createInventoryService } from "../service/inventoryService.js";
import { SteamApiClient } from "../steam/client.js";
import { CommunityInventoryClient } from "../steam/communityInventory.js";
import { EconItems440Provider } from "../steam/provider.js";
import type { SteamPlayerSummary, SteamSchemaItemsPage } from "../steam/types.js";

export interface Tf2ItemsClientOptions {
  apiKey?: string;
  language?: string;
}

export interface InventoryFetchOptions extends InventoryFilterOptions {
  apiKey?: string;
  language?: string;
  includeRaw?: boolean;
  detailLevel?: "full" | "compact";
}

export interface InventoryFilterRunOptions extends InventoryFilterOptions {
  includeRaw?: boolean;
  detailLevel?: "full" | "compact";
}

export interface InventoryResponseCompact {
  request: InventoryResponse["request"];
  target: InventoryResponse["target"];
  inventory: InventoryResponse["inventory"];
  items: Record<string, unknown>[];
  raw: InventoryResponse["raw"];
}

export interface InventoryResponseCompactPublic {
  request: InventoryResponsePublic["request"];
  target: InventoryResponsePublic["target"];
  inventory: InventoryResponsePublic["inventory"];
  items: Record<string, unknown>[];
}

export type InventoryResponseResult = InventoryResponse | InventoryResponsePublic;
export type InventoryResponseDetailedResult =
  | InventoryResponseResult
  | InventoryResponseCompact
  | InventoryResponseCompactPublic;

export interface Tf2ItemsClient {
  getInventory(
    target: string,
    options?: InventoryFetchOptions,
  ): Promise<InventoryResponseDetailedResult>;
  resolveTarget(
    target: string,
    options?: {
      apiKey?: string;
    },
  ): Promise<ResolvedTarget>;
  getSchema(options?: { apiKey?: string; language?: string }): Promise<SchemaCatalog>;
  getSchemaOverview(options?: { apiKey?: string; language?: string }): Promise<Record<string, unknown>>;
  getSchemaItemsPage(options?: { apiKey?: string; language?: string; start?: number }): Promise<SteamSchemaItemsPage>;
  getSchemaUrl(options?: { apiKey?: string }): Promise<string>;
  getPlayerSummary(
    target: string,
    options?: {
      apiKey?: string;
    },
  ): Promise<{ target: ResolvedTarget; summary: SteamPlayerSummary | null }>;
  getInventorySummary(
    target: string,
    options?: InventoryFetchOptions,
  ): Promise<InventorySummary>;
  getItemById(
    target: string,
    itemId: string,
    options?: InventoryFetchOptions,
  ): Promise<InventoryResponseResult["items"][number] | null>;
}

export interface InventorySummary {
  totalItems: number;
  strangeItems: number;
  unusualItems: number;
  festivizedItems: number;
  tradableItems: number;
  craftableItems: number;
  uniqueDefindexes: number;
  qualityCounts: Record<string, number>;
  unusualEffectCounts: Record<string, number>;
}

function requireApiKey(explicit?: string, fallback?: string): string {
  const resolved = explicit?.trim() ?? fallback?.trim() ?? process.env.STEAM_API_KEY?.trim();
  if (!resolved) {
    throw new Error("Missing Steam API key. Provide options.apiKey or set STEAM_API_KEY.");
  }
  return resolved;
}

export function createTf2ItemsClient(options: Tf2ItemsClientOptions = {}): Tf2ItemsClient {
  const steamApiClient = new SteamApiClient(new EconItems440Provider());
  const schemaCache = new SchemaCache(steamApiClient);
  const inventoryService: InventoryService = createInventoryService({
    steamApiClient,
    schemaCache,
    communityInventoryClient: new CommunityInventoryClient(),
  });

  const defaultApiKey = options.apiKey;
  const defaultLanguage = options.language ?? "en";

  return {
    async getInventory(target, callOptions) {
      const apiKey = requireApiKey(callOptions?.apiKey, defaultApiKey);
      const inventory = await inventoryService.getInventory({
        target,
        apiKey,
        language: callOptions?.language ?? defaultLanguage,
        apiKeySource: "sdk",
      });
      return filterInventoryResponse(inventory, callOptions);
    },
    async resolveTarget(target, callOptions) {
      const apiKey = requireApiKey(callOptions?.apiKey, defaultApiKey);
      return inventoryService.resolveTarget(target, apiKey);
    },
    async getSchema(callOptions) {
      const apiKey = requireApiKey(callOptions?.apiKey, defaultApiKey);
      return inventoryService.getSchema(apiKey, callOptions?.language ?? defaultLanguage);
    },
    async getSchemaOverview(callOptions) {
      const apiKey = requireApiKey(callOptions?.apiKey, defaultApiKey);
      return steamApiClient.getSchemaOverview(apiKey, callOptions?.language ?? defaultLanguage);
    },
    async getSchemaItemsPage(callOptions) {
      const apiKey = requireApiKey(callOptions?.apiKey, defaultApiKey);
      return steamApiClient.getSchemaItemsPage(
        apiKey,
        callOptions?.start ?? 0,
        callOptions?.language ?? defaultLanguage,
      );
    },
    async getSchemaUrl(callOptions) {
      const apiKey = requireApiKey(callOptions?.apiKey, defaultApiKey);
      return steamApiClient.getSchemaUrl(apiKey);
    },
    async getPlayerSummary(target, callOptions) {
      const apiKey = requireApiKey(callOptions?.apiKey, defaultApiKey);
      const resolvedTarget = await inventoryService.resolveTarget(target, apiKey);
      const summary = await steamApiClient.getPlayerSummary(resolvedTarget.steamId, apiKey);
      return { target: resolvedTarget, summary };
    },
    async getInventorySummary(target, callOptions) {
      const inventory = (await this.getInventory(target, {
        ...callOptions,
        includeRaw: true,
        detailLevel: "full",
      })) as InventoryResponseResult;
      return buildInventorySummary(inventory);
    },
    async getItemById(target, itemId, callOptions) {
      const inventory = (await this.getInventory(target, {
        ...callOptions,
        includeRaw: true,
        detailLevel: "full",
      })) as InventoryResponseResult;
      return inventory.items.find((item) => item.identity.itemId === itemId) ?? null;
    },
  };
}

export function buildInventorySummary(inventory: InventoryResponseResult): InventorySummary {
  const qualityCounts: Record<string, number> = {};
  const unusualEffectCounts: Record<string, number> = {};
  const uniqueDefindexes = new Set<number>();

  let strangeItems = 0;
  let unusualItems = 0;
  let festivizedItems = 0;
  let tradableItems = 0;
  let craftableItems = 0;

  for (const item of inventory.items) {
    uniqueDefindexes.add(item.identity.defindex);
    if (item.flags.isStrange) {
      strangeItems += 1;
    }
    if (item.flags.isUnusual) {
      unusualItems += 1;
      const effect = item.unusual.effectName ?? "Unknown";
      unusualEffectCounts[effect] = (unusualEffectCounts[effect] ?? 0) + 1;
    }
    if (item.flags.isFestivized) {
      festivizedItems += 1;
    }
    if (item.flags.isTradable) {
      tradableItems += 1;
    }
    if (item.flags.isCraftable) {
      craftableItems += 1;
    }

    const qualityName = item.quality.name ?? (item.quality.id !== null ? `Quality ${item.quality.id}` : "Unknown");
    qualityCounts[qualityName] = (qualityCounts[qualityName] ?? 0) + 1;
  }

  return {
    totalItems: inventory.items.length,
    strangeItems,
    unusualItems,
    festivizedItems,
    tradableItems,
    craftableItems,
    uniqueDefindexes: uniqueDefindexes.size,
    qualityCounts,
    unusualEffectCounts,
  };
}

export function filterInventoryResponse(
  inventory: InventoryResponse,
  options: InventoryFilterRunOptions = {},
): InventoryResponseDetailedResult {
  const filtered = filterInventoryItems(inventory.items, {
    defindex: options.defindex,
    qualityId: options.qualityId,
    quality: options.quality,
    name: options.name,
    isStrange: options.isStrange,
    isUnusual: options.isUnusual,
    isCrate: options.isCrate,
    isCommunityCrate: options.isCommunityCrate,
    isFestivized: options.isFestivized,
    isCraftable: options.isCraftable,
    isTradable: options.isTradable,
    crateSeries: options.crateSeries,
    hasPaintkit: options.hasPaintkit,
    minLevel: options.minLevel,
    maxLevel: options.maxLevel,
    limit: options.limit,
    offset: options.offset,
  });

  const withFilteredTotals: InventoryResponse = {
    ...inventory,
    inventory: {
      ...inventory.inventory,
      totalItems: filtered.totalMatched,
    },
    items: filtered.items,
  };

  const includeRaw = options.includeRaw ?? true;
  const detailLevel = options.detailLevel ?? "full";

  if (!includeRaw) {
    const publicInventory = stripRawFromInventory(withFilteredTotals);
    if (detailLevel === "compact") {
      return {
        ...publicInventory,
        items: compactInventoryItems(publicInventory.items),
      };
    }
    return publicInventory;
  }

  if (detailLevel === "compact") {
    return {
      ...withFilteredTotals,
      items: compactInventoryItems(withFilteredTotals.items),
    };
  }

  return withFilteredTotals;
}
