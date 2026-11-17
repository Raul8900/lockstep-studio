'use strict';
/* 3 · ONE BAND — the 2.4 GHz band as a ruler: Wi-Fi and microwave ovens already live there;
   Classic Bluetooth cuts it into 79 channels, which become the tracks of the hop map. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    band: at('band', 'band'), two: at('band', 'two'), ghz: at('band', 'gigahertz'), shared: at('band', 'shared'),
    wifi: at('band', 'wi-fi'), micro: at('band', 'microwave'), classic: at('band', 'classic'),
    slices: at('band', 'slices'), n79: at('band', 'seventy-nine'), channels: at('band', 'channels'),
  };
  const RY = 930;                                   // the ruler's line before it moves up
  const WIFI = [{ n: 1, f0: 2402, f1: 2422 }, { n: 6, f0: 2427, f1: 2447 }, { n: 11, f0: 2452, f1: 2472 }];
  const tickA = c.slices - 0.05, tickB = c.n79 + 0.4;
  const move0 = c.channels + 0.05, move1 = c.channels + 0.75;

  sfx(c.ghz + 0.05, 'impact', 0.5);
  WIFI.forEach((w, i) => sfx(c.wifi - 0.05 + i * 0.1, 'pop', 0.45, { pitch: 1 + i * 0.08 }));
  sfx(c.micro - 0.05, 'swell', 0.38, { dur: 0.9 });
  sfx(c.classic - 0.1, 'blip', 0.45);
  sfx(tickA, 'count', 0.42, { dur: tickB - tickA });
  sfx(c.channels, 'lock', 0.5);
  sfx(move0 + 0.05, 'whoosh', 0.4);

  addScene('band', function (ctx, t) {
    const mv = tw(t, move0, move1, E.io3);
    const ry = lerp(RY, MAP.top, mv);
    const dimOthers = 1 - 0.75 * tw(t, c.classic - 0.15, c.classic + 0.35, E.out3);
    const head = 1 - tw(t, move0 - 0.1, move0 + 0.3, E.lin);
    const T0b = beatOf('band').t0 - 0.5;
    ctx.save();
    { const z = 1 + 0.03 * prog(t, T0b, move0) * (1 - mv); ctx.translate(540, 760); ctx.scale(z, z); ctx.translate(-540, -760); }
    /* headline: the band, then the channels */
    withAlpha(ctx, head, () => {
      const hA = 0.55 + 0.45 * tw(t, c.band - 0.1, c.band + 0.3, E.out3);
      tag(ctx, 'ONE RADIO BAND', 540, 424, { align: 'center', size: 30, color: COL.ink, alpha: hA * (1 - tw(t, c.classic - 0.1, c.classic + 0.2, E.lin)) });
      const g = tw(t, c.two - 0.05, c.ghz + 0.25, E.out3), swap = tw(t, c.n79 - 0.1, c.n79 + 0.25, E.out3);
      if (swap < 1) riseText(ctx, '2.4 GHz', 540, 566, g * (1 - swap), { size: 140, weight: 800, family: F.disp, color: COL.accent, align: 'center' });
      if (swap > 0) {
        riseText(ctx, '79', 420, 572, swap, { size: 160, weight: 800, family: F.disp, color: COL.accent, align: 'center' });
        riseText(ctx, 'CHANNELS', 560, 524, swap, { size: 58, weight: 800, family: F.disp, color: COL.ink, align: 'left' });
        riseText(ctx, '1 MHz EACH', 562, 570, swap, { size: 30, weight: 600, family: F.mono, color: COL.dim, align: 'left' });
      }
      const cb = tw(t, c.classic - 0.15, c.classic + 0.25, E.out3) * (1 - swap);
      if (cb > 0) pill(ctx, 'CLASSIC BLUETOOTH', 540, 424, { size: 28, bg: COL.subject, alpha: cb });
    });
    /* the neighbours already on the band: Wi-Fi channels 1, 6, 11 and the microwave oven */
    /* the band itself: a soft slice above the ruler, there from the first frame, with the carriage's
       links still hopping along it (each dot is a real hop of one of the crowd's example phones) */
    withAlpha(ctx, 1 - mv, () => {
      const k = 0.6 + 0.4 * tw(t, c.band - 0.1, c.band + 0.4, E.out3);
      fillRR(ctx, fx(2400), RY - 196, fx(2483.5) - fx(2400), 176, 12, rgba(COL.ink, 0.035 * k + 0.02));
      ctx.save(); ctx.setLineDash([8, 8]); strokeRR(ctx, fx(2400), RY - 196, fx(2483.5) - fx(2400), 176, 12, rgba(COL.ink, 0.25 * k), 2); ctx.restore();
      const crowd = (1 - 0.6 * tw(t, c.shared - 0.2, c.wifi + 0.2, E.io3)) * (1 - tw(t, c.classic - 0.2, c.classic + 0.3, E.io3));
      if (crowd > 0) {
        for (let i = 0; i < 40; i++) {
          const ph = i === CAR.you ? PHONES.you : i === CAR.nb ? PHONES.nb : CROWD_PHONES[i];
          const slot = Math.floor(t * 3.2 + i * 0.37), ch = btHop(ph.ulap, (ph.clk + 2 * slot) >>> 0);
          const y = RY - 40 - 136 * hash(i * 1.37 + 0.5);
          const col = i === CAR.you ? COL.subject : i === CAR.nb ? COL.accent : GREY.link();
          dot(ctx, chX(ch), y, i === CAR.you || i === CAR.nb ? 8 : 5.5, col, crowd * (i === CAR.you || i === CAR.nb ? 1 : 0.75));
        }
      }
    });
    withAlpha(ctx, (1 - 0.85 * (1 - dimOthers) / 0.75) * (1 - mv), () => {
      WIFI.forEach((w, i) => {
        const k = tw(t, c.wifi - 0.1 + i * 0.1, c.wifi + 0.3 + i * 0.1, E.out3);
        if (k <= 0) return;
        const x0 = fx(w.f0), x1 = fx(w.f1), top = RY - 20 - 130 * k;
        fillRR(ctx, x0, top, x1 - x0, RY - 20 - top, 10, rgba(COL.alert, 0.08 + 0.10 * hash(i * 7 + Math.floor(t * 9))));
        strokeRR(ctx, x0, top, x1 - x0, RY - 20 - top, 10, COL.alert, 3);
        withAlpha(ctx, k, () => {
          icon(ctx, 'wifi', (x0 + x1) / 2, top + 40, 40, COL.alert, { lw: 2.4 });
          text(ctx, 'WI-FI ' + w.n, (x0 + x1) / 2, top + 98, { size: 26, weight: 700, family: F.mono, color: COL.alert, align: 'center' });
        });
      });
      const m = tw(t, c.micro - 0.1, c.micro + 0.4, E.out3);
      if (m > 0) {
        const pts = [];
        for (let f = 2431; f <= 2469; f += 0.5) { const u = (f - 2450) / 12; pts.push([fx(f), RY - 22 - 200 * Math.exp(-u * u) * m]); }
        polyline(ctx, pts, COL.alert, 4, 1, 0.9, [12, 9]);
        pictoDisk(ctx, 'microwave', fx(2450), RY - 268 - 24 * (1 - m), 42, COL.alert, { alpha: m, lw: 1.8 });
        text(ctx, 'MICROWAVE', fx(2450) + 54, RY - 274, { size: 24, weight: 700, family: F.mono, color: COL.alert, align: 'left', alpha: m });
        text(ctx, 'OVEN', fx(2450) + 54, RY - 246, { size: 24, weight: 700, family: F.mono, color: COL.alert, align: 'left', alpha: m });
      }
    });
    const un = tw(t, c.shared - 0.1, c.shared + 0.3, E.out3) * (1 - tw(t, c.classic - 0.1, c.classic + 0.2, E.lin));
    if (un > 0) tag(ctx, 'UNLICENSED · NOBODY OWNS IT', 540, 1066, { align: 'center', size: 26, color: COL.ink, alpha: un });
    /* the map panel arrives behind the ruler as it moves up */
    if (mv > 0) mapPanel(ctx, t, { alpha: mv, tracks: 0, labels: 0, now: 0 });
    /* the ruler, its 79 ticks, and the tracks growing down from them */
    bandRuler(ctx, ry, { p: 1, ticks: tw(t, tickA, tickB, E.lin), tickH: 24, labels: 1 - mv, alpha: 1 - mv });
    if (mv > 0) {
      for (let ch = 0; ch < 79; ch++) {
        const x = chX(ch), major = ch % 10 === 0;
        line(ctx, x, ry, x, lerp(ry, MAP.y1 - 10, mv), mixHex(COL.subject, COL.ink, mv, (major ? 0.16 : 0.08) + 0.5 * (1 - mv)), major ? 2 : 1.5);
      }
      withAlpha(ctx, mv, () => {
        text(ctx, '2402 MHz', chX(0) - 2, MAP.top - 16, { size: 24, weight: 600, family: F.mono, color: COL.ink, align: 'left' });
        text(ctx, '2480 MHz', chX(78) + 2, MAP.top - 16, { size: 24, weight: 600, family: F.mono, color: COL.ink, align: 'right' });
        text(ctx, 'CHANNEL', MAP.x0 + 26, MAP.y0 + 44, { size: 24, weight: 700, family: F.mono, color: COL.dim, ls: 2 });
        tag(ctx, '1 MHz EACH · BLUETOOTH LE: 40 × 2 MHz', 540, MAP.y1 - 30, { align: 'center', size: 24, color: COL.dim });
      });
    }
    ctx.restore();
  }, { type: 'zoomIn', fx: 540, fy: 498, z: 2.2, zb: 0.8, bx: 540, by: 930 });
});
