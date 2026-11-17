'use strict';
/* 1 · THE QUESTION — rush hour in a carriage drawn as a plan; forty little networks;
   a stray packet from the neighbour's phone bounces off your ear. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    rush: at('hook', 'rush'), forty: at('hook', 'forty'), people: at('hook', 'people'),
    same: at('hook', 'same'), radio: at('hook', 'radio'), so: at('hook', 'so'),
    hear: at('hook', 'hear'), nb: at('hook', "neighbour's"), nbEnd: at('hook', "neighbour's", 1, 't1'),
  };
  const PLACE = { cx: 540, cy: 812, s: 0.98 };
  const launch = c.hear - 0.25, hit = c.nb + 0.36;

  /* sound */
  sfx(0.02, 'chime', 0.45, { pitch: 1.0 });
  sfx(0.16, 'slide', 0.5, { dur: 0.6 });
  for (let i = 0; i < 8; i++) sfx(c.forty - 0.12 + i * 0.055, 'tick', 0.32, { pitch: 1 + i * 0.05 });
  sfx(c.radio - 0.15, 'swell', 0.42, { dur: 1.2 });
  sfx(c.so - 0.35, 'whoosh', 0.5);
  sfx(launch, 'zip', 0.42);
  sfx(hit + 0.02, 'deny', 0.5);
  sfx(hit + 0.32, 'pop', 0.5);

  addScene('hook', function (ctx, t) {
    /* camera: a slow push, then into you and your neighbour */
    const you0 = carPerson(CAR.you, PLACE), nb0 = carPerson(CAR.nb, PLACE);
    const mx = (you0.x + nb0.x) / 2, my = (you0.y + nb0.y) / 2;
    const zin = tw(t, c.so - 0.35, c.so + 0.75, E.io3);
    const wave = (i) => tw(t, c.forty - 0.15 + (i % 20) * 0.022, c.forty + 0.35 + (i % 20) * 0.022, E.out3);
    const flash = pulse(t, c.radio + 0.05, 0.12, 0.9);
    const bub = (i) => {
      if (i === CAR.you) return { color: COL.subject, lw: 3.4, fillA: 0.10, glow: pulse(t, hit, 0.05, 0.5) };
      if (i === CAR.nb) return { color: COL.accent, lw: 3.2, fillA: 0.08 };
      return { plain: true, color: flash > 0.05 ? mixHex(GREY.link(), COL.ink, flash) : GREY.link(), alpha: (0.5 + 0.4 * wave(i) + 0.2 * flash) * (1 - 0.55 * zin), lw: 2 + flash + 1.2 * pulse(t, c.forty - 0.1 + (i % 20) * 0.022, 0.08, 0.5) };
    };
    const zoom = lerp(1 + 0.04 * prog(t, 0, c.so), 2.05, zin);
    withCam(ctx, { fx: mx, fy: my, zoom, dx: (540 - mx) * zin, dy: (760 - my) * zin }, () => {
      const place = carriage(ctx, t, Object.assign({ doors: tw(t, 0.05, 0.8, E.io3), bub }, PLACE));
      const you = carPerson(CAR.you, place), nb = carPerson(CAR.nb, place);
      /* traffic inside your link and your neighbour's (visible once the camera is close) */
      const close = clamp(zin * 1.4);
      linkTraffic(ctx, you, COL.subject, t, { alpha: close, rate: 1.4 });
      linkTraffic(ctx, nb, COL.accent, t, { alpha: close, rate: 1.7, phase: 0.3 });
      /* the stray packet: from the neighbour's phone, through the aisle, off your ear */
      const a = personPts(nb).phone, b = personPts(you).budR;
      const ctrl = [(a[0] + b[0]) / 2 + 70 * place.s, (a[1] + b[1]) / 2 + 10 * place.s];
      const u = tw(t, launch, hit, E.io2);
      if (t > launch && t < hit) {
        const q = [lerp(lerp(a[0], ctrl[0], u), lerp(ctrl[0], b[0], u), u), lerp(lerp(a[1], ctrl[1], u), lerp(ctrl[1], b[1], u), u)];
        packetToken(ctx, q[0], q[1], 0.42, COL.accent, { ang: -0.5 - u * 0.6 });
      }
      if (t >= hit) {
        const v = tw(t, hit, hit + 0.7, E.out3);
        packetToken(ctx, b[0] + 60 * v, b[1] - 70 * v + 40 * v * v, 0.42, COL.accent, { ang: 1.2 + v * 3, alpha: 1 - v });
        const sp = prog(t, hit, hit + 0.45);
        if (sp < 1) { ring(ctx, b[0], b[1], 6 + 22 * E.out3(sp), COL.alert, 2.5, 1 - sp); cross(ctx, b[0] + 2, b[1] - 18, 5, COL.alert, clamp(sp * 3), 2.5); }
      }
    });
    /* the counter sign and the question badge */
    const sA = tw(t, c.forty - 0.1, c.forty + 0.3, E.out3) * (1 - tw(t, c.so - 0.4, c.so, E.lin));
    if (sA > 0) {
      const second = tw(t, c.radio - 0.05, c.radio + 0.3, E.out3);
      const w1 = measure(ctx, '40 PEOPLE', 34, 700, F.disp, 3);
      const str = second > 0.5 ? '40 PEOPLE · 1 RADIO BAND' : '40 PEOPLE';
      signPlate(ctx, str, 540, 410, { size: 34, alpha: sA, bar: second > 0.5 ? COL.subject : null });
      if (second > 0 && second < 1) ring(ctx, 540 + w1 / 2, 410, 30 + 40 * second, COL.subject, 3, 1 - second);
    }
    const q = tw(t, hit + 0.28, hit + 0.62, E.out3);
    if (q > 0) {
      const bx = 668, by = 560, r = 46 * lerp(0.6, 1, q);
      withAlpha(ctx, q, () => {
        dot(ctx, bx, by, r, COL.ink);
        text(ctx, '?', bx, by + r * 0.42, { size: r * 1.3, weight: 800, family: F.disp, color: COL.panel, align: 'center' });
        line(ctx, bx - 30, by + 34, 600, 650, COL.ink, 4, 0.8);
      });
    }
  });
});
