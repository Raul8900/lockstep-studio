# Small production assets

Only assets used by the working examples are shipped. No download occurs at render time.

- `countries.geojson`: Natural Earth 110m admin-0 countries, v5.1.2, public domain. Source:
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson
  Original SHA-256 `6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f`.
  Geometry is unchanged; properties reduced to administrative name and code. These are
  editorial map outlines, not a position on disputed boundaries.
- `leaf.svg`: original schematic leaf, CC0-1.0. Preserves a transparent background.
- `hinge-rig.glb`: original two-joint skinned ribbon and four-second sway clip, CC0-1.0.
- `ack.wav`, `paper.wav`, `contact.wav`, `ambience.wav`: original synthetic samples, CC0-1.0.
  They are not field recordings. Paper is a filtered-noise Foley approximation; ambience is
  a filtered-air bed. Reproduce with `python3 scripts/generate_production_assets.py`.

The original example assets above are dedicated to the public domain under
https://creativecommons.org/publicdomain/zero/1.0/ . Natural Earth terms:
https://www.naturalearthdata.com/about/terms-of-use/ . Runtime library licences are independent.
Exact bundled SHA-256 hashes are in `manifest.json`; selected hashes also appear in each report.
