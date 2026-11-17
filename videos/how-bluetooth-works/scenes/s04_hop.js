'use strict';
/* 4 · THE HOP — your link as a metro line on the hop map (the real hop sequence of an example
   phone, from the specification's kernel); a burst at real speed, 1,600 hops a second; the
   timetable board fed by the phone's address and clock; the earbuds working out the same one. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    and: at('hop', 'and'), never: at('hop', 'never'), one: at('hop', 'one'), it2: at('hop', 'it', 2),
    jumps: at('hop', 'jumps'), sixteen: at('hop', 'sixteen'), hundred: at('hop', 'hundred'), second: at('hop', 'second'),
    the: at('hop', 'the'), random: at('hop', 'random'), but: at('hop', 'but'), timetable: at('hop', 'timetable'),
    works: at('hop', 'works'), address: at('hop', 'address'), clock: at('hop', 'clock'),
    your2: at('hop', 'your', 2), earbuds: at('hop', 'earbuds'), same: at('hop', 'same'), so: at('hop', 'so'),
    listening: at('hop', 'listening'), place: at('hop', 'place'), moment: at('hop', 'moment'),
  };
  const T0 = beatOf('hop').t0 - 0.5, T1 = beatOf('code').t0 - 0.5;
  const SLOW = 4, FAST = 1600;
  const A = c.jumps - 0.15, B = A + 0.55, C = c.hundred + 0.25, D = C + 0.55;
  /* slots: the same clock as the next scene's map, so the two join without a jump */
  const sCode0 = 98 - SLOW * (at('code', 'land') + 0.2 - T1);
  const raw = (t) => SLOW * (t - T0) + (FAST - SLOW) * windowIntegral(t, A, B, C, D);
  const base = sCode0 - raw(T1);
  const S = (t) => base + raw(t);
  const W = (t) => windowAt(t, A, B, C, D);
  const rowH = (t) => lerp(MAP.rowH, 1.6, W(t));
  /* when slot position x passes (for sounds and the board's flaps) */
  const tOf = (x) => { let lo = T0 - 1, hi = T1 + 1; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (S(m) < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  const you = (k) => hopAt(PHONES.you, k);
  /* layout switches inside the beat */
  const boardIn = c.but - 0.1, boardOut = c.so - 0.25, dual = c.earbuds - 0.1;
  /* keep sound off the words the board explains (a click on “clock” made it “clerk” in the mix) */
  const quiet = ['timetable', 'address', 'clock'].map((w) => [at('hop', w) - 0.15, at('hop', w, 1, 't1') + 0.06]);
  const inQuiet = (x) => quiet.some(([a, b]) => x > a && x < b);

  /* sound: a tick per hop while slowed, a count and an impact for the burst, flaps for the board */
  for (let k = Math.ceil(S(T0)) ; ; k++) {
    const tk = tOf(k - 0.5);
    if (tk > T1 - 0.3) break;
    if (tk > A - 0.05 && tk < D + 0.05) continue;
    if (tk > boardIn + 0.4 && tk < boardOut) { if (!inQuiet(tk)) sfx(tk, 'tick', 0.16, { pitch: 1.5 }); continue; }
    if (tk > boardOut + 0.3) { sfx(tk, 'lock', 0.32, { pitch: 1 + 0.03 * ((k % 8)) }); continue; }
    sfx(tk, 'tick', 0.3, { pitch: k % 2 ? 1.0 : 1.25 });
  }
  sfx(A, 'riser', 0.45, { dur: c.hundred - A });
  sfx(A + 0.1, 'data', 0.4, { dur: C - A });
  sfx(c.hundred, 'impact', 0.65);
  sfx(C + 0.05, 'whoosh', 0.45);
  sfx(boardIn, 'slide', 0.5, { dur: 0.5 });
  sfx(c.timetable + 0.25, 'blip', 0.35);
  sfx(at('hop', 'address', 1, 't1') + 0.08, 'blip', 0.4, { pitch: 1.1 });
  sfx(at('hop', 'clock', 1, 't1') + 0.08, 'blip', 0.4, { pitch: 1.25 });
  sfx(dual, 'flip', 0.5);
  sfx(c.same - 0.05, 'chime', 0.4, { pitch: 1.2 });
  sfx(boardOut, 'whoosh', 0.4);

  addScene('hop', function (ctx, t) {
    const s = S(t), w = W(t), rh = rowH(t);
    const mapA = 1 - tw(t, boardIn - 0.1, boardIn + 0.45, E.io3) * (1 - tw(t, boardOut, boardOut + 0.5, E.io3));
    const boardA = tw(t, boardIn, boardIn + 0.4, E.out3) * (1 - tw(t, boardOut - 0.1, boardOut + 0.35, E.io3));
    const shake = w > 0.9 ? Math.sin(t * 83) * 2.5 : 0;
    /* ---- the map ---- */
    if (mapA > 0.003) {
      withAlpha(ctx, mapA, () => {
        withCam(ctx, { fx: 540, fy: 800, zoom: 1 + 0.025 * prog(t, T0, T1), dx: shake }, () => {
          const realTime = w > 0.5;
          mapPanel(ctx, t, { slowTag: { str: realTime ? 'REAL TIME' : 'SLOWED ×400', bg: realTime ? COL.accent : COL.data } });
          const pts = mapLine(ctx, you, s, { rowH: rh, color: COL.subject, lw: 8 });
          const nowS = mapNow(you, s);
          const lockP = t > boardOut ? prog(s, nowS.k - 0.5, nowS.k + 0.1) : 1;
          nowMarkers(ctx, nowS.x, MAP.nowY, { alpha: 1 - w, lock: lockP < 1 ? lockP : 0 });
          /* legend and the speed of time */
          withAlpha(ctx, 1 - w, () => {
            line(ctx, MAP.x0 + 28, MAP.y1 - 34, MAP.x0 + 74, MAP.y1 - 34, COL.subject, 8);
            text(ctx, 'YOUR PHONE ↔ EARBUDS', MAP.x0 + 88, MAP.y1 - 25, { size: 24, weight: 700, family: F.mono, color: COL.subject });
          });
          /* the place and the moment */
          const pl = tw(t, c.place - 0.15, c.place + 0.25, E.out3), mo = tw(t, c.moment - 0.15, c.moment + 0.25, E.out3);
          if (pl > 0) {
            withAlpha(ctx, pl, () => {
              line(ctx, chX(0), MAP.top + 6, chX(78), MAP.top + 6, COL.subject, 5);
              arrowHead(ctx, chX(78), MAP.top + 6, 0, 16, COL.subject); arrowHead(ctx, chX(0), MAP.top + 6, Math.PI, 16, COL.subject);
              pill(ctx, 'RIGHT PLACE = CHANNEL', 440, MAP.y0 + 40, { size: 24, bg: COL.subject });
            });
          }
          if (mo > 0) {
            withAlpha(ctx, mo, () => {
              fillRR(ctx, MAP.x0 + 12, MAP.nowY - MAP.rowH * 0.32, MAP.x1 - MAP.x0 - 24, MAP.rowH * 0.64, 10, rgba(COL.data, 0.10));
              pill(ctx, 'RIGHT MOMENT = SLOT · 0.625 ms', 540, MAP.nowY + 66, { size: 24, bg: COL.data });
            });
          }
        });
      });
      /* the rate readout for the burst */
      const ro = tw(t, A - 0.1, A + 0.3, E.out3) * (1 - tw(t, D, D + 0.5, E.lin));
      if (ro > 0) {
        const n = FAST * E.out3(prog(t, A, c.hundred + 0.05));
        withAlpha(ctx, ro * mapA, () => {
          fillRR(ctx, 150, 930, 780, 190, 18, COL.panel); strokeRR(ctx, 150, 930, 780, 190, 18, COL.ink, 4);
          text(ctx, fmt(n), 540, 1052, { size: 120, weight: 800, family: F.disp, color: COL.accent, align: 'center' });
          tag(ctx, 'HOPS PER SECOND · MAXIMUM', 540, 1098, { align: 'center', size: 28, color: COL.ink });
        });
      }
    }
    /* ---- the timetable: worked out from the address and the clock ---- */
    if (boardA > 0.003) {
      ctx.save();
      { const z = 1 + 0.045 * prog(t, boardIn, boardOut); ctx.translate(540, 760); ctx.scale(z, z); ctx.translate(-540, -760); }
      const k0 = Math.round(s), du = tw(t, dual, dual + 0.5, E.io3);
      const sAt = (x) => tOf(x);
      const chipIn = (cue) => tw(t, cue - 0.15, cue + 0.3, E.out3);
      const kern = tw(t, c.timetable + 0.2, c.timetable + 0.6, E.out3);
      withAlpha(ctx, boardA, () => {
        /* inputs */
        const ca = chipIn(c.address), cc = chipIn(c.clock);
        const feed = (cue) => prog(t, cue + 0.1, cue + 0.6);
        if (ca > 0) withAlpha(ctx, ca, () => {
          fillRR(ctx, 70, 404, 450, 106, 14, COL.panel); strokeRR(ctx, 70, 404, 450, 106, 14, COL.subject, 4);
          tag(ctx, 'ADDRESS · AN EXAMPLE', 96, 444, { size: 22, color: COL.subject });
          text(ctx, PHONES.you.addr, 96, 488, { size: 31, weight: 600, family: F.mono, color: COL.ink });
        });
        if (cc > 0) withAlpha(ctx, cc, () => {
          fillRR(ctx, 560, 404, 450, 106, 14, COL.panel); strokeRR(ctx, 560, 404, 450, 106, 14, COL.data, 4);
          tag(ctx, 'CLOCK · 312.5 µs TICKS', 586, 444, { size: 22, color: COL.data });
          text(ctx, '0x' + ((PHONES.you.clk + 2 * k0) >>> 0).toString(16).toUpperCase().padStart(7, '0'), 586, 488, { size: 31, weight: 600, family: F.mono, color: COL.ink });
        });
        if (kern > 0) withAlpha(ctx, kern, () => {
          const kw = 440, kx = 540 - kw / 2, ky = 556;
          for (const [x0, cue, col] of [[295, c.address, COL.subject], [785, c.clock, COL.data]]) {
            const f = feed(cue);
            if (t < cue - 0.15) continue;
            line(ctx, x0, 512, x0, ky + 30, col, 4, 0.8);
            if (f > 0 && f < 1) dot(ctx, x0, lerp(512, ky + 30, E.io3(f)), 9, col);
          }
          line(ctx, 295, ky + 30, kx, ky + 30, COL.subject, 4, 0.8 * clamp((t - c.address) * 4)); line(ctx, 785, ky + 30, kx + kw, ky + 30, COL.data, 4, 0.8 * clamp((t - c.clock) * 4));
          const glowK = Math.max(pulse(t, c.address + 0.6, 0.06, 0.5), pulse(t, c.clock + 0.6, 0.06, 0.5));
          fillRR(ctx, kx, ky, kw, 62, 12, COL.ink);
          text(ctx, 'HOP SELECTION', 540, ky + 42, { size: 30, weight: 800, family: F.disp, color: mixHex(COL.panel, COL.accent, glowK), align: 'center', ls: 2 });
          line(ctx, 540, ky + 62, 540, 680, COL.ink, 4, 0.8); arrowHead(ctx, 540, 684, Math.PI / 2, 14, COL.ink);
        });
        /* one board, then two identical ones */
        if (du < 1) {
          withAlpha(ctx, 1 - du, () => timetable(ctx, t, 70, 700, { ph: PHONES.you, s, sAt, rows: 5, title: "YOUR PHONE'S TIMETABLE", w: 940, p: boardA }));
        }
        if (du > 0) {
          withAlpha(ctx, du, () => {
            for (const [bx, title, col] of [[70, 'PHONE', COL.subject], [550, 'EARBUDS', COL.subject]]) {
              const yy = 700 + (1 - du) * 30;
              fillRR(ctx, bx, yy, 460, 470, 14, GREY.board());
              text(ctx, title, bx + 28, yy + 50, { size: 32, weight: 800, family: F.disp, color: COL.panel, ls: 4 });
              text(ctx, 'CH   MHz', bx + 28 + 4 * (FLAP.cw + FLAP.gap), yy + 82, { size: 20, weight: 600, family: F.mono, color: rgba(COL.panel, 0.6), align: 'center' });
              const tc = tOf(k0 - 0.5);
              for (let i = 0; i < 5; i++) {
                const ry = yy + 100 + i * 72;
                const row = (k) => String(you(k)).padStart(2, '0') + '  ' + mhz(you(k));
                flapRow(ctx, bx + 28, ry, row(k0 + i), row(k0 + i - 1), t, tc + i * 0.03, { colors: (j) => (j < 2 ? mixHex(COL.accent, COL.panel, i === 0 ? 0.12 : 0.35) : rgba(COL.panel, i === 0 ? 1 : 0.78)) });
                if (i === 0) fillRR(ctx, bx + 10, ry + 8, 8, FLAP.ch - 16, 4, COL.accent);
              }
            }
            const sm = tw(t, c.same - 0.1, c.same + 0.3, E.out3);
            if (sm > 0) pill(ctx, 'SAME ADDRESS + SAME CLOCK = SAME TIMETABLE', 540, 1196, { size: 22, bg: COL.good, alpha: sm });
            /* the inputs feed both boards */
            line(ctx, 540, 684, 300, 698, COL.ink, 3, 0.6); line(ctx, 540, 684, 780, 698, COL.ink, 3, 0.6);
          });
        }
      });
      ctx.restore();
    }
  }, { type: 'fade' });
});
