import type { NormalizedAttribute } from "./types.js";

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

export function resolvePaintData(attributes: NormalizedAttribute[]): {
  rgbPrimary: string | null;
  rgbSecondary: string | null;
  styleOverride: number | null;
  textureWear: number | null;
  textureWearDefault: number | null;
  seedLow: number | null;
  seedHigh: number | null;
} {
  return {
    rgbPrimary: toColorHex(readIntegerAttribute(attributes, 142)),
    rgbSecondary: toColorHex(readIntegerAttribute(attributes, 261)),
    styleOverride: readIntegerAttribute(attributes, 542),
    textureWear: readNumericAttribute(attributes, 725),
    textureWearDefault: readNumericAttribute(attributes, 749),
    seedLow: readIntegerAttribute(attributes, 866),
    seedHigh: readIntegerAttribute(attributes, 867),
  };
}
