import type { NormalizedAttribute } from "./types.js";

const PAINT_NAME_BY_HEX: Record<string, string[]> = {
  "#141414": ["A Distinctive Lack of Hue"],
  "#2F4F4F": ["An Extraordinary Abundance of Tinge"],
  "#7E7E7E": ["Aged Moustache Grey"],
  "#38F3AB": ["A Mann's Mint"],
  "#E6E6E6": ["Australium Gold"],
  "#723A3A": ["After Eight"],
  "#D8BED8": ["Color No. 216-190-216", "Noble Hatter's Violet"],
  "#2D2D24": ["Dark Salmon Injustice"],
  "#C36C2D": ["Cream Spirit", "Cream Spirit (RED)"],
  "#808000": ["Drably Olive"],
  "#CF7336": ["Indubitably Green"],
  "#729E42": ["Muskelmannbraun"],
  "#7D4071": ["Noble Hatter's Violet"],
  "#A89A8C": ["Peculiarly Drab Tincture", "Waterlogged Lab Coat (RED)"],
  "#7C6C57": ["Radigan Conagher Brown"],
  "#424F3B": ["The Bitter Taste of Defeat and Lime"],
  "#BCBDBD": ["The Color of a Gentlemann's Business Pants"],
  "#654740": ["The Value of Teamwork (RED)"],
  "#256D8D": ["The Value of Teamwork (BLU)"],
  "#C5AF91": ["Ye Olde Rustic Colour"],
  "#58AA84": ["Zepheniah's Greed"],
  "#B8383B": ["Team Spirit (RED)"],
  "#5885A2": ["Team Spirit (BLU)"],
  "#28394D": ["An Air of Debonair (BLU)"],
  "#18233D": ["Balaclavas Are Forever (BLU)"],
  "#3B1F23": ["Balaclavas Are Forever (RED)"],
  "#E7E7CB": ["An Air of Debonair (RED)"],
  "#B88035": ["Cream Spirit (BLU)"],
  "#839FA3": ["Waterlogged Lab Coat (BLU)"],
  "#384248": ["Operator's Overalls (BLU)"],
  "#483838": ["Operator's Overalls (RED)"],
};

function readNumericAttribute(attributes: NormalizedAttribute[], defindex: number): number | null {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return null;
  }
  const value = Number(attribute.value);
  return Number.isFinite(value) ? value : null;
}

function readIntegerAttribute(attributes: NormalizedAttribute[], defindex: number): number | null {
  const value = readNumericAttribute(attributes, defindex);
  if (value === null) {
    return null;
  }
  const normalized = Math.trunc(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function toColorHex(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  const normalized = value & 0x00ffffff;
  if (!Number.isFinite(normalized)) {
    return null;
  }
  return `#${normalized.toString(16).padStart(6, "0").toUpperCase()}`;
}

function resolvePaintName(hex: string | null): string | null {
  if (!hex) {
    return null;
  }
  const names = PAINT_NAME_BY_HEX[hex];
  if (!names || names.length === 0) {
    return null;
  }
  return names.join(" / ");
}

export function resolvePaintData(attributes: NormalizedAttribute[]): {
  rgbPrimary: string | null;
  rgbSecondary: string | null;
  primaryName: string | null;
  secondaryName: string | null;
  styleOverride: number | null;
  textureWear: number | null;
  textureWearDefault: number | null;
  seedLow: number | null;
  seedHigh: number | null;
} {
  const rgbPrimary = toColorHex(readIntegerAttribute(attributes, 142));
  const rgbSecondary = toColorHex(readIntegerAttribute(attributes, 261));

  return {
    rgbPrimary,
    rgbSecondary,
    primaryName: resolvePaintName(rgbPrimary),
    secondaryName: resolvePaintName(rgbSecondary),
    styleOverride: readIntegerAttribute(attributes, 542),
    textureWear: readNumericAttribute(attributes, 725),
    textureWearDefault: readNumericAttribute(attributes, 749),
    seedLow: readIntegerAttribute(attributes, 866),
    seedHigh: readIntegerAttribute(attributes, 867),
  };
}
