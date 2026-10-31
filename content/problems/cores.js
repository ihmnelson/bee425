/* Shared access to the course's assemblers and CPU cores for problem families and the code grader.
   The same files run in the browser (sandbox) and in node (audit, tests), so a problem checked here is checked on what learners run. */
import A68 from '../../js/m68k/asm.js';
import C68 from '../../js/m68k/cpu.js';
import AZ from '../../js/z80/asm.js';
import ZC from '../../js/z80/cpu.js';
import ZIO from '../../js/z80/io.js';

export const hex = (b) => Array.from(b).map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join('');
export const H = (n, d) => '$' + (n >>> 0).toString(16).toUpperCase().padStart(d, '0');

/* ---- 68000 ---- */
export function asm68(source) {
  const r = A68.assemble(source);
  if (!r.ok) return { error: r.errors.slice(0, 3).map((e) => `line ${e.line}: ${e.msg}`).join('; ') };
  return { r };
}
/* bytes of one instruction assembled at `at` (default $1000); branch targets are absolute addresses */
export function encode68(asm, at = 0x1000) {
  const b = asm68(`        ORG     $${at.toString(16)}\n        ${asm}\n        END     $${at.toString(16)}\n`);
  if (b.error) return { error: b.error };
  return { bytes: Array.from(b.r.image[0].bytes) };
}
/* run assembled code; opts: {preload: {addr: bytes}, regs: {D0: v}, steps} -> {cpu, halted, ok, steps} */
export function boot68(r, opts = {}) {
  const cpu = new C68.CPU();
  for (const seg of r.image) cpu.mem.set(seg.bytes, seg.addr);
  for (const [a, bytes] of Object.entries(opts.preload || {})) cpu.mem.set(bytes, Number(a));
  cpu.A[7] = opts.sp ?? 0x01000000; cpu.ssp = cpu.A[7]; cpu.pc = r.start;
  for (const [k, v] of Object.entries(opts.regs || {})) (k[0] === 'D' ? cpu.D : cpu.A)[+k[1]] = v >>> 0;
  return cpu;
}
export function run68(r, opts = {}) {
  const cpu = boot68(r, opts);
  cpu.run(opts.steps || 200000);
  const ok = !!cpu.halted && /^SIMHALT/.test(cpu.halted);
  return { cpu, ok, halted: cpu.halted };
}
export const flags68 = (cpu) => { const sr = cpu.getSR(); return { X: (sr >> 4) & 1, N: (sr >> 3) & 1, Z: (sr >> 2) & 1, V: (sr >> 1) & 1, C: sr & 1 }; };

/* ---- Z80 ---- */
export function asmZ(source) {
  const r = AZ.assemble(source);
  if (!r.ok) return { error: r.errors.slice(0, 3).map((e) => e.msg || e).join('; ') };
  return { r };
}
export function encodeZ(asm) {
  const b = asmZ(`        ORG     0100H\n        ${asm}\n        END\n`);
  return b.error ? b : { bytes: Array.from(b.r.mem.slice(b.r.origin, b.r.origin + b.r.size)) };
}
export function bootZ(r, opts = {}) {
  const cpu = new ZC.CPU(), m = new ZIO.Machine();
  cpu.io = m; cpu.mem.set(r.mem); cpu.pc = r.origin;
  for (const [a, bytes] of Object.entries(opts.preload || {})) cpu.mem.set(bytes, Number(a));
  cpu.sp = opts.sp ?? 0xF000;
  for (const [k, v] of Object.entries(opts.regs || {})) cpu[k] = v;
  return cpu;
}
export function runZ(r, opts = {}) {
  const cpu = bootZ(r, opts);
  let n = 0; while (!cpu.halted && n < (opts.steps || 200000)) { cpu.step(); n++; }
  return { cpu, ok: !!cpu.halted };
}
export const flagsZ = (cpu) => { const f = cpu.af & 255; return { S: (f >> 7) & 1, Z: (f >> 6) & 1, H: (f >> 4) & 1, P: (f >> 2) & 1, N: (f >> 1) & 1, C: f & 1 }; };
