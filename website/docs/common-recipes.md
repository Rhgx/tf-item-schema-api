---
sidebar_position: 5
---

# Common Recipes

Use these copy/paste examples for common tasks.

## Find all unusual items

```bash
curl "http://localhost:3000/v1/inventory/gaben?isUnusual=true&quality=Unusual"
```

## Find only tradable items

```bash
curl "http://localhost:3000/v1/inventory/gaben?isTradable=true"
```

## Filter by crate series

```bash
curl "http://localhost:3000/v1/inventory/gaben?isCrate=true&crateSeries=30,124"
```

## Filter by assigned attributes

### By attribute defindex

```bash
curl "http://localhost:3000/v1/inventory/gaben?attributeDefindex=143"
```

### By decoded value text

```bash
curl "http://localhost:3000/v1/inventory/gaben?attributeDecodedValue=2023-03-03"
```

### Combine attribute filters

```bash
curl "http://localhost:3000/v1/inventory/gaben?attributeDefindex=143&attributeClass=employee&attributeDecodedValue=2023-03-03"
```

## Pagination for large inventories

```bash
curl "http://localhost:3000/v1/inventory/gaben?limit=100&offset=0"
curl "http://localhost:3000/v1/inventory/gaben?limit=100&offset=100"
```

## SDK equivalent filtering

```ts
import { createTf2ItemsClient } from "tf-item-schema-api";

const client = createTf2ItemsClient({ apiKey: process.env.STEAM_API_KEY });

const response = await client.getInventory("gaben", {
  isUnusual: true,
  attributeDefindex: [143],
  attributeDecodedValue: "2023-03-03",
  includeRaw: false,
});

console.log(response.inventory.totalItems);
```
