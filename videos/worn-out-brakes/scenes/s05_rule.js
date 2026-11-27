'use strict';
/* RULE — "Then nobody touches it for five minutes: the time fire crews take to arrive. All four
   brakes held."
   The jet stopped far down the runway, steam off the gear, three fire trucks with their bars
   flashing; a five-minute ring counts down; then close on the gear: ALL FOUR HELD. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { nobody: at('rule', 'nobody'), five: at('rule', 'five'), fire: at('rule', 'fire'), all: at('rule', 'all'), held: at('rule', 'held') };
  const aw = airfieldWorld(), R0 = beatOf('rule').t0 - 0.5, end = beatOf('payoff').t0 - 0.5, J = JET;
  const xs = () => jc().xStop;
  sfx(R0, 'whoosh', 0.4);
  sfx(c.five, 'tick', 0.5);
  sfx(c.all, 'stamp', 0.7);
  sfx(c.held, 'chime', 0.45);
  addScene('rule', function (ctx, t) {
    shots(ctx, t, [
      { at: R0, draw: (ctx, t) => {                                // the stopped jet, the trucks waiting
        const x = xs();
        view3d(ctx, aw, t, camPath(t, [[R0, { from: [x + 50, 26, -82], to: [x + 7, -3, 14], fov: 46 }], [c.all, { from: [x + 40, 20, -66], to: [x + 6, -1.5, 13], fov: 46 }]]));
        const left = 1 - 0.9999 * prog(t, c.five + 0.5, c.all - 0.25);
        ringGauge(ctx, CX, 470, 120, left, { p: tw(t, c.five - 0.1, c.five + 0.5, E.lin), color: 'alert', ticks: 60, label: 'HANDS OFF',
          show: (k) => { const s = Math.round(k * 300); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; } });
      } },
      { at: c.all - 0.2, cut: 'flash', draw: (ctx, t) => {         // close on the glowing gear in the steam
        const x = xs();
        view3d(ctx, aw, t, camPath(t, [[c.all - 0.2, { from: [x + 5.5, 1.1, 8.0], to: [x + J.GEAR_X, 0.7, J.GEAR_Z], fov: 40 }], [end, { from: [x + 4.6, 1.0, 7.0], to: [x + J.GEAR_X, 0.75, J.GEAR_Z], fov: 38 }]]));
        stamp(ctx, 'ALL FOUR HELD', CX, 520, { p: tw(t, c.all - 0.05, c.all + 0.5, E.lin), color: 'good', size: 96, angle: -0.08 });
      } },
    ], { end });
  });
});
