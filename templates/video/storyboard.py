"""Storyboard for “__TITLE__”.

Read by `lockstep docs` to write docs/visual_storyboard.md. One tuple per sequence (a sequence is
one continuous shot or idea, usually 2-6 seconds):

  (title, start, end,
   what fills the frame, media, camera, overlays, timing, transition out, sound, purpose)

Times are looked up, never typed in: at(beat, word[, nth, edge]) is the moment a word is spoken,
S(beat_id) is where a beat's scene starts, dur is the length of the video. Sequences must be
contiguous: each one starts where the previous one ends, 0 -> dur.
"""

# What the overlay colours mean in this video (shown in the conventions section).
COLOUR_LANGUAGE = "Yellow = the key word and the number to remember · Blue = the ocean · Green = the laser · White = everything else."


def sequences(at, S, dur):
    return [
     ("The Moon is leaving", 0.0, S("drift"),
      "A NASA photograph: the full Moon over the US Capitol at dusk.",
      "moon-capitol (NASA, public domain).",
      "Starts tight on the Moon (2.1×) and pulls back to the whole city by the end of the line, so the Moon shrinks away as it is said.",
      "None: the picture carries the hook.",
      "The pull-back runs linearly from 0 s to 0.4 s after “us”.",
      "Hard cut.",
      "A swell under the first words; a whoosh into “running”.",
      "Open the question in the first second: why would the Moon leave?"),
     ("Four centimetres a year", S("drift"), at("drift", "pushed"),
      "A 3D Earth and Moon in black space with stars, wrapped in NASA's maps.",
      "earth-map (NASA Blue Marble, public domain), moon-map (Solar System Scope, CC BY 4.0).",
      "From high behind the Earth, the camera dollies in; the Moon hangs above and slides away along its orbit.",
      "“3.8 cm — further every year” counts up and lands on “four”.",
      "The drift spans “every” to just after “out”; the number counts for 0.9 s from “four”.",
      "Continuous.",
      "An impact on “four”.",
      "Make the drift concrete with one number."),
     ("Pushed by the tides", at("drift", "pushed"), S("proof"),
      "The same world, closer: the ocean's bulge appears as a pale shell leaning towards the Moon.",
      "As above.",
      "Closer and to the side: the Earth fills the lower half.",
      "A pointer: “OCEAN TIDE”.",
      "The shell fades in over 0.8 s around “tides”.",
      "Hard cut.",
      "A swell on “tides”.",
      "Give the cause in one picture."),
     ("Mirrors on the Moon", S("proof"), dur,
      "NASA film of the Apollo 11 moonwalk, then the laser-ranging mirror the astronauts left, then a green laser from the sky landing on it.",
      "apollo-moonwalk (NASA film, public domain), retroreflector (NASA photograph AS11-40-5952, public domain).",
      "The film pushes in gently and plays through a held moment (the voice silent 1.2 s); the photograph pushes in on the mirror.",
      "A pointer “MIRROR” on the array; the laser beam and its glow.",
      "The photograph cuts in 0.3 s before “mirrors”; the beam draws down on “lasers”.",
      "End of video.",
      "A whoosh into the cut; a blip on “mirrors”; a zip and a chime on the laser.",
      "Prove it: a real mirror, still in use."),
    ]
