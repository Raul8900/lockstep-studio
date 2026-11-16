# Palettes

Raw material for designing a style's palette — not ready-made styles.

- `nice-1000.json` — 1000 five-colour palettes (nice-color-palettes, MIT): good for finding a colour mood.
- `open-color.json` — 13 hues × 10 shades (Open Color, MIT): good for picking a readable shade of a hue.

`bin/lockstep palettes warm` / `dark` / `pastel` / `vivid` / `#E63946` renders matching palettes to an image you can look at.
A palette from here still has to be assigned to roles (background, ink, subject, accent, data, alert, good) and pass
`bin/lockstep style-check <video>`.
