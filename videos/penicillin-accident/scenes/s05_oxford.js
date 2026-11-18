'use strict';
/* Scene 5 — OXFORD: "Then, in Oxford, a team finally purified it. Their first real test was a
   dying policeman. Within days, he was getting better. Then the penicillin ran out."
   Howard Florey, then the racks of culture vessels the team filled to make it (1943). The racks
   become the supply: a ring counts it down while the patient improves, and hits zero on "out".  */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { oxford: at('oxford', 'oxford'), team: at('oxford', 'team'), purified: at('oxford', 'purified'), test: at('oxford', 'test'),
    dying: at('oxford', 'dying'), policeman: at('oxford', 'policeman'), days: at('oxford', 'days'), better: at('oxford', 'better'),
    ran: at('oxford', 'ran'), out: at('oxford', 'out') };
  const florey = useImage('florey');               // Howard Florey — public domain
  const racks = useImage('oxford-racks');          // culture vessels, England, 1943 — Imperial War Museum, public domain
  const left = (t) => 1 - 0.55 * tw(t, c.test, c.better, E.io2) - 0.45 * tw(t, c.ran - 0.3, c.out + 0.15, E.in2);   // the supply, 1 → 0

  sfx(c.oxford - 0.2, 'whoosh', 0.4);
  sfx(c.purified - 0.3, 'whoosh', 0.5);
  sfx(c.test, 'lock', 0.4);
  sfx(c.better, 'chime', 0.45);
  sfx(c.out, 'deny', 0.7);

  addScene('oxford', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        photoPath(ctx, florey, t, [[at('oxford', 'then') - 0.5, { z: 1.12, x: 0.5, y: 0.45 }], [c.team + 0.3, { z: 1.55, x: 0.53, y: 0.32 }]]);
        nameTag(ctx, 'Howard Florey', 'and his team, Oxford, 1940', 80, 1040, { p: tw(t, c.oxford, c.oxford + 0.5, E.lin) });
      } },
      { at: c.purified - 0.3, cut: 'flash', draw: (ctx, t) => {
        photoPath(ctx, racks, t, [[c.purified - 0.3, { z: 1.25, x: 0.5, y: 0.35 }], [c.test, { z: 1.45, x: 0.62, y: 0.3 }], [c.out + 0.8, { z: 1.9, x: 0.3, y: 0.55 }]]);
        spotlight(ctx, CX, 700, 380, { p: tw(t, c.test - 0.2, c.test + 0.4, E.lin), dark: 0.55 + 0.3 * tw(t, c.ran, c.out + 0.3, E.lin) });
        const k = left(t);
        ringGauge(ctx, CX, 700, 230, k, { p: tw(t, c.test - 0.1, c.test + 0.5, E.lin), color: k > 0.25 ? 'good' : 'alert', label: 'penicillin left', ticks: 40 });
        nameTag(ctx, 'Albert Alexander', 'police constable, Oxford, 1941', 80, 1080, { p: tw(t, c.policeman - 0.1, c.policeman + 0.5, E.lin) * (1 - tw(t, c.ran - 0.4, c.ran)) });
      } },
    ], { end: DATA.dur });
  });
});
