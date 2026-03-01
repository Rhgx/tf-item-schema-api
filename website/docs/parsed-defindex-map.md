---
sidebar_position: 5
---

# Parsed Defindex Map

This is the currently implemented attribute defindex parsing and normalized output mapping.

## Trade

- `153` -> `trade.cannotTrade`
- `195` -> `trade.alwaysTradable` and `trade.cannotTrade` logic
- `2028` -> `trade.isMarketable`
- `211` -> `trade.tradableAfter`

## Crafting

- `449` -> `crafting.neverCraftable`
- `785` -> `crafting.cannotGiftWrap`
- `786` -> `crafting.toolNeedsGiftWrap`

Also used:

- raw `flag_cannot_craft`
- "cannot craft" attribute-name matching -> `crafting.cannotCraft`

## Tool Metadata

- `2012` -> `tool.targetDefindex`, `tool.targetItemName`
- `2000..2008` -> `tool.recipeComponents`
- `805` -> `tool.unusualifierTemplate`

## Paint / Texture

- `142` -> `paint.rgbPrimary`
- `261` -> `paint.rgbSecondary`
- `142/261` color values are also mapped to:
  - `paint.primaryName`
  - `paint.secondaryName`
- `542` -> `paint.styleOverride`
- `725` -> `paint.textureWear`
- `749` -> `paint.textureWearDefault`
- `866` -> `paint.seedLow`
- `867` -> `paint.seedHigh`

## Spells

- `1004` -> `spells.paint`
- `1005` -> `spells.footsteps`
- `1006` -> `spells.voices`
- `1007` -> `spells.pumpkinBombs`
- `1008` -> `spells.greenFlames`
- `1009` -> `spells.deathGhosts`
- `2016..2020` -> `spells.spellbookPages`

Notes:

- Spell lookup tokens such as `#TF_HalloweenSpell_Paint_2_Attr` are mapped to friendly labels
  (for example `Die Job`) using TF2 localization keys.

## Strange Restrictions

- `468` -> `strangeRestrictions.selector`
- `385` -> `strangeRestrictions.newCounterId`
- `454/455` -> `strangeRestrictions.entries[]` item slot 1 type/value
- `456/457` -> `strangeRestrictions.entries[]` item slot 2 type/value
- `496/497` -> `strangeRestrictions.entries[]` item slot 3 type/value
- `458/459` -> `strangeRestrictions.entries[]` user slot 1 type/value
- `460/461` -> `strangeRestrictions.entries[]` user slot 2 type/value
- `462/463` -> `strangeRestrictions.entries[]` user slot 3 type/value

## Crates and Cases

- `187` -> `crate.series`

Also used:

- attribute-name fallback containing "crate series"
- community description/type/name/market hash parsing
- output fields: `crate.series`, `crate.type`, `flags.isCrate`, `flags.isCommunityCrate`

## Killstreak

- `2013` -> `killstreak.effectId`, `killstreak.effectName`, `killstreak.effectLookupTable`
- `2014` -> `killstreak.sheenId`, `killstreak.sheenName`, `killstreak.sheenLookupTable`

Also used:

- attribute-name matching for `killstreak tier` -> `killstreak.tier`, `killstreak.tierName`

## Unusual Effects

- `134` -> `unusual.effectId`, `unusual.effectName`, `unusual.source`

Also used:

- particle-like attribute name/class matching
- community descriptions/tags fallback parsing

## Name and Cosmetic Helpers

- `500` -> `names.custom`, `names.display`
- `143` -> `attributes[].decodedValue` hire date decode (`YYYY-MM-DDTHH:mm:ss`) for `"custom employee number"`

Also used:

- `paintkit_proto_def_index` attribute-name matching -> `cosmetics.paintkitId`
- `is_festivized` attribute-name matching -> `flags.isFestivized`

## Quality Grade (Community Metadata)

Decorated weapon grade is not parsed from name prefixes. It is parsed from community metadata:

- tags (for example `Rarity`)
- item `type`
- description lines

Output field:

- `quality.grade`

## Attribute Normalization Notes

- Integer-coerced counter defindexes: `214`, `294`, `379`, `381`, `383`, `494`
- Schema `string_lookups` decoding is exposed via:
  - `attributes[].lookupTable`
  - `attributes[].decodedValue`
