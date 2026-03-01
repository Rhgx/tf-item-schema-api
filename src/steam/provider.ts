import JSONbig from "json-bigint";
import { SteamApiError } from "./errors.js";

const jsonBig = JSONbig({ storeAsString: true });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RequestOptions {
  attempts?: number;
}

export interface SteamProvider {
  getPlayerItemsRaw(apiKey: string, steamId: string): Promise<unknown>;
  getSchemaOverviewRaw(apiKey: string, language?: string): Promise<unknown>;
  getSchemaItemsRaw(apiKey: string, start?: number, language?: string): Promise<unknown>;
  getSchemaUrlRaw(apiKey: string): Promise<unknown>;
  getPlayerSummariesRaw(apiKey: string, steamIds: string[]): Promise<unknown>;
  resolveVanityUrlRaw(apiKey: string, vanityUrl: string): Promise<unknown>;
}

export class EconItems440Provider implements SteamProvider {
  private readonly baseUrl = "https://api.steampowered.com/IEconItems_440";
  private readonly steamUserBaseUrl = "https://api.steampowered.com/ISteamUser";

  async getPlayerItemsRaw(apiKey: string, steamId: string): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/GetPlayerItems/v0001/`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("format", "json");

    const text = await this.requestText(url, { attempts: 4 });
    try {
      return jsonBig.parse(text);
    } catch (error) {
      throw new SteamApiError("response_parse_error", `Invalid player items JSON: ${String(error)}`);
    }
  }

  async getSchemaOverviewRaw(apiKey: string, language = "en"): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/GetSchemaOverview/v0001/`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", language);
    url.searchParams.set("format", "json");

    const text = await this.requestText(url, { attempts: 3 });
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new SteamApiError("response_parse_error", `Invalid schema overview JSON: ${String(error)}`);
    }
  }

  async getSchemaItemsRaw(apiKey: string, start = 0, language = "en"): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/GetSchemaItems/v0001/`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("start", String(start));
    url.searchParams.set("language", language);
    url.searchParams.set("format", "json");

    const text = await this.requestText(url, { attempts: 3 });
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new SteamApiError("response_parse_error", `Invalid schema items JSON: ${String(error)}`);
    }
  }

  async getSchemaUrlRaw(apiKey: string): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/GetSchemaURL/v1/`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("format", "json");

    const text = await this.requestText(url, { attempts: 3 });
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new SteamApiError("response_parse_error", `Invalid schema URL JSON: ${String(error)}`);
    }
  }

  async getPlayerSummariesRaw(apiKey: string, steamIds: string[]): Promise<unknown> {
    const url = new URL(`${this.steamUserBaseUrl}/GetPlayerSummaries/v0002/`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("steamids", steamIds.join(","));
    url.searchParams.set("format", "json");

    const text = await this.requestText(url, { attempts: 3 });
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new SteamApiError("response_parse_error", `Invalid player summaries JSON: ${String(error)}`);
    }
  }

  async resolveVanityUrlRaw(apiKey: string, vanityUrl: string): Promise<unknown> {
    const url = new URL(`${this.steamUserBaseUrl}/ResolveVanityURL/v0001/`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("vanityurl", vanityUrl);
    url.searchParams.set("format", "json");

    const text = await this.requestText(url, { attempts: 3 });
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new SteamApiError("response_parse_error", `Invalid vanity URL JSON: ${String(error)}`);
    }
  }

  private async requestText(url: URL, options: RequestOptions): Promise<string> {
    const attempts = options.attempts ?? 3;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "tf-item-schema-api/0.1.0",
            Accept: "application/json",
          },
        });

        if (response.status === 403) {
          throw new SteamApiError(
            "invalid_key",
            "Steam rejected the request (HTTP 403). Verify your Steam API key.",
            response.status,
          );
        }

        if (response.status === 429) {
          if (attempt === attempts - 1) {
            throw new SteamApiError("rate_limited", "Steam API rate limit reached.", response.status);
          }
          await sleep(this.getBackoffDelay(attempt));
          continue;
        }

        if (!response.ok) {
          const body = await response.text();
          if (response.status >= 500 && attempt < attempts - 1) {
            await sleep(this.getBackoffDelay(attempt));
            continue;
          }
          throw new SteamApiError(
            "upstream_http_error",
            `Steam upstream request failed (HTTP ${response.status}): ${body.slice(0, 200)}`,
            response.status,
          );
        }

        return await response.text();
      } catch (error) {
        if (error instanceof SteamApiError) {
          throw error;
        }
        lastError = error;
        if (attempt < attempts - 1) {
          await sleep(this.getBackoffDelay(attempt));
          continue;
        }
      }
    }

    throw new SteamApiError(
      "upstream_http_error",
      `Steam request failed after retries: ${String(lastError)}`,
    );
  }

  private getBackoffDelay(attempt: number): number {
    const base = 500 * 2 ** attempt;
    const jitter = Math.floor(Math.random() * 250);
    return base + jitter;
  }
}
