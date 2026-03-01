import type { SteamApiClient } from "../steam/client.js";
import { buildSchemaCatalog, type SchemaCatalog } from "./catalog.js";

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  catalog: SchemaCatalog;
}

export class SchemaCache {
  private readonly byLanguage = new Map<string, CacheEntry>();

  constructor(private readonly steamApiClient: SteamApiClient) {}

  async getCatalog(apiKey: string, language = "en", maxAgeMs = DEFAULT_MAX_AGE_MS): Promise<SchemaCatalog> {
    const normalizedLanguage = language.trim().toLowerCase() || "en";
    const now = Date.now();
    const cached = this.byLanguage.get(normalizedLanguage);
    if (cached && now <= cached.expiresAt) {
      return cached.catalog;
    }

    try {
      const rawSchema = await this.steamApiClient.getSchema(apiKey, normalizedLanguage);
      const catalog = buildSchemaCatalog(rawSchema);
      this.byLanguage.set(normalizedLanguage, {
        catalog,
        expiresAt: now + maxAgeMs,
      });
      return catalog;
    } catch (error) {
      if (cached) {
        return cached.catalog;
      }
      throw error;
    }
  }
}
