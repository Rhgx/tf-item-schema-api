import { describe, expect, test } from "vitest";
import { resolveCrateData } from "../src/normalize/crates.js";
import type { CommunityItemMetadata, NormalizedAttribute } from "../src/normalize/types.js";

const emptyCommunity: CommunityItemMetadata = {
  assetId: "x",
  name: null,
  marketHashName: null,
  type: null,
  iconUrl: null,
  iconUrlLarge: null,
  tags: [],
  descriptions: [],
};

describe("crate parsing", () => {
  test("parses supply crate series from attribute 187", () => {
    const attributes: NormalizedAttribute[] = [
      {
        defindex: 187,
        name: "set supply crate series",
        attributeClass: null,
        storedAsInteger: true,
        lookupTable: null,
        decodedValue: null,
        floatValue: 50,
        value: 50,
        rawValue: 50,
      },
    ];

    const parsed = resolveCrateData({
      attributes,
      localizedName: "Mann Co. Supply Crate",
      communityMetadata: emptyCommunity,
    });

    expect(parsed.isCrate).toBe(true);
    expect(parsed.isCommunityCrate).toBe(false);
    expect(parsed.crateSeries).toBe(50);
    expect(parsed.crateType).toBe("Mann Co. Supply Crate");
  });

  test("parses community crate from case type and description series", () => {
    const parsed = resolveCrateData({
      attributes: [],
      localizedName: "Winter 2024 Cosmetic Case",
      communityMetadata: {
        ...emptyCommunity,
        type: "Cosmetic Case",
        descriptions: [{ type: "html", value: "Series #124", color: null, label: null }],
        tags: [{ category: "Type", localizedTagName: "Cosmetic Case", color: null }],
      },
    });

    expect(parsed.isCrate).toBe(true);
    expect(parsed.isCommunityCrate).toBe(true);
    expect(parsed.crateSeries).toBe(124);
    expect(parsed.crateType).toBe("Cosmetic Case");
  });

  test("does not mark regular weapon as crate", () => {
    const parsed = resolveCrateData({
      attributes: [],
      localizedName: "Rocket Launcher",
      communityMetadata: emptyCommunity,
    });

    expect(parsed).toEqual({
      isCrate: false,
      isCommunityCrate: false,
      crateSeries: null,
      crateType: null,
    });
  });

  test("does not parse killstreak tier attr (2025) as crate series", () => {
    const parsed = resolveCrateData({
      attributes: [
        {
          defindex: 2025,
          name: "killstreak tier",
          attributeClass: "killstreak_tier",
          storedAsInteger: false,
          lookupTable: null,
          decodedValue: null,
          floatValue: 3,
          value: 3,
          rawValue: 1077936128,
        },
      ],
      localizedName: "Rocket Launcher",
      communityMetadata: emptyCommunity,
    });

    expect(parsed.crateSeries).toBeNull();
    expect(parsed.isCrate).toBe(false);
  });
});
