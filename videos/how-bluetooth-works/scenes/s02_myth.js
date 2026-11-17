'use strict';
/* 2 · NO PRIVATE LINE — the cable you imagine between phone and earbuds, snapped;
   then the whole carriage plugged into one band, every link hopping along it. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    private: at('myth', 'private'), channel: at('myth', 'channel'), invisible: at('myth', 'invisible'),
    wire: at('myth', 'wire'), there: at('myth', "there's"), thing: at('myth', 'thing'),
    yours: at('myth', 'yours'), share: at('myth', 'share'), every: at('myth', 'every'),
    everyone: at('myth', 'everyone'), here: at('myth', 'here'),
  };
  const PH = [312, 990], BD = [770, 700], R = 112;
  const P0 = [PH[0] + R * 0.72, PH[1] - R * 0.7], P3 = [BD[0] - R * 0.72, BD[1] + R * 0.7];
  const C1 = [P0[0] + 170, P0[1] + 60], C2 = [P3[0] - 170, P3[1] - 60];
  const bez = (u) => {
    const v = 1 - u;
    return [v * v * v * P0[0] + 3 * v * v * u * C1[0] + 3 * v * u * u * C2[0] + u * u * u * P3[0],
            v * v * v * P0[1] + 3 * v * v * u * C1[1] + 3 * v * u * u * C2[1] + u * u * u * P3[1]];
  };
  const CABLE = Array.from({ length: 41 }, (_, i) => bez(i / 40));
  const snap = c.thing - 0.02, toCar = c.yours - 0.25;
  const BAR = { y: 498, x0: 104, x1: 976 };
  const CARP = { cx: 540, cy: 950, s: 0.66 };

  sfx(c.private - 0.08, 'slide', 0.45, { dur: 0.7 });
  sfx(c.wire + 0.2, 'thump', 0.6);
  sfx(snap - 0.03, 'rip', 0.62);
  sfx(snap, 'impact', 0.7);
  sfx(toCar, 'whoosh', 0.45);
  for (let i = 0; i < 10; i++) sfx(c.share + i * 0.07, 'tick', 0.3, { pitch: 1 + i * 0.06 });
  sfx(c.everyone, 'lock', 0.5);

  addScene('myth', function (ctx, t) {
    const out = tw(t, toCar - 0.1, toCar + 0.45, E.io3);           // the pictograms leave, the carriage arrives
    const hit = pulse(t, snap, 0.03, 0.4);
    /* ---- sequence 1: the wire you imagine ---- */
    withAlpha(ctx, 1 - out, () => {
      withCam(ctx, { fx: 540, fy: 800, zoom: (1 + 0.04 * prog(t, S0(), c.there)) * (1 + 0.04 * hit), dx: 7 * hit * Math.sin(t * 90) }, () => {
        const route = tw(t, c.private - 0.1, c.channel + 0.45, E.io3), solid = tw(t, c.invisible - 0.1, c.wire + 0.25, E.out3);
        const broken = t >= snap, rec = tw(t, snap, snap + 0.6, E.out3);
        if (!broken) {
          if (route > 0) {
            if (solid < 1) polyline(ctx, CABLE, COL.subject, 6, route, 1 - solid, [16, 12]);
            if (solid > 0) polyline(ctx, CABLE, COL.subject, lerp(6, 18, solid), 1, solid);
          }
        } else {
          /* two halves recoil from the break and turn red */
          const half = (pts, pivot, dir) => {
            const ang = dir * 0.42 * rec, cs = Math.cos(ang), sn = Math.sin(ang);
            return pts.map(([x, y]) => [pivot[0] + (x - pivot[0]) * cs - (y - pivot[1]) * sn, pivot[1] + (x - pivot[0]) * sn + (y - pivot[1]) * cs + 30 * rec * Math.abs(x - pivot[0]) / 230]);
          };
          const a = half(CABLE.slice(0, 19), P0, 1), b = half(CABLE.slice(22), P3, 1);
          const col = mixHex(COL.subject, COL.alert, clamp(rec * 2));
          polyline(ctx, a, col, 18, 1, 1 - 0.4 * rec); polyline(ctx, b, col, 18, 1, 1 - 0.4 * rec);
          const m = bez(0.5);
          cross(ctx, m[0], m[1] - 6, 34, COL.alert, tw(t, snap, snap + 0.3, E.out3), 12);
        }
        /* plugs where the cable meets the devices */
        if (solid > 0) for (const p of [P0, P3]) withAlpha(ctx, solid, () => { dot(ctx, p[0], p[1], 15, COL.ink); dot(ctx, p[0], p[1], 7, COL.panel); });
        pictoDisk(ctx, 'smartphone', PH[0], PH[1], R, COL.subject, { lw: 1.6 });
        pictoDisk(ctx, 'earbuds', BD[0], BD[1], R, COL.subject, { lw: 1.6 });
        text(ctx, 'YOUR PHONE', PH[0], PH[1] + R + 52, { size: 28, weight: 700, family: F.mono, color: COL.ink, align: 'center', ls: 2 });
        text(ctx, 'YOUR EARBUDS', BD[0], BD[1] - R - 30, { size: 28, weight: 700, family: F.mono, color: COL.ink, align: 'center', ls: 2 });
      });
      /* the sign: a question, then the answer */
      const sA = tw(t, c.private - 0.1, c.private + 0.3, E.out3);
      if (sA > 0) {
        const ans = t >= snap;
        signPlate(ctx, ans ? 'NO PRIVATE LINE' : 'PRIVATE LINE?', 540, 440, { size: 40, alpha: sA, bar: ans ? COL.alert : COL.subject, color: ans ? COL.alert : COL.ink });
      }
    });
    /* ---- sequence 2: one band, shared by the whole carriage ---- */
    if (out > 0) {
      withAlpha(ctx, out, () => {
        withCam(ctx, { fx: 540, fy: 800, zoom: lerp(1.08, 1, out) }, () => {
          /* the band: a bar with 79 ticks */
          fillRR(ctx, BAR.x0 - 10, BAR.y - 16, BAR.x1 - BAR.x0 + 20, 32, 16, COL.panel);
          strokeRR(ctx, BAR.x0 - 10, BAR.y - 16, BAR.x1 - BAR.x0 + 20, 32, 16, COL.ink, 3);
          for (let ch = 0; ch < 79; ch++) line(ctx, chX(ch), BAR.y - 8, chX(ch), BAR.y + 8, rgba(COL.subject, 0.45), 2);
          const place = carriage(ctx, t, Object.assign({ doors: 1, swayAmp: 1, bub: (i) => (i === CAR.you ? { color: COL.subject, lw: 3, fillA: 0.1 } : i === CAR.nb ? { color: COL.accent, lw: 3, fillA: 0.08 } : { plain: true, color: GREY.link(), alpha: 0.6 }) }, CARP));
          /* every link reaches the bar and hops along it */
          for (let i = 0; i < CAR.P.length; i++) {
            const P = carPerson(i, place), pp = personPts(P);
            const sx = (pp.phone[0] + pp.head[0]) / 2, sy = (pp.phone[1] + pp.head[1]) / 2 - 44 * P.s;
            const k = tw(t, c.share - 0.1 + (i % 20) * 0.035, c.share + 0.35 + (i % 20) * 0.035, E.out3);
            if (k <= 0) continue;
            const ph = CROWD_PHONES[i];
            const slot = Math.floor(t * 3.2 + i * 0.37);
            const tx = chX(i === CAR.you ? hopAt(PHONES.you, slot) : i === CAR.nb ? hopAt(PHONES.nb, slot) : btHop(ph.ulap, (ph.clk + 2 * slot) >>> 0));
            const ex = lerp(sx, tx, k), ey = lerp(sy, BAR.y + 18, k);
            const col = i === CAR.you ? COL.subject : i === CAR.nb ? COL.accent : GREY.link();
            const lw = i === CAR.you || i === CAR.nb ? 4 : 2;
            line(ctx, sx, sy, ex, ey, col, lw, i === CAR.you || i === CAR.nb ? 1 : 0.55);
            if (k > 0.98) dot(ctx, tx, BAR.y, i === CAR.you || i === CAR.nb ? 8 : 5, col);
          }
        });
        const lA = tw(t, c.every - 0.1, c.every + 0.3, E.out3);
        signPlate(ctx, '79 CHANNELS · SHARED BY EVERYONE', 540, 420, { size: 30, alpha: lA, bar: COL.subject });
      });
    }
  }, { type: 'zoomIn', fx: 540, fy: 742, z: 2.4, zb: 0.7 });

  function S0() { return beatOf('myth').t0 - 0.5; }
});
