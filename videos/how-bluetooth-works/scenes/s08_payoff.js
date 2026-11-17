'use strict';
/* 8 · TERMINUS — back in the carriage, every line running; the three tricks as signs; then the
   twist: your neighbour's song shared on purpose, one stream to any number of earbuds. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    so: at('payoff', 'so'), never: at('payoff', 'never'), private: at('payoff', 'private'), line: at('payoff', 'line'),
    they: at('payoff', 'they'), timetable: at('payoff', 'timetable'), name: at('payoff', 'name'), tag: at('payoff', 'tag'),
    second: at('payoff', 'second'), chance: at('payoff', 'chance'), up: at('payoff', 'up'), sixteen: at('payoff', 'sixteen'),
    hundred: at('payoff', 'hundred'), second2: at('payoff', 'second', 2), and2: at('payoff', 'and', 2), want: at('payoff', 'want'),
    nbr: at('payoff', "neighbour's"), song: at('payoff', 'song'), newer: at('payoff', 'newer'), share: at('payoff', 'share'),
    stream: at('payoff', 'stream'), any: at('payoff', 'any'), number: at('payoff', 'number'), last: at('payoff', 'earbuds', 2, 't1'),
  };
  const T0 = beatOf('payoff').t0 - 0.5;
  const PLACE = { cx: 540, cy: 890, s: 0.8 };
  const tiles = [
    { cue: c.timetable, label: 'TIMETABLE', icon: 'calendar-clock', col: COL.data },
    { cue: c.tag, label: 'NAME TAG', icon: null, col: COL.subject },
    { cue: c.chance, label: 'SECOND CHANCE', icon: 'refresh-cw', col: COL.good },
  ];
  const tilesOut = c.and2 - 0.3, titleIn = c.last + 0.15;
  /* who receives the broadcast: your neighbour, you, and a dozen others */
  const fans = (() => { const r = rng(77), out = []; for (let i = 0; i < CAR.P.length; i++) if (i !== CAR.nb && i !== CAR.you && r() < 0.38) out.push(i); return out.slice(0, 13); })();
  const fanT = (j) => c.any - 0.2 + j * 0.05;

  sfx(T0 + 0.1, 'whoosh', 0.4);
  sfx(c.private - 0.05, 'stamp', 0.45);
  tiles.forEach((tl, i) => sfx(tl.cue - 0.05, 'pop', 0.5, { pitch: 1 + i * 0.12 }));
  sfx(c.sixteen - 0.05, 'riser', 0.4, { dur: c.second2 - c.sixteen + 0.1 });
  sfx(c.second2, 'swell', 0.45, { dur: 1.0 });
  sfx(c.song - 0.05, 'zip', 0.45);
  sfx(c.song + 0.25, 'chime', 0.4, { pitch: 1.1 });
  fans.forEach((_, j) => sfx(fanT(j) + 0.25, 'tick', 0.25, { pitch: 1 + j * 0.05 }));
  sfx(titleIn - 0.05, 'chime', 0.55, { pitch: 1.0 });
  sfx(titleIn, 'slide', 0.4, { dur: 0.5 });

  addScene('payoff', function (ctx, t) {
    const fast = tw(t, c.up - 0.1, c.hundred, E.io3) * (1 - tw(t, c.second2 + 0.2, c.second2 + 0.9, E.io3));
    const songP = tw(t, c.song - 0.2, c.song + 0.3, E.out3);
    const tilesA = 1 - tw(t, tilesOut, tilesOut + 0.4, E.io3);
    const zoom = lerp(1.07, 1.0, tw(t, T0, c.they, E.io3));
    withCam(ctx, { fx: 540, fy: 880, zoom }, () => {
      const orbitT = t + 6 * (c.up - 0.1 > t ? 0 : windowIntegral(t, c.up - 0.1, c.sixteen, c.second2, c.second2 + 0.6));
      const bub = (i) => {
        const fj = fans.indexOf(i);
        const fanK = fj >= 0 ? tw(t, fanT(fj) + 0.15, fanT(fj) + 0.45, E.out3) : 0;
        if (i === CAR.you) return { color: songP > 0.5 ? mixHex(COL.subject, COL.accent, 0.5) : COL.subject, lw: 3.4, fillA: 0.1, bud: songP > 0.5 ? COL.accent : COL.subject, phone: COL.subject };
        if (i === CAR.nb) return { color: COL.accent, lw: 3.4, fillA: 0.1 };
        if (fanK > 0) return { color: mixHex(GREY.link(), COL.accent, fanK), lw: 2 + 1.2 * fanK, bud: COL.accent, phone: GREY.link(), alpha: 0.7 + 0.3 * fanK };
        return { plain: true, color: GREY.link(), alpha: 0.6 + 0.35 * fast, lw: 2 + 1.5 * fast };
      };
      const place = carriage(ctx, orbitT, Object.assign({ doors: 1, bub }, PLACE));
      /* the broadcast: one stream from your neighbour's phone, to you, then to many */
      const nb = carPerson(CAR.nb, place), from = personPts(nb).phone;
      const toYou = personPts(carPerson(CAR.you, place)).head;
      if (songP > 0) {
        const pts = [from, [from[0] + 40, (from[1] + toYou[1]) / 2], toYou];
        polyline(ctx, pts, COL.accent, 4, songP);
        if (songP >= 1) for (let j = 0; j < 2; j++) { const u = ((t * 1.3 + j / 2) % 1); const q = polyAt(pts, polyLen(pts) * u); dot(ctx, q[0], q[1], 4, COL.accent); }
      }
      fans.forEach((i, j) => {
        const k = tw(t, fanT(j), fanT(j) + 0.45, E.out3);
        if (k <= 0) return;
        const to = personPts(carPerson(i, place)).head;
        const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 30];
        const pts = []; for (let q = 0; q <= 16; q++) { const u = q / 16; pts.push([lerp(lerp(from[0], mid[0], u), lerp(mid[0], to[0], u), u), lerp(lerp(from[1], mid[1], u), lerp(mid[1], to[1], u), u)]); }
        polyline(ctx, pts, COL.accent, 2.5, k, 0.8);
        if (k >= 1) { const u = ((t * 0.9 + j * 0.13) % 1); const q = polyAt(pts, polyLen(pts) * u); dot(ctx, q[0], q[1], 3.5, COL.accent); }
      });
    });
    /* signs above the carriage */
    const np = tw(t, c.private - 0.1, c.private + 0.3, E.out3) * (1 - tw(t, c.they - 0.25, c.they + 0.05, E.lin));
    if (np > 0) signPlate(ctx, 'NO PRIVATE LINE', 540, 440, { size: 38, alpha: np, bar: COL.alert });
    if (tilesA > 0) {
      tiles.forEach((tl, i) => {
        const k = tw(t, tl.cue - 0.15, tl.cue + 0.25, E.out3);
        if (k <= 0) return;
        const x = 70 + i * 320, y = 392, w = 300, h = 150;
        withAlpha(ctx, k * tilesA, () => {
          const yy = y + (1 - k) * 20;
          fillRR(ctx, x, yy, w, h, 14, COL.panel); strokeRR(ctx, x, yy, w, h, 14, COL.ink, 3);
          fillRR(ctx, x + 14, yy + h - 18, w - 28, 6, 3, tl.col);
          if (tl.icon) icon(ctx, tl.icon, x + w / 2, yy + 52, 52, tl.col, { lw: 2.2 });
          else pill(ctx, PHONES.you.lap, x + w / 2, yy + 54, { size: 26, bg: tl.col, r: 22 });
          text(ctx, tl.label, x + w / 2, yy + 118, { size: 27, weight: 800, family: F.disp, color: COL.ink, align: 'center', ls: 1.5 });
        });
      });
      const fA = tw(t, c.sixteen - 0.1, c.hundred + 0.2, E.out3) * (1 - tw(t, c.second2 + 0.5, c.second2 + 0.9, E.lin));
      if (fA > 0) pill(ctx, 'UP TO 1,600 TIMES A SECOND', 540, 1196, { size: 26, bg: COL.accent, alpha: fA * tilesA });
    }
    const bc = tw(t, c.share - 0.1, c.share + 0.3, E.out3) * (1 - tw(t, titleIn - 0.2, titleIn + 0.2, E.lin));
    if (bc > 0) signPlate(ctx, 'LE AUDIO BROADCAST · ONE STREAM, ANY NUMBER', 540, 430, { size: 26, alpha: bc, bar: COL.accent });
    /* the end card: a station sign */
    const ti = tw(t, titleIn, titleIn + 0.5, E.out3);
    if (ti > 0) {
      withAlpha(ctx, ti, () => {
        const y = 456 - (1 - ti) * 30;
        stationTitle(ctx, 'HOW BLUETOOTH WORKS', 540, y, 900, { size: 66, sub: 'HOP · TAG · RETRY · DODGE' });
      });
    }
  }, { type: 'zoomOut', fx: 540, fy: 800, z: 0.5, zb: 1.4 });
});
