/* Pairing 68000 and Z80 instructions (practice Problem 5). Each pair is a class of operation (copy, add, branch if zero, ...)
   with a 68000 form and a Z80 form. make() pairs them by construction; verify() runs every 68000 instruction and every Z80
   option on the real cores over random operand values and keeps only the Z80 instruction that behaves like the 68000 one,
   so a distractor is accepted as wrong only if its observed behaviour differs. */
import { asm68, run68, flags68, asmZ, runZ, flagsZ } from './cores.js';

const hx = (n, d) => n.toString(16).toUpperCase().padStart(d, '0');
const litZ = (v, d = 2) => { const t = hx(v, d) + 'H'; return /^[A-F]/.test(t) ? '0' + t : t; };
const ZR = ['B', 'C', 'D', 'E', 'H', 'L'];

/* ---- instruction specs: {asm, kind, ...}. kinds: op (register operation), imm, store, load, branch, call, ret, push, pop ---- */
const OPS = {
  copy: { keys: ['val'] }, add: { keys: ['val', 'Z', 'C'] }, sub: { keys: ['val', 'Z', 'C'] }, and: { keys: ['val', 'Z', 'C'] },
  or: { keys: ['val', 'Z', 'C'] }, xor: { keys: ['val', 'Z', 'C'] }, cmp: { keys: ['val', 'Z', 'C'] }, inc: { keys: ['val', 'Z'] },
  dec: { keys: ['val', 'Z'] }, not: { keys: ['val'] }, neg: { keys: ['val', 'Z', 'C'] }, shl: { keys: ['val', 'C'] }, shr: { keys: ['val', 'C'] },
  asr: { keys: ['val', 'C'] }, rol: { keys: ['val', 'C'] }, clear: { keys: ['val'] }, test: { keys: ['val', 'Z', 'C'] },
};
const pickD = (r, n) => r.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, n);

/* class table: build(r) -> {m, z, doc, diff} */
export const CLASSES = {
  'move-reg': { build(r) { const [s, d] = pickD(r, 2), [zs, zd] = r.shuffle(['A', ...ZR]).slice(0, 2);
    return { m: { asm: `MOVE.B D${s},D${d}`, kind: 'op', op: 'copy', src: s, dst: d }, z: { asm: `LD ${zd},${zs}`, kind: 'op', op: 'copy', src: zs, dst: zd },
      doc: 'copy a byte from one register to another', diff: 'The 68000 writes the source first (D' + s + ' to D' + d + '); the Z80 writes the destination first. The register names differ.' }; } },
  'load-imm': { build(r) { const [d] = pickD(r, 1), n = r.int(1, 255), zr = r.pick(['A', ...ZR]), zn = r.int(1, 255);
    return { m: { asm: `MOVE.B #$${hx(n, 2)},D${d}`, kind: 'imm', dst: d, value: n }, z: { asm: `LD ${zr},${litZ(zn)}`, kind: 'imm', dst: zr, value: zn },
      doc: 'load an immediate byte into a register', diff: 'The value and the register differ ($' + hx(n, 2) + ' into D' + d + ' versus ' + litZ(zn) + ' into ' + zr + ').' }; } },
  'store-abs': { build(r) { const [s] = pickD(r, 1), a = 2 * r.int(0x1000, 0x3FFF), za = 2 * r.int(0x1000, 0x3FFF);
    return { m: { asm: `MOVE.B D${s},$0000${hx(a, 4)}`, kind: 'store', src: s, addr: a }, z: { asm: `LD (${litZ(za, 4)}),A`, kind: 'store', src: 'A', addr: za },
      doc: 'store a byte from a register to an absolute memory address', diff: 'Any data register can be stored by the 68000; on the Z80 only A can use an absolute address. The addresses differ.' }; } },
  'load-abs': { build(r) { const [d] = pickD(r, 1), a = 2 * r.int(0x1000, 0x3FFF), za = 2 * r.int(0x1000, 0x3FFF);
    return { m: { asm: `MOVE.B $0000${hx(a, 4)},D${d}`, kind: 'load', dst: d, addr: a }, z: { asm: `LD A,(${litZ(za, 4)})`, kind: 'load', dst: 'A', addr: za },
      doc: 'load a byte from an absolute memory address into a register', diff: 'The 68000 can load any data register; on the Z80 only A can use an absolute address.' }; } },
  add: { build(r) { const [s, d] = pickD(r, 2), zs = r.pick(ZR);
    return { m: { asm: `ADD.B D${s},D${d}`, kind: 'op', op: 'add', src: s, dst: d }, z: { asm: `ADD A,${zs}`, kind: 'op', op: 'add', src: zs, dst: 'A' },
      doc: 'add a byte register to the destination and set the flags', diff: 'The 68000 may use any data register as the destination; the Z80 always accumulates in A.' }; } },
  sub: { build(r) { const [s, d] = pickD(r, 2), zs = r.pick(ZR);
    return { m: { asm: `SUB.B D${s},D${d}`, kind: 'op', op: 'sub', src: s, dst: d }, z: { asm: `SUB ${zs}`, kind: 'op', op: 'sub', src: zs, dst: 'A' },
      doc: 'subtract a byte register from the destination and set the flags', diff: 'The 68000 names its destination; the Z80 SUB always works on A.' }; } },
  and: { build(r) { const [s, d] = pickD(r, 2), zs = r.pick(ZR);
    return { m: { asm: `AND.B D${s},D${d}`, kind: 'op', op: 'and', src: s, dst: d }, z: { asm: `AND ${zs}`, kind: 'op', op: 'and', src: zs, dst: 'A' }, doc: 'AND a byte register into the destination', diff: 'The Z80 always ANDs into A.' }; } },
  or: { build(r) { const [s, d] = pickD(r, 2), zs = r.pick(ZR);
    return { m: { asm: `OR.B D${s},D${d}`, kind: 'op', op: 'or', src: s, dst: d }, z: { asm: `OR ${zs}`, kind: 'op', op: 'or', src: zs, dst: 'A' }, doc: 'OR a byte register into the destination', diff: 'The Z80 always ORs into A.' }; } },
  eor: { build(r) { const [s, d] = pickD(r, 2), zs = r.pick(ZR);
    return { m: { asm: `EOR.B D${s},D${d}`, kind: 'op', op: 'xor', src: s, dst: d }, z: { asm: `XOR ${zs}`, kind: 'op', op: 'xor', src: zs, dst: 'A' }, doc: 'exclusive-OR a byte register into the destination', diff: 'The mnemonic differs (EOR versus XOR) and the Z80 always works on A.' }; } },
  cmp: { build(r) { const [s, d] = pickD(r, 2), zs = r.pick(ZR);
    return { m: { asm: `CMP.B D${s},D${d}`, kind: 'op', op: 'cmp', src: s, dst: d }, z: { asm: `CP ${zs}`, kind: 'op', op: 'cmp', src: zs, dst: 'A' },
      doc: 'subtract and set the flags without storing the result', diff: 'The 68000 compares two data registers; the Z80 always compares with the accumulator A.' }; } },
  inc: { build(r) { const [d] = pickD(r, 1), zr = r.pick(['A', ...ZR]);
    return { m: { asm: `ADDQ.B #1,D${d}`, kind: 'op', op: 'inc', dst: d }, z: { asm: `INC ${zr}`, kind: 'op', op: 'inc', dst: zr }, doc: 'add 1 to a byte register', diff: 'ADDQ also sets the carry flag; INC leaves the Z80 carry unchanged.' }; } },
  dec: { build(r) { const [d] = pickD(r, 1), zr = r.pick(['A', ...ZR]);
    return { m: { asm: `SUBQ.B #1,D${d}`, kind: 'op', op: 'dec', dst: d }, z: { asm: `DEC ${zr}`, kind: 'op', op: 'dec', dst: zr }, doc: 'subtract 1 from a byte register', diff: 'SUBQ also sets the carry flag; DEC leaves the Z80 carry unchanged.' }; } },
  not: { build(r) { const [d] = pickD(r, 1);
    return { m: { asm: `NOT.B D${d}`, kind: 'op', op: 'not', dst: d }, z: { asm: 'CPL', kind: 'op', op: 'not', dst: 'A' }, doc: 'complement every bit of the register', diff: 'CPL works only on A and has no operand.' }; } },
  neg: { build(r) { const [d] = pickD(r, 1);
    return { m: { asm: `NEG.B D${d}`, kind: 'op', op: 'neg', dst: d }, z: { asm: 'NEG', kind: 'op', op: 'neg', dst: 'A' }, doc: 'replace the register with its two\'s complement (negate it)', diff: 'The Z80 NEG works only on A.' }; } },
  lsl: { build(r) { const [d] = pickD(r, 1);
    return { m: { asm: `LSL.B #1,D${d}`, kind: 'op', op: 'shl', dst: d }, z: { asm: 'SLA A', kind: 'op', op: 'shl', dst: 'A' }, doc: 'shift left one bit, with the old top bit going to carry', diff: 'LSL can shift any data register; SLA A is the arithmetic form, which gives the same result for a left shift.' }; } },
  lsr: { build(r) { const [d] = pickD(r, 1);
    return { m: { asm: `LSR.B #1,D${d}`, kind: 'op', op: 'shr', dst: d }, z: { asm: 'SRL A', kind: 'op', op: 'shr', dst: 'A' }, doc: 'shift right one bit filling with 0, with the old bit 0 going to carry', diff: 'The Z80 mnemonic is SRL.' }; } },
  asr: { build(r) { const [d] = pickD(r, 1);
    return { m: { asm: `ASR.B #1,D${d}`, kind: 'op', op: 'asr', dst: d }, z: { asm: 'SRA A', kind: 'op', op: 'asr', dst: 'A' }, doc: 'shift right one bit keeping the sign bit', diff: 'The Z80 mnemonic is SRA.' }; } },
  rol: { build(r) { const [d] = pickD(r, 1);
    return { m: { asm: `ROL.B #1,D${d}`, kind: 'op', op: 'rol', dst: d }, z: { asm: 'RLCA', kind: 'op', op: 'rol', dst: 'A' }, doc: 'rotate left one bit, copying the old top bit to carry', diff: 'RLCA works only on A and does not set Z.' }; } },
  clr: { build(r) { const [d] = pickD(r, 1), zr = r.pick(['A', ...ZR]);
    return { m: { asm: `CLR.B D${d}`, kind: 'op', op: 'clear', dst: d }, z: { asm: `LD ${zr},0`, kind: 'op', op: 'clear', dst: zr }, doc: 'put zero in the byte register', diff: 'CLR.B sets Z and clears N, V and C; LD r,0 leaves the Z80 flags unchanged.' }; } },
  tst: { build(r) { const [d] = pickD(r, 1);
    return { m: { asm: `TST.B D${d}`, kind: 'op', op: 'test', dst: d }, z: { asm: 'OR A', kind: 'op', op: 'test', dst: 'A' }, doc: 'set the flags from the register without changing it', diff: 'The Z80 has no TST; OR A sets Z and S from A, clears carry and leaves A unchanged.' }; } },
  btst: { build(r) { const [d] = pickD(r, 1), n = r.int(0, 7), zr = r.pick(['A', ...ZR]);
    return { m: { asm: `BTST #${n},D${d}`, kind: 'bit', n, dst: d }, z: { asm: `BIT ${n},${zr}`, kind: 'bit', n, dst: zr }, doc: `test bit ${n} of a register; Z is set when the bit is 0`, diff: 'BIT n,r takes the register after the bit number; both set Z when the bit is 0.' }; } },
  push: { build(r) { const [s] = pickD(r, 1), zp = r.pick(['BC', 'DE', 'HL']);
    return { m: { asm: `MOVE.W D${s},-(A7)`, kind: 'push' }, z: { asm: `PUSH ${zp}`, kind: 'push' }, doc: 'push 16 bits onto the stack', diff: 'The Z80 has a dedicated PUSH and pushes a register pair; the 68000 uses MOVE with pre-decrement on A7. Byte order in memory differs (big versus little endian).' }; } },
  pop: { build(r) { const [d] = pickD(r, 1), zp = r.pick(['BC', 'DE', 'HL']);
    return { m: { asm: `MOVE.W (A7)+,D${d}`, kind: 'pop' }, z: { asm: `POP ${zp}`, kind: 'pop' }, doc: 'pop 16 bits off the stack', diff: 'The Z80 has a dedicated POP into a register pair; the 68000 uses MOVE with post-increment on A7.' }; } },
  beq: { build() { return { m: { asm: 'BEQ label', kind: 'branch', cc: 'EQ' }, z: { asm: 'JR Z,foo', kind: 'branch', cc: 'EQ' }, doc: 'branch to the label when the Zero flag is set', diff: 'Both are relative; the Z80 JR condition set is small (Z, NZ, C, NC).' }; } },
  bne: { build() { return { m: { asm: 'BNE label', kind: 'branch', cc: 'NE' }, z: { asm: 'JR NZ,foo', kind: 'branch', cc: 'NE' }, doc: 'branch when the Zero flag is clear', diff: 'Both are relative branches.' }; } },
  bcs: { build() { return { m: { asm: 'BCS label', kind: 'branch', cc: 'CS' }, z: { asm: 'JR C,foo', kind: 'branch', cc: 'CS' }, doc: 'branch when the Carry flag is set', diff: 'Both are relative branches.' }; } },
  bcc: { build() { return { m: { asm: 'BCC label', kind: 'branch', cc: 'CC' }, z: { asm: 'JR NC,foo', kind: 'branch', cc: 'CC' }, doc: 'branch when the Carry flag is clear', diff: 'Both are relative branches.' }; } },
  bmi: { build() { return { m: { asm: 'BMI label', kind: 'branch', cc: 'MI' }, z: { asm: 'JP M,foo', kind: 'branch', cc: 'MI' }, doc: 'branch when the result was negative (sign flag set)', diff: 'The Z80 uses JP, not JR, for the sign condition, and calls the flag S rather than N.' }; } },
  bra: { build(r) { const jmp = r.int(0, 1) === 1;
    return jmp ? { m: { asm: 'JMP label', kind: 'branch', cc: 'T' }, z: { asm: 'JP foo', kind: 'branch', cc: 'T' }, doc: 'jump to the label unconditionally (absolute)', diff: 'Both load the program counter with the target address.' }
      : { m: { asm: 'BRA label', kind: 'branch', cc: 'T' }, z: { asm: 'JR foo', kind: 'branch', cc: 'T' }, doc: 'branch to the label unconditionally (relative)', diff: 'Both add a signed displacement to the program counter.' }; } },
  jsr: { build(r) { const bsr = r.int(0, 1) === 1;
    return { m: { asm: bsr ? 'BSR sub' : 'JSR sub', kind: 'call' }, z: { asm: 'CALL sub', kind: 'call' }, doc: 'call a subroutine, pushing the return address', diff: 'The 68000 pushes a 4-byte return address; the Z80 pushes 2 bytes.' }; } },
  rts: { build() { return { m: { asm: 'RTS', kind: 'ret' }, z: { asm: 'RET', kind: 'ret' }, doc: 'return from a subroutine by popping the return address', diff: 'The 68000 pops 4 bytes, the Z80 pops 2.' }; } },
};

/* ---- run one instruction on the real core and observe it ---- */
const flagOf68 = (f) => ({ Z: f.Z, C: f.C });
function obs68(spec, x) {
  const s = spec, L = [];
  const setAll = (dst, src) => { for (let i = 0; i < 7; i++) L.push(`MOVE.B #${src},D${i}`); if (dst !== undefined) L.push(`MOVE.B #${x.a},D${dst}`); };
  let body = null, tail = 'SIMHALT';
  switch (s.kind) {
    case 'op': case 'bit': setAll(s.dst, x.b); body = s.asm; break;
    case 'imm': setAll(s.dst, x.b); body = s.asm; break;
    case 'store': setAll(undefined, x.b); body = s.asm; break;
    case 'load': setAll(s.dst, x.b); body = s.asm; break;
    case 'push': case 'pop': setAll(0, x.b); L.push('MOVE.L #$00008000,A7'); body = s.asm; break;
    case 'branch': L.push(`MOVE.B #${x.a},D6`, `MOVE.B #${x.b},D7`, 'CMP.B D7,D6', `${s.cc === 'T' ? s.asm.split(' ')[0] : 'B' + s.cc} yes`, 'MOVEQ #0,D5', 'BRA done', 'yes     MOVEQ #1,D5', 'done    SIMHALT'); body = null; break;
    case 'call': L.push(`${s.asm.split(' ')[0]} sub`, 'MOVEQ #0,D5', 'SIMHALT', 'sub     MOVEQ #1,D5', 'SIMHALT'); body = null; break;
    case 'ret': L.push('JSR sub', 'MOVEQ #1,D5', 'SIMHALT', `sub     ${s.asm}`); body = null; break;
  }
  const src = `        ORG     $1000\nSTART   ${[...L.slice(0, 1), ...L.slice(1).map((l) => (/^(yes|done|sub) /.test(l) ? l : '        ' + l)), ...(body ? ['        ' + body] : [])].join('\n')}\n${body ? '        SIMHALT\n' : ''}        END     START\n`;
  const a = asm68(src); if (a.error) throw new Error(`${s.asm}: ${a.error}\n${src}`);
  const pre = s.kind === 'load' ? { [s.addr]: [x.b] } : {};
  const run = run68(a.r, { preload: pre, sp: 0x00008000 }), cpu = run.cpu, f = flags68(cpu);
  const o = {};
  switch (s.kind) {
    case 'op': { const v = cpu.D[s.dst] & 255; Object.assign(o, { val: v, ...flagOf68(f) }); break; }
    case 'bit': o.Z = f.Z; break;
    case 'imm': o.immediate = +((cpu.D[s.dst] & 255) === s.value); break;
    case 'store': o.toMemory = +(cpu.mem[s.addr] === x.b); break;
    case 'load': o.fromMemory = +((cpu.D[s.dst] & 255) === x.b); break;
    case 'push': o.spDelta = (cpu.A[7] >>> 0) - 0x8000; break;
    case 'pop': o.spDelta = (cpu.A[7] >>> 0) - 0x8000; break;
    case 'branch': o.taken = cpu.D[5] & 1; break;
    case 'call': o.called = cpu.D[5] & 1; break;
    case 'ret': o.returned = cpu.D[5] & 1; break;
  }
  return o;
}
function obsZ(spec, x) {
  const s = spec, L = [];
  const setAll = (dst, src) => { for (const r of ['A', ...ZR]) L.push(`LD ${r},${litZ(src)}`); if (dst) L.push(`LD ${dst},${litZ(x.a)}`); };
  let body = null;
  switch (s.kind) {
    case 'op': case 'bit': case 'imm': case 'load': setAll(s.dst, x.b); body = s.asm; break;
    case 'store': setAll(undefined, x.b); body = s.asm; break;
    case 'push': case 'pop': setAll(undefined, x.b); L.push('LD SP,8000H'); body = s.asm; break;
    case 'branch': {
      const cc = { EQ: 'JR Z', NE: 'JR NZ', CS: 'JR C', CC: 'JR NC', MI: 'JP M', T: s.asm.split(' ')[0] }[s.cc];
      L.push(`LD A,${litZ(x.a)}`, `LD B,${litZ(x.b)}`, 'CP B', `${cc}${s.cc === 'T' ? '' : ','}${s.cc === 'T' ? '' : ''} yes`.replace(/ yes$/, s.cc === 'T' ? ' yes' : ',yes').replace(',,', ','), 'LD C,0', 'JR done', 'yes:    LD C,1', 'done:   HALT'); break;
    }
    case 'call': L.push('LD SP,8000H', 'CALL sub', 'LD C,0', 'HALT', 'sub:    LD C,1', 'HALT'); break;
    case 'ret': L.push('LD SP,8000H', 'CALL sub', 'LD C,1', 'HALT', `sub:    ${s.asm}`); break;
  }
  const src = `        ORG     0100H\n${L.map((l) => (/^(yes|done|sub):/.test(l) ? l : '        ' + l)).join('\n')}\n${body ? '        ' + body + '\n        HALT\n' : ''}        END\n`;
  const a = asmZ(src); if (a.error) throw new Error(`${s.asm}: ${a.error}\n${src}`);
  const pre = s.kind === 'load' ? { [s.addr]: [x.b] } : {};
  const run = runZ(a.r, { preload: pre }), cpu = run.cpu, f = flagsZ(cpu), o = {};
  const reg = (n) => (n === 'A' ? cpu.af >> 8 : cpu[n.toLowerCase()]) & 255;
  switch (s.kind) {
    case 'op': Object.assign(o, { val: reg(s.dst), Z: f.Z, C: f.C }); break;
    case 'bit': o.Z = f.Z; break;
    case 'imm': o.immediate = +(reg(s.dst) === s.value); break;
    case 'store': o.toMemory = +(cpu.mem[s.addr] === x.b); break;
    case 'load': o.fromMemory = +(reg(s.dst) === x.b); break;
    case 'push': case 'pop': o.spDelta = cpu.sp - 0x8000; break;
    case 'branch': o.taken = cpu.c & 255; break;
    case 'call': o.called = cpu.c & 255; break;
    case 'ret': o.returned = cpu.c & 255; break;
  }
  return o;
}
/* a pop/push observation only depends on SP, so the 2- versus 4-byte difference is a real difference between the chips:
   compare "pushes something / pops something" by direction instead of byte count */
const norm = (o) => { if ('spDelta' in o) return { sp: Math.sign(o.spDelta) }; return o; };

const TRIALS = (() => { const t = []; let s = 12345; const nx = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296; for (let i = 0; i < 24; i++) { const a = Math.floor(nx() * 256); t.push({ a, b: i % 4 === 0 ? a : Math.floor(nx() * 256) }); } t.push({ a: 0, b: 0 }, { a: 255, b: 1 }, { a: 128, b: 128 }, { a: 1, b: 255 }); return t; })();

function equivalent(m, z) {
  for (const x of TRIALS) {
    const om = norm(obs68(m, x)), oz = norm(obsZ(z, x));
    for (const k of Object.keys(om)) if (om[k] !== oz[k]) return false;
  }
  return true;
}
/* keys compared for the 68000 side only listed in OPS; for op kinds restrict to that op's keys */
export function equivalentOp(m, z) {
  const keys = OPS[m.op]?.keys;
  for (const x of TRIALS) {
    const om = norm(obs68(m, x)), oz = norm(obsZ(z, x));
    const ks = keys ? keys : Object.keys(om);
    if (keys && z.kind !== 'op') return false;
    for (const k of ks) if (om[k] !== oz[k]) return false;
  }
  return true;
}

export const pairing = {
  id: 'pairing',
  title: 'Pairing 68000 and Z80 instructions',
  concepts: ['assembly-programs.z80-load', 'assembly-programs.m68k-move', 'program-control.z80-jumps-and-calls', 'programmers-model.m68k-flags'],
  conventions: 'Pair by what the instruction does. Register names, immediate values, addresses and branch labels may differ between the two, as in the instructor\'s practice problem; each answer is the Z80 instruction that performs the same operation. A pair counts as correct when running both on the simulator cores gives the same result for the flags and values that operation defines.',
  make(r, { count = 5 } = {}) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const ids = r.shuffle(Object.keys(CLASSES)).slice(0, count);
      const pairs = ids.map((id) => ({ id, ...CLASSES[id].build(r) }));
      if (new Set(pairs.map((p) => p.z.asm)).size < count) continue;
      const zs = r.shuffle(pairs.map((p) => p.z.asm));
      const parts = pairs.map((p, i) => ({
        label: String(i + 1), kind: 'choice', options: zs, prompt: `\`${p.m.asm}\``, answer: p.z.asm, display: p.z.asm,
        explain: `\`${p.m.asm}\` and \`${p.z.asm}\` both ${p.doc}. ${p.diff}`, sentence: `Both ${p.doc}. ${p.diff}`,
      }));
      return {
        family: 'pairing', title: 'Pairing 68K and Z80 instructions', concepts: this.concepts, conventions: this.conventions,
        prompt: `Pair each 68K instruction with the Z80 instruction that does the same thing (an operand may differ), and write a sentence saying what each pair does.\n\n**Z80 instructions:** ${zs.map((z) => '`' + z + '`').join(', ')}`,
        parts, _pairs: pairs,
      };
    }
    throw new Error('pairing: could not build a problem');
  },
  verify(p) {
    const out = {};
    p.parts.forEach((x, i) => {
      const m = p._pairs[i].m, opts = p._pairs.map((q) => q.z);
      const eq = opts.filter((z) => equivalentOp(m, z));
      out[x.label] = { answer: eq.length === 1 ? eq[0].asm : `(${eq.length} equivalent)`, notAnswers: opts.filter((z) => !eq.includes(z)).map((z) => z.asm) };
    });
    return out;
  },
};
export const problems = { pairing };
