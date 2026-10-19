// Executable checks on the content: every Bug Hunt group (exactly the marked line fails to assemble),
// every Parsons program (assembles, runs to HALT, and gives the same result for all orders of its free groups),
// and the Tracer/Flag/Branch question generators (hundreds of random questions without errors).
'use strict';
global.window = global; global.QUEST = undefined;
const fs = require('fs'), vm = require('vm');
vm.runInThisContext(fs.readFileSync(__dirname + '/../../js/z80/data.js', 'utf8').replace('window.QUEST = {};', 'globalThis.QUEST = {};'));
const { assemble } = require('../../js/z80/asm.js'), { CPU } = require('../../js/z80/cpu.js');
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };

for (const [i, b] of QUEST.BUGS.entries()) {
  b.lines.forEach((l, k) => {
    const src = (/^\S/.test(l) ? '' : '') + (/^[A-Za-z_]+:/.test(l) ? l : '        ' + l.replace(/^\s+/, '')) + '\nLOOP: NOP\nAGAIN: NOP\nSUB1: NOP\nTABLE: NOP\n';
    const r = assemble(src);
    const ok = r.ok;
    if (k === b.bad && ok) fail(`bug ${i} line ${k} "${l}" should fail but assembles`);
    if (k !== b.bad && !ok) fail(`bug ${i} line ${k} "${l}" should assemble: ${r.errors[0].msg}`);
  });
}
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
for (const P of QUEST.PROGRAMS) {
  const orders = P.free.reduce((acc, g) => acc.flatMap((o) => perms(g).map((p) => { const c = o.slice(); g.forEach((pos, k) => { c[pos] = p[k]; }); return c; })), [Array.from({ length: P.lines.length }, (_, i) => i)]);
  const results = new Set();
  for (const o of orders) {
    const src = o.map((i) => P.lines[i]).join('\n') + '\n';
    const r = assemble(src);
    if (!r.ok) { fail(`program ${P.id} does not assemble: ${r.errors[0].msg}`); break; }
    const cpu = new CPU(); cpu.mem.set(r.mem); cpu.pc = r.origin; let n = 0;
    while (!cpu.halted && n++ < 100000) cpu.step();
    if (!cpu.halted) { fail(`program ${P.id} did not halt`); break; }
    if (process.env.DBG) console.log(P.id, o.join(), JSON.stringify([cpu.a, cpu.bc, cpu.de, cpu.hl])); results.add(JSON.stringify([cpu.a, cpu.bc, cpu.de, cpu.hl, r.symbols.BUF === undefined ? [] : Array.from(cpu.mem.slice(r.symbols.BUF, r.symbols.BUF + 16))]));
  }
  if (results.size > 1) fail(`program ${P.id}: free-group orders give different results`);
  else console.log('ok   program', P.id, `(${orders.length} order${orders.length > 1 ? 's' : ''})`);
}
// the generators
const G = require('../../js/z80/games.js');
const gens = { tracer: G.tracerQ, flag: G.flagQ, branch: G.branchQ };
for (const [name, fn] of Object.entries(gens)) for (const lv of ['easy', 'medium', 'hard']) { try { for (let i = 0; i < 300; i++) { const q = fn(lv); if (!q.prompt) throw new Error('no prompt'); } } catch (e) { fail(`${name}/${lv}: ${e.message}`); } }
for (const [name, fn] of Object.entries({ mode: G.modeQ, bug: G.bugQ, number: G.numberQ, hardware: G.hardwareQ, quiz: G.quizQ })) { try { for (let i = 0; i < 300; i++) fn(name === 'quiz' ? undefined : 'medium'); } catch (e) { fail(`${name}: ${e.message}`); } }
console.log(bad ? `${bad} content check(s) failed` : 'content checks pass');
process.exit(bad ? 1 : 0);
