import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "node:url";
import { createApp } from "./server/app.js";

dotenvConfig();

export { createTf2ItemsClient, buildInventorySummary, filterInventoryResponse } from "./sdk/client.js";
export { TF2_ATTRIBUTE_DEFINDEX } from "./sdk/constants.js";
export {
  getActiveSpells,
  getCrateMetadata,
  getKillstreakMetadata,
  getPrimaryImageUrl,
  getUnusualMetadata,
  isCraftableItem,
  isTradableItem,
} from "./sdk/selectors.js";

async function startServer(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ port, host });
}

const entryPath = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;

if (entryPath) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
