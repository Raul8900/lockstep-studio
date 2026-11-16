# Illustrations

Microsoft Fluent Emoji (MIT licence, `LICENSE-fluent-emoji`) in three styles — 1595 subjects: people (with five skin tones), faces, animals, plants, food, objects, places, symbols.

| Set | Looks like | File |
|---|---|---|
| `color` | soft gradients, a gentle 3D feel | `fluent-color.json.gz` (13.2 MB, from `@iconify-json/fluent-emoji` 1.2.7) |
| `flat` | flat fills, no gradients | `fluent-flat.json.gz` (1.1 MB, from `@iconify-json/fluent-emoji-flat` 1.2.6) |
| `line` | single-colour line art, tinted to any colour | `fluent-line.json.gz` (1.0 MB, from `@iconify-json/fluent-emoji-high-contrast` 1.2.6) |

`index.json` lists every subject with its English label, group, keywords and the skin tones available. The keywords come from emojibase-data (MIT, `LICENSE-emojibase`), which derives them from Unicode CLDR (Unicode License, `LICENSE-unicode-cldr`).

Search: `bin/lockstep art honey`. Preview in a video's look: `bin/lockstep art-sheet <video> honeybee flower`.
In a scene: `const bee = art('honeybee')` in the setup, `drawArt(ctx, bee, x, y, size)` in the draw function
(see `.claude/skills/explainer-video/reference/illustration.md`).

The bundles are gzip-compressed Iconify JSON (`{icons: {name: svg body}, aliases, width, height}`); the render server
unpacks them on demand. `python3 scripts/fetch_assets.py illustrations` rebuilds this folder.
