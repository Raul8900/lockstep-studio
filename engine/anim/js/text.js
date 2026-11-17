'use strict';
/* =====================================================================
   text.js — type that lays itself out and moves.

     textBlock(ctx, 'Painkillers do not *find* the pain. They [block](alert) a signal.', x, y, w, o)
         wrapped to w, aligned, optionally fitted to a box, with inline emphasis,
         built in word by word (fade, rise, pop, slam) or letter by letter (type)
     sayText(ctx, t, 'hook', x, y, w, { from: 'every', to: 'after' })
         the narration's own words, each appearing the moment it is spoken
     hideCaptions(t0, t1)
         the burned-in captions step aside while the scene's type says the words

   Markup: *a phrase* is emphasis, drawn in the accent and marked the way the look marks its
   captions (style.json captions.highlight: color, box or underline; or o.mark, which also
   takes 'highlight'); [a phrase](role) colours a phrase with a role. Nothing else is markup.

   Like the rest of the engine these are pure functions of their arguments: a block is laid
   out again every frame (it is cheap), so words never reflow while it builds.
   ===================================================================== */

/* words with their markup: [{ w, em, role, glue }] — glue: no space before (punctuation after markup) */
function parseMarkup(str) {
  const out = [], re = /\*([^*]+)\*|\[([^\]]+)\]\(([\w#]+)\)|([^*[]+|[*[])/g;
  let m, before = ' ';                                     // the source character just before this piece
  while ((m = re.exec(String(str)))) {
    const txt = m[1] != null ? m[1] : m[2] != null ? m[2] : m[4], em = m[1] != null, role = m[2] != null ? m[3] : null;
    const parts = txt.split(/(\s+)/);
    let glue = out.length > 0 && !/\s/.test(before) && !/^\s/.test(txt);
    before = m[0].slice(-1);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { glue = false; continue; }
      out.push({ w: part, em, role, glue });
      glue = false;
    }
  }
  return out;
}

/* Positions for words at one size: greedy wrapping to w, glued words kept with their word.
   o: size, weight, family, ls (letter spacing), lineH (× size), align ('left' | 'center' |
   'right': x is then the left edge, the centre or the right edge), upper. */
function layoutWords(ctx, words, x, y, w, o) {
  const size = o.size, weight = o.weight, family = o.family, ls = o.ls || 0, lh = (o.lineH || 1.16) * size;
  const space = measure(ctx, ' ', size, weight, family, ls);
  const items = words.map((d) => Object.assign({}, d, { text: o.upper ? d.w.toUpperCase() : d.w }));
  for (const d of items) d.wd = measure(ctx, d.text, size, weight, family, ls);
  const units = [];                                       // a word and the punctuation glued to it
  for (const d of items) { if (d.glue && units.length) units[units.length - 1].push(d); else units.push([d]); }
  const lines = [[]];
  let cur = 0, widest = 0;
  for (const u of units) {
    const uw = u.reduce((s, d) => s + d.wd, 0);
    widest = Math.max(widest, uw);
    if (lines[lines.length - 1].length && cur + space + uw > w) { lines.push([]); cur = 0; }
    cur += (lines[lines.length - 1].length ? space : 0) + uw;
    lines[lines.length - 1].push(u);
  }
  let maxW = 0;
  lines.forEach((ln, li) => {
    const lw = ln.reduce((s, u, k) => s + (k ? space : 0) + u.reduce((a, d) => a + d.wd, 0), 0);
    maxW = Math.max(maxW, lw);
    let cx = o.align === 'center' ? x - lw / 2 : o.align === 'right' ? x - lw : x;
    const base = y + size * 0.8 + li * lh;
    ln.forEach((u, k) => {
      if (k) cx += space;
      for (const d of u) { Object.assign(d, { x: cx, y: base, top: base - size * 0.8, h: size, line: li }); cx += d.wd; }
    });
  });
  return { words: items, lines: lines.length, w: maxW, h: lines.length * lh, size, lh, widest, x, y };
}

/* the layout at o.size, or, with o.fit and a box height o.h, at the largest size (down to
   o.minSize, 24) whose lines fit w × h; a single word wider than w always shrinks the size */
function fitWords(ctx, words, x, y, w, o) {
  let size = o.size || 64;
  const min = o.minSize || 24;
  for (;;) {
    const L = layoutWords(ctx, words, x, y, w, Object.assign({}, o, { size }));
    const fits = L.widest <= w && (!(o.fit && o.h) || L.h <= o.h);
    if (fits || size <= min) return L;
    size = Math.max(min, Math.floor(size * 0.94));
  }
}

/* draws a laid-out block; kOf(i, word) gives each word's build-in (0..1), or for 'type' the
   share of its letters shown. o.current(i, word) can light the word being spoken. */
function _drawWords(ctx, L, kOf, o) {
  const size = L.size, weight = o.weight, family = o.family, ls = o.ls || 0;
  const base = o.color ? COL[o.color] || o.color : COL.ink, emCol = o.emColor ? COL[o.emColor] || o.emColor : COL.accent;
  const mark = o.mark || STYLE.captions.highlight || 'color', reveal = o.reveal || 'rise', alpha = o.alpha == null ? 1 : o.alpha;
  let caret = null;
  L.words.forEach((d, i) => {
    const k = clamp(kOf(i, d));
    if (k <= 0) return;
    const cur = o.current ? o.current(i, d) : false;
    const lit = d.em || cur;
    let col = d.role ? COL[d.role] || d.role : lit ? emCol : base;
    const mk = E.out3(clamp((k - 0.35) / 0.65));                // the mark arrives just after its word
    let str = d.text, a = alpha, dx = 0, dy = 0, sc = 1;
    if (reveal === 'type') {
      const n = Math.max(1, Math.round(k * d.text.length));
      str = d.text.slice(0, n);
      if (k < 1) caret = [d.x + measure(ctx, str, size, weight, family, ls) + 4, d.y];
    } else if (reveal === 'fade') a *= k;
    else if (reveal === 'rise') { a *= E.out3(k); dy = (1 - E.out3(k)) * size * 0.42; }
    else if (reveal === 'pop') { a *= clamp(k * 3); sc = lerp(0.55, 1, E.outBack(k)); }
    else if (reveal === 'slam') { a *= clamp(k * 4); sc = lerp(1.9, 1, E.out4(k)); }
    if (a <= 0.003) return;
    let box = null;                                               // the part of the word a box mark covers
    if (lit && !d.role && mark !== 'color') {                     // the look's way of marking a word
      ctx.save(); ctx.globalAlpha *= a;
      if (mark === 'box') {
        box = [d.x - size * 0.14, d.top - size * 0.04 + dy, (d.wd + size * 0.28) * mk, size * 1.12];
        fillRR(ctx, box[0], box[1], box[2], box[3], Math.min(STYLE.captions.boxRadius || 12, size * 0.2), emCol);
      } else if (mark === 'underline') {
        fillRR(ctx, d.x, d.y + size * 0.14 + dy, d.wd * mk, Math.max(4, size * 0.08), Math.max(2, size * 0.04), emCol);
      } else if (mark === 'highlight') {
        highlighter(ctx, d.x - size * 0.08, d.top + size * 0.12 + dy, d.wd + size * 0.16, size * 0.9, emCol, mk, 0.42);
        col = d.em ? base : col;
      }
      ctx.restore();
    }
    const draw = (c) => {
      if (sc !== 1) {
        ctx.save(); ctx.translate(d.x + d.wd / 2, d.y - size * 0.32 + dy); ctx.scale(sc, sc);
        text(ctx, str, -d.wd / 2, size * 0.32, { size, weight, family, color: c, alpha: a, ls });
        ctx.restore();
      } else text(ctx, str, d.x + dx, d.y + dy, { size, weight, family, color: c, alpha: a, ls });
    };
    draw(col);
    if (box && box[2] > 1) {                                      // inside the box, in the box's text colour
      ctx.save(); ctx.beginPath(); ctx.rect(box[0], box[1], box[2], box[3]); ctx.clip();
      draw(STYLE.captions.boxText ? COL[STYLE.captions.boxText] || STYLE.captions.boxText : COL.onAccent);
      ctx.restore();
    }
  });
  if (caret && o.caret !== false) {
    const on = o.t == null || Math.floor(o.t * 2.4) % 2 === 0;
    if (on) fillRR(ctx, caret[0], caret[1] - size * 0.78, Math.max(3, size * 0.07), size * 0.92, 1, base);
  }
}

/* A block of text, wrapped to w and built in. Returns its layout: { words: [{ text, x, y (baseline),
   top, wd, h, line, em, role }], lines, w, h, size } — for pointers, highlights or a camera move.
   o: size (64), weight (800), family (display face), color (role), emColor (role), mark, align,
   lineH, ls, upper, fit + h (shrink to the box), minSize, p (0..1 build-in), reveal ('rise' |
   'fade' | 'pop' | 'slam' | 'type' | 'none'), spread (0..1: how much the words overlap; 0.7),
   alpha, t (the typewriter caret blinks with it). */
function textBlock(ctx, str, x, y, w, o = {}) {
  const opt = Object.assign({ size: 64, weight: 800, family: F.disp, align: 'left' }, o);
  const words = parseMarkup(str), L = fitWords(ctx, words, x, y, w, opt), n = L.words.length, p = opt.p == null ? 1 : clamp(opt.p);
  let kOf;
  if (opt.reveal === 'none') kOf = () => 1;
  else if (opt.reveal === 'type') {                         // one letter after another, evenly
    const total = L.words.reduce((s, d) => s + d.text.length, 0), starts = [];
    L.words.reduce((s, d) => { starts.push(s); return s + d.text.length; }, 0);
    kOf = (i, d) => (p * total - starts[i]) / d.text.length;
  } else kOf = (i) => stagger(p, i, n, opt.spread == null ? 0.7 : opt.spread);
  _drawWords(ctx, L, kOf, opt);
  return L;
}

/* The narration's own words between two cue words of a beat, each appearing as it is spoken
   (o.lead seconds early, over o.dur): kinetic type for a hook, a title, the line a scene is
   about. The block is laid out with every word from the start, so nothing moves as words
   arrive. o: from, to (cue words, as in at(); fromN / toN for the nth), em (words to
   emphasise), roles ({ word: role }), current (a role: light the word being spoken), lead
   (0.05), dur (0.22), and textBlock's size, fit, h, align, reveal ('pop' by default), mark …
   Remember hideCaptions() for the same stretch, or the captions say it twice. */
function sayText(ctx, t, beat, x, y, w, o = {}) {
  const all = DATA.words.filter((d) => d.beat === beat);
  const find = (word, nth) => {
    let n = 0;
    for (let i = 0; i < all.length; i++) if (cleanWord(all[i].w) === word && ++n === nth) return i;
    throw new Error(`sayText: cue not found: ${beat}/${word}#${nth}`);
  };
  const i0 = o.from ? find(o.from, o.fromN || 1) : 0, i1 = o.to ? find(o.to, o.toN || 1) : all.length - 1;
  const ems = new Set((o.em || []).map(cleanWord)), roles = o.roles || {};
  const words = all.slice(i0, i1 + 1).map((d) => ({ w: d.w, em: ems.has(cleanWord(d.w)), role: roles[cleanWord(d.w)] || null, glue: false, t0: d.t0, t1: d.t1 }));
  const opt = Object.assign({ size: 88, weight: 800, family: F.disp, align: 'left', reveal: 'pop' }, o);
  const L = fitWords(ctx, words, x, y, w, opt), lead = opt.lead == null ? 0.05 : opt.lead, dur = opt.dur || 0.22;
  if (opt.current) {
    const role = opt.current;
    opt.emColor = opt.emColor || role;
    opt.current = (i, d) => t >= d.t0 - lead && t <= d.t1 + 0.06;
  }
  _drawWords(ctx, L, (i, d) => (t - (d.t0 - lead)) / dur, Object.assign(opt, { t }));
  return L;
}

/* demos for `lockstep blocks` (a gallery of the type styles, in the look) */
Object.assign(BLOCK_DEMOS, {
  textBlock: { about: 'type that wraps and builds in word by word; *emphasis* marked the way the look marks its captions',
    demo: (ctx, p) => textBlock(ctx, 'Painkillers do not *find* the pain. They [block](alert) the signal that carries it.', 110, 480, 860, { p, size: 78 }) },
  'textBlock.slam': { about: 'a statement slammed onto the frame word by word, fitted to its box: poster looks',
    demo: (ctx, p) => textBlock(ctx, 'Nobody *reads* the label', 110, 470, 860, { p, size: 230, fit: true, h: 660, reveal: 'slam', upper: true, lineH: 0.98, weight: 900 }) },
  'textBlock.type': { about: 'typed out letter by letter with a blinking caret: code, messages, notes',
    demo: (ctx, p, t) => textBlock(ctx, 'git commit -m "say it in one line"', 110, 640, 860, { p, size: 54, family: F.mono, weight: 700, reveal: 'type', t }) },
});
