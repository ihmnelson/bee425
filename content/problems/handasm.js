/* Hand assembly to hex (68000). make() takes the answer from the course's assembler (the same one the simulator uses);
   verify() rebuilds the instruction word from the 68000 bit-field layout (segments of 16 bits) with no call to the assembler.
   The audit requires the two to agree on every seed. */
import { encode68 } from './cores.js';

const bin = (n, w) => (n & ((1 << w) - 1)).toString(2).padStart(w, '0');
const hx = (n, d) => (n >>> 0).toString(16).toUpperCase().padStart(d, '0');
const SZ = { B: 0, W: 1, L: 2 };                               /* size code used by most instructions */
const SZN = { B: 'byte', W: 'word', L: 'long' };
const MOVE_SZ = { B: '01', W: '11', L: '10' };                 /* MOVE uses a different size code */

/* ---- effective-address operands: {text, mode, reg, ext:[16-bit words], what} ---- */
const MODE_NAMES = { 0: 'Dn', 1: 'An', 2: '(An)', 3: '(An)+', 4: '-(An)', 5: 'd16(An)', abs: 'absolute', imm: 'immediate' };
function makeEA(r, kind, size) {
  const n = r.int(0, 7);
  switch (kind) {
    case 'Dn': return { kind, text: `D${n}`, mode: 0, reg: n, ext: [], what: `register direct D${n}` };
    case 'An': return { kind, text: `A${n}`, mode: 1, reg: n, ext: [], what: `address register direct A${n}` };
    case 'ind': return { kind, text: `(A${n})`, mode: 2, reg: n, ext: [], what: `(A${n})` };
    case 'post': return { kind, text: `(A${n})+`, mode: 3, reg: n, ext: [], what: `(A${n})+` };
    case 'pre': return { kind, text: `-(A${n})`, mode: 4, reg: n, ext: [], what: `-(A${n})` };
    case 'd16': {
      const d = r.pick([-1, 1]) * 2 * r.int(1, 120);
      return { kind, text: `${d}(A${n})`, mode: 5, reg: n, ext: [d & 0xFFFF], what: `${d}(A${n}), displacement word $${hx(d & 0xFFFF, 4)}` };
    }
    case 'absW': { const a = 2 * r.int(0x80, 0x3FFF); return { kind, text: `$${hx(a, 4)}`, mode: 7, reg: 0, ext: [a], what: `absolute short $${hx(a, 4)}` }; }
    case 'absL': {
      const a = (r.int(0x0001, 0xFFFE) * 0x10000 + 2 * r.int(0, 0x7FFF)) >>> 0;
      return { kind, text: `$${hx(a, 8)}`, mode: 7, reg: 1, ext: [a >>> 16, a & 0xFFFF], what: `absolute long $${hx(a, 8)}` };
    }
    case 'imm': {
      let v;
      if (size === 'B') v = r.int(0, 255); else if (size === 'W') v = r.int(0x100, 0xFFFF); else v = r.int(0x10000, 0xFFFFFFFF);
      const ext = size === 'L' ? [v >>> 16, v & 0xFFFF] : [size === 'B' ? v & 255 : v];
      return { kind, text: `#$${hx(v, size === 'B' ? 2 : size === 'W' ? 4 : 8)}`, mode: 7, reg: 4, ext, what: `immediate $${hx(v, size === 'B' ? 2 : size === 'W' ? 4 : 8)}`, value: v };
    }
  }
}
const DATA_ALT = ['Dn', 'ind', 'post', 'pre', 'd16', 'absW', 'absL'];
const MEM_ALT = DATA_ALT.slice(1);
const DATA_SRC = [...DATA_ALT, 'imm'];
const CONTROL = ['ind', 'd16', 'absW', 'absL'];

const seg = (bits, label) => ({ bits, label });
const eaSegs = (e) => [seg(bin(e.mode, 3), `mode ${bin(e.mode, 3)}`), seg(bin(e.reg, 3), `reg ${e.reg}`)];

/* A form returns {asm, segs, ext, at?, notes}. Words = 16-bit opcode from segs, then ext words. */
const FORMS = [
  { id: 'MOVE', w: 5, build(r) {
    const s = r.pick(['B', 'W', 'L']);
    const src = makeEA(r, r.pick(DATA_SRC.concat(s === 'B' ? [] : ['An'])), s);
    const dst = makeEA(r, r.pick(DATA_ALT), s);
    return { asm: `MOVE.${s} ${src.text},${dst.text}`, ops: [src, dst], segs: [seg('00', 'MOVE'), seg(MOVE_SZ[s], `size ${SZN[s]}`), seg(bin(dst.reg, 3), `dest reg ${dst.reg}`), seg(bin(dst.mode, 3), `dest mode ${bin(dst.mode, 3)}`), seg(bin(src.mode, 3), `source mode ${bin(src.mode, 3)}`), seg(bin(src.reg, 3), `source reg ${src.reg}`)], ext: [...src.ext, ...dst.ext] };
  } },
  ...[['ADD', '1101'], ['SUB', '1001'], ['AND', '1100'], ['OR', '1000']].map(([nm, top]) => ({ id: nm, w: 3, build(r) {
    const s = r.pick(['B', 'W', 'L']), n = r.int(0, 7), toDn = r.int(0, 1) === 1;
    const kinds = toDn ? DATA_ALT.concat(nm === 'ADD' || nm === 'SUB' ? (s === 'B' ? [] : ['An']) : []) : MEM_ALT;
    const ea = makeEA(r, r.pick(kinds), s);
    const opm = (toDn ? 0 : 4) + SZ[s];
    return { asm: toDn ? `${nm}.${s} ${ea.text},D${n}` : `${nm}.${s} D${n},${ea.text}`, ops: [ea], segs: [seg(top, nm), seg(bin(n, 3), `Dn = D${n}`), seg(bin(opm, 3), `opmode ${bin(opm, 3)} (${SZN[s]}, ${toDn ? 'result to Dn' : 'result to EA'})`), ...eaSegs(ea)], ext: ea.ext };
  } })),
  { id: 'EOR', w: 3, build(r) {
    const s = r.pick(['B', 'W', 'L']), n = r.int(0, 7), ea = makeEA(r, r.pick(DATA_ALT), s), opm = 4 + SZ[s];
    return { asm: `EOR.${s} D${n},${ea.text}`, ops: [ea], segs: [seg('1011', 'EOR'), seg(bin(n, 3), `Dn = D${n}`), seg(bin(opm, 3), `opmode ${bin(opm, 3)} (${SZN[s]}, result to EA)`), ...eaSegs(ea)], ext: ea.ext };
  } },
  { id: 'CMP', w: 2, build(r) {
    const s = r.pick(['B', 'W', 'L']), n = r.int(0, 7), ea = makeEA(r, r.pick(DATA_ALT.concat(s === 'B' ? [] : ['An'])), s), opm = SZ[s];
    return { asm: `CMP.${s} ${ea.text},D${n}`, ops: [ea], segs: [seg('1011', 'CMP'), seg(bin(n, 3), `Dn = D${n}`), seg(bin(opm, 3), `opmode ${bin(opm, 3)} (${SZN[s]})`), ...eaSegs(ea)], ext: ea.ext };
  } },
  ...[['CLR', '01000010'], ['NEG', '01000100'], ['NOT', '01000110'], ['TST', '01001010']].map(([nm, top]) => ({ id: nm, w: 2, build(r) {
    const s = r.pick(['B', 'W', 'L']), ea = makeEA(r, r.pick(DATA_ALT), s);
    return { asm: `${nm}.${s} ${ea.text}`, ops: [ea], segs: [seg(top, nm), seg(bin(SZ[s], 2), `size ${SZN[s]}`), ...eaSegs(ea)], ext: ea.ext };
  } })),
  { id: 'SWAP', w: 2, build(r) { const n = r.int(0, 7); return { asm: `SWAP D${n}`, ops: [], segs: [seg('0100100001000', 'SWAP'), seg(bin(n, 3), `Dn = D${n}`)], ext: [] }; } },
  { id: 'EXT', w: 1, build(r) {
    const s = r.pick(['W', 'L']), n = r.int(0, 7);
    return { asm: `EXT.${s} D${n}`, ops: [], segs: [seg('0100100', 'EXT'), seg(s === 'W' ? '010' : '011', `opmode ${s === 'W' ? '010 (byte to word)' : '011 (word to long)'}`), seg('000', 'Dn mode'), seg(bin(n, 3), `Dn = D${n}`)], ext: [] };
  } },
  ...[['ADDQ', '0'], ['SUBQ', '1']].map(([nm, bit]) => ({ id: nm, w: 2, build(r) {
    const s = r.pick(['B', 'W', 'L']), q = r.int(1, 8), ea = makeEA(r, r.pick(DATA_ALT.concat(s === 'B' ? [] : ['An'])), s);
    return { asm: `${nm}.${s} #${q},${ea.text}`, ops: [ea], segs: [seg('0101', nm), seg(bin(q & 7, 3), `data ${q === 8 ? '000 (means 8)' : bin(q, 3)}`), seg(bit, nm), seg(bin(SZ[s], 2), `size ${SZN[s]}`), ...eaSegs(ea)], ext: ea.ext };
  } })),
  { id: 'MOVEQ', w: 2, build(r) {
    const v = r.int(-128, 127), n = r.int(0, 7);
    return { asm: `MOVEQ #${v},D${n}`, ops: [], segs: [seg('0111', 'MOVEQ'), seg(bin(n, 3), `Dn = D${n}`), seg('0', ''), seg(bin(v, 8), `data ${v} as 8 bits`)], ext: [] };
  } },
  ...[['ORI', '00000000'], ['ANDI', '00000010'], ['SUBI', '00000100'], ['ADDI', '00000110'], ['EORI', '00001010'], ['CMPI', '00001100']].map(([nm, top]) => ({ id: nm, w: 1, build(r) {
    const s = r.pick(['B', 'W', 'L']), ea = makeEA(r, r.pick(DATA_ALT), s);
    let imm = makeEA(r, 'imm', s);
    if (nm === 'ADDI' || nm === 'SUBI') while (imm.value <= 8) imm = makeEA(r, 'imm', s);   /* the assembler turns ADDI/SUBI #1-8 into ADDQ/SUBQ */
    return { asm: `${nm}.${s} ${imm.text},${ea.text}`, ops: [imm, ea], segs: [seg(top, nm), seg(bin(SZ[s], 2), `size ${SZN[s]}`), ...eaSegs(ea)], ext: [...imm.ext, ...ea.ext] };
  } })),
  { id: 'SHIFT', w: 3, build(r) {
    const t = r.pick([['ASL', '00', 1], ['ASR', '00', 0], ['LSL', '01', 1], ['LSR', '01', 0], ['ROL', '11', 1], ['ROR', '11', 0]]);
    const s = r.pick(['B', 'W', 'L']), n = r.int(0, 7), byReg = r.int(0, 1) === 1, c = r.int(1, 8), m = r.int(0, 7);
    const count = byReg ? m : c;
    return { asm: byReg ? `${t[0]}.${s} D${m},D${n}` : `${t[0]}.${s} #${c},D${n}`, ops: [], segs: [seg('1110', 'shift/rotate'), seg(bin(count & 7, 3), byReg ? `count register D${m}` : `count ${c === 8 ? '000 (means 8)' : bin(c, 3)}`), seg(String(t[2]), t[2] ? 'left' : 'right'), seg(bin(SZ[s], 2), `size ${SZN[s]}`), seg(byReg ? '1' : '0', byReg ? 'count in register' : 'count immediate'), seg(t[1], `type ${t[0].slice(0, 2)}`), seg(bin(n, 3), `Dn = D${n}`)], ext: [] };
  } },
  { id: 'LEA', w: 1, build(r) {
    const n = r.int(0, 7), ea = makeEA(r, r.pick(CONTROL), 'L');
    return { asm: `LEA ${ea.text},A${n}`, ops: [ea], segs: [seg('0100', 'LEA'), seg(bin(n, 3), `An = A${n}`), seg('111', 'LEA'), ...eaSegs(ea)], ext: ea.ext };
  } },
  ...[['MULU', '1100', '011'], ['MULS', '1100', '111'], ['DIVU', '1000', '011'], ['DIVS', '1000', '111']].map(([nm, top, op]) => ({ id: nm, w: 1, build(r) {
    const n = r.int(0, 7), ea = makeEA(r, r.pick(DATA_SRC), 'W');
    return { asm: `${nm} ${ea.text},D${n}`, ops: [ea], segs: [seg(top, nm), seg(bin(n, 3), `Dn = D${n}`), seg(op, nm), ...eaSegs(ea)], ext: ea.ext };
  } })),
  ...[['JMP', '0100111011'], ['JSR', '0100111010']].map(([nm, top]) => ({ id: nm, w: 1, build(r) {
    const ea = makeEA(r, r.pick(CONTROL), 'L');
    return { asm: `${nm} ${ea.text}`, ops: [ea], segs: [seg(top, nm), ...eaSegs(ea)], ext: ea.ext };
  } })),
  { id: 'Bcc', w: 3, build(r) {
    const cc = r.pick([['BRA', 0], ['BSR', 1], ['BHI', 2], ['BLS', 3], ['BCC', 4], ['BCS', 5], ['BNE', 6], ['BEQ', 7], ['BVC', 8], ['BVS', 9], ['BPL', 10], ['BMI', 11], ['BGE', 12], ['BLT', 13], ['BGT', 14], ['BLE', 15]]);
    const at = 0x1000 + 2 * r.int(0, 0x3FF), far = r.int(0, 3) === 0;
    const d = far ? 2 * r.int(70, 1500) * r.pick([-1, 1]) : 2 * r.int(1, 60) * r.pick([-1, 1]);   /* displacement from the word after the opcode */
    const target = at + 2 + d;
    if (target < 0x400) return null;
    const short = d >= -128 && d <= 127 && d !== 0;
    return { at, asm: `${cc[0]} $${hx(target, 4)}`, ops: [], segs: [seg('0110', 'Bcc'), seg(bin(cc[1], 4), `condition ${bin(cc[1], 4)} (${cc[0]})`), seg(short ? bin(d, 8) : '00000000', short ? `8-bit displacement ${d}` : 'displacement 0 means a 16-bit word follows')], ext: short ? [] : [d & 0xFFFF], disp: d };
  } },
  { id: 'DBRA', w: 1, build(r) {
    const n = r.int(0, 7), at = 0x1000 + 2 * r.int(0, 0x3FF), d = 2 * r.int(2, 200) * r.pick([-1, 1]), target = at + 2 + d;
    return { at, asm: `DBRA D${n},$${hx(target, 4)}`, ops: [], segs: [seg('0101', 'DBcc'), seg('0001', 'condition F (DBRA)'), seg('11001', 'DBcc'), seg(bin(n, 3), `Dn = D${n}`)], ext: [d & 0xFFFF] };
  } },
];

const LAY = (n) => n.replace(/(.{4})(?=.)/g, '$1 ');
function words(form) {                                           /* 16-bit words from a form's segments, by the bit-field layout */
  const bits = form.segs.map((s) => s.bits).join('');
  if (bits.length !== 16) throw new Error(`${form.asm}: layout is ${bits.length} bits`);
  return [parseInt(bits, 2), ...form.ext];
}
const canon = (ws) => ws.map((w) => hx(w, 4)).join('');
const show = (ws) => ws.map((w) => '$' + hx(w, 4)).join(' ');

function explain(form, ws) {
  const parts = form.segs.map((s) => `\`${s.bits}\` ${s.label}`).join(' | ');
  const ext = form.ext.length ? ` Then the extension word${form.ext.length > 1 ? 's' : ''} (in the order source, destination): ${form.ext.map((w) => '$' + hx(w, 4)).join(' ')}.` : '';
  return `${parts} = \`${LAY(bin(ws[0], 16))}\` = **$${hx(ws[0], 4)}**.${ext}`;
}

function pickForm(r, used) {
  const pool = FORMS.flatMap((f) => Array(f.w).fill(f)).filter((f) => !used.has(f.id));
  for (let k = 0; k < 50; k++) {
    const f = r.pick(pool), b = f.build(r);
    if (b) return { id: f.id, ...b };
  }
  throw new Error('no form');
}

export const handAssembly = {
  id: 'hand-assembly',
  title: 'Hand assembly',
  concepts: ['assembly-programs.m68k-instruction-words', 'addressing-modes.m68k-effective-address', 'addressing-modes.m68k-absolute-immediate'],
  conventions: 'Answers are the instruction as 16-bit hexadecimal words, opcode word first, then extension words (source before destination). Absolute addresses written with four hex digits (below $8000) use absolute-short mode; eight-digit addresses above $0000FFFF use absolute-long. Branch targets are absolute addresses and the instruction address is stated; the short branch form is used when the displacement fits in a signed byte (and is not zero).',
  make(rand, { count = 5 } = {}) {
    const used = new Set(), items = [];
    for (let i = 0; i < count; i++) { const f = pickForm(rand, used); used.add(f.id); items.push(f); }
    const parts = items.map((f, i) => {
      const enc = encode68(f.asm, f.at ?? 0x1000);
      if (enc.error) throw new Error(`${f.asm}: ${enc.error}`);
      const ws = []; for (let k = 0; k < enc.bytes.length; k += 2) ws.push(enc.bytes[k] * 256 + enc.bytes[k + 1]);
      const model = words(f);
      return {
        label: 'abcdefgh'[i], kind: 'hex', prompt: (f.at !== undefined ? `\`${f.asm}\` (the instruction is at address $${hx(f.at, 6)})` : `\`${f.asm}\``),
        answer: canon(ws), display: show(ws), explain: explain(f, model),
        spec: { id: f.id, asm: f.asm, at: f.at ?? 0x1000 },
      };
    });
    return {
      family: 'hand-assembly', title: 'Hand assembly', concepts: this.concepts, conventions: this.conventions,
      prompt: 'Hand assemble these 68000 instructions and give the result as a series of hexadecimal words. (Example: `NOP` = $4E71.) You will need to look up the instructions.',
      parts, _items: items,
    };
  },
  /* the bit-field model's answer for each part, rebuilt from the layout */
  verify(p) { return Object.fromEntries(p.parts.map((x, i) => [x.label, canon(words(p._items[i]))])); },
};
export const problems = { 'hand-assembly': handAssembly };
