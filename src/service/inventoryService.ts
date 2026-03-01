import { normalizeInventory } from "../normalize/index.js";
import type {
  ApiKeySource,
  CommunityItemMetadata,
  InventoryResponse,
  ResolvedTarget,
} from "../normalize/types.js";
import type { SchemaCatalog } from "../schema/catalog.js";
import { resolveTargetInput } from "../target/parse.js";
import { CommunityInventoryClient } from "../steam/communityInventory.js";
import { SteamApiError } from "../steam/errors.js";

export interface CommunityInventoryClientLike {
  getItemMetadataByAssetId(steamId: string, language?: string): Promise<Map<string, CommunityItemMetadata>>;
}

export interface SchemaCacheLike {
  getCatalog(apiKey: string, language?: string): Promise<SchemaCatalog>;
}

export interface SteamApiClientLike {
  getPlayerItems(steamId: string, apiKey: string): Promise<InventoryResponse["raw"]["playerItemsResult"]>;
  resolveVanityUrl(vanityUrl: string, apiKey: string): Promise<string>;
}

export interface InventoryServiceLike {
  getInventory(args: {
    target: string;
    apiKey?: string;
    language?: string;
    apiKeySource?: ApiKeySource;
  }): Promise<InventoryResponse>;
}

export interface InventoryServiceDependencies {
  steamApiClient: SteamApiClientLike;
  schemaCache: SchemaCacheLike;
  communityInventoryClient: CommunityInventoryClientLike;
}

function requireApiKey(apiKey?: string): string {
  const value = apiKey?.trim() ?? process.env.STEAM_API_KEY?.trim();
  if (!value) {
    throw new SteamApiError("invalid_key", "Missing Steam API key.");
  }
  return value;
}

export class InventoryService implements InventoryServiceLike {
  private readonly steamApiClient: SteamApiClientLike;
  private readonly schemaCache: SchemaCacheLike;
  private readonly communityInventoryClient: CommunityInventoryClientLike;

  constructor(deps: InventoryServiceDependencies) {
    this.steamApiClient = deps.steamApiClient;
    this.schemaCache = deps.schemaCache;
    this.communityInventoryClient = deps.communityInventoryClient;
  }

  async resolveTarget(target: string, apiKey?: string): Promise<ResolvedTarget> {
    const key = requireApiKey(apiKey);
    return resolveTargetInput(target, this.steamApiClient, key);
  }

  async getSchema(apiKey?: string, language = "en"): Promise<SchemaCatalog> {
    const key = requireApiKey(apiKey);
    return this.schemaCache.getCatalog(key, language);
  }

  async getInventory(args: {
    target: string;
    apiKey?: string;
    language?: string;
    apiKeySource?: ApiKeySource;
  }): Promise<InventoryResponse> {
    const language = args.language?.trim() || "en";
    const apiKey = requireApiKey(args.apiKey);
    const apiKeySource: ApiKeySource = args.apiKeySource ?? (args.apiKey ? "sdk" : "env");

    const resolvedTarget = await this.resolveTarget(args.target, apiKey);
    const schema = await this.schemaCache.getCatalog(apiKey, language);
    const playerItemsResult = await this.steamApiClient.getPlayerItems(resolvedTarget.steamId, apiKey);

    let communityByAssetId: ReadonlyMap<string, CommunityItemMetadata> | null = null;
    const warnings: string[] = [];
    try {
      communityByAssetId = await this.communityInventoryClient.getItemMetadataByAssetId(
        resolvedTarget.steamId,
        language,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Community metadata unavailable: ${message}`);
    }

    const normalizedItems = normalizeInventory(playerItemsResult.items, schema, communityByAssetId);

    return {
      request: {
        language,
        apiKeySource,
        communityMetadataLoaded: communityByAssetId !== null,
        warnings,
      },
      target: resolvedTarget,
      inventory: {
        totalItems: playerItemsResult.items.length,
        public: true,
        fetchedAt: Date.now(),
      },
      items: normalizedItems,
      raw: {
        playerItemsResult,
        schemaFetchedAt: schema.fetchedAt,
      },
    };
  }
}

export function createInventoryService(deps: {
  steamApiClient: SteamApiClientLike;
  schemaCache: SchemaCacheLike;
  communityInventoryClient?: CommunityInventoryClientLike;
}): InventoryService {
  return new InventoryService({
    steamApiClient: deps.steamApiClient,
    schemaCache: deps.schemaCache,
    communityInventoryClient: deps.communityInventoryClient ?? new CommunityInventoryClient(),
  });
}
