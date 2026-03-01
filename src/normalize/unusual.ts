import type { SchemaCatalog } from "../schema/catalog.js";
import type { CommunityItemMetadata, NormalizedAttribute, UnusualSource } from "./types.js";

const PARTICLE_ATTRIBUTE_NAMES = [
  "particle effect",
  "attach particle effect",
  "set_attached_particle",
  "unusual effect",
];

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
}

function normalizeName(input: string): string {
  return stripHtml(input).toLowerCase().replace(/\s+/g, " ").trim();
}

function getEffectIdFromAttributes(attributes: NormalizedAttribute[]): number | null {
  for (const attribute of attributes) {
    const name = (attribute.name ?? "").toLowerCase();
    const attrClass = (attribute.attributeClass ?? "").toLowerCase();
    const matchesName = PARTICLE_ATTRIBUTE_NAMES.some((part) => name.includes(part));
    const matchesClass = attrClass.includes("particle");
    const isKnownDefindex = attribute.defindex === 134;

    if (!matchesName && !matchesClass && !isKnownDefindex) {
      continue;
    }

    const candidate = Math.round(attribute.value);
    if (candidate > 0) {
      return candidate;
    }
  }
  return null;
}

function parseDescriptionEffect(metadata: CommunityItemMetadata | null): string | null {
  if (!metadata) {
    return null;
  }

  for (const line of metadata.descriptions) {
    const text = stripHtml(line.value);
    const match = text.match(/unusual effect:\s*(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function parseTagEffect(metadata: CommunityItemMetadata | null): string | null {
  if (!metadata) {
    return null;
  }

  for (const tag of metadata.tags) {
    const text = tag.localizedTagName.trim();
    const match = text.match(/unusual effect:\s*(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const type = metadata.type?.trim() ?? "";
  const typeMatch = type.match(/^unusual\s+.+?\s*-\s*(.+)$/i);
  if (typeMatch?.[1]) {
    return typeMatch[1].trim();
  }

  return null;
}

function findEffectIdByName(name: string, particleEffectNameById: Record<number, string>): number | null {
  const target = normalizeName(name);
  for (const [key, value] of Object.entries(particleEffectNameById)) {
    if (normalizeName(value) === target) {
      const parsed = Number(key);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

export function resolveUnusualData(
  attributes: NormalizedAttribute[],
  schema: SchemaCatalog,
  communityMetadata: CommunityItemMetadata | null,
): {
  isUnusual: boolean;
  unusualEffectId: number | null;
  unusualEffectName: string | null;
  unusualSource: UnusualSource;
} {
  const effectIdFromAttribute = getEffectIdFromAttributes(attributes);
  if (effectIdFromAttribute !== null) {
    return {
      isUnusual: true,
      unusualEffectId: effectIdFromAttribute,
      unusualEffectName: schema.particleEffectNameById[effectIdFromAttribute] ?? `Effect #${effectIdFromAttribute}`,
      unusualSource: "attribute",
    };
  }

  const effectFromDescription = parseDescriptionEffect(communityMetadata);
  if (effectFromDescription) {
    return {
      isUnusual: true,
      unusualEffectId: findEffectIdByName(effectFromDescription, schema.particleEffectNameById),
      unusualEffectName: effectFromDescription,
      unusualSource: "community_description",
    };
  }

  const effectFromTags = parseTagEffect(communityMetadata);
  if (effectFromTags) {
    return {
      isUnusual: true,
      unusualEffectId: findEffectIdByName(effectFromTags, schema.particleEffectNameById),
      unusualEffectName: effectFromTags,
      unusualSource: "community_tags",
    };
  }

  return {
    isUnusual: false,
    unusualEffectId: null,
    unusualEffectName: null,
    unusualSource: null,
  };
}
