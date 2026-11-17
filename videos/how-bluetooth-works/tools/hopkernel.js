'use strict';
/* Bluetooth BR/EDR hop selection, Connection state (basic and adapted channel hopping sequences),
   written from the Core Specification v5.4, Vol 2 Part B, §2.6 (hop selection kernel, Table 2.1
   butterflies, Table 2.2 control word) and checked against every connection-state test vector in
   Vol 2 Part G (sample data) by tools/verify_hops.js. The same text is pasted into components.js
   between the BEGIN/END HOP KERNEL markers; verify_hops.js checks that copy too. */
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
if (typeof module !== 'undefined') module.exports = { btHop, btPerm5, BT_BANK };
