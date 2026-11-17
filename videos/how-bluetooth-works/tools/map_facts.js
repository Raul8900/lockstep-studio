'use strict';
/* Prints the hop-map facts the video shows, from the kernel copy inside components.js:
   where the two example phones' sequences coincide, the channels of the clash and of the resend,
   and what adaptive hopping does with Wi-Fi channel 6 (Bluetooth channels 25–44) closed.
   Usage: node tools/map_facts.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'components.js'), 'utf8');
const kernel = /\/\/ BEGIN HOP KERNEL([\s\S]*?)\/\/ END HOP KERNEL/.exec(src)[1];
const phones = /const PHONES = (\{[\s\S]*?\n\});/.exec(src)[1];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(kernel + '\nthis.btHop = btHop; this.PHONES = ' + phones + ';', ctx);
const { btHop, PHONES } = ctx;
const hop = (ph, k, used) => btHop(ph.ulap, (ph.clk + 2 * k) >>> 0, used);
const co = [];
for (let k = 0; k <= 160; k++) if (hop(PHONES.you, k) === hop(PHONES.nb, k)) co.push(`slot ${k} → ch ${hop(PHONES.you, k)} (${2402 + hop(PHONES.you, k)} MHz)`);
console.log('example phones: you', PHONES.you.addr, '· neighbour', PHONES.nb.addr);
console.log('same channel in the same slot, slots 0–160:\n  ' + co.join('\n  '));
console.log(`clash at slot 150: ch ${hop(PHONES.you, 150)} / ${hop(PHONES.nb, 150)}; resend at slot 152 (+1.25 ms): ch ${hop(PHONES.you, 152)}`);
const used = Array.from({ length: 79 }, (_, ch) => ch < 25 || ch > 44);
let inside = 0, n = 20000, adaptedInside = 0;
const seen = new Set();
for (let k = 0; k < n; k++) { if (!used[hop(PHONES.you, k)]) inside++; const a = hop(PHONES.you, k, used); if (!used[a]) adaptedInside++; seen.add(a); }
console.log(`basic hopping: ${(100 * inside / n).toFixed(1)} % of ${n} slots land in channels 25–44 (20 of 79 = ${(100 * 20 / 79).toFixed(1)} %)`);
console.log(`adaptive hopping with 25–44 unused: ${adaptedInside} slots inside the block; ${seen.size} distinct channels used (79 − 20 = 59)`);
