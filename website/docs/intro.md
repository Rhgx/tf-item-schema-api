---
sidebar_position: 1
---

# Welcome

`tf-item-schema-api` helps you turn raw TF2 inventory data into clean, developer-friendly JSON.

You can use it in two ways:

- HTTP API: `GET /v1/inventory/:target`
- TypeScript SDK: `createTf2ItemsClient(...)`

It resolves Steam targets (SteamID64, vanity URL name, or profile URL), fetches Steam + schema + community metadata, then returns one normalized response shape.

## Who This Is For

- Bot developers
- Tool and dashboard developers
- Inventory analyzers
- Anyone who wants TF2 item data without parsing Steam responses manually

## What You Get

- Consistent item fields across the whole inventory
- Parsed metadata for:
  - Strange counters/ranks
  - Unusual effects
  - Killstreak tiers/effects/sheens
  - Crate/case details
  - Paint, spells, and restrictions
- Filtering support (including attribute-level filtering)
- Optional raw Steam payload passthrough for debugging

## Typical Flow

1. Call `GET /v1/inventory/:target`
2. Apply query filters (quality, crate series, attributes, and more)
3. Use normalized fields directly in your app UI or logic

## Next Steps

- Start setup: [Getting Started](./getting-started.md)
- View endpoint options: [HTTP API](./http-api.md)
- Use TypeScript client: [SDK](./sdk.md)
