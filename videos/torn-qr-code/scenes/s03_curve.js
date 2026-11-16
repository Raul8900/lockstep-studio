'use strict';
/* Scene 3 — ATTEMPT 2: THE LINE
   "Say your message is just two numbers. Two dots fix exactly one line. Now add extra dots on
    that same line. Tear any two away: the survivors still fix the line, and it puts the
    missing dots back."
   A printed graph card: two orange message dots, the one line through them, two blue extra dots
   on it; a strip with two dots tears out; the survivors redraw the line and refill the gaps. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    say: at('curve', 'say'),
    message: at('curve', 'message'),
    two: at('curve', 'two'),
    numbers: at('curve', 'numbers'),
    dots: at('curve', 'dots'),
    fix: at('curve', 'fix'),
    exactly: at('curve', 'exactly'),
    line: at('curve', 'line'),
    lineEnd: at('curve', 'line', 1, 't1'),
    extra: at('curve', 'extra'),
    dots2: at('curve', 'dots', 2),
    same: at('curve', 'same'),
    tear: at('curve', 'tear'),
    away: at('curve', 'away'),
    survivors: at('curve', 'survivors'),
    fix2: at('curve', 'fix', 2),
    line3: at('curve', 'line', 3),
    missing: at('curve', 'missing'),
    dots3: at('curve', 'dots', 3),
    back: at('curve', 'back'),
  };
  const S0 = beatOf('curve').t0 - 0.5;
  const V = [2, 4, 6, 8];                                          // the line v = 2 + 2 * step
  const DOT_COL = [COL.data, COL.data, COL.subject, COL.subject];
  const dotIn = [c.say - 0.06, c.message - 0.04, c.extra - 0.06, c.dots2 - 0.06];
  const rip = c.tear - 0.05;
  const [LEFT, STRIP, RIGHT] = tornStripPolys(GC.x, GC.y, GC.x + GC.w, GC.y + GC.h, 338, 702, 17);

  sfx(S0 - 0.05, 'slide', 0.4);
  dotIn.forEach((d, i) => sfx(d, 'pop', 0.55, { pitch: 1 + i * 0.1 }));
  sfx(c.fix - 0.1, 'slide', 0.35, { dur: 1.1 });
  sfx(c.line - 0.04, 'lock', 0.42);
  for (let i = 0; i < 4; i++) sfx(c.same + i * 0.11, 'tick', 0.3, { pitch: 1 + i * 0.08 });
  sfx(rip - 0.03, 'rip', 0.85);
  sfx(rip + 0.12, 'whoosh', 0.45);
  sfx(c.survivors - 0.05, 'blip', 0.4);
  sfx(c.fix2 - 0.2, 'slide', 0.3, { dur: 0.6 });
  sfx(c.line3 + 0.02, 'lock', 0.4);
  sfx(c.dots3 - 0.06, 'pop', 0.5, { pitch: 1.0 });
  sfx(c.back - 0.06, 'pop', 0.5, { pitch: 1.15 });
  sfx(c.back + 0.35, 'chime', 0.55);

  /* everything printed on the card, drawn once per piece of paper */
  function content(ctx, t, part) {
    graphGrid(ctx);
    tag(ctx, 'FIG. 2 · THE MESSAGE AS DOTS', GC.x + 44, GC.y + 58, { size: 24, color: COL.dim });
    const torn = t >= rip;
    /* "exactly one line": candidate lines pivot about dot 1 and settle on dot 2 */
    const pivot = win(t, c.fix - 0.1, c.line + 0.1, 0.15, 0.2);
    if (pivot > 0 && !torn) {
      const settle = tw(t, c.fix - 0.1, c.line - 0.05, E.io3);
      for (let k = 0; k < 6; k++) {
        const s0 = -1.2 + k * 1.1, s = lerp(s0, 2, settle);
        gRule(ctx, V[0], s, 1, COL.subject, { lw: 2.5, alpha: 0.35 * pivot });
      }
    }
    /* the line through the two message dots, drawn on "line" */
    const ln = tw(t, c.exactly - 0.1, c.line + 0.12, E.io3);
    if (ln > 0 && (!torn || part === 'strip' || t < c.fix2)) gRule(ctx, V[0], 2, ln, COL.subject, { lw: 7 });
    /* a pulse running along the line on "same line" */
    const run = prog(t, c.same - 0.1, c.same + 0.55);
    for (let i = 0; i < 4; i++) {
      const p = prog(t, dotIn[i], dotIn[i] + 0.3);
      const ping = 6 * pulse(t, c.same - 0.1 + i * 0.11, 0.04, 0.3) * (run > 0 && run < 1 ? 1 : 0);
      if (torn && part !== 'strip' && (i === 1 || i === 2)) continue;      // gone with the strip
      gDot(ctx, gX(i), gY(V[i]), DOT_COL[i], p, String(V[i]), { r: 24 + ping });
    }
    const lab = tw(t, c.message, c.message + 0.4);
    /* "numbers": each message dot's height is its value — dashed drops to the axis */
    const drop = tw(t, c.numbers - 0.1, c.numbers + 0.6, E.io3);
    if (drop > 0) for (let i = 0; i < 2; i++) {
      if (torn && part !== 'strip' && i === 1) continue;
      const x = gX(i), y = gY(V[i]);
      line(ctx, x, y + 26, x, lerp(y + 26, GC.y0, drop), COL.data, 3, 0.8, [7, 7]);
      if (drop > 0.9) text(ctx, String(V[i]), x, GC.y0 + 44, { size: 26, weight: 700, family: F.mono, color: COL.data, align: 'center', alpha: prog(drop, 0.9, 1) * (1 - tw(t, c.dots - 0.2, c.dots + 0.2)) });
    }
    /* a highlight running along the whole line after "same line", until the tear */
    if (!torn && t > c.same) {
      const u = ((t - c.same) * 0.9) % 1, xa = GC.x + 40, xb = GC.x + GC.w - 40;
      const pts = [[xa, gY(2 + 2 * (xa - GC.xs[0]) / 180)], [xb, gY(2 + 2 * (xb - GC.xs[0]) / 180)]];
      polySeg(ctx, pts, rgba(COL.subject, 1), 14, Math.max(0, u - 0.12), u, 0.35 * win(t, c.same, c.tear, 0.2, 0.1));
    }
    if (part !== 'strip') {
      riseText(ctx, 'YOUR MESSAGE', (gX(0) + gX(1)) / 2, 1048, lab, { size: 26, weight: 700, family: F.mono, color: COL.data, align: 'center', ls: 2 });
      riseText(ctx, 'EXTRA', (gX(2) + gX(3)) / 2 + 40, 1048, tw(t, c.extra, c.dots2 + 0.3), { size: 26, weight: 700, family: F.mono, color: COL.subject, align: 'center', ls: 2 });
    }
  }

  addScene('curve', function (ctx, t) {
    const zoom = lerp(1, 1.04, tw(t, S0, beatOf('curve').t1 + 0.5, E.io2));
    const hit = pulse(t, rip + 0.02, 0.03, 0.3);
    tagPill(ctx, 'ATTEMPT 2', CX, 452, COL.subject, 1);
    withCam(ctx, { fx: CX, fy: 820, zoom: zoom + 0.02 * hit, dx: 6 * hit * Math.sin(t * 90) }, () => {
      const torn = t >= rip;
      const shadow = STYLE.shape.shadow;
      if (!torn) {
        panel(ctx, GC.x, GC.y, GC.w, GC.h);
        ctx.save(); rr(ctx, GC.x, GC.y, GC.w, GC.h, STYLE.shape.radius); ctx.clip(); content(ctx, t, 'whole'); ctx.restore();
        return;
      }
      /* torn: two pieces stay, the strip falls */
      const part = tw(t, rip, c.survivors + 0.2, E.out3) * (1 - tw(t, c.fix2 - 0.3, c.fix2 + 0.3, E.io3));
      for (const poly of [LEFT, RIGHT]) {
        const sx = (poly === LEFT ? -16 : 16) * part, sr = (poly === LEFT ? -0.012 : 0.012) * part;
        ctx.save(); ctx.translate(520 + sx, 820); ctx.rotate(sr); ctx.translate(-520, -820);
        ctx.save(); ctx.translate(shadow.dx, shadow.dy); polyPath(ctx, poly); ctx.fillStyle = COL.subject; ctx.fill(); ctx.restore();
        polyPath(ctx, poly); ctx.fillStyle = COL.panel; ctx.fill(); ctx.strokeStyle = rgba(COL.ink, 0.25); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.save(); polyPath(ctx, poly); ctx.clip(); content(ctx, t, 'side'); ctx.restore();
        ctx.restore();
      }
      rimLine(ctx, STRIP.slice(0, 15)); rimLine(ctx, STRIP.slice(15));
      /* where the strip was: a dashed outline once the dots come back */
      const ghost = tw(t, c.missing - 0.3, c.missing + 0.1);
      if (ghost > 0) { ctx.save(); ctx.setLineDash([10, 8]); polyPath(ctx, STRIP); ctx.strokeStyle = rgba(COL.alert, 0.7 * ghost); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
      /* the falling strip */
      const f = prog(t, rip, rip + 1.4), e = E.in2(f);
      if (f < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - prog(f, 0.45, 1);
        const sc = 1 - 0.35 * e;                                   // falls away from us, not through the captions
        ctx.translate(520, 812 + 260 * e + 16); ctx.rotate(0.05 + 0.45 * e); ctx.scale(sc, sc); ctx.translate(-520, -812);
        ctx.save(); ctx.translate(shadow.dx, shadow.dy); polyPath(ctx, STRIP); ctx.fillStyle = COL.subject; ctx.fill(); ctx.restore();
        polyPath(ctx, STRIP); ctx.fillStyle = COL.panel; ctx.fill();
        ctx.save(); polyPath(ctx, STRIP); ctx.clip(); content(ctx, t, 'strip'); ctx.restore();
        ctx.restore();
      }
      /* survivors pulse, then the line comes back through the gap */
      const sv = pulse(t, c.survivors + 0.05, 0.06, 0.5);
      if (sv > 0.01) for (const i of [0, 3]) ring(ctx, gX(i), gY(V[i]), 30 + 26 * (1 - sv), DOT_COL[i], 5, sv);
      const ln2 = tw(t, c.fix2 - 0.2, c.line3 + 0.15, E.io3);
      if (ln2 > 0) gRule(ctx, V[0], 2, ln2, COL.subject, { lw: 7 });
      const del = prog(t, c.line3 + 0.1, c.dots3);
      if (del > 0 && del < 1) { const pts = [[gX(0), gY(V[0])], [gX(3), gY(V[3])]]; polySeg(ctx, pts, COL.subject, 16, Math.max(0, del - 0.25), del, 0.4); }
      for (const [i, cue] of [[1, c.dots3], [2, c.back]]) {
        const g = tw(t, c.missing - 0.1, c.missing + 0.2), fill = tw(t, cue - 0.1, cue + 0.2, E.lin);
        if (g > 0 && fill < 1) gDot(ctx, gX(i), gY(V[i]), DOT_COL[i], g, null, { ghost: true });
        if (fill > 0) {
          gDot(ctx, gX(i), gY(V[i]), DOT_COL[i], fill, String(V[i]));
          const ck = tw(t, cue + 0.1, cue + 0.4);
          if (ck > 0) check(ctx, gX(i) + 44, gY(V[i]) + 34, 30, COL.good, ck, 7);
        }
      }
      const rs = tw(t, c.back + 0.05, c.back + 0.4);
      if (rs > 0) tagPill(ctx, 'RESTORED', 520, 1170, COL.good, rs * (1 + 0.06 * Math.sin((t - c.back) * 9)), { size: 26 });
      const glowRun = prog(t, c.back + 0.2, c.back + 0.9);
      if (glowRun > 0 && glowRun < 1) { const xa = GC.x + 40, xb = GC.x + GC.w - 40; polySeg(ctx, [[xa, gY(2 + 2 * (xa - GC.xs[0]) / 180)], [xb, gY(2 + 2 * (xb - GC.xs[0]) / 180)]], COL.good, 14, Math.max(0, glowRun - 0.2), glowRun, 0.45); }
    });
  }, { type: 'slideLeft' });
});
