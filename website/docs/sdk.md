---
sidebar_position: 4
---

# SDK

## Imports

```ts
import {
  createTf2ItemsClient,
  buildInventorySummary,
  filterInventoryResponse,
  TF2_ATTRIBUTE_DEFINDEX,
  getCrateMetadata,
  getKillstreakMetadata,
  getUnusualMetadata,
  getActiveSpells,
  isTradableItem,
  isCraftableItem,
  getPrimaryImageUrl,
} from "tf-item-schema-api";
```

## Create Client

```ts
const client = createTf2ItemsClient({
  apiKey: process.env.STEAM_API_KEY,
  language: "en",
});
```

## Methods

- `getInventory(target, options?)`
- `getInventorySummary(target, options?)`
- `getItemById(target, itemId, options?)`
- `resolveTarget(target, options?)`
- `getPlayerSummary(target, options?)`
- `getSchema(options?)`
- `getSchemaOverview(options?)`
- `getSchemaItemsPage(options?)`
- `getSchemaUrl(options?)`
- `filterInventoryResponse(response, options?)`

`getInventory` supports HTTP-equivalent filters plus:

- `includeRaw` (SDK default: `true`)
- `detailLevel=full|compact` (default: `full`)
- Attribute filters:
  - `attributeDefindex: number[]`
  - `attributeName: string`
  - `attributeClass: string`
  - `attributeDecodedValue: string`

Quality metadata:

- `item.quality.name` from community quality tag/schema
- `item.quality.grade` from community metadata (decorated tiers)

## Helpers

- `TF2_ATTRIBUTE_DEFINDEX` constant map
- `getCrateMetadata(item)`
- `getKillstreakMetadata(item)`
- `getUnusualMetadata(item)`
- `getActiveSpells(item)`
- `isTradableItem(item)`
- `isCraftableItem(item)`
- `getPrimaryImageUrl(item)`

## Example

```ts
const inventory = await client.getInventory("gaben", {
  isUnusual: true,
  includeRaw: false,
  detailLevel: "compact",
});

for (const item of inventory.items) {
  const crate = getCrateMetadata(item);
  const killstreak = getKillstreakMetadata(item);
  const unusual = getUnusualMetadata(item);
  const spells = getActiveSpells(item);
  const tradable = isTradableItem(item);
  const craftable = isCraftableItem(item);
  const image = getPrimaryImageUrl(item);
}

const summary = buildInventorySummary(
  await client.getInventory("gaben", { includeRaw: true, detailLevel: "full" }),
);
```

## Defindex Constant Example

```ts
console.log(TF2_ATTRIBUTE_DEFINDEX.trade.cannotTrade); // 153
```
