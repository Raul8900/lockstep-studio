'use strict';
/* =====================================================================
   components.js — “How Bluetooth Works” (transit-map look)
   Drawing code shared by this video's scenes: the station-wall backdrop,
   the strip-map HUD, the real Bluetooth hop kernel, line maps, plan-view
   people, the split-flap board, packets with their code badges.
   Every function is a pure function of its arguments (and t): no
   Math.random(), no Date, no state carried from one frame to the next.
   Caches below hold pure computations only (textures, hop sequences).
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. The Bluetooth hop kernel (BR/EDR, Connection state), from the Core
      Specification v5.4 Vol 2 Part B §2.6; tools/verify_hops.js checks this
      copy against every connection-state hop in the spec's sample data.
   --------------------------------------------------------------------- */
// BEGIN HOP KERNEL
const BT_BANK = Array.from({ length: 79 }, (_, i) => (2 * i) % 79);   // register bank: even channels, then odd
const BT_BFLY = [[0, 1], [2, 3], [1, 2], [3, 4], [0, 4], [1, 3], [0, 2], [3, 4], [1, 4], [0, 3], [2, 4], [1, 3], [0, 3], [1, 2]];
function btPerm5(z, pHigh, pLow) {                                    // 7 butterfly stages, P13 first
  const b = [0, 1, 2, 3, 4].map((i) => (z >> i) & 1);
  for (let i = 13; i >= 0; i--) {
    const on = i < 9 ? (pLow >> i) & 1 : (pHigh >> (i - 9)) & 1;
    if (on) { const [u, v] = BT_BFLY[i]; const s = b[u]; b[u] = b[v]; b[v] = s; }
  }
  return b.reduce((acc, bit, i) => acc | (bit << i), 0);
}
/* ulap: UAP[3:0] in bits 27..24 and LAP in bits 23..0 of the Central; clk: the Central's 28-bit clock.
   used: optional array of 79 booleans (the AFH channel map); omitted = basic hopping (all 79). */
function btHop(ulap, clk, used) {
  const A = ulap >>> 0, bit = (n, i) => (n >>> i) & 1;
  const pick = (idx) => idx.reduce((acc, i) => (acc << 1) | bit(A, i), 0);
  const adapted = !!used;
  const c0 = adapted ? clk & ~2 : clk;                                 // same-channel mechanism: CLK1 = 0
  const X = (c0 >>> 2) & 31, Y1 = bit(c0, 1), Y2 = 32 * Y1;
  const a = ((A >>> 23) & 31) ^ ((c0 >>> 21) & 31);
  const b = (A >>> 19) & 15;
  const c = pick([8, 6, 4, 2, 0]) ^ ((c0 >>> 16) & 31);
  const d = ((A >>> 10) & 511) ^ ((c0 >>> 7) & 511);
  const e = pick([13, 11, 9, 7, 5, 3, 1]);
  const k = (c0 >>> 7) & 0x1fffff;                                     // CLK27-7
  const F = (16 * k) % 79;
  const z = ((X + a) % 32) ^ b;
  const perm = btPerm5(z, Y1 ? c ^ 31 : c, d);
  const ch = BT_BANK[(perm + e + F + Y2) % 79];
  if (!adapted || used[ch]) return ch;
  const table = [...BT_BANK.filter((x) => x % 2 === 0 && used[x]).sort((p, q) => p - q), ...BT_BANK.filter((x) => x % 2 === 1 && used[x]).sort((p, q) => p - q)];
  const N = table.length, Fd = (16 * k) % N;
  return table[(perm + e + Fd + Y2) % N];
}
// END HOP KERNEL

/* hop k of a link = the channel of the slot pair k (Central's packet; CLK advances 4 ticks per slot pair
   when we look only at the Central's transmissions, 2 per slot when both directions are drawn) */
const _hopCache = {};
function hopSeq(ulap, clk0, n, step = 2, used = null, key = '') {
  const id = ulap + ':' + clk0 + ':' + n + ':' + step + ':' + key;
  if (!_hopCache[id]) _hopCache[id] = Array.from({ length: n }, (_, i) => btHop(ulap, (clk0 + i * step) >>> 0, used));
  return _hopCache[id];
}
const fmtAddr = (ulap) => ulap.toString(16).toUpperCase().padStart(7, '0').replace(/(..)(?=.)/g, '$1:');

/* ---------------------------------------------------------------------
   2. The station wall: faint enamel tiles, a coloured frieze, a slow light.
   --------------------------------------------------------------------- */
let _wallTex = null;
function wallTexture() {
  if (_wallTex) return _wallTex;
  const c = makeCanvas(W, H), g = c.getContext('2d');
  const tw0 = 150, th0 = 75, ink = hexRGB(COL.ink);
  for (let row = 0, y = -20; y < H + th0; row++, y += th0) {
    const off = row % 2 ? tw0 / 2 : 0;
    for (let x = -tw0 + off; x < W + tw0; x += tw0) {
      const v = hash2(Math.round(x), row) - 0.5;
      /* tile face: a hair of shade per tile, a light upper bevel, a darker lower one */
      g.fillStyle = v > 0 ? `rgba(255,255,255,${0.10 * v})` : `rgba(${ink[0]},${ink[1]},${ink[2]},${-0.022 * v})`;
      g.fillRect(x + 2, y + 2, tw0 - 4, th0 - 4);
      g.fillStyle = 'rgba(255,255,255,0.38)'; g.fillRect(x + 4, y + 3, tw0 - 8, 2);
      g.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},0.025)`; g.fillRect(x + 4, y + th0 - 5, tw0 - 8, 2);
      /* grout */
      g.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},0.055)`;
      g.fillRect(x, y, tw0, 2); g.fillRect(x, y, 2, th0);
    }
  }
  _wallTex = c;
  return c;
}
window.drawBackdrop = function (ctx, t) {
  backdropBase(ctx); backdropFlush(ctx);
  ctx.drawImage(wallTexture(), 0, 0);
  /* the frieze: a band of the line colour low on the wall, under the platform's interface */
  ctx.fillStyle = rgba(COL.subject, 0.10); ctx.fillRect(0, 1548, W, 52);
  ctx.fillStyle = rgba(COL.subject, 0.16); ctx.fillRect(0, 1548, W, 5); ctx.fillRect(0, 1595, W, 5);
  /* light from a passing train: a soft band sweeping the wall every ~14 s */
  const ph = (t / 14) % 1, x = lerp(-700, W + 700, ph);
  const gr = ctx.createLinearGradient(x - 420, 0, x + 420, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.20)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
};

/* ---------------------------------------------------------------------
   3. The HUD: the chapters as stations on the line (replaces the stock bar).
   --------------------------------------------------------------------- */
window.drawHUD = function (ctx, t) {
  if (window.LOTTIESHEET || window.BLOCKS_MODE || window.TRANS_MODE) return;
  const n = SCENES.length;
  if (!n) return;
  const x0 = 96, x1 = 984, y = 302, gap = (x1 - x0) / Math.max(1, n - 1);
  let cur = 0;
  for (let i = 0; i < n; i++) if (t >= SCENES[i].t0) cur = i;
  const s = SCENES[cur];
  /* where the train is: at its station, gliding to the next across the scene change */
  const glide = cur < n - 1 ? E.io3(prog(t, s.t1 - 0.55, s.t1 + 0.25)) : 0;
  const pos = cur + glide, px = x0 + gap * pos;
  ctx.save();
  ctx.lineCap = 'round';
  line(ctx, x0, y, x1, y, rgba(COL.subject, 0.22), 7);
  line(ctx, x0, y, px, y, COL.subject, 7);
  for (let i = 0; i < n; i++) {
    const sx = x0 + gap * i, passed = i < pos - 0.01;
    dot(ctx, sx, y, 9.5, passed ? COL.subject : COL.panel);
    ring(ctx, sx, y, 9.5, passed ? COL.subject : rgba(COL.subject, 0.55), 3.5);
  }
  /* the train: a white ring with a blue core, breathing slightly */
  const br = 1 + 0.08 * Math.sin(t * 5.2);
  dot(ctx, px, y, 15 * br, COL.panel); ring(ctx, px, y, 15 * br, COL.subject, 5); dot(ctx, px, y, 6.5, COL.subject);
  /* labels: this station, and the next one */
  const nameOf = (i) => chapterName(SCENES[i].id);
  const a = cur === 0 ? 1 : clamp((t - s.t0) / 0.35);
  const fade = cur < n - 1 ? clamp((s.t1 - 0.2 - t) / 0.3) : 1;
  const wNow = text(ctx, 'NOW', x0 - 26, 344, { size: 22, weight: 600, family: F.mono, color: COL.dim, alpha: a * fade, ls: 2 });
  text(ctx, nameOf(cur), x0 - 26 + wNow + 12, 344, { size: 24, weight: 700, family: F.mono, color: COL.ink, alpha: a * fade, ls: 2 });
  if (cur < n - 1) {
    const nx = nameOf(cur + 1);
    const wN = measure(ctx, nx, 24, 700, F.mono, 2);
    text(ctx, nx, x1 + 26, 344, { size: 24, weight: 700, family: F.mono, color: COL.dim, alpha: a * fade * 0.9, ls: 2, align: 'right' });
    text(ctx, 'NEXT', x1 + 26 - wN - 12, 344, { size: 22, weight: 600, family: F.mono, color: COL.faint, alpha: a * fade, ls: 2, align: 'right' });
  }
  ctx.restore();
};
