# Assets

Open-licence material the renderer loads directly — nothing to install, nothing paid.
`scripts/fetch_assets.py` rebuilds or extends this folder from the original sources.

| Folder | What | Source | Licence |
|---|---|---|---|
| `fonts/` | 33 type families, Latin subset, WOFF2 (`fonts/README.md` lists each family's character and weights) | Google Fonts via the Fontsource npm packages | SIL Open Font License 1.1 (31 families), Apache 2.0 (Permanent Marker, Special Elite); licence file in each family's folder |
| `icons/` | 2,359 line icons as SVG path data (`icons/names.txt`) | Lucide (`lucide-static`) | ISC (`icons/LICENSE`) |
| `palettes/` | 1,000 five-colour palettes; 13 hues × 10 shades | `nice-color-palettes`; Open Color | MIT (`palettes/LICENSE-*`) |
| `illustrations/` | 1,595 subjects (people with five skin tones, animals, food, objects, places) in three styles: colour, flat, line; keyword index | Microsoft Fluent Emoji via the Iconify packages; keywords from `emojibase-data` (Unicode CLDR) | MIT (`illustrations/LICENSE-fluent-emoji`, `LICENSE-emojibase`); CLDR data under the Unicode License (`LICENSE-unicode-cldr`) |

Every licence here allows redistribution and commercial use, including in rendered videos. The
Open Font License forbids selling the fonts on their own and requires distributing them with their
licence; Apache 2.0, ISC, MIT and the Unicode License require keeping the licence and copyright
notices. Keeping the files as they are satisfies all of them. Crediting the illustrations in a
published video's description ("Illustrations: Microsoft Fluent Emoji (MIT)") is good practice;
the production report prints that line whenever a video uses them.
