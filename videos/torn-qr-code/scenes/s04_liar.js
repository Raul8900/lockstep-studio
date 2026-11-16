'use strict';
/* Scene 4 — THE LIAR
   "But a scanner can't see holes. To a scanner, a tear looks like a wrong number.
    So which dot is lying? The one that's off the line.
    Every liar costs two extra dots: one finds it, one fixes it."
   The same card, now seen by the scanner: it knows the dots, not the line. A nick under the first
   dot turns its 2 into a 7 that looks perfectly normal; only the line through the other three
   exposes it. Then the price: two extra dots per liar. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    scanner: at('liar', 'scanner'),
    holes: at('liar', 'holes'),
    tear: at('liar', 'tear'),
    wrong: at('liar', 'wrong'),
    number: at('liar', 'number'),
    which: at('liar', 'which'),
    lying: at('liar', 'lying'),
    off: at('liar', 'off'),
    line: at('liar', 'line'),
    lineEnd: at('liar', 'line', 1, 't1'),
    costs: at('liar', 'costs'),
    two: at('liar', 'two'),
    finds: at('liar', 'finds'),
    fixes: at('liar', 'fixes'),
  };
  const S0 = beatOf('liar').t0 - 0.5;
  const V = [2, 4, 6, 8], LIE = 7;
  const DOT_COL = [COL.data, COL.data, COL.subject, COL.subject];
  const jump = c.wrong - 0.05, snap = c.lineEnd + 0.12;
  const B = [GC.x, GC.y, GC.x + GC.w, GC.y + GC.h];

  sfx(c.scanner - 0.06, 'lock', 0.4);
  sfx(c.holes - 0.04, 'slide', 0.3, { dur: 0.4 });
  sfx(c.tear - 0.06, 'rip', 0.45);
  sfx(jump - 0.02, 'flip', 0.5);
  for (let i = 0; i < 4; i++) sfx(c.which + 0.05 + i * 0.09, 'tick', 0.3, { pitch: 1 + i * 0.07 });
  sfx(c.off - 0.35, 'slide', 0.32, { dur: 0.5 });
  sfx(c.off - 0.04, 'deny', 0.5);
  sfx(snap, 'lock', 0.45);
  sfx(snap + 0.2, 'chime', 0.5);
  sfx(c.costs - 0.06, 'blip', 0.4);
  sfx(c.finds - 0.06, 'call', 0.42, { pitch: 1 });
  sfx(c.fixes - 0.06, 'call', 0.42, { pitch: 1.2 });
  sfx(c.holes + 0.05, 'data', 0.3, { dur: 0.9 });
  sfx(beatOf('liar').t1 + 0.04, 'lock', 0.42);

  addScene('liar', function (ctx, t) {
    const zoom = lerp(1, 1.035, tw(t, S0, c.costs, E.io2)) + 0.03 * win(t, c.which, c.costs, 0.6, 0.6);
    tagPill(ctx, 'NEW PROBLEM', CX, 452, COL.alert, 1);
    withCam(ctx, { fx: 420, fy: 820, zoom }, () => {
      panel(ctx, GC.x, GC.y, GC.w, GC.h);
      ctx.save(); rr(ctx, GC.x, GC.y, GC.w, GC.h, STYLE.shape.radius); ctx.clip();
      graphGrid(ctx);
      tag(ctx, "FIG. 3 · WHAT THE SCANNER SEES", GC.x + 44, GC.y + 58, { size: 24, color: COL.dim });
      /* the scanner knows the dots, not the line: the line fades to a ghost */
      const know = 1 - tw(t, c.scanner, c.holes + 0.2);
      gRule(ctx, V[0], 2, 1, COL.subject, { lw: 7, alpha: lerp(0.0, 1, know) });
      /* the honest line through the other three, drawn on "off the line" */
      const ln = tw(t, c.off - 0.4, c.line + 0.1, E.io3);
      if (ln > 0) gRule(ctx, V[1] - 2, 2, ln, COL.subject, { lw: 7, from: 'right' });
      /* a nick in the paper under the first dot */
      const nick = tw(t, c.tear - 0.06, c.tear + 0.1, E.lin);
      if (nick > 0) {
        const x = gX(0), y = gY(V[0]) + 46, r = rng(5), pts = [];
        for (let i = 0; i <= 10; i++) pts.push([x - 54 + i * 10.8, y + (i % 2 ? -1 : 1) * (5 + r() * 8)]);
        withAlpha(ctx, nick, () => { roughLine(ctx, pts, COL.alert, 4, { seed: 4, wobble: 1.5 }); });
      }
      /* the dots; the first one becomes a 7 that looks perfectly ordinary */
      const lie = tw(t, jump, jump + 0.3, E.outBack), fixd = tw(t, snap - 0.05, snap + 0.3, E.outBack);
      const exposed = tw(t, c.off - 0.05, c.off + 0.15) * (1 - fixd);
      const q = win(t, c.which - 0.05, c.off - 0.05, 0.12, 0.2);
      for (let i = 0; i < 4; i++) {
        let v = V[i], col = DOT_COL[i], label = String(V[i]);
        if (i === 0) {
          v = t >= snap - 0.05 ? lerp(LIE, V[0], fixd) : lerp(V[0], LIE, lie);
          label = t >= jump + 0.12 && t < snap + 0.1 ? String(LIE) : String(V[0]);
          col = exposed > 0.5 ? COL.alert : COL.data;
        }
        const bob = q > 0 ? 4 * Math.sin(t * 9 + i * 1.7) * q : 0;
        gDot(ctx, gX(i), gY(v) + bob, col, 1, label, { lc: i === 0 && exposed > 0.5 ? COL.alert : col });
        if (q > 0) {
          const qy = gY(v) - 66 + bob;
          withAlpha(ctx, q, () => {
            dot(ctx, gX(i) + 36 + 3, qy + 3, 22, COL.ink, 0.9); dot(ctx, gX(i) + 36, qy, 22, COL.accent);
            text(ctx, '?', gX(i) + 36, qy + 10, { size: 30, weight: 800, family: F.ui, color: COL.panel, align: 'center' });
          });
        }
      }
      /* exposed: ring + label, then snapped back with a tick */
      if (exposed > 0) {
        const x = gX(0), y = gY(LIE);
        ring(ctx, x, y, 40 + 6 * Math.sin(t * 8), COL.alert, 5, exposed);
        line(ctx, x, y + 30, x, gY(V[0]) - 26, COL.alert, 3, exposed * 0.8, [8, 7]);
        text(ctx, 'LIAR', x + 56, y + 12, { size: 34, weight: 400, family: F.disp, color: COL.alert, alpha: exposed });
      }
      const ok = tw(t, snap + 0.1, snap + 0.4);
      if (ok > 0) check(ctx, gX(0) + 46, gY(V[0]) + 34, 30, COL.good, ok, 7);
      /* the price, printed in the top-left corner of the card */
      const led = tw(t, c.costs - 0.1, c.costs + 0.25, E.outBack);
      if (led > 0) {
        ctx.save(); ctx.translate(498, 912); const s = lerp(0.8, 1, led); ctx.scale(s, s); ctx.globalAlpha *= clamp(led * 2);
        const x1 = text(ctx, '1 LIAR', 0, 0, { size: 46, weight: 400, family: F.disp, color: COL.alert });
        text(ctx, ' =', x1, 0, { size: 46, weight: 400, family: F.disp, color: COL.ink });
        text(ctx, '2 EXTRA DOTS', 0, 60, { size: 46, weight: 400, family: F.disp, color: COL.subject, alpha: tw(t, c.two - 0.1, c.two + 0.2) });
        ctx.restore();
        for (const [j, cue, name, lab] of [[0, c.finds, 'search', 'FIND IT'], [1, c.fixes, 'wrench', 'FIX IT']]) {
          const p = tw(t, cue - 0.1, cue + 0.2, E.outBack);
          if (t < cue - 0.1) continue;
          const cx = 498 + j * 205, cy = 1036;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(lerp(0.6, 1, p), lerp(0.6, 1, p)); ctx.globalAlpha *= clamp(p * 2);
          fillRR(ctx, 4, -26 + 4, 190, 56, 6, rgba(COL.ink, 0.9));
          fillRR(ctx, 0, -26, 190, 56, 6, COL.subject);
          icon(ctx, name, 32, 2, 32, COL.panel, { lw: 2.4 });
          text(ctx, lab, 58, 12, { size: 28, weight: 800, family: F.ui, color: COL.panel, ls: 1.5 });
          ctx.restore();
        }
        /* the two extra dots pulse as they are counted */
        for (const [i, cue0] of [[2, c.two], [3, c.two + 0.22]]) {
          const k0 = Math.max(0, Math.floor((t - cue0) / 0.55)), cue = cue0 + Math.min(k0, 3) * 0.55;
          const pp = pulse(t, cue + 0.05, 0.05, 0.45);
          if (pp > 0.01) ring(ctx, gX(i), gY(V[i]), 30 + 20 * (1 - pp), COL.subject, 5, pp);
        }
      }
      /* the scanner reads the card (and reads it again once the liar is fixed) */
      scanSweep(ctx, B[0] + 16, B[1] + 20, B[2] - 16, B[3] - 20, prog(t, c.holes + 0.05, c.tear - 0.1), COL.subject);
      scanSweep(ctx, B[0] + 16, B[1] + 20, B[2] - 16, B[3] - 20, prog(t, c.fixes + 0.25, beatOf('liar').t1 + 0.05), COL.good);
      ctx.restore();
      /* scanner brackets around the card; green once the re-scan is done */
      const bp = tw(t, c.scanner - 0.1, c.scanner + 0.25, E.lin), ok2 = tw(t, beatOf('liar').t1 + 0.02, beatOf('liar').t1 + 0.2);
      brackets(ctx, B[0], B[1], B[2], B[3], { p: bp, k: 0.55 + 0.1 * Math.sin(t * 2.2) + 0.45 * ok2, col: ok2 > 0.5 ? COL.good : COL.subject, loose: 26, lw: 8, arm: 64 });
    });
  }, { type: 'fade' });
});
