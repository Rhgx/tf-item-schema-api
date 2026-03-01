---
sidebar_position: 3
---

# HTTP API

## Endpoint

`GET /v1/inventory/:target?language=en`

Headers:

- `x-steam-api-key` optional. If not present, server uses `STEAM_API_KEY`.

`:target` can be:

- SteamID64 (`76561198012345678`)
- Vanity (`gaben`)
- Profile URL (`https://steamcommunity.com/id/gaben/`)

## Query Params

- `language=en`
- `view=full|compact` (default: `full`)
- `includeRaw=true|false` (default: `false`)
- `defindex=200,205`
- `qualityId=5,11`
- `quality=Unusual,Strange`
- `name=rocket`
- `isStrange=true|false`
- `isUnusual=true|false`
- `isCrate=true|false`
- `isCommunityCrate=true|false`
- `isFestivized=true|false`
- `isCraftable=true|false`
- `isTradable=true|false`
- `crateSeries=30,124`
- `hasPaintkit=true|false`
- `minLevel=1`
- `maxLevel=100`
- `limit=1..5000`
- `offset=0..n`

## Examples

```bash
curl "http://localhost:3000/v1/inventory/gaben?language=en" \
  -H "x-steam-api-key: YOUR_KEY"
```

```bash
curl "http://localhost:3000/v1/inventory/gaben?isUnusual=true&quality=Unusual&defindex=200,205&limit=50&offset=0" \
  -H "x-steam-api-key: YOUR_KEY"
```

```bash
curl "http://localhost:3000/v1/inventory/gaben?includeRaw=true&view=compact" \
  -H "x-steam-api-key: YOUR_KEY"
```

## Error Mapping

- `401` -> `invalid_key`
- `403` -> `private_inventory`
- `404` -> `vanity_not_found`
- `429` -> `rate_limited`
- `502` -> `upstream_http_error`
- `500` -> `response_parse_error`
