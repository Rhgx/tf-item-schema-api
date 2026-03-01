# tf-item-schema-api

TF2 items metadata wrapper with:

- HTTP API: `GET /v1/inventory/:target`
- TypeScript SDK: `createTf2ItemsClient`

It resolves Steam targets (SteamID64, vanity, Steam profile URL), fetches TF2 inventory + schema + community metadata, and returns normalized item data plus raw Steam item objects.

## Install

```bash
npm install
```

## Environment

```bash
cp .env.example .env
```

Required:

- `STEAM_API_KEY` (unless sent per request through `x-steam-api-key`)

Optional:

- `PORT` (default `3000`)

## Run

```bash
npm run dev
```

Health check:

```bash
GET /health
GET /v1/health
```

## HTTP API

### `GET /v1/inventory/:target?language=en`

Headers:

- `x-steam-api-key` (optional, takes precedence over `STEAM_API_KEY`)

`:target` supports:

- SteamID64 (`76561198012345678`)
- Vanity (`gaben`)
- Profile URL (`https://steamcommunity.com/id/gaben/`)

Example:

```bash
curl "http://localhost:3000/v1/inventory/gaben?language=en" \
  -H "x-steam-api-key: YOUR_KEY"
```

Filter example:

```bash
curl "http://localhost:3000/v1/inventory/gaben?isUnusual=true&quality=Unusual&defindex=200,205&limit=50&offset=0" \
  -H "x-steam-api-key: YOUR_KEY"
```

Include raw payloads (disabled by default):

```bash
curl "http://localhost:3000/v1/inventory/gaben?includeRaw=true" \
  -H "x-steam-api-key: YOUR_KEY"
```

Compact view (drops empty item sections):

```bash
curl "http://localhost:3000/v1/inventory/gaben?view=compact" \
  -H "x-steam-api-key: YOUR_KEY"
```

Supported URL filters:

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

Response shape:

```json
{
  "request": {
    "language": "en",
    "apiKeySource": "header",
    "communityMetadataLoaded": true,
    "warnings": []
  },
  "target": {
    "input": "gaben",
    "steamId": "76561198012345678",
    "resolvedFrom": "vanity"
  },
  "inventory": {
    "totalItems": 123,
    "public": true,
    "fetchedAt": 1740787200000
  },
  "items": [
    {
      "identity": {
        "itemId": "1234567890123456789",
        "defindex": 205,
        "level": 20
      },
      "classification": {
        "kind": "weapon",
        "itemClass": "tf_weapon_rocketlauncher",
        "craftClass": "weapon",
        "itemSlot": "primary"
      },
      "quality": {
        "id": 11,
        "name": "Strange"
      },
      "names": {
        "display": "Strange Rocket Launcher",
        "localized": "Rocket Launcher",
        "custom": null,
        "community": "Strange Rocket Launcher",
        "marketHash": "Strange Rocket Launcher"
      },
      "flags": {
        "isStrange": true,
        "isUnusual": false,
        "isCrate": false,
        "isCommunityCrate": false,
        "isFestivized": false,
        "isCraftable": true,
        "isTradable": true
      },
      "strange": {
        "primaryCounter": { "slot": 0, "scoreTypeId": 0, "scoreTypeName": "Kills", "value": 1234 },
        "counters": [],
        "parts": [],
        "primaryRank": {
          "setName": "Kills",
          "currentTier": { "rank": 20, "requiredScore": 1000, "name": "Hale's Own" },
          "nextTier": null
        },
        "counterRanks": []
      },
      "unusual": {
        "effectId": null,
        "effectName": null,
        "source": null
      },
      "crate": {
        "series": null,
        "type": null
      },
      "killstreak": {
        "tier": 3,
        "tierName": "Professional Killstreak",
        "effectId": 2002,
        "effectName": "Fire Horns",
        "effectLookupTable": "killstreakeffect",
        "sheenId": 5,
        "sheenName": "Agonizing Emerald",
        "sheenLookupTable": "killstreak_idleeffect"
      },
      "cosmetics": {
        "paintkitId": null,
        "paintkitName": null
      },
      "media": {
        "imageUrl": "https://community.akamai.steamstatic.com/economy/image/...",
        "imageUrlLarge": "https://community.akamai.steamstatic.com/economy/image/...",
        "wear": null,
        "tags": []
      },
      "trade": {
        "alwaysTradable": false,
        "cannotTrade": false,
        "isMarketable": null,
        "tradableAfter": null
      },
      "crafting": {
        "neverCraftable": false,
        "cannotCraft": false,
        "cannotGiftWrap": false,
        "toolNeedsGiftWrap": false
      },
      "tool": {
        "targetDefindex": null,
        "targetItemName": null,
        "recipeComponents": [],
        "unusualifierTemplate": null
      },
      "paint": {
        "rgbPrimary": null,
        "rgbSecondary": null,
        "styleOverride": null,
        "textureWear": null,
        "textureWearDefault": null,
        "seedLow": null,
        "seedHigh": null
      },
      "spells": {
        "paint": null,
        "footsteps": null,
        "voices": false,
        "pumpkinBombs": false,
        "greenFlames": false,
        "deathGhosts": false,
        "spellbookPages": []
      },
      "strangeRestrictions": {
        "selector": null,
        "newCounterId": null,
        "entries": []
      },
      "source": {
        "originalItemId": null,
        "quantity": 1,
        "originId": 3,
        "originName": "Crafted",
        "customDescription": null,
        "style": null,
        "accountInfo": null,
        "equipped": [],
        "containedItem": null
      },
      "schema": {
        "usedByClasses": ["Soldier"],
        "perClassLoadoutSlots": { "Soldier": ["primary"] },
        "styles": [],
        "tool": null,
        "capabilities": ["nameable", "paintable"]
      },
      "attributes": [
        {
          "defindex": 2013,
          "name": "killstreak effect",
          "attributeClass": "killstreak_effect",
          "storedAsInteger": false,
          "lookupTable": "killstreakeffect",
          "decodedValue": "Fire Horns",
          "floatValue": 2002,
          "value": 2002,
          "rawValue": 2002
        }
      ],
      "rawItem": {}
    }
  ],
  "raw": {
    "playerItemsResult": {},
    "schemaFetchedAt": 1740787000000
  }
}
```

## SDK

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

const client = createTf2ItemsClient({
  apiKey: process.env.STEAM_API_KEY,
  language: "en",
});

const inventory = await client.getInventory("gaben", {
  isUnusual: true,
  quality: ["Unusual"],
  defindex: [200, 205],
  limit: 50,
  offset: 0,
  includeRaw: true, // default true in SDK
});
const schema = await client.getSchema();
const target = await client.resolveTarget("https://steamcommunity.com/id/gaben/");

// New helper methods:
const summary = await client.getInventorySummary("gaben");
const item = await client.getItemById("gaben", "1234567890123456789");
const profile = await client.getPlayerSummary("gaben");
const schemaOverview = await client.getSchemaOverview();
const schemaPage = await client.getSchemaItemsPage({ start: 0 });
const schemaUrl = await client.getSchemaUrl();

// Pure helper for already-fetched inventory payloads:
const summary2 = buildInventorySummary(inventory);
const filteredAgain = filterInventoryResponse(inventory, { isCrate: true, includeRaw: false });

// Defindex constants (SDK-safe references for attribute mapping logic):
console.log(TF2_ATTRIBUTE_DEFINDEX.trade.cannotTrade); // 153

// Selector helpers:
for (const item of inventory.items) {
  const crate = getCrateMetadata(item);
  const killstreak = getKillstreakMetadata(item);
  const unusual = getUnusualMetadata(item);
  const spells = getActiveSpells(item);
  const tradable = isTradableItem(item);
  const craftable = isCraftableItem(item);
  const image = getPrimaryImageUrl(item);
}
```

### SDK methods

- `getInventory(target, options?)`
  - Supports the same filtering fields as HTTP (`defindex`, `qualityId`, `quality`, `name`, booleans, `crateSeries`, `hasPaintkit`, `minLevel`, `maxLevel`, `limit`, `offset`) plus:
  - `includeRaw` (default `true` in SDK)
  - `detailLevel=full|compact` (default `full`; `compact` omits empty item sections)
- `getInventorySummary(target, options?)`
- `getItemById(target, itemId, options?)`
- `resolveTarget(target, options?)`
- `getPlayerSummary(target, options?)`
- `getSchema(options?)`
- `getSchemaOverview(options?)`
- `getSchemaItemsPage(options?)`
- `getSchemaUrl(options?)`
- `filterInventoryResponse(response, options?)`
- `TF2_ATTRIBUTE_DEFINDEX` constants map
- Selector helpers:
  - `getCrateMetadata(item)`
  - `getKillstreakMetadata(item)`
  - `getUnusualMetadata(item)`
  - `getActiveSpells(item)`
  - `isTradableItem(item)`
  - `isCraftableItem(item)`
  - `getPrimaryImageUrl(item)`

### SDK Defindex-to-field quick map

The SDK exports `TF2_ATTRIBUTE_DEFINDEX` so consumers can safely align custom logic with normalized fields:

- `trade`: maps to `item.trade.*`
- `crafting`: maps to `item.crafting.*`
- `tool`: maps to `item.tool.*`
- `paint`: maps to `item.paint.*`
- `spells`: maps to `item.spells.*`
- `strangeRestrictions`: maps to `item.strangeRestrictions.*`
- `crate`: maps to `item.crate.*`
- `killstreak`: maps to `item.killstreak.*`
- `unusual`: maps to `item.unusual.*`
- `naming`: maps to `item.names.custom`

For full details and all current defindexes, see `Parsed Defindex Map` below.

## Parsed Defindex Map

This section documents the currently implemented TF2 attribute defindex parsing and where each value lands in the normalized response.

### Trade


| Defindex | Meaning                  | Output field(s)                                      |
| -------- | ------------------------ | ---------------------------------------------------- |
| `153`    | Cannot trade flag        | `trade.cannotTrade`                                  |
| `195`    | Always tradable override | `trade.alwaysTradable` and `trade.cannotTrade` logic |
| `2028`   | Marketable flag          | `trade.isMarketable`                                 |
| `211`    | Tradable-after timestamp | `trade.tradableAfter`                                |


### Crafting


| Defindex | Meaning                 | Output field(s)              |
| -------- | ----------------------- | ---------------------------- |
| `449`    | Never craftable         | `crafting.neverCraftable`    |
| `785`    | Cannot gift wrap        | `crafting.cannotGiftWrap`    |
| `786`    | Tool requires gift wrap | `crafting.toolNeedsGiftWrap` |


Also used:

- raw item flags `flag_cannot_craft` and "cannot craft" attribute-name matching feed `crafting.cannotCraft`.

### Tool Metadata


| Defindex     | Meaning                      | Output field(s)                              |
| ------------ | ---------------------------- | -------------------------------------------- |
| `2012`       | Target item defindex         | `tool.targetDefindex`, `tool.targetItemName` |
| `2000..2008` | Recipe component defindexes  | `tool.recipeComponents`                      |
| `805`        | Unusualifier/template string | `tool.unusualifierTemplate`                  |


### Paint / Texture


| Defindex | Meaning                   | Output field(s)            |
| -------- | ------------------------- | -------------------------- |
| `142`    | Primary paint RGB (int)   | `paint.rgbPrimary`         |
| `261`    | Secondary paint RGB (int) | `paint.rgbSecondary`       |
| `542`    | Style override            | `paint.styleOverride`      |
| `725`    | Texture wear value        | `paint.textureWear`        |
| `749`    | Default texture wear      | `paint.textureWearDefault` |
| `866`    | Low seed                  | `paint.seedLow`            |
| `867`    | High seed                 | `paint.seedHigh`           |


### Spells


| Defindex     | Meaning                    | Output field(s)         |
| ------------ | -------------------------- | ----------------------- |
| `1004`       | Paint spell                | `spells.paint`          |
| `1005`       | Footsteps spell            | `spells.footsteps`      |
| `1006`       | Voices spell toggle        | `spells.voices`         |
| `1007`       | Pumpkin bombs spell toggle | `spells.pumpkinBombs`   |
| `1008`       | Green flames spell toggle  | `spells.greenFlames`    |
| `1009`       | Death ghosts spell toggle  | `spells.deathGhosts`    |
| `2016..2020` | Spellbook page unlocks     | `spells.spellbookPages` |


### Strange Restrictions


| Defindex  | Meaning                              | Output field(s)                    |
| --------- | ------------------------------------ | ---------------------------------- |
| `468`     | Restriction selector                 | `strangeRestrictions.selector`     |
| `385`     | New strange counter id               | `strangeRestrictions.newCounterId` |
| `454/455` | Item restriction slot 1 (type/value) | `strangeRestrictions.entries[]`    |
| `456/457` | Item restriction slot 2 (type/value) | `strangeRestrictions.entries[]`    |
| `496/497` | Item restriction slot 3 (type/value) | `strangeRestrictions.entries[]`    |
| `458/459` | User restriction slot 1 (type/value) | `strangeRestrictions.entries[]`    |
| `460/461` | User restriction slot 2 (type/value) | `strangeRestrictions.entries[]`    |
| `462/463` | User restriction slot 3 (type/value) | `strangeRestrictions.entries[]`    |


### Crates and Cases


| Defindex | Meaning         | Output field(s) |
| -------- | --------------- | --------------- |
| `187`    | Crate series id | `crate.series`  |


Also used:

- attribute-name fallback when name includes "crate series"
- community descriptions/type/name/market hash parsing for series and type detection
- output fields affected: `crate.series`, `crate.type`, `flags.isCrate`, `flags.isCommunityCrate`

### Killstreak


| Defindex | Meaning                       | Output field(s)                                                                |
| -------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `2013`   | Killstreak effect id fallback | `killstreak.effectId`, `killstreak.effectName`, `killstreak.effectLookupTable` |
| `2014`   | Killstreak sheen id fallback  | `killstreak.sheenId`, `killstreak.sheenName`, `killstreak.sheenLookupTable`    |


Also used:

- attribute-name matching for `killstreak tier` drives `killstreak.tier` and `killstreak.tierName`
- schema lookup tables and fallback maps decode effect/sheen display names

### Unusual Effects


| Defindex | Meaning                   | Output field(s)                                            |
| -------- | ------------------------- | ---------------------------------------------------------- |
| `134`    | Legacy particle effect id | `unusual.effectId`, `unusual.effectName`, `unusual.source` |


Also used:

- attribute-name/class matching for particle attributes
- community description/tag fallback for effect text parsing

### Name and Cosmetic Helpers


| Defindex | Meaning          | Output field(s)                 |
| -------- | ---------------- | ------------------------------- |
| `500`    | Custom item name | `names.custom`, `names.display` |


Also used:

- attribute-name `paintkit_proto_def_index` drives `cosmetics.paintkitId`
- attribute-name `is_festivized` drives `flags.isFestivized`
- quality is primarily from raw quality id + schema/community tags (`quality.id`, `quality.name`)

### Attribute Normalization Notes

- Defindexes `214`, `294`, `379`, `381`, `383`, `494` are integer-coerced during attribute normalization so counter-like values do not lose precision.
- Generic lookup decoding uses schema `string_lookups` tables and is exposed through:
  - `attributes[].lookupTable`
  - `attributes[].decodedValue`

## Error Mapping

- `401`: `invalid_key`
- `403`: `private_inventory`
- `404`: `vanity_not_found`
- `429`: `rate_limited`
- `502`: `upstream_http_error`
- `500`: `response_parse_error`

## Development Checks

```bash
npm run typecheck
npm test
```
