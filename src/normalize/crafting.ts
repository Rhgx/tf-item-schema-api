import type { NormalizedAttribute, RawInventoryItem } from "./types.js";

function readBooleanAttribute(attributes: NormalizedAttribute[], defindex: number): boolean {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return false;
  }
  return Number(attribute.value) > 0;
}

export function resolveCraftingData(rawItem: RawInventoryItem, attributes: NormalizedAttribute[]): {
  neverCraftable: boolean;
  cannotCraft: boolean;
  cannotGiftWrap: boolean;
  toolNeedsGiftWrap: boolean;
} {
  const cannotCraftFromFlag = rawItem.flag_cannot_craft === true || rawItem.flag_cannot_craft === 1;
  const cannotCraftFromAttrs = attributes.some(
    (attribute) => attribute.name?.toLowerCase().includes("cannot craft") && Number(attribute.value) > 0,
  );

  return {
    neverCraftable: readBooleanAttribute(attributes, 449),
    cannotCraft: cannotCraftFromFlag || cannotCraftFromAttrs,
    cannotGiftWrap: readBooleanAttribute(attributes, 785),
    toolNeedsGiftWrap: readBooleanAttribute(attributes, 786),
  };
}
