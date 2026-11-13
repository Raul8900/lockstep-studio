'use strict';
/* =====================================================================
   engine.js — data + cues, background, bloom, captions, HUD, scene
   scheduling with layer-composited transitions, frame entry point.
   ===================================================================== */

const DATA = { words: null, takes: null, beats: null, meta: null, dur: 0 };
let VIDEO = { title: '', tag: '', chapters: [] };      // the video's video.json
const SCENES = [];        // {id, name, t0, t1, draw(ctx,t), trans:{type,fx,fy}}
let CAPS = [];
const SFX = [];           // sound cues collected from scenes: {t, type, gain, pan}
const sfx = (t, type, gain = 1, extra = {}) => { SFX.push(Object.assign({ t: +t.toFixed(3), type, gain }, extra)); };

const cleanWord = (s) => s.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');

/* ---------- cues: look up narration times by spoken word ---------- */
function at(beat, word, nth = 1, edge = 't0') {
  let n = 0;
  for (const w of DATA.words) {
    if (w.beat === beat && cleanWord(w.w) === word) { if (++n === nth) return w[edge]; }
  }
  throw new Error(`cue not found: ${beat}/${word}#${nth}`);
}
const takeAt = (i) => DATA.takes[i];
const beatOf = (id) => DATA.beats.find((b) => b.id === id);

/* ---------- canvases ---------- */
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
let NOISE_PATTERN = null;
let MAIN, mctx, LAYER_A, LAYER_B, actx, bctx, HALF, hctx, BLOOM_A, BLOOM_B, BLOOM_C, BGQ, bgq, OVERLAY, NOISE;

function initCanvases() {
  MAIN = document.getElementById('c');
  mctx = MAIN.getContext('2d', { alpha: false, willReadFrequently: true });
  LAYER_A = makeCanvas(W, H); actx = LAYER_A.getContext('2d');
  LAYER_B = makeCanvas(W, H); bctx = LAYER_B.getContext('2d');
  HALF = makeCanvas(W / 2, H / 2); hctx = HALF.getContext('2d');
  BLOOM_A = makeCanvas(W / 4, H / 4);
  BLOOM_B = makeCanvas(W / 8, H / 8);
  BLOOM_C = makeCanvas(W / 4, H / 4);
  BGQ = makeCanvas(W / 4, H / 4); bgq = BGQ.getContext('2d');

  /* static overlay: vignette + a soft dark band behind the caption zone so
     captions stay readable over any scene */
  OVERLAY = makeCanvas(W, H);
  { const g = OVERLAY.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H * 0.46, H * 0.24, W / 2, H / 2, H * 0.66);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const sc = g.createLinearGradient(0, 1130, 0, 1610);
    sc.addColorStop(0, 'rgba(3,5,9,0)'); sc.addColorStop(0.32, 'rgba(3,5,9,0.6)'); sc.addColorStop(0.72, 'rgba(3,5,9,0.6)'); sc.addColorStop(1, 'rgba(3,5,9,0)');
    g.fillStyle = sc; g.fillRect(0, 1130, W, 480); }

  NOISE = makeCanvas(256, 256);
  { const g = NOISE.getContext('2d'); const id = g.createImageData(256, 256); const r = rng(1234);
    for (let i = 0; i < 256 * 256; i++) { const v = r(); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v < 0.5 ? 0 : 255; id.data[i * 4 + 3] = Math.floor(Math.abs(v - 0.5) * 2 * 255); }
    g.putImageData(id, 0, 0); }
}

/* ---------- background ---------- */
function drawBackground(ctx, t) {
  /* gradient + slow colour fog are smooth, so they are drawn at quarter size */
  const q = bgq, QW = W / 4, QH = H / 4;
  const g = q.createLinearGradient(0, 0, 0, QH);
  g.addColorStop(0, '#05080D'); g.addColorStop(0.45, '#090E17'); g.addColorStop(1, '#04060A');
  q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1;
  q.fillStyle = g; q.fillRect(0, 0, QW, QH);
  const fog = [
    [COL.cyan, 160 + 90 * Math.sin(t * 0.11), 420 + 120 * Math.cos(t * 0.07), 760, 0.11],
    [COL.violet, 930 + 80 * Math.cos(t * 0.09 + 1), 1180 + 160 * Math.sin(t * 0.06 + 2), 880, 0.12],
    [COL.cyanDeep, 540 + 200 * Math.sin(t * 0.05 + 4), 1760 + 60 * Math.sin(t * 0.08), 700, 0.16],
  ];
  for (const f of fog) glow(q, f[1] / 4, f[2] / 4, f[3] / 4, f[0], f[4]);
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(BGQ, 0, 0, W, H);

  /* dot lattice drifting upward (parallax floor) */
  const sp = 60, drift = (t * 7) % sp;
  ctx.fillStyle = rgba('#9FC4EA', 1);
  for (let y = -sp; y < H + sp; y += sp) {
    const yy = y - drift;
    const fade = clamp(Math.min(yy, H - yy) / 380) * 0.11;
    if (fade <= 0.004) continue;
    ctx.globalAlpha = fade;
    for (let x = 30; x < W; x += sp) ctx.fillRect(x - 1.25, yy - 1.25, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;

  /* perspective floor grid in the lower band (sits under platform UI): depth without distraction */
  {
    const hz = 1500, vx = 540;
    ctx.save();
    ctx.lineWidth = 1.5;
    for (let i = -12; i <= 12; i++) {
      const xb = vx + i * 150;
      const gr = ctx.createLinearGradient(0, hz, 0, H);
      gr.addColorStop(0, rgba(COL.cyan, 0)); gr.addColorStop(0.35, rgba(COL.cyan, 0.07)); gr.addColorStop(1, rgba(COL.cyan, 0.17));
      ctx.strokeStyle = gr; ctx.beginPath(); ctx.moveTo(vx + i * 14, hz); ctx.lineTo(xb + i * 60, H + 40); ctx.stroke();
    }
    for (let k = 0; k < 9; k++) {
      const u = ((k + (t * 0.22) % 1) / 9);
      const y = hz + (H + 40 - hz) * u * u;
      ctx.strokeStyle = rgba(COL.cyan, 0.02 + 0.15 * u);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* faint vertical traces with pulses travelling top -> bottom */
  const xs = [96, 228, 384, 696, 852, 984];
  for (let i = 0; i < xs.length; i++) {
    ctx.fillStyle = rgba('#7FB0E0', 0.045); ctx.fillRect(xs[i], 0, 1.5, H);
    for (let k = 0; k < 2; k++) {
      const speed = 150 + 70 * hash(i * 7 + k), ph = hash(i * 13 + k * 5) * 2600;
      const y = ((t * speed + ph) % 2600) - 300;
      const gr = ctx.createLinearGradient(0, y - 150, 0, y);
      gr.addColorStop(0, rgba(COL.cyan, 0)); gr.addColorStop(1, rgba(COL.cyan, 0.24));
      ctx.fillStyle = gr; ctx.fillRect(xs[i] - 0.75, y - 150, 3, 150);
    }
  }
}

/* ---------- post ---------- */
function applyBloom(ctx, src, strength = 1) {
  const a = BLOOM_A.getContext('2d'), b = BLOOM_B.getContext('2d'), c = BLOOM_C.getContext('2d');
  hctx.globalCompositeOperation = 'copy'; hctx.imageSmoothingQuality = 'low';
  hctx.drawImage(src, 0, 0, W / 2, H / 2);                       // 2x box downsample
  a.globalCompositeOperation = 'copy';
  a.filter = 'brightness(0.80) contrast(2.5) blur(4px)';          // soft threshold + blur
  a.drawImage(HALF, 0, 0, BLOOM_A.width, BLOOM_A.height);
  a.filter = 'none';
  b.globalCompositeOperation = 'copy';
  b.filter = 'blur(7px)';                                         // wide halo
  b.drawImage(BLOOM_A, 0, 0, BLOOM_B.width, BLOOM_B.height);
  b.filter = 'none';
  c.globalCompositeOperation = 'copy'; c.globalAlpha = 0.42; c.drawImage(BLOOM_A, 0, 0);
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.drawImage(BLOOM_B, 0, 0, BLOOM_C.width, BLOOM_C.height);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingQuality = 'medium';
  ctx.globalAlpha = strength; ctx.drawImage(BLOOM_C, 0, 0, W, H);
  ctx.restore();
}
function drawPost(ctx, frame) {
  ctx.drawImage(OVERLAY, 0, 0);
  /* fixed low-amplitude dither (about 1.5 code values): hides 8-bit banding in the dark
     gradients. It is static on purpose - animated grain multiplied the bitrate by ~8. */
  ctx.save();
  ctx.globalAlpha = 0.014;
  ctx.fillStyle = NOISE_PATTERN || (NOISE_PATTERN = ctx.createPattern(NOISE, 'repeat'));
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* ---------- captions ---------- */
const CAP = { size: 74, weight: 800, family: F.disp, lineH: 90, maxW: 800, cy: 1350, x: CX };
const CAP_COL = { k: COL.cyan, n: COL.amber, m: COL.violet, w: COL.coral };

function buildCaptions(words, phrases) {
  const caps = []; let wi = 0;
  mctx.font = fontCSS(CAP.weight, CAP.size, CAP.family);
  const space = mctx.measureText(' ').width * 1.5;
  for (const ph of phrases) {
    const parts = ph.trim().split(/\s+/);
    const ws = [];
    for (const p of parts) {
      const w = words[wi++];
      if (!w || cleanWord(w.w) !== cleanWord(p)) throw new Error(`caption/word mismatch at "${p}" vs "${w && w.w}" (phrase "${ph}")`);
      const disp = w.w.replace(/[.,;:—…]+$/g, '');
      ws.push({ disp, t0: w.t0, t1: w.t1, cls: w.cls, take: w.take, wdt: mctx.measureText(disp).width });
    }
    /* break into 1 or 2 balanced lines */
    const total = ws.reduce((s, w) => s + w.wdt, 0) + space * (ws.length - 1);
    let lines = [ws];
    if (total > CAP.maxW && ws.length > 1) {
      let best = 1, bestDiff = 1e9;
      for (let k = 1; k < ws.length; k++) {
        const a = ws.slice(0, k).reduce((s, w) => s + w.wdt, 0) + space * (k - 1);
        const b = ws.slice(k).reduce((s, w) => s + w.wdt, 0) + space * (ws.length - k - 1);
        const d = Math.max(a, b) + Math.abs(a - b) * 0.25;
        if (d < bestDiff) { bestDiff = d; best = k; }
      }
      lines = [ws.slice(0, best), ws.slice(best)];
    }
    let scale = 1;
    for (const ln of lines) {
      const lw = ln.reduce((s, w) => s + w.wdt, 0) + space * (ln.length - 1);
      ln.w = lw; scale = Math.min(scale, CAP.maxW / lw);
    }
    caps.push({ lines, scale, space, t0: ws[0].t0, t1: ws[ws.length - 1].t1, take: ws[0].take, text: ph });
  }
  if (wi !== words.length) throw new Error(`caption phrases cover ${wi} of ${words.length} words`);
  for (let i = 0; i < caps.length; i++) {
    const c = caps[i], n = caps[i + 1], p = caps[i - 1];
    c.show0 = Math.max(c.t0 - 0.06, p ? Math.min(p.show1, c.t0) : 0);
    c.show1 = n && n.t0 - c.t1 < 0.62 ? n.t0 - 0.06 : c.t1 + 0.34;
    if (n) c.show1 = Math.min(c.show1, n.t0 - 0.06);
  }
  for (let i = 1; i < caps.length; i++) caps[i].show0 = Math.max(caps[i].show0, caps[i - 1].show1);
  return caps;
}

function drawCaptions(ctx, t) {
  let c = null;
  for (const k of CAPS) if (t >= k.show0 && t < k.show1) { c = k; break; }
  if (!c) return;
  const pop = E.outBackSoft(prog(t, c.show0, c.show0 + 0.14));
  const alpha = prog(t, c.show0, c.show0 + 0.06) * (1 - prog(t, c.show1 - 0.05, c.show1));
  const sc = c.scale * lerp(0.9, 1, pop);
  const n = c.lines.length;
  ctx.save();
  ctx.translate(CAP.x, CAP.cy);
  ctx.scale(sc, sc);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  for (let li = 0; li < n; li++) {
    const ln = c.lines[li];
    const y = (li - (n - 1) / 2) * CAP.lineH;
    let x = -ln.w / 2;
    for (const w of ln) {
      const state = t < w.t0 - 0.03 ? 0 : t <= w.t1 + 0.05 ? 1 : 2;      // future, active, past
      const hit = E.out3(prog(t, w.t0 - 0.03, w.t0 + 0.09));
      const rel = state === 2 ? 1 - prog(t, w.t1 + 0.05, w.t1 + 0.2) : 1;
      const k = state === 0 ? 0 : hit * rel;                              // emphasis 0..1
      const colr = w.cls ? CAP_COL[w.cls] : COL.white;
      const a = alpha * (state === 0 ? 0.44 : 1);
      const s = 1 + 0.075 * k;
      ctx.save();
      ctx.translate(x + w.wdt / 2, y - 5 * k);
      ctx.scale(s, s);
      ctx.font = fontCSS(CAP.weight, CAP.size, CAP.family);
      ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(3,5,9,0.94)'; ctx.lineWidth = 15; ctx.strokeText(w.disp, -w.wdt / 2, 0);
      if (state !== 0 && w.cls) {                                         // soft halo on key terms
        ctx.shadowColor = rgba(colr, 0.75 * (0.35 + 0.65 * k)); ctx.shadowBlur = 26;
      }
      ctx.fillStyle = state === 0 ? COL.white : colr;
      ctx.fillText(w.disp, -w.wdt / 2, 0);
      ctx.restore();
      x += w.wdt + c.space;
    }
  }
  ctx.restore();
}

/* ---------- HUD: chapter progress ---------- */
function chapterName(id) {
  const c = (VIDEO.chapters || []).find((x) => x.id === id);
  if (c && c.name) return c.name;
  const b = DATA.beats.find((x) => x.id === id);
  return (b ? b.title : id).toUpperCase();
}
function drawHUD(ctx, t) {
  const x0 = SAFE.l, x1 = SAFE.r, y = 292, gap = 8, n = SCENES.length;
  const total = DATA.dur, usable = x1 - x0 - gap * (n - 1);
  let x = x0, cur = 0;
  for (let i = 0; i < n; i++) {
    const s = SCENES[i], wdt = usable * (s.t1 - s.t0) / total;
    const p = prog(t, s.t0, s.t1);
    if (t >= s.t0) cur = i;
    fillRR(ctx, x, y, wdt, 5, 2.5, 'rgba(210,228,250,0.16)');
    if (p > 0) fillRR(ctx, x, y, Math.max(5, wdt * p), 5, 2.5, p >= 1 ? 'rgba(220,235,255,0.6)' : COL.cyan);
    x += wdt + gap;
  }
  const s = SCENES[cur];
  const a = (cur === 0 ? 1 : clamp((t - s.t0) / 0.35)) * (cur < n - 1 ? clamp((s.t1 - t) / 0.25) : 1);
  const num = String(cur + 1).padStart(2, '0');
  const wn = text(ctx, num, x0, 334, { size: 25, weight: 800, family: F.mono, color: COL.cyan, alpha: a, ls: 1 });
  text(ctx, chapterName(s.id), x0 + wn + 14, 334, { size: 25, weight: 700, family: F.mono, color: COL.text, alpha: a * 0.82, ls: 3 });
  if (VIDEO.tag) text(ctx, VIDEO.tag, x1, 334, { size: 22, weight: 600, family: F.mono, color: COL.dim, alpha: 0.6, ls: 3, align: 'right' });
}

/* ---------- scenes + transitions ---------- */
const TR = 0.84;     // transition length (s)
function addScene(id, draw, trans = { type: 'fade' }) { SCENES.push({ id, draw, trans }); }

function finalizeScenes() {
  if (!SCENES.length) throw new Error('no scenes registered: every scenes/*.js must call addScene(beatId, draw, transition)');
  const missing = DATA.beats.filter((b) => !SCENES.some((s) => s.id === b.id)).map((b) => b.id);
  if (missing.length) throw new Error('beats without a scene: ' + missing.join(', ') + ' (scene id must equal the beat id in script.py)');
  for (let i = 0; i < SCENES.length; i++) {
    const b = DATA.beats.find((x) => x.id === SCENES[i].id);
    if (!b) throw new Error('no beat for scene ' + SCENES[i].id);
    if (i > 0 && b.t0 <= DATA.beats.find((x) => x.id === SCENES[i - 1].id).t0) throw new Error('scenes are out of order: ' + SCENES[i - 1].id + ' is registered before ' + SCENES[i].id + ' (name the files s01_, s02_, ... in narration order)');
    SCENES[i].t0 = i === 0 ? 0 : +(b.t0 - 0.5).toFixed(3);
    SCENES[i].beat = b;
  }
  for (let i = 0; i < SCENES.length; i++) SCENES[i].t1 = i < SCENES.length - 1 ? SCENES[i + 1].t0 : DATA.dur;
}

function drawLayer(lctx, sc, t) {
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalAlpha = 1; lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, W, H);
  lctx.save();
  sc.draw(lctx, t);
  lctx.restore();
}
function blit(ctx, layer, o) {
  const { alpha = 1, zoom = 1, fx = CX, fy = 800, dx = 0, dy = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.translate(fx + dx, fy + dy); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function renderScenes(ctx, t) {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (t >= SCENES[k].t0) i = k;
  const S = SCENES[i];
  let A = null, B = null, p = 0;
  if (i > 0 && t < S.t0 + TR / 2) { A = SCENES[i - 1]; B = S; p = prog(t, S.t0 - TR / 2, S.t0 + TR / 2); }
  else if (i < SCENES.length - 1 && t > S.t1 - TR / 2) { A = S; B = SCENES[i + 1]; p = prog(t, S.t1 - TR / 2, S.t1 + TR / 2); }
  if (!A) { drawLayer(actx, S, t); ctx.drawImage(LAYER_A, 0, 0); return; }

  drawLayer(actx, A, t); drawLayer(bctx, B, t);
  const tr = B.trans || { type: 'fade' };
  const e = E.io3(p), fx = tr.fx == null ? CX : tr.fx, fy = tr.fy == null ? 800 : tr.fy;
  const aOut = 1 - prog(p, 0.08, 0.62), aIn = prog(p, 0.38, 0.92);
  switch (tr.type) {
    case 'zoomIn':     // dive into A at (fx,fy); B grows out of that point
      blit(ctx, LAYER_A, { alpha: aOut, zoom: lerp(1, tr.z || 2.6, E.in3(p)), fx, fy });
      blit(ctx, LAYER_B, { alpha: aIn, zoom: lerp(tr.zb || 0.62, 1, E.out3(p)), fx: tr.bx == null ? CX : tr.bx, fy: tr.by == null ? 800 : tr.by });
      break;
    case 'zoomOut':    // pull back: A shrinks toward (fx,fy), B settles from close-up
      blit(ctx, LAYER_B, { alpha: aIn, zoom: lerp(tr.zb || 1.5, 1, E.out3(p)), fx: tr.bx == null ? CX : tr.bx, fy: tr.by == null ? 800 : tr.by });
      blit(ctx, LAYER_A, { alpha: aOut, zoom: lerp(1, tr.z || 0.45, E.in3(p)), fx, fy });
      break;
    case 'panDown':    // camera travels down: A leaves upward, B arrives from below
      blit(ctx, LAYER_A, { alpha: 1 - prog(p, 0.2, 0.8), dy: -e * (tr.d || 620) });
      blit(ctx, LAYER_B, { alpha: prog(p, 0.2, 0.8), dy: (1 - e) * (tr.d || 620) });
      break;
    case 'panUp':
      blit(ctx, LAYER_A, { alpha: 1 - prog(p, 0.2, 0.8), dy: e * (tr.d || 620) });
      blit(ctx, LAYER_B, { alpha: prog(p, 0.2, 0.8), dy: -(1 - e) * (tr.d || 620) });
      break;
    default:
      blit(ctx, LAYER_A, { alpha: 1 - prog(p, 0.1, 0.7) });
      blit(ctx, LAYER_B, { alpha: prog(p, 0.3, 0.9) });
  }
}

/* ---------- frame entry point ---------- */
function renderFrame(i) {
  const t = i / FPS;
  mctx.setTransform(1, 0, 0, 1, 0, 0);
  mctx.globalAlpha = 1; mctx.globalCompositeOperation = 'source-over';
  drawBackground(mctx, t);
  renderScenes(mctx, t);
  applyBloom(mctx, MAIN, 1);
  drawPost(mctx, i);
  drawHUD(mctx, t);
  drawCaptions(mctx, t);
  if (window.DEBUG_SAFE) drawSafeGuides(mctx);
}

/* debug overlay: platform UI keep-out zones */
function drawSafeGuides(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,60,90,0.22)';
  ctx.fillRect(0, 0, W, SAFE.t); ctx.fillRect(0, SAFE.b, W, H - SAFE.b);
  ctx.fillRect(RIGHT_COL + 60, RIGHT_COL_Y, W - RIGHT_COL - 60, SAFE.b - RIGHT_COL_Y);
  ctx.strokeStyle = 'rgba(80,255,160,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  ctx.strokeRect(SAFE.l, SAFE.t, SAFE.r - SAFE.l, SAFE.b - SAFE.t);
  ctx.restore();
}

async function boot() {
  initCanvases();
  const get = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  const [video, words, takes, phrases] = await Promise.all([get('project/video.json'), get('project/data/words.json'), get('project/data/takes.json'), get('project/caption_phrases.json')]);
  VIDEO = video;
  DATA.words = words; DATA.takes = takes.takes; DATA.beats = takes.beats; DATA.meta = takes.meta; DATA.dur = takes.meta.duration;
  const faces = ['800 74px "Inter Display"', '900 74px "Inter Display"', '700 30px "Inter Display"', '600 30px "Inter"', '700 30px "Inter"', '500 30px "Inter"',
    '700 30px "JetBrains Mono"', '500 30px "JetBrains Mono"', '800 30px "JetBrains Mono"', '600 30px "JetBrains Mono"'];
  await Promise.all(faces.map((f) => document.fonts.load(f)));
  CAPS = buildCaptions(words, phrases);
  if (window.defineScenes) window.defineScenes();
  finalizeScenes();
  for (const s of SCENES) if (s.init) s.init();
  SFX.sort((a, b) => a.t - b.t);
  window.TOTAL_FRAMES = Math.round(DATA.dur * FPS);
  window.READY = true;
}

/* render a frame range; each frame leaves the page as a high-quality JPEG
   (uploading raw pixel buffers from the page proved ~8x slower than drawing) */
async function renderRange(a, b, quality = 0.97) {
  for (let i = a; i < b; i++) {
    renderFrame(i);
    const blob = await new Promise((res) => MAIN.toBlob(res, 'image/jpeg', quality));
    const r = await fetch(`/frame?i=${i}`, { method: 'POST', body: blob });
    if (!r.ok) throw new Error('frame post failed ' + r.status);
  }
  return b - a;
}
