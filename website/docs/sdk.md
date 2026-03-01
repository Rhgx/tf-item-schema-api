---
sidebar_position: 4
---

# SDK

## Install

```bash
npm install tf-item-schema-api
```

## Quick Start

```ts
import { createTf2ItemsClient } from "tf-item-schema-api";

const client = createTf2ItemsClient({
  apiKey: process.env.STEAM_API_KEY,
  language: "en",
});

const inventory = await client.getInventory("gaben", {
  includeRaw: false,
});
```

## Main Methods

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

## `getInventory` Filter Options

`getInventory` supports all HTTP-style filters and SDK-specific options.

Common options:

- `defindex: number[]`
- `qualityId: number[]`
- `quality: string[]`
- `name: string`
- `isStrange`, `isUnusual`, `isCrate`, `isCraftable`, `isTradable`
- `crateSeries: number[]`
- `hasPaintkit: boolean`
- `minLevel`, `maxLevel`
- `limit`, `offset`
- `attributeDefindex: number[]`
- `attributeName: string`
- `attributeClass: string`
- `attributeDecodedValue: string`
- `includeRaw` (default: `true` in SDK)
- `detailLevel: "full" | "compact"` (default: `"full"`)

## Useful Helpers

- `TF2_ATTRIBUTE_DEFINDEX` constant lookup map
- `getCrateMetadata(item)`
- `getKillstreakMetadata(item)`
- `getUnusualMetadata(item)`
- `getActiveSpells(item)`
- `isTradableItem(item)`
- `isCraftableItem(item)`
- `getPrimaryImageUrl(item)`

## Practical Example

```ts
import {
  createTf2ItemsClient,
  getUnusualMetadata,
  getKillstreakMetadata,
  buildInventorySummary,
} from "tf-item-schema-api";

const client = createTf2ItemsClient({ apiKey: process.env.STEAM_API_KEY });

const inventory = await client.getInventory("gaben", {
  attributeDefindex: [143],
  attributeClass: "employee",
  attributeDecodedValue: "2023-03-03",
  includeRaw: false,
});

for (const item of inventory.items) {
  const killstreak = getKillstreakMetadata(item);
  const unusual = getUnusualMetadata(item);
  console.log(item.names.display, { killstreak, unusual });
}

const summary = buildInventorySummary(
  await client.getInventory("gaben", { includeRaw: true, detailLevel: "full" }),
);
```

## Defindex Constant Example

```ts
import { TF2_ATTRIBUTE_DEFINDEX } from "tf-item-schema-api";

console.log(TF2_ATTRIBUTE_DEFINDEX.trade.cannotTrade); // 153
```
