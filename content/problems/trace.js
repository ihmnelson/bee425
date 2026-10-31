/* Tracing problems: effective address, branch taken, flags, and stack. make() works the answer out from the rules
   (address arithmetic, the condition-code truth table, flag formulas, a model stack); verify() runs the same code on the real
   simulator cores and reads the answer off the machine. The audit needs the two to agree on every seed. */
import { asm68, run68, boot68, flags68, asmZ, runZ, bootZ, flagsZ } from './cores.js';

const hx = (n, d) => (n >>> 0).toString(16).toUpperCase().padStart(d, '0');
const MASK = { B: 0xFF, W: 0xFFFF, L: 0xFFFFFFFF };
const SIGN = { B: 0x80, W: 0x8000, L: 0x80000000 };
const DIG = { B: 2, W: 4, L: 8 };
const SZN = { B: 'byte', W: 'word', L: 'long' };
const BYTES = { B: 1, W: 2, L: 4 };
const tr = (v, s) => (v & MASK[s]) >>> 0;                          /* truncate to the operand size as an unsigned number */
const sx = (v, s) => { v &= MASK[s]; return v & SIGN[s] ? v - MASK[s] - 1 : v; };

const prog68 = (lines, org = 0x1000) => asm68(`        ORG     $${org.toString(16)}\nSTART   ${lines.join('\n        ')}\n        SIMHALT\n        END     START\n`);

/* ============ effective address ============ */
const EA_KINDS = ['ind', 'post', 'pre', 'd16', 'd8x', 'absL'];
const eaDemo = {
  id: 'ea-trace',
  title: 'Effective address tracing',
  concepts: ['addressing-modes.m68k-effective-address', 'addressing-modes.m68k-register-indirect'],
  conventions: 'Register contents are given in hex. The instruction stores D0 to memory at the effective address. Post-increment and pre-decrement change the address register by the operand size (1, 2 or 4). Index registers are sign-extended from the stated width (.W or .L) and added to the address register and the 8-bit displacement. Give addresses as hex.',
  make(r) {
    const parts = [], items = [];
    for (let i = 0; i < 4; i++) {
      const kind = r.pick(EA_KINDS), s = r.pick(['B', 'W', 'L']), n = r.int(1, 5), m = r.int(1, 3);
      const base = 2 * r.int(0x2000, 0x5000);          /* even addresses 0x4000..0xA000 */
      const idxW = r.pick(['W', 'L']), idx = r.int(-60, 90) * 2;
      const d16 = r.int(-100, 100) * 2 || 2, d8 = r.int(-40, 40) * 2 || 2;
      let text, ea, after = null, how;
      switch (kind) {
        case 'ind': text = `(A${n})`; ea = base; how = `(A${n}) uses A${n} itself: $${hx(base, 6)}.`; break;
        case 'post': text = `(A${n})+`; ea = base; after = base + BYTES[s]; how = `(A${n})+ uses A${n} ($${hx(base, 6)}) and then adds the size (${BYTES[s]} for a ${SZN[s]}), leaving A${n} = $${hx(after, 6)}.`; break;
        case 'pre': text = `-(A${n})`; ea = base - BYTES[s]; after = ea; how = `-(A${n}) first subtracts the size (${BYTES[s]}): $${hx(base, 6)} - ${BYTES[s]} = $${hx(ea, 6)}, which is both the address used and the new A${n}.`; break;
        case 'd16': text = `${d16}(A${n})`; ea = base + d16; how = `Displacement ${d16} added to A${n}: $${hx(base, 6)} ${d16 < 0 ? '-' : '+'} ${Math.abs(d16)} = $${hx(ea, 6)}.`; break;
        case 'd8x': text = `${d8}(A${n},D${m}.${idxW})`; ea = base + d8 + idx; how = `A${n} + D${m}.${idxW} + displacement = $${hx(base, 6)} ${idx < 0 ? '-' : '+'} ${Math.abs(idx)} ${d8 < 0 ? '-' : '+'} ${Math.abs(d8)} = $${hx(ea, 6)}.`; break;
        default: { const a = 2 * r.int(0x3000, 0x6000); text = `$${hx(a, 8)}`; ea = a; how = `Absolute long: the address is in the instruction, $${hx(a, 8)}.`; }
      }
      const regs = { [`A${n}`]: base, ...(kind === 'd8x' ? { [`D${m}`]: idx } : {}) };
      const reg = (k) => (k === 'd8x' ? `A${n} = $${hx(base, 6)}, D${m} = $${hx(idx & MASK.L, idxW === 'W' ? 4 : 8)}` : kind === 'absL' ? '' : `A${n} = $${hx(base, 6)}`);
      const regText = reg(kind);
      const label = 'abcdefgh'[parts.length];
      parts.push({ label, kind: 'numeric', prompt: `\`MOVE.${s} D0,${text}\`${regText ? ` with ${regText}` : ''}. What is the effective address (hex)?`, answer: ea, display: '$' + hx(ea, 6), explain: how });
      items.push({ kind, s, n, m, base, idx, idxW, d16, d8, text, ea, regs, label });
      if (after !== null) {
        const l2 = 'abcdefgh'[parts.length];
        parts.push({ label: l2, kind: 'numeric', prompt: `After that instruction, what does A${n} contain (hex)?`, answer: after, display: '$' + hx(after, 6), explain: how });
        items.push({ after: true, n, label: l2, kind, s, text, regs, base, idx, idxW, d16, d8, m });
      }
    }
    return { family: 'ea-trace', title: 'Effective addresses', concepts: this.concepts, conventions: this.conventions, prompt: 'For each instruction, assume the registers have the values shown and give the answer in hex.', parts, _items: items };
  },
  verify(p) {
    const out = {}, cache = new Map();
    for (const it of p._items) {
      const key = it.text + '|' + it.s + '|' + JSON.stringify(it.regs);
      let res = cache.get(key);
      if (!res) {
        const a = prog68([`MOVE.${it.s} D0,${it.text}`]);
        const run = run68(a.r, { regs: { D0: 0xAABBCCDD, ...it.regs } });
        const mem = run.cpu.mem; let first = -1;
        for (let k = 0x2000; k < 0xC400; k++) if (mem[k]) { first = k; break; }
        res = { ea: first, an: run.cpu.A[it.n] >>> 0 }; cache.set(key, res);
      }
      out[it.label] = it.after ? res.an : res.ea;
    }
    return out;
  },
};

/* ============ branch taken ============ */
const COND = {
  BHI: (f) => !f.C && !f.Z, BLS: (f) => f.C || f.Z, BCC: (f) => !f.C, BCS: (f) => f.C, BNE: (f) => !f.Z, BEQ: (f) => f.Z,
  BVC: (f) => !f.V, BVS: (f) => f.V, BPL: (f) => !f.N, BMI: (f) => f.N, BGE: (f) => f.N === f.V, BLT: (f) => f.N !== f.V,
  BGT: (f) => !f.Z && f.N === f.V, BLE: (f) => f.Z || f.N !== f.V,
};
const UNSIGNED = new Set(['BHI', 'BLS', 'BCC', 'BCS']), SIGNED = new Set(['BGE', 'BLT', 'BGT', 'BLE']);
function subFlags(a, b, s) {                                /* flags after a - b (CMP.s b,a) at size s */
  const m = MASK[s], sg = SIGN[s], res = tr(a - b, s);
  return { N: +!!(res & sg), Z: +(res === 0), V: +!!(((a ^ b) & (a ^ res) & sg)), C: +(b > a) };
}
const branchDemo = {
  id: 'branch-taken',
  title: 'Is the branch taken?',
  concepts: ['program-control.m68k-compare-and-flags', 'program-control.m68k-conditional-branches'],
  conventions: 'CMP.s Dsrc,Ddst computes Ddst - Dsrc and sets N, Z, V, C without storing the result. BHI, BLS, BCC and BCS test the unsigned relationship (using C and Z); BGT, BGE, BLT and BLE test the signed relationship (using N and V). Values are bit patterns written in hex.',
  make(r) {
    const parts = [], items = [];
    const conds = r.shuffle(Object.keys(COND));
    for (let i = 0; i < 5; i++) {
      const cc = conds[i], s = r.pick(['B', 'W', 'L']), m = MASK[s];
      let a, b;
      const mode = r.int(0, 3);
      if (mode === 0) { a = r.int(0, m); b = a; }                                  /* equal */
      else if (mode === 1) { a = r.int(0, m); b = tr(a ^ SIGN[s], s); }              /* opposite sign bits, often unsigned/signed differ */
      else { a = r.int(0, m); b = r.int(0, m); }
      const f = subFlags(a, b, s), taken = !!COND[cc](f);
      const d = DIG[s];
      parts.push({
        label: 'abcde'[i], kind: 'choice', options: ['Taken', 'Not taken'],
        prompt: `\`MOVE.${s} #$${hx(a, d)},D0\`  \`MOVE.${s} #$${hx(b, d)},D1\`  \`CMP.${s} D1,D0\`  \`${cc} label\` : is the branch taken?`,
        answer: taken ? 'Taken' : 'Not taken', display: taken ? 'Taken' : 'Not taken',
        explain: `CMP.${s} D1,D0 computes $${hx(a, d)} - $${hx(b, d)} = $${hx(tr(a - b, s), d)}: N=${f.N} Z=${f.Z} V=${f.V} C=${f.C}. ${cc} tests ${UNSIGNED.has(cc) ? '(unsigned) ' : SIGNED.has(cc) ? '(signed) ' : ''}${{ BHI: 'C = 0 and Z = 0', BLS: 'C = 1 or Z = 1', BCC: 'C = 0', BCS: 'C = 1', BNE: 'Z = 0', BEQ: 'Z = 1', BVC: 'V = 0', BVS: 'V = 1', BPL: 'N = 0', BMI: 'N = 1', BGE: 'N = V', BLT: 'N is not V', BGT: 'Z = 0 and N = V', BLE: 'Z = 1 or N is not V' }[cc]}, so it is ${taken ? '**taken**' : '**not taken**'}.`,
      });
      items.push({ cc, s, a, b });
    }
    return { family: 'branch-taken', title: 'Branch taken?', concepts: this.concepts, conventions: this.conventions, prompt: 'In each part, say whether the conditional branch is taken.', parts, _items: items };
  },
  verify(p) {
    const out = {};
    p._items.forEach((it, i) => {
      const d = DIG[it.s];
      const a = asm68(`        ORG     $1000\nSTART   MOVE.${it.s} #$${hx(it.a, d)},D0\n        MOVE.${it.s} #$${hx(it.b, d)},D1\n        CMP.${it.s} D1,D0\n        ${it.cc} yes\n        MOVEQ #0,D7\n        BRA done\nyes     MOVEQ #1,D7\ndone    SIMHALT\n        END START\n`);
      const taken = run68(a.r).cpu.D[7] === 1;
      out[p.parts[i].label] = { answer: taken ? 'Taken' : 'Not taken', notAnswers: [taken ? 'Not taken' : 'Taken'] };
    });
    return out;
  },
};

/* ============ flags after one operation ============ */
const par = (v) => { let n = 0; for (let i = 0; i < 8; i++) n += (v >> i) & 1; return +(n % 2 === 0); };
const OPS68 = [
  { op: 'ADD', f: (a, b, s) => { const r = a + b, m = MASK[s], q = tr(r, s); return { res: q, N: +!!(q & SIGN[s]), Z: +(q === 0), V: +!!((a ^ q) & (b ^ q) & SIGN[s]), C: +(r > m) }; } },
  { op: 'SUB', f: (a, b, s) => { const q = tr(a - b, s); return { res: q, N: +!!(q & SIGN[s]), Z: +(q === 0), V: +!!((a ^ b) & (a ^ q) & SIGN[s]), C: +(b > a) }; } },
  { op: 'CMP', f: (a, b, s) => { const q = tr(a - b, s); return { res: a, N: +!!(q & SIGN[s]), Z: +(q === 0), V: +!!((a ^ b) & (a ^ q) & SIGN[s]), C: +(b > a) }; } },
  { op: 'EOR', f: (a, b, s) => { const q = tr(a ^ b, s); return { res: q, N: +!!(q & SIGN[s]), Z: +(q === 0), V: 0, C: 0 }; } },
  { op: 'AND', f: (a, b, s) => { const q = tr(a & b, s); return { res: q, N: +!!(q & SIGN[s]), Z: +(q === 0), V: 0, C: 0 }; } },
];
const OPSZ = [
  { op: 'ADD', ask: 'SZHPNC', f: (a, b) => { const t = a + b, q = t & 255; return { res: q, S: q >> 7, Z: +(q === 0), H: +((a & 15) + (b & 15) > 15), P: +!!((a ^ q) & (b ^ q) & 128), N: 0, C: +(t > 255) }; }, asm: (b) => `ADD A,${b}` },
  { op: 'SUB', ask: 'SZHPNC', f: (a, b) => { const q = (a - b) & 255; return { res: q, S: q >> 7, Z: +(q === 0), H: +((a & 15) < (b & 15)), P: +!!((a ^ b) & (a ^ q) & 128), N: 1, C: +(b > a) }; }, asm: (b) => `SUB ${b}` },
  { op: 'CP', ask: 'SZHPNC', f: (a, b) => { const q = (a - b) & 255; return { res: a, S: q >> 7, Z: +(q === 0), H: +((a & 15) < (b & 15)), P: +!!((a ^ b) & (a ^ q) & 128), N: 1, C: +(b > a) }; }, asm: (b) => `CP ${b}` },
  { op: 'AND', ask: 'SZHPNC', f: (a, b) => { const q = a & b; return { res: q, S: q >> 7, Z: +(q === 0), H: 1, P: par(q), N: 0, C: 0 }; }, asm: (b) => `AND ${b}` },
  { op: 'XOR', ask: 'SZHPNC', f: (a, b) => { const q = a ^ b; return { res: q, S: q >> 7, Z: +(q === 0), H: 0, P: par(q), N: 0, C: 0 }; }, asm: (b) => `XOR ${b}` },
  { op: 'NEG', ask: 'SZHPNC', one: true, f: (a) => { const q = (-a) & 255; return { res: q, S: q >> 7, Z: +(q === 0), H: +((a & 15) > 0), P: +(a === 0x80), N: 1, C: +(a !== 0) }; }, asm: () => 'NEG' },
  { op: 'INC', ask: 'SZHPN', one: true, f: (a) => { const q = (a + 1) & 255; return { res: q, S: q >> 7, Z: +(q === 0), H: +((a & 15) === 15), P: +(a === 0x7F), N: 0 }; }, asm: () => 'INC A' },
  { op: 'DEC', ask: 'SZHPN', one: true, f: (a) => { const q = (a - 1) & 255; return { res: q, S: q >> 7, Z: +(q === 0), H: +((a & 15) === 0), P: +(a === 0x80), N: 1 }; }, asm: () => 'DEC A' },
];
const litZ = (v) => { const t = hx(v, 2) + 'H'; return /^[A-F]/.test(t) ? '0' + t : t; };
const FLAG_NAMES = { N: 'N (negative)', Z: 'Z (zero)', V: 'V (overflow)', C: 'C (carry)', X: 'X (extend)', S: 'S (sign)', H: 'H (half carry)', P: 'P/V (parity/overflow)' };

const flagsDemo = {
  id: 'flags-trace',
  title: 'Flags after an operation',
  concepts: ['programmers-model.m68k-flags', 'program-control.m68k-compare-and-flags'],
  conventions: 'Operands are bit patterns in hex. Only flags that the chip defines for the instruction are asked (the Z80 undocumented bits 3 and 5 are never asked). 68000: ADD, SUB, EOR and AND set the result into the destination, CMP only sets flags (the destination is unchanged), and EOR/AND clear V and C. Z80: operations work on A, N is 1 after a subtraction, INC/DEC leave C unchanged (so C is not asked), and P/V is overflow for arithmetic but parity for AND/XOR.',
  make(r, { cpu } = {}) {
    cpu ||= r.pick(['m68k', 'z80']);
    if (cpu === 'm68k') {
      const o = r.pick(OPS68), s = r.pick(['B', 'W', 'L']), m = MASK[s], d = DIG[s];
      let a = r.int(0, m), b = r.int(0, m);
      if (r.int(0, 2) === 0) b = a;                          /* make Z and V cases common enough */
      const f = o.f(a, b, s), asm = [`MOVE.${s} #$${hx(a, d)},D0`, `MOVE.${s} #$${hx(b, d)},D1`, `${o.op}.${s} D1,D0`];
      const flags = ['N', 'Z', 'V', 'C'], parts = [{ label: 'a', kind: 'numeric', prompt: `Value of D0 (${SZN[s]} part, hex) afterwards`, answer: f.res, display: '$' + hx(f.res, d), explain: o.op === 'CMP' ? 'CMP does not store a result, so D0 is unchanged.' : `D0 ${{ ADD: '+', SUB: '-', EOR: 'XOR', AND: 'AND' }[o.op]} D1 = $${hx(f.res, d)}.` }];
      for (const k of flags) parts.push({ label: 'bcde'[parts.length - 1], kind: 'numeric', prompt: `Flag ${FLAG_NAMES[k]} (0 or 1)`, answer: f[k], display: String(f[k]), explain: flagWhy68(o.op, k, a, b, s, f) });
      return { family: 'flags-trace', title: 'Flags (68000)', concepts: this.concepts, conventions: this.conventions, prompt: `Registers start unspecified; run:\n\n    ${asm.join('\n    ')}\n\nGive the result and the flags afterwards.`, parts, _cpu: 'm68k', _asm: asm, _o: o, _s: s, _a: a, _b: b };
    }
    const o = r.pick(OPSZ); let a = r.int(0, 255), b = r.int(0, 255);
    if (!o.one && r.int(0, 2) === 0) b = a;
    if (o.op === 'INC' && r.int(0, 2) === 0) a = r.pick([0x7F, 0xFF, 0x0F]);
    if (o.op === 'DEC' && r.int(0, 2) === 0) a = r.pick([0x80, 0x00, 0x10]);
    if (o.op === 'NEG' && r.int(0, 3) === 0) a = r.pick([0x80, 0x00]);
    const f = o.f(a, b), asm = [`LD A,${litZ(a)}`, ...(o.one ? [] : [`LD B,${litZ(b)}`]), o.asm(o.one ? '' : 'B')];
    const parts = [{ label: 'a', kind: 'numeric', prompt: 'Value of A afterwards (hex)', answer: f.res, display: hx(f.res, 2) + 'H', explain: o.op === 'CP' ? 'CP does not store a result, so A is unchanged.' : `The result in A is ${hx(f.res, 2)}H.` }];
    for (const k of o.ask) parts.push({ label: 'bcdefg'[parts.length - 1], kind: 'numeric', prompt: `Flag ${FLAG_NAMES[k]} (0 or 1)`, answer: f[k], display: String(f[k]), explain: flagWhyZ(o.op, k, a, b, f) });
    return { family: 'flags-trace', title: 'Flags (Z80)', concepts: this.concepts, conventions: this.conventions, prompt: `Run:\n\n    ${asm.join('\n    ')}\n\nGive the result and the flags afterwards.`, parts, _cpu: 'z80', _asm: asm, _o: o, _a: a, _b: b };
  },
  verify(p) {
    const out = {};
    if (p._cpu === 'm68k') {
      const a = prog68(p._asm), run = run68(a.r), fl = flags68(run.cpu), m = MASK[p._s];
      out.a = (run.cpu.D[0] & m) >>> 0;
      p.parts.slice(1).forEach((x, i) => { out[x.label] = fl['NZVC'[i]]; });
    } else {
      const z = asmZ(`        ORG     0100H\n        ${p._asm.join('\n        ')}\n        HALT\n        END\n`), run = runZ(z.r), fl = flagsZ(run.cpu);
      out.a = run.cpu.af >> 8;
      p.parts.slice(1).forEach((x, i) => { out[x.label] = fl[p._o.ask[i]]; });
    }
    return out;
  },
};
function flagWhyZ(op, k, a, b, f) {
  const h = (v) => hx(v, 2) + 'H';
  switch (k) {
    case 'S': return `S copies bit 7 of the result (${h(f.res)}): ${f.S}.`;
    case 'Z': return `Z is 1 only when the 8-bit result is zero: ${f.Z}.`;
    case 'H': return op === 'AND' ? 'AND always sets H.' : op === 'XOR' ? 'XOR clears H.' : `H is the carry (or borrow) between bit 3 and bit 4 of the low nibbles (${(a & 15).toString(16).toUpperCase()}H and ${(b & 15).toString(16).toUpperCase()}H): ${f.H}.`;
    case 'P': return op === 'AND' || op === 'XOR' ? `For logic operations P/V is parity: ${par(f.res) ? 'even' : 'odd'} number of 1 bits in ${h(f.res)} gives ${f.P}.` : `For arithmetic P/V is signed overflow (the result's sign is wrong for the operands' signs): ${f.P}.`;
    case 'N': return `N is ${f.N}: it is 1 after a subtraction (SUB, CP, NEG, DEC) and 0 after an addition or logic operation.`;
    default: return `C is the carry out of bit 7 (or borrow for a subtraction); NEG sets it unless the operand was zero, logic operations clear it: ${f.C}.`;
  }
}
function flagWhy68(op, k, a, b, s, f) {
  const d = DIG[s], h = (v) => '$' + hx(v, d);
  switch (k) {
    case 'N': return `N is the top bit of the result (${h(op === 'CMP' ? tr(a - b, s) : f.res)}): ${f.N}.`;
    case 'Z': return `Z is 1 only when the ${SZN[s]} result is zero: ${f.Z}.`;
    case 'V': return op === 'EOR' || op === 'AND' ? 'Logic operations clear V.' : `V is signed overflow: ${sx(a, s)} ${op === 'ADD' ? '+' : '-'} ${sx(b, s)} ${(op === 'ADD' ? sx(a, s) + sx(b, s) : sx(a, s) - sx(b, s)) === sx(op === 'ADD' ? (a + b) : (a - b), s) ? 'fits' : 'does not fit'} in a signed ${SZN[s]}, so V = ${f.V}.`;
    default: return op === 'EOR' || op === 'AND' ? 'Logic operations clear C.' : `C is the unsigned carry (ADD) or borrow (SUB, CMP): ${f.C}.`;
  }
}

/* ============ stack ============ */
const stackDemo = {
  id: 'stack-trace',
  title: 'Stack tracing',
  concepts: ['program-control.m68k-stack', 'program-control.m68k-subroutines'],
  conventions: '68000: A7 is the stack pointer; MOVE.s Dn,-(A7) pushes (A7 falls by the size first) and MOVE.s (A7)+,Dn pops; JSR pushes a 4-byte return address. Z80: PUSH writes two bytes and lowers SP by 2, POP raises it by 2, CALL pushes a 2-byte return address. The stack grows toward lower addresses. Values are in hex.',
  make(r, { cpu } = {}) {
    cpu ||= r.pick(['m68k', 'z80']);
    if (cpu === 'm68k') {
      const sp0 = 0x8000, nPush = r.int(2, 3), sizes = [], vals = [], lines = [];
      for (let i = 0; i < nPush; i++) { const s = r.pick(['W', 'L']); sizes.push(s); vals.push(r.int(0x1000, MASK[s] >= 0xFFFF ? 0xFFFF : 0xFFFF) * (s === 'L' ? 0x10001 : 1) % (s === 'L' ? 0x100000000 : 0x10000)); }
      lines.push(...sizes.map((s, i) => `MOVE.${s} #$${hx(vals[i], DIG[s])},D${i}`), ...sizes.map((s, i) => `MOVE.${s} D${i},-(A7)`));
      const useCall = r.int(0, 1) === 1;
      let sp = sp0 - sizes.reduce((t, s) => t + BYTES[s], 0);
      const popN = r.int(1, nPush), pops = [];
      if (useCall) lines.push('JSR sub');
      const afterCall = sp - 4;
      for (let k = 0; k < popN; k++) { const s = sizes[nPush - 1 - k]; pops.push(s); lines.push(`MOVE.${s} (A7)+,D${5 - k}`); }
      const retained = vals.slice().reverse().slice(0, popN);           /* the pushed values come back in reverse order */
      const spEnd = sp + pops.reduce((t, s) => t + BYTES[s], 0);
      const parts = [
        ...(useCall ? [{ label: 'a', kind: 'numeric', prompt: 'A7 at the first instruction of the subroutine `sub` (hex)', answer: afterCall, display: '$' + hx(afterCall, 6), explain: `Before JSR, A7 = $${hx(sp, 6)}. JSR pushes the 4-byte return address, so A7 = $${hx(sp, 6)} - 4 = $${hx(afterCall, 6)}.` }] : []),
        { label: useCall ? 'b' : 'a', kind: 'numeric', prompt: 'A7 at SIMHALT (hex)', answer: spEnd, display: '$' + hx(spEnd, 6), explain: `Start $${hx(sp0, 6)}, pushes lower it by ${sizes.reduce((t, s) => t + BYTES[s], 0)} bytes${useCall ? ' (the JSR return address is popped again by RTS)' : ''}, the ${popN} pop${popN > 1 ? 's' : ''} raise it by ${pops.reduce((t, s) => t + BYTES[s], 0)}: $${hx(spEnd, 6)}.` },
        { label: useCall ? 'c' : 'b', kind: 'numeric', prompt: `Contents of D5 at SIMHALT, ${SZN[pops[0]]} part (hex)`, answer: retained[0], display: '$' + hx(retained[0], DIG[pops[0]]), explain: `The last value pushed comes off first: D${nPush - 1} was $${hx(vals[nPush - 1], DIG[sizes[nPush - 1]])}.` },
      ];
      const prog = ['        ORG     $1000', 'START   MOVE.L  #$00008000,A7', ...lines.map((l) => `        ${l}`), '        SIMHALT', ...(useCall ? ['sub     RTS'] : []), '        END     START'];
      /* the subroutine label must precede its use being reachable: JSR sub then RTS returns; keep sub after SIMHALT */
      return { family: 'stack-trace', title: 'Stack (68000)', concepts: this.concepts, conventions: this.conventions, prompt: 'Trace this 68000 program. The stack pointer starts at $00008000.\n\n```\n' + prog.slice(1, -1).map((l) => l.replace(/^START   /, '').replace(/^sub     /, 'sub: ')).filter((l, i) => i > 0).join('\n') + '\n```', parts, _cpu: 'm68k', _src: prog.join('\n') + '\n', _useCall: useCall, _popN: popN };
    }
    const sp0 = 0xF000, regs = ['BC', 'DE', 'HL'], vals = {}, lines = [];
    const nPush = r.int(2, 3), order = r.shuffle(['BC', 'DE', 'HL']).slice(0, nPush);
    for (const p of order) { vals[p] = r.int(0x100, 0xFFFF); lines.push(`LD ${p},${hx(vals[p], 4).replace(/^([A-F])/, '0$1')}H`); }
    for (const p of order) lines.push(`PUSH ${p}`);
    const useCall = r.int(0, 1) === 1, popN = r.int(1, nPush), spPush = sp0 - 2 * nPush;
    if (useCall) lines.push('CALL sub');
    const dst = r.pick(['BC', 'DE', 'HL'].filter((x) => !order.includes(x)).concat(order.length < 3 ? [] : ['BC']));
    const pops = []; for (let k = 0; k < popN; k++) { const d = k === 0 ? dst : r.pick(['BC', 'DE', 'HL']); pops.push(d); lines.push(`POP ${d}`); }
    const expect = vals[order[nPush - popN]];
    const spEnd = spPush + 2 * popN, afterCall = spPush - 2;
    const parts = [
      ...(useCall ? [{ label: 'a', kind: 'numeric', prompt: 'SP at the first instruction of the subroutine `sub` (hex)', answer: afterCall, display: hx(afterCall, 4) + 'H', explain: `Before CALL, SP = ${hx(spPush, 4)}H. CALL pushes the 2-byte return address: ${hx(spPush, 4)}H - 2 = ${hx(afterCall, 4)}H.` }] : []),
      { label: useCall ? 'b' : 'a', kind: 'numeric', prompt: 'SP at HALT (hex)', answer: spEnd, display: hx(spEnd, 4) + 'H', explain: `SP starts at ${hx(sp0, 4)}H. Each PUSH lowers it by 2 (${nPush} pushes), each POP raises it by 2 (${popN} pops)${useCall ? '; the CALL and its RET cancel' : ''}: ${hx(spEnd, 4)}H.` },
      { label: useCall ? 'c' : 'b', kind: 'numeric', prompt: `Value of ${pops[popN - 1]} at HALT (hex)`, answer: expect, display: hx(expect, 4) + 'H', explain: `Pops return the pushed values in reverse order, so the ${popN === 1 ? 'first' : 'last'} POP (into ${pops[popN - 1]}) receives ${order[nPush - popN]}'s value, ${hx(expect, 4)}H.` },
    ];
    const prog = ['        ORG     0100H', '        LD SP,0F000H', ...lines.map((l) => `        ${l}`), '        HALT', ...(useCall ? ['sub:    RET'] : []), '        END'];
    return { family: 'stack-trace', title: 'Stack (Z80)', concepts: this.concepts, conventions: this.conventions, prompt: 'Trace this Z80 program. The first instruction sets SP to F000H.\n\n```\n' + ['LD SP,0F000H', ...lines, 'HALT', ...(useCall ? ['sub: RET'] : [])].join('\n') + '\n```', parts, _cpu: 'z80', _src: prog.join('\n') + '\n', _useCall: useCall, _popN: popN, _regs: pops };
  },
  verify(p) {
    const out = {};
    if (p._cpu === 'm68k') {
      const a = asm68(p._src); if (a.error) throw new Error(a.error);
      const { r } = a, sub = r.symbols.SUB ?? r.symbols.sub;
      const cpu = boot68(r);                                    /* fresh, untouched machine */
      let seenSub = null, n = 0;
      while (!cpu.halted && n++ < 1000) { if (p._useCall && seenSub === null && cpu.pc === sub) seenSub = cpu.A[7] >>> 0; cpu.step(); }
      const labels = p.parts.map((x) => x.label);
      let i = 0; if (p._useCall) out[labels[i++]] = seenSub;
      out[labels[i++]] = cpu.A[7] >>> 0;
      const wantSize = /MOVE\.([WL]) \(A7\)\+,D5/.exec(p._src)[1];
      out[labels[i]] = (cpu.D[5] & MASK[wantSize]) >>> 0;
    } else {
      const a = asmZ(p._src); if (a.error) throw new Error(a.error);
      const { r } = a, sub = r.symbols.SUB ?? r.symbols.sub;
      const cpu = bootZ(r);
      let seenSub = null, n = 0;
      while (!cpu.halted && n++ < 1000) { if (p._useCall && seenSub === null && cpu.pc === sub) seenSub = cpu.sp; cpu.step(); }
      const labels = p.parts.map((x) => x.label);
      let i = 0; if (p._useCall) out[labels[i++]] = seenSub;
      out[labels[i++]] = cpu.sp;
      const reg = p._regs[p._regs.length - 1].toLowerCase();
      out[labels[i]] = cpu[reg];
    }
    return out;
  },
};

export const problems = { 'ea-trace': eaDemo, 'branch-taken': branchDemo, 'flags-trace': flagsDemo, 'stack-trace': stackDemo };
