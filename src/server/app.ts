import fastify, { type FastifyInstance } from "fastify";
import { SchemaCache } from "../schema/cache.js";
import { createInventoryService, type InventoryServiceLike } from "../service/inventoryService.js";
import { SteamApiClient } from "../steam/client.js";
import { CommunityInventoryClient } from "../steam/communityInventory.js";
import { EconItems440Provider } from "../steam/provider.js";
import { registerErrorHandler } from "./errorHandler.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerInventoryRoutes } from "./routes/inventory.js";

export interface AppOptions {
  service?: InventoryServiceLike;
}

export async function createApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: false,
  });

  const steamApiClient = new SteamApiClient(new EconItems440Provider());
  const schemaCache = new SchemaCache(steamApiClient);
  const service = options.service ?? createInventoryService({
    steamApiClient,
    schemaCache,
    communityInventoryClient: new CommunityInventoryClient(),
  });

  registerErrorHandler(app);
  await registerHealthRoutes(app);
  await registerInventoryRoutes(app, service);

  return app;
}
