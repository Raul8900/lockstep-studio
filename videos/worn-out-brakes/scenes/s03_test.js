'use strict';
/* TEST — "The test takes the help away. Maximum weight. Brakes worn to the last two percent. No
   reverse thrust. A seven thirty-seven hits three hundred and thirty-three kilometres an hour, then
   slams the brakes."
   The jet from above, the handicaps stamped on one by one; it rolls, a tracking shot as the speed
   counts up; then the brakes bite: a flash, the frame jolts, tyre smoke, the nose dips. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { takes: at('test', 'takes'), away: at('test', 'away'), maximum: at('test', 'maximum'), worn: at('test', 'worn'), two: at('test', 'two'),
    no: at('test', 'no'), a: at('test', 'a'), seven: at('test', 'seven'), hits: at('test', 'hits'), km: at('test', 'kilometres'), slams: at('test', 'slams') };
  const aw = airfieldWorld(), T0 = beatOf('test').t0 - 0.5, end = beatOf('heat').t0 - 0.5, J = JET;
  sfx(c.maximum, 'stamp', 0.6);
  sfx(c.worn, 'stamp', 0.6);
  sfx(c.no, 'stamp', 0.6);
  sfx(c.a - 0.2, 'riser', 0.55);
  sfx(c.seven - 0.25, 'whoosh', 0.5);
  sfx(c.slams - 0.1, 'impact', 0.9);
  sfx(c.slams, 'rip', 0.7);
  addScene('test', function (ctx, t) {
    shots(ctx, t, [
      { at: T0, draw: (ctx, t) => {                                  // from above, circling the jet as it lines up and rolls
        const x = jetState(t).x, k = E.ioSine(prog(t, T0, c.seven));
        const f = [lerp(60, -60, k), lerp(62, 40, k), lerp(85, 100, k)], to = [lerp(0, -4, k), lerp(4, 1, k), 0];
        view3d(ctx, aw, t, { from: [x + f[0], f[1], f[2]], to: [x + to[0], to[1], to[2]], fov: 38 });
        stamp(ctx, 'MAX WEIGHT 89,765 KG', CX, 420, { p: tw(t, c.maximum - 0.05, c.maximum + 0.5, E.lin), size: 54, angle: -0.06 });
        stamp(ctx, 'BRAKES 2% LEFT', CX, 580, { p: tw(t, c.worn - 0.05, c.worn + 0.5, E.lin), size: 60, angle: 0.05 });
        stamp(ctx, 'NO REVERSE THRUST', CX, 740, { p: tw(t, c.no - 0.05, c.no + 0.5, E.lin), size: 56, angle: -0.04 });
      } },
      { at: c.seven - 0.2, cut: 'flash', draw: (ctx, t) => {         // tracking alongside, low, as it reaches test speed
        view3d(ctx, aw, t, ride(t, [lerp(56, 48, prog(t, c.seven, c.slams)), 4, lerp(23, 20, prog(t, c.seven, c.slams))], [1, 2.2, 0], 36));
        const kmh = Math.round(jetState(t).v * 3.6);
        bigNumber(ctx, kmh, CX, 470, { p: tw(t, c.seven - 0.1, c.seven + 0.3, E.lin), count: false, suffix: ' km/h', size: 160, label: 'TAKEOFF SPEED', color: t > c.km ? 'accent' : 'ink', t, hit: c.km });
      } },
      { at: c.slams - 0.1, cut: 'flash', draw: (ctx, t) => {         // the brakes bite: low by the gear, the frame jolts
        ctx.save(); jolt(ctx, t, c.slams, 20, 0.8);
        view3d(ctx, aw, t, ride(t, [8.5, 0.95, 8.8], [-1.5, 0.85, J.GEAR_Z], 42));
        ctx.restore();
      } },
    ], { end });
  });
});
