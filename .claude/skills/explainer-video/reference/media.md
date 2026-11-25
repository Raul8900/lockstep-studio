# Media: finding, choosing and crediting real pictures

Every picture, clip and model in a video comes from a free source under a licence that allows
it, and is recorded in `media/credits.json` with where it came from, who made it and its licence.
Nothing is bought, nothing is ripped from a platform, nothing is generated and passed off as real.

## Sources

`bin/lockstep sources` lists them and which are ready.

| Source | Holds | Licences | Key |
|---|---|---|---|
| `wikimedia` | photographs, paintings, maps, diagrams, archive film — the widest archive | per file: public domain, CC0, CC BY (BY-SA and NC are filtered out) | none |
| `nasa` | spaceflight, Earth, planets, missions; photographs and film | public domain (credit NASA) | none |
| `aic` | Art Institute of Chicago: paintings, prints, photographs | CC0 | none |
| `cleveland` | Cleveland Museum of Art: paintings, prints, objects | CC0 | none |
| `openverse` | 800M openly licensed images (Flickr, museums …); slow | per file | none |
| `archive` | Internet Archive: public-domain films, newsreels, educational reels | public domain, CC BY | none |
| `polyhaven` | photoreal 3D models, HDRI skies, textures | CC0 | none |
| `khronos` | glTF sample models: a fox, a walking man, showcase objects | CC0 / CC BY per model | none |
| `ambientcg` | PBR textures: wood, paper, metal, ground | CC0 | none |
| `incompetech` | music: 1,400+ tracks by Kevin MacLeod, tagged by feel, instruments, tempo | CC BY 4.0 | none |
| `pexels` | modern stock photos and footage, many vertical | Pexels licence | `PEXELS_API_KEY` (free) |
| `pixabay` | stock photos, illustrations, vectors, footage | Pixabay licence | `PIXABAY_API_KEY` (free) |

Keys: in the environment or in `~/.config/lockstep/keys.json` (`{"PEXELS_API_KEY": "…"}`). They
are the person's own accounts: if the video needs modern footage and no key is set, tell them where
to get one (pexels.com/api, pixabay.com/api/docs) and carry on with the rest.

Media are for evidence — the real person, place, event or document. Animation is built in code
(reference/shots.md), so most videos need only a handful of pictures and clips.

## The loop: find, look, take

```bash
bin/lockstep find <slug> photo "Alexander Fleming laboratory"     # kinds: photo, video, model, hdri, texture
#   -> out/find/photo-alexander-fleming-laboratory.jpg : numbered tiles with source, licence, size
bin/lockstep take <slug> last 3 --as fleming-lab                   # or the search's name instead of last
#   -> media/fleming-lab.jpg (at most 2,600 px), its entry in media/credits.json
```

- **Search the thing, not the sentence**: "penicillium mould petri dish", not "the mould that
  saved millions". Try the person's name, the place and year, the object's proper name, the
  museum's term ("engraving", "lithograph", "daguerreotype").
- `--sources wikimedia,nasa` narrows a search; `--n 36` widens it; `--allow-sa` includes
  share-alike (only if the person accepts BY-SA for the whole video).
- Open the sheet every time. The titles and descriptions say what a picture really is: check that
  it shows what the line will say (the right person, place, year), not something like it.
- **Size**: a full-frame push-in wants at least 1500 px on its short side; a landscape picture
  shown full height in 9:16 loses two thirds of its width — make sure the subject is in the part
  that stays. Portrait pictures fit best.
- **One film**: prefer pictures of similar age, light and texture for one world; the grade
  (`style.json`) does the rest.
- `lockstep look <slug>` shows everything taken, through the grade, with a line of captions.

## When to ask the person

Ask with the AskUserQuestion tool — numbered options naming what each candidate shows and its
source and licence — when:

- two or three candidates are equally right and the choice changes the video's feel (which
  portrait of the person, which photograph of the place, which clip to open on);
- none is clearly right: say what you found and what is missing, and offer the closest ones, a
  different shot that would tell the line another way, or adding their own file;
- a picture needs a licence decision (share-alike) or shows identifiable private people.

Point them to the sheet (`out/find/<search>.jpg`; send it with SendUserFile when that tool is
available) so they choose by looking. Ask for several shots in one question rather than one at a
time. Record their choices in the brief's shot plan.

## Cut-outs

```bash
bin/lockstep cutout <slug> fleming-lab      # -> media/fleming-lab.cut.png, the subject without its background
```
IS-Net (open source, run locally; the model downloads once, ~170 MB). Use it on a photograph with
one clear subject — a person, an animal, an object. Open the result: hair and thin parts can be
rough; a busy photo may cut out the wrong thing. In a scene: `useImage('fleming-lab', { cutout:
true })` and `cutout(ctx, h, p, { x, y, h, depth })` in front of another picture.

## Film

`useVideo(name, { from, to })` uses seconds `from`–`to` of the clip; the engine cuts them into
frames once. Keep clips to the seconds you show. Wikimedia and NASA films are often long reels:
find the moment with a frame sheet first, e.g.
`ffmpeg -i media/x.mp4 -vf "fps=1/4,scale=320:-2" /tmp/x_%03d.jpg` and `python3 engine/sheet.py`.

## 3D

Worlds and characters are built in code (scene-api.md, "Built in code"). When a realistic prop
helps, `find <slug> model "…"` searches Poly Haven (props, furniture, food, nature) and Khronos
samples; `hdri` finds skies that light a world realistically; `texture` finds
surfaces. A picture can also be a texture (`await w.texture('earth-map')` on a sphere: NASA's
Blue Marble). A file you have yourself goes in with
`lockstep media <slug> add <file> --as name --licence CC0 --author "…" --page <url>`.

## Credits and licences

- Allowed: public domain, CC0, NASA, CC BY (credit required), the Pexels and Pixabay licences.
- Share-alike (CC BY-SA) only with the person's agreement: the whole video then falls under it.
- Never NC (non-commercial) or ND (no derivatives) — `find` filters them out, `lint` stops them.
- `lockstep media <slug> credits` writes `docs/credits.md` (also part of `build`): the lines the
  licences require, to paste into the video's description. Give it to the person with the MP4.
- Photographs of identifiable people in stock libraries are fine for illustration, never to imply
  that person said or endorses something. Logos and brands only as part of a factual story.

## Files and git

`media/credits.json` is committed; the files themselves are not (they are large, and the credits
say exactly where each came from). `lockstep media <slug> restore` downloads every missing file
again, and re-makes cut-outs. Files added from your own disk must be copied back by hand.
