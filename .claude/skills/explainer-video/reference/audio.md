# Music, sound design and mix

Everything is synthesised by `engine/audio/make_audio.py` — no samples, no third-party
recordings — from three inputs: the narration, the chapter moods in `video.json`, and the sound
cues your scenes emit with `sfx()`. `bin/lockstep audio <slug>` builds it (the build does this
for you) and prints the voice-to-bed ratio.

## Music: one mood per chapter

The score runs at 100 BPM in the D-minor family and changes arrangement at each scene boundary.
Choose a mood for each chapter in `video.json`:

```json
"chapters": [
  { "id": "hook",   "name": "THE MYTH",   "mood": "drone" },
  { "id": "idea",   "name": "THE IDEA",   "mood": "light" }
]
```

| Mood | Character | Use for |
|---|---|---|
| `drone` | held pad, no pulse | the hook, a cold open |
| `light` | gentle pulse, soft arpeggio | the first explanation |
| `groove` | steady, a little more drive | a process, a hand-off |
| `build` | rising progression | zooming in, a reveal |
| `mechanical` | kick on every beat, sparse | the core mechanism; leaves room for many sound effects |
| `drive` | fuller, forward | putting the pieces together |
| `dark` | half-time, minor | costs, bottlenecks, warnings |
| `bright` | major, busiest arpeggio | applications, the pay-off moments |
| `tense` | filtered, no kick | limits, failure cases |
| `finale` | full; resolves to D major | the last chapter (ends on a held chord after the last word) |

Shape an arc: start quiet, add energy through the middle, drop for the problem or limit, finish
full. Two neighbouring chapters should not share a mood. If `mood` is omitted the engine uses
`drone` first, `finale` last and a default cycle between.

## Sound cues

```js
sfx(time, type, gain = 1, { pitch, dur })
```

Call it in the scene's setup code (not inside the draw function), with the same cue expression
that drives the picture. `gain` scales the type's preset level; 0.4–1.0 is the useful range.

| Type | Sounds like | Use for | Options |
|---|---|---|---|
| `tick` | tiny high click | each item of a series, a counter step | `pitch` |
| `blip` | two-note UI beep | a label or value appearing | `pitch` |
| `pop` | short downward pop | an object appearing | `pitch` |
| `thump` | soft low hit | a pulse, a beat of a repeating action | |
| `impact` | deep hit with a tail | the big moment of a chapter; a key number landing | |
| `stamp` | dry low knock | something placed, copied, stamped out | |
| `whoosh` | filtered noise sweep, pans | a fast move, a scene dive | |
| `riser` | rising noise and tone | the half-second before a reveal | `dur` |
| `count` | accelerating ticks | a number counting up | `dur` |
| `data` | scattered high blips | data moving, transfer in progress | `dur` |
| `slide` | soft noise glide | something sliding in or along | `dur` |
| `zip` | fast upward sweep | a send, a launch | |
| `chime` | bell-like | success, a resolved idea, the end card | `pitch` |
| `flip` | swish with a click | a swap, a state flip | |
| `rip` | tearing noise | splitting, cutting apart | |
| `deny` | low buzz | wrong, blocked, crossed out | |
| `lock` | bright click | snapping into place, synchronising | `pitch` |
| `slice` | thin high cut | dividing into parts | |
| `fire` | zap | one execution, a trigger | `pitch` |
| `call` | short tone | a command given, a call-out | `pitch` |
| `splash` | soft wide burst | spreading, filling | |
| `stall` | falling tone | slowing, waiting, failing | |
| `boot` | low power-up | the very first frame | |
| `swell` | warm chord swell | a wide reveal, a held moment | `dur` |

An unknown type stops the audio build with its name and time.

### Using them well

- Every visible event gets a sound; no sound without a visible cause.
- A big moment is layered: `riser` into it, `impact` on it, `chime` or `lock` just after.
- A repeating visual gets a repeating cue (`for (…) sfx(c.x + k * period, 'thump', 0.7 - k * 0.05)`),
  slightly quieter each time.
- Rising `pitch` across a series (`{ pitch: 1 + i * 0.06 }`) reads as progress.
- **Protect short words.** A loud percussive cue exactly on the first consonant of a one- or
  two-word sentence can mask it. Place the cue 50–80 ms before the word and keep its gain at
  0.5–0.6, or let the cue land in the pause.
- The reference video uses 235 cues in 162 s — roughly three every two seconds. Fewer than one
  per second usually means there are visual events without sound.

## Mix

Voice: light compression and a presence lift. Music and effects are ducked while the voice is
speaking and come up in the pauses. The master is normalised to −14 LUFS with a look-ahead
limiter (true peak about −1.5 dBFS).

`bin/lockstep audio` prints `speech_to_bed_ratio_db` — how far the voice sits above music plus
effects while speaking. **15–17 dB** is the target: below about 13 the voice fights the bed on a
phone speaker; above about 19 the music disappears. Adjust in `video.json` if needed:

```json
"mix": { "music_db": -4.0, "sfx_db": -0.5, "duck_music_db": -8.5, "duck_sfx_db": -3.5 }
```

(Those are the defaults: bus levels, and how far each bus drops under speech.)

After changing cues, moods or mix levels, picture frames are unaffected:

```bash
bin/lockstep meta <slug> && bin/lockstep audio <slug> && bin/lockstep assemble <slug> --remux && bin/lockstep validate <slug>
```

## Checking by ear, without ears

You cannot listen, so rely on the measurements:

- `check-voice` on the clean narration, and "voice intelligible in the mix" in the verdict (the
  same recogniser on the finished mix). A word that is right in the clean voice but wrong in the
  mix is being masked: move or soften the cue on it, or choose a sparser mood for that chapter.
- Loudness, true peak and sync are measured on the final file by `validate`.
- Say in the report that the mix was verified by measurement and speech recognition, not by listening.
