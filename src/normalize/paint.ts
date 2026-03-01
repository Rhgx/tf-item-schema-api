import type { NormalizedAttribute } from "./types.js";

const PAINT_NAME_BY_HEX: Record<string, string[]> = {
  // Single-color paints
  "#2F4F4F": ["A Color Similar to Slate"],
  "#729E42": ["Indubitably Green"],
  "#7D4071": ["A Deep Commitment to Purple"],
  "#CF7336": ["Mann Co. Orange"],
  "#141414": ["A Distinctive Lack of Hue"],
  "#A57545": ["Muskelmannbraun"],
  "#BCDDB3": ["A Mann's Mint"],
  "#51384A": ["Noble Hatter's Violet"],
  "#2D2D24": ["After Eight"],
  "#C5AF91": ["Peculiarly Drab Tincture"],
  "#7E7E7E": ["Aged Moustache Grey"],
  "#FF69B4": ["Pink as Hell"],
  "#E6E6E6": ["An Extraordinary Abundance of Tinge"],
  "#694D3A": ["Radigan Conagher Brown"],
  "#E7B53B": ["Australium Gold"],
  "#32CD32": ["The Bitter Taste of Defeat and Lime"],
  "#D8BED8": ["Color No. 216-190-216"],
  "#F0E68C": ["The Color of a Gentlemann's Business Pants"],
  "#E9967A": ["Dark Salmon Injustice"],
  "#7C6C57": ["Ye Olde Rustic Colour"],
  "#808000": ["Drably Olive"],
  "#424F3B": ["Zepheniah's Greed", "Zephaniah's Greed"],
  // Team-color paints
  "#654740": ["An Air of Debonair (RED)"],
  "#28394D": ["An Air of Debonair (BLU)"],
  "#B8383B": ["Team Spirit (RED)"],
  "#5885A2": ["Team Spirit (BLU)"],
  "#3B1F23": ["Balaclavas Are Forever (RED)"],
  "#18233D": ["Balaclavas Are Forever (BLU)"],
  "#803020": ["The Value of Teamwork (RED)"],
  "#256D8D": ["The Value of Teamwork (BLU)"],
  "#C36C2D": ["Cream Spirit (RED)"],
  "#B88035": ["Cream Spirit (BLU)"],
  "#A89A8C": ["Waterlogged Lab Coat (RED)"],
  "#839FA3": ["Waterlogged Lab Coat (BLU)"],
  "#483838": ["Operator's Overalls (RED)"],
  "#384248": ["Operator's Overalls (BLU)"],
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
