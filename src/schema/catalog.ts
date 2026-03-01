export interface SchemaItemSummary {
  defindex: number;
  displayName: string;
  itemClass: string | null;
  craftClass: string | null;
  itemSlot: string | null;
  imageUrl: string | null;
  imageUrlLarge: string | null;
  usedByClasses: string[];
  perClassLoadoutSlots: Record<string, string[]>;
  styles: SchemaItemStyleSummary[];
  tool: Record<string, unknown> | null;
  capabilities: string[];
}

export interface SchemaAttributeSummary {
  defindex: number;
  name: string;
  attributeClass: string | null;
  storedAsInteger: boolean;
  lookupTable: string | null;
  descriptionFormat: string | null;
}

export interface SchemaItemStyleSummary {
  id: number | null;
  name: string;
  selectable: boolean | null;
}

export interface StrangeRankTier {
  rank: number;
  requiredScore: number;
  name: string;
}

export interface StrangeRankSet {
  name: string;
  tiers: StrangeRankTier[];
}

export interface SchemaCatalog {
  fetchedAt: number;
  itemByDefindex: Record<number, SchemaItemSummary>;
  attributeByDefindex: Record<number, SchemaAttributeSummary>;
  attributeNameByDefindex: Record<number, string>;
  scoreTypeNameById: Record<number, string>;
  particleEffectNameById: Record<number, string>;
  qualityNameById: Record<number, string>;
  originNameById: Record<number, string>;
  stringLookupsByTable: Record<string, Record<number, string>>;
  strangeRankSets: StrangeRankSet[];
}

const QUALITY_NAME_FALLBACK: Record<number, string> = {
  0: "Normal",
  1: "Genuine",
  2: "Rarity2 (Unused)",
  3: "Vintage",
  4: "Rarity3 (Unused)",
  5: "Unusual",
  6: "Unique",
  7: "Community",
  8: "Valve",
  9: "Self-Made",
  10: "Customized (Unused)",
  11: "Strange",
  12: "Completed (Unused)",
  13: "Haunted",
  14: "Collector's",
  15: "Decorated",
};

const QUALITY_CODE_LABEL_FALLBACK: Record<string, string> = {
  normal: "Normal",
  rarity1: "Genuine",
  genuine: "Genuine",
  rarity2: "Rarity2 (Unused)",
  vintage: "Vintage",
  rarity3: "Rarity3 (Unused)",
  rarity4: "Unusual",
  unusual: "Unusual",
  unique: "Unique",
  community: "Community",
  developer: "Valve",
  selfmade: "Self-Made",
  customized: "Customized (Unused)",
  strange: "Strange",
  completed: "Completed (Unused)",
  haunted: "Haunted",
  collectors: "Collector's",
  paintkitweapon: "Decorated",
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return trimmed;
}

function normalizeCode(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeQualityLabel(code: string, label: string, qualityId: number): string {
  const normalizedCode = normalizeCode(code);
  const trimmed = label.trim();
  const lowerLabel = trimmed.toLowerCase();

  const looksBroken = lowerLabel === normalizedCode || lowerLabel === "restriction" || lowerLabel === "map";
  const looksPlaceholder = /^rarity\d+$/i.test(trimmed);

  if ((looksBroken || looksPlaceholder) && QUALITY_CODE_LABEL_FALLBACK[normalizedCode]) {
    return QUALITY_CODE_LABEL_FALLBACK[normalizedCode];
  }

  return trimmed || QUALITY_NAME_FALLBACK[qualityId] || QUALITY_CODE_LABEL_FALLBACK[normalizedCode] || `Quality ${qualityId}`;
}

function parseQualityNames(rawSchema: Record<string, unknown>): Record<number, string> {
  const qualityNameById: Record<number, string> = {};

  const qualityLabelsRaw = asRecord(rawSchema.qualityNames ?? rawSchema.quality_names);
  const labelsByCode = new Map<string, string>();
  for (const [code, value] of Object.entries(qualityLabelsRaw)) {
    if (typeof value === "string" && value) {
      labelsByCode.set(normalizeCode(code), value);
    }
  }

  const qualitiesRaw = asRecord(rawSchema.qualities);
  for (const [fallbackCode, value] of Object.entries(qualitiesRaw)) {
    const row = asRecord(value);
    const id = parseNumber(row.value ?? row.id ?? fallbackCode);
    if (id === null) {
      continue;
    }
    const code = typeof row.name === "string" ? row.name : fallbackCode;
    const normalizedCode = normalizeCode(code);
    const label =
      labelsByCode.get(normalizedCode) ??
      (typeof row.localized_name === "string" ? row.localized_name : "") ??
      QUALITY_CODE_LABEL_FALLBACK[normalizedCode] ??
      "";

    qualityNameById[id] = normalizeQualityLabel(code, label, id);
  }

  for (const [key, value] of Object.entries(QUALITY_NAME_FALLBACK)) {
    const id = Number(key);
    if (!qualityNameById[id]) {
      qualityNameById[id] = value;
    }
  }

  return qualityNameById;
}

function parseScoreTypes(raw: unknown): Record<number, string> {
  const scoreTypeNameById: Record<number, string> = {};
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const row = asRecord(entry);
      const id = parseNumber(row.type ?? row.score_type ?? row.id);
      const name =
        (typeof row.type_name === "string" && row.type_name) ||
        (typeof row.name === "string" && row.name) ||
        (typeof row.localized_name === "string" && row.localized_name) ||
        "";
      if (id !== null && name) {
        scoreTypeNameById[id] = name;
      }
    }
    return scoreTypeNameById;
  }

  const mapLike = asRecord(raw);
  for (const [key, value] of Object.entries(mapLike)) {
    const id = parseNumber(key);
    if (id === null) {
      continue;
    }
    if (typeof value === "string" && value) {
      scoreTypeNameById[id] = value;
      continue;
    }
    const row = asRecord(value);
    const name =
      (typeof row.type_name === "string" && row.type_name) ||
      (typeof row.name === "string" && row.name) ||
      (typeof row.localized_name === "string" && row.localized_name) ||
      "";
    if (name) {
      scoreTypeNameById[id] = name;
    }
  }

  return scoreTypeNameById;
}

function parseParticleEffects(raw: unknown): Record<number, string> {
  const particleEffectNameById: Record<number, string> = {};

  const list = Array.isArray(raw) ? raw : Object.values(asRecord(raw));
  for (const entry of list) {
    const row = asRecord(entry);
    const id = parseNumber(row.id ?? row.particle ?? row.value ?? row.system);
    const name =
      (typeof row.name === "string" && row.name) ||
      (typeof row.localized_name === "string" && row.localized_name) ||
      "";

    if (id !== null && name) {
      particleEffectNameById[id] = name;
    }
  }

  return particleEffectNameById;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => readString(entry))
      .filter((entry): entry is string => entry !== null);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => enabled === true || enabled === 1 || enabled === "1")
      .map(([key]) => key);
  }
  const single = readString(value);
  return single ? [single] : [];
}

function parsePerClassLoadoutSlots(value: unknown): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  if (!value || typeof value !== "object") {
    return output;
  }
  for (const [className, slotValue] of Object.entries(value as Record<string, unknown>)) {
    output[className] = parseStringArray(slotValue);
  }
  return output;
}

function synthesizePerClassLoadoutSlots(
  parsedSlots: Record<string, string[]>,
  usedByClasses: string[],
  itemSlot: string | null,
): Record<string, string[]> {
  if (Object.keys(parsedSlots).length > 0) {
    return parsedSlots;
  }

  if (!itemSlot) {
    return parsedSlots;
  }

  if (usedByClasses.length === 0) {
    return parsedSlots;
  }

  const synthesized: Record<string, string[]> = {};
  for (const className of usedByClasses) {
    synthesized[className] = [itemSlot];
  }
  return synthesized;
}

function parseStyles(value: unknown): SchemaItemStyleSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      const row = asRecord(entry);
      const name = readString(row.name) ?? readString(row.localized_name) ?? `Style ${index + 1}`;
      const id = parseNumber(row.skin ?? row.id ?? row.style);
      let selectable: boolean | null = null;
      if (typeof row.selectable === "boolean") {
        selectable = row.selectable;
      } else if (typeof row.selectable === "number") {
        selectable = row.selectable !== 0;
      } else if (typeof row.selectable === "string") {
        selectable = row.selectable === "1" || row.selectable.toLowerCase() === "true";
      }
      return {
        id,
        name,
        selectable,
      };
    })
    .filter((entry) => entry.name.length > 0);
}

function parseCapabilities(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }
  return Object.entries(value as Record<string, unknown>)
    .filter(([, enabled]) => enabled === true || enabled === 1 || enabled === "1")
    .map(([key]) => key)
    .sort((a, b) => a.localeCompare(b));
}

function parseLookupTableName(row: Record<string, unknown>): string | null {
  const keys = [
    "lookup_table",
    "value_is_lookup",
    "value_is_from_lookup_table",
    "string_lookup",
    "string_lookups",
  ];
  for (const key of keys) {
    const value = readString(row[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

function parseOriginNames(raw: unknown): Record<number, string> {
  const result: Record<number, string> = {};
  const source = asRecord(raw);
  for (const [idRaw, entryRaw] of Object.entries(source)) {
    const idFromKey = parseNumber(idRaw);
    const entry = asRecord(entryRaw);

    const id = parseNumber(entry.origin ?? entry.id ?? idFromKey);
    const name = readString(entry.name ?? entryRaw);
    if (id !== null && name) {
      result[id] = name;
    }
  }
  return result;
}

function parseStringLookups(raw: unknown): Record<string, Record<number, string>> {
  const tables: Record<string, Record<number, string>> = {};
  const rootList: Array<[string, unknown]> = [];

  if (Array.isArray(raw)) {
    for (const entryRaw of raw) {
      const entry = asRecord(entryRaw);
      const tableName = readString(entry.table_name ?? entry.name);
      if (!tableName) {
        continue;
      }
      rootList.push([tableName, entry.strings ?? entry.values ?? entry.entries ?? entry]);
    }
  } else {
    const root = asRecord(raw);
    rootList.push(...Object.entries(root));
  }

  for (const [tableName, tableRaw] of rootList) {
    const byId: Record<number, string> = {};

    if (Array.isArray(tableRaw)) {
      for (const entry of tableRaw) {
        const row = asRecord(entry);
        const id = parseNumber(row.value ?? row.id ?? row.index ?? row.key);
        const name =
          readString(row.name) ??
          readString(row.string) ??
          readString(row.token) ??
          readString(row.value_name);
        if (id !== null && name) {
          byId[id] = name;
        }
      }
    } else {
      const tableObj = asRecord(tableRaw);
      for (const [idRaw, nameRaw] of Object.entries(tableObj)) {
        const id = parseNumber(idRaw);
        const name = readString(nameRaw);
        if (id !== null && name) {
          byId[id] = name;
        }
      }
    }

    if (Object.keys(byId).length > 0) {
      tables[tableName] = byId;
    }
  }

  return tables;
}

function parseStrangeRankSets(raw: unknown): StrangeRankSet[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => {
      const row = asRecord(entry);
      const name = readString(row.name) ?? readString(row.type_name) ?? null;
      if (!name) {
        return null;
      }

      const levels = Array.isArray(row.levels) ? row.levels : [];
      const tiers = levels
        .map((levelEntry, index) => {
          const level = asRecord(levelEntry);
          const rank = parseNumber(level.level ?? level.rank) ?? index + 1;
          const requiredScore =
            parseNumber(level.required_score ?? level.score ?? level.required_points ?? level.required_kills) ?? 0;
          const tierName = readString(level.name) ?? readString(level.title) ?? `Rank ${rank}`;
          return {
            rank,
            requiredScore,
            name: tierName,
          };
        })
        .sort((a, b) => a.requiredScore - b.requiredScore || a.rank - b.rank);

      return {
        name,
        tiers,
      };
    })
    .filter((entry): entry is StrangeRankSet => entry !== null);
}

export function buildSchemaCatalog(rawSchema: Record<string, unknown>): SchemaCatalog {
  const itemsRaw = Array.isArray(rawSchema.items) ? rawSchema.items : [];
  const attributesRaw = Array.isArray(rawSchema.attributes) ? rawSchema.attributes : [];

  const itemByDefindex: Record<number, SchemaItemSummary> = {};
  const attributeByDefindex: Record<number, SchemaAttributeSummary> = {};
  const attributeNameByDefindex: Record<number, string> = {};

  for (const entry of itemsRaw) {
    const row = asRecord(entry);
    const defindex = parseNumber(row.defindex);
    if (defindex === null) {
      continue;
    }
    const usedByClasses = parseStringArray(row.used_by_classes);
    const itemSlot = typeof row.item_slot === "string" ? row.item_slot : null;
    const parsedPerClassLoadoutSlots = parsePerClassLoadoutSlots(row.per_class_loadout_slots);
    itemByDefindex[defindex] = {
      defindex,
      displayName:
        (typeof row.item_name === "string" && row.item_name) ||
        (typeof row.name === "string" && row.name) ||
        `#${defindex}`,
      itemClass: typeof row.item_class === "string" ? row.item_class : null,
      craftClass: typeof row.craft_class === "string" ? row.craft_class : null,
      itemSlot,
      imageUrl: normalizeImageUrl(row.image_url),
      imageUrlLarge: normalizeImageUrl(row.image_url_large),
      usedByClasses,
      perClassLoadoutSlots: synthesizePerClassLoadoutSlots(parsedPerClassLoadoutSlots, usedByClasses, itemSlot),
      styles: parseStyles(row.styles),
      tool: row.tool && typeof row.tool === "object" ? asRecord(row.tool) : null,
      capabilities: parseCapabilities(row.capabilities),
    };
  }

  for (const entry of attributesRaw) {
    const row = asRecord(entry);
    const defindex = parseNumber(row.defindex);
    if (defindex === null) {
      continue;
    }
    const name = typeof row.name === "string" ? row.name : "";
    if (name) {
      attributeNameByDefindex[defindex] = name;
    }
    attributeByDefindex[defindex] = {
      defindex,
      name,
      attributeClass: typeof row.attribute_class === "string" ? row.attribute_class : null,
      storedAsInteger: Boolean(row.stored_as_integer),
      lookupTable: parseLookupTableName(row),
      descriptionFormat: readString(row.description_format),
    };
  }

  return {
    fetchedAt: Date.now(),
    itemByDefindex,
    attributeByDefindex,
    attributeNameByDefindex,
    scoreTypeNameById: parseScoreTypes(rawSchema.kill_eater_score_types),
    particleEffectNameById: parseParticleEffects(rawSchema.attribute_controlled_attached_particles),
    qualityNameById: parseQualityNames(rawSchema),
    originNameById: parseOriginNames(rawSchema.originNames ?? rawSchema.origin_names),
    stringLookupsByTable: parseStringLookups(rawSchema.string_lookups),
    strangeRankSets: parseStrangeRankSets(rawSchema.item_levels),
  };
}
