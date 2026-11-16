# Fonts

Open-licence families, Latin subset, loaded by the renderer straight from this folder — nothing to install.
Use the family name in a video's `style.json` (`fonts.display`, `fonts.body`, `fonts.mono`).
Each family's licence is in its folder. A weight a scene asks for that is not listed falls back to the nearest one.
The Latin subset has no arrows other than ↑ ↓; other symbols fall back to Inter.

Inter, Inter Display and JetBrains Mono (the default style) are installed on the system by `scripts/setup.sh`.

| Family | Role | Character | Weights | Licence |
|---|---|---|---|---|
| Abril Fatface | display | fat-face serif, magazine drama | 400 | OFL-1.1 |
| Anton | display | tall condensed impact, poster caps | 400 | OFL-1.1 |
| Archivo | display/body | sturdy grotesque, wide weight range | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Archivo Black | display | heavy grotesque headline | 400 | OFL-1.1 |
| Baloo 2 | display | chunky rounded, warm | 400, 500, 600, 700, 800 | OFL-1.1 |
| Bangers | display | comic-book caps | 400 | OFL-1.1 |
| Bebas Neue | display | condensed caps, cinematic titles | 400 | OFL-1.1 |
| Caveat | display/accent | quick handwriting, annotations | 400, 500, 600, 700 | OFL-1.1 |
| Courier Prime | mono | typewriter mono | 400, 700 | OFL-1.1 |
| DM Mono | mono | soft, light mono | 400, 500 | OFL-1.1 |
| DM Sans | body | clean low-contrast sans | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| DM Serif Display | display | confident serif headline | 400 | OFL-1.1 |
| Fira Code | mono | programmer mono | 400, 500, 600, 700 | OFL-1.1 |
| Fraunces | display | soft old-style serif, warm editorial | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Fredoka | display | rounded, playful, kids and food | 400, 500, 600, 700 | OFL-1.1 |
| IBM Plex Mono | mono | engineered mono | 400, 500, 600, 700 | OFL-1.1 |
| IBM Plex Sans | body | engineered, corporate-technical | 400, 500, 600, 700 | OFL-1.1 |
| Lora | body | calligraphic serif for reading | 400, 500, 600, 700 | OFL-1.1 |
| Manrope | body | modern, slightly geometric sans | 400, 500, 600, 700, 800 | OFL-1.1 |
| Nunito | body | rounded sans, gentle | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Oswald | display | condensed gothic, news and sport | 400, 500, 600, 700 | OFL-1.1 |
| Patrick Hand | body/accent | neat handwriting, notebook | 400 | OFL-1.1 |
| Permanent Marker | accent | marker pen | 400 | Apache-2.0 |
| Playfair Display | display | high-contrast serif, elegant, history and culture | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Poppins | display/body | friendly geometric | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Rubik | display/body | soft-cornered, approachable | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Source Serif 4 | body | sober serif, science and essays | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Space Grotesk | display | geometric, technical, a little quirky | 400, 500, 600, 700 | OFL-1.1 |
| Space Mono | mono | retro-futurist mono | 400, 700 | OFL-1.1 |
| Special Elite | accent | typewriter, documents and mystery | 400 | Apache-2.0 |
| Syne | display | art-school, expressive extra-bold | 400, 500, 600, 700, 800 | OFL-1.1 |
| Unbounded | display | wide, rounded, futuristic | 400, 500, 600, 700, 800, 900 | OFL-1.1 |
| Work Sans | body | neutral grotesque | 400, 500, 600, 700, 800, 900 | OFL-1.1 |

Add a family: put its Fontsource id in `scripts/fetch_assets.py` and run `python3 scripts/fetch_assets.py fonts`.
