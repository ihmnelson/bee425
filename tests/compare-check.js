// Runs every 68000/Z80 pair in js/shell/compare-data.js on both CPU cores and requires the documented answers.
'use strict';
const { PAIRS, runPair } = require('../js/shell/compare-data.js');
let bad = 0; const fail = (m) => { bad++; console.log('FAIL', m); };
const ids = new Set();
for (const p of PAIRS) {
  if (ids.has(p.id)) fail('duplicate id ' + p.id); ids.add(p.id);
  const r = runPair(p);
  for (const k of ['m68k', 'z80']) {
    if (!r[k].ok) { fail(`${p.id} ${k}: ${r[k].error}`); continue; }
    const want = k === 'z80' && p.expectZ80 !== undefined ? p.expectZ80 : p.expect;
    if (r[k].value !== want) fail(`${p.id} ${k}: ${r[k].where} = ${r[k].value}, want ${want}`);
  }
  if (!p.differences || p.differences.length < 2) fail(p.id + ': needs at least two differences');
  if (r.m68k.ok && r.z80.ok) console.log(`ok   ${p.id.padEnd(10)} answer ${r.m68k.value}${p.expectZ80 !== undefined ? '/' + r.z80.value : ''}   68K ${r.m68k.bytes} B, ${r.m68k.steps} instr   Z80 ${r.z80.bytes} B, ${r.z80.steps} instr, ${r.z80.extra}`);
}
if (bad) { console.log(bad + ' failure(s)'); process.exit(1); } console.log(`${PAIRS.length} pairs: both processors give the documented answers`);
