---
sidebar_position: 1
---

# Overview

`tf-item-schema-api` is a Team Fortress 2 inventory metadata wrapper with:

- HTTP API: `GET /v1/inventory/:target`
- TypeScript SDK: `createTf2ItemsClient`

It resolves Steam targets (SteamID64, vanity, profile URL), fetches inventory + schema + community metadata, and returns normalized item metadata.

## What You Get

- Stable normalized JSON shape for items
- Parsed Strange/Unusual/Killstreak/Crate metadata
- Schema-backed quality, origin, class/loadout info
- Optional raw Steam payload passthrough
- SDK filtering and helper selectors

## Links

- GitHub: [github.com/Rhgx/tf-item-schema-api](https://github.com/Rhgx/tf-item-schema-api)
- API/SDK docs in this site sidebar
