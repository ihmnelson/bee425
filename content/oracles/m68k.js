/* Oracle for 68000 claims: assembles and runs source on the site's 68000 assembler and CPU core, which were tested
   against a real EASy68K (tests/m68k/oracle). encode(asm) -> bytes; run(source, expect) -> list of failures. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const A = require('../../js/m68k/asm.js'), C = require('../../js/m68k/cpu.js');

const hex = (b) => Array.from(b).map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join('');

function build(source) {
  const r = A.assemble(source);
  if (!r.ok) return { error: 'assembly errors: ' + r.errors.slice(0, 3).map((e) => `line ${e.line}: ${e.msg}`).join('; ') };
  return { r };
}

export function encode(asm) {
  const b = build(`        ORG     $1000\n        ${asm}\n        END     $1000\n`);
  if (b.error) return { error: b.error };
  const seg = b.r.image[0];
  return { hex: hex(seg.bytes) };
}

export function run(source, expect = {}) {
  const b = build(source); if (b.error) return [b.error];
  const { r } = b, fails = [];
  const cpu = new C.CPU(); for (const seg of r.image) cpu.mem.set(seg.bytes, seg.addr);
  for (const [a, bytes] of Object.entries(expect.preload || {})) cpu.mem.set(bytes, Number(a));   /* data placed before the run */
  cpu.A[7] = 0x01000000; cpu.ssp = 0x01000000; cpu.pc = r.start;
  cpu.run(expect.steps || 200000);
  if (!cpu.halted) fails.push('did not halt');
  else if (!/^SIMHALT/.test(cpu.halted)) fails.push('stopped with: ' + cpu.halted);
  const sym = (n) => r.symbols[n] ?? r.symbols[String(n).toUpperCase()];
  for (const [k, v] of Object.entries(expect.regs || {})) {
    const m = /^([DA])([0-7])$/i.exec(k); if (!m) { fails.push(`unknown register ${k}`); continue; }
    const got = (m[1].toUpperCase() === 'D' ? cpu.D : cpu.A)[+m[2]] >>> 0;
    if (got !== (v >>> 0)) fails.push(`${k} = $${got.toString(16).toUpperCase()}, want $${(v >>> 0).toString(16).toUpperCase()}`);
  }
  for (const [k, v] of Object.entries(expect.mem || {})) {            /* key: address number or symbol name; value: list of bytes */
    const a = /^\d+$/.test(k) ? Number(k) : sym(k);
    if (a === undefined) { fails.push(`unknown symbol ${k}`); continue; }
    const got = Array.from(cpu.mem.slice(a, a + v.length));
    if (got.join() !== v.join()) fails.push(`memory at ${k}: ${hex(got)}, want ${hex(v)}`);
  }
  for (const [k, v] of Object.entries(expect.flags || {})) {            /* flags: X N Z V C as 0/1 */
    const got = (cpu.getSR() >> 'CVZNX'.indexOf(k.toUpperCase())) & 1;
    if (got !== v) fails.push(`flag ${k} = ${got}, want ${v}`);
  }
  return fails;
}
