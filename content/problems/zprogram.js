/* Write-a-program problems for the Z80: the same idea as program.js, graded on the Z80 core. The reference must pass every
   test and every deliberately wrong variant must fail at least one. */
import { gradeProgram } from './grade.js';

const hx = (n, d) => (n >>> 0).toString(16).toUpperCase().padStart(d, '0');
const lit = (v, d = 4) => { const t = hx(v, d) + 'H'; return /^[A-F]/.test(t) ? '0' + t : t; };
const bytesHex = (a) => a.map((b) => hx(b, 2)).join(' ');
const rbytes = (r, n, lo = 0, hi = 255) => Array.from({ length: n }, () => r.int(lo, hi));
const ADDR = [0x2000, 0x3000, 0x4000];
const par = (v) => { let n = 0; for (let i = 0; i < 8; i++) n += (v >> i) & 1; return n; };
const src = (lines) => ['        ORG     0100H', ...lines, '        END'].join('\n') + '\n';

const TASKS = {
  'count-ones': { build(r) {
    const base = r.pick(ADDR);
    const mk = (v) => ({ name: `byte ${lit(v, 2)}`, preload: { [base]: [v] }, expect: { regs: { C: par(v) }, mem: { [base]: [v] } } });
    const tests = [mk(r.int(1, 254)), mk(r.int(1, 254)), mk(0), mk(255), mk(0x80), mk(1), mk(0xA5)];
    const body = (n) => ['START:  LD A,(' + lit(base) + ')', '        LD C,0', `        LD B,${n}`, 'LOOP:   RRCA', '        JR NC,SKIP', '        INC C', 'SKIP:   DJNZ LOOP', '        HALT'];
    return { title: 'Count the 1 bits in a byte', text: `Write a Z80 program that counts the number of 1 bits in the byte stored at memory address **${lit(base)}** and leaves the count in register **C**. Leave the byte in memory unchanged. (Hint: the rotate instructions move a bit into the carry flag.)`,
      tests, concepts: ['program-control.z80-loops-and-conditions'], reference: src(body(8)), mutants: [{ name: 'examines only 7 bits', source: src(body(7)) }, { name: 'counts the 0 bits', source: src(body(8)).replace('JR NC,SKIP', 'JR C,SKIP') }] };
  } },
  'sum-bytes': { build(r) {
    const base = r.pick(ADDR), n = r.int(4, 12);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { regs: { HL: a.reduce((s, x) => s + x, 0) } } });
    const tests = [mk(rbytes(r, n), 'random bytes'), mk(rbytes(r, n, 100, 255), 'large bytes'), mk(Array(n).fill(0), 'all zero'), mk(Array(n).fill(255), 'all FFH'), mk(rbytes(r, n), 'random bytes')];
    const body = (carry) => ['START:  LD DE,' + lit(base), '        LD HL,0', `        LD B,${n}`, 'LOOP:   LD A,(DE)', '        ADD A,L', '        LD L,A', ...(carry ? ['        JR NC,NOC', '        INC H'] : []), 'NOC:    INC DE', '        DJNZ LOOP', '        HALT'];
    return { title: 'Sum an array of bytes', text: `${n} unsigned bytes are stored starting at **${lit(base)}**. Write a Z80 program that adds them and leaves the 16-bit total in **HL** (the total can exceed 255).`,
      tests, concepts: ['program-control.z80-loops-and-conditions'], reference: src(body(true)), mutants: [{ name: 'ignores the carry, so the total wraps at 256', source: src(body(false)) }] };
  } },
  'max-byte': { build(r) {
    const base = r.pick(ADDR), n = r.int(5, 12);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { regs: { A: Math.max(...a) } } });
    const first = rbytes(r, n, 0, 90); first[0] = 200; const last = rbytes(r, n, 0, 90); last[n - 1] = 250;
    const tests = [mk(rbytes(r, n), 'random bytes'), mk(first, 'maximum first'), mk(last, 'maximum last'), mk(Array(n).fill(0), 'all zero'), mk(rbytes(r, n, 128, 255), 'all above 7FH')];
    const body = (cc) => ['START:  LD HL,' + lit(base), `        LD B,${n}`, '        XOR A', 'LOOP:   CP (HL)', `        JR ${cc},NEXT`, '        LD A,(HL)', 'NEXT:   INC HL', '        DJNZ LOOP', '        HALT'];
    return { title: 'Largest byte in an array', text: `${n} **unsigned** bytes are stored starting at **${lit(base)}**. Write a Z80 program that leaves the largest in **A**.`,
      tests, concepts: ['program-control.z80-loops-and-conditions'], reference: src(body('NC')), mutants: [{ name: 'keeps the smaller value (carry test reversed)', source: src(body('C')) }] };
  } },
  'copy-block': { build(r) {
    const [sb, db] = r.pick([[0x2000, 0x3000], [0x2000, 0x4000], [0x3000, 0x2000]]), n = r.int(5, 14);
    const mk = (a, nm) => ({ name: nm, preload: { [sb]: a, [db + n]: [0xEE] }, expect: { mem: { [sb]: a, [db]: a, [db + n]: [0xEE] } } });
    const tests = [mk(rbytes(r, n), 'random data'), mk(rbytes(r, n), 'random data'), mk(Array(n).fill(0xFF), 'all FFH'), mk(Array.from({ length: n }, (_, i) => i + 1), 'counting 1, 2, 3...')];
    const body = (k) => ['START:  LD HL,' + lit(sb), '        LD DE,' + lit(db), `        LD BC,${k}`, '        LDIR', '        HALT'];
    return { title: 'Copy a block of bytes', text: `Write a Z80 program that copies **${n} bytes** from **${lit(sb)}** to **${lit(db)}** (the blocks do not overlap). The source must be unchanged and no byte beyond the destination block may be touched. (Hint: look at LDIR.)`,
      tests, concepts: ['assembly-programs.z80-load'], reference: src(body(n)), mutants: [{ name: 'copies one byte too few', source: src(body(n - 1)) }, { name: 'copies one byte too many', source: src(body(n + 1)) }] };
  } },
  'string-length': { build(r) {
    const base = r.pick(ADDR);
    const mk = (len, nm) => ({ name: nm, preload: { [base]: [...rbytes(r, len, 0x21, 0x7E), 0, 0x41] }, expect: { regs: { C: len } } });
    const tests = [mk(r.int(3, 12), 'a few characters'), mk(0, 'empty string'), mk(1, 'one character'), mk(r.int(13, 20), 'a long string')];
    const body = (pre) => ['START:  LD HL,' + lit(base), '        LD C,0', ...(pre ? ['LOOP:   INC C', '        LD A,(HL)', '        INC HL', '        OR A', '        JR NZ,LOOP'] : ['LOOP:   LD A,(HL)', '        OR A', '        JR Z,DONE', '        INC C', '        INC HL', '        JR LOOP']), 'DONE:   HALT'];
    return { title: 'Length of a string', text: `A string of characters ends with a zero byte (NUL). It starts at **${lit(base)}**. Write a Z80 program that leaves its length (not counting the NUL) in **C**. An empty string has length 0.`,
      tests, concepts: ['program-control.z80-loops-and-conditions'], reference: src(body(false)), mutants: [{ name: 'counts the NUL as well', source: src(body(true)) }] };
  } },
  'count-equal': { build(r) {
    const base = r.pick(ADDR), n = r.int(6, 12), k = r.int(1, 254);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { regs: { C: a.filter((x) => x === k).length } } });
    const rnd = () => rbytes(r, n).map((x) => (x === k ? (x + 1) & 255 : x));
    const f = rnd(); f[0] = k; const l = rnd(); l[n - 1] = k;
    const tests = [mk(rnd().map((x) => (r.int(0, 2) === 0 ? k : x)), 'several matches'), mk(rnd(), 'no matches'), mk(f, 'match first'), mk(l, 'match last'), mk(Array(n).fill(k), 'all match')];
    const body = (cnt, cc) => ['START:  LD HL,' + lit(base), `        LD B,${cnt}`, '        LD C,0', 'LOOP:   LD A,(HL)', `        CP ${lit(k, 2)}`, `        JR ${cc},NEXT`, '        INC C', 'NEXT:   INC HL', '        DJNZ LOOP', '        HALT'];
    return { title: 'Count the bytes equal to a value', text: `${n} bytes are stored starting at **${lit(base)}**. Write a Z80 program that counts how many are equal to **${k}** (decimal) and leaves the count in **C**.`,
      tests, concepts: ['program-control.z80-loops-and-conditions'], reference: src(body(n, 'NZ')), mutants: [{ name: 'misses the last byte', source: src(body(n - 1, 'NZ')) }, { name: 'counts the bytes that differ', source: src(body(n, 'Z')) }] };
  } },
};

export const writeProgramZ80 = {
  id: 'write-program-z80',
  title: 'Write a program (Z80)',
  concepts: ['program-control.z80-loops-and-conditions'],
  conventions: 'Programs are Z80 assembly run on the site\'s Z80 core. Your code starts at 0100H (the grader adds ORG 0100H if you give none, and HALT and END if missing). The data is placed in memory before your program runs; registers start at zero. Only the outputs the problem names are checked; every other register is yours to use. Comparisons are unsigned unless the problem says otherwise.',
  tasks: TASKS,
  make(r, { task } = {}) {
    const id = task || r.pick(Object.keys(TASKS)), t = TASKS[id].build(r), first = t.tests[0];
    const inputs = Object.entries(first.preload).map(([a, b]) => `${lit(+a)}: ${bytesHex(b)}`).join(', ');
    const expected = [...Object.entries(first.expect.regs || {}).map(([k, v]) => `${k} = ${hx(v, k.length === 2 ? 4 : 2)}H`), ...Object.entries(first.expect.mem || {}).filter(([a]) => !(a in first.preload) || String(first.preload[a]) !== String(first.expect.mem[a])).map(([a, b]) => `memory at ${lit(+a)} = ${bytesHex(b)}`)].join('; ');
    const parts = [{ label: 'a', kind: 'code', cpu: 'z80', prompt: `${t.text}\n\nExample: with memory ${inputs}, the program ends with ${expected}.`, answer: t.reference, display: t.reference,
      explain: 'A reference solution is shown above. Any program that passes every test is correct; yours need not match it line for line.', tests: t.tests }];
    return { family: 'write-program-z80', cpu: 'z80', task: id, title: t.title + ' (Z80)', concepts: t.concepts, conventions: this.conventions, prompt: 'Write a Z80 program for the task below, then run it against the tests.', parts, tests: t.tests, reference: t.reference, solution: '```\n' + t.reference.trim() + '\n```', _mutants: t.mutants };
  },
  verify(p) {
    const ref = gradeProgram(p, p.reference);
    if (ref.error) return { a: `reference does not assemble: ${ref.error}` };
    if (ref.passed !== ref.total) return { a: `reference fails ${ref.results.filter((x) => !x.pass).map((x) => x.name + ': ' + x.detail).join(' | ')}` };
    for (const m of p._mutants) {
      const g = gradeProgram(p, m.source);
      if (g.error) return { a: `mutant "${m.name}" does not assemble: ${g.error}` };
      if (g.passed === g.total) return { a: `mutant "${m.name}" passes every test, so the tests do not catch it` };
    }
    return { a: 'ok' };
  },
};
export const problems = { 'write-program-z80': writeProgramZ80 };
