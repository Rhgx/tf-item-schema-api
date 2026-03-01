import { describe, expect, test } from "vitest";
import { buildDisplayName, inferPaintkitNameFromMetadata } from "../src/normalize/naming.js";
import type { CommunityItemMetadata } from "../src/normalize/types.js";

describe("naming", () => {
  test("includes original name when custom name exists", () => {
    const display = buildDisplayName({
      localizedName: "Rocket Launcher",
      customName: "BANANA CANNON",
      communityName: null,
      communityMarketHashName: "Strange Rocket Launcher",
      qualityName: "Strange",
      killstreakTier: 0,
      isFestivized: false,
      paintkitId: null,
      paintkitName: null,
    });

    expect(display).toContain("\"BANANA CANNON\"");
    expect(display).toContain("Strange Rocket Launcher");
  });

  test("infers paintkit name from market hash", () => {
    const metadata: CommunityItemMetadata = {
      assetId: "1",
      name: "Strange Team Serviced Rocket Launcher",
      marketHashName: "Strange Team Serviced Rocket Launcher (Field-Tested)",
      type: null,
      iconUrl: null,
      iconUrlLarge: null,
      tags: [],
      descriptions: [],
    };

    expect(inferPaintkitNameFromMetadata(metadata, "Rocket Launcher")).toBe("Team Serviced");
  });

  test("strips extended quality prefixes from market hash", () => {
    const metadata: CommunityItemMetadata = {
      assetId: "1",
      name: "Self-Made Professional Killstreak Team Serviced Rocket Launcher",
      marketHashName:
        "Self-Made Professional Killstreak Team Serviced Rocket Launcher (Factory New)",
      type: null,
      iconUrl: null,
      iconUrlLarge: null,
      tags: [],
      descriptions: [],
    };

    expect(inferPaintkitNameFromMetadata(metadata, "Rocket Launcher")).toBe("Team Serviced");
  });
});
