import { describe, expect, test } from "vitest";
import { buildSchemaCatalog } from "../src/schema/catalog.js";

describe("schema quality parsing", () => {
  test("fills complete fallback quality set when schema qualities are missing", () => {
    const catalog = buildSchemaCatalog({
      items: [],
      attributes: [],
    });

    expect(catalog.qualityNameById[0]).toBe("Normal");
    expect(catalog.qualityNameById[2]).toBe("Rarity2 (Unused)");
    expect(catalog.qualityNameById[4]).toBe("Rarity3 (Unused)");
    expect(catalog.qualityNameById[12]).toBe("Completed (Unused)");
    expect(catalog.qualityNameById[15]).toBe("Decorated");
  });

  test("normalizes known broken schema labels for quality names", () => {
    const catalog = buildSchemaCatalog({
      items: [],
      attributes: [],
      qualityNames: {
        community: "Map",
        strange: "Restriction",
      },
      qualities: {
        community: { value: 7, name: "community" },
        strange: { value: 11, name: "strange" },
      },
    });

    expect(catalog.qualityNameById[7]).toBe("Community");
    expect(catalog.qualityNameById[11]).toBe("Strange");
  });

  test("maps canonical quality codes to display names", () => {
    const catalog = buildSchemaCatalog({
      items: [],
      attributes: [],
      qualities: {
        normal: { value: 0, name: "normal" },
        rarity1: { value: 1, name: "rarity1" },
        developer: { value: 8, name: "developer" },
        paintkitweapon: { value: 15, name: "paintkitweapon" },
      },
    });

    expect(catalog.qualityNameById[0]).toBe("Normal");
    expect(catalog.qualityNameById[1]).toBe("Genuine");
    expect(catalog.qualityNameById[8]).toBe("Valve");
    expect(catalog.qualityNameById[15]).toBe("Decorated");
  });

  test("parses origin names, string lookups, and strange rank sets", () => {
    const catalog = buildSchemaCatalog({
      items: [],
      attributes: [],
      originNames: {
        0: { origin: 0, name: "Timed Drop" },
        3: { origin: 3, name: "Crafted" },
      },
      string_lookups: [
        {
          table_name: "killstreakeffect",
          strings: [{ index: 2002, string: "Fire Horns" }],
        },
      ],
      item_levels: [
        {
          name: "Kills",
          levels: [
            { level: 1, required_score: 0, name: "Strange" },
            { level: 2, required_score: 10, name: "Unremarkable" },
          ],
        },
      ],
    });

    expect(catalog.originNameById[3]).toBe("Crafted");
    expect(catalog.stringLookupsByTable.killstreakeffect?.[2002]).toBe("Fire Horns");
    expect(catalog.strangeRankSets).toHaveLength(1);
    expect(catalog.strangeRankSets[0]?.tiers[1]?.requiredScore).toBe(10);
  });

  test("parses schema item capability metadata", () => {
    const catalog = buildSchemaCatalog({
      items: [
        {
          defindex: 205,
          item_name: "Rocket Launcher",
          used_by_classes: ["Soldier"],
          per_class_loadout_slots: {
            Soldier: ["primary"],
          },
          styles: [
            { name: "Default", skin: 0, selectable: true },
            { name: "Alternate", skin: 1, selectable: true },
          ],
          tool: { type: "paint_can" },
          capabilities: {
            paintable: true,
            nameable: 1,
            can_gift_wrap: true,
          },
        },
      ],
      attributes: [],
    });

    const item = catalog.itemByDefindex[205];
    expect(item?.usedByClasses).toEqual(["Soldier"]);
    expect(item?.perClassLoadoutSlots.Soldier).toEqual(["primary"]);
    expect(item?.styles).toHaveLength(2);
    expect(item?.tool?.type).toBe("paint_can");
    expect(item?.capabilities).toEqual(["can_gift_wrap", "nameable", "paintable"]);
  });

  test("synthesizes per-class loadout slots from item_slot when per_class_loadout_slots is missing", () => {
    const catalog = buildSchemaCatalog({
      items: [
        {
          defindex: 406,
          item_name: "Splendid Screen",
          item_slot: "secondary",
          used_by_classes: ["Demoman"],
        },
      ],
      attributes: [],
    });

    const item = catalog.itemByDefindex[406];
    expect(item?.itemSlot).toBe("secondary");
    expect(item?.usedByClasses).toEqual(["Demoman"]);
    expect(item?.perClassLoadoutSlots).toEqual({
      Demoman: ["secondary"],
    });
  });
});
