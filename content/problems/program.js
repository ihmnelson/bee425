/* Write-a-program problems (practice Problem 7 and the homework style). Each task builds hidden test data from the seed and a
   model answer in JavaScript; the reference 68000 program is run on the core against every test, and the audit also requires
   every deliberately wrong variant ("mutant") to fail at least one test, so the tests really discriminate. */
import { gradeProgram } from './grade.js';

const hx = (n, d) => (n >>> 0).toString(16).toUpperCase().padStart(d, '0');
const bytesHex = (a) => a.map((b) => hx(b, 2)).join(' ');
const long = (v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
const word = (v) => [(v >>> 8) & 255, v & 255];
const bits = (v) => { let n = 0; for (let i = 0; i < 32; i++) if ((v >>> i) & 1) n++; return n; };
const rbytes = (r, n, lo = 0, hi = 255) => Array.from({ length: n }, () => r.int(lo, hi));
const ADDR = [0x2000, 0x3000, 0x4000];

const header = (extra = '') => `        ORG     $1000\nSTART   ${extra}`;
const src = (lines) => lines.join('\n') + '\n';

/* each task: build(r) -> {title, text, outSize, tests[], reference, mutants[{name, source}], concepts, forbid?} */
const TASKS = {
  'count-ones': { build(r) {
    const base = r.pick(ADDR);
    const mk = (v) => ({ name: `longword $${hx(v, 8)}`, preload: { [base]: long(v) }, expect: { regs: { D1: bits(v) }, mem: { [base]: long(v) } } });
    const tests = [mk(0xF0F0A5C3 ^ r.int(0, 0xFFFF)), mk(r.int(1, 0xFFFFFFFF)), mk(r.int(1, 0xFFFFFFFF)), mk(0), mk(0xFFFFFFFF), mk(0x80000001), mk(1), mk(0x80000000)];
    const body = (n) => [`START   MOVE.L  $${hx(base, 4)},D0`, '        CLR.L   D1', '        CLR.L   D3', `        MOVEQ   #${n},D2`, 'loop    LSL.L   #1,D0', '        ADDX.L  D3,D1', '        DBRA    D2,loop', '        SIMHALT', '        END     START'];
    return {
      title: 'Count the 1 bits in a longword', outSize: 'L',
      text: `Write a 68K program that counts the number of 1 bits in the longword stored at memory location **$${hx(base, 8)}**. Leave the count in **D1**. Do not destroy the number in memory: copy it to a register first, then count. (Hint: think about the LSL instruction and the carry bit.)`,
      tests, concepts: ['program-control.m68k-loops-and-ifs', 'program-control.m68k-compare-and-flags', 'addressing-modes.m68k-register-direct'],
      reference: src(['        ORG     $1000', ...body(31)]),
      mutants: [{ name: 'counts only 31 bits', source: src(['        ORG     $1000', ...body(30)]) }, { name: 'forgets to clear D1', source: src(['        ORG     $1000', ...body(31)]).replace('        CLR.L   D1\n', '        MOVEQ   #1,D1\n') }],
    };
  } },
  'sum-bytes': { build(r) {
    const base = r.pick(ADDR), n = r.int(4, 12);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { regs: { D1: a.reduce((s, x) => s + x, 0) } } });
    const tests = [mk(rbytes(r, n), 'random bytes'), mk(rbytes(r, n, 100, 255), 'large bytes'), mk(rbytes(r, n), 'random bytes'), mk(Array(n).fill(0), 'all zero'), mk(Array(n).fill(255), 'all $FF'), mk([1, ...Array(n - 1).fill(0)], 'one at the start'), mk([...Array(n - 1).fill(0), 7], 'seven at the end')];
    const body = (add) => [`START   LEA     $${hx(base, 4)},A0`, '        CLR.L   D1', '        CLR.L   D0', `        MOVEQ   #${n - 1},D2`, 'loop    MOVE.B  (A0)+,D0', `        ${add}`, '        DBRA    D2,loop', '        SIMHALT', '        END     START'];
    return {
      title: 'Sum an array of bytes', outSize: 'W',
      text: `${n} unsigned bytes are stored starting at **$${hx(base, 4)}**. Write a 68K program that adds them and leaves the total in **D1** (a word, so the total can exceed 255). Only the low word of D1 is checked.`,
      tests, concepts: ['program-control.m68k-loops-and-ifs', 'addressing-modes.m68k-register-indirect'],
      reference: src(['        ORG     $1000', ...body('ADD.W   D0,D1')]),
      mutants: [{ name: 'adds as bytes, so the total wraps at 256', source: src(['        ORG     $1000', ...body('ADD.B   D0,D1')]) }, { name: 'sums one byte too few', source: src(['        ORG     $1000', ...body('ADD.W   D0,D1')]).replace(`#${n - 1},D2`, `#${n - 2},D2`) }],
    };
  } },
  'max-byte': { build(r) {
    const base = r.pick(ADDR), n = r.int(5, 12);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { regs: { D1: Math.max(...a) } } });
    const big = rbytes(r, n, 0, 100); big[r.int(0, n - 1)] = r.int(130, 255);
    const first = rbytes(r, n, 0, 90); first[0] = 200; const last = rbytes(r, n, 0, 90); last[n - 1] = 250;
    const tests = [mk(rbytes(r, n), 'random bytes'), mk(big, 'one value above $7F'), mk(first, 'maximum first'), mk(last, 'maximum last'), mk(Array(n).fill(0), 'all zero'), mk(rbytes(r, n, 128, 255), 'all above $7F'), mk(rbytes(r, n, 0, 127), 'all below $80')];
    const body = (br) => [`START   LEA     $${hx(base, 4)},A0`, '        MOVEQ   #0,D1', `        MOVEQ   #${n - 1},D2`, 'loop    CMP.B   (A0)+,D1', `        ${br}     next`, '        MOVE.B  -1(A0),D1', 'next    DBRA    D2,loop', '        SIMHALT', '        END     START'];
    return {
      title: 'Largest byte in an array', outSize: 'B',
      text: `${n} **unsigned** bytes are stored starting at **$${hx(base, 4)}**. Write a 68K program that leaves the largest in **D1** (low byte checked). Unsigned means $FF is larger than $7F.`,
      tests, concepts: ['program-control.m68k-compare-and-flags', 'program-control.m68k-loops-and-ifs'],
      reference: src(['        ORG     $1000', ...body('BCC')]),
      mutants: [{ name: 'compares as signed numbers (BGE)', source: src(['        ORG     $1000', ...body('BGE')]) }],
    };
  } },
  'count-equal': { build(r) {
    const base = r.pick(ADDR), n = r.int(6, 12), k = r.int(1, 254);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { regs: { D1: a.filter((x) => x === k).length } } });
    const rnd = () => rbytes(r, n).map((x) => (x === k ? (x + 1) & 255 : x));
    const sprinkled = rnd().map((x) => (r.int(0, 2) === 0 ? k : x));
    const f = rnd(); f[0] = k; const l = rnd(); l[n - 1] = k;
    const tests = [mk(sprinkled, 'several matches'), mk(rnd(), 'no matches'), mk(f, 'match first'), mk(l, 'match last'), mk(Array(n).fill(k), 'all match'), mk(rnd().map((x, i) => (i % 2 ? k : x)), 'alternating')];
    const body = (cnt) => [`START   LEA     $${hx(base, 4)},A0`, '        CLR.L   D1', `        MOVEQ   #${cnt},D2`, 'loop    CMPI.B  #' + k + ',(A0)+', '        BNE     next', '        ADDQ.W  #1,D1', 'next    DBRA    D2,loop', '        SIMHALT', '        END     START'];
    return {
      title: 'Count the bytes equal to a value', outSize: 'W',
      text: `${n} bytes are stored starting at **$${hx(base, 4)}**. Write a 68K program that counts how many of them are equal to **${k}** (decimal) and leaves the count in **D1**. Only the low word of D1 is checked.`,
      tests, concepts: ['program-control.m68k-loops-and-ifs', 'program-control.m68k-compare-and-flags'],
      reference: src(['        ORG     $1000', ...body(n - 1)]),
      mutants: [{ name: 'misses the last byte', source: src(['        ORG     $1000', ...body(n - 2)]) }, { name: 'counts the bytes that differ', source: src(['        ORG     $1000', ...body(n - 1)]).replace('BNE     next', 'BEQ     next') }],
    };
  } },
  'copy-block': { build(r) {
    const [sb, db] = r.pick([[0x2000, 0x3000], [0x2000, 0x4000], [0x3000, 0x2000]]), n = r.int(5, 14);
    const mk = (a, nm) => ({ name: nm, preload: { [sb]: a, [db + n]: [0xEE] }, expect: { mem: { [sb]: a, [db]: a, [db + n]: [0xEE] } } });
    const tests = [mk(rbytes(r, n), 'random data'), mk(rbytes(r, n), 'random data'), mk(Array(n).fill(0xFF), 'all $FF'), mk(Array.from({ length: n }, (_, i) => i + 1), 'counting 1, 2, 3...'), mk(Array(n).fill(0), 'all zero')];
    const body = (cnt) => [`START   LEA     $${hx(sb, 4)},A0`, `        LEA     $${hx(db, 4)},A1`, `        MOVEQ   #${cnt},D2`, 'loop    MOVE.B  (A0)+,(A1)+', '        DBRA    D2,loop', '        SIMHALT', '        END     START'];
    return {
      title: 'Copy a block of bytes', outSize: 'L',
      text: `Write a 68K program that copies **${n} bytes** from **$${hx(sb, 4)}** to **$${hx(db, 4)}** (the two blocks do not overlap). The source must be unchanged and no byte beyond the destination block may be touched.`,
      tests, concepts: ['addressing-modes.m68k-register-indirect', 'program-control.m68k-loops-and-ifs'],
      reference: src(['        ORG     $1000', ...body(n - 1)]),
      mutants: [{ name: 'copies one byte too few', source: src(['        ORG     $1000', ...body(n - 2)]) }, { name: 'copies one byte too many', source: src(['        ORG     $1000', ...body(n)]) }],
    };
  } },
  'reverse-array': { build(r) {
    const base = r.pick(ADDR), n = 2 * r.int(2, 6);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { mem: { [base]: a.slice().reverse() } } });
    const tests = [mk(rbytes(r, n), 'random bytes'), mk(Array.from({ length: n }, (_, i) => i + 1), 'counting 1, 2, 3...'), mk(rbytes(r, n), 'random bytes'), mk(Array(n).fill(0x55), 'all equal')];
    const body = (cnt) => [`START   LEA     $${hx(base, 4)},A0`, `        LEA     $${hx(base + n, 4)},A1`, `        MOVEQ   #${cnt},D2`, 'loop    MOVE.B  (A0),D0', '        MOVE.B  -(A1),(A0)+', '        MOVE.B  D0,(A1)', '        DBRA    D2,loop', '        SIMHALT', '        END     START'];
    return {
      title: 'Reverse an array in place', outSize: 'L',
      text: `${n} bytes are stored starting at **$${hx(base, 4)}**. Write a 68K program that reverses their order **in place** (the first byte swaps with the last, and so on).`,
      tests, concepts: ['addressing-modes.m68k-register-indirect', 'program-control.m68k-loops-and-ifs'],
      reference: src(['        ORG     $1000', ...body(n / 2 - 1)]),
      mutants: [{ name: 'swaps every pair twice (reverses back)', source: src(['        ORG     $1000', ...body(n - 1)]) }, { name: 'leaves the middle pair', source: src(['        ORG     $1000', ...body(n / 2 - 2 < 0 ? 0 : n / 2 - 2)]) }],
    };
  } },
  'count-negative': { build(r) {
    const base = r.pick(ADDR), n = r.int(4, 9);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a.flatMap(word) }, expect: { regs: { D1: a.filter((x) => x & 0x8000).length } } });
    const rw = () => r.int(0, 0xFFFF);
    const tests = [mk(Array.from({ length: n }, rw), 'random words'), mk(Array.from({ length: n }, () => r.pick([0, 1, 0x7FFF, 0x8000, 0xFFFF])), 'edge values'), mk(Array(n).fill(0), 'all zero'), mk(Array.from({ length: n }, (_, i) => (i % 2 ? 0 : rw() | 0x8000)), 'zeros mixed with negatives'), mk(Array.from({ length: n }, () => rw() & 0x7FFF), 'no negatives')];
    const body = (br) => [`START   LEA     $${hx(base, 4)},A0`, '        CLR.L   D1', `        MOVEQ   #${n - 1},D2`, 'loop    MOVE.W  (A0)+,D0', `        ${br}     next`, '        ADDQ.W  #1,D1', 'next    DBRA    D2,loop', '        SIMHALT', '        END     START'];
    return {
      title: 'Count the negative words', outSize: 'W',
      text: `${n} **signed** 16-bit words are stored starting at **$${hx(base, 4)}**. Write a 68K program that counts how many are **negative** (less than zero; zero is not negative) and leaves the count in **D1** (low word checked).`,
      tests, concepts: ['program-control.m68k-compare-and-flags', 'program-control.m68k-loops-and-ifs'],
      reference: src(['        ORG     $1000', ...body('BPL')]),
      mutants: [{ name: 'counts zero as negative (BGT instead of BPL)', source: src(['        ORG     $1000', ...body('BGT')]) }],
    };
  } },
  'string-length': { build(r) {
    const base = r.pick(ADDR);
    const mk = (len, nm) => { const s = rbytes(r, len, 0x21, 0x7E); return { name: nm, preload: { [base]: [...s, 0, 0x41, 0x42] }, expect: { regs: { D1: len } } }; };
    const tests = [mk(r.int(3, 12), 'a few characters'), mk(0, 'empty string'), mk(1, 'one character'), mk(r.int(13, 20), 'a long string'), mk(r.int(3, 12), 'a few characters')];
    const body = (pre) => [`START   LEA     $${hx(base, 4)},A0`, '        CLR.L   D1', ...(pre ? ['loop    ADDQ.W  #1,D1', '        TST.B   (A0)+', '        BNE     loop', '        SIMHALT', '        END     START'] : ['loop    TST.B   (A0)+', '        BEQ     done', '        ADDQ.W  #1,D1', '        BRA     loop', 'done    SIMHALT', '        END     START'])];
    return {
      title: 'Length of a string', outSize: 'W',
      text: `A string of characters ends with a zero byte (NUL). It starts at **$${hx(base, 4)}**. Write a 68K program that finds its length (not counting the NUL) and leaves it in **D1** (low word checked). An empty string has length 0.`,
      tests, concepts: ['program-control.m68k-loops-and-ifs', 'addressing-modes.m68k-register-indirect'],
      reference: src(['        ORG     $1000', ...body(false)]),
      mutants: [{ name: 'counts the NUL as well', source: src(['        ORG     $1000', ...body(true)]) }],
    };
  } },
  'multiply-const': { build(r) {
    const base = r.pick(ADDR), k = r.pick([5, 6, 7, 9, 10, 12, 14, 18, 20]);
    const mk = (v, nm) => ({ name: nm, preload: { [base]: [v] }, expect: { mem: { [base + 2]: word(v * k) } } });
    const tests = [mk(r.int(2, 255), 'random byte'), mk(r.int(2, 255), 'random byte'), mk(0, 'zero'), mk(1, 'one'), mk(255, '$FF'), mk(r.int(100, 200), 'a large byte')];
    const build = (kk) => {
      const L = [`START   CLR.L   D0`, `        MOVE.B  $${hx(base, 4)},D0`, '        CLR.L   D1'];
      for (let b = 0; b < 8; b++) if ((kk >> b) & 1) { if (b === 0) L.push('        ADD.W   D0,D1'); else L.push('        MOVE.W  D0,D2', `        LSL.W   #${b},D2`, '        ADD.W   D2,D1'); }
      L.push(`        MOVE.W  D1,$${hx(base + 2, 4)}`, '        SIMHALT', '        END     START');
      return src(['        ORG     $1000', ...L]);
    };
    return {
      title: 'Multiply by a constant with shifts and adds', outSize: 'L', forbid: ['MULU', 'MULS'],
      text: `An unsigned byte is stored at **$${hx(base, 4)}**. Write a 68K program that multiplies it by **${k}** and stores the product as a **word** at **$${hx(base + 2, 4)}**. Use shifts and adds only: MULU and MULS are not allowed. (Hint: write ${k} as a sum of powers of two.)`,
      tests, concepts: ['program-control.m68k-loops-and-ifs', 'addressing-modes.m68k-register-direct'],
      reference: build(k),
      mutants: [{ name: `multiplies by ${k ^ 1}`, source: build(k ^ 1) }],
    };
  } },
  'find-first': { build(r) {
    const base = r.pick(ADDR), n = r.int(6, 12), k = r.int(1, 254);
    const idx = (a) => a.indexOf(k);
    const mk = (a, nm) => ({ name: nm, preload: { [base]: a }, expect: { regs: { D1: idx(a) < 0 ? 0xFFFFFFFF : idx(a) } } });
    const rnd = () => rbytes(r, n).map((x) => (x === k ? (x + 1) & 255 : x));
    const mid = rnd(); mid[r.int(1, n - 2)] = k; const dup = rnd(); dup[2] = k; dup[n - 1] = k; const f = rnd(); f[0] = k; const l = rnd(); l[n - 1] = k;
    const tests = [mk(mid, 'value in the middle'), mk(rnd(), 'value absent'), mk(f, 'value first'), mk(l, 'value last'), mk(dup, 'value twice')];
    const body = (fix) => [`START   LEA     $${hx(base, 4)},A0`, '        MOVEQ   #0,D1', `        MOVEQ   #${n - 1},D2`, `loop    CMPI.B  #${k},(A0)+`, '        BEQ     done', '        ADDQ.L  #1,D1', '        DBRA    D2,loop', ...(fix ? ['        MOVEQ   #-1,D1'] : []), 'done    SIMHALT', '        END     START'];
    return {
      title: 'Find the first occurrence of a value', outSize: 'L',
      text: `${n} bytes are stored starting at **$${hx(base, 4)}**. Write a 68K program that finds the **first** byte equal to **${k}** (decimal) and leaves its position in **D1** (the first byte is position 0). If the value does not occur, leave **$FFFFFFFF** (-1) in D1.`,
      tests, concepts: ['program-control.m68k-loops-and-ifs', 'program-control.m68k-compare-and-flags'],
      reference: src(['        ORG     $1000', ...body(true)]),
      mutants: [{ name: 'does not report a missing value', source: src(['        ORG     $1000', ...body(false)]) }],
    };
  } },
};

export const writeProgram = {
  id: 'write-program',
  title: 'Write a program',
  concepts: ['program-control.m68k-loops-and-ifs', 'program-control.m68k-compare-and-flags', 'addressing-modes.m68k-register-direct'],
  conventions: 'Programs are 68000 assembly run on the site\'s EASy68K-compatible core. Your code starts at $1000 (the grader adds ORG $1000 if you give none, and SIMHALT and END if missing). The data is placed in memory before your program runs; registers start at zero. Only the outputs the problem names are checked; every other register is yours to use. Results are compared as stated (low byte, word or longword). Unsigned and signed comparisons are stated in each problem.',
  tasks: TASKS,
  make(r, { task } = {}) {
    const id = task || r.pick(Object.keys(TASKS)), t = TASKS[id].build(r);
    const first = t.tests[0];
    const inputs = Object.entries(first.preload).filter(([a]) => !first.expect.mem || !(a in first.expect.mem) || true).map(([a, b]) => `$${hx(+a, 4)}: ${bytesHex(b)}`).join(', ');
    const expected = [...Object.entries(first.expect.regs || {}).map(([k, v]) => `${k} = $${hx(v, 8)}`), ...Object.entries(first.expect.mem || {}).filter(([a]) => !(a in first.preload) || String(first.preload[a]) !== String(first.expect.mem[a])).map(([a, b]) => `memory at $${hx(+a, 4)} = ${bytesHex(b)}`)].join('; ');
    const parts = [{
      label: 'a', kind: 'code', prompt: `${t.text}\n\nExample: with memory ${inputs}, the program ends with ${expected}.`,
      answer: t.reference, display: t.reference, explain: 'A reference solution is shown below. Any program that passes every test is correct; yours need not match it line for line.',
      tests: t.tests, forbid: t.forbid, outSize: t.outSize,
    }];
    return {
      family: 'write-program', task: id, title: t.title, concepts: t.concepts, conventions: this.conventions,
      prompt: 'Write a 68K program for the task below, then run it against the tests.', parts,
      tests: t.tests, forbid: t.forbid, outSize: t.outSize, reference: t.reference, solution: '```\n' + t.reference.trim() + '\n```', _mutants: t.mutants,
    };
  },
  /* the reference must pass every test, and every mutant must fail at least one */
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
export const problems = { 'write-program': writeProgram };
