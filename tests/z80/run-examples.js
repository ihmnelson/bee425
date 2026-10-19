// Assembles and runs every example program on the CPU core and checks its `expect` block.
'use strict';
const { assemble } = require('../../js/z80/asm.js'), { CPU } = require('../../js/z80/cpu.js'), { Machine } = require('../../js/z80/io.js'), { EXAMPLES } = require('../../js/z80/examples.js');
let bad = 0;
for (const ex of EXAMPLES) {
  const r = assemble(ex.src), fails = [];
  if (!r.ok) { console.log('ASSEMBLE FAIL', ex.name, r.errors); bad++; continue; }
  const cpu = new CPU(), m = new Machine(); m.promptIn = true;
  for (const b of ex.input || []) m.feed(1, b);
  cpu.io = m; cpu.mem.set(r.mem); cpu.pc = r.origin;
  const want = ex.expect || {}; let n = 0, ints = 0;
  while (!cpu.halted && n < 2e6) {
    if (want.interrupts && n > 0 && n % 50 === 0 && ints < want.interrupts && cpu.iff1) { cpu.interrupt(); ints++; }
    if (want.interrupts && ints >= want.interrupts && n % 50 === 49) break;
    cpu.step(); n++;
  }
  if (!cpu.halted && !want.interrupts) fails.push('did not halt');
  if (want.out !== undefined && m.text !== want.out) fails.push(`output ${JSON.stringify(m.text)} want ${JSON.stringify(want.out)}`);
  const sym = (e) => { const mm = /^(\w+)(?:\+(\d+))?$/.exec(e); return r.symbols[mm[1].toUpperCase()] + (+mm[2] || 0); };
  for (const [k, v] of Object.entries(want.sym || {})) { const got = k === 'FIB' ? cpu.mem[sym(k)] : cpu.mem[sym(k)]; if (got !== v) fails.push(`${k} = ${got}, want ${v}`); }
  for (const [k, v] of Object.entries(want.regs || {})) { const got = cpu[k.toLowerCase()]; if (got !== v) fails.push(`${k} = ${got}, want ${v}`); }
  for (const [k, v] of Object.entries(want.flags || {})) { const got = k === 'C' ? cpu.f & 1 : -1; if (got !== v) fails.push(`flag ${k} = ${got}`); }
  for (const [k, v] of Object.entries(want.bytes || {})) { const a = sym(k), got = Array.from(cpu.mem.slice(a, a + v.length)); if (got.join() !== v.join()) fails.push(`${k}: ${got} want ${v}`); }
  for (const [k, v] of Object.entries(want.text || {})) { const a = sym(k); let s = ''; for (let i = 0; i < v.length; i++) s += String.fromCharCode(cpu.mem[a + i]); if (s !== v) fails.push(`${k}: ${JSON.stringify(s)} want ${JSON.stringify(v)}`); }
  console.log((fails.length ? 'FAIL ' : 'ok   ') + ex.name + (fails.length ? ' -> ' + fails.join('; ') : `  (${cpu.cycles} T-states, ${r.size} bytes)`));
  if (fails.length) bad++;
}
console.log(bad ? `${bad} example(s) failed` : 'all examples pass');
process.exit(bad ? 1 : 0);
