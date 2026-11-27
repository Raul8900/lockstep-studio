'use strict';
/* STAKES — "That sounds like nothing. But at the speed of light, it's more than eleven kilometres.
   Ignore it, and your blue dot drifts that far off in a single day."
   A night city: 38 µs shown as a sliver of a second; a pulse of light races 11 km down an avenue;
   then the blue dot drifts the same distance from where you really are, as a day ticks by. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = osCues(), t0 = c.stakes.t0 - 0.5, end = c.doubt.t0 - 0.5;
  const world = cityWorld();
  sfx(t0 + 0.1, 'whoosh', 0.35);
  sfx(c.nothing, 'pop', 0.4);
  sfx(c.speed - 0.2, 'zip', 0.5);
  sfx(c.eleven, 'count', 0.5, { dur: 0.8 });
  sfx(c.eleven + 0.5, 'thump', 0.5);
  sfx(c.drifts - 0.2, 'slide', 0.45);
  sfx(c.sday + 0.4, 'deny', 0.5);
  addScene('stakes', function (ctx, t) {
    const k1 = tw(t, c.speed - 0.4, c.eleven + 0.3, E.io3), k2 = tw(t, c.ignore - 0.3, c.drifts + 0.2, E.io2);
    const from = v3.lerp(v3.lerp([0.3, 2.4, 9.6], [0.3, 15.5, 11.0], k1), [3.6, 13.5, 9.5], k2);
    const to = v3.lerp(v3.lerp([0.3, 0.2, 5.3], [0.3, 0, -0.6], k1), [0.3, 0, -0.9], k2);
    const v = view3d(ctx, world, t, { from, to, fov: lerp(lerp(42, 50, k1), 50, k2) });
    if (!v) return;
    topShade(ctx, 1, 760);
    withAlpha(ctx, 1 - tw(t, c.speed - 0.3, c.speed), () => {
      text(ctx, '0.000038 s', CX, 470, { size: 120, weight: 900, family: F.mono, color: '#FFFFFF', align: 'center', alpha: tw(t, t0 + 0.2, t0 + 0.6) });
      text(ctx, 'a day of drift', CX, 560, { size: 44, weight: 800, family: F.disp, color: 'rgba(255,255,255,0.8)', align: 'center', alpha: tw(t, t0 + 0.4, t0 + 0.8) });
    });
    withAlpha(ctx, 1 - tw(t, c.ignore - 0.3, c.ignore), () =>
      bigNumber(ctx, 11, CX, 450, { p: prog(t, c.eleven - 0.05, c.eleven + 0.9), suffix: ' km', label: 'light covers in 38 µs', size: 230, color: 'accent', t, hit: c.eleven + 0.5 }));
    const dk = tw(t, c.drifts - 0.2, c.sday + 0.4, E.io2);
    withAlpha(ctx, tw(t, c.ignore - 0.1, c.ignore + 0.3), () => {
      ringGauge(ctx, 260, 460, 120, dk, { p: prog(t, c.ignore - 0.1, c.ignore + 0.6), color: 'subject', label: 'one day', show: (k) => `${Math.round(24 * k)} h`, size: 64 });
      bigNumber(ctx, 11.6 * dk, 760, 430, { p: 1, count: false, decimals: 1, suffix: ' km', label: 'off', size: 140, color: dk >= 0.99 ? 'alert' : 'ink' });
    });
    const [hx, hy] = v.project(cityStart), dp = v3.lerp(cityStart, cityEnd, dk), [dx, dy] = v.project(dp);
    pointer(ctx, hx, hy, hx + 230, hy + 140, 'where you are', { p: prog(t, c.ignore, c.ignore + 0.6), color: 'good', t, size: 38 });
    pointer(ctx, dx, dy, dx - 260, dy - 120, 'where GPS puts you', { p: prog(t, c.drifts + 0.3, c.drifts + 0.9), color: 'alert', t, size: 38 });
  });
});
