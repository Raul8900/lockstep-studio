# Looks

The library of visual styles made so far. Each is a `style.json` (the format is documented in
`.claude/skills/explainer-video/reference/art-direction.md`); `previews/` has a tile of each, and
`previews/_all.jpg` shows them side by side.

These are starting points for a video's own look, not a menu: creative direction derives each
video's style from its topic, usually by adapting one of these or building a new one. When a video's
look works and could serve other topics, it is added here:

```bash
bin/lockstep save-style <video> <name>    # copies the video's style.json here and renders its preview
bin/lockstep styles                       # re-renders every preview and lists which videos used which look
```
