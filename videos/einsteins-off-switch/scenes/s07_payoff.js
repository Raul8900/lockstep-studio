'use strict';
/* PAYOFF — "Ever since, every GPS clock is tuned a hair slow before launch. Wrong on the ground, so
   it's right in the sky. And every time that blue dot finds you, Einstein passes the test again."
   The hero's readout set slow; pull out to the whole constellation; push back in as four pulses
   meet on the blue dot; PASSED. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = osCues(), t0 = c.payoff.t0 - 0.5, end = DATA.dur;
  const ground = at('payoff', 'ground'), blue = at('payoff', 'blue'), again = at('payoff', 'again');
  const world = spaceWorld();
  sfx(t0 + 0.1, 'whoosh', 0.4);
  sfx(c.tuned, 'data', 0.5);
  sfx(c.wrong2 - 0.4, 'whoosh', 0.5);
  for (let i = 0; i < 6; i++) sfx(c.wrong2 + 0.1 + i * 0.18, 'pop', 0.35, { pitch: 1 + 0.1 * i });
  sfx(c.sky, 'chime', 0.5);
  for (let k = 0; k < 3; k++) sfx(c.finds - 2.4 + 1.6 * (k + 1), 'tick', 0.6, { pitch: 1.3 });
  sfx(c.test, 'stamp', 0.7);
  sfx(c.test + 0.2, 'swell', 0.5);
  addScene('payoff', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        const k = tw(t, t0, c.wrong2 - 0.5, E.io2);
        view3d(ctx, world, t, heroCam(t, lerp(0.42, 0.75, k), lerp(-0.12, 0.2, k), lerp(0.05, 0.16, k), 30));
        topShade(ctx, 1, 700);
        readout(ctx, '10.23000000000', '10.22999999543', CX, 470, tw(t, c.tuned - 0.1, c.tuned + 0.8, E.lin),
          { t, label: 'TUNED BEFORE LAUNCH', hot: 'accent', size: 66 });
      } },
      { at: c.wrong2 - 0.5, cut: 'flash', draw: (ctx, t) => {
        const f = dotFrame(t), k = tw(t, c.wrong2 - 0.5, c.sky + 0.6, E.io3), k2 = tw(t, c.sky + 0.6, c.finds + 0.4, E.io3);
        const dir = v3.add(v3.add(f.n, v3.mul(f.u, lerp(0.9, -0.12, k2))), v3.mul(f.e, lerp(0.5, 0.05, k2)));
        const tgt = v3.lerp([0, 0, 0], v3.mul(f.n, 1.9), k2);
        const v = view3d(ctx, world, t, camAt(tgt, dir, lerp(lerp(6.5, 21, k), 13.5, k2), lerp(40, 44, k2)));
        topShade(ctx, 1, 640);
        nameTag(ctx, 'Every GPS satellite', '24+ satellites, six orbits', 70, 400, { p: prog(t, c.wrong2, c.wrong2 + 0.6) * (1 - tw(t, c.finds - 0.6, c.finds - 0.3)), color: 'data', size: 58 });
        if (!v) return;
        const [px, py] = v.project(f.d);
        pointer(ctx, px, py, px + 160, py - 300, 'YOU', { p: prog(t, blue, blue + 0.6), color: 'subject', t });
        stamp(ctx, 'PASSED', CX, 1250, { p: prog(t, c.test - 0.05, c.test + 0.5), color: 'good', size: 130 });
        text(ctx, "Einstein's Off Switch", CX, 470, { size: 60, weight: 900, family: F.disp, color: '#FFFFFF', align: 'center', alpha: tw(t, again + 0.4, again + 0.9) });
      } },
    ], { end });
  });
});
