import { describe, expect, test } from "vitest";
import { parseTargetInput, validateSteamId64 } from "../src/target/parse.js";

describe("target parser", () => {
  test("validates steam64 ids", () => {
    expect(validateSteamId64("76561198012345678")).toBe(true);
    expect(validateSteamId64("123")).toBe(false);
  });

  test("parses direct steam64", () => {
    const parsed = parseTargetInput("76561198012345678");
    expect(parsed.steamId).toBe("76561198012345678");
    expect(parsed.resolvedFromHint).toBe("steamid64");
  });

  test("parses vanity", () => {
    const parsed = parseTargetInput("gaben");
    expect(parsed.vanity).toBe("gaben");
    expect(parsed.resolvedFromHint).toBe("vanity");
  });

  test("parses profile URL with vanity id", () => {
    const parsed = parseTargetInput("https://steamcommunity.com/id/gaben/");
    expect(parsed.vanity).toBe("gaben");
    expect(parsed.resolvedFromHint).toBe("url");
  });

  test("parses profile URL with steam64", () => {
    const parsed = parseTargetInput("https://steamcommunity.com/profiles/76561198012345678");
    expect(parsed.steamId).toBe("76561198012345678");
    expect(parsed.resolvedFromHint).toBe("url");
  });

  test("rejects invalid target", () => {
    expect(() => parseTargetInput("!!invalid!!")).toThrow(/Invalid target/);
  });
});
