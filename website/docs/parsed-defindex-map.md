---
sidebar_position: 5
---

# Parsed Defindex Map

This page lists currently implemented defindex parsing and where each value ends up in normalized output.

## Trade

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `153` | `trade.cannotTrade` | Explicit non-tradable flag in attributes |
| `195` | `trade.alwaysTradable`, `trade.cannotTrade` logic | Overrides normal trade lock behavior |
| `2028` | `trade.isMarketable` | Steam Community Market compatibility |
| `211` | `trade.tradableAfter` | Unix timestamp (seconds) |

## Crafting

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `449` | `crafting.neverCraftable` | Permanent crafting restriction |
| `785` | `crafting.cannotGiftWrap` | Item cannot be wrapped |
| `786` | `crafting.toolNeedsGiftWrap` | Tool requires wrapped target |

## Tool Metadata

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `2012` | `tool.targetDefindex`, `tool.targetItemName` | Resolves target defindex using schema item map |
| `2000..2008` | `tool.recipeComponents` | Craft recipe component defindexes |
| `805` | `tool.unusualifierTemplate` | Stored as template string value |

## Paint and Texture

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `142` | `paint.rgbPrimary`, `paint.primaryName` | Numeric color converted to hex + known paint name |
| `261` | `paint.rgbSecondary`, `paint.secondaryName` | Secondary color conversion and lookup |
| `542` | `paint.styleOverride` | Integer style index |
| `725` | `paint.textureWear` | Float-like wear value for war paints/skins |
| `749` | `paint.textureWearDefault` | Default wear seed value |
| `866` | `paint.seedLow` | Low/random seed component |
| `867` | `paint.seedHigh` | High/random seed component |

## Spells

### Spell defindexes

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `1004` | `spells.paint` | Decoded from token table |
| `1005` | `spells.footsteps` | Decoded from token table (includes color variants) |
| `1006` | `spells.voices` | Boolean toggle |
| `1007` | `spells.pumpkinBombs` | Boolean toggle |
| `1008` | `spells.greenFlames` | Boolean toggle |
| `1009` | `spells.deathGhosts` | Boolean toggle |
| `2016..2020` | `spells.spellbookPages` | Collected when value > 0 |

### Known paint spell variants (`1004`)

| Token | Decoded Name |
| --- | --- |
| `TF_HalloweenSpell_Paint_1_Attr` | Putrescent Pigmentation |
| `TF_HalloweenSpell_Paint_2_Attr` | Die Job |
| `TF_HalloweenSpell_Paint_3_Attr` | Chromatic Corruption |
| `TF_HalloweenSpell_Paint_4_Attr` | Spectral Spectrum |
| `TF_HalloweenSpell_Paint_5_Attr` | Sinister Staining |

### Known footsteps spell variants (`1005`)

| Token | Decoded Name | Variant |
| --- | --- | --- |
| `TF_HalloweenSpell_Footprints_1_Attr` | Team Spirit Footprints | Team color pair |
| `TF_HalloweenSpell_Footprints_2_Attr` | Headless Horseshoes | Base variant |
| `TF_HalloweenSpell_Footprints_8421376_Attr` | Gangreen Footprints | Green variant |
| `TF_HalloweenSpell_Footprints_3100495_Attr` | Corpse Gray Footprints | Gray variant |
| `TF_HalloweenSpell_Footprints_5322826_Attr` | Violent Violet Footprints | Violet variant |
| `TF_HalloweenSpell_Footprints_13595446_Attr` | Rotten Orange Footprints | Orange variant |
| `TF_HalloweenSpell_Footprints_8208497_Attr` | Bruised Purple Footprints | Purple variant |

### Spell token behavior

- Token values with leading `#` are normalized (the `#` is removed before lookup).
- If a token is unknown, the original token string is returned as-is in output.

## Strange Restrictions

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `468` | `strangeRestrictions.selector` | Restriction mode selector |
| `385` | `strangeRestrictions.newCounterId` | Counter type assigned by strangeifier/parts logic |
| `454/455` | `strangeRestrictions.entries[]` item slot 1 type/value | Paired as `{scope:item, slot:1}` |
| `456/457` | `strangeRestrictions.entries[]` item slot 2 type/value | Paired as `{scope:item, slot:2}` |
| `496/497` | `strangeRestrictions.entries[]` item slot 3 type/value | Paired as `{scope:item, slot:3}` |
| `458/459` | `strangeRestrictions.entries[]` user slot 1 type/value | Paired as `{scope:user, slot:1}` |
| `460/461` | `strangeRestrictions.entries[]` user slot 2 type/value | Paired as `{scope:user, slot:2}` |
| `462/463` | `strangeRestrictions.entries[]` user slot 3 type/value | Paired as `{scope:user, slot:3}` |

## Crates and Cases

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `187` | `crate.series` | Primary direct crate series source |
| _(metadata-derived)_ | `crate.possibleUnusualHints[]` | Hints extracted from case description text |
| _(metadata-derived)_ | `crate.possibleContentsCollection` | Collection name inferred from description text |
| _(metadata-derived)_ | `crate.possibleContentsItems[]` | Candidate item names parsed from collection list lines |

### Community metadata signals used for crate/case parsing

| Metadata Source | Pattern / Example | Used For |
| --- | --- | --- |
| Description line text | `Series #124` | `crate.series` fallback when defindex-based series is missing |
| Type tag (`category=Type`) | `Crate`, `Cosmetic Case` | `crate.type`, `flags.isCrate`, `flags.isCommunityCrate` |
| Item type/name/hash text | `Summer 2024 Cosmetic Case` | Crate/case detection fallback |

### Possible unusual hints found in case descriptions

| Description Pattern | Example | Note |
| --- | --- | --- |
| `Contents may be ... Unusual with ... effect` | `... Unusual with a Halloween 2023 effect` | Treated as case-contents metadata, not the case item's own unusual effect |
| `Unusual Effect: <effect>` | `Unusual Effect: Chromatic Blaze` | Common in case listings; should not mark the case itself as unusual |

### Possible cosmetics and collection hints found in case descriptions

| Description Pattern | Example | Note |
| --- | --- | --- |
| Collection name line | `Bone-Chilling Bonanza Collection` | Indicates collection/theme for possible drops |
| Individual item lines after collection line | `Bare Bear Bones`, `Demonic Dome`, `Power Spike` | Represents possible cosmetic drops listed in metadata |

## Killstreak

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `2013` | `killstreak.effectId`, `killstreak.effectName`, `killstreak.effectLookupTable` | Supports schema lookup + description-format fallback |
| `2014` | `killstreak.sheenId`, `killstreak.sheenName`, `killstreak.sheenLookupTable` | Supports schema lookup + description-format fallback |

## Unusual Effects

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `134` | `unusual.effectId`, `unusual.effectName`, `unusual.source` | Primary unusual particle source before community fallbacks |

## Name and Cosmetic Helpers

| Defindex | Output Field(s) | Notes |
| --- | --- | --- |
| `500` | `names.custom`, `names.display` | Custom item naming |
| `143` | `attributes[].decodedValue` | Hire date-time decode (`YYYY-MM-DDTHH:mm:ss`) for `"custom employee number"` |

## Fallback and Derived Parsing

These are not direct single-defindex mappings, but they affect output:

- **Crafting**
  - raw `flag_cannot_craft` -> `crafting.cannotCraft`
  - attribute-name contains `"cannot craft"` -> `crafting.cannotCraft`
- **Crates/Cases**
  - attribute-name contains `"crate series"`
  - community description/type/name/market hash parsing
  - outputs: `crate.series`, `crate.type`, `flags.isCrate`, `flags.isCommunityCrate`
- **Killstreak tier**
  - attribute-name matching `"killstreak tier"` -> `killstreak.tier`, `killstreak.tierName`
- **Unusual fallback**
  - particle-like attribute name/class matching
  - community descriptions/tags fallback parsing
- **Cosmetic helpers**
  - `paintkit_proto_def_index` name matching -> `cosmetics.paintkitId`
  - `is_festivized` name matching -> `flags.isFestivized`
- **Quality grade**
  - parsed from community metadata (`tags`, `type`, descriptions) -> `quality.grade`

## Normalization Notes

- Integer-coerced counter defindexes: `214`, `294`, `379`, `381`, `383`, `494`
- Schema `string_lookups` decoding is exposed as:
  - `attributes[].lookupTable`
  - `attributes[].decodedValue`
