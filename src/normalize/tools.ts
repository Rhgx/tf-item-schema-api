import type { SchemaCatalog } from "../schema/catalog.js";
import type { NormalizedAttribute } from "./types.js";

const RECIPE_COMPONENT_DEFINDEXES = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008];

function readIntegerAttribute(attributes: NormalizedAttribute[], defindex: number): number | null {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return null;
  }
  const value = Math.trunc(Number(attribute.value));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readStringAttribute(attributes: NormalizedAttribute[], defindex: number): string | null {
  const attribute = attributes.find((entry) => entry.defindex === defindex);
  if (!attribute) {
    return null;
  }
  if (typeof attribute.rawValue === "string" && attribute.rawValue.trim()) {
    return attribute.rawValue.trim();
  }
  if (attribute.decodedValue) {
    return attribute.decodedValue;
  }
  return null;
}

export function resolveToolData(attributes: NormalizedAttribute[], schema: SchemaCatalog): {
  targetDefindex: number | null;
  targetItemName: string | null;
  recipeComponents: number[];
  unusualifierTemplate: string | null;
} {
  const targetDefindex = readIntegerAttribute(attributes, 2012);
  const recipeComponents = RECIPE_COMPONENT_DEFINDEXES
    .map((defindex) => readIntegerAttribute(attributes, defindex))
    .filter((value): value is number => value !== null);

  const uniqueRecipeComponents = [...new Set(recipeComponents)];

  return {
    targetDefindex,
    targetItemName: targetDefindex !== null ? schema.itemByDefindex[targetDefindex]?.displayName ?? null : null,
    recipeComponents: uniqueRecipeComponents,
    unusualifierTemplate: readStringAttribute(attributes, 805),
  };
}
