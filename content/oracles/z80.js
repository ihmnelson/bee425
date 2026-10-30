/* Oracle for Z80 claims, using the site's Z80 assembler and CPU core (tested against the SingleStepTests vectors and z80dasm). */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const A = require('../../js/z80/asm.js'), { CPU } = require('../../js/z80/cpu.js'), { Machine } = require('../../js/z80/io.js');

const hex = (b) => Array.from(b).map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join('');

export function encode(asm) {
  const r = A.assemble(`        ORG     0100H\n        ${asm}\n        END\n`);
  if (!r.ok) return { error: 'assembly errors: ' + r.errors.slice(0, 3).map((e) => e.msg || e).join('; ') };
  return { hex: hex(r.mem.slice(r.origin, r.origin + r.size)) };
}

export function run(source, expect = {}) {
  const r = A.assemble(source);
  if (!r.ok) return ['assembly errors: ' + r.errors.slice(0, 3).map((e) => e.msg || e).join('; ')];
  const fails = [], cpu = new CPU(), m = new Machine();
  cpu.io = m; cpu.mem.set(r.mem); cpu.pc = r.origin;
  for (const [a, bytes] of Object.entries(expect.preload || {})) cpu.mem.set(bytes, Number(a));   /* data placed before the run */
  let n = 0; while (!cpu.halted && n < (expect.steps || 2e6)) { cpu.step(); n++; }
  if (!cpu.halted) fails.push('did not halt');
  const sym = (s) => r.symbols[s] ?? r.symbols[String(s).toUpperCase()];
  for (const [k, v] of Object.entries(expect.regs || {})) {
    const got = cpu[k.toLowerCase()];
    if (got !== v) fails.push(`${k} = ${got}, want ${v}`);
  }
  for (const [k, v] of Object.entries(expect.mem || {})) {
    const a = /^\d+$/.test(k) ? Number(k) : sym(k);
    if (a === undefined) { fails.push(`unknown symbol ${k}`); continue; }
    const got = Array.from(cpu.mem.slice(a, a + v.length));
    if (got.join() !== v.join()) fails.push(`memory at ${k}: ${hex(got)}, want ${hex(v)}`);
  }
  return fails;
}
