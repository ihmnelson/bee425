/* Grades a learner's 68000 program by running it on the real core against generated test data.
   gradeProgram(problem, source) -> {error?, results: [{name, pass, detail}], passed, total}.
   The learner writes only the instructions (plus labels and data); if there is no ORG the grader adds ORG $1000,
   and if there is no END it adds SIMHALT and END. Only the outputs the problem names are compared. */
import { asm68, run68, asmZ, runZ } from './cores.js';

export function wrapSource(src) {
  let s = String(src).replace(/\r/g, '');
  const org = /^\s*ORG\s+(\S+)/im.exec(s);
  if (!org) s = `        ORG     $1000\n${s}`;
  if (!/\bSIMHALT\b/i.test(s) && !/\bEND\b/i.test(s)) s += '\n        SIMHALT';
  if (!/^\s*END\b/im.test(s)) s += `\n        END     ${org ? org[1] : '$1000'}\n`;
  return s;
}

const hx = (n, d) => (n >>> 0).toString(16).toUpperCase().padStart(d, '0');
const hexBytes = (a) => a.map((b) => hx(b, 2)).join(' ');
const MASKS = { B: 0xFF, W: 0xFFFF, L: 0xFFFFFFFF };

/* the learner's source may not use these (e.g. "no multiply instruction") */
export function forbidden(problem, source) {
  for (const f of problem.forbid || []) if (new RegExp(`\\b${f}\\b`, 'i').test(source.replace(/\*.*$|;.*$/gm, ''))) return f;
  return null;
}

/* Z80: the learner writes instructions; ORG 0100H is added if missing, and HALT and END if missing */
export function wrapSourceZ(src) {
  let s = String(src).replace(/\r/g, '');
  if (!/^\s*(\.)?ORG\b/im.test(s)) s = `        ORG     0100H\n${s}`;
  if (!/\bHALT\b/i.test(s) && !/^\s*(\.)?END\b/im.test(s)) s += '\n        HALT';
  if (!/^\s*(\.)?END\b/im.test(s)) s += '\n        END\n';
  return s;
}
const ZREG = { A: (c) => c.af >> 8, F: (c) => c.af & 255, B: (c) => c.bc >> 8, C: (c) => c.bc & 255, D: (c) => c.de >> 8, E: (c) => c.de & 255, H: (c) => c.hl >> 8, L: (c) => c.hl & 255, BC: (c) => c.bc, DE: (c) => c.de, HL: (c) => c.hl };

function gradeProgramZ(problem, source) {
  const bad = forbidden(problem, source);
  if (bad) return { error: `This problem does not allow ${bad}.`, results: [], passed: 0, total: problem.tests.length };
  const a = asmZ(wrapSourceZ(source));
  if (a.error) return { error: a.error, results: [], passed: 0, total: problem.tests.length };
  const results = problem.tests.map((t) => {
    const run = runZ(a.r, { preload: t.preload, steps: 300000 });
    if (!run.ok) return { name: t.name, pass: false, detail: 'The program did not stop (an endless loop?). End it with HALT.' };
    const why = [];
    for (const [k, v] of Object.entries(t.expect.regs || {})) {
      const got = ZREG[k](run.cpu), w = k.length === 2 ? 4 : 2;
      if (got !== v) why.push(`${k} = ${hx(got, w)}H, expected ${hx(v, w)}H`);
    }
    for (const [addr, bytes] of Object.entries(t.expect.mem || {})) {
      const got = Array.from(run.cpu.mem.slice(+addr, +addr + bytes.length));
      if (got.join() !== bytes.join()) why.push(`memory at ${hx(+addr, 4)}H is ${hexBytes(got)}, expected ${hexBytes(bytes)}`);
    }
    return { name: t.name, pass: !why.length, detail: why.join('; ') };
  });
  return { results, passed: results.filter((r) => r.pass).length, total: results.length };
}

export function gradeProgram(problem, source) {
  if (problem.cpu === 'z80') return gradeProgramZ(problem, source);
  const bad = forbidden(problem, source);
  if (bad) return { error: `This problem does not allow ${bad}.`, results: [], passed: 0, total: problem.tests.length };
  const a = asm68(wrapSource(source));
  if (a.error) return { error: a.error, results: [], passed: 0, total: problem.tests.length };
  const results = problem.tests.map((t) => {
    const run = run68(a.r, { preload: t.preload, steps: 300000 });
    if (!run.cpu.halted) return { name: t.name, pass: false, detail: 'The program did not stop (an endless loop?). End it with SIMHALT.' };
    if (!/^SIMHALT/.test(run.cpu.halted)) return { name: t.name, pass: false, detail: `The program stopped with: ${run.cpu.halted}` };
    const why = [];
    for (const [k, v] of Object.entries(t.expect.regs || {})) {
      const m = MASKS[problem.outSize || 'L'], got = (k[0] === 'D' ? run.cpu.D : run.cpu.A)[+k[1]] & m;
      if ((got >>> 0) !== (v & m) >>> 0) why.push(`${k} = $${hx(got, 8)}, expected $${hx(v & m, 8)}`);
    }
    for (const [addr, bytes] of Object.entries(t.expect.mem || {})) {
      const got = Array.from(run.cpu.mem.slice(+addr, +addr + bytes.length));
      if (got.join() !== bytes.join()) why.push(`memory at $${hx(+addr, 4)} is ${hexBytes(got)}, expected ${hexBytes(bytes)}`);
    }
    return { name: t.name, pass: !why.length, detail: why.join('; ') };
  });
  return { results, passed: results.filter((r) => r.pass).length, total: results.length };
}
