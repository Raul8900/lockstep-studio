'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  // WHERE THE MYTH BREAKS: the factories recede; paracetamol and opioids take other
  // routes, to the brain and the spinal cord; a question mark marks what is still argued.
  const c = {
    not: at('breaks', 'not'),
    para: at('breaks', 'paracetamol'),
    acet: at('breaks', 'acetaminophen'),
    brain: at('breaks', 'brain'),
    spinal: at('breaks', 'spinal'),
    scientists: at('breaks', 'scientists'),
    opioids: at('breaks', 'opioids'),
    morphine: at('breaks', 'morphine'),
    nervous: at('breaks', 'nervous'),
  };
  const pillH = glyph('pill', 'subject');
  const brainH = glyph('brain', 'data');
  const P_PARA = [170, 1040];
  const P_OPI = [840, 1040];
  const ROUTE_PARA = anatCurve(P_PARA, [260, 760], [520, 470], 60);
  const ROUTE_OPI = anatCurve(P_OPI, [780, 760], [560, 470], 60);

  sfx(c.not, 'deny', 0.5);
  sfx(c.para, 'pop', 0.5);
  sfx(c.opioids, 'pop', 0.5);
  sfx(c.brain, 'chime', 0.5);
  sfx(c.scientists, 'blip', 0.4);
  sfx(c.nervous, 'swell', 0.5, { dur: 1.0 });

  addScene('breaks', anatScene('breaks', function (ctx, t) {
    const fa = lerp(1, 0.25, prog(t, c.not, c.not + 0.5));

    anatBody(ctx, 1, 0.9);
    ANAT_FACTORIES_ANKLE.forEach(function (f) { anatFactory(ctx, f[0], f[1], 46, COL.accent, fa); });
    ANAT_FACTORIES_ORGANS.forEach(function (f) { anatFactory(ctx, f.x, f.y, 34, COL.accent, fa); });
    ANAT_FACTORIES_ANKLE.forEach(function (f) { anatBlock(ctx, f[0], f[1], 46, 1, fa); });
    ANAT_FACTORIES_ORGANS.forEach(function (f) { anatBlock(ctx, f.x, f.y, 34, 1, fa); });

    drawGlyph(ctx, brainH, 540, 440, 150, { p: prog(t, c.brain, c.brain + 0.5) });
    polyline(ctx, [[540, 520], [540, 1000]], COL.subject, 4,
             prog(t, c.spinal, c.spinal + 0.5), 0.9, [10, 8]);

    const pp = prog(t, c.para, c.para + 0.4);
    if (pp > 0) {
      drawGlyph(ctx, pillH, P_PARA[0], P_PARA[1], 110, { p: pp });
      text(ctx, 'PARACETAMOL', P_PARA[0], 1100, {
        size: 24, weight: 700, family: F.mono, color: COL.subject, align: 'center', alpha: pp
      });
      polyline(ctx, ROUTE_PARA, COL.subject, 3, prog(t, c.acet, c.acet + 0.6), 0.85, [10, 9]);
    }

    const op = prog(t, c.opioids, c.opioids + 0.4);
    if (op > 0) {
      drawGlyph(ctx, pillH, P_OPI[0], P_OPI[1], 110, { p: op });
      text(ctx, 'OPIOIDS', P_OPI[0], 1100, {
        size: 24, weight: 700, family: F.mono, color: COL.subject, align: 'center', alpha: op
      });
      polyline(ctx, ROUTE_OPI, COL.subject, 3, prog(t, c.opioids + 0.3, c.morphine + 0.4), 0.85, [10, 9]);
    }

    const q = prog(t, c.scientists, c.scientists + 0.5);
    if (q > 0) {
      text(ctx, '?', 780, 640, {
        size: 150, weight: 800, family: F.disp, color: COL.subject, align: 'center', alpha: q
      });
    }

    const ng = prog(t, c.nervous, c.nervous + 0.5);
    if (ng > 0) {
      glow(ctx, 540, 440, 130, COL.subject, 0.35 * ng);
    }

    tag(ctx, 'WHERE THE MYTH BREAKS', 90, 400, { align: 'left', color: COL.alert, size: 26 });
  }), { type: 'slideLeft' });
});
