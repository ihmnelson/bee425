// Compares the CPU core's recorded bus accesses with the bus cycles in the SingleStepTests/z80 vectors,
// and learns where each instruction idles ("internal operation" clock cycles) from them.
// usage: node bustrace-learn.js <z80/v1 folder> [out.json]       (writes the gap table when out.json is given)
'use strict';
const fs = require('fs'), path = require('path');
const { CPU } = require('../../../js/z80/cpu.js');
const BT = require('../../../js/z80/bustrace.js');
const dir = process.argv[2], out = process.argv[3];
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const REGS = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'l', 'i', 'r', 'sp', 'pc', 'ix', 'iy', 'wz', 'af_', 'bc_', 'de_', 'hl_', 'iff1', 'iff2', 'im'];
const cpu = new CPU(); cpu.traceOn = true;
let tests = 0, evBad = 0, firstBad = null; const table = {}, conflicts = {};

for (const file of files) {
  const T = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const t of T) {
    const ini = t.initial; cpu.mem.fill(0);
    for (const k of REGS) cpu[k] = ini[k]; cpu.ei = ini.ei; cpu.p = ini.p; cpu.q = ini.q; cpu.halted = false;
    for (const [a, v] of ini.ram) cpu.mem[a] = v;
    cpu.io = { in(p) { const e = (t.ports || []).find((x) => x[2] === 'r'); return e ? e[1] : 0xFF; }, out() {} };
    cpu.step(); tests++;
    const ev = cpu.ev, cyc = t.cycles, got = BT.learnGaps(ev, cyc);       // -> { ok, gaps, why }
    if (!got.ok) { evBad++; if (!firstBad) firstBad = `${file} ${t.name}: ${got.why}`; continue; }
    const key = BT.keyOf(ev), sig = key + '|' + ev.map((e) => e[0]).join('') + '|' + cyc.length, g = got.gaps.join(',');
    (table[sig] = table[sig] || {})[g] = ((table[sig][g]) || 0) + 1;
  }
}
const multi = Object.entries(table).filter(([, v]) => Object.keys(v).length > 1);
console.log(`${tests} tests, ${evBad} whose recorded bus accesses differ from the vector's, ${Object.keys(table).length} instruction variants, ${multi.length} with more than one gap pattern`);
if (firstBad) console.log('first mismatch:', firstBad);
multi.slice(0, 8).forEach(([k, v]) => console.log('  ambiguous', k, JSON.stringify(v)));
if (out) { const t = {}; for (const [k, v] of Object.entries(table)) t[k] = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0]; fs.writeFileSync(out, JSON.stringify(t)); console.log('wrote', out, Object.keys(t).length, 'variants'); }
