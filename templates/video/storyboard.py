"""Storyboard for “__TITLE__”.

Read by `lockstep docs` to write docs/visual_storyboard.md. One tuple per sequence
(a sequence is one continuous visual idea, usually 3-8 seconds; a chapter has several):

  (title, start, end,
   objects on screen, position and size, background, movement, timing and easing,
   camera, colour and emphasis, text overlays, transition out, sound, purpose)

Times are looked up, never typed in: at(beat, word[, nth, edge]) is the moment a word is
spoken, S(chapter_id) is where a chapter's scene starts, dur is the length of the video.
Sequences must be contiguous: each one starts where the previous one ends, 0 -> dur.
"""

# How the shared colour language maps onto this topic (shown in the conventions section).
COLOUR_LANGUAGE = ("Cyan #27E1FF = the thing that works · Amber #FFA91E = the one idea in focus · Violet #A073FF = the voice · "
                   "Coral #FF5F70 = wrong timing · Mint #4DFFB5 = picture and voice locked together · White = what is being said now.")


def sequences(at, S, dur):
    return [
     ("The feed stops", 0.0, S("idea"),
      "A column of skeleton feed cards; one hero card; headline.",
      "Cards 620 × 190 px, centred on x 540, visible between y 560 and 1200. Headline baseline y 510.",
      "Standard backdrop.",
      "The feed scrolls upward fast and decelerates to a dead stop on “impossible”; the hero card lights up and a ring expands from it.",
      "Scroll: ease-out-cubic ending 0.12 s after the cue. Hero card: ease-out-back 0.3 s. Ring: 0.8 s ease-out.",
      "Static.",
      "Everything grey until the stop; the hero card turns cyan.",
      "“WHAT MAKES AN EXPLAINER” · “JUST ANOTHER POST” → “SCROLL-PROOF?”.",
      "Zoom into the hero card.",
      "Whoosh at 0.05 s, ticks while scrolling, lock + impact on the stop, chime after the question.",
      "Show the problem the video answers, as an action, in the first two seconds."),
     ("One idea", S("idea"), at("idea", "every") - 0.4,
      "Five identical dots in a row; the middle one becomes the idea.",
      "Dots on y 870, 160 px apart, centred on x 540, inside a stage panel x 90–990, y 600–1140.",
      "Standard backdrop.",
      "All five drift gently; on “one” the middle dot grows and turns amber while the others shrink and dim.",
      "Ease-out-back 0.3 s on the cue.",
      "Static.",
      "Amber for the single idea; the rest recede to grey.",
      "“ONE IDEA” · “at a time”.",
      "Cross-fade inside the scene.",
      "Pop on “one”.",
      "One picture for one sentence."),
     ("On the word", at("idea", "every") - 0.4, S("payoff"),
      "A narration track with a tick for every spoken word, a playhead, one picture box, two rejected ghost boxes.",
      "Track on y 1010 from x 130 to 950; picture box 210 × 170 px centred at (540, 800); ghosts 250 px to either side.",
      "Standard backdrop.",
      "The playhead travels in real time; the box drops in exactly as it reaches “word”; an early and a late ghost are crossed out on “before” and “after”.",
      "Box: ease-out-back 0.3 s. Ghosts: ease-out-cubic 0.25 s.",
      "Static.",
      "Violet ticks (voice), cyan playhead, mint box (in sync), coral ghosts (wrong).",
      "“ON THE WORD” · “not before · not after” · “NARRATION” · “EARLY” · “LATE”.",
      "Pan down.",
      "A tick on every word, stamp + chime on the landing, a low buzz for each ghost.",
      "Demonstrate the rule using the narration's real word timings."),
     ("Lockstep", S("payoff"), dur,
      "Two stacked panels: a waveform (voice) and a drawn line (picture); a shared playhead; headline.",
      "Panels 820 × 210 px at x 130; the pair is centred on y 850. Headline baseline y 500.",
      "Standard backdrop.",
      "The waveform wakes on “say”, the line draws itself on “show”; on “lockstep” the panels snap together, turn mint, and one playhead sweeps both.",
      "Ease-out-cubic 0.35 s for each wake-up; ease-out-back 0.3 s for the snap.",
      "Static.",
      "Violet and cyan become a single mint.",
      "“SAY IT.” · “SHOW IT.” → “IN LOCKSTEP” · “VOICE · PICTURE · SOUND — ONE CLOCK”.",
      "End of video (holds, still moving, for the end card).",
      "Call on “say”, pop on “show”, riser into lock + impact, final chime.",
      "Leave the viewer with the rule in four words."),
    ]
