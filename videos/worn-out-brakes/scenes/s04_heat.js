'use strict';
/* HEAT — "That's three hundred and eighty-five megajoules, poured mostly into four brakes. They pass
   thirteen hundred and seventy degrees. Plugs in the wheels melt on purpose, letting the air out
   before the tyres burst."
   Glowing motes of the jet's motion stream into the four wheels; inside, the stack goes cherry,
   orange, white; then the wheel: the fuse plug slumps, drips, and the air jets out. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { thats: at('heat', "that's"), mega: at('heat', 'megajoules'), poured: at('heat', 'poured'), four: at('heat', 'four'), they: at('heat', 'they'),
    thirteen: at('heat', 'thirteen'), degrees: at('heat', 'degrees'), plugs: at('heat', 'plugs'), melt: at('heat', 'melt'), air: at('heat', 'air'), burst: at('heat', 'burst') };
  const aw = airfieldWorld(), bw = brakeWorld(), H0 = beatOf('heat').t0 - 0.5, end = beatOf('rule').t0 - 0.5, X = BRK.WHEEL_X;
  sfx(H0, 'whoosh', 0.45);
  sfx(c.mega, 'impact', 0.5);
  sfx(c.poured, 'swell', 0.45);
  sfx(c.they - 0.15, 'whoosh', 0.45);
  sfx(c.thirteen, 'riser', 0.5);
  sfx(c.degrees, 'fire', 0.5);
  sfx(c.plugs - 0.2, 'whoosh', 0.4);
  sfx(c.melt, 'pop', 0.5);
  sfx(c.air, 'zip', 0.55);
  addScene('heat', function (ctx, t) {
    shots(ctx, t, [
      { at: H0, draw: (ctx, t) => {                                // side on, the motion's energy pouring into the wheels
        view3d(ctx, aw, t, ride(t, [lerp(12, 8, prog(t, H0, c.they)), 9, lerp(36, 32, prog(t, H0, c.they))], [-1, 0.2, 0.5], 36));
        bigNumber(ctx, 385, CX, 470, { p: tw(t, c.thats - 0.05, c.mega + 0.5, E.lin), suffix: ' MJ', size: 190, label: 'OF MOTION', color: 'accent', t, hit: c.mega });
      } },
      { at: c.they - 0.15, cut: 'flash', draw: (ctx, t) => {       // inside the brake, circling as it heats
        view3d(ctx, bw, t, orbit(t - c.they, { center: [0, -0.1, 0], radius: lerp(3.9, 3.3, prog(t, c.they, c.plugs)), height: 1.1, speed: 0.05, start: 0.2, fov: 36 }));
        bigNumber(ctx, 1370, CX, 470, { p: tw(t, c.thirteen - 0.1, c.degrees + 0.4, E.lin), suffix: ' °C', size: 180, color: 'alert', t, hit: c.degrees });
      } },
      { at: c.plugs - 0.2, cut: 'flash', draw: (ctx, t) => {       // the wheel: the fuse plug melts and the air goes
        const v = view3d(ctx, bw, t, camPath(t, [[c.plugs - 0.2, { from: [X + 0.75, 0.42, 1.55], to: [X - 0.16, 0.13, 0.25], fov: 30 }],
          [c.air - 0.2, { from: [X + 0.6, 0.36, 1.35], to: [X - 0.16, 0.13, 0.25], fov: 28 }],
          [end, { from: [X + 2.2, 0.5, 3.0], to: [X, -0.1, 0], fov: 34 }]]));
        const pl = pin(v, [X - 0.16, 0.13, 0.26]);
        if (pl && t < c.air + 0.4) pointer(ctx, pl[0], pl[1], 600, 470, 'FUSE PLUG', { p: tw(t, c.plugs - 0.05, c.plugs + 0.7, E.lin), t });
      } },
    ], { end });
  });
});
