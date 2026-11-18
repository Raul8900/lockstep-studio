'use strict';
/* Scene 1 — HOOK: "The Moon is slowly running away from us."
   One photograph, and the camera does the telling: it starts tight on the Moon and pulls back
   to the city underneath, so the Moon shrinks away as the line is spoken.

   How a scene file works
   - One file per beat in script.py, named sNN_<beat id>.js so the files sort in narration order.
   - Setup code runs once: look up cue times, declare media (useImage, useVideo, world3d), schedule sounds.
   - The draw function is a pure function of t (seconds from the start of the video): no Math.random(),
     no Date, nothing remembered between frames — frames are rendered out of order by several workers.
   - Everything is timed from spoken words: at(beat, word) is the second that word starts,
     at(beat, word, 2) its second occurrence, at(beat, word, 1, 't1') where it ends.
     `lockstep words <video>` prints every word with its time.                                   */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { moon: at('hook', 'moon'), running: at('hook', 'running'), end: at('hook', 'us', 1, 't1') };
  const sky = useImage('moon-capitol');             // media/moon-capitol.jpg — NASA, public domain (media/credits.json)

  sfx(0.0, 'swell', 0.5);
  sfx(c.running - 0.15, 'whoosh', 0.55);

  addScene('hook', function (ctx, t) {
    /* a pull-back: from a close-up of the Moon (top left of the picture) to the whole city */
    const p = tw(t, 0, c.end + 0.4, E.ioSine);
    photo(ctx, sky, p, { from: { z: 2.1, x: 0.28, y: 0.12 }, to: { z: 1.0, x: 0.42, y: 0.42 }, ease: E.lin });
  });
});
