/* Start here: every example program assembles and runs to its end, and every link target (guide, topic) exists. */
const fs = require('fs');
const START = require('../js/shell/start.js'), H = require('../js/m68k/homework.js');
const guides = fs.readFileSync(__dirname + '/../js/m68k/guides.js', 'utf8'), data = fs.readFileSync(__dirname + '/../js/m68k/data.js', 'utf8');
let bad = 0, n = 0; const fail = (m) => { console.log('FAIL ' + m); bad++; };
const ids = new Set();
for (const l of START.LESSONS) {
  if (ids.has(l.id)) fail('duplicate lesson id ' + l.id); ids.add(l.id);
  if (!l.check || l.check.length < 3) fail(l.id + ': fewer than 3 check questions');
  for (const e of l.examples || []) { const r = H.runWith(e.src); if (r.error) fail(`${l.id} "${e.title}": ${r.error}`); else n++; }
  const nx = l.next || {};
  if (nx.guide && !guides.includes(`id: '${nx.guide}'`)) fail(`${l.id}: no guide ${nx.guide}`);
  if (nx.topic && !data.includes(`id: '${nx.topic}'`)) fail(`${l.id}: no topic ${nx.topic}`);
}
require('../js/shell/labs.js'); const LABS = START.LABS || require('../js/shell/labs.js');
for (const l of LABS) { if (ids.has(l.id)) fail('duplicate id ' + l.id); ids.add(l.id); if (!l.check || l.check.length < 3) fail(l.id + ': fewer than 3 check questions'); }
if (!LABS.length) fail('no labs');
// figures: every {{fig:}} / {{img:}} marker resolves, every image file exists, every figure is used
const F = require('../js/shell/figs.js'), usedF = new Set(), usedI = new Set();
for (const l of [...START.LESSONS, ...LABS]) for (const m of l.md.matchAll(/\{\{(fig|img):([\w-]+)\}\}/g)) {
  if (m[1] === 'fig') { usedF.add(m[2]); if (!F.FIGS[m[2]]) fail(`${l.id}: no figure ${m[2]}`); }
  else { usedI.add(m[2]); const im = F.IMAGES[m[2]]; if (!im) fail(`${l.id}: no image ${m[2]}`); else if (!fs.existsSync(__dirname + '/../' + im[0])) fail(`missing file ${im[0]}`); }
}
for (const k of Object.keys(F.FIGS)) if (!usedF.has(k)) fail('unused figure ' + k);
for (const k of Object.keys(F.IMAGES)) if (!usedI.has(k)) fail('unused image ' + k);
// the numbers printed in the lessons
const run = (src) => H.runWith(src).cpu;
const byId = (id) => START.LESSONS.find((l) => l.id === id).examples;
const c1 = run(byId('running')[0].src); if (c1.D[0] !== 8 || ((c1.mem[0x2000] << 8) | c1.mem[0x2001]) !== 8) fail('running: expected 8 at D0 and $2000');
const c2 = run(byId('registers')[0].src); if (c2.D[0] >>> 0 !== 0x12345600 || (c2.getSR() & 31) !== 0b10101) fail('registers: expected $12345600 and XNZVC=10101');
const c3 = run(byId('modes')[0].src); if (c3.D[0] !== 100) fail('modes: expected 100');
const c4 = run(byId('branches')[0].src); if (c4.D[1] !== 0) fail('branches: expected D1=0 for 7 vs 10');
const c5 = run(byId('branches')[1].src); if (c5.D[0] !== 15) fail('branches: expected 15');
const c6 = run(byId('stack')[0].src); if (c6.D[0] !== 10 || c6.A[7] !== 0x01000000) fail('stack: expected D0=10 and SP restored');
console.log(bad ? `${bad} failure(s)` : `start-here checks pass (${START.LESSONS.length} lessons, ${LABS.length} lab pages, ${Object.keys(F.FIGS).length} diagrams, ${Object.keys(F.IMAGES).length} slide images, ${n} example programs run, printed results match)`);
process.exit(bad ? 1 : 0);
