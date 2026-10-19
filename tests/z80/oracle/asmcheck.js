// Checks js/asm.js against z80dasm (a real disassembler, used as a black-box oracle):
// every opcode byte sequence is disassembled by z80dasm, the text is fed back to our assembler,
// and the bytes must match.  usage: node asmcheck.js
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { assemble } = require('../../../js/z80/asm.js');
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'asmchk-'));
const PAD = [0x12, 0x34, 0x56, 0x78];
const seqs = [];
for (let o = 0; o < 256; o++) { if ([0xCB, 0xDD, 0xED, 0xFD].includes(o)) continue; seqs.push([o]); }
for (let o = 0; o < 256; o++) { seqs.push([0xED, o]); seqs.push([0xCB, o]); seqs.push([0xDD, o]); seqs.push([0xFD, o]); seqs.push([0xDD, 0xCB, 0x05, o]); seqs.push([0xFD, 0xCB, 0xFB, o]); }
let bad = 0, n = 0, skipped = 0;
for (const sq of seqs) {
  const f = path.join(tmp, 'i.bin'); fs.writeFileSync(f, Buffer.from(sq.concat(PAD)));
  const out = cp.execFileSync('z80dasm', ['-a', '-t', '-u', '-g', '0', f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const line = out.split('\n').find((l) => /;0000/.test(l)); if (!line) continue;
  const m = /^\s*(.*?)\s*;0000\t([0-9A-Fa-f ]+)\t/.exec(line);
  if (!m) continue;
  let text = m[1].trim();
  const len = m[2].trim().split(/\s+/).length;
  // undocumented DDCB forms come out as "rlc (ix+5) & ld b,(ix+5)": turn into "rlc (ix+5),b"
  const comp = /^(.*?\))\s*&\s*ld ([a-z]),\(.*$/.exec(text); if (comp) text = comp[1] + ',' + comp[2];
  if (/^(defb|db|defm)/i.test(text) || text === '') { skipped++; continue; }    // z80dasm gave up: not an instruction
  const want = sq.concat(PAD).slice(0, len || sq.length);
  const res = assemble(text + '\n');
  n++;
  const got = Array.from(res.mem.slice(0, want.length));
  if (!res.ok || got.some((b, i) => b !== want[i]) || res.size !== want.length) {
    bad++; if (bad <= 40) console.log('MISMATCH', text, '| want', want.map((b) => b.toString(16)).join(' '), '| got', res.ok ? got.map((b) => b.toString(16)).join(' ') + ' size ' + res.size : res.errors[0].msg);
  }
}
console.log(`${n} instruction forms checked against z80dasm, ${bad} mismatches, ${skipped} skipped`);
fs.rmSync(tmp, { recursive: true, force: true });
