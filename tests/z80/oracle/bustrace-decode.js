// Independent check of the bus trace: read each instruction back out of the displayed rows the way the lab asks
// (find the ~M1/~MREQ/~RD fetch rows, collect operand reads, writes and port accesses), disassemble the bytes
// the analyzer saw, and compare with (a) the disassembly of the program in memory, (b) the writes and port
// accesses recorded in the SingleStepTests vector.   usage: node bustrace-decode.js <z80/v1 folder> [tests per file]
'use strict';
const fs = require('fs'), path = require('path');
global.window = global; require('../../../js/z80/bustable.js');
const BT = require('../../../js/z80/bustrace.js'); BT.table = window.BusTrace.table;
const { CPU } = require('../../../js/z80/cpu.js'), { dis } = require('../../../js/z80/dis.js');
const dir = process.argv[2], per = +process.argv[3] || 50;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const REGS = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'l', 'i', 'r', 'sp', 'pc', 'ix', 'iy', 'wz', 'af_', 'bc_', 'de_', 'hl_', 'iff1', 'iff2', 'im'];
const cpu = new CPU(); cpu.traceOn = true;
let n = 0, bad = 0, first = null;
for (const file of files) {
  const T = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const t of T.slice(0, per)) {
    const ini = t.initial; cpu.mem.fill(0);
    for (const k of REGS) cpu[k] = ini[k]; cpu.ei = ini.ei; cpu.p = ini.p; cpu.q = ini.q; cpu.halted = false;
    for (const [a, v] of ini.ram) cpu.mem[a] = v;
    const mem0 = cpu.mem.slice(), pc0 = cpu.pc;
    cpu.io = { in() { const e = (t.ports || []).find((x) => x[2] === 'r'); return e ? e[1] : 0xFF; }, out() {} };
    cpu.step(); n++;
    const g = BT.gapsFor(cpu.ev, cpu.t, BT.table); const rows = BT.traceRows(cpu.ev, g);
    const d = BT.decodeRows(rows), problems = [];
    // (a) the bytes the analyzer saw disassemble like the program in memory
    const seen = d.bytes.slice(), ref = dis((a) => mem0[a], pc0);
    const fromTrace = dis((a) => seen[(a - pc0) & 0xFFFF] || 0, pc0);
    if (fromTrace.text !== ref.text) problems.push(`disassembly ${fromTrace.text} vs ${ref.text}`);
    // (b) writes and port accesses match the vector
    const fin = new Map(t.final.ram); const wr = new Map(); d.writes.forEach(([a, v]) => wr.set(a, v));
    for (const [a, v] of wr) if (fin.get(a) !== v) problems.push(`write ${a.toString(16)}=${v} but vector ends with ${fin.get(a)}`);
    const ports = (t.ports || []).map(([a, v, k]) => [k === 'r' ? 'in' : 'out', a, v]);
    if (JSON.stringify(d.ports) !== JSON.stringify(ports)) problems.push('ports ' + JSON.stringify(d.ports) + ' vs ' + JSON.stringify(ports));
    // (c) every fetch begins at the PC the CPU had, and the total length is the instruction's T-states
    if (rows.length !== cpu.t) problems.push('rows ' + rows.length + ' vs T ' + cpu.t);
    if (rows[0].a !== pc0) problems.push('first row address');
    if (problems.length) { bad++; if (!first) first = `${t.name}: ${problems[0]}`; }
  }
}
console.log(`${n} instructions read back from their bus traces, ${bad} problems`);
if (first) console.log('first:', first);
process.exit(bad ? 1 : 0);
