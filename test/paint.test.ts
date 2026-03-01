import { describe, expect, test } from "vitest";
import { resolvePaintData } from "../src/normalize/paint.js";
import type { NormalizedAttribute } from "../src/normalize/types.js";

function attr(defindex: number, value: number): NormalizedAttribute {
  return {
    defindex,
    name: null,
    attributeClass: null,
    storedAsInteger: false,
    lookupTable: null,
    decodedValue: null,
    floatValue: value,
    value,
    rawValue: value,
  };
}

describe("paint normalization", () => {
  test("maps Australium Gold correctly from RGB value", () => {
    const result = resolvePaintData([attr(142, 15185211), attr(261, 15185211)]);
    expect(result.rgbPrimary).toBe("#E7B53B");
    expect(result.primaryName).toBe("Australium Gold");
    expect(result.rgbSecondary).toBe("#E7B53B");
    expect(result.secondaryName).toBe("Australium Gold");
  });

  test("maps team-color paints with side labels", () => {
    const result = resolvePaintData([attr(142, 6637376), attr(261, 2636109)]);
    expect(result.rgbPrimary).toBe("#654740");
    expect(result.primaryName).toBe("An Air of Debonair (RED)");
    expect(result.rgbSecondary).toBe("#28394D");
    expect(result.secondaryName).toBe("An Air of Debonair (BLU)");
  });
});
