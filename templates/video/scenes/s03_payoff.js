'use strict';
/* Scene 3 — PAYOFF
   "Say it and show it. In lockstep."
   A voice panel and a picture panel wake up one after the other, then snap together and
   run off a single playhead. The last scene runs to the end of the video (TAIL seconds
   after the last word in script.py): keep it moving, it is the end card.              */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    say: at('payoff', 'say'),
    show: at('payoff', 'show'),
    lock: at('payoff', 'lockstep'),
    end: at('payoff', 'lockstep', 1, 't1'),
  };
  const PX = 130, PW = 820, PH = 210, MID = 850, IN = 200;     // panels; IN = left inset of the plots

  /* Sounds that land on a short word are kept quiet and placed just before it:
     a loud hit on the first consonant makes the word itself hard to hear. */
  sfx(c.say - 0.07, 'call', 0.55);
  sfx(c.show - 0.07, 'pop', 0.5);
  sfx(c.lock - 0.3, 'riser', 0.7, { dur: 0.3 });
  sfx(c.lock, 'lock', 1.0);
  sfx(c.lock + 0.03, 'impact', 0.9);
  sfx(c.end + 0.25, 'chime', 0.7);

  addScene('payoff', function (ctx, t) {
    const say = tw(t, c.say - 0.05, c.say + 0.3, E.out3), show = tw(t, c.show - 0.05, c.show + 0.3, E.out3);
    const snap = tw(t, c.lock - 0.02, c.lock + 0.3, E.outBack), k = clamp(snap);
    const gap = lerp(46, 10, snap), yA = MID - gap / 2 - PH, yB = MID + gap / 2;
    const colA = k > 0.5 ? COL.mint : COL.violet, colB = k > 0.5 ? COL.mint : COL.cyan;

    /* headline */
    riseText(ctx, 'SAY IT.', CX - 200, 500, say, { size: 78, weight: 900, family: F.disp, color: COL.violet, align: 'center', alpha: 1 - k });
    riseText(ctx, 'SHOW IT.', CX + 200, 500, show, { size: 78, weight: 900, family: F.disp, color: COL.cyan, align: 'center', alpha: 1 - k });
    if (k > 0) {
      ctx.save(); ctx.translate(CX, 500); ctx.scale(lerp(0.8, 1, snap), lerp(0.8, 1, snap));
      text(ctx, 'IN LOCKSTEP', 0, 0, { size: 112, weight: 900, family: F.disp, color: COL.white, align: 'center', ls: -1, alpha: k });
      ctx.restore();
      tag(ctx, 'VOICE · PICTURE · SOUND — ONE CLOCK', CX, 556, { align: 'center', color: COL.mint, alpha: prog(t, c.lock + 0.2, c.lock + 0.5) });
    }

    /* voice */
    glow(ctx, CX, MID, 620, COL.mint, 0.12 * k);
    panel(ctx, PX, yA, PW, PH, { accent: colA, accentA: 0.25 + 0.6 * say });
    tag(ctx, 'VOICE', PX + 30, yA + 48, { color: mixHex(COL.dim, COL.white, say) });
    const n = 44, step = (PW - IN - 40) / n;
    for (let i = 0; i < n; i++) {
      const amp = (0.12 + 0.88 * say) * (0.2 + 0.8 * Math.abs(Math.sin(t * 7 + i * 0.9) * Math.sin(t * 2.3 + i * 0.37)));
      const h = 8 + 124 * amp;
      fillRR(ctx, PX + IN + i * step, yA + PH / 2 - h / 2, 8, h, 4, rgba(colA, 0.3 + 0.7 * amp));
    }

    /* picture */
    panel(ctx, PX, yB, PW, PH, { accent: colB, accentA: 0.25 + 0.6 * show });
    tag(ctx, 'PICTURE', PX + 30, yB + 48, { color: mixHex(COL.dim, COL.white, show) });
    const pts = [];
    for (let i = 0; i <= 24; i++) pts.push([PX + IN + i * (PW - IN - 40) / 24, yB + PH / 2 - 62 * Math.sin(i * 0.55 + t * 1.5) * (0.4 + 0.6 * hash(i))]);
    polyline(ctx, pts, rgba(COL.lineHi, 0.5), 3);
    polyline(ctx, pts, colB, 5, show);

    /* one playhead across both, once they are locked */
    if (k > 0) {
      const u = ((t - c.lock) * 0.55) % 1, x = PX + IN + u * (PW - IN - 40);
      glow(ctx, x, MID, 130, COL.mint, 0.5 * k);
      line(ctx, x, yA + 18, x, yB + PH - 18, COL.white, 3, 0.85 * k);
    }
    const rp = prog(t, c.lock, c.lock + 0.9);
    if (rp > 0 && rp < 1) ring(ctx, CX, MID, 140 + 460 * E.out3(rp), COL.mint, 5 * (1 - rp) + 1, Math.pow(1 - rp, 2));
  }, { type: 'panDown' });
});
