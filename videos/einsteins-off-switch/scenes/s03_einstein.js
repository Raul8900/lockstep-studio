'use strict';
/* EINSTEIN — gravity and speed. The spacetime sheet with the Earth in its well; two clock dials,
   ground and orbit; the orbit clock runs ahead (+45 µs a day: a stack of 45 one-microsecond plates);
   speed streaks, and 7 plates fly away; 38 remain, gold: +38 µs, every single day. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = osCues(), t0 = c.einstein.t0 - 0.5, end = c.stakes.t0 - 0.5;
  const ein = at('einstein', 'einstein'), tick = at('einstein', 'tick'), four = at('einstein', 'four'), slows = at('einstein', 'slows');
  const world = sheetWorld();
  sfx(t0 + 0.1, 'whoosh', 0.45);
  sfx(ein, 'blip', 0.45);
  sfx(tick, 'tick', 0.8); sfx(tick + 0.5, 'tick', 0.6); sfx(tick + 1.0, 'tick', 0.5);
  sfx(c.gravity - 0.35, 'whoosh', 0.35);
  sfx(c.fortyfive - 1.0, 'riser', 0.45, { dur: 1.0 });
  sfx(c.fortyfive, 'count', 0.45, { dur: 1.0 });
  sfx(c.moving, 'zip', 0.45);
  sfx(c.seven + 0.3, 'rip', 0.5);
  sfx(c.thirtyeight - 0.9, 'riser', 0.5, { dur: 0.9 });
  sfx(c.thirtyeight, 'impact', 0.75);
  sfx(c.every, 'thump', 0.45);
  /* the two dials: the orbit clock pulls ahead (rates exaggerated) */
  const ground = (t) => TAU * (t / 2.4);
  const drift = (t) => 1.25 * tw(t, c.fast - 0.2, c.fortyfive + 1.6) - 0.2 * tw(t, c.seven - 0.1, c.seven + 0.8);
  function dials(ctx, t) {
    const a = tw(t, tick - 0.4, tick) * (1 - tw(t, c.net - 0.5, c.net));
    if (a <= 0) return;
    topShade(ctx, a, 760);
    const fast = tw(t, c.fast - 0.2, c.fast + 0.2);
    dial(ctx, 285, 470, 125, ground(t), { alpha: a, color: '#FFFFFF', label: 'GROUND' });
    dial(ctx, 795, 470, 125, ground(t) + drift(t), { alpha: a, color: fast > 0.5 ? 'good' : 'accent', label: 'ORBIT', ghost: fast > 0 ? ground(t) : null });
    text(ctx, 'rates exaggerated', CX, 730, { size: 28, weight: 600, family: F.ui, color: 'rgba(255,255,255,0.55)', align: 'center', alpha: a * fast });
  }
  addScene('einstein', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        view3d(ctx, world, t, camPath(t, [[t0, { from: [0.4, 11.5, 16.5], to: [0, -1.2, 0], fov: 40 }],
          [c.gravity - 0.4, { from: [3.6, 6.0, 12.5], to: [1.5, -0.6, 1.0], fov: 40 }]]));
        nameTag(ctx, 'Albert Einstein', 'relativity, 1905 and 1915', 70, 360, { p: prog(t, ein, ein + 0.7) * (1 - tw(t, tick - 0.6, tick - 0.3)) });
        dials(ctx, t);
      } },
      { at: c.gravity - 0.4, draw: (ctx, t) => {
        const k = tw(t, c.gravity - 0.4, c.moving - 0.4, E.io2);
        const v = view3d(ctx, world, t, sheetCam(t, lerp(4.2, 3.6, k), lerp(1.9, 1.35, k), lerp(-1.4, 0.6, k), 40, lerp(-0.4, 1.0, k)));
        dials(ctx, t);
        if (!v) return;
        const s = sheetSat(t), [sx, sy] = v.project(s), [ex, ey] = v.project([0, -1.4, 0]);
        pointer(ctx, ex, ey, 760, 1180, 'strong gravity', { p: prog(t, c.gravity - 0.1, c.gravity + 0.5) * (1 - tw(t, c.fast, c.fast + 0.3)), color: 'data', t, size: 38 });
        pointer(ctx, sx, sy, 140, 1020, 'weaker up here', { p: prog(t, c.gravity + 0.3, c.gravity + 0.9) * (1 - tw(t, c.fortyfive - 0.3, c.fortyfive)), color: 'good', t, size: 38 });
        bigNumber(ctx, 45, CX, 1220, { p: prog(t, c.fortyfive - 0.05, c.fortyfive + 1.0), prefix: '+', suffix: ' µs', label: 'a day, from weaker gravity', size: 170, color: 'good', labelColor: 'good' });
      } },
      { at: c.moving - 0.4, cut: 'flash', draw: (ctx, t) => {
        const k = tw(t, c.moving - 0.4, c.net - 0.4, E.io2);
        const v = view3d(ctx, world, t, sheetCam(t, lerp(3.2, 4.4, k), lerp(0.7, 1.4, k), lerp(-3.0, -1.2, k), 40, 0.9));
        dials(ctx, t);
        if (!v) return;
        const [sx, sy] = v.project(sheetSat(t));
        pointer(ctx, sx, sy, sx < CX ? sx + 260 : sx - 260, 1080, '3.9 km/s', { p: prog(t, four - 0.1, four + 0.5) * (1 - tw(t, slows, slows + 0.3)), color: 'accent', t });
        withAlpha(ctx, 1 - tw(t, c.net - 0.7, c.net - 0.4), () =>
          bigNumber(ctx, 7, CX, 1220, { p: prog(t, c.seven - 0.05, c.seven + 0.6), prefix: '−', suffix: ' µs', label: 'a day, from speed', size: 170, color: 'alert', labelColor: 'alert', t, hit: c.seven }));
      } },
      { at: c.net - 0.4, draw: (ctx, t) => {
        const k = tw(t, c.net - 0.4, end, E.io2), pt = plateTop(t, 20);
        const s = sheetSat(t), out = v3.norm([s[0], 0, s[2]]), tang = v3.norm(v3.cross([0, 1, 0], out));
        const dir = v3.add(v3.add(v3.mul(out, 1.0), v3.mul(tang, lerp(0.9, 0.5, k))), [0, lerp(0.25, 0.45, k), 0]);
        const [sx, sy] = shake(t, c.thirtyeight, 10, 0.5);
        view3d(ctx, world, t, camAt(pt, dir, lerp(4.2, 6.2, k), 40, 0.004 * sx * Math.sin(sy)));
        topShade(ctx, tw(t, c.thirtyeight - 0.3, c.thirtyeight), 700);
        bigNumber(ctx, 38, CX, 450, { p: prog(t, c.thirtyeight - 0.05, c.thirtyeight + 0.8), prefix: '+', suffix: ' µs', label: 'fast, every single day',
          size: 230, color: 'accent', labelColor: 'ink', t, hit: c.thirtyeight });
      } },
    ], { end });
  });
});
