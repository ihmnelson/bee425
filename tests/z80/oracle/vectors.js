// Runs js/cpu.js against the SingleStepTests/z80 vectors (MIT licensed, https://github.com/SingleStepTests/z80).
// usage: node vectors.js <path to z80/v1> [filter-substring] [max-tests-per-file]
'use strict';
const fs = require('fs'), path = require('path');
const { CPU } = require('../../../js/z80/cpu.js');

const dir = process.argv[2], filter = process.argv[3] || '', maxN = +process.argv[4] || 1000;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f.includes(filter)).sort();
const REGS = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'l', 'i', 'r', 'sp', 'pc', 'ix', 'iy', 'wz', 'af_', 'bc_', 'de_', 'hl_', 'iff1', 'iff2', 'im'];
const cpu = new CPU();
let totalFail = 0, totalTests = 0, badFiles = [];
const noteFlag = (cat, o) => { cat[o] = (cat[o] || 0) + 1; };

for (const file of files) {
  const tests = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')).slice(0, maxN);
  let fails = 0, first = null; const kinds = {};
  for (const t of tests) {
    const ini = t.initial;
    cpu.mem.fill(0);
    for (const k of REGS) if (k in ini) cpu[k] = ini[k];
    cpu.ei = ini.ei; cpu.p = ini.p; cpu.q = ini.q; cpu.halted = false;
    for (const [a, v] of ini.ram) cpu.mem[a] = v;
    const ports = [];
    cpu.io = { in(p) { const e = (t.ports || []).find((x) => x[2] === 'r'); ports.push([p, e ? e[1] : 0xFF, 'r']); return e ? e[1] : 0xFF; }, out(p, v) { ports.push([p, v, 'w']); } };
    const tstates = cpu.step();
    const fin = t.final, diffs = [];
    for (const k of REGS) if (k in fin && cpu[k] !== fin[k]) diffs.push(`${k}: got ${cpu[k].toString(16)} want ${fin[k].toString(16)}`);
    if (cpu.ei !== fin.ei) diffs.push(`ei: got ${cpu.ei} want ${fin.ei}`);
    for (const [a, v] of fin.ram) if (cpu.mem[a] !== v) diffs.push(`mem[${a.toString(16)}]: got ${cpu.mem[a].toString(16)} want ${v.toString(16)}`);
    if (tstates !== t.cycles.length) diffs.push(`T-states: got ${tstates} want ${t.cycles.length}`);
    if (JSON.stringify(ports) !== JSON.stringify(t.ports || [])) diffs.push(`ports: got ${JSON.stringify(ports)} want ${JSON.stringify(t.ports || [])}`);
    if (diffs.length) { fails++; if (!first) first = { name: t.name, diffs }; for (const d of diffs) noteFlag(kinds, d.split(':')[0]); }
  }
  totalTests += tests.length;
  if (fails) { totalFail += fails; badFiles.push(file); console.log(`${file}: ${fails}/${tests.length} fail  [${Object.keys(kinds).map((k) => k + ' x' + kinds[k]).join(', ')}]  e.g. ${first.name}: ${first.diffs.slice(0, 4).join('; ')}`); }
}
console.log(`\n${files.length} files, ${totalTests} tests, ${totalFail} failing tests in ${badFiles.length} files`);
