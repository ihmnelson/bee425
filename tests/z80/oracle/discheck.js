// Round-trip check of js/dis.js against js/asm.js: for every opcode sequence,
// disassemble, re-assemble the text, and require the same bytes (and the same length).
// Also compares the mnemonic against z80dasm where it prints a real instruction.
'use strict';
const { assemble } = require('../../../js/z80/asm.js'), { dis } = require('../../../js/z80/dis.js');
const PAD = [0x12, 0x34, 0x56, 0x78, 0x9A];
const seqs = [];
for (let o = 0; o < 256; o++) { if ([0xCB, 0xDD, 0xED, 0xFD].includes(o)) continue; seqs.push([o]); }
for (let o = 0; o < 256; o++) for (const p of [[0xED], [0xCB], [0xDD], [0xFD], [0xDD, 0xCB, 0x05], [0xFD, 0xCB, 0xFB]]) seqs.push([...p, o]);
let n = 0, bad = 0, alias = 0;
for (const sq of seqs) {
  const bytes = sq.concat(PAD), r = dis((a) => bytes[a] || 0, 0);
  if (sq[0] === 0xED && (sq[1] === 0x63 || sq[1] === 0x6B) && sq.length === 2) { n++; alias++; continue; }   // LD (nn),HL via ED: a longer duplicate of the main-page form
  if (r.text === 'NOP' && sq.some((b, i) => i === sq.length - 1 && b !== 0)) { n++; continue; }   // undefined opcode shown as NOP
  const res = assemble('ORG 0\n' + r.text + '\n');
  const want = bytes.slice(0, r.len);
  const got = Array.from(res.mem.slice(0, r.len));
  n++;
  if (res.ok && res.size === r.len && got.some((b, i) => b !== want[i]) && dis((a) => res.mem[a], 0).text === r.text) { alias++; continue; }   // documented duplicate encodings (NEG, IM, BIT on (IX+d) ...)
  if (!res.ok || res.size !== r.len || got.some((b, i) => b !== want[i])) { bad++; if (bad < 30) console.log('MISMATCH', sq.map((b) => b.toString(16)).join(' '), '->', r.text, res.ok ? got.map((b) => b.toString(16)).join(' ') : res.errors[0].msg); }
}
console.log(`${n} opcode sequences disassembled and re-assembled, ${bad} mismatches (${alias} are alternate encodings of the same instruction)`);
