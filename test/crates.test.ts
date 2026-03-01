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
    expect(parsed.possibleUnusualHints).toEqual([]);
    expect(parsed.possibleContentsCollection).toBeNull();
    expect(parsed.possibleContentsItems).toEqual([]);
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
    expect(parsed.possibleUnusualHints).toEqual([]);
    expect(parsed.possibleContentsCollection).toBeNull();
    expect(parsed.possibleContentsItems).toEqual([]);
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
      possibleUnusualHints: [],
      possibleContentsCollection: null,
      possibleContentsItems: [],
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

  test("extracts possible unusual hints and collection items from case descriptions", () => {
    const parsed = resolveCrateData({
      attributes: [],
      localizedName: "Bone-Chilling Bonanza Case",
      communityMetadata: {
        ...emptyCommunity,
        name: "Bone-Chilling Bonanza Case",
        descriptions: [
          {
            type: "html",
            value:
              "This Case is locked and requires a Bone-Chilling Bonanza Key to open. Contains a community made item from the Bone-Chilling Bonanza Collection.",
            color: null,
            label: null,
          },
          {
            type: "html",
            value: "Contents may be Strange and hats may be Unusual with a Halloween 2023 effect",
            color: null,
            label: null,
          },
          { type: "html", value: "Bone-Chilling Bonanza Collection", color: null, label: null },
          { type: "html", value: "Bare Bear Bones", color: null, label: null },
          { type: "html", value: "Demonic Dome", color: null, label: null },
          { type: "html", value: "Power Spike", color: null, label: null },
        ],
        tags: [{ category: "Type", localizedTagName: "Crate", color: null }],
      },
    });

    expect(parsed.possibleUnusualHints).toContain("Halloween 2023");
    expect(parsed.possibleContentsCollection).toBe("Bone-Chilling Bonanza Collection");
    expect(parsed.possibleContentsItems).toEqual(["Bare Bear Bones", "Demonic Dome", "Power Spike"]);
  });

  test("ignores summary/collection lines when extracting possible contents items", () => {
    const parsed = resolveCrateData({
      attributes: [],
      localizedName: "Summer 2023 Cosmetic Case",
      communityMetadata: {
        ...emptyCommunity,
        name: "Summer 2023 Cosmetic Case",
        descriptions: [
          {
            type: "html",
            value:
              "This Case is locked and requires a Summer 2023 Cosmetic Key to open. Contains a community made item from the Summer 2023 Cosmetic Collection.",
            color: null,
            label: null,
          },
          {
            type: "html",
            value: "Contents may be Strange or an Unusual Summer 2023 Hat",
            color: null,
            label: null,
          },
          { type: "html", value: "Summer 2023 Cosmetic Collection", color: null, label: null },
          { type: "html", value: "Cranium Cooler", color: null, label: null },
          { type: "html", value: "The Filamental", color: null, label: null },
        ],
        tags: [{ category: "Type", localizedTagName: "Crate", color: null }],
      },
    });

    expect(parsed.possibleContentsCollection).toBe("Summer 2023 Cosmetic Collection");
    expect(parsed.possibleContentsItems).toEqual(["Cranium Cooler", "The Filamental"]);
  });
});
