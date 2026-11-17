'use strict';
/* =====================================================================
   lint.js — loaded only by `render.js <video> lint` (engine/lint.py reads the result).

   Draws a frame every `step` frames and records each piece of text the scenes draw: the
   string, its box on screen (after every transform), its size on screen, its opacity and
   its colour. Each sampled frame is then drawn a second time with all text switched off,
   to see what is behind every label: the share of the label's box where the text colour
   has little contrast with the picture behind it (a label on top of a figure, a line or a
   glow in its own colour).

   Text the engine draws itself is kept apart: the progress bar is ignored and the captions
   only mark out the caption zone. Frames inside a transition are drawn (a frame that throws
   there is still an error) but their text is not recorded, since the scenes are composited
   there with zooms and slides.
   ===================================================================== */
function lintLayout(step) {
  const P = CanvasRenderingContext2D.prototype, fill0 = P.fillText, stroke0 = P.strokeText;
  const hud0 = window.drawHUD, cap0 = window.drawCaptions;
  let rec = null, chrome = null, capSeen = false, mute = false;
  const cap = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  const fontPx = (f) => { const m = /([\d.]+)px/.exec(f); return m ? +m[1] : 10; };
  const LIN = new Float32Array(256);
  for (let v = 0; v < 256; v++) { const c = v / 255; LIN[v] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function rgbOf(c) {
    if (typeof c !== 'string') return null;              // gradients and patterns are not judged
    let m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]; }
    m = /^rgba?\(([^)]+)\)$/.exec(c);
    if (m) { const p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    return null;
  }

  /* item: [text, x0, y0, x1, y1, px on screen, opacity, fill colour, outlined, low-contrast share] */
  function note(ctx, s, x, y, maxW, isStroke) {
    if (!rec || (ctx.canvas !== LAYER_A && ctx.canvas !== MAIN)) return;   // offscreen canvases are composited elsewhere
    const str = String(s);
    if (!str.trim()) return;
    const m = ctx.getTransform(), tm = ctx.measureText(str);
    const k = maxW > 0 && tm.width > maxW ? maxW / tm.width : 1;            // fillText squeezes text wider than maxW
    const l = x - tm.actualBoundingBoxLeft * k, r = x + tm.actualBoundingBoxRight * k;
    const top = y - tm.actualBoundingBoxAscent, bot = y + tm.actualBoundingBoxDescent;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [u, v] of [[l, top], [r, top], [l, bot], [r, bot]]) {
      const X = m.a * u + m.c * v + m.e, Y = m.b * u + m.d * v + m.f;
      x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
    }
    if (chrome === 'cap') {
      capSeen = true;
      cap.x0 = Math.min(cap.x0, x0); cap.y0 = Math.min(cap.y0, y0); cap.x1 = Math.max(cap.x1, x1); cap.y1 = Math.max(cap.y1, y1);
      return;
    }
    if (chrome) return;
    const sc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    const outline = isStroke && ctx.lineWidth * sc >= 2;
    rec.push([str, +x0.toFixed(1), +y0.toFixed(1), +x1.toFixed(1), +y1.toFixed(1), +(fontPx(ctx.font) * sc).toFixed(1),
      +ctx.globalAlpha.toFixed(2), isStroke ? null : ctx.fillStyle, outline ? 1 : 0, null]);
  }
  /* one entry per string and place: outline, fill and glow passes of the same text are one text */
  function dedupe(list) {
    const out = [];
    for (const it of list) {
      const same = out.find((o) => o[0] === it[0] && Math.abs(o[1] - it[1]) < 3 && Math.abs(o[2] - it[2]) < 3 && Math.abs(o[3] - it[3]) < 3 && Math.abs(o[4] - it[4]) < 3);
      if (!same) { out.push(it.slice()); continue; }
      same[6] = Math.max(same[6], it[6]);
      if (it[7] != null) same[7] = it[7];
      same[8] = same[8] || it[8];
    }
    return out;
  }
  /* share of the label's box where its colour has less than 2:1 contrast with what is behind it.
     The label is judged in its full colour: text dimmed on purpose (a step not yet reached) is not
     a label on top of something, and a fade-in is not a collision. */
  function lowContrast(it) {
    const c = rgbOf(it[7]);
    if (!c || it[8] || it[6] < 0.5) return null;
    const bx = Math.max(0, Math.floor(it[1])), by = Math.max(0, Math.floor(it[2]));
    const bw = Math.min(W, Math.ceil(it[3])) - bx, bh = Math.min(H, Math.ceil(it[4])) - by;
    if (bw < 3 || bh < 3) return null;
    const d = mctx.getImageData(bx, by, bw, bh).data, a = c[3];
    let low = 0, n = 0;
    for (let yy = 0; yy < bh; yy += 2) {
      for (let xx = 0; xx < bw; xx += 2) {
        const p = (yy * bw + xx) * 4;
        const r = d[p], g = d[p + 1], b = d[p + 2];
        const tr = Math.round(a * c[0] + (1 - a) * r), tg = Math.round(a * c[1] + (1 - a) * g), tb = Math.round(a * c[2] + (1 - a) * b);
        const L1 = 0.2126 * LIN[tr] + 0.7152 * LIN[tg] + 0.0722 * LIN[tb], L2 = 0.2126 * LIN[r] + 0.7152 * LIN[g] + 0.0722 * LIN[b];
        if ((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05) < 2) low++;
        n++;
      }
    }
    return n ? +(low / n).toFixed(2) : null;
  }

  P.fillText = function (s, x, y, mw) { if (mute) return; note(this, s, x, y, mw, false); return fill0.apply(this, arguments); };
  P.strokeText = function (s, x, y, mw) { if (mute) return; note(this, s, x, y, mw, true); return stroke0.apply(this, arguments); };
  window.drawHUD = function () { chrome = 'hud'; try { return hud0.apply(this, arguments); } finally { chrome = null; } };
  window.drawCaptions = function () { chrome = 'cap'; try { return cap0.apply(this, arguments); } finally { chrome = null; } };

  const samples = [], errors = [], half = TR / 2 + 1 / FPS;
  const inTransition = (t) => SCENES.some((s, k) => k > 0 && Math.abs(t - s.t0) < half);
  try {
    for (let i = 0; i < window.TOTAL_FRAMES; i += step) {
      const t = i / FPS;
      rec = inTransition(t) ? null : [];
      try { renderFrame(i); } catch (e) {
        errors.push({ t: +t.toFixed(2), error: String((e && e.message) || e) });
        if (errors.length > 60) break;
        continue;
      }
      if (!rec) continue;
      const items = dedupe(rec);
      rec = null;
      if (items.some((it) => rgbOf(it[7]) && !it[8] && it[6] >= 0.5)) {
        mute = true;
        try { renderFrame(i); } finally { mute = false; }
        for (const it of items) it[9] = lowContrast(it);
      }
      for (const it of items) if (typeof it[7] !== 'string') it[7] = null;
      samples.push([+t.toFixed(2), items]);
    }
  } finally {
    rec = null; mute = false;
    P.fillText = fill0; P.strokeText = stroke0; window.drawHUD = hud0; window.drawCaptions = cap0;
  }
  return {
    step, fps: FPS, dur: DATA.dur, W, H, safe: SAFE, right: { x: RIGHT_COL + 60, y: RIGHT_COL_Y },
    cap_zone: capSeen ? cap : null,
    scenes: SCENES.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1 })),
    sfx: SFX.map((s) => ({ t: s.t, type: s.type })),
    errors, samples,
  };
}
