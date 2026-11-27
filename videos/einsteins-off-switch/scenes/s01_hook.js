'use strict';
/* HOOK — "Every GPS satellite is launched with its clock set wrong. On purpose."
   Open tight on the satellite's glowing clock face, the Earth behind; pull back as the frequency
   readout rolls from 10.23 MHz to 10.22999999543 MHz on "wrong"; ON PURPOSE stamps on "purpose". */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = osCues(), end = c.phone.t0 - 0.5, clk = at('hook', 'clock'), gps = at('hook', 'gps');
  const world = spaceWorld();
  sfx(0.05, 'swell', 0.35);
  sfx(gps, 'whoosh', 0.3);
  sfx(clk, 'tick', 0.9);
  sfx(c.wrong, 'data', 0.55);
  sfx(c.purpose, 'stamp', 0.8);
  addScene('hook', function (ctx, t) {
    const k = tw(t, c.hook.t0 - 0.5, end, E.io3);
    const cam = heroCam(t, lerp(0.3, 1.25, k), lerp(0.02, 0.42, k), lerp(0.02, 0.3, k), lerp(26, 34, k));
    view3d(ctx, world, t, cam);
    topShade(ctx, tw(t, clk - 0.4, clk));
    readout(ctx, '10.23000000000', '10.22999999543', CX, 470, tw(t, c.wrong - 0.05, c.wrong + 0.75, E.lin),
      { t, alpha: tw(t, clk - 0.3, clk + 0.1), label: 'SATELLITE CLOCK', hot: 'alert', size: 66 });
    stamp(ctx, 'ON PURPOSE', CX, 1260, { p: prog(t, c.purpose - 0.05, c.purpose + 0.6), color: 'accent', size: 110 });
  });
});
