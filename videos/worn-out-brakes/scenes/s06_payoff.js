'use strict';
/* PAYOFF — "So the brakes under your seat have survived worse than any landing, because to certify
   a new jet…"
   A crane up from the cooling gear to the warm cabin windows, then a hard cut on "certify" back to
   the grinder on the bench: the hook's opening, so the Short loops into itself. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { seat: at('payoff', 'seat'), survived: at('payoff', 'survived'), worse: at('payoff', 'worse'), landing: at('payoff', 'landing'), certify: at('payoff', 'certify') };
  const aw = airfieldWorld(), P0 = beatOf('payoff').t0 - 0.5, J = JET;
  sfx(P0, 'swell', 0.45);
  sfx(c.survived, 'thump', 0.4);
  sfx(c.certify - 0.02, 'rip', 0.5);
  addScene('payoff', function (ctx, t) {
    shots(ctx, t, [
      { at: P0, draw: (ctx, t) => {                                // from the gear up to the cabin windows
        const x = jc().xStop;
        view3d(ctx, aw, t, camPath(t, [[P0, { from: [x + 3.2, 0.9, 7.2], to: [x + J.GEAR_X, 0.7, J.GEAR_Z], fov: 40 }],
          [c.landing, { from: [x + 7, 4.6, 13], to: [x - 2.5, 3.3, 0], fov: 38 }],
          [c.certify, { from: [x + 8, 5.4, 14.5], to: [x - 3, 3.4, 0], fov: 38 }]]));
        stamp(ctx, 'WORSE THAN ANY LANDING', CX, 470, { p: tw(t, c.worse - 0.05, c.worse + 0.5, E.lin), color: 'accent', size: 58, angle: -0.05 });
      } },
      { at: c.certify - 0.03, draw: (ctx, t) => hookBench(ctx, t - DATA.dur) },   // the loop: the hook's bench, just before it starts
    ]);
  });
});
