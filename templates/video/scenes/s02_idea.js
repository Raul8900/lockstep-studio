'use strict';
/* Scene 2 — THE IDEA
   "One idea at a time."
   "Every picture lands on the exact word that names it. Never before. Never after."

   Two sequences inside one scene: five dots become one idea, then a narration track on
   which a picture drops in exactly as the playhead reaches its word. The ticks on the
   track are this take's real word timings (DATA.words), so the diagram is literally true.

   A scene starts 0.5 s before its beat's first word and is already being drawn while the
   previous scene is still leaving (transitions last 0.84 s). So: do not fade the base
   layout in at the start of a scene — let the transition reveal it, already alive.     */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    one: at('idea', 'one'),
    every: at('idea', 'every'),
    word: at('idea', 'word'),
    before: at('idea', 'before'),
    after: at('idea', 'after'),
    end: at('idea', 'after', 1, 't1'),
  };
  /* narration track: time -> x, arranged so that the cue word sits exactly on the centre line */
  const T0 = c.every - 0.25, T1 = c.end + 0.35;
  const X0 = 130, X1 = 950, TY = 1010, BY = 800;
  const X = (t) => (t < c.word ? lerp(X0, CX, prog(t, T0, c.word)) : lerp(CX, X1, prog(t, c.word, T1)));
  const ticks = DATA.words.filter((w) => w.beat === 'idea' && w.t0 >= T0);

  sfx(c.one, 'pop', 0.9);
  sfx(c.every - 0.4, 'slide', 0.7, { dur: 0.4 });
  for (const w of ticks) sfx(w.t0, 'tick', 0.45);
  sfx(c.word, 'stamp', 0.9);
  sfx(c.word + 0.03, 'chime', 0.5);
  sfx(c.before, 'deny', 0.7);
  sfx(c.after, 'deny', 0.7);

  addScene('idea', function (ctx, t) {
    const part2 = tw(t, c.every - 0.45, c.every - 0.05);       // 0 = "one idea", 1 = narration track
    const out1 = 1 - prog(part2, 0, 0.5), in2 = prog(part2, 0.5, 1);   // one leaves before the other arrives: no double exposure

    panel(ctx, 90, 600, 900, 540, { r: 28, fill: rgba(COL.panel, 0.72) });     // stage

    /* ---- sequence 1: one idea ----
       A slow push-in plus a pulsing glow keep the picture alive through the pause after the
       sentence: a hold of even half a second with no visible change reads as a frozen video. */
    withAlpha(ctx, out1, () => withCam(ctx, { fx: CX, fy: 800, zoom: lerp(1, 1.09, prog(t, c.one - 0.5, c.every)) }, () => {
      titleBlock(ctx, 'ONE IDEA', 'at a time', 1, { x: CX, y: 478, align: 'center', size: 112, subSize: 40 });
      const on = tw(t, c.one - 0.05, c.one + 0.25, E.outBack), k = clamp(on);
      const beat = 0.5 + 0.5 * Math.sin((t - c.one) * 5.2);                 // idle pulse of the chosen dot
      for (let i = 0; i < 5; i++) {
        const hero = i === 2, x = CX + (i - 2) * (160 + 26 * k * prog(t, c.one, c.every));
        const y = 870 + Math.sin(t * 1.6 + i * 1.3) * 9 * (hero ? 1 - k : 1);
        if (hero) {
          const r = lerp(44, 80, on) + 5 * beat * k;
          glow(ctx, x, y, 250 + 70 * beat, COL.accent, (0.4 + 0.25 * beat) * k);
          dot(ctx, x, y, r, mixHex(COL.lineHi, COL.accent, k));
          ctx.save(); ctx.strokeStyle = rgba(COL.accent, 0.75 * k); ctx.lineWidth = 5; ctx.lineCap = 'round';
          for (let a = 0; a < 3; a++) { ctx.beginPath(); ctx.arc(x, y, r + 26, t * 1.5 + a * TAU / 3, t * 1.5 + a * TAU / 3 + 1.0); ctx.stroke(); }
          ctx.restore();
        } else {
          dot(ctx, x, y, lerp(44, 32, k), COL.lineHi, 1 - 0.55 * k);
        }
      }
      text(ctx, '1', CX, 870 + 34, { size: 96, weight: 900, family: F.disp, color: COL.onAccent, align: 'center', alpha: prog(t, c.one + 0.02, c.one + 0.18) });
    }));

    /* ---- sequence 2: the picture lands on its word ---- */
    withAlpha(ctx, in2, () => {
      titleBlock(ctx, 'ON THE WORD', 'not before · not after', in2, { x: CX, y: 478, align: 'center', size: 96, subSize: 38 });

      line(ctx, X0, TY, X1, TY, rgba(COL.lineHi, 0.9), 3);
      for (const w of ticks) {
        const hit = pulse(t, w.t0, 0.03, 0.35);
        line(ctx, X(w.t0), TY - 16 - 14 * hit, X(w.t0), TY + 16, t >= w.t0 ? COL.data : COL.faint, 4);
      }
      tag(ctx, 'NARRATION', X0, TY + 84);

      const xp = X(clamp(t, T0, T1));                          // playhead moves in real time
      glow(ctx, xp, TY, 80, COL.subject, 0.7);
      line(ctx, xp, TY - 64, xp, TY + 44, COL.subject, 4);

      const land = tw(t, c.word - 0.02, c.word + 0.28, E.outBack);
      if (land > 0) {
        const s = lerp(0.6, 1, land) * (1 + 0.012 * Math.sin(t * 2.6));
        glow(ctx, CX, BY, 300, COL.good, 0.3 * clamp(land));
        ctx.save(); ctx.translate(CX, BY); ctx.scale(s, s);
        withAlpha(ctx, clamp(land * 2), () => {
          panel(ctx, -105, -85, 210, 170, { accent: COL.good });
          check(ctx, 0, 4, 52, COL.good, prog(t, c.word + 0.08, c.word + 0.34), 10);
        });
        ctx.restore();
        line(ctx, CX, BY + 92, CX, TY - 24, COL.good, 3, clamp(land));
      }
      ghostBox(ctx, CX - 250, BY, 190, 150, tw(t, c.before - 0.05, c.before + 0.2, E.out3), 'EARLY');   // from this video's components.js
      ghostBox(ctx, CX + 250, BY, 190, 150, tw(t, c.after - 0.05, c.after + 0.2, E.out3), 'LATE');
    });
  }, { type: 'zoomIn', fx: CX, fy: 880, z: 2.4 });               // how this scene ARRIVES: dive into the hero card of scene 1
});
