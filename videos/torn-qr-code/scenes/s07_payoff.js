'use strict';
/* Scene 7 — THE FIRST TEAR (payoff + end card)
   "That first tear? It took six of the nine message bytes. The extra points rebuilt every one.
    A torn QR code isn't lucky. It was built expecting to be torn."
   Back to the hook's torn sticker: the missing corner's damaged bytes appear as ghosts (six
   orange message bytes, one blue), threads from the surviving check bytes rebuild them, the
   scanner locks. End card: EXTRA POINTS, NOT COPIES — and the tear line is printed back on. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    first: at('payoff', 'first'),
    tear: at('payoff', 'tear'),
    took: at('payoff', 'took'),
    six: at('payoff', 'six'),
    nine: at('payoff', 'nine'),
    bytes: at('payoff', 'bytes'),
    extra: at('payoff', 'extra'),
    points: at('payoff', 'points'),
    rebuilt: at('payoff', 'rebuilt'),
    every: at('payoff', 'every'),
    one: at('payoff', 'one'),
    oneEnd: at('payoff', 'one', 1, 't1'),
    a: at('payoff', 'a'),
    torn: at('payoff', 'torn'),
    isnt: at('payoff', "isn't"),
    lucky: at('payoff', 'lucky'),
    built: at('payoff', 'built'),
    expecting: at('payoff', 'expecting'),
    torn2: at('payoff', 'torn', 2),
    torn2End: at('payoff', 'torn', 2, 't1'),
  };
  const S0 = beatOf('payoff').t0 - 0.5;
  const A = { cy: 692, m: 23 }, Z = { cy: 826, m: 20 };
  const MSG_LEFT = [3, 7, 8];                                      // message bytes the tear did not touch
  const order = QTORN.slice();                                     // [0, 1, 2, 4, 5, 6, 11]
  const pop = (i) => c.took + 0.02 + i * 0.07;
  const fillT = (i) => c.rebuilt - 0.05 + i * (c.one + 0.1 - c.rebuilt) / order.length;
  const lockT = c.oneEnd + 0.05;
  const SURV = []; for (let k = 9; k < 26; k++) if (!QTORN.includes(k)) SURV.push(k);   // 16 surviving check bytes
  const words = [['EXTRA', c.a - 0.05], ['POINTS,', c.torn + 0.05], ['NOT', c.isnt - 0.05], ['COPIES.', c.lucky - 0.05]];

  sfx(S0 - 0.05, 'slide', 0.4);
  sfx(c.first - 0.05, 'blip', 0.4);
  order.forEach((k, i) => sfx(pop(i), 'tick', 0.3, { pitch: 1 + i * 0.05 }));
  sfx(c.six - 0.05, 'pop', 0.45);
  sfx(c.nine - 0.05, 'blip', 0.4);
  sfx(c.extra - 0.2, 'riser', 0.38, { dur: 0.55 });
  order.forEach((k, i) => sfx(fillT(i), 'pop', 0.38, { pitch: 1 + i * 0.06 }));
  sfx(lockT, 'lock', 0.5);
  sfx(lockT + 0.2, 'chime', 0.55);
  words.forEach(([w, tt], i) => sfx(tt, 'tick', 0.3, { pitch: 1.1 + i * 0.05 }));
  sfx(c.expecting - 0.08, 'slide', 0.32, { dur: 0.6 });
  sfx(c.torn2End + 0.05, 'chime', 0.6);
  sfx(c.torn2End + 0.1, 'swell', 0.4, { dur: 2.6 });

  addScene('payoff', function (ctx, t) {
    const move = tw(t, c.a - 0.15, c.a + 0.6, E.io3);
    const cy = lerp(A.cy, Z.cy, move) + 3 * Math.sin(t * 1.1), m = lerp(A.m, Z.m, move);
    const half = (QN / 2 + QS) * m, BX = [CX - half, cy - half, CX + half, cy + half];
    const zoom = lerp(1, 1.03, tw(t, S0, c.a, E.io2)) * lerp(1, 1.02, tw(t, c.a, DATA.dur, E.io2));

    const ghost = tw(t, c.first - 0.1, c.tear + 0.3) * (1 - tw(t, c.torn - 0.1, c.torn + 0.4));
    const hl = (1 - tw(t, c.torn - 0.1, c.torn + 0.4));
    const bricks = (k) => {
      if (QTORN.includes(k)) {
        const p = tw(t, pop(order.indexOf(k)), pop(order.indexOf(k)) + 0.2) * hl;
        return { c: QMSG(k) ? COL.data : COL.subject, a: p, o: p, oc: QMSG(k) ? COL.data : COL.subject, ow: 4 };
      }
      if (MSG_LEFT.includes(k)) { const p = tw(t, c.nine - 0.1, c.nine + 0.2) * hl; return { c: COL.data, a: p, o: p, oc: COL.data, ow: 4 }; }
      if (SURV.includes(k)) { const p = win(t, c.extra - 0.15, c.oneEnd + 0.4, 0.2, 0.3) * hl; return { c: COL.subject, a: p * 0.85, o: p, oc: COL.subject, ow: 3 }; }
      return null;
    };
    const ghostBricks = (k) => {
      if (!QTORN.includes(k)) return null;
      const i = order.indexOf(k), blink = QMSG(k) ? pulse(t, c.six + 0.05 + i * 0.03, 0.04, 0.3) : 0;
      return { c: QMSG(k) ? COL.data : COL.subject, a: tw(t, pop(i), pop(i) + 0.2) * (1 - 0.6 * blink), fill: tw(t, fillT(i), fillT(i) + 0.18, E.out3) };
    };

    withCam(ctx, { fx: CX, fy: 800, zoom }, () => {
      drawSticker(ctx, {
        cx: CX + 3 * Math.sin(t * 0.9), cy, m, rot: 0.006 * Math.sin(t * 1.3) - 0.004,
        hero: true, bricks, ghost, ghostBricks,
      });
      /* threads: the surviving check bytes pour into the gap */
      const th = tw(t, c.extra - 0.1, c.points + 0.3, E.io3) * (1 - tw(t, lockT, lockT + 0.4));
      if (th > 0) {
        const [gx, gy] = qScreen(CX, cy, m, QPIECE_C[0], QPIECE_C[1]);
        SURV.forEach((k, i) => {
          const [x, y] = qScreen(CX, cy, m, QCW_C[k][0], QCW_C[k][1]);
          const p = clamp(th * 1.3 - i * 0.02);
          polyline(ctx, [[x, y], [lerp(x, gx, 0.5) + 30 * Math.sin(i), lerp(y, gy, 0.5) - 40], [gx, gy]], COL.subject, 3, p, 0.75 * th);
          dot(ctx, x, y, 6, COL.subject, th);
        });
      }
      /* "built expecting to be torn": the tear line is printed back on, along the torn edge */
      const cut = tw(t, c.expecting - 0.1, c.torn2 + 0.2, E.io3);
      if (cut > 0) {
        ctx.save(); ctx.translate(CX + 3 * Math.sin(t * 0.9), cy); ctx.rotate(0.006 * Math.sin(t * 1.3) - 0.004);
        const pts = QRM.tearEdge.map(([x, y]) => [(x - QN / 2) * m + 10, (y - QN / 2) * m + 10]);
        polyline(ctx, pts, COL.alert, 4, cut, 0.9, [m * 0.55, m * 0.38]);
        const [ex, ey] = pts[pts.length - 1];
        icon(ctx, 'scissors', ex + 6, ey - 40, 46, COL.alert, { lw: 2.2, p: clamp(cut * 1.5 - 0.3) });
        ctx.restore();
      }
      const lk = tw(t, lockT - 0.1, lockT + 0.2, E.outBack);
      brackets(ctx, BX[0], BX[1], BX[2], BX[3], { p: 1, k: lk, col: lk > 0.5 ? COL.good : COL.subject, loose: 30 + 5 * Math.sin(t * 3.1) * (1 - lk), lw: 9 });
    });

    /* under the code: what the tear took, then the verdict */
    const yA = cy + half + 62;
    const cnt = win(t, c.took - 0.1, lockT - 0.1, 0.2, 0.2);
    if (cnt > 0) {
      const s9 = tw(t, c.nine - 0.1, c.nine + 0.2);
      ctx.save(); ctx.translate(CX, yA); const s = 1 + 0.08 * pulse(t, c.six + 0.05, 0.04, 0.4); ctx.scale(s, s);
      text(ctx, s9 > 0.5 ? '6 OF 9 MESSAGE BYTES' : '6 MESSAGE BYTES', 0, 20, { size: 52, weight: 400, family: F.disp, color: COL.data, align: 'center', alpha: cnt });
      ctx.restore();
    }
    readout(ctx, CX, yA, 'STILL HERE', true, tw(t, lockT, lockT + 0.3, E.lin) * (1 + 0.02 * Math.sin(t * 4)));

    /* end card headline */
    let x = 0; const size = 50, ws = words.map(([w]) => measure(ctx, w + ' ', size, 400, F.disp, 1));
    const total = ws.reduce((a, b) => a + b, 0), x0 = CX - total / 2;
    words.forEach(([w, tt], i) => {
      const p = tw(t, tt, tt + 0.25, E.outBack);
      if (t >= tt) {
        const col = i >= 2 ? COL.accent : COL.subject;
        ctx.save(); ctx.translate(x0 + x, 432 + (1 - clamp(p)) * 24); ctx.globalAlpha *= clamp(p * 2);
        text(ctx, w, 4, 4, { size, weight: 400, family: F.disp, color: COL.ink, ls: 1, alpha: 0.9 });
        text(ctx, w, 0, 0, { size, weight: 400, family: F.disp, color: col, ls: 1 });
        ctx.restore();
      }
      x += ws[i];
    });
    riseText(ctx, 'REED–SOLOMON · 1960', CX, 490, tw(t, c.lucky + 0.2, c.lucky + 0.6), { size: 26, weight: 700, family: F.mono, color: COL.dim, align: 'center', ls: 3 });
  }, { type: 'slideRight' });
});
