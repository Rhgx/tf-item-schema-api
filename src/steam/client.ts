import type { RawInventoryItem, SteamPlayerItemsResult } from "../normalize/types.js";
import { SteamApiError } from "./errors.js";
import type { SteamProvider } from "./provider.js";
import type { SteamPlayerSummary, SteamSchemaItemsPage } from "./types.js";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export class SteamApiClient {
  constructor(private readonly provider: SteamProvider) {}

  async getPlayerItems(steamId: string, apiKey: string): Promise<SteamPlayerItemsResult> {
    const payload = await this.provider.getPlayerItemsRaw(apiKey, steamId);
    const payloadObj = asRecord(payload);
    const result = asRecord(payloadObj.result);
    const status = Number(result.status ?? 0);

    if (status === 8) {
      throw new SteamApiError("invalid_key", "Invalid Steam API key (status=8).");
    }

    if (status === 15) {
      throw new SteamApiError("private_inventory", "Target inventory is private or unavailable (status=15).");
    }

    if (status !== 1) {
      throw new SteamApiError("response_parse_error", `Unexpected player items status=${status}.`);
    }

    const rawItems = asArray(result.items);
    const items: RawInventoryItem[] = rawItems
      .map((entry) => normalizeRawInventoryItem(asRecord(entry)))
      .filter((entry): entry is RawInventoryItem => entry !== null);

    return {
      status,
      numBackpackSlots: Number(result.num_backpack_slots ?? 0),
      items,
    };
  }

  async getSchema(apiKey: string, language = "en"): Promise<Record<string, unknown>> {
    const overviewPayload = await this.provider.getSchemaOverviewRaw(apiKey, language);
    const overviewObj = asRecord(overviewPayload);
    const overviewResult = asRecord(overviewObj.result);
    const overviewStatus = Number(overviewResult.status ?? 0);

    if (overviewStatus !== 1) {
      throw new SteamApiError(
        "response_parse_error",
        `Unexpected schema overview status=${overviewStatus}.`,
      );
    }

    const pageItems: unknown[] = [];
    let start = 0;
    const visitedStarts = new Set<number>();

    for (let page = 0; page < 120; page += 1) {
      if (visitedStarts.has(start)) {
        break;
      }
      visitedStarts.add(start);

      const itemsPayload = await this.provider.getSchemaItemsRaw(apiKey, start, language);
      const itemsObj = asRecord(itemsPayload);
      const itemsResult = asRecord(itemsObj.result);
      const itemsStatus = Number(itemsResult.status ?? 0);

      if (itemsStatus !== 1) {
        throw new SteamApiError(
          "response_parse_error",
          `Unexpected schema items status=${itemsStatus} (start=${start}).`,
        );
      }

      pageItems.push(...asArray(itemsResult.items));

      const nextRaw = itemsResult.next;
      const next = Number(nextRaw ?? 0);
      if (!Number.isFinite(next) || next <= 0 || next <= start) {
        break;
      }
      start = next;
    }

    const deduped = new Map<number, Record<string, unknown>>();
    for (const entry of pageItems) {
      const record = asRecord(entry);
      const defindex = Number(record.defindex ?? NaN);
      if (!Number.isFinite(defindex)) {
        continue;
      }
      deduped.set(defindex, record);
    }

    const merged: Record<string, unknown> = {
      ...overviewResult,
      items: [...deduped.values()],
    };

    if (!Array.isArray(merged.items)) {
      throw new SteamApiError("response_parse_error", "Schema payload missing items array.");
    }

    return merged;
  }

  async getSchemaOverview(apiKey: string, language = "en"): Promise<Record<string, unknown>> {
    const payload = await this.provider.getSchemaOverviewRaw(apiKey, language);
    const payloadObj = asRecord(payload);
    const result = asRecord(payloadObj.result);
    const status = Number(result.status ?? 0);

    if (status !== 1) {
      throw new SteamApiError("response_parse_error", `Unexpected schema overview status=${status}.`);
    }

    return result;
  }

  async getSchemaItemsPage(apiKey: string, start = 0, language = "en"): Promise<SteamSchemaItemsPage> {
    const payload = await this.provider.getSchemaItemsRaw(apiKey, start, language);
    const payloadObj = asRecord(payload);
    const result = asRecord(payloadObj.result);
    const status = Number(result.status ?? 0);

    if (status !== 1) {
      throw new SteamApiError(
        "response_parse_error",
        `Unexpected schema items status=${status} (start=${start}).`,
      );
    }

    const rawItems = asArray(result.items);
    const items = rawItems.map((entry) => asRecord(entry));
    const nextRaw = Number(result.next ?? NaN);

    return {
      status,
      items,
      next: Number.isFinite(nextRaw) && nextRaw > start ? nextRaw : null,
    };
  }

  async getSchemaUrl(apiKey: string): Promise<string> {
    const payload = await this.provider.getSchemaUrlRaw(apiKey);
    const payloadObj = asRecord(payload);
    const result = asRecord(payloadObj.result);
    const status = Number(result.status ?? 0);

    if (status !== 1) {
      throw new SteamApiError("response_parse_error", `Unexpected schema URL status=${status}.`);
    }

    const itemsGameUrl = typeof result.items_game_url === "string" ? result.items_game_url.trim() : "";
    if (!itemsGameUrl) {
      throw new SteamApiError("response_parse_error", "Schema URL response missing items_game_url.");
    }

    return itemsGameUrl;
  }

  async getPlayerSummaries(steamIds: string[], apiKey: string): Promise<SteamPlayerSummary[]> {
    const cleanedSteamIds = steamIds
      .map((steamId) => steamId.trim())
      .filter((steamId) => /^\d{17}$/.test(steamId));

    if (cleanedSteamIds.length === 0) {
      return [];
    }

    if (cleanedSteamIds.length > 100) {
      throw new SteamApiError("response_parse_error", "GetPlayerSummaries supports at most 100 SteamIDs per request.");
    }

    const payload = await this.provider.getPlayerSummariesRaw(apiKey, cleanedSteamIds);
    const payloadObj = asRecord(payload);
    const response = asRecord(payloadObj.response);
    const players = asArray(response.players);

    return players
      .map((entry) => normalizePlayerSummary(asRecord(entry)))
      .filter((entry): entry is SteamPlayerSummary => entry !== null);
  }

  async getPlayerSummary(steamId: string, apiKey: string): Promise<SteamPlayerSummary | null> {
    const summaries = await this.getPlayerSummaries([steamId], apiKey);
    return summaries[0] ?? null;
  }

  async resolveVanityUrl(vanityUrl: string, apiKey: string): Promise<string> {
    const payload = await this.provider.resolveVanityUrlRaw(apiKey, vanityUrl);
    const payloadObj = asRecord(payload);
    const response = asRecord(payloadObj.response);
    const success = Number(response.success ?? 0);
    const steamId = typeof response.steamid === "string" ? response.steamid : null;

    if (success === 1 && steamId && /^\d{17}$/.test(steamId)) {
      return steamId;
    }

    const message = typeof response.message === "string" && response.message ? response.message : "not found";
    throw new SteamApiError(
      "vanity_not_found",
      `Unable to resolve vanity identifier "${vanityUrl}" (${message}).`,
    );
  }
}

function normalizePlayerSummary(raw: Record<string, unknown>): SteamPlayerSummary | null {
  const steamid = typeof raw.steamid === "string" ? raw.steamid : "";
  if (!/^\d{17}$/.test(steamid)) {
    return null;
  }

  const readString = (key: string): string | null => {
    const value = raw[key];
    return typeof value === "string" ? value : null;
  };

  const readNumber = (key: string): number | null => {
    const value = Number(raw[key]);
    return Number.isFinite(value) ? value : null;
  };

  return {
    steamid,
    personaname: readString("personaname"),
    profileurl: readString("profileurl"),
    avatar: readString("avatar"),
    avatarmedium: readString("avatarmedium"),
    avatarfull: readString("avatarfull"),
    communityvisibilitystate: readNumber("communityvisibilitystate"),
    profilestate: readNumber("profilestate"),
    realname: readString("realname"),
    loccountrycode: readString("loccountrycode"),
    timecreated: readNumber("timecreated"),
  };
}

function readOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeEquipped(value: unknown): RawInventoryItem["equipped"] {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const equipped = value
    .map((entry) => {
      const row = asRecord(entry);
      const classId = readOptionalNumber(row.class ?? row.class_id ?? row.classid);
      const slot = readOptionalNumber(row.slot ?? row.slot_id ?? row.slotid);

      return {
        ...row,
        class: classId,
        slot,
      };
    })
    .filter((entry) => entry.class !== undefined || entry.slot !== undefined);

  return equipped.length > 0 ? equipped : undefined;
}

function normalizeContainedItem(value: unknown): RawInventoryItem["contained_item"] {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const row = asRecord(value);
  const idRaw = row.id;
  const id = idRaw === undefined || idRaw === null ? undefined : String(idRaw);

  const normalized: RawInventoryItem["contained_item"] = {
    ...row,
    id,
    defindex: readOptionalNumber(row.defindex),
    quality: readOptionalNumber(row.quality),
    level: readOptionalNumber(row.level),
    quantity: readOptionalNumber(row.quantity),
  };

  if (
    normalized.id === undefined &&
    normalized.defindex === undefined &&
    normalized.quality === undefined &&
    normalized.level === undefined &&
    normalized.quantity === undefined
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeRawInventoryItem(raw: Record<string, unknown>): RawInventoryItem | null {
  const defindex = Number(raw.defindex ?? NaN);
  const idRaw = raw.id;

  if (!Number.isFinite(defindex) || idRaw === undefined || idRaw === null) {
    return null;
  }

  const attributesRaw = Array.isArray(raw.attributes) ? raw.attributes : [];
  const attributes = attributesRaw
    .map((attributeEntry) => {
      const attribute = asRecord(attributeEntry);
      const attributeDefindex = Number(attribute.defindex ?? NaN);
      if (!Number.isFinite(attributeDefindex)) {
        return null;
      }
      const floatValue = Number(attribute.float_value ?? attribute.value ?? 0);
      return {
        ...attribute,
        defindex: attributeDefindex,
        float_value: Number.isFinite(floatValue) ? floatValue : 0,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    ...raw,
    id: String(idRaw),
    defindex,
    original_id: raw.original_id === undefined || raw.original_id === null ? undefined : String(raw.original_id),
    quantity: readOptionalNumber(raw.quantity),
    origin: readOptionalNumber(raw.origin),
    custom_desc: readOptionalString(raw.custom_desc),
    style: readOptionalNumber(raw.style),
    level: readOptionalNumber(raw.level),
    quality: readOptionalNumber(raw.quality),
    custom_name: readOptionalString(raw.custom_name),
    item_name: readOptionalString(raw.item_name),
    equipped: normalizeEquipped(raw.equipped),
    contained_item: normalizeContainedItem(raw.contained_item),
    account_info: raw.account_info && typeof raw.account_info === "object" ? asRecord(raw.account_info) : undefined,
    attributes,
  };
}
