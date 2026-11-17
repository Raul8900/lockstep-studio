'use strict';
/* 6 · THE CLASH — two real hop sequences meet on the same channel in the same slot (slot 150,
   channel 50); the rulebook's own words; both packets garbled; no reply; your phone sends it
   again on the next hop (slot 152, channel 18); the earbud's reserve hides the gap. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    and: at('clash', 'and'), two: at('clash', 'two'), hit: at('clash', 'hit'), same: at('clash', 'same'), instant: at('clash', 'instant'),
    bt: at('clash', "bluetooth's"), rulebook: at('clash', 'rulebook'), strong: at('clash', 'strong'), likelihood: at('clash', 'likelihood'),
    they: at('clash', 'they'), garble: at('clash', 'garble'), earbuds: at('clash', 'earbuds'), confirm: at('clash', 'confirm'),
    sends: at('clash', 'sends'), again: at('clash', 'again'), next: at('clash', 'next'), hop: at('clash', 'hop'), ms: at('clash', 'milliseconds'),
    and2: at('clash', 'and', 2), fraction: at('clash', 'fraction'), reserve: at('clash', 'reserve'), gap: at('clash', 'gap'),
  };
  const T0 = beatOf('clash').t0 - 0.5;
  const K = 150, tHit = c.instant + 0.02;
  const S = (t) => K - 4 * (tHit - t);
  const you = (k) => hopAt(PHONES.you, k), nb = (k) => hopAt(PHONES.nb, k);
  const toQuote = c.bt - 0.3, toPackets = c.they - 0.3, toBuffer = c.and2 - 0.3;
  const reTx = c.again + 0.05, reLand = c.hop + 0.05;

  sfx(c.two - 0.1, 'blip', 0.35);
  sfx(tHit - 0.7, 'riser', 0.45, { dur: 0.7 });
  sfx(tHit, 'impact', 0.75);
  sfx(tHit + 0.01, 'rip', 0.5);
  sfx(toQuote, 'slide', 0.45, { dur: 0.5 });
  sfx(c.strong - 0.06, 'stamp', 0.6);
  sfx(c.garble - 0.05, 'data', 0.45, { dur: 0.6 });
  sfx(c.confirm - 0.05, 'stall', 0.5);
  sfx(reTx, 'zip', 0.5);
  sfx(reLand, 'lock', 0.6);
  sfx(reLand + 0.12, 'chime', 0.45, { pitch: 1.2 });
  sfx(toBuffer, 'whoosh', 0.35);
  sfx(c.reserve - 0.05, 'blip', 0.4);
  sfx(c.gap - 0.25, 'pop', 0.45, { pitch: 1.1 });

  addScene('clash', function (ctx, t) {
    const s = S(t);
    const mapA = 1 - tw(t, toQuote - 0.05, toQuote + 0.4, E.io3);
    const qA = tw(t, toQuote, toQuote + 0.45, E.out3) * (1 - tw(t, toPackets - 0.1, toPackets + 0.3, E.io3));
    const pA = tw(t, toPackets, toPackets + 0.4, E.out3) * (1 - tw(t, toBuffer - 0.1, toBuffer + 0.3, E.io3));
    const bA = tw(t, toBuffer, toBuffer + 0.4, E.out3);
    const punch = pulse(t, tHit, 0.03, 0.45);
    /* ---- 1: same channel, same instant ---- */
    if (mapA > 0.003) {
      const hx = chX(you(K));
      withAlpha(ctx, mapA, () => {
        withCam(ctx, { fx: 540, fy: MAP.nowY, zoom: 1 + 0.03 * prog(t, T0, tHit) + 0.04 * punch, dx: 9 * punch * Math.sin(t * 95), dy: 5 * punch * Math.cos(t * 81) }, () => {
          mapPanel(ctx, t, { slowTag: { str: 'SLOWED ×400' } });
          mapLine(ctx, nb, s, { color: COL.accent, lw: 7 });
          mapLine(ctx, you, s, { color: COL.subject, lw: 8 });
          const nw = mapNow(you, s);
          nowMarkers(ctx, nw.x, MAP.nowY, { alpha: 1 - clamp((t - tHit) * 3) * 0.6 });
          clashBurst(ctx, hx, MAP.nowY, prog(t, tHit - 0.02, tHit + 0.7), { r: 90 });
          if (t > tHit) {
            const lb = tw(t, tHit, tHit + 0.3, E.out3);
            pill(ctx, 'COLLISION · CH ' + you(K) + ' · ' + mhz(you(K)) + ' MHz', clamp(hx, 300, 780), MAP.nowY + 88, { size: 26, bg: COL.alert, alpha: lb });
          }
          line(ctx, MAP.x0 + 28, MAP.y1 - 34, MAP.x0 + 74, MAP.y1 - 34, COL.subject, 7);
          text(ctx, 'YOURS', MAP.x0 + 88, MAP.y1 - 25, { size: 24, weight: 700, family: F.mono, color: COL.subject });
          line(ctx, MAP.x0 + 210, MAP.y1 - 34, MAP.x0 + 256, MAP.y1 - 34, COL.accent, 7);
          text(ctx, "YOUR NEIGHBOUR'S", MAP.x0 + 270, MAP.y1 - 25, { size: 24, weight: 700, family: F.mono, color: COL.accent });
        });
      });
    }
    /* ---- 2: the rulebook says so ---- */
    if (qA > 0.003) {
      withAlpha(ctx, qA, () => {
        const y0 = 470 + (1 - qA) * 40;
        withCam(ctx, { fx: 540, fy: 760, zoom: 1 + 0.03 * prog(t, toQuote, toPackets) }, () => {
          fillRR(ctx, 80, y0, 920, 640, 16, COL.panel); strokeRR(ctx, 80, y0, 920, 640, 16, COL.ink, 4);
          fillRR(ctx, 80, y0, 920, 70, 16, COL.ink); fillRR(ctx, 80, y0 + 40, 920, 30, 0, COL.ink);
          text(ctx, 'BLUETOOTH CORE SPECIFICATION', 120, y0 + 46, { size: 26, weight: 700, family: F.mono, color: COL.panel, ls: 2 });
          text(ctx, 'VOL 2 · PART B · §2', 960, y0 + 46, { size: 24, weight: 600, family: F.mono, color: rgba(COL.panel, 0.7), align: 'right' });
          textBlock(ctx, '“…there is a *strong likelihood* of two independent Bluetooth devices having their transceivers tuned to the same RF carrier, resulting in a physical channel collision.”', 130, y0 + 120, 820,
            { size: 44, weight: 500, family: F.ui, color: COL.ink, emColor: 'alert', mark: 'highlight', lineH: 1.3, p: 1, reveal: 'none' });
          const mk = tw(t, c.strong - 0.05, c.likelihood + 0.4, E.out3);
          if (mk > 0) {
            ctx.save(); ctx.translate(760, y0 + 548); ctx.rotate(-0.08);
            withAlpha(ctx, mk, () => { strokeRR(ctx, -150, -42, 300, 84, 10, COL.alert, 5); text(ctx, 'EXPECTED', 0, 16, { size: 44, weight: 800, family: F.disp, color: COL.alert, align: 'center', ls: 4 }); });
            ctx.restore();
          }
        });
      });
    }
    /* ---- 3: garbled, no reply, sent again on the next hop ---- */
    if (pA > 0.003) {
      withAlpha(ctx, pA, () => {
        const gar = tw(t, c.garble - 0.1, c.garble + 0.3, E.out3) * (1 - tw(t, reTx - 0.1, reTx + 0.2, E.io3));
        const fadeO = tw(t, reTx - 0.3, reTx + 0.2, E.lin);
        const reMove = tw(t, reTx, reLand, E.io3);
        /* the two packets, overlapping, garbled */
        packetCapsule(ctx, 520 + 8 * Math.sin(t * 40) * gar, 520, 600, 120, { color: COL.accent, code: PHONES.nb.lap, garble: gar, crack: gar, t, alpha: 1 - fadeO });
        packetCapsule(ctx, 560 - 8 * Math.sin(t * 37) * gar + 420 * reMove, 600 - 0 * reMove, 600, 120, { color: COL.subject, code: PHONES.you.lap, garble: gar, crack: gar * (1 - reMove), t, alpha: 1 - 0.85 * reMove });
        /* the reply that never comes */
        const nr = tw(t, c.earbuds - 0.1, c.confirm + 0.2, E.out3);
        if (nr > 0) {
          withAlpha(ctx, nr, () => {
            ctx.save(); ctx.setLineDash([12, 10]); strokeRR(ctx, 150, 720, 340, 96, 48, COL.alert, 4); ctx.restore();
            text(ctx, 'REPLY: OK?', 320, 780, { size: 32, weight: 700, family: F.mono, color: COL.alert, align: 'center' });
            pill(ctx, 'NOTHING CAME BACK', 520, 768, { size: 26, bg: COL.alert, align: 'left' });
            icon(ctx, 'earbuds', 98, 768, 64, COL.ink, { lw: 1.8 });
          });
        }
        /* the resend: a strip of the map — slot 150 failed, slot 152 delivered */
        const st = tw(t, c.sends - 0.2, c.sends + 0.2, E.out3);
        if (st > 0) {
          withAlpha(ctx, st, () => {
            const y0 = 900, xa = 330, xb = 760;
            fillRR(ctx, 120, y0 - 40, 840, 290, 16, COL.panel); strokeRR(ctx, 120, y0 - 40, 840, 290, 16, COL.ink, 3);
            const ya = y0 + 64, yb = y0 + 196;
            polyline(ctx, [[xa, ya], [xa, (ya + yb) / 2], [xb, (ya + yb) / 2], [xb, yb]], COL.subject, 8, clamp(reMove * 1.2));
            fillRR(ctx, xa - 9, ya - 20, 18, 40, 9, COL.panel); strokeRR(ctx, xa - 9, ya - 20, 18, 40, 9, COL.alert, 5);
            cross(ctx, xa, ya, 12, COL.alert, 1, 6);
            text(ctx, 'SLOT ' + K + ' · CH ' + you(K), xa + 32, ya + 10, { size: 26, weight: 700, family: F.mono, color: COL.alert });
            const ld = tw(t, reLand - 0.05, reLand + 0.3, E.out3);
            fillRR(ctx, xb - 9, yb - 20, 18, 40, 9, COL.panel); strokeRR(ctx, xb - 9, yb - 20, 18, 40, 9, ld > 0 ? COL.good : COL.lineHi, 5);
            if (ld > 0) check(ctx, xb - 1, yb + 2, 26, COL.good, ld, 6);
            text(ctx, 'SLOT ' + (K + 2) + ' · CH ' + you(K + 2), xb - 32, yb + 10, { size: 26, weight: 700, family: F.mono, color: ld > 0 ? COL.good : COL.dim, align: 'right' });
            const msA = tw(t, c.ms - 0.1, c.ms + 0.3, E.out3);
            if (msA > 0) pill(ctx, '+1.25 ms', (xa + xb) / 2, (ya + yb) / 2, { size: 28, bg: COL.accent, alpha: msA });
            tag(ctx, 'SENT AGAIN · NEXT HOP', 150, y0 - 2, { size: 24, color: COL.subject });
          });
        }
      });
    }
    /* ---- 4: a fraction of a second in reserve ---- */
    if (bA > 0.003) {
      withAlpha(ctx, bA, () => {
        const speed = 2.2;
        /* the lost packet's slot enters the queue as a gap and is filled by the resend */
        const kGap = Math.floor((c.fraction + 0.2) * speed) + 11;
        const fill = tw(t, c.fraction + 0.9, c.fraction + 1.3, E.out3);
        pictoDisk(ctx, 'earbuds', 540, 470, 58, COL.subject, { lw: 1.7 });
        tag(ctx, 'INSIDE YOUR EARBUDS', 540, 586, { align: 'center', size: 26, color: COL.ink });
        bufferQueue(ctx, t, 90, 640, 900, { speed, gapK: kGap, fill, n: 12 });
        text(ctx, 'PLAYING', 140, 790, { size: 24, weight: 700, family: F.mono, color: COL.ink, align: 'center' });
        text(ctx, 'ARRIVING', 940, 790, { size: 24, weight: 700, family: F.mono, color: COL.dim, align: 'center' });
        arrowHead(ctx, 120, 760, Math.PI, 14, COL.ink);
        const rv = tw(t, c.reserve - 0.1, c.reserve + 0.3, E.out3);
        if (rv > 0) {
          withAlpha(ctx, rv, () => {
            line(ctx, 160, 880, 960, 880, COL.data, 4); line(ctx, 160, 866, 160, 894, COL.data, 4); line(ctx, 960, 866, 960, 894, COL.data, 4);
            pill(ctx, '≈ 0.15 s OF MUSIC IN RESERVE', 560, 936, { size: 28, bg: COL.data });
          });
        }
        const ok = tw(t, c.gap - 0.1, c.gap + 0.3, E.out3);
        if (ok > 0) pill(ctx, 'THE GAP IS FILLED BEFORE IT PLAYS', 540, 1060, { size: 26, bg: COL.good, alpha: ok });
      });
    }
  }, { type: 'cut' });
});
