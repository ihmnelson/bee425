// Differential fuzzer: random single instructions run in the real EASy68K (oracle) and in my assembler+CPU.
// usage: node fuzz.js [count] [seed] [outFile]
const fs = require('fs'), cp = require('child_process'), path = require('path'); // eslint-disable-line
const P = path.join(__dirname, '..', '..', '..', 'js', 'm68k') + path.sep;
const { assemble } = require(P + 'asm.js');
const { CPU } = require(P + 'cpu.js');
const ORA = process.env.EASY68K_ORACLE || __dirname;   // directory containing src/bin/asm68k and the osim harness binary
const N = +process.argv[2] || 500; let seed = +process.argv[3] || 1;
const outFile = process.argv[4] || null;
const work = path.join(require('os').tmpdir(), 'q68k-fuzz'); fs.mkdirSync(work, { recursive: true });

function rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
const ri = (n) => Math.floor(rnd() * n), pick = (a) => a[ri(a.length)];
const hex = (v, w) => '$' + (v >>> 0).toString(16).toUpperCase().padStart(w || 1, '0');
const edge = (sz) => pick([0, 1, 0x7F, 0x80, 0xFF, 0x7FFF, 0x8000, 0xFFFF, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFF, ri(0x100000000)].map((v) => v >>> 0));

function ea(kind, sz, o) {
  // o: {isDest}; returns text. kinds: list of allowed classes
  const k = pick(kind);
  const A = () => 'A' + ri(6);
  const disp = () => 2 * (ri(64) - 32);
  switch (k) {
    case 'D': return 'D' + ri(6);
    case 'A': return A();
    case 'I': return `(${A()})`;
    case 'P': return `(${A()})+`;
    case 'M': return `-(${A()})`;
    case 'R': return `${disp()}(${A()})`;
    case 'X': return `${2 * (ri(32) - 16)}(${A()},${pick(['D7.W', 'D7.L', 'A6.W', 'A6.L'])})`;
    case 'W': return `${hex(0x4000 + 2 * ri(128), 4)}.W`;
    case 'L': return `${hex(0x4000 + 2 * ri(128), 8)}.L`;
    case 'C': return `PCD(PC)`;
    case '#': return '#' + (sz === 'B' ? hex(ri(256)) : sz === 'W' ? hex(ri(65536)) : hex(edge('L')));
    case 'S': return pick(['SP', 'A7']);
  }
}
const DATA = ['D', 'I', 'P', 'M', 'R', 'X', 'W', 'L', '#', 'C'], DALT = ['D', 'I', 'P', 'M', 'R', 'X', 'W', 'L'], MALT = ['I', 'P', 'M', 'R', 'X', 'W', 'L'], ALL = [...DATA, 'A'];
const SZ = () => pick(['B', 'W', 'L']);

const GENS = [
  () => { const s = SZ(); return `ADD.${s} ${ea(s === 'B' ? DATA : ALL, s)},D${ri(6)}`; },
  () => { const s = SZ(); return `ADD.${s} D${ri(6)},${ea(MALT, s)}`; },
  () => { const s = SZ(); return `SUB.${s} ${ea(s === 'B' ? DATA : ALL, s)},D${ri(6)}`; },
  () => { const s = SZ(); return `SUB.${s} D${ri(6)},${ea(MALT, s)}`; },
  () => { const s = pick(['W', 'L']); return `${pick(['ADDA', 'SUBA', 'CMPA'])}.${s} ${ea(ALL, s)},A${ri(6)}`; },
  () => { const s = SZ(); return `${pick(['ADDI', 'SUBI', 'ANDI', 'ORI', 'EORI', 'CMPI'])}.${s} ${ea(['#'], s)},${ea(['D', 'I', 'P', 'M', 'R', 'X', 'W', 'L'], s)}`; },
  () => { const s = SZ(); return `${pick(['ADDQ', 'SUBQ'])}.${s} #${1 + ri(8)},${ea(s === 'B' ? DALT : [...DALT, 'A'], s)}`; },
  () => { const s = SZ(); return `${pick(['AND', 'OR'])}.${s} ${ea(DATA, s)},D${ri(6)}`; },
  () => { const s = SZ(); return `${pick(['AND', 'OR'])}.${s} D${ri(6)},${ea(MALT, s)}`; },
  () => { const s = SZ(); return `EOR.${s} D${ri(6)},${ea(DALT, s)}`; },
  () => { const s = SZ(); return `CMP.${s} ${ea(s === 'B' ? DATA : ALL, s)},D${ri(6)}`; },
  () => { const s = SZ(); return `${pick(['NEG', 'NEGX', 'NOT', 'CLR', 'TST'])}.${s} ${ea(DALT, s)}`; },
  () => `SWAP D${ri(6)}`,
  () => `EXT.${pick(['W', 'L'])} D${ri(6)}`,
  () => `${pick(['MULU', 'MULS'])}.W ${ea(DATA, 'W')},D${ri(6)}`,
  () => `${pick(['DIVU', 'DIVS'])}.W ${ea(DATA, 'W')},D${ri(6)}`,
  () => { const s = SZ(); return `${pick(['ASL', 'ASR', 'LSL', 'LSR', 'ROL', 'ROR', 'ROXL', 'ROXR'])}.${s} #${1 + ri(8)},D${ri(6)}`; },
  () => { const s = SZ(); return `${pick(['ASL', 'ASR', 'LSL', 'LSR', 'ROL', 'ROR', 'ROXL', 'ROXR'])}.${s} D${ri(6)},D${ri(6)}`; },
  () => `${pick(['ASL', 'ASR', 'LSL', 'LSR', 'ROL', 'ROR', 'ROXL', 'ROXR'])}.W ${ea(MALT, 'W')}`,
  () => `${pick(['BTST', 'BCHG', 'BCLR', 'BSET'])} D${ri(6)},${ea(['D', 'I', 'P', 'M', 'R', 'X', 'W', 'L'], 'B')}`,
  () => `${pick(['BTST', 'BCHG', 'BCLR', 'BSET'])} #${ri(32)},D${ri(6)}`,
  () => `${pick(['BTST', 'BCHG', 'BCLR', 'BSET'])}.B #${ri(8)},${ea(MALT, 'B')}`,
  () => `S${pick(['T', 'F', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'])} ${ea(DALT, 'B')}`,
  () => { const s = SZ(); return `MOVE.${s} ${ea(s === 'B' ? DATA : ALL, s)},${ea(DALT, s)}`; },
  () => { const s = pick(['W', 'L']); return `MOVEA.${s} ${ea(ALL, s)},A${ri(6)}`; },
  () => `LEA ${ea(['I', 'R', 'X', 'W', 'L', 'C'], 'L')},A${ri(6)}`,
  () => `EXG ${pick(['D', 'A'])}${ri(6)},${pick(['D', 'A'])}${ri(6)}`,
  () => `${pick(['ABCD', 'SBCD'])} D${ri(6)},D${ri(6)}`,
  () => `${pick(['ADDX', 'SUBX'])}.${SZ()} D${ri(6)},D${ri(6)}`,
  () => { const s = SZ(); return `${pick(['ADDX', 'SUBX'])}.${s} -(A${ri(6)}),-(A${ri(6)})`; },
  () => `NBCD ${ea(DALT, 'B')}`,
  () => `${pick(['ABCD', 'SBCD'])} -(A${ri(6)}),-(A${ri(6)})`,
  () => `TAS ${ea(DALT, 'B')}`,
  () => `CMPM.${SZ()} (A${ri(6)})+,(A${ri(6)})+`,
  () => `MOVEQ #${ri(256) - 128},D${ri(6)}`,
  () => `CHK ${ea(DATA, 'W')},D${ri(6)}`,
  () => { const s = pick(['W', 'L']); const regs = pick(['D0-D3/A0-A2', 'D1/D4/A1', 'D0-D2', 'A0-A3', 'D2-D5/A0']); return pick([`MOVEM.${s} ${regs},-(A${ri(6)})`, `MOVEM.${s} ${regs},${ea(['I', 'R', 'W'], s)}`, `MOVEM.${s} ${ea(['P', 'I', 'R', 'W', 'C'], s)},${regs}`]); },
  () => `PEA ${ea(['I', 'R', 'X', 'W', 'L', 'C'], 'L')}`,
  () => 'LINK A5,#' + (-2 * ri(16)),
  () => `MOVE ${pick(['SR', 'CCR'])},D${ri(6)}`.replace('CCR', 'SR'),
  () => `MOVE ${ea(['D', 'I', '#', 'R'], 'W')},CCR`,
  () => `ANDI #${hex(ri(32))},CCR`,
  () => `ORI #${hex(ri(32))},CCR`,
  () => `EORI #${hex(ri(32))},CCR`,
  () => { const cc = pick(['T', 'F', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE']); return `DB${cc === 'F' ? 'RA' : cc} D${ri(6)},SKIP\n        MOVE.W #1,D6\nSKIP    NOP`; },
  () => { const cc = pick(['HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE']); return `B${cc}.S SKIP\n        MOVE.W #1,D6\nSKIP    NOP`; },
  () => { const cc = pick(['HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE']); return `B${cc} SKIP\n        MOVE.W #1,D6\nSKIP    NOP`; },
  () => `MOVEP.${pick(['W', 'L'])} D${ri(6)},${2 * ri(8)}(A${ri(6)})`,
  () => `MOVEP.${pick(['W', 'L'])} ${2 * ri(8)}(A${ri(6)}),D${ri(6)}`,
];

function newParams() {
  const p = { D: [], A: [], a6: 2 * ri(20), d7: 2 * (ri(12) - 6), ccr: ri(32), data: [] };
  for (let i = 0; i < 7; i++) p.D.push(edge('L'));
  for (let i = 0; i < 6; i++) p.A.push(0x4100 + 2 * (ri(16) - 8));
  for (let i = 0; i < 256; i++) p.data.push(ri(256));
  return p;
}
function program(testLines, P) {
  const L = [];
  L.push('        ORG $1000');
  L.push('START');
  for (let i = 0; i < 7; i++) L.push(`        MOVE.L #${hex(P.D[i], 8)},D${i}`);
  L.push('        MOVE.L #' + hex(P.d7, 8) + ',D7');
  for (let i = 0; i < 6; i++) L.push(`        LEA ${hex(P.A[i], 4)},A${i}`);
  L.push('        MOVE.W #' + P.a6 + ',A6');
  L.push('        LEA $6000,A7');
  L.push(`        MOVE.W #${hex(P.ccr)},CCR`);
  L.push('TEST');
  testLines.split('\n').forEach((l) => L.push(l.startsWith(' ') || /^(SKIP|TEST)/.test(l) ? l : '        ' + l));
  L.push('        MOVE.W SR,$4F00.W');
  L.push('        STOP #$2700');
  L.push('PCD     DC.W $1234,$5678');
  L.push('        ORG $4000');
  for (let i = 0; i < 16; i++) L.push('        DC.B ' + P.data.slice(i * 16, i * 16 + 16).map((v) => hex(v, 2)).join(','));
  L.push('        END START');
  return L.join('\n') + '\n';
}

function oracleRun(src, id) {
  const f = path.join(work, `t${id}.X68`); fs.writeFileSync(f, src);
  let asmOut = '';
  try { asmOut = cp.execFileSync(path.join(ORA, 'src/bin/asm68k'), [f], { stdio: 'pipe' }).toString(); } catch (e) { asmOut = (e.stdout || '').toString(); }
  const lst = fs.readFileSync(f.replace('.X68', '.L68'), 'utf8');
  const errs = /ERROR/.test(lst);
  if (errs) return { error: true, lst };
  const out = cp.execFileSync(path.join(ORA, 'osim'), [f.replace('.X68', '.S68'), '10000', '4000:100', '5F80:80', '4F00:2'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  const st = JSON.parse(out.split('\n').filter((l) => l.startsWith('{'))[0]);
  // machine code of TEST line
  const m = /^([0-9A-F]{8})\s+((?:[0-9A-F]{4,8} ?)+?)\s+\d+\s+TEST/m;
  return { st, lst };
}

function mineRun(src) {
  const r = assemble(src);
  if (!r.ok) return { error: true, errs: r.errors };
  const cpu = new CPU();
  for (const seg of r.image) for (let i = 0; i < seg.bytes.length; i++) cpu.mem[seg.addr + i] = seg.bytes[i];
  cpu.pc = r.start; cpu.run(10000);
  const hx = (v) => (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const memhex = (a, n) => Array.from(cpu.mem.slice(a, a + n)).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  return { r, cpu, st: { D: Array.from(cpu.D).map(hx), A: Array.from(cpu.A).map(hx), ccr: cpu.getCCR(), mem4000: memhex(0x4000, 0x100), mem5F80: memhex(0x5F80, 0x80), sr4F00: (cpu.mem[0x4F00] << 8) | cpu.mem[0x4F01], halted: cpu.halted, steps: cpu.steps } };
}

const golden = []; const GOLDEN_MAX = +process.env.GOLDEN_MAX || 0; let bad = 0, agreeErr = 0, ran = 0; const failures = [];
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const line = pick(GENS)();
  const P = newParams(); const src = program(line, P);
  const o = oracleRun(src, i % 8), m = mineRun(src);
  const oErr = !!o.error, mErr = !!m.error;
  if (oErr || mErr) {
    if (oErr && mErr) { agreeErr++; continue; }
    bad++; failures.push({ i, kind: oErr ? 'ORACLE-REJECTS' : 'MINE-REJECTS', line, detail: oErr ? (o.lst.match(/ERROR.*/) || [''])[0] : JSON.stringify(m.errs) });
    continue;
  }
  ran++;
  // compare machine code of the test
  const mcOracle = (() => { const re = /^([0-9A-F]{8})\s+([0-9A-F ]+?)\s+\d+\s+TEST\b/m; const mm = re.exec(o.lst); return mm ? mm[2].replace(/ /g, '') : null; })();
  const first = line.split('\n')[0];
  const testEntry = m.r.listing.find((l) => /^TEST/.test(l.text) || (l.text.trim() === 'TEST'));
  const idx = m.r.listing.indexOf(testEntry);
  const ents = m.r.listing.slice(idx + 1, idx + 1 + line.split('\n').length).filter((l) => l.words);
  const mcMine = ents.length ? ents[0].words.map((w) => w.toString(16).toUpperCase().padStart(4, '0')).join('') : null;
  // oracle listing for the actual test instruction line: find line containing the instruction text
  const instRe = new RegExp('^([0-9A-F]{8})\\s+([0-9A-F ]+?)\\s+\\d+\\s+' + first.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '\\s*$', 'm');
  const im = instRe.exec(o.lst); const mcO = im ? im[2].replace(/ /g, '') : mcOracle;
  const diffs = [];
  if (mcO && mcMine && mcO !== mcMine) diffs.push(`machine code: oracle ${mcO} mine ${mcMine}`);
  const os = o.st, ms = m.st;
  const oA7 = (parseInt(os.A[7], 16)) >>> 0; os.A[7] = oA7.toString(16).toUpperCase().padStart(8, '0');   // oracle SIMHALT pushes a 6-byte frame
  for (let k = 0; k < 8; k++) { if (os.D[k] !== ms.D[k]) diffs.push(`D${k}: oracle ${os.D[k]} mine ${ms.D[k]}`); if (os.A[k] !== ms.A[k]) diffs.push(`A${k}: oracle ${os.A[k]} mine ${ms.A[k]}`); }
  
  const undefNV = /^(ABCD|SBCD|NBCD)/.test(line) ? 0b10101 : /^MULS/.test(line) ? 0b11101 : /^DIV[US]/.test(line) ? 0b11110 : /^CHK/.test(line) ? 0 : 31;  // documented deviations from EASy68K
  const occr = parseInt(os.mem['4F00'], 16) & undefNV, mccr = ms.sr4F00 & undefNV; if (occr !== mccr) diffs.push(`CCR(XNZVC): oracle ${occr.toString(2).padStart(5, '0')} mine ${mccr.toString(2).padStart(5, '0')}`);
    { const ostk = (parseInt(os.A[7], 16) - 0) >>> 0; } if (os.mem['4000'] !== ms.mem4000) diffs.push('memory $4000..: differs');
  if (!/^CHK/.test(line) && os.mem['5F80'] !== ms.mem5F80) diffs.push('stack memory $5F80..: differs');
  if (!diffs.length && golden.length < GOLDEN_MAX && !/^(CHK|DIV|MULS)/.test(line)) golden.push({ id: 'cpu-' + String(golden.length + 1).padStart(3, '0'), insn: line, P, mc: mcO || mcMine, expect: { D: os.D, A: os.A, ccr: occr & undefNV, ccrMask: undefNV, mem4000: os.mem['4000'], mem5F80: os.mem['5F80'] } });
  if (diffs.length) { bad++; failures.push({ i, kind: 'STATE', line, diffs, src, ccr0: (src.match(/MOVE\.W #(\$[0-9A-F]+),CCR/) || [])[1] }); }
}
console.log(`fuzz: ${N} cases, ${ran} executed in both, ${agreeErr} rejected by both, ${bad} DISAGREEMENTS (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
const byLine = {};
for (const f of failures.slice(0, 40)) { console.log(`#${f.i} ${f.kind}: ${f.line.split('\n')[0]}  [ccr0=${f.ccr0}]\n   ${(f.diffs || [f.detail]).slice(0, 4).join('\n   ')}`); }
if (outFile) fs.writeFileSync(outFile, JSON.stringify(failures, null, 1));

if (process.env.GOLDEN_OUT) fs.writeFileSync(process.env.GOLDEN_OUT, JSON.stringify(golden));
console.log('golden vectors recorded:', golden.length);
