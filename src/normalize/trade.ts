import type { NormalizedAttribute, RawInventoryItem } from "./types.js";

function readAttribute(attributes: NormalizedAttribute[], defindex: number): NormalizedAttribute | null {
  return attributes.find((attribute) => attribute.defindex === defindex) ?? null;
}

function readBooleanAttribute(attributes: NormalizedAttribute[], defindex: number): boolean {
  const attribute = readAttribute(attributes, defindex);
  if (!attribute) {
    return false;
  }
  return Number(attribute.value) > 0;
}

function readIntegerAttribute(attributes: NormalizedAttribute[], defindex: number): number | null {
  const attribute = readAttribute(attributes, defindex);
  if (!attribute) {
    return null;
  }
  const value = Math.trunc(Number(attribute.value));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function resolveTradeData(rawItem: RawInventoryItem, attributes: NormalizedAttribute[]): {
  alwaysTradable: boolean;
  cannotTrade: boolean;
  isMarketable: boolean | null;
  tradableAfter: number | null;
} {
  const alwaysTradable = readBooleanAttribute(attributes, 195);
  const cannotTradeFromFlag = rawItem.flag_cannot_trade === true || rawItem.flag_cannot_trade === 1;
  const cannotTradeFromAttr = readBooleanAttribute(attributes, 153);
  const cannotTrade = !alwaysTradable && (cannotTradeFromFlag || cannotTradeFromAttr);

  const marketableAttr = attributes.find((attribute) => attribute.defindex === 2028);
  const isMarketable = marketableAttr ? Number(marketableAttr.value) > 0 : null;

  return {
    alwaysTradable,
    cannotTrade,
    isMarketable,
    tradableAfter: readIntegerAttribute(attributes, 211),
  };
}
