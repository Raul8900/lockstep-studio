'use strict';
/* 5 · THE CODE — your neighbour's line lands on your channel (a real coincidence of the two hop
   sequences: slot 98, channel 32); every packet's front carries a code made from the phone's
   address; your earbud only opens its doors for your code. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    still: at('code', 'still'), someone: at('code', 'someone'), land: at('code', 'land'), channel: at('code', 'channel'),
    so: at('code', 'so'), every: at('code', 'every'), starts: at('code', 'starts'), name: at('code', 'name'), tag: at('code', 'tag'),
    code: at('code', 'code'), phones: at('code', "phone's"), address: at('code', 'address'),
    your3: at('code', 'your', 3), open: at('code', 'open'), code2: at('code', 'code', 2),
    nbr: at('code', "neighbour's"), music: at('code', 'music'), different: at('code', 'different'), one: at('code', 'one'),
  };
  const T0 = beatOf('code').t0 - 0.5;
  const MEET = 98, tMeet = c.land + 0.2;
  const S = (t) => MEET - 4 * (tMeet - t);
  const you = (k) => hopAt(PHONES.you, k), nb = (k) => hopAt(PHONES.nb, k);
  const toPacket = c.so - 0.35, toGate = c.your3 - 0.35;
  const G = { x: 400, y: 800 }, GS = 1.25;                     // the earbud gate
  const blueIn = c.open - 0.9, blueAt = c.code2 - 0.05, orangeIn = c.nbr - 0.25, orangeAt = c.different - 0.1;

  sfx(T0 + 0.6, 'blip', 0.35, { pitch: 0.9 });
  sfx(tMeet - 0.04, 'pop', 0.55);
  sfx(toPacket, 'whoosh', 0.4);
  sfx(c.starts - 0.1, 'slide', 0.4, { dur: 0.5 });
  sfx(c.tag - 0.06, 'pop', 0.55, { pitch: 1.15 });
  sfx(c.address - 0.05, 'blip', 0.5);
  sfx(toGate, 'whoosh', 0.35);
  sfx(blueIn, 'slide', 0.4, { dur: 0.6 });
  sfx(blueAt, 'lock', 0.6);
  sfx(blueAt + 0.12, 'chime', 0.4, { pitch: 1.3 });
  sfx(orangeIn, 'slide', 0.4, { dur: 0.6 });
  sfx(orangeAt, 'deny', 0.55);

  addScene('code', function (ctx, t) {
    const s = S(t);
    const mapA = 1 - tw(t, toPacket, toPacket + 0.5, E.io3);
    const pkA = tw(t, toPacket + 0.15, toPacket + 0.6, E.out3) * (1 - tw(t, toGate, toGate + 0.4, E.io3));
    const gateA = tw(t, toGate + 0.1, toGate + 0.5, E.out3);
    /* ---- 1: the neighbour's line lands on your channel ---- */
    if (mapA > 0.003) {
      const meetX = chX(you(MEET));
      const zin = tw(t, toPacket - 0.6, toPacket + 0.4, E.in3);
      withAlpha(ctx, mapA, () => {
        withCam(ctx, { fx: meetX, fy: MAP.nowY, zoom: 1 + 1.6 * zin }, () => {
          mapPanel(ctx, t, { slowTag: { str: 'SLOWED ×400' } });
          const nbA = tw(t, T0 + 0.2, T0 + 1.0, E.out3);
          mapLine(ctx, nb, s, { color: COL.accent, lw: 7, alpha: nbA });
          mapLine(ctx, you, s, { color: COL.subject, lw: 8 });
          const nw = mapNow(you, s);
          nowMarkers(ctx, nw.x, MAP.nowY, {});
          const hit = pulse(t, tMeet, 0.05, 0.9);
          if (t > tMeet - 0.1) {
            ring(ctx, meetX, MAP.nowY, 26 + 40 * E.out3(prog(t, tMeet, tMeet + 0.6)), COL.accent, 4, 1 - prog(t, tMeet, tMeet + 0.6));
            const lb = tw(t, tMeet, tMeet + 0.3, E.out3);
            pill(ctx, 'SAME CHANNEL · CH ' + you(MEET), meetX, MAP.nowY + 74, { size: 24, bg: COL.accent, alpha: lb * (1 + 0.0 * hit) });
          }
          withAlpha(ctx, nbA, () => {
            line(ctx, MAP.x0 + 28, MAP.y1 - 34, MAP.x0 + 74, MAP.y1 - 34, COL.accent, 7);
            text(ctx, "YOUR NEIGHBOUR'S LINK", MAP.x0 + 88, MAP.y1 - 25, { size: 24, weight: 700, family: F.mono, color: COL.accent });
          });
        });
      });
    }
    /* ---- 2: the name tag at the front of every packet ---- */
    if (pkA > 0.003) {
      const zpk = 1 + 0.05 * prog(t, toPacket, toGate);
      ctx.save(); ctx.translate(540, 760); ctx.scale(zpk, zpk); ctx.translate(-540, -760 + 5 * Math.sin(t * 1.8));
      withAlpha(ctx, pkA, () => {
        const slide = tw(t, toPacket + 0.1, toPacket + 0.7, E.out3);
        const lab = tw(t, c.starts - 0.1, c.starts + 0.3, E.out3);
        const pop = pulse(t, c.tag - 0.02, 0.06, 0.5);
        const cx = lerp(760, 540, slide);
        const g = packetCapsule(ctx, cx, 760, 860, 176, { color: COL.subject, code: PHONES.you.lap, labels: lab, t });
        if (pop > 0) ring(ctx, g.bx, g.by, g.br + 10 + 30 * pop, COL.subject, 5, pop);
        const nt = tw(t, c.name - 0.1, c.tag + 0.2, E.out3);
        if (nt > 0) {
          pill(ctx, 'NAME TAG', g.bx - 20, 912, { size: 30, bg: COL.subject, alpha: nt });
          line(ctx, g.bx, 888, g.bx, 850, COL.subject, 4, nt);
        }
        /* the phone's address: its last three bytes become the code */
        const ad = tw(t, c.phones - 0.15, c.phones + 0.3, E.out3);
        if (ad > 0) {
          withAlpha(ctx, ad, () => {
            const sz = 40, str = PHONES.you.addr, wAll = measure(ctx, str, sz, 600, F.mono), x0 = 540 - wAll / 2;
            const wHead = measure(ctx, str.slice(0, 9), sz, 600, F.mono);
            const pw = Math.max(wAll, measure(ctx, "YOUR PHONE'S ADDRESS (EXAMPLE)", 22, 700, F.mono, 2.5)) + 60;
            fillRR(ctx, 540 - pw / 2, 418, pw, 96, 14, COL.panel); strokeRR(ctx, 540 - pw / 2, 418, pw, 96, 14, COL.ink, 3);
            tag(ctx, "YOUR PHONE'S ADDRESS (EXAMPLE)", 540, 446, { align: 'center', size: 22 });
            const hl = tw(t, c.address, c.address + 0.4, E.out3);
            highlighter(ctx, x0 + wHead - 4, 462, wAll - wHead + 8, 44, COL.subject, hl, 0.22);
            text(ctx, str, x0, 498, { size: sz, weight: 600, family: F.mono, color: COL.ink });
            const fl = tw(t, c.address + 0.3, c.address + 0.9, E.io3);
            if (fl > 0) { ctx.save(); ctx.setLineDash([10, 8]); polyline(ctx, [[x0 + (wHead + wAll) / 2, 516], [g.bx, 560], [g.bx, 580]], COL.subject, 4, fl); ctx.restore(); }
          });
        }
        tag(ctx, 'ACCESS CODE · MADE FROM THE ADDRESS', 540, 1010, { align: 'center', size: 24, color: COL.subject, alpha: tw(t, c.address + 0.4, c.address + 0.8, E.out3) });
      });
    }
    if (pkA > 0.003) ctx.restore();
    /* ---- 3: the earbud only opens for that code ---- */
    if (gateA > 0.003) {
      withAlpha(ctx, gateA, () => {
        const open = tw(t, blueAt - 0.05, blueAt + 0.3, E.io3) * (1 - tw(t, blueAt + 0.95, blueAt + 1.3, E.io3));
        const v1 = tw(t, blueAt, blueAt + 0.35, E.out3) * (1 - tw(t, orangeIn - 0.1, orangeIn + 0.1, E.lin));
        const v2 = tw(t, orangeAt, orangeAt + 0.35, E.out3);
        ctx.save(); ctx.translate(0, 9 * Math.sin(t * 1.9));
        earbudGate(ctx, G.x, G.y, { s: GS, open, verdict: v2 > 0 ? 'no' : 'ok', vp: v2 > 0 ? v2 : v1 });
        tag(ctx, 'YOUR EARBUD · LISTENING FOR 5B91E3', 540, 500, { align: 'center', size: 24, color: COL.subject });
        /* your packet: arrives, doors open, it goes in */
        const bIn = tw(t, blueIn, blueAt - 0.1, E.out3), bGo = tw(t, blueAt + 0.2, blueAt + 0.8, E.in3);
        if (t > blueIn && bGo < 1) packetCapsule(ctx, lerp(1240, G.x + 152 * GS + 205, bIn) - 360 * bGo, G.y, 380, 110, { color: COL.subject, code: PHONES.you.lap, alpha: 1 - bGo, t });
        /* your neighbour's: arrives, refused, falls away */
        const oIn = tw(t, orangeIn, orangeAt - 0.15, E.out3), oFall = tw(t, orangeAt + 0.25, orangeAt + 0.9, E.in2);
        if (t > orangeIn) packetCapsule(ctx, lerp(1240, G.x + 152 * GS + 205, oIn) + 60 * oFall, G.y + 220 * oFall * oFall, 380, 110, { color: COL.accent, code: PHONES.nb.lap, alpha: 1 - oFall, t });
        const l1 = v1, l2 = v2;
        ctx.restore();
        if (l1 > 0) pill(ctx, 'YOUR CODE · LET IN', 540, 1150, { size: 28, bg: COL.good, alpha: l1 });
        if (l2 > 0) pill(ctx, 'NOT YOUR CODE · IGNORED', 540, 1150, { size: 28, bg: COL.alert, alpha: l2 });
      });
    }
  }, { type: 'fade' });
});
