'use strict';
/* 7 · THE CAFÉ — a café in plan view, its Wi-Fi filling the room; on the hop map that network is
   a block of channels 25–44 (Wi-Fi channel 6) that never moves; your hops inside it fail; your
   phone keeps score and drops them — the real adapted hop sequence (AFH) from then on. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    cafes: at('cafe', 'cafés'), problem: at('cafe', 'problem'), wifi: at('cafe', 'wi-fi'), doesnt: at('cafe', "doesn't"), hop: at('cafe', 'hop'),
    network: at('cafe', 'network'), camps: at('cafe', 'camps'), twenty: at('cafe', 'twenty'), channels: at('cafe', 'channels'),
    so: at('cafe', 'so'), keeps: at('cafe', 'keeps'), score: at('cafe', 'score'), failing: at('cafe', 'failing'),
    dropped: at('cafe', 'dropped'), timetable: at('cafe', 'timetable'), though: at('cafe', 'though'), least: at('cafe', 'least'), twenty2: at('cafe', 'twenty', 2),
  };
  const T0 = beatOf('cafe').t0 - 0.5, T1 = beatOf('payoff').t0 - 0.5;
  const toMap = c.network - 0.35;
  const S = (t) => 400 + 4 * (t - T0);
  const inBlock = (ch) => ch >= WIFI6.c0 && ch <= WIFI6.c1;
  const tSwitch = c.dropped + 0.05;
  const kSwitch = Math.ceil(S(tSwitch) + 0.6);         // the first slot after the map changes
  const basic = (k) => hopAt(PHONES.you, k);
  const adapted = (k) => hopAt(PHONES.you, k, AFH_MAP, 'afh');
  /* when slot k reaches NOW */
  const tNow = (k) => T0 + (k - 0.5 - 400) / 4;
  /* failures: your hops inside the block before the switch, as they reach NOW */
  const fails = [];
  for (let k = Math.ceil(S(toMap)); k < kSwitch; k++) if (inBlock(basic(k)) && tNow(k) > toMap + 0.4) fails.push(k);

  sfx(T0 + 0.05, 'whoosh', 0.45);
  sfx(c.wifi - 0.05, 'swell', 0.45, { dur: 1.0 });
  sfx(c.hop - 0.05, 'stamp', 0.45);
  sfx(toMap, 'whoosh', 0.35);
  sfx(c.camps - 0.05, 'slide', 0.45, { dur: 0.6 });
  for (const k of fails) sfx(tNow(k) + 0.02, 'deny', 0.35);
  for (let i = 0; i < 6; i++) sfx(c.keeps + i * 0.09, 'tick', 0.3, { pitch: 1 + i * 0.07 });
  sfx(c.dropped - 0.04, 'stamp', 0.65);
  sfx(tSwitch + 0.25, 'lock', 0.5);
  sfx(tSwitch + 0.4, 'chime', 0.4, { pitch: 1.15 });
  sfx(c.least - 0.05, 'blip', 0.45);

  addScene('cafe', function (ctx, t) {
    const s = S(t);
    const cafeA = 1 - tw(t, toMap - 0.05, toMap + 0.45, E.io3);
    const mapA = tw(t, toMap, toMap + 0.45, E.out3);
    /* ---- 1: the café and its Wi-Fi ---- */
    if (cafeA > 0.003) {
      withAlpha(ctx, cafeA, () => {
        const zin = tw(t, toMap - 0.5, toMap + 0.4, E.in3);
        withCam(ctx, { fx: 830, fy: 470, zoom: 1 + 0.03 * prog(t, T0, toMap) + 1.2 * zin }, () => {
          const wifi = tw(t, c.wifi - 0.1, c.wifi + 0.9, E.out3);
          const r = cafe(ctx, t, { cx: 540, cy: 812, s: 0.98, wifi, budColor: (ti, si) => (ti === 2 && si === 0 ? COL.subject : null) });
          const lb = tw(t, c.wifi, c.wifi + 0.35, E.out3);
          if (lb > 0) pill(ctx, 'WI-FI · CHANNEL 6', r.rx - 30, r.ry + 66, { size: 26, bg: COL.alert, alpha: lb, align: 'right' });
          const dh = tw(t, c.doesnt - 0.05, c.hop + 0.2, E.out3);
          if (dh > 0) {
            ctx.save(); ctx.translate(r.rx - 524, r.ry + 66); ctx.rotate(-0.06);
            withAlpha(ctx, dh, () => { strokeRR(ctx, -130, -32, 260, 64, 10, COL.alert, 4); text(ctx, "DOESN'T HOP", 0, 12, { size: 34, weight: 800, family: F.disp, color: COL.alert, align: 'center', ls: 2 }); });
            ctx.restore();
          }
        });
        const yr = tw(t, T0, T0 + 0.6, E.out3);
        signPlate(ctx, 'CAFÉ', 160, 1140, { size: 30, alpha: yr, bar: COL.subject });
      });
    }
    /* ---- 2 + 3: the block on the map; keeping score; dropping the channels ---- */
    if (mapA > 0.003) {
      withAlpha(ctx, mapA, () => {
        const blockP = tw(t, c.camps - 0.1, c.camps + 0.6, E.io3);
        const closed = tw(t, c.dropped - 0.05, c.dropped + 0.25, E.out3);
        const morph = tw(t, tSwitch, tSwitch + 0.5, E.io3);
        const score = tw(t, c.keeps - 0.1, c.failing + 0.2, E.out3);
        const tally = (ch) => (inBlock(ch) ? score * (0.55 + 0.45 * hash(ch * 3.1)) : score * (hash(ch * 7.7) < 0.12 ? 0.18 * hash(ch) : 0));
        withCam(ctx, { fx: 540, fy: 800, zoom: 1.02 - 0.02 * morph }, () => {
          mapPanel(ctx, t, { slowTag: { str: 'SLOWED ×400' }, block: { c0: WIFI6.c0, c1: WIFI6.c1, p: blockP }, closed, tally: score > 0 ? tally : null });
          const seq = (k) => {
            if (k < kSwitch) return basic(k);
            const b = basic(k), a = adapted(k);
            return morph >= 1 ? a : b === a ? a : -1;            // -1: mid-morph, drawn below
          };
          /* during the morph, the re-routed stations slide to their new channels */
          const seqDraw = (k) => { const v = seq(k); return v >= 0 ? v : lerp(basic(k), adapted(k), morph); };
          const pts = mapLine(ctx, seqDraw, s, { color: COL.subject, lw: 8 });
          /* failed hops: a red cross once they reach NOW */
          for (const p of pts) {
            if (p.k < kSwitch && inBlock(basic(p.k)) && t > tNow(p.k) && fails.includes(p.k) && p.a > 0.05) {
              const f = tw(t, tNow(p.k), tNow(p.k) + 0.2, E.out3);
              withAlpha(ctx, p.a, () => cross(ctx, p.x, p.y, 13, COL.alert, f, 6));
            }
          }
          const nw = mapNow(seqDraw, s);
          nowMarkers(ctx, nw.x, MAP.nowY, {});
          /* labels */
          const bl = tw(t, c.twenty - 0.1, c.twenty + 0.3, E.out3);
          if (bl > 0) pill(ctx, 'WI-FI · ≈ 20 CHANNELS', (chX(WIFI6.c0) + chX(WIFI6.c1)) / 2, 1110, { size: 24, bg: COL.alert, alpha: bl * (1 - closed) });
          if (closed > 0) {
            const cx = (chX(WIFI6.c0) + chX(WIFI6.c1)) / 2;
            ctx.save(); ctx.translate(cx, 840); ctx.rotate(-0.1);
            withAlpha(ctx, closed, () => { fillRR(ctx, -118, -38, 236, 76, 10, COL.panel); strokeRR(ctx, -118, -38, 236, 76, 10, COL.alert, 5); text(ctx, 'CLOSED', 0, 15, { size: 42, weight: 800, family: F.disp, color: COL.alert, align: 'center', ls: 4 }); });
            ctx.restore();
          }
          const sc = tw(t, c.keeps - 0.1, c.score + 0.2, E.out3) * (1 - closed);
          if (sc > 0) pill(ctx, 'FAILURES PER CHANNEL', 540, MAP.y0 + 24, { size: 22, bg: COL.ink, color: COL.panel, alpha: sc });
        });
        /* the count of channels in use, and its floor */
        const used = closed > 0 ? Math.round(lerp(79, 59, tw(t, c.dropped, c.dropped + 0.6, E.out3))) : 79;
        const cA = tw(t, c.dropped - 0.1, c.dropped + 0.3, E.out3);
        if (cA > 0) {
          withAlpha(ctx, cA, () => {
            fillRR(ctx, 580, 1000, 310, 150, 14, COL.panel); strokeRR(ctx, 580, 1000, 310, 150, 14, COL.ink, 3);
            tag(ctx, 'CHANNELS IN USE', 735, 1040, { align: 'center', size: 22, color: COL.dim });
            text(ctx, String(used), 735, 1122, { size: 74, weight: 800, family: F.disp, color: COL.accent, align: 'center' });
          });
        }
        const fl = tw(t, c.least - 0.1, c.least + 0.3, E.out3);
        if (fl > 0) pill(ctx, 'NEVER FEWER THAN 20', 330, 1076, { size: 26, bg: COL.good, alpha: fl });
      });
    }
  }, { type: 'gl:WhipPan', params: { direction: [-1, 0], blur: 0.35 } });
});
