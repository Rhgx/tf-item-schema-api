import type { ResolvedFrom, ResolvedTarget } from "../normalize/types.js";

export interface VanityResolver {
  resolveVanityUrl(vanityUrl: string, apiKey: string): Promise<string>;
}

const VANITY_RE = /^[a-zA-Z0-9_-]{2,64}$/;

export interface ParsedTargetInput {
  raw: string;
  steamId: string | null;
  vanity: string | null;
  resolvedFromHint: ResolvedFrom;
}

export function validateSteamId64(value: string): boolean {
  return /^\d{17}$/.test(value);
}

export function parseTargetInput(rawValue: string): ParsedTargetInput {
  const raw = rawValue.trim();
  if (!raw) {
    throw new Error("Target cannot be empty.");
  }

  if (validateSteamId64(raw)) {
    return { raw, steamId: raw, vanity: null, resolvedFromHint: "steamid64" };
  }

  try {
    const url = new URL(raw);
    if (url.hostname.toLowerCase().endsWith("steamcommunity.com")) {
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments[0]?.toLowerCase() === "profiles" && segments[1] && validateSteamId64(segments[1])) {
        return { raw, steamId: segments[1], vanity: null, resolvedFromHint: "url" };
      }
      if (segments[0]?.toLowerCase() === "id" && segments[1]) {
        return { raw, steamId: null, vanity: segments[1], resolvedFromHint: "url" };
      }
    }
  } catch {
    // Not a URL; parse as possible vanity name.
  }

  if (VANITY_RE.test(raw)) {
    return { raw, steamId: null, vanity: raw, resolvedFromHint: "vanity" };
  }

  throw new Error(`Invalid target "${raw}". Use SteamID64, vanity ID, or steamcommunity URL.`);
}

export async function resolveTargetInput(
  rawTarget: string,
  steamApiClient: VanityResolver,
  apiKey: string,
): Promise<ResolvedTarget> {
  const parsed = parseTargetInput(rawTarget);

  if (parsed.steamId) {
    return {
      input: rawTarget,
      steamId: parsed.steamId,
      resolvedFrom: parsed.resolvedFromHint,
    };
  }

  if (!parsed.vanity) {
    throw new Error(`Could not parse target input "${rawTarget}".`);
  }

  const steamId = await steamApiClient.resolveVanityUrl(parsed.vanity, apiKey);
  return {
    input: rawTarget,
    steamId,
    resolvedFrom: parsed.resolvedFromHint,
  };
}
