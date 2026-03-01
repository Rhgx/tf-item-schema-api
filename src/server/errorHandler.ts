import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { isSteamApiError } from "../steam/errors.js";

function mapSteamErrorStatus(kind: string): number {
  switch (kind) {
    case "invalid_key":
      return 401;
    case "private_inventory":
      return 403;
    case "vanity_not_found":
      return 404;
    case "rate_limited":
      return 429;
    case "upstream_http_error":
      return 502;
    case "response_parse_error":
      return 500;
    default:
      return 500;
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          code: "bad_request",
          message: "Request validation failed.",
          details: error.issues,
        },
      });
      return;
    }

    if (isSteamApiError(error)) {
      reply.status(mapSteamErrorStatus(error.kind)).send({
        error: {
          code: error.kind,
          message: error.message,
        },
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Internal server error.";

    reply.status(500).send({
      error: {
        code: "internal_error",
        message,
      },
    });
  });
}
