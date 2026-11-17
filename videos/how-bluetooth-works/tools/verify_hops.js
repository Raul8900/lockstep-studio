'use strict';
/* Checks the hop kernel against the Core Specification's sample data (Vol 2 Part G, connection
   state, basic and adapted sequences). Usage: node tools/verify_hops.js <sample-data.txt>
   The sample data text is the spec page with its tags stripped (one table row per line). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = process.argv[2];
if (!src) { console.error('usage: node verify_hops.js <sample-data.txt>'); process.exit(2); }
const lines = fs.readFileSync(src, 'utf8').split('\n');
const kernels = { 'tools/hopkernel.js': require('./hopkernel.js').btHop };
/* the copy inside components.js, if it is there */
const comp = path.join(__dirname, '..', 'components.js');
if (fs.existsSync(comp)) {
  const m = /\/\/ BEGIN HOP KERNEL([\s\S]*?)\/\/ END HOP KERNEL/.exec(fs.readFileSync(comp, 'utf8'));
  if (m) { const ctx = {}; vm.createContext(ctx); vm.runInContext(m[1] + '\nthis.btHop = btHop;', ctx); kernels['components.js'] = ctx.btHop; }
}
let set = null, sets = [];
for (const ln of lines) {
  if (/Hop sequence \{k\} for Connection state/i.test(ln)) { set = { title: ln.trim(), rows: [], used: null, ulap: null }; sets.push(set); continue; }
  if (!set) continue;
  if (/Hop sequence \{k\} for (Page|Inquiry)/i.test(ln) || /\d+\.\d+ \. (First|Second|Third) set/.test(ln)) { set = null; continue; }
  let m;
  if ((m = /(?:UAP\s*\/\s*LAP|ULAP):\s*0x([0-9a-f]+)/i.exec(ln))) set.ulap = parseInt(m[1], 16);
  if ((m = /Used Channels:\s*0x([0-9a-f]+)/i.exec(ln))) {
    const v = BigInt('0x' + m[1]); set.used = Array.from({ length: 79 }, (_, i) => ((v >> BigInt(i)) & 1n) === 1n);
  }
  if ((m = /^\s*0x([0-9a-f]{7})\s*:?\s+((?:\d\d \d\d \|\s*)+)/i.exec(ln))) {
    const base = parseInt(m[1], 16);
    const nums = m[2].replace(/\|/g, ' ').trim().split(/\s+/).map(Number);
    nums.forEach((ch, i) => set.rows.push([base + 2 * i, ch]));
  }
}
sets = sets.filter((s) => s.rows.length);
let bad = 0, total = 0;
for (const [name, hop] of Object.entries(kernels)) {
  for (const s of sets) {
    let miss = 0;
    for (const [clk, ch] of s.rows) { total++; if (hop(s.ulap, clk, s.used) !== ch) { miss++; bad++; if (miss <= 3) console.log(`  MISMATCH ${name} ulap=0x${s.ulap.toString(16)} clk=0x${clk.toString(16)} want ${ch} got ${hop(s.ulap, clk, s.used)}`); } }
    console.log(`${miss ? 'FAIL' : 'ok  '} ${name}: ${s.title.slice(0, 92)} ulap=0x${s.ulap.toString(16).padStart(8, '0')}${s.used ? ' (AFH, ' + s.used.filter(Boolean).length + ' used)' : ''}: ${s.rows.length - miss}/${s.rows.length}`);
  }
}
console.log(bad ? `\n${bad} of ${total} hops differ` : `\nall ${total} hops match the specification's sample data`);
process.exit(bad ? 1 : 0);
