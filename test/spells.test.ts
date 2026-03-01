import { describe, expect, test } from "vitest";
import { resolveSpellsData } from "../src/normalize/spells.js";
import type { NormalizedAttribute } from "../src/normalize/types.js";

function attr(
  defindex: number,
  value: number,
  decodedValue: string | null = null,
): NormalizedAttribute {
  return {
    defindex,
    name: null,
    attributeClass: null,
    storedAsInteger: false,
    lookupTable: null,
    decodedValue,
    floatValue: value,
    value,
    rawValue: value,
  };
}

describe("spells normalization", () => {
  test("maps localized spell tokens to friendly names", () => {
    const spells = resolveSpellsData([
      attr(1004, 2, "#TF_HalloweenSpell_Paint_2_Attr"),
      attr(1005, 8421376, "#TF_HalloweenSpell_Footprints_8421376_Attr"),
    ]);

    expect(spells.paint).toBe("Die Job");
    expect(spells.footsteps).toBe("Gangreen Footprints");
  });

  test("keeps unknown spell token values unchanged", () => {
    const spells = resolveSpellsData([attr(1004, 1, "#TF_HalloweenSpell_Paint_999_Attr")]);
    expect(spells.paint).toBe("#TF_HalloweenSpell_Paint_999_Attr");
  });
});
