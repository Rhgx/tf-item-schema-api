import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { filterInventoryItems, type InventoryFilterOptions, stripRawFromInventory } from "../../filters/inventory.js";
import { compactInventoryItems } from "../../presentation/compact.js";
import type { InventoryServiceLike } from "../../service/inventoryService.js";

const paramsSchema = z.object({
  target: z.string().min(1, "target is required"),
});

const csvStringSchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
    }
    return value;
  },
  z.array(z.string().min(1)).optional(),
);

const csvIntSchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) => Number(part));
    }
    return value;
  },
  z.array(z.number().int()).optional(),
);

const booleanQuerySchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const lower = value.trim().toLowerCase();
      if (lower === "true" || lower === "1") {
        return true;
      }
      if (lower === "false" || lower === "0") {
        return false;
      }
    }
    return value;
  },
  z.boolean().optional(),
);

const querySchema = z.object({
  language: z.string().min(2).max(16).optional().default("en"),
  view: z.enum(["full", "compact"]).optional().default("full"),
  includeRaw: booleanQuerySchema.default(false),
  defindex: csvIntSchema,
  qualityId: csvIntSchema,
  quality: csvStringSchema,
  name: z.string().min(1).optional(),
  attributeDefindex: csvIntSchema,
  attributeName: z.string().min(1).optional(),
  attributeClass: z.string().min(1).optional(),
  attributeDecodedValue: z.string().min(1).optional(),
  isStrange: booleanQuerySchema,
  isUnusual: booleanQuerySchema,
  isCrate: booleanQuerySchema,
  isCommunityCrate: booleanQuerySchema,
  isFestivized: booleanQuerySchema,
  isCraftable: booleanQuerySchema,
  isTradable: booleanQuerySchema,
  crateSeries: csvIntSchema,
  hasPaintkit: booleanQuerySchema,
  minLevel: z.coerce.number().int().optional(),
  maxLevel: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function registerInventoryRoutes(
  app: FastifyInstance,
  inventoryService: InventoryServiceLike,
): Promise<void> {
  app.get("/v1/inventory/:target", async (request) => {
    const { target } = paramsSchema.parse(request.params);
    const filters = querySchema.parse(request.query);
    const { language, view } = filters;

    const headerValue = request.headers["x-steam-api-key"];
    const apiKey = typeof headerValue === "string" ? headerValue : undefined;

    const result = await inventoryService.getInventory({
      target,
      apiKey,
      language,
      apiKeySource: apiKey ? "header" : "env",
    });

    const filterOptions: InventoryFilterOptions = {
      defindex: filters.defindex,
      qualityId: filters.qualityId,
      quality: filters.quality,
      name: filters.name,
      attributeDefindex: filters.attributeDefindex,
      attributeName: filters.attributeName,
      attributeClass: filters.attributeClass,
      attributeDecodedValue: filters.attributeDecodedValue,
      isStrange: filters.isStrange,
      isUnusual: filters.isUnusual,
      isCrate: filters.isCrate,
      isCommunityCrate: filters.isCommunityCrate,
      isFestivized: filters.isFestivized,
      isCraftable: filters.isCraftable,
      isTradable: filters.isTradable,
      crateSeries: filters.crateSeries,
      hasPaintkit: filters.hasPaintkit,
      minLevel: filters.minLevel,
      maxLevel: filters.maxLevel,
      limit: filters.limit,
      offset: filters.offset,
    };
    const filtered = filterInventoryItems(result.items, filterOptions);

    if (!filters.includeRaw) {
      const resultWithoutRaw = stripRawFromInventory(result);
      const items = view === "compact"
        ? compactInventoryItems(filtered.items.map(({ rawItem: _rawItem, ...item }) => item))
        : filtered.items.map(({ rawItem: _rawItem, ...item }) => item);
      return {
        ...resultWithoutRaw,
        inventory: {
          ...result.inventory,
          totalItems: filtered.totalMatched,
        },
        items,
      };
    }

    const items = view === "compact" ? compactInventoryItems(filtered.items) : filtered.items;
    return {
      ...result,
      inventory: {
        ...result.inventory,
        totalItems: filtered.totalMatched,
      },
      items,
    };
  });
}
