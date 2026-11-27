'use strict';
/* PHONE — "Your phone finds you by timing radio signals from satellites twenty thousand kilometres
   up. Light covers thirty centimetres in a billionth of a second. So a clock that's a billionth off
   puts you thirty centimetres off."
   The blue dot on Lucknow; pull out to four satellites whose pulses meet on it; a ruler where light
   crosses 30 cm as a counter reaches 1 ns; back on the dot, a red ghost 30 cm away. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = osCues(), t0 = c.phone.t0 - 0.5, end = c.einstein.t0 - 0.5;
  const you = at('phone', 'your'), twenty = at('phone', 'twenty'), billion = at('phone', 'billionth'), so = at('phone', 'so');
  const off2 = at('phone', 'off', 2), cm = at('phone', 'centimetres');
  const world = spaceWorld();
  sfx(you + 0.15, 'blip', 0.6);
  sfx(c.timing - 0.5, 'whoosh', 0.45);
  for (let k = 0; k < 3; k++) sfx(c.timing - 1.2 + 1.6 * (k + 1), 'tick', 0.7, { pitch: 1.3 });
  sfx(twenty, 'count', 0.35, { dur: 0.7 });
  sfx(c.light - 0.25, 'slide', 0.4);
  sfx(c.light + 0.4, 'zip', 0.35);
  sfx(billion, 'blip', 0.5);
  sfx(so - 0.2, 'whoosh', 0.35);
  sfx(c.puts + 0.05, 'thump', 0.55);
  addScene('phone', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        const f = dotFrame(t), k = tw(t, c.timing - 0.6, twenty + 0.2, E.io3);
        const dir = v3.add(v3.add(f.n, v3.mul(f.u, lerp(-0.55, -0.12, k))), v3.mul(f.e, lerp(0.12, 0.05, k)));
        const tgt = v3.lerp(f.d, v3.mul(f.n, 1.9), k);
        const v = view3d(ctx, world, t, camAt(tgt, dir, lerp(0.42, 13.5, k), lerp(34, 44, k)));
        if (!v) return;
        const [px, py] = v.project(f.d);
        pointer(ctx, px, py, px + 170, py - 260, 'YOU', { p: prog(t, you, you + 0.6) * (1 - tw(t, c.timing - 0.6, c.timing - 0.3)), color: 'subject', t });
        topShade(ctx, tw(t, twenty - 0.3, twenty));
        withAlpha(ctx, 1 - tw(t, c.light - 0.5, c.light - 0.25), () =>
          bigNumber(ctx, 20000, CX, 430, { p: prog(t, twenty - 0.05, twenty + 0.9), suffix: ' km', label: 'up', size: 170, color: 'accent' }));
      } },
      { at: c.light - 0.25, cut: 'flash', draw: (ctx, t) => {
        /* light crossing a 30 cm ruler while a counter runs to one billionth of a second */
        const f = dotFrame(t);
        view3d(ctx, world, t, camAt(v3.mul(f.n, 1.9), v3.add(f.n, v3.mul(f.u, -0.12)), 13.5 + 0.2 * (t - c.light), 44), { alpha: 0.3 });
        const x0 = 150, x1 = 930, y = 980, run = tw(t, c.light + 0.35, billion + 0.45, E.lin);
        const a = tw(t, c.light - 0.2, c.light + 0.15);
        withAlpha(ctx, a, () => {
          fillRR(ctx, x0 - 30, y - 70, x1 - x0 + 60, 140, 20, 'rgba(0,0,0,0.72)');
          for (let i = 0; i <= 30; i++) {
            const x = lerp(x0, x1, i / 30), big = i % 10 === 0, mid = i % 5 === 0;
            line(ctx, x, y - 52, x, y - 52 + (big ? 46 : mid ? 32 : 20), 'rgba(255,255,255,0.8)', big ? 4 : 2);
            if (big) text(ctx, String(i), x, y + 44, { size: 34, weight: 700, family: F.mono, color: 'rgba(255,255,255,0.8)', align: 'center' });
          }
          text(ctx, 'cm', x1 + 6, y + 44, { size: 28, weight: 700, family: F.mono, color: 'rgba(255,255,255,0.6)' });
          const px = lerp(x0, x1, run);
          if (run > 0) {
            ctx.save(); ctx.shadowColor = COL.accent; ctx.shadowBlur = 40;
            line(ctx, x0, y - 6, px, y - 6, COL.accent, 10);
            dot(ctx, px, y - 6, 18, '#FFFFFF'); ctx.restore();
          }
          bigNumber(ctx, run, CX, 560, { p: 1, count: false, decimals: 2, suffix: ' ns', size: 190, color: run >= 1 ? 'accent' : 'ink',
            label: run >= 1 ? 'one billionth of a second' : 'light travelling', t, hit: billion + 0.45 });
          text(ctx, '30 cm', CX, y + 150, { size: 64, weight: 900, family: F.disp, color: COL.accent, align: 'center', alpha: tw(t, cm, cm + 0.3) });
        });
      } },
      { at: so - 0.2, cut: 'flash', draw: (ctx, t) => {
        const f = dotFrame(t), k = tw(t, so - 0.2, end, E.io2);
        const v = view3d(ctx, world, t, camAt(f.d, v3.add(f.n, v3.mul(f.u, -0.35)), lerp(0.32, 0.26, k), 32));
        if (!v) return;
        const g = v3.add(f.d, v3.mul(f.e, 0.045)), [gx, gy] = v.project(g), [dx, dy] = v.project(f.d);
        const pk = prog(t, c.puts + 0.15, c.puts + 0.8);
        pointer(ctx, dx, dy, dx - 120, dy + 300, 'YOU', { p: prog(t, so, so + 0.6), color: 'subject', t });
        pointer(ctx, gx, gy, gx + 90, gy - 300, '30 cm OFF', { p: pk, color: 'alert', t });
        text(ctx, 'not to scale', W - 80, 1440, { size: 30, weight: 600, family: F.ui, color: 'rgba(255,255,255,0.55)', align: 'right', alpha: pk });
        withAlpha(ctx, tw(t, c.clock - 0.2, c.clock + 0.2) * (1 - tw(t, off2 + 0.6, end)), () => {
          topShade(ctx, 1);
          bigNumber(ctx, 1, CX, 450, { p: prog(t, c.clock - 0.1, c.clock + 0.6), count: false, prefix: '+', suffix: ' ns', label: 'clock error', size: 160, color: 'alert' });
        });
      } },
    ], { end });
  });
});
