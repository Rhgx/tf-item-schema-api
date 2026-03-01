export type SteamApiErrorKind =
  | "invalid_key"
  | "private_inventory"
  | "vanity_not_found"
  | "rate_limited"
  | "upstream_http_error"
  | "response_parse_error";

export class SteamApiError extends Error {
  public readonly kind: SteamApiErrorKind;
  public readonly statusCode?: number;

  constructor(kind: SteamApiErrorKind, message: string, statusCode?: number) {
    super(message);
    this.name = "SteamApiError";
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

export function isSteamApiError(value: unknown): value is SteamApiError {
  return value instanceof SteamApiError;
}
