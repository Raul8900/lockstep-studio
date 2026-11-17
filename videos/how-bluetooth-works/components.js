'use strict';
/* =====================================================================
   components.js — “How Bluetooth Works” (transit-map look)
   Drawing code shared by this video's scenes: the station-wall backdrop,
   the strip-map HUD, the real Bluetooth hop kernel, the carriage and café
   plans, the hop map, the split-flap board, packets and their code badges.
   Every function is a pure function of its arguments (and t): no
   Math.random(), no Date, no state carried from one frame to the next.
   Caches hold pure computations only (textures, hop sequences, layouts).
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

/* The example phones. Addresses are made up (locally administered: the 0x02 bit of the first byte
   is set, so they belong to no manufacturer). The kernel uses the low 4 bits of the UAP and the LAP. */
const PHONES = {
  you: { addr: 'DA:7E:12:5B:91:E3', lap: '5B91E3', ulap: (0x2 << 24) | 0x5B91E3, clk: 0x3A4F120 },
  nb:  { addr: '6E:A4:C7:9E:2B:47', lap: '9E2B47', ulap: (0x7 << 24) | 0x9E2B47, clk: 0x1D36AD4 },
};
/* slot k of a link (one slot = 625 µs = 2 ticks of the Bluetooth clock); cached, pure */
const _hopCache = {};
function hopAt(ph, k, used, key) {
  const id = ph.ulap + ':' + ph.clk + ':' + (key || '');
  let c = _hopCache[id];
  if (!c) c = _hopCache[id] = {};
  if (c[k] === undefined) c[k] = btHop(ph.ulap, (ph.clk + 2 * k) >>> 0, used);
  return c[k];
}
/* everyone else in the carriage: their own (made-up) addresses and clocks */
const CROWD_PHONES = (() => {
  const r = rng(9091), out = [];
  for (let i = 0; i < 48; i++) out.push({ ulap: Math.floor(r() * 0x0fffffff), clk: Math.floor(r() * 0x0ffffff0) & ~3 });
  return out;
})();
const mhz = (ch) => 2402 + ch;
/* the Wi-Fi network of the café: 2.4 GHz channel 6, 2427–2447 MHz = Bluetooth channels 25..44 */
const WIFI6 = { c0: 25, c1: 44 };
const AFH_MAP = Array.from({ length: 79 }, (_, ch) => ch < WIFI6.c0 || ch > WIFI6.c1);

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
      g.fillStyle = v > 0 ? `rgba(255,255,255,${0.10 * v})` : `rgba(${ink[0]},${ink[1]},${ink[2]},${-0.02 * v})`;
      g.fillRect(x + 2, y + 2, tw0 - 4, th0 - 4);
      g.fillStyle = 'rgba(255,255,255,0.36)'; g.fillRect(x + 4, y + 3, tw0 - 8, 2);
      g.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},0.022)`; g.fillRect(x + 4, y + th0 - 5, tw0 - 8, 2);
      g.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},0.048)`;
      g.fillRect(x, y, tw0, 2); g.fillRect(x, y, 2, th0);
    }
  }
  _wallTex = c;
  return c;
}
window.drawBackdrop = function (ctx, t) {
  backdropBase(ctx); backdropFlush(ctx);
  ctx.drawImage(wallTexture(), 0, 0);
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
  const glide = cur < n - 1 ? E.io3(prog(t, s.t1 - 0.55, s.t1 + 0.25)) : 0;
  const pos = cur + glide, px = x0 + gap * pos;
  ctx.save();
  ctx.lineCap = 'round';
  fillRR(ctx, 44, 270, 992, 94, 16, rgba(COL.panel, 0.94));
  strokeRR(ctx, 44, 270, 992, 94, 16, rgba(COL.ink, 0.14), 2);
  line(ctx, x0, y, x1, y, rgba(COL.subject, 0.22), 7);
  line(ctx, x0, y, px, y, COL.subject, 7);
  for (let i = 0; i < n; i++) {
    const sx = x0 + gap * i, passed = i < pos - 0.01;
    dot(ctx, sx, y, 9.5, passed ? COL.subject : COL.panel);
    ring(ctx, sx, y, 9.5, passed ? COL.subject : rgba(COL.subject, 0.55), 3.5);
  }
  const br = 1 + 0.08 * Math.sin(t * 5.2);
  dot(ctx, px, y, 15 * br, COL.panel); ring(ctx, px, y, 15 * br, COL.subject, 5); dot(ctx, px, y, 6.5, COL.subject);
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

/* ---------------------------------------------------------------------
   4. Signage helpers
   --------------------------------------------------------------------- */
const GREY = {
  floor: () => mixToHex(COL.panel, COL.ink, 0.03),
  seat: () => mixToHex(COL.panel, COL.ink, 0.12),
  body: () => mixToHex(COL.ink, COL.bgMid, 0.80),
  head: () => mixToHex(COL.ink, COL.bgMid, 0.5),
  wall: () => mixToHex(COL.ink, COL.bgMid, 0.25),
  link: () => mixToHex(COL.ink, COL.bgMid, 0.62),
  board: () => mixToHex(COL.ink, COL.bgMid, 0.04),
  cell: () => mixToHex(COL.ink, COL.panel, 0.10),
};
/* a station-name sign: white enamel with an ink border (or ink with white type: o.dark) */
function signPlate(ctx, str, cx, cy, o = {}) {
  const { size = 34, weight = 700, family = F.disp, ls = 3, dark = false, color = null, padX = 28, h = null, alpha = 1, bar = null, align = 'center' } = o;
  if (alpha <= 0.003) return 0;
  const tw0 = measure(ctx, str, size, weight, family, ls), w = tw0 + padX * 2, hh = h || Math.round(size * 1.9);
  const x0 = align === 'center' ? cx - w / 2 : align === 'right' ? cx - w : cx;
  withAlpha(ctx, alpha, () => {
    fillRR(ctx, x0, cy - hh / 2, w, hh, 10, dark ? COL.ink : COL.panel);
    if (!dark) strokeRR(ctx, x0, cy - hh / 2, w, hh, 10, COL.ink, 3);
    if (bar) fillRR(ctx, x0 + 10, cy + hh / 2 - 9, w - 20, 5, 2.5, bar);
    text(ctx, str, x0 + w / 2, cy + size * 0.35, { size, weight, family, ls, align: 'center', color: color || (dark ? COL.panel : COL.ink) });
  });
  return w;
}
/* a line badge: the round bullet that names a metro line (here: a link's code) */
function lineBadge(ctx, cx, cy, r, label, color, o = {}) {
  const { alpha = 1, size = null, ring2 = true } = o;
  withAlpha(ctx, alpha, () => {
    dot(ctx, cx, cy, r, color);
    if (ring2) ring(ctx, cx, cy, r + 5, color, 3, 0.35);
    if (label) {
      const sz = size || fitSize(ctx, label, r * 1.55, r * 0.62, 700, F.mono);
      text(ctx, label, cx, cy + sz * 0.36, { size: sz, weight: 700, family: F.mono, color: COL.onAccent, align: 'center' });
    }
  });
}
/* a small pictogram disk: an icon in a filled circle, as on wayfinding signs */
function pictoDisk(ctx, name, cx, cy, r, color, o = {}) {
  const { alpha = 1, fill = color, ink = COL.onAccent, lw = 2 } = o;
  withAlpha(ctx, alpha, () => { dot(ctx, cx, cy, r, fill); icon(ctx, name, cx, cy, r * 1.15, ink, { lw }); });
}

/* ---------------------------------------------------------------------
   5. People in plan view (seen from above, facing −y before rotation)
   --------------------------------------------------------------------- */
function person(ctx, x, y, ang, s, o = {}) {
  const { bud = null, phone = null, alpha = 1, budR = 5.2, glowBud = 0, white = false } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(0, 7, 31, 15.5, 0, 0, TAU); ctx.fillStyle = GREY.body(); ctx.fill();
  if (phone) {
    dot(ctx, -9, -19, 5, GREY.body()); dot(ctx, 9, -19, 5, GREY.body());
    fillRR(ctx, -12, -33, 24, 13, 3.5, COL.panel); strokeRR(ctx, -12, -33, 24, 13, 3.5, phone, 2.6);
  }
  dot(ctx, 0, 0, 15, GREY.head());
  if (white) {
    for (const sx of [-16, 16]) { dot(ctx, sx, 0, budR, COL.panel); ring(ctx, sx, 0, budR, GREY.wall(), 1.8); }
  } else if (bud) {
    if (glowBud > 0) { ring(ctx, -16, 0, 9 + 6 * glowBud, bud, 2, 0.5 * glowBud); ring(ctx, 16, 0, 9 + 6 * glowBud, bud, 2, 0.5 * glowBud); }
    dot(ctx, -16, 0, budR, bud); dot(ctx, 16, 0, budR, bud);
  }
  ctx.restore();
}
/* world positions of a person's phone and earbuds (for links and packets) */
function personPts(P, s = 1) {
  const c = Math.cos(P.ang), sn = Math.sin(P.ang), tr = (lx, ly) => [P.x + (lx * c - ly * sn) * s * P.s, P.y + (lx * sn + ly * c) * s * P.s];
  return { phone: tr(0, -27), budL: tr(-16, 0), budR: tr(16, 0), head: tr(0, 0) };
}
/* a person's own little network: a dashed ring around phone and earbuds, slowly turning */
function piconet(ctx, x, y, r, color, t, o = {}) {
  const { alpha = 1, lw = 2.2, fillA = 0, dash = true, phase = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  if (fillA > 0) dot(ctx, x, y, r, rgba(color, fillA));
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  if (dash) { ctx.setLineDash([7, 6]); ctx.lineDashOffset = -(t * 14 + phase * 13); }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
  ctx.restore();
}

/* ---------------------------------------------------------------------
   6. The carriage (plan view). Local units: the car is 600 wide inside,
      shown 880 long, centred on (0, 0); `o.cx, o.cy, o.s` place it.
   --------------------------------------------------------------------- */
const CAR = (() => {
  const r = rng(2718), P = [];
  const seatYs = [-404, -342, -170, -106, -42, 22, 86, 150, 342, 404];
  for (const side of [-1, 1]) {
    for (const y of seatYs) {
      if (P.length >= (side < 0 ? 9 : 18)) break;
      if (side < 0 && y === -42) continue;              // keep the rows tidy: 9 a side
      P.push({ x: side * 252, y, ang: side < 0 ? Math.PI / 2 : -Math.PI / 2, s: 0.92, seat: true, ph: r() });
    }
  }
  const cols = [-138, -8, 124];
  for (let row = 0; row < 8; row++) {
    for (let c = 0; c < 3; c++) {
      if (P.length >= 40) break;
      const jx = (r() - 0.5) * 46, jy = (r() - 0.5) * 34;
      const y = -392 + row * 112 + jy + (c === 1 ? 40 : 0);
      if (Math.abs(y - 250) < 46 && c !== 1 && Math.abs(jx) < 10) continue;
      P.push({ x: cols[c] + jx, y, ang: (r() - 0.5) * TAU, s: 0.95 + r() * 0.08, seat: false, ph: r() });
    }
  }
  while (P.length < 40) P.push({ x: -8 + (P.length % 2 ? 60 : -60), y: 420 - (P.length % 3) * 40, ang: r() * TAU, s: 0.95, seat: false, ph: r() });
  /* you: the left bench, middle; your neighbour: the next seat */
  const you = P.findIndex((p) => p.seat && p.x < 0 && p.y === 22);
  const nb = P.findIndex((p) => p.seat && p.x < 0 && p.y === 86);
  P.forEach((p, i) => { p.i = i; p.phone = CROWD_PHONES[i]; });
  return { P, you, nb, poles: [[-70, -300], [70, -300], [-70, 300], [70, 300], [0, -60], [0, 180]] };
})();
/* a person's position in screen space for a given carriage placement */
function carPerson(i, o = {}) {
  const { cx = 540, cy = 800, s = 1 } = o, p = CAR.P[i];
  return { x: cx + p.x * s, y: cy + p.y * s, ang: p.ang, s: p.s * s, i };
}
function carriage(ctx, t, o = {}) {
  const { cx = 540, cy = 800, s = 1, doors = 1, people = 1, bub = null, alpha = 1, swayAmp = 1.5 } = o;
  if (alpha <= 0.003) return;
  const dy = Math.sin(t * 1.3) * swayAmp, dx = Math.sin(t * 0.9 + 1) * swayAmp * 0.7;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.translate(cx + dx, cy + dy); ctx.scale(s, s);
  const hw = 300, hl = 420;
  /* floor */
  fillRR(ctx, -hw, -hl, hw * 2, hl * 2, 22, GREY.floor());
  /* benches (left and right), interrupted at the door bays */
  const bays = [-250, 250];
  for (const side of [-1, 1]) {
    for (const [a, b] of [[-hl + 10, bays[0] - 70], [bays[0] + 70, bays[1] - 70], [bays[1] + 70, hl - 10]]) {
      fillRR(ctx, side < 0 ? -hw + 6 : hw - 70, a, 64, b - a, 10, GREY.seat());
    }
  }
  /* poles */
  for (const [px, py] of CAR.poles) { dot(ctx, px, py, 7, GREY.wall()); dot(ctx, px, py, 3, COL.panel); }
  /* walls with windows and door bays */
  const wall = GREY.wall();
  for (const side of [-1, 1]) {
    const x = side * hw;
    let y = -hl;
    for (const by of bays) {
      line(ctx, x, y, x, by - 62, wall, 9);
      y = by + 62;
    }
    line(ctx, x, y, x, hl, wall, 9);
    /* windows: pale blue panes set into the wall */
    for (const [a, b] of [[-hl + 30, bays[0] - 90], [bays[0] + 90, bays[1] - 90], [bays[1] + 90, hl - 30]]) {
      line(ctx, x + side * 1, a, x + side * 1, b, rgba(COL.subject, 0.28), 5);
    }
    /* door leaves: closed = they meet at the bay's centre; open = slid into the wall */
    for (const by of bays) {
      const gap = 58 * (1 - clamp(doors));
      line(ctx, x, by - 60, x, by - gap, wall, 7, 0.9);
      line(ctx, x, by + gap, x, by + 60, wall, 7, 0.9);
      line(ctx, x - side * 16, by - 54, x - side * 16, by + 54, rgba(COL.ink, 0.10), 6);
    }
  }
  /* break lines where the plan is cut */
  for (const yy of [-hl, hl]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push([-hw - 14 + i * ((hw * 2 + 28) / 12), yy + (i % 2 ? 7 : -7) * Math.sign(yy)]);
    polyline(ctx, pts, rgba(COL.ink, 0.35), 2.5);
  }
  ctx.restore();
  /* people and their networks are drawn in screen space so callers can highlight them */
  if (people > 0.003) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha);
    const place = { cx: cx + dx, cy: cy + dy, s };
    const order = CAR.P.map((p, i) => i);
    for (const i of order) {
      const P = carPerson(i, place), p = CAR.P[i];
      const b = bub ? bub(i, P) : null;
      if (b && b.ring !== false) {
        const pp = personPts(P, 1);
        const rx = (pp.phone[0] + pp.head[0]) / 2, ry = (pp.phone[1] + pp.head[1]) / 2, rr0 = (b.r || 44) * P.s, ba = (b.alpha == null ? 1 : b.alpha) * people;
        piconet(ctx, rx, ry, rr0, b.color, t, { alpha: ba, lw: b.lw || 2.2, fillA: b.fillA || 0, phase: i, dash: b.dash !== false });
        if (b.orbit !== false) {
          const ang = t * (1.6 + (i % 5) * 0.21) * (i % 2 ? 1 : -1) + i * 2.1;
          dot(ctx, rx + Math.cos(ang) * rr0, ry + Math.sin(ang) * rr0, 3.6 * P.s, b.color, ba);
        }
      }
      const bob0 = p.seat ? 0 : Math.sin(t * 1.7 + p.ph * TAU) * 1.4;
      const plain = !b || b.plain;
      person(ctx, P.x, P.y + bob0, P.ang, P.s, { white: plain, bud: plain ? null : b.bud || b.color, phone: plain ? GREY.link() : b.phone || b.color, alpha: people, glowBud: b ? b.glow || 0 : 0 });
    }
    ctx.restore();
  }
  return { cx: cx + dx, cy: cy + dy, s };
}
/* tiny packets running from a person's phone to their earbuds and back (zoomed-in views) */
function linkTraffic(ctx, P, color, t, o = {}) {
  const { alpha = 1, rate = 1.6, size = 3.4, phase = 0 } = o;
  const pp = personPts(P, 1);
  for (const bud of [pp.budL, pp.budR]) {
    const mid = [(pp.phone[0] + bud[0]) / 2 + (bud[1] - pp.phone[1]) * 0.25, (pp.phone[1] + bud[1]) / 2 - (bud[0] - pp.phone[0]) * 0.25];
    const pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([lerp(lerp(pp.phone[0], mid[0], u), lerp(mid[0], bud[0], u), u), lerp(lerp(pp.phone[1], mid[1], u), lerp(mid[1], bud[1], u), u)]); }
    polyline(ctx, pts, rgba(color, 0.45 * alpha), 1.6 * P.s);
    for (let j = 0; j < 3; j++) {
      const u = ((t * rate + j / 3 + phase) % 1 + 1) % 1;
      const q = polyAt(pts, polyLen(pts) * u);
      dot(ctx, q[0], q[1], size * P.s, color, alpha * Math.sin(Math.PI * u));
    }
  }
}

/* ---------------------------------------------------------------------
   7. The band ruler: 2400–2483.5 MHz across the frame
   --------------------------------------------------------------------- */
const BAND = { x0: 104, x1: 976, f0: 2400, f1: 2483.5 };
const fx = (f) => BAND.x0 + (f - BAND.f0) / (BAND.f1 - BAND.f0) * (BAND.x1 - BAND.x0);
const chX = (ch) => fx(2402 + ch);
function bandRuler(ctx, y, o = {}) {
  const { p = 1, labels = 1, ticks = 0, tickH = 22, alpha = 1 } = o;
  withAlpha(ctx, alpha, () => {
    const x1 = lerp(BAND.x0, BAND.x1, E.io3(clamp(p)));
    line(ctx, BAND.x0, y, x1, y, COL.ink, 5);
    for (const f of [2400, 2420, 2440, 2460, 2480]) {
      const x = fx(f);
      if (x > x1 + 1) continue;
      line(ctx, x, y - 12, x, y + 12, COL.ink, 3);
      text(ctx, String(f), x, y + 46, { size: 26, weight: 600, family: F.mono, color: COL.dim, align: 'center', alpha: labels });
    }
    text(ctx, 'MHz', BAND.x1, y - 22, { size: 24, weight: 600, family: F.mono, color: COL.dim, align: 'right', alpha: labels });
    if (ticks > 0) {
      for (let ch = 0; ch < 79; ch++) {
        const k = clamp(ticks * 79 - ch);
        if (k <= 0) break;
        const x = chX(ch);
        line(ctx, x, y - 5 - tickH * E.out3(k), x, y - 5, COL.subject, 3, 0.9);
      }
    }
  });
}

/* ---------------------------------------------------------------------
   8. The hop map: 79 tracks across (2402 → 2480 MHz), time running down.
      A link is a metro line through one station per slot.
   --------------------------------------------------------------------- */
const MAP = { x0: 70, x1: 1010, y0: 404, y1: 1196, top: 498, nowY: 572, rowH: 58 };
function mapPanel(ctx, t, o = {}) {
  const { alpha = 1, tracks = 1, labels = 1, now = 1, block = null, closed = 0, tally = null, slowTag = null, nowLabel = 'NOW' } = o;
  withAlpha(ctx, alpha, () => {
    fillRR(ctx, MAP.x0, MAP.y0, MAP.x1 - MAP.x0, MAP.y1 - MAP.y0, 14, COL.panel);
    strokeRR(ctx, MAP.x0, MAP.y0, MAP.x1 - MAP.x0, MAP.y1 - MAP.y0, 14, COL.ink, 3);
    /* the café's Wi-Fi: a block of channels, red for all time; hatched once closed */
    if (block && block.p > 0) {
      const xa = chX(block.c0) - 6, xb = chX(block.c1) + 6, ya = MAP.top, yb = lerp(ya, MAP.y1 - 10, E.io3(clamp(block.p)));
      fillRR(ctx, xa, ya, xb - xa, yb - ya, 6, rgba(COL.alert, 0.10 + 0.04 * Math.sin(t * 3)));
      strokeRR(ctx, xa, ya, xb - xa, yb - ya, 6, rgba(COL.alert, 0.55), 2.5);
      if (closed > 0) {
        ctx.save(); rr(ctx, xa, ya, xb - xa, yb - ya, 6); ctx.clip();
        ctx.strokeStyle = rgba(COL.ink, 0.16 * clamp(closed)); ctx.lineWidth = 3;
        for (let k = -20; k < 40; k++) { const x = xa + k * 22; ctx.beginPath(); ctx.moveTo(x, ya); ctx.lineTo(x + (yb - ya), yb); ctx.stroke(); }
        ctx.restore();
      }
    }
    /* tracks */
    for (let ch = 0; ch < 79; ch++) {
      const x = chX(ch), k = clamp(tracks * 1.3 - (ch / 79) * 0.3);
      if (k <= 0) continue;
      const shut = block && closed > 0 && ch >= block.c0 && ch <= block.c1;
      const major = ch % 10 === 0;
      line(ctx, x, MAP.top, x, lerp(MAP.top, MAP.y1 - 10, E.io3(k)), shut ? rgba(COL.alert, 0.18) : rgba(COL.ink, major ? 0.16 : 0.08), major ? 2 : 1.5);
    }
    /* axis labels */
    withAlpha(ctx, labels, () => {
      text(ctx, 'CHANNEL', MAP.x0 + 26, MAP.y0 + 44, { size: 24, weight: 700, family: F.mono, color: COL.dim, ls: 2 });
      text(ctx, '2402 MHz', chX(0) - 2, MAP.top - 16, { size: 24, weight: 600, family: F.mono, color: COL.ink, align: 'left' });
      text(ctx, '2480 MHz', chX(78) + 2, MAP.top - 16, { size: 24, weight: 600, family: F.mono, color: COL.ink, align: 'right' });
      if (slowTag) pill(ctx, slowTag.str, MAP.x1 - 22, MAP.y0 + 32, { size: 22, bg: slowTag.bg || COL.data, color: COL.onAccent, align: 'right', alpha: slowTag.alpha == null ? 1 : slowTag.alpha, h: 34 });
    });
    /* tally bars: failures counted per channel (AFH keeping score) */
    if (tally) {
      for (let ch = 0; ch < 79; ch++) {
        const v = tally(ch);
        if (v <= 0.01) continue;
        const x = chX(ch);
        fillRR(ctx, x - 4, MAP.top - 8 - 40 * v, 8, 40 * v, 3, ch >= WIFI6.c0 && ch <= WIFI6.c1 ? COL.alert : COL.faint);
      }
    }
    /* the NOW line */
    if (now > 0) {
      ctx.save(); ctx.setLineDash([10, 8]);
      line(ctx, MAP.x0 + 14, MAP.nowY, MAP.x1 - 14, MAP.nowY, rgba(COL.ink, 0.55 * now), 2.5);
      ctx.restore();
      if (nowLabel) pill(ctx, nowLabel, MAP.x0 + 18, MAP.nowY, { size: 20, bg: COL.ink, color: COL.panel, align: 'left', alpha: now, h: 32 });
    }
  });
}
/* y of slot k when slot position s sits on the NOW line */
const slotY = (k, s, rowH = MAP.rowH, nowY = MAP.nowY) => nowY + (k - s) * rowH;
/* fade with distance above NOW (the past) and near the bottom edge */
function mapFade(y) { return clamp((y - MAP.top + 6) / 70) * clamp((MAP.y1 - 14 - y) / 40); }
/* one link drawn as a metro line; seq(k) gives the channel of slot k.
   Returns the screen position of each visible station (for markers and effects). */
function mapLine(ctx, seq, s, o = {}) {
  const { color = COL.subject, lw = 7, alpha = 1, rowH = MAP.rowH, stations = true, k0 = null, k1 = null, cap = 0.3, upto = 1e9, fade = true } = o;
  if (alpha <= 0.003) return [];
  const kMin = Math.max(k0 == null ? -1e9 : k0, Math.floor(s - (MAP.nowY - MAP.top + 40) / rowH) - 1);
  const kMax = Math.min(k1 == null ? 1e9 : k1, Math.ceil(s + (MAP.y1 - MAP.nowY) / rowH) + 1, Math.floor(upto));
  const out = [];
  if (kMax < kMin) return out;
  const d = rowH * cap;
  const ga = ctx.globalAlpha;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (rowH < 5) {
    /* compressed time: one polyline through every slot (a mesh) */
    ctx.beginPath();
    for (let k = kMin; k <= kMax; k++) {
      const x = chX(seq(k)), y = slotY(k, s, rowH);
      if (k === kMin) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = ga * alpha * 0.9; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.2, lw * 0.32); ctx.stroke();
    ctx.globalAlpha = ga;
    return out;
  }
  for (let k = kMin; k <= kMax; k++) {
    const x = chX(seq(k)), y = slotY(k, s, rowH);
    const a = alpha * (fade ? mapFade(y) : 1);
    if (k < kMax) {
      const x2 = chX(seq(k + 1)), y2 = slotY(k + 1, s, rowH), ym = (y + y2) / 2;
      const a2 = alpha * (fade ? mapFade(ym) : 1);
      if (a2 > 0.003) {
        const rad = Math.min(9, Math.abs(x2 - x) / 2, rowH * 0.2);
        ctx.beginPath(); ctx.moveTo(x, y + d);
        if (Math.abs(x2 - x) < 1) ctx.lineTo(x2, y2 - d);
        else { ctx.arcTo(x, ym, x2, ym, rad); ctx.arcTo(x2, ym, x2, y2 - d, rad); ctx.lineTo(x2, y2 - d); }
        ctx.globalAlpha = ga * a2; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
      }
    }
    if (a > 0.003) {
      ctx.globalAlpha = ga * a;
      if (stations) {
        fillRR(ctx, x - lw * 0.95, y - d, lw * 1.9, 2 * d, lw * 0.95, COL.panel);
        strokeRR(ctx, x - lw * 0.95, y - d, lw * 1.9, 2 * d, lw * 0.95, color, Math.max(2.5, lw * 0.5));
      } else line(ctx, x, y - d, x, y + d, color, lw);
    }
    out.push({ k, x, y, ch: seq(k), a });
  }
  ctx.globalAlpha = ga;
  return out;
}
/* the station on the NOW line: index, x, and how far we are into it */
function mapNow(seq, s) {
  const k = Math.round(s), into = s - (k - 0.5);
  const xPrev = chX(seq(k - 1)), x = chX(seq(k));
  return { k, ch: seq(k), x: lerp(xPrev, x, E.out3(clamp(into / 0.2))), into };
}
/* phone and earbud markers riding the NOW line */
function nowMarkers(ctx, x, y, o = {}) {
  const { alpha = 1, color = COL.subject, lock = 0, phone = true, bud = true, split = 34 } = o;
  withAlpha(ctx, alpha, () => {
    if (phone) {
      const px = x - split;
      fillRR(ctx, px - 13, y - 50, 26, 42, 6, COL.panel); strokeRR(ctx, px - 13, y - 50, 26, 42, 6, color, 3.5);
      line(ctx, px - 5, y - 15, px + 5, y - 15, color, 2.5);
    }
    if (bud) {
      const bx = x + split;
      dot(ctx, bx, y - 38, 11, COL.panel); ring(ctx, bx, y - 38, 11, color, 3.5);
      fillRR(ctx, bx - 4, y - 31, 8, 22, 4, color);
    }
    if (lock > 0) ring(ctx, x, y, 14 + 18 * lock, COL.good, 4, 1 - lock);
  });
}
/* a burst where two links hit the same station */
function clashBurst(ctx, x, y, p, o = {}) {
  if (p <= 0 || p >= 1) return;
  const { r = 70, color = COL.alert } = o;
  const e = E.out3(p), a = 1 - p;
  ring(ctx, x, y, r * e, color, 6 * a + 1, a);
  for (let i = 0; i < 10; i++) {
    const ang = i * TAU / 10 + 0.3, r0 = r * 0.35 * e, r1 = r * (0.6 + 0.5 * e);
    line(ctx, x + Math.cos(ang) * r0, y + Math.sin(ang) * r0, x + Math.cos(ang) * r1, y + Math.sin(ang) * r1, color, 5 * a + 1, a);
  }
  dot(ctx, x, y, 16 * (1 - p * 0.5), color, a);
}

/* ---------------------------------------------------------------------
   9. The split-flap board (the hop timetable)
   --------------------------------------------------------------------- */
const FLAP = { cw: 34, ch: 50, gap: 4 };
/* one flap cell showing `cur`; it flipped from `prev` at time tc (pure: both are passed in) */
function flapCell(ctx, x, y, cur, prev, t, tc, o = {}) {
  const { cw = FLAP.cw, chh = FLAP.ch, color = COL.panel, size = 34, dur = 0.16 } = o;
  const bg = GREY.cell(), hinge = y + chh / 2;
  fillRR(ctx, x, y, cw, chh, 5, bg);
  const draw = (ch, clipY0, clipY1, sy) => {
    if (!ch || ch === ' ') return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, clipY0, cw, clipY1 - clipY0); ctx.clip();
    ctx.translate(0, hinge); ctx.scale(1, sy); ctx.translate(0, -hinge);
    text(ctx, ch, x + cw / 2, hinge + size * 0.36, { size, weight: 700, family: F.mono, color, align: 'center' }); // lint-ignore text-overlap
    ctx.restore();
  };
  const p = clamp((t - tc) / dur);
  if (p >= 1 || prev === cur) { draw(cur, y, y + chh, 1); }
  else {
    /* top half: new char behind, old top half falling; bottom half: old char, new bottom half landing */
    draw(cur, y, hinge, 1);
    draw(prev, hinge, y + chh, 1);
    if (p < 0.5) draw(prev, y, hinge, 1 - p * 2);
    else draw(cur, hinge, y + chh, (p - 0.5) * 2);
  }
  line(ctx, x, hinge, x + cw, hinge, rgba(COL.ink, 0.85), 2);
}
function flapRow(ctx, x, y, cur, prev, t, tc, o = {}) {
  const { cw = FLAP.cw, gap = FLAP.gap, colors = null, stagger = 0.008 } = o;
  for (let i = 0; i < cur.length; i++) {
    flapCell(ctx, x + i * (cw + gap), y, cur[i], prev ? prev[i] : cur[i], t, tc + i * stagger, Object.assign({}, o, { color: colors ? colors(i) : (o.color || COL.panel) }));
  }
  return cur.length * (cw + gap) - gap;
}
/* the timetable board: rows of upcoming hops for a link, flipping as the slots go by */
function timetable(ctx, t, x, y, o = {}) {
  const { ph = PHONES.you, s = 0, sAt = null, rows = 5, title = 'TIMETABLE', alpha = 1, w = 940, p = 1, used = null, key = '', cw = 34, chh = 50, size = 34, rowGap = 12 } = o;
  if (alpha <= 0.003) return;
  const k0 = Math.round(s);
  /* when did slot k0 begin (so the flaps know when to flip)? sAt(k) inverts the scroll */
  const tc = sAt ? sAt(k0 - 0.5) : t;
  const fmtRow = (k, i) => {
    const when = i === 0 ? '   NOW' : '+' + (i * 0.625).toFixed(3);
    const ch = hopAt(ph, k, used, key);
    return when + '  ' + String(ch).padStart(2, '0') + '  ' + mhz(ch);
  };
  const h = 92 + rows * (chh + rowGap);
  withAlpha(ctx, alpha * clamp(p * 3), () => {
    const yy = y + (1 - E.out3(clamp(p))) * 40;
    fillRR(ctx, x, yy, w, h, 14, GREY.board());
    text(ctx, title, x + 28, yy + 48, { size: 30, weight: 700, family: F.disp, color: COL.panel, ls: 4 });
    text(ctx, 'WHEN (ms)', x + 28 + 3 * (cw + FLAP.gap), yy + 80, { size: 20, weight: 600, family: F.mono, color: rgba(COL.panel, 0.65), align: 'center' });
    text(ctx, 'CH', x + 28 + 9 * (cw + FLAP.gap), yy + 80, { size: 20, weight: 600, family: F.mono, color: rgba(COL.panel, 0.65), align: 'center' });
    text(ctx, 'MHz', x + 28 + 14 * (cw + FLAP.gap), yy + 80, { size: 20, weight: 600, family: F.mono, color: rgba(COL.panel, 0.65), align: 'center' });
    for (let i = 0; i < rows; i++) {
      const ry = yy + 92 + i * (chh + rowGap);
      const cur = fmtRow(k0 + i, i), prev = fmtRow(k0 + i - 1, i);
      const lit = i === 0;
      flapRow(ctx, x + 28, ry, cur, prev, t, tc + i * 0.03, {
        cw, chh, size, colors: (j) => (j >= 8 && j <= 9 ? mixHex(COL.accent, COL.panel, lit ? 0.12 : 0.35) : rgba(COL.panel, lit ? 1 : 0.78)),
      });
      if (lit) fillRR(ctx, x + 10, ry + 8, 8, chh - 16, 4, COL.accent);
    }
  });
}

/* ---------------------------------------------------------------------
   10. Packets, badges and the earbud gate
   --------------------------------------------------------------------- */
/* a packet as a capsule: badge (access code) at the front, a header, the music payload */
function packetCapsule(ctx, cx, cy, w, h, o = {}) {
  const { color = COL.subject, code = '', alpha = 1, garble = 0, t = 0, labels = 0, crack = 0 } = o;
  if (alpha <= 0.003) return null;
  const x0 = cx - w / 2, y0 = cy - h / 2;
  const px0 = x0 + h * 0.55 + w * 0.2, px1 = x0 + w - h * 1.15;
  withAlpha(ctx, alpha, () => {
    fillRR(ctx, x0, y0, w, h, h / 2, COL.panel);
    strokeRR(ctx, x0, y0, w, h, h / 2, color, 5);
    /* payload: music bars (or scrambled when garbled) */
    const n = Math.max(6, Math.floor((px1 - px0) / 18));
    for (let i = 0; i < n; i++) {
      const bx = px0 + i * (px1 - px0) / n;
      const base = 0.35 + 0.55 * Math.abs(Math.sin(i * 1.7 + 0.6));
      const g = garble > 0 ? hash2(i, Math.floor(t * 18)) : 0;
      const hh = h * 0.56 * lerp(base, g, clamp(garble));
      fillRR(ctx, bx, cy - hh / 2 + (garble > 0 ? (g - 0.5) * 14 * garble : 0), 9, hh, 4.5, garble > 0.5 ? COL.alert : COL.data);
    }
    /* header block */
    fillRR(ctx, x0 + h * 0.55, cy - h * 0.22, w * 0.16, h * 0.44, 6, mixHex(COL.ink, COL.panel, 0.84));
    if (crack > 0) {
      polyline(ctx, [[cx - w * 0.05, y0 - 4], [cx + w * 0.02, cy - h * 0.1], [cx - w * 0.04, cy + h * 0.15], [cx + w * 0.03, y0 + h + 4]], COL.alert, 5, clamp(crack));
    }
  });
  /* badge at the front (right end) */
  const bx = x0 + w - h / 2;
  lineBadge(ctx, bx, cy, h * 0.42, code, color, { alpha, size: Math.max(24, Math.min(h * 0.26, fitSize(ctx, code, h * 0.42 * 1.55, h * 0.42 * 0.62, 700, F.mono))) });
  if (labels > 0) {
    withAlpha(ctx, alpha * labels, () => {
      text(ctx, 'ACCESS CODE', bx, y0 - 22, { size: 24, weight: 700, family: F.mono, color, align: 'center', ls: 1.5 });
      text(ctx, 'HEADER', x0 + h * 0.55 + w * 0.08, y0 + h + 40, { size: 24, weight: 600, family: F.mono, color: COL.dim, align: 'center', ls: 1.5 });
      text(ctx, 'MUSIC', (px0 + px1) / 2, y0 + h + 40, { size: 24, weight: 700, family: F.mono, color: COL.data, align: 'center', ls: 1.5 });
    });
  }
  return { bx, by: cy, br: h * 0.42 };
}
/* a small packet token (in transit): a capsule with a dot badge */
function packetToken(ctx, x, y, s, color, o = {}) {
  const { alpha = 1, ang = 0 } = o;
  if (alpha <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  fillRR(ctx, -26, -11, 52, 22, 11, COL.panel); strokeRR(ctx, -26, -11, 52, 22, 11, color, 4);
  dot(ctx, 15, 0, 7, color);
  ctx.restore();
}
/* the earbud as a station with sliding doors: open = 0..1 */
function earbudGate(ctx, cx, cy, o = {}) {
  const { open = 0, alpha = 1, color = COL.subject, s = 1, verdict = null, vp = 0 } = o;
  withAlpha(ctx, alpha, () => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    /* the earbud: a round bud and its stem */
    dot(ctx, -150, -10, 92, COL.panel); ring(ctx, -150, -10, 92, COL.ink, 6);
    dot(ctx, -150, -10, 46, rgba(color, 0.16)); ring(ctx, -150, -10, 46, color, 6);
    fillRR(ctx, -184, 60, 68, 190, 34, COL.panel); strokeRR(ctx, -184, 60, 68, 190, 34, COL.ink, 6);
    /* the platform doors in front of it */
    const gw = 66 * (1 - E.io3(clamp(open)));
    fillRR(ctx, 6, -112, 40, 224, 8, GREY.seat()); strokeRR(ctx, 6, -112, 40, 224, 8, COL.ink, 4);
    fillRR(ctx, 46 + 66 - gw, -112, gw, 108, 4, rgba(COL.subject, 0.14)); strokeRR(ctx, 46 + 66 - gw, -112, gw, 108, 4, COL.ink, 4);
    fillRR(ctx, 46 + 66 - gw, 4, gw, 108, 4, rgba(COL.subject, 0.14)); strokeRR(ctx, 46 + 66 - gw, 4, gw, 108, 4, COL.ink, 4);
    fillRR(ctx, 112, -112, 40, 224, 8, GREY.seat()); strokeRR(ctx, 112, -112, 40, 224, 8, COL.ink, 4);
    ctx.restore();
    if (verdict && vp > 0) {
      const vx = cx + 79 * s, vy = cy - 160 * s;
      dot(ctx, vx, vy, 40 * E.outBack(clamp(vp)), verdict === 'ok' ? COL.good : COL.alert);
      if (verdict === 'ok') check(ctx, vx, vy, 36, COL.onAccent, clamp(vp * 1.5), 8);
      else cross(ctx, vx, vy, 14, COL.onAccent, clamp(vp * 1.5), 8);
    }
  });
}

/* ---------------------------------------------------------------------
   11. The café (plan view)
   --------------------------------------------------------------------- */
const CAFE = (() => {
  const r = rng(515), T = [];
  const spots = [[-250, -120], [40, -150], [-210, 150], [90, 120], [300, 40], [-60, 360], [260, 330]];
  for (const [x, y] of spots) {
    const n = 2 + Math.floor(r() * 3), seats = [];
    for (let i = 0; i < n; i++) { const a = r() * TAU * 0 + i * TAU / n + r() * 0.5; seats.push({ a, earbud: r() < 0.7, laptop: r() < 0.3 }); }
    T.push({ x, y, seats });
  }
  return { T };
})();
function cafe(ctx, t, o = {}) {
  const { cx = 540, cy = 820, s = 1, alpha = 1, wifi = 0, budColor = null } = o;
  withAlpha(ctx, alpha, () => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    fillRR(ctx, -440, -400, 880, 820, 26, GREY.floor());
    strokeRR(ctx, -440, -400, 880, 820, 26, GREY.wall(), 9);
    /* counter along the top wall with the router */
    fillRR(ctx, -60, -386, 470, 74, 12, GREY.seat()); strokeRR(ctx, -60, -386, 470, 74, 12, rgba(COL.ink, 0.3), 3);
    ctx.restore();
    /* Wi-Fi coverage: a red tint filling the room from the router (it stays on its channel) */
    const rx = cx + 290 * s, ry = cy - 349 * s;
    if (wifi > 0) {
      ctx.save(); rr(ctx, cx - 440 * s, cy - 400 * s, 880 * s, 820 * s, 26 * s); ctx.clip();
      const R = lerp(60, 1300, E.out3(clamp(wifi))) * s;
      const g = ctx.createRadialGradient(rx, ry, 10, rx, ry, R);
      g.addColorStop(0, rgba(COL.alert, 0.22)); g.addColorStop(0.7, rgba(COL.alert, 0.10)); g.addColorStop(1, rgba(COL.alert, 0));
      ctx.fillStyle = g; ctx.fillRect(cx - 450 * s, cy - 410 * s, 900 * s, 840 * s);
      ctx.restore();
    }
    pictoDisk(ctx, 'router', rx, ry, 30 * s, COL.alert, { lw: 2.2 });
    icon(ctx, 'coffee', cx + 120 * s, cy - 349 * s, 40 * s, COL.dim, { lw: 2 });
    /* tables, chairs, people */
    CAFE.T.forEach((tb, ti) => {
      const tx = cx + tb.x * s, ty = cy + tb.y * s;
      dot(ctx, tx, ty, 52 * s, COL.panel); ring(ctx, tx, ty, 52 * s, rgba(COL.ink, 0.35), 3 * s);
      tb.seats.forEach((st, si) => {
        const px = tx + Math.cos(st.a) * 96 * s, py = ty + Math.sin(st.a) * 96 * s;
        fillRR(ctx, px - 26 * s, py - 26 * s, 52 * s, 52 * s, 12 * s, GREY.seat());
        const ang = st.a - Math.PI / 2;            // facing the table
        const c = st.earbud ? (budColor ? budColor(ti, si) : GREY.link()) : null;
        person(ctx, px, py, ang, 0.95 * s, { bud: c, phone: null });
        if (st.laptop) {
          const lx = tx + Math.cos(st.a) * 30 * s, ly = ty + Math.sin(st.a) * 30 * s;
          ctx.save(); ctx.translate(lx, ly); ctx.rotate(st.a + Math.PI / 2);
          fillRR(ctx, -18 * s, -11 * s, 36 * s, 22 * s, 3 * s, COL.panel); strokeRR(ctx, -18 * s, -11 * s, 36 * s, 22 * s, 3 * s, rgba(COL.ink, 0.6), 2.5 * s);
          ctx.restore();
        }
      });
      dot(ctx, tx + 14 * s, ty - 10 * s, 9 * s, rgba(COL.ink, 0.12)); ring(ctx, tx + 14 * s, ty - 10 * s, 9 * s, rgba(COL.ink, 0.35), 2 * s);
    });
  });
  return { rx: cx + 290 * s, ry: cy - 349 * s };
}

/* ---------------------------------------------------------------------
   12. The earbud's buffer: music waiting in reserve before it plays
   --------------------------------------------------------------------- */
function bufferQueue(ctx, t, x, y, w, o = {}) {
  const { alpha = 1, gapK = null, fill = 1, speed = 2.2, n = 12 } = o;
  withAlpha(ctx, alpha, () => {
    const h = 96, cell = w / n;
    fillRR(ctx, x, y, w, h, 14, COL.panel); strokeRR(ctx, x, y, w, h, 14, COL.ink, 3);
    ctx.save(); rr(ctx, x + 4, y + 4, w - 8, h - 8, 10); ctx.clip();
    const shift = (t * speed) % 1;
    const first = Math.floor(t * speed);
    for (let i = -1; i <= n + 1; i++) {
      const id = first + i, bx = x + (i - shift) * cell + 6;
      const missing = gapK != null && id === gapK && fill < 1;
      if (missing) {
        ctx.save(); ctx.setLineDash([6, 6]); strokeRR(ctx, bx, y + 16, cell - 12, h - 32, 8, COL.alert, 3); ctx.restore();
        if (fill > 0) fillRR(ctx, bx, y + 16 + (h - 32) * (1 - fill), cell - 12, (h - 32) * fill, 8, COL.subject);
      } else fillRR(ctx, bx, y + 16, cell - 12, h - 32, 8, gapK != null && id === gapK ? COL.subject : rgba(COL.data, 0.75));
    }
    ctx.restore();
    /* the playhead at the left: music leaves the buffer here */
    line(ctx, x + cell * 0.9, y - 22, x + cell * 0.9, y + h + 22, COL.ink, 5);
    dot(ctx, x + cell * 0.9, y - 26, 9, COL.ink);
  });
}

/* ---------------------------------------------------------------------
   13. Odds and ends
   --------------------------------------------------------------------- */
/* a station-style title: the name on a long white sign with a line-colour bar */
function stationTitle(ctx, str, cx, cy, w, o = {}) {
  const { alpha = 1, size = 74, sub = null } = o;
  withAlpha(ctx, alpha, () => {
    const h = sub ? 190 : 150;
    fillRR(ctx, cx - w / 2, cy - h / 2, w, h, 16, COL.panel); strokeRR(ctx, cx - w / 2, cy - h / 2, w, h, 16, COL.ink, 4);
    fillRR(ctx, cx - w / 2 + 18, cy + h / 2 - 26, w - 36, 9, 4.5, COL.subject);
    const sz = Math.min(size, fitSize(ctx, str, w - 80, size, 800, F.disp));
    text(ctx, str, cx, cy + (sub ? -10 : sz * 0.33), { size: sz, weight: 800, family: F.disp, color: COL.ink, align: 'center' });
    if (sub) text(ctx, sub, cx, cy + 46, { size: 30, weight: 600, family: F.mono, color: COL.dim, align: 'center', ls: 3 });
  });
}
/* the analytic integral of a smooth on/off window (for speeding time up and down again):
   rises a→b, holds b→c, falls c→d; returns ∫ window dt from −∞ to t */
function windowIntegral(t, a, b, c, d) {
  const F1 = (x) => x * x * x - x * x * x * x / 2, G1 = (x) => x - F1(x);
  if (t <= a) return 0;
  if (t < b) return (b - a) * F1((t - a) / (b - a));
  if (t < c) return (b - a) / 2 + (t - b);
  if (t < d) return (b - a) / 2 + (c - b) + (d - c) * G1((t - c) / (d - c));
  return (b - a) / 2 + (c - b) + (d - c) / 2;
}
const windowAt = (t, a, b, c, d) => (t <= a || t >= d ? 0 : t < b ? smooth((t - a) / (b - a)) : t <= c ? 1 : 1 - smooth((t - c) / (d - c)));
