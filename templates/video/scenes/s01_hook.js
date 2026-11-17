'use strict';
/* Scene 1 — HOOK
   "What makes an explainer impossible to scroll past?"
   A feed scrolls by and stops dead on one card, on the word "impossible".

   How a scene file works
   - One file per beat in script.py, named sNN_<beat id>.js so the files sort in narration order.
   - Everything is timed from spoken words: at(beat, word) is the second that word starts,
     at(beat, word, 2) its second occurrence in the beat, at(beat, word, 1, 't1') where it ends.
     `lockstep words <video>` prints every word with its time.
   - The draw function is a pure function of t (seconds from the start of the video).
     No Math.random(), no Date, no values remembered between frames: frames are rendered
     out of order by several workers. Use hash(n) / rng(seed) for randomness.
   - sfx(time, type, gain) schedules a sound at the same cue as the picture.           */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    impossible: at('hook', 'impossible'),
    scroll: at('hook', 'scroll'),
    end: at('hook', 'past', 1, 't1'),
  };
  const stop = c.impossible + 0.12;                 // the feed is fully stopped here

  const CARD = { x: 230, w: 620, h: 190, gap: 26 };
  const PITCH = CARD.h + CARD.gap, HERO = 9;        // card 9 is the one that ends up centred
  const TOP = 560, BOT = 1200, MID = 880;           // window of the feed inside the diagram zone

  /* a Lottie animation (lottie/swipe-up.json, credited in lottie/credits.json): the viewer's finger flicks
     the feed, lifts off, and the feed glides on to its stop. useLottie() here in the setup; drawLottie()
     in the draw function. crop: true trims the empty canvas the artist left around the hand. */
  const swipe = useLottie('swipe-up', { crop: true });

  sfx(0.05, 'whoosh', 0.7);
  for (let k = 0; k < 5; k++) sfx(0.2 + k * (stop - 0.3) / 5, 'tick', 0.6, { pitch: 1 - k * 0.06 });
  sfx(stop - 0.02, 'lock', 0.9);
  sfx(stop, 'impact', 0.7);
  sfx(c.end + 0.12, 'chime', 0.6);

  addScene('hook', function (ctx, t) {
    const s = E.out3(prog(t, -0.6, stop));          // scroll progress: fast, then decelerating to a stop
    const off = HERO * PITCH * s;
    const locked = tw(t, stop - 0.05, stop + 0.25, E.out3);
    const pop = tw(t, stop - 0.05, stop + 0.3, E.outBack);
    const breathe = 1 + 0.012 * Math.sin(t * 2.4) * locked;   // idle motion: nothing is ever completely still

    /* headline */
    tag(ctx, 'WHAT MAKES AN EXPLAINER', CX, 432, { align: 'center' });
    text(ctx, 'JUST ANOTHER POST', CX, 510, { size: 62, weight: 900, family: F.disp, color: COL.dim, align: 'center', alpha: 1 - locked });
    riseText(ctx, 'SCROLL-PROOF?', CX, 512, locked, { size: 88, weight: 900, family: F.disp, color: COL.ink, align: 'center', ls: -1 });

    /* the feed, clipped to its window */
    ctx.save();
    ctx.beginPath(); ctx.rect(0, TOP, W, BOT - TOP); ctx.clip();
    streaks(ctx, t, { alpha: 0.5 * (1 - s) * (1 - locked), seed: 3, n: 22, dir: -1, x0: 110, x1: 970, y0: TOP, y1: BOT, minV: 1500, maxV: 2600, lw: 2 });
    for (let i = 0; i < 14; i++) {
      const y = MID - CARD.h / 2 + i * PITCH - off, yc = y + CARD.h / 2;
      if (yc < TOP - CARD.h || yc > BOT + CARD.h) continue;
      const hero = i === HERO;
      const a = (1 - 0.7 * clamp(Math.abs(yc - MID) / 380)) * (hero ? 1 : 1 - 0.45 * locked);
      withAlpha(ctx, a, () => {
        const sc = hero ? breathe * (1 + 0.05 * pop) : 1;
        ctx.save(); ctx.translate(CX, yc); ctx.scale(sc, sc); ctx.translate(-CX, -yc);
        if (hero) glow(ctx, CX, yc, 430, COL.subject, 0.24 * locked);
        panel(ctx, CARD.x, y, CARD.w, CARD.h, { accent: hero && locked > 0 ? COL.subject : null, accentA: 0.9 * locked });
        dot(ctx, CARD.x + 74, yc, 34, hero ? mixHex(COL.lineHi, COL.subject, locked) : COL.line);
        fillRR(ctx, CARD.x + 134, yc - 36, 380, 24, 12, rgba(hero ? COL.ink : COL.dim, hero ? 0.25 + 0.6 * locked : 0.25));
        fillRR(ctx, CARD.x + 134, yc + 12, 230 + 110 * hash(i), 24, 12, rgba(COL.dim, 0.2));
        ctx.restore();
      });
    }
    ctx.restore();

    /* the flick: already under way on frame 0, finished before the feed comes to rest */
    drawLottie(ctx, swipe, t, 790, 990, 250, { at: -0.3, speed: 1.5, after: 'hide' });

    /* shock ring when the feed stops */
    const rp = prog(t, stop, stop + 0.8);
    if (rp > 0 && rp < 1) ring(ctx, CX, MID, 130 + 420 * E.out3(rp), COL.subject, 5 * (1 - rp) + 1, Math.pow(1 - rp, 2));

    /* the answer is promised, not given */
    riseText(ctx, 'ONE RULE  ↓', CX, 1168, prog(t, c.end - 0.1, c.end + 0.25), { size: 26, weight: 800, family: F.mono, color: COL.subject, align: 'center', ls: 4, rise: 12 });
  }, { type: 'fade' });
});
