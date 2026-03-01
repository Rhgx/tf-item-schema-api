import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ ok: true }));
  app.get("/v1/health", async () => ({ ok: true }));
}
