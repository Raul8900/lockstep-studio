'use strict';
/* Scene 4 — WHAT IT WATCHES
   "So what does it watch? Google doesn't publish the full list. A twenty twenty-one survey describes the
   checkbox recording cursor movement, where you click, and how long the pointer hovers. It also records
   browser details and cookies. Google's own FAQ calls a cookie essential to that analysis."

   A: a list whose rows are locked, because Google does not publish the full list.
   B: the signals the 2021 survey describes, around the box (violet data labels, a coral caveat).
   C: browser details and cookies; the cookie is essential to the analysis.                              */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    what: at('watch', 'what'),
    publish: at('watch', 'publish'),
    full: at('watch', 'full'),
    twentyone: at('watch', '2021'),
    describes: at('watch', 'describes'),
    cursor: at('watch', 'cursor'),
    where: at('watch', 'where'),
    click: at('watch', 'click'),
    hovers: at('watch', 'hovers'),
    browser: at('watch', 'browser'),
    cookies: at('watch', 'cookies'),
    google: at('watch', "google's"),
    cookie: at('watch', 'cookie'),
    essential: at('watch', 'essential'),
    end: at('watch', 'analysis', 1, 't1'),
  };

  sfx(c.what, 'whoosh', 0.35);
  sfx(c.publish, 'lock', 0.6);
  sfx(c.twentyone, 'blip', 0.5);
  sfx(c.cursor, 'pop', 0.5);
  sfx(c.hovers, 'pop', 0.5);
  sfx(c.browser, 'pop', 0.5);
  sfx(c.cookies, 'pop', 0.5);
  sfx(c.essential, 'chime', 0.6);

  addScene('watch', function (ctx, t) {
    ambient(ctx, t);
    /* A: the list, locked */
    const gA = tw(t, c.what - 0.2, c.what + 0.3) * (1 - tw(t, c.twentyone - 0.6, c.twentyone - 0.1));
    withAlpha(ctx, gA, () => {
      riseText(ctx, 'WHAT IT WATCHES', 540, 470, prog(t, c.what, c.what + 0.3), { size: 62, weight: 900, family: F.disp, color: COL.white, align: 'center' });
      panel(ctx, 150, 540, 780, 470, { r: 24 });
      const lockP = tw(t, c.publish - 0.05, c.publish + 0.35);
      for (let i = 0; i < 5; i++) {
        const y = 610 + i * 88;
        const a = tw(t, c.what + 0.1 + i * 0.12, c.what + 0.4 + i * 0.12);
        withAlpha(ctx, a, () => {
          fillRR(ctx, 200, y - 22, 44, 44, 12, rgba(COL.lineHi, 0.5));
          fillRR(ctx, 270, y - 14, 420 + 180 * hash(i), 28, 14, mixHex(COL.dim, COL.coral, 0.8 * lockP, 0.5));
          withAlpha(ctx, lockP, () => {
            fillRR(ctx, 848, y - 2, 32, 26, 6, rgba(COL.coral, 0.9));
            ctx.beginPath(); ctx.arc(864, y - 2, 11, Math.PI, 0);
            ctx.strokeStyle = rgba(COL.coral, 0.9); ctx.lineWidth = 4; ctx.stroke();
          });
        });
      }
      caveat(ctx, 'NOT PUBLISHED BY GOOGLE', 540, 1100, prog(t, c.full, c.full + 0.3), COL.coral);
    });

    /* B: the survey's signals around the box */
    const gB = tw(t, c.twentyone - 0.5, c.twentyone - 0.1) * (1 - tw(t, c.browser - 0.5, c.browser - 0.1));
    withAlpha(ctx, gB, () => {
      drawBox(ctx, 540, 720, 200, { hot: 0.4 });
      riseText(ctx, '2021 SURVEY', 540, 470, prog(t, c.twentyone, c.twentyone + 0.3), { size: 40, weight: 900, family: F.mono, color: COL.amber, align: 'center', ls: 3 });
      const pC = prog(t, c.cursor, c.cursor + 0.3), pW = prog(t, c.where, c.where + 0.3), pH = prog(t, c.hovers - 0.3, c.hovers + 0.2);
      line(ctx, 420, 760, 320, 880, rgba(COL.violet, 0.8 * pC), 3);
      line(ctx, 660, 760, 760, 880, rgba(COL.violet, 0.8 * pW), 3);
      line(ctx, 540, 820, 540, 990, rgba(COL.violet, 0.8 * pH), 3);
      dataTag(ctx, 'CURSOR MOVEMENT', 250, 900, pC);
      dataTag(ctx, 'CLICK LOCATION', 830, 900, pW);
      dataTag(ctx, 'HOVER TIME', 540, 1010, pH);
      caveat(ctx, "SURVEY'S DESCRIPTION, NOT GOOGLE", 540, 1130, prog(t, c.describes, c.describes + 0.3), COL.coral);
    });

    /* C: browser details and cookies; the cookie is essential */
    const gC = tw(t, c.browser - 0.2, c.browser + 0.2);
    withAlpha(ctx, gC, () => {
      browserWin(ctx, 130, 560, 330, 230, 1, { hist: prog(t, c.browser, c.browser + 0.6) });
      dataTag(ctx, 'BROWSER DETAILS', 295, 860, prog(t, c.browser, c.browser + 0.3));
      cookieIcon(ctx, 720, 680, 105, tw(t, c.cookies - 0.1, c.cookies + 0.4, E.outBack));
      dataTag(ctx, 'COOKIES', 720, 860, prog(t, c.cookies, c.cookies + 0.3));
      tag(ctx, '_GRECAPTCHA', 720, 948, { align: 'center', color: COL.violet, size: 30, weight: 800, alpha: prog(t, c.cookie, c.cookie + 0.3) });
      pill(ctx, 'ESSENTIAL', 720, 1032, { bg: rgba(COL.mint, 0.22), color: COL.white, size: 30, stroke: rgba(COL.mint, 0.9), alpha: prog(t, c.essential, c.essential + 0.3) });
      caveat(ctx, "GOOGLE'S OWN FAQ", 540, 1150, prog(t, c.google, c.google + 0.3), COL.dim);
    });
  }, { type: 'panDown', d: 620 });
});
