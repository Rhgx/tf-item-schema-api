import { describe, expect, test } from "vitest";
import { SteamApiClient } from "../src/steam/client.js";
import { SteamApiError } from "../src/steam/errors.js";
import type { SteamProvider } from "../src/steam/provider.js";

class FakeProvider implements SteamProvider {
  constructor(
    private readonly playerItemsPayload: unknown = { result: { status: 1, items: [] } },
    private readonly schemaOverviewPayload: unknown = { result: { status: 1, items: [] } },
    private readonly schemaItemsPayload: unknown = { result: { status: 1, items: [], next: 0 } },
    private readonly schemaUrlPayload: unknown = { result: { status: 1, items_game_url: "https://example.test/items_game.txt" } },
    private readonly vanityPayload: unknown = { response: { success: 1, steamid: "76561198012345678" } },
    private readonly summariesPayload: unknown = { response: { players: [] } },
  ) {}

  async getPlayerItemsRaw(): Promise<unknown> {
    return this.playerItemsPayload;
  }

  async getSchemaOverviewRaw(): Promise<unknown> {
    return this.schemaOverviewPayload;
  }

  async getSchemaItemsRaw(): Promise<unknown> {
    return this.schemaItemsPayload;
  }

  async getSchemaUrlRaw(): Promise<unknown> {
    return this.schemaUrlPayload;
  }

  async getPlayerSummariesRaw(): Promise<unknown> {
    return this.summariesPayload;
  }

  async resolveVanityUrlRaw(): Promise<unknown> {
    return this.vanityPayload;
  }
}

describe("SteamApiClient extended methods", () => {
  test("parses extended GetPlayerItems fields", async () => {
    const client = new SteamApiClient(
      new FakeProvider({
        result: {
          status: 1,
          items: [
            {
              id: "123",
              defindex: 205,
              original_id: "122",
              quantity: 3,
              origin: 3,
              custom_desc: "Signed by someone",
              style: 1,
              equipped: [{ class: 3, slot: 0 }],
              contained_item: { id: "999", defindex: 5022, quality: 6, quantity: 1 },
              account_info: { persona: "Tester" },
              attributes: [{ defindex: 214, value: 120 }],
            },
          ],
        },
      }),
    );

    const result = await client.getPlayerItems("76561198012345678", "key");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.original_id).toBe("122");
    expect(result.items[0]?.quantity).toBe(3);
    expect(result.items[0]?.origin).toBe(3);
    expect(result.items[0]?.custom_desc).toBe("Signed by someone");
    expect(result.items[0]?.style).toBe(1);
    expect(result.items[0]?.equipped?.[0]?.class).toBe(3);
    expect(result.items[0]?.contained_item?.defindex).toBe(5022);
  });

  test("returns schema URL", async () => {
    const client = new SteamApiClient(new FakeProvider());
    await expect(client.getSchemaUrl("key")).resolves.toBe("https://example.test/items_game.txt");
  });

  test("maps player summaries payload", async () => {
    const client = new SteamApiClient(
      new FakeProvider(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          response: {
            players: [
              {
                steamid: "76561198012345678",
                personaname: "test",
                profileurl: "https://steamcommunity.com/profiles/76561198012345678/",
              },
            ],
          },
        },
      ),
    );

    const summaries = await client.getPlayerSummaries(["76561198012345678"], "key");
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.personaname).toBe("test");
  });

  test("fails when requesting too many summaries", async () => {
    const ids = new Array(101).fill("76561198012345678");
    const client = new SteamApiClient(new FakeProvider());
    await expect(client.getPlayerSummaries(ids, "key")).rejects.toBeInstanceOf(SteamApiError);
  });
});
