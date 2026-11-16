'use strict';
/* Scene 6 — THE BROWSER
   "Then there's the browser. A twenty twenty-four study reports that cookies and browsing history carry
   substantial weight in whether a visitor seems human. Browsing history is what researchers report.
   Google hasn't confirmed it."

   A: the browser window arrives. B: its history rows and cookie light up; the weight meter fills; a person.
   C: the history is research, not confirmed: a coral stamp says so.                                         */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    then: at('browser', 'then'),
    browser: at('browser', 'browser'),
    study: at('browser', 'study'),
    cookies: at('browser', 'cookies'),
    browsing: at('browser', 'browsing'),
    history: at('browser', 'history'),
    carry: at('browser', 'carry'),
    substantial: at('browser', 'substantial'),
    weight: at('browser', 'weight'),
    seems: at('browser', 'seems'),
    human: at('browser', 'human'),
    researchers: at('browser', 'researchers'),
    google: at('browser', 'google'),
    hasnt: at('browser', "hasn't"),
    confirmed: at('browser', 'confirmed'),
  };
  const WIN = { x: 130, y: 560, w: 520, h: 440 };

  sfx(c.then, 'whoosh', 0.45);
  sfx(c.browser, 'blip', 0.5);
  sfx(c.cookies, 'pop', 0.5);
  sfx(c.history, 'data', 0.4, { dur: 0.6 });
  sfx(c.weight, 'swell', 0.45, { dur: 0.9 });
  sfx(c.human, 'pop', 0.4);
  sfx(c.researchers, 'blip', 0.45);
  sfx(c.confirmed, 'stamp', 0.7);

  addScene('browser', function (ctx, t) {
    ambient(ctx, t);
    /* the window slides in from above */
    const slide = (1 - tw(t, c.then, c.then + 0.6, E.out3)) * 120;
    const wy = WIN.y - slide;
    const rowsDim = 1 - 0.65 * prog(t, c.researchers - 0.5, c.researchers + 0.2);
    browserWin(ctx, WIN.x, wy, WIN.w, WIN.h, 1, { hist: prog(t, c.browsing - 0.1, c.browsing + 0.6), rowAlpha: rowsDim });
    riseText(ctx, 'THE BROWSER', 540, 470, prog(t, c.browser, c.browser + 0.3), { size: 60, weight: 900, family: F.disp, color: COL.violet, align: 'center' });

    /* cookies, and the weight they carry */
    cookieIcon(ctx, 810, 650, 72, tw(t, c.cookies - 0.1, c.cookies + 0.4, E.outBack));
    dataTag(ctx, 'COOKIES', 810, 770, prog(t, c.cookies, c.cookies + 0.3));
    const meterFill = 180 * prog(t, c.carry, c.weight);
    fillRR(ctx, 772, 820, 76, 180, 14, rgba(COL.lineHi, 0.5));
    fillRR(ctx, 772, 820 + 180 - meterFill, 76, meterFill, 14, rgba(COL.violet, 0.9));
    riseText(ctx, 'SUBSTANTIAL WEIGHT', 540, 1062, prog(t, c.substantial, c.substantial + 0.3) * (1 - prog(t, c.researchers - 0.4, c.researchers)), { size: 30, weight: 800, family: F.mono, color: COL.violet, align: 'center', ls: 2 });

    /* whether a visitor seems human */
    personIcon(ctx, 540, 1140, 96, prog(t, c.seems, c.seems + 0.4), COL.white);

    /* the caveat: a study reports it */
    caveat(ctx, 'REPORTED BY RESEARCHERS', 540, 1206, prog(t, c.study, c.study + 0.3), COL.coral);

    /* C: research, not confirmed by Google */
    riseText(ctx, 'RESEARCHERS REPORT', 540, 1062, prog(t, c.researchers, c.researchers + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.violet, align: 'center', ls: 2 });
    const st = prog(t, c.confirmed - 0.2, c.confirmed + 0.2);
    if (st > 0) {
      ctx.save();
      ctx.translate(540, 1132); ctx.rotate(-0.06);
      withAlpha(ctx, st, () => {
        strokeRR(ctx, -262, -38, 524, 76, 12, rgba(COL.coral, 0.95), 5);
        text(ctx, 'GOOGLE: NOT CONFIRMED', 0, 2, { size: 34, weight: 900, family: F.mono, color: COL.coral, align: 'center', base: 'middle', ls: 2 });
      });
      ctx.restore();
    }
  }, { type: 'panUp', d: 620 });
});
