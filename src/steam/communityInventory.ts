import type {
  CommunityDescriptionLine,
  CommunityItemMetadata,
  CommunityTag,
} from "../normalize/types.js";

interface CommunityInventoryResponse {
  assets?: CommunityInventoryAsset[];
  descriptions?: CommunityInventoryDescription[];
  more_items?: boolean;
  last_assetid?: string;
}

interface CommunityInventoryAsset {
  assetid?: string;
  classid?: string;
  instanceid?: string;
}

interface CommunityInventoryDescription {
  classid?: string;
  instanceid?: string;
  name?: string;
  market_hash_name?: string;
  type?: string;
  icon_url?: string;
  icon_url_large?: string;
  tags?: Array<{
    category?: string;
    localized_tag_name?: string;
    color?: string;
  }>;
  descriptions?: Array<{
    type?: string;
    value?: string;
    color?: string;
    label?: string;
  }>;
}

function toCommunityIconUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://community.akamai.steamstatic.com/economy/image/${trimmed}`;
}

function toCommunityLanguage(language: string): string {
  const normalized = language.trim().toLowerCase();
  if (!normalized || normalized === "en") {
    return "english";
  }

  const map: Record<string, string> = {
    tr: "turkish",
    de: "german",
    fr: "french",
    es: "spanish",
    ru: "russian",
    pl: "polish",
    it: "italian",
    ja: "japanese",
    ko: "koreana",
    zh: "schinese",
    "zh-cn": "schinese",
    "zh-tw": "tchinese",
    pt: "portuguese",
    "pt-br": "brazilian",
  };

  return map[normalized] ?? "english";
}

function safeTag(tag: unknown): CommunityTag | null {
  if (!tag || typeof tag !== "object") {
    return null;
  }
  const row = tag as Record<string, unknown>;
  if (typeof row.category !== "string" || typeof row.localized_tag_name !== "string") {
    return null;
  }
  return {
    category: row.category,
    localizedTagName: row.localized_tag_name,
    color: typeof row.color === "string" ? row.color : null,
  };
}

function safeDescriptionLine(value: unknown): CommunityDescriptionLine | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.value !== "string") {
    return null;
  }
  return {
    type: typeof row.type === "string" ? row.type : null,
    value: row.value,
    color: typeof row.color === "string" ? row.color : null,
    label: typeof row.label === "string" ? row.label : null,
  };
}

export class CommunityInventoryClient {
  async getItemMetadataByAssetId(steamId: string, language = "en"): Promise<Map<string, CommunityItemMetadata>> {
    const communityLanguage = toCommunityLanguage(language);
    const byAssetId = new Map<string, CommunityItemMetadata>();
    let startAssetId: string | null = null;
    let pages = 0;

    while (pages < 10) {
      pages += 1;
      const url = new URL(`https://steamcommunity.com/inventory/${steamId}/440/2`);
      url.searchParams.set("l", communityLanguage);
      url.searchParams.set("count", "2000");
      if (startAssetId) {
        url.searchParams.set("start_assetid", startAssetId);
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": "tf-item-schema-api/0.1.0",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Community inventory request failed (HTTP ${response.status}).`);
      }

      const payload = (await response.json()) as CommunityInventoryResponse;
      const descriptions = Array.isArray(payload.descriptions) ? payload.descriptions : [];
      const assets = Array.isArray(payload.assets) ? payload.assets : [];

      const byClassInstance = new Map<string, CommunityInventoryDescription>();
      for (const description of descriptions) {
        const classId = description.classid;
        const instanceId = description.instanceid;
        if (!classId || !instanceId) {
          continue;
        }
        byClassInstance.set(`${classId}:${instanceId}`, description);
      }

      for (const asset of assets) {
        const assetId = asset.assetid;
        const classId = asset.classid;
        const instanceId = asset.instanceid;
        if (!assetId || !classId || !instanceId) {
          continue;
        }

        const description = byClassInstance.get(`${classId}:${instanceId}`);
        const tags = Array.isArray(description?.tags)
          ? description.tags
              .map((tag) => safeTag(tag))
              .filter((tag): tag is CommunityTag => tag !== null)
          : [];

        const lines = Array.isArray(description?.descriptions)
          ? description.descriptions
              .map((line) => safeDescriptionLine(line))
              .filter((line): line is CommunityDescriptionLine => line !== null)
          : [];

        byAssetId.set(assetId, {
          assetId,
          name: typeof description?.name === "string" ? description.name : null,
          marketHashName:
            typeof description?.market_hash_name === "string" ? description.market_hash_name : null,
          type: typeof description?.type === "string" ? description.type : null,
          iconUrl: toCommunityIconUrl(description?.icon_url),
          iconUrlLarge: toCommunityIconUrl(description?.icon_url_large),
          tags,
          descriptions: lines,
        });
      }

      if (!payload.more_items || !payload.last_assetid) {
        break;
      }
      startAssetId = payload.last_assetid;
    }

    return byAssetId;
  }
}
