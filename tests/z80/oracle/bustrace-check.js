// Checks js/z80/bustrace.js against the SingleStepTests/z80 bus cycles, three ways:
//  1. held-out: the idle-gap table is learned from tests 0-499 of every instruction and used to rebuild tests 500-999
//     (every row compared: address, data and the r/w/m/i strobe flags);
//  2. full: the table learned from everything, rebuilding all 1,604,000 tests;
//  3. structure: every rebuilt trace obeys the UM0080 rules (fetch 4 clocks with the refresh address in clocks 3-4,
//     memory access 3, I/O access 4, total equals the instruction's T-states).
// usage: node bustrace-check.js <z80/v1 folder>
'use strict';
const fs = require('fs'), path = require('path');
const { CPU } = require('../../../js/z80/cpu.js'), BT = require('../../../js/z80/bustrace.js');
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const REGS = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'l', 'i', 'r', 'sp', 'pc', 'ix', 'iy', 'wz', 'af_', 'bc_', 'de_', 'hl_', 'iff1', 'iff2', 'im'];
const cpu = new CPU(); cpu.traceOn = true;
const same = (a, b) => a.length === b.length && a.every((r, i) => r[0] === b[i][0] && r[1] === b[i][1] && r[2] === b[i][2]);

function run(t) {
  const ini = t.initial; cpu.mem.fill(0);
  for (const k of REGS) cpu[k] = ini[k]; cpu.ei = ini.ei; cpu.p = ini.p; cpu.q = ini.q; cpu.halted = false;
  for (const [a, v] of ini.ram) cpu.mem[a] = v;
  cpu.io = { in() { const e = (t.ports || []).find((x) => x[2] === 'r'); return e ? e[1] : 0xFF; }, out() {} };
  return cpu.step();
}
const sigOf = (ev, T) => BT.sigOf(ev, T);
const learn = { half: {}, all: {} };
const store = (tbl, sig, g) => { tbl[sig] = g; };
let n = 0, rule = 0, ruleBad = null;

// pass 1: learn
const all = [];                                  // keep (ev, T, cycles) per file for the second pass
for (const file of files) {
  const T = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')), kept = [];
  T.forEach((t, i) => {
    const tt = run(t), ev = cpu.ev.map((e) => e.slice()), lg = BT.learnGaps(ev, t.cycles);
    if (!lg.ok) throw new Error(file + ': ' + lg.why);
    const sig = sigOf(ev, tt); store(learn.all, sig, lg.gaps.join(','));
    if (i < 500) store(learn.half, sig, lg.gaps.join(','));
    kept.push([ev, tt, t.cycles, i]);
  });
  all.push(kept);
}
// pass 2: rebuild and compare
let heldOK = 0, heldBad = 0, heldUnseen = 0, fullOK = 0, fullBad = 0, firstBad = null;
for (const kept of all) for (const [ev, tt, cyc, i] of kept) {
  n++;
  const r1 = BT.instructionRows(ev, tt, learn.half);
  if (i >= 500) { if (r1 === null) heldUnseen++; else if (same(r1, cyc)) heldOK++; else { heldBad++; if (!firstBad) firstBad = 'held-out ' + BT.keyOf(ev); } }
  const r2 = BT.instructionRows(ev, tt, learn.all);
  if (r2 && same(r2, cyc)) fullOK++; else { fullBad++; if (!firstBad) firstBad = 'full ' + BT.keyOf(ev); }
  // UM0080 structure rules on the rebuilt rows
  if (r2) {
    let pos = 0, ok = r2.length === tt; const g = BT.gapsFor(ev, tt, learn.all);
    ev.forEach((e, k) => { pos += g[k]; const rows = BT.accessRows(e); if (rows.length !== BT.LEN[e[0]]) ok = false; if (e[0] === 'F' && (r2[pos + 2][0] !== e[3] || r2[pos + 3][0] !== e[3])) ok = false; pos += rows.length; });
    rule += ok ? 1 : 0; if (!ok && !ruleBad) ruleBad = BT.keyOf(ev);
  }
}
console.log(`held-out (table from tests 0-499, rebuilding tests 500-999): ${heldOK} exact, ${heldBad} wrong, ${heldUnseen} variants not seen in the first half`);
console.log(`full: ${fullOK} of ${n} traces rebuilt exactly, ${fullBad} wrong`);
console.log(`UM0080 structure rules (clocks per access, refresh address in clocks 3-4, total = T-states): ${rule} of ${n}`);
if (firstBad || ruleBad) console.log('first problem:', firstBad, ruleBad);
if (process.argv[4]) { const t = {}; for (const [k, v] of Object.entries(learn.all)) t[k] = v; fs.writeFileSync(process.argv[4], '/* Idle-clock table for the bus trace, learned from the SingleStepTests/z80 vectors (see tests/z80/oracle/bustrace-check.js). */\n(function (r) { r.BusTrace = r.BusTrace || {}; r.BusTrace.table = ' + JSON.stringify(t) + '; })(typeof window !== \'undefined\' ? window : globalThis);\n'); console.log('wrote', process.argv[4], Object.keys(t).length, 'variants'); }
process.exit(heldBad || fullBad || rule !== n ? 1 : 0);
