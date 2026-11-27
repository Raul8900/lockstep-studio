'use strict';
/* NORMAL — "Normally, three things stop you. Panels on the wings pop up and dump the lift, pressing
   the plane onto its wheels. The engines roar into reverse. But the real work is done by carbon
   brakes, turning your speed into heat."
   An ordinary landing roll: the spoilers rise (lift arrows shrink, weight arrows grow), the
   reverser sleeves slide back and blow air forward, then down to the gear and into the brake. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { three: at('normal', 'three'), panels: at('normal', 'panels'), pop: at('normal', 'pop'), dump: at('normal', 'dump'),
    pressing: at('normal', 'pressing'), wheels: at('normal', 'wheels'), engines: at('normal', 'engines'), reverse: at('normal', 'reverse'),
    but: at('normal', 'but'), carbon: at('normal', 'carbon'), turning: at('normal', 'turning'), heat: at('normal', 'heat') };
  const aw = airfieldWorld(), bw = brakeWorld(), end = beatOf('test').t0 - 0.5, J = JET;
  sfx(beatOf('normal').t0 - 0.5, 'whoosh', 0.45);
  sfx(c.pop, 'pop', 0.55);
  sfx(c.engines - 0.25, 'whoosh', 0.5);
  sfx(c.reverse, 'riser', 0.4);
  sfx(c.but - 0.15, 'whoosh', 0.45);
  sfx(c.carbon, 'stamp', 0.45);
  sfx(c.turning - 0.15, 'swell', 0.4);
  addScene('normal', function (ctx, t) {
    shots(ctx, t, [
      { at: beatOf('normal').t0 - 0.5, draw: (ctx, t) => {        // the landing roll from high and to the side
        { const k = E.ioSine(prog(t, beatOf('normal').t0 - 0.5, c.panels));          // a chase from behind and above, closing in
          view3d(ctx, aw, t, ride(t, [lerp(-77, -58, k), lerp(44, 33, k), lerp(43, 33, k)], [-3.7, -0.6, 0.5], 36)); }
        bigNumber(ctx, 3, CX, 520, { p: tw(t, c.three - 0.05, c.three + 0.6, E.lin) * (1 - tw(t, c.panels - 0.5, c.panels - 0.3)), count: false, size: 220, label: 'THINGS STOP YOU', t, hit: c.three });
      } },
      { at: c.panels - 0.3, cut: 'flash', draw: (ctx, t) => {     // over the right wing from behind: the spoilers rise
        const v = view3d(ctx, aw, t, ride(t, [-17, 10.5, 15], [-1.5, 2.2, 7.5], 42));
        const sp = pin(v, [jetState(t).x - 3.4, 2.75, 8]);
        if (sp) pointer(ctx, sp[0], sp[1], 640, 470, 'SPOILERS', { p: tw(t, c.pop - 0.1, c.pop + 0.8, E.lin), t });
      } },
      { at: c.engines - 0.25, cut: 'flash', draw: (ctx, t) => {    // beside the right engine: the sleeve slides back
        const v = view3d(ctx, aw, t, ride(t, [-7.5, 2.6, 12.5], [4.4, 1.5, 4.9], 36));
        const rv = pin(v, [jetState(t).x + J.ENG_X - 2.9, J.ENG_Y + 0.95, J.ENG_Z + 0.4]);
        if (rv) pointer(ctx, rv[0], rv[1], 560, 440, 'REVERSE THRUST', { p: tw(t, c.reverse - 0.1, c.reverse + 0.7, E.lin), t });
      } },
      { at: c.but - 0.15, cut: 'flash', draw: (ctx, t) => {        // low by the main gear, looking in at the hub
        const v = view3d(ctx, aw, t, ride(t, [4.2, 0.75, 7.2], [-1, 0.6, 3.1], 40));
        const hb = pin(v, [jetState(t).x + J.GEAR_X, J.WHEEL_R, J.GEAR_Z + J.WHEEL_DZ + 0.2]);
        if (hb) pointer(ctx, hb[0], hb[1], 610, 480, 'CARBON BRAKES', { p: tw(t, c.carbon - 0.1, c.carbon + 0.7, E.lin), t });
      } },
      { at: c.turning - 0.15, cut: 'flash', draw: (ctx, t) => {    // into the brake: the stack warms
        view3d(ctx, bw, t, orbit(t - c.turning, { center: [0, -0.1, 0], radius: 3.6, height: 1.1, speed: 0.035, start: 0.55, fov: 36 }));
      } },
    ], { end });
  });
});
