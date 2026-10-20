// Prints the two bus-trace tables used in the "Reading a bus trace" guide, computed from the simulator (JSON on stdout).
'use strict';
global.window = global; require('../../../js/z80/bustable.js');
const BT = require('../../../js/z80/bustrace.js'); BT.table = global.BusTrace.table;
const { CPU } = require('../../../js/z80/cpu.js'), { assemble } = require('../../../js/z80/asm.js');
const r = assemble(' ADD HL,BC\n LD A,55H\n LD HL,9A7CH\n LD (HL),A\n JP 0\n'), c = new CPU(); c.traceOn = true; c.mem.set(r.mem);
const notes = {
  F: ['M1 starts: the address bus carries the PC', 'opcode on the bus; ~M1, ~MREQ and ~RD all asserted: the opcode fetch', 'refresh address (I:R) on the bus; ~RFSH asserted', 'refresh ~MREQ pulse (UM0080 Figure 5)'],
  R: ['address of the operand byte', '~MREQ and ~RD asserted: operand byte read', 'byte still on the bus as the CPU samples it'],
  W: ['address of the memory location', '~MREQ and ~WR asserted with the data on the bus', 'end of the write'],
};
const hx = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');
let clk = 0; const out = {};
for (let i = 0; i < 5; i++) {
  c.step(); const rows = BT.traceRows(c.ev, BT.gapsFor(c.ev, c.t, BT.table));
  if (i === 1 || i === 3) {
    const L = ['| Clock | Addr | Data | ~M1 | ~MREQ | ~RD | ~WR | ~RFSH | What is happening |', '|---|---|---|---|---|---|---|---|---|'];
    rows.forEach((x, k) => L.push(`| ${clk + k} | \`${hx(x.a, 4)}\` | \`${x.d === null ? '--' : hx(x.d, 2)}\` | ${x.m1} | ${x.mreq} | ${x.rd} | ${x.wr} | ${x.rfsh} | ${notes[x.kind][x.n - 1]} |`));
    out['TABLE' + (i === 1 ? 1 : 2)] = L.join('\n');
  }
  clk += rows.length;
}
console.log(JSON.stringify(out));
