import type { NormalizedAttribute } from "./types.js";

function readSpellBoolean(attributes: NormalizedAttribute[], defindex: number): boolean {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return false;
  }
  return Number(attribute.value) > 0;
}

function readSpellLookup(attributes: NormalizedAttribute[], defindex: number): string | null {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return null;
  }
  return attribute.decodedValue ?? null;
}

function collectSpellbookPages(attributes: NormalizedAttribute[]): string[] {
  const pageDefindexes = new Set([2016, 2017, 2018, 2019, 2020]);
  const pages = attributes
    .filter((attribute) => pageDefindexes.has(attribute.defindex) && Number(attribute.value) > 0)
    .map((attribute) => attribute.name ?? `Spellbook Page ${attribute.defindex}`);

  return [...new Set(pages)];
}

export function resolveSpellsData(attributes: NormalizedAttribute[]): {
  paint: string | null;
  footsteps: string | null;
  voices: boolean;
  pumpkinBombs: boolean;
  greenFlames: boolean;
  deathGhosts: boolean;
  spellbookPages: string[];
} {
  return {
    paint: readSpellLookup(attributes, 1004),
    footsteps: readSpellLookup(attributes, 1005),
    voices: readSpellBoolean(attributes, 1006),
    pumpkinBombs: readSpellBoolean(attributes, 1007),
    greenFlames: readSpellBoolean(attributes, 1008),
    deathGhosts: readSpellBoolean(attributes, 1009),
    spellbookPages: collectSpellbookPages(attributes),
  };
}
