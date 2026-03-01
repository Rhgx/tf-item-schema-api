export interface RawItemAttribute {
  defindex: number;
  value?: unknown;
  float_value?: number;
  [key: string]: unknown;
}

export interface RawEquippedState {
  class?: number;
  slot?: number;
  [key: string]: unknown;
}

export interface RawContainedItem {
  id?: string;
  defindex?: number;
  quality?: number;
  level?: number;
  quantity?: number;
  [key: string]: unknown;
}

export interface RawInventoryItem {
  id: string | number | bigint;
  defindex: number;
  original_id?: string;
  quantity?: number;
  origin?: number;
  custom_desc?: string;
  style?: number;
  quality?: number;
  level?: number;
  item_name?: string;
  custom_name?: string;
  inventory?: number;
  equipped?: RawEquippedState[];
  contained_item?: RawContainedItem;
  account_info?: Record<string, unknown>;
  flag_cannot_trade?: boolean | number;
  flag_cannot_craft?: boolean | number;
  attributes?: RawItemAttribute[];
  [key: string]: unknown;
}

export interface SteamPlayerItemsResult {
  status: number;
  numBackpackSlots: number;
  items: RawInventoryItem[];
}

export interface CommunityTag {
  category: string;
  localizedTagName: string;
  color: string | null;
}

export interface CommunityDescriptionLine {
  type: string | null;
  value: string;
  color: string | null;
  label: string | null;
}

export interface CommunityItemMetadata {
  assetId: string;
  name: string | null;
  marketHashName: string | null;
  type: string | null;
  iconUrl: string | null;
  iconUrlLarge: string | null;
  tags: CommunityTag[];
  descriptions: CommunityDescriptionLine[];
}

export interface NormalizedAttribute {
  defindex: number;
  name: string | null;
  attributeClass: string | null;
  storedAsInteger: boolean;
  lookupTable: string | null;
  decodedValue: string | null;
  floatValue: number;
  value: number;
  rawValue: unknown;
}

export interface StrangeCounter {
  slot: number;
  scoreTypeId: number;
  scoreTypeName: string;
  value: number;
}

export type UnusualSource = "attribute" | "community_description" | "community_tags" | null;

export interface ItemIdentity {
  itemId: string;
  defindex: number;
  level: number | null;
}

export interface ItemQuality {
  id: number | null;
  name: string | null;
  grade: string | null;
}

export interface ItemNames {
  display: string;
  localized: string;
  custom: string | null;
  community: string | null;
  marketHash: string | null;
}

export interface ItemFlags {
  isStrange: boolean;
  isUnusual: boolean;
  isCrate: boolean;
  isCommunityCrate: boolean;
  isFestivized: boolean;
  isCraftable: boolean;
  isTradable: boolean;
}

export type ItemKind = "weapon" | "cosmetic" | "tool" | "crate" | "misc";

export interface ItemClassification {
  kind: ItemKind;
  itemClass: string | null;
  craftClass: string | null;
  itemSlot: string | null;
}

export interface ItemStrangeData {
  primaryCounter: StrangeCounter | null;
  counters: StrangeCounter[];
  parts: StrangeCounter[];
  primaryRank: StrangeRankProgress | null;
  counterRanks: StrangeCounterRank[];
}

export interface ItemUnusualData {
  effectId: number | null;
  effectName: string | null;
  source: UnusualSource;
}

export interface ItemCrateData {
  series: number | null;
  type: string | null;
  possibleUnusualHints?: string[];
  possibleContentsCollection?: string | null;
  possibleContentsItems?: string[];
}

export interface ItemKillstreakData {
  tier: number;
  tierName: string | null;
  effectId: number | null;
  effectName: string | null;
  effectLookupTable: string | null;
  sheenId: number | null;
  sheenName: string | null;
  sheenLookupTable: string | null;
}

export interface ItemCosmeticsData {
  paintkitId: number | null;
  paintkitName: string | null;
}

export interface ItemMediaData {
  imageUrl: string | null;
  imageUrlLarge: string | null;
  wear: string | null;
  tags: CommunityTag[];
}

export interface ItemTradeData {
  alwaysTradable: boolean;
  cannotTrade: boolean;
  isMarketable: boolean | null;
  tradableAfter: number | null;
}

export interface ItemCraftingData {
  neverCraftable: boolean;
  cannotCraft: boolean;
  cannotGiftWrap: boolean;
  toolNeedsGiftWrap: boolean;
}

export interface ItemToolData {
  targetDefindex: number | null;
  targetItemName: string | null;
  recipeComponents: number[];
  unusualifierTemplate: string | null;
}

export interface ItemPaintData {
  rgbPrimary: string | null;
  rgbSecondary: string | null;
  primaryName: string | null;
  secondaryName: string | null;
  styleOverride: number | null;
  textureWear: number | null;
  textureWearDefault: number | null;
  seedLow: number | null;
  seedHigh: number | null;
}

export interface ItemSpellsData {
  paint: string | null;
  footsteps: string | null;
  voices: boolean;
  pumpkinBombs: boolean;
  greenFlames: boolean;
  deathGhosts: boolean;
  spellbookPages: string[];
}

export interface StrangeRestrictionEntry {
  scope: "item" | "user";
  slot: number;
  type: number | null;
  value: number | null;
}

export interface ItemStrangeRestrictionsData {
  selector: number | null;
  newCounterId: number | null;
  entries: StrangeRestrictionEntry[];
}

export interface ItemSourceData {
  originalItemId: string | null;
  quantity: number;
  originId: number | null;
  originName: string | null;
  customDescription: string | null;
  style: number | null;
  accountInfo: Record<string, unknown> | null;
  equipped: Array<{
    classId: number | null;
    className: string | null;
    slot: number | null;
  }>;
  containedItem: {
    itemId: string | null;
    defindex: number | null;
    qualityId: number | null;
    level: number | null;
    quantity: number | null;
  } | null;
}

export interface ItemSchemaData {
  usedByClasses: string[];
  perClassLoadoutSlots: Record<string, string[]>;
  styles: Array<{
    id: number | null;
    name: string;
    selectable: boolean | null;
  }>;
  tool: Record<string, unknown> | null;
  capabilities: string[];
}

export interface StrangeRankTier {
  rank: number;
  requiredScore: number;
  name: string;
}

export interface StrangeRankProgress {
  setName: string;
  currentTier: StrangeRankTier | null;
  nextTier: StrangeRankTier | null;
}

export interface StrangeCounterRank {
  slot: number;
  scoreTypeId: number;
  value: number;
  progress: StrangeRankProgress;
}

export interface NormalizedInventoryItem {
  identity: ItemIdentity;
  classification: ItemClassification;
  quality: ItemQuality;
  names: ItemNames;
  flags: ItemFlags;
  strange: ItemStrangeData;
  unusual: ItemUnusualData;
  crate: ItemCrateData;
  killstreak: ItemKillstreakData;
  cosmetics: ItemCosmeticsData;
  media: ItemMediaData;
  trade: ItemTradeData;
  crafting: ItemCraftingData;
  tool: ItemToolData;
  paint: ItemPaintData;
  spells: ItemSpellsData;
  strangeRestrictions: ItemStrangeRestrictionsData;
  source: ItemSourceData;
  schema: ItemSchemaData;
  attributes: NormalizedAttribute[];
  rawItem: RawInventoryItem;
}

export type NormalizedInventoryItemPublic = Omit<NormalizedInventoryItem, "rawItem">;

export type ResolvedFrom = "steamid64" | "vanity" | "url";

export interface ResolvedTarget {
  input: string;
  steamId: string;
  resolvedFrom: ResolvedFrom;
}

export type ApiKeySource = "header" | "env" | "sdk";

export interface InventoryRequestMeta {
  language: string;
  apiKeySource: ApiKeySource;
  communityMetadataLoaded: boolean;
  warnings: string[];
}

export interface InventoryResponse {
  request: InventoryRequestMeta;
  target: ResolvedTarget;
  inventory: {
    totalItems: number;
    public: boolean;
    fetchedAt: number;
  };
  items: NormalizedInventoryItem[];
  raw: {
    playerItemsResult: SteamPlayerItemsResult;
    schemaFetchedAt: number;
  };
}

export interface InventoryResponsePublic {
  request: InventoryRequestMeta;
  target: ResolvedTarget;
  inventory: {
    totalItems: number;
    public: boolean;
    fetchedAt: number;
  };
  items: NormalizedInventoryItemPublic[];
}
