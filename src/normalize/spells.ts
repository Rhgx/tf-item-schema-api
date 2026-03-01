import type { NormalizedAttribute } from "./types.js";

const SPELL_TOKEN_TO_NAME: Record<string, string> = {
  TF_HalloweenSpell_Paint_1_Attr: "Putrescent Pigmentation",
  TF_HalloweenSpell_Paint_2_Attr: "Die Job",
  TF_HalloweenSpell_Paint_3_Attr: "Chromatic Corruption",
  TF_HalloweenSpell_Paint_4_Attr: "Spectral Spectrum",
  TF_HalloweenSpell_Paint_5_Attr: "Sinister Staining",
  TF_HalloweenSpell_Footprints_1_Attr: "Team Spirit Footprints",
  TF_HalloweenSpell_Footprints_2_Attr: "Headless Horseshoes",
  TF_HalloweenSpell_Footprints_8421376_Attr: "Gangreen Footprints",
  TF_HalloweenSpell_Footprints_3100495_Attr: "Corpse Gray Footprints",
  TF_HalloweenSpell_Footprints_5322826_Attr: "Violent Violet Footprints",
  TF_HalloweenSpell_Footprints_13595446_Attr: "Rotten Orange Footprints",
  TF_HalloweenSpell_Footprints_8208497_Attr: "Bruised Purple Footprints",
};

function readSpellBoolean(attributes: NormalizedAttribute[], defindex: number): boolean {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return false;
  }
  return Number(attribute.value) > 0;
}

function decodeSpellToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.startsWith("#") ? value.slice(1) : value;
  return SPELL_TOKEN_TO_NAME[normalized] ?? value;
}

function readSpellLookup(attributes: NormalizedAttribute[], defindex: number): string | null {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return null;
  }
  return decodeSpellToken(attribute.decodedValue ?? null);
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
