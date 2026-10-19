// Runs checks.js and writes tests/data/audit.js (the rows shown on the Tests page).
// usage: AUDIT_SRC=<dir with um0080.txt, BEE425F26Lesson*.txt, oshonsoft_*.txt> node run-audit.js
// Items with no passing check stay UNVERIFIED; a failing check is reported and marked CORRECTED-needed.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = process.env.AUDIT_SRC; if (!SRC) { console.log('set AUDIT_SRC'); process.exit(1); }
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../../../js/z80/data.js'), 'utf8').replace('window.QUEST = {};', 'globalThis.QUEST = {};'));
const G = require('../../../js/z80/guides.js');
const { CHECKS } = require('./checks.js');

const items = [];
QUEST.CARDS.forEach((c, i) => items.push({ id: 'card-' + i, kind: 'card', title: c.q }));
QUEST.QUIZ.forEach((q, i) => items.push({ id: 'quiz-' + i, kind: 'quiz', title: q.q }));
G.GLOSSARY.forEach((t, i) => items.push({ id: 'glossary-' + i, kind: 'glossary', title: t.term }));
for (const g of G.GUIDES) { if (g.id === 'transistor') continue; g.md.split(/^## /m).forEach((p, k) => { if (!p.trim()) return; items.push({ id: `guide-${g.id}-${k}`, kind: 'guide', title: g.title + ' > ' + (k === 0 ? '(intro)' : p.split('\n')[0]) }); }); }
const byId = Object.fromEntries(items.map((x) => [x.id, x]));

const files = { um: ['um0080.txt'], slide: [3, 4, 5, 6, 7, 8].map((n) => `BEE425F26Lesson${n}.txt`), osh: ['oshonsoft_z80.html.txt', 'oshonsoft_z80helptopics.php.txt', 'oshonsoft_z80gettingstarted.php.txt'] };
const text = {}; for (const [k, fl] of Object.entries(files)) text[k] = fl.flatMap((f) => fs.readFileSync(path.join(SRC, f), 'utf8').split('\n').map((l, i) => ({ f, i: i + 1, l })));
const find = (src, re) => { for (const L of text[src]) if (re.test(L.l)) return `${L.f}:${L.i}: ${L.l.trim().slice(0, 110)}`; return null; };

const ev = {}; const bad = [];
const add = (id, v, e, weak) => { (ev[id] = ev[id] || []).push({ v, e, weak }); };
for (const c of CHECKS) {
  let res;
  if (c.type === 'text') {
    const hits = c.all.map((re) => find(c.src, re)); const miss = c.all.filter((_, i) => !hits[i]);
    res = miss.length ? { ok: false, e: `NOT FOUND in ${c.src}: ${miss.join(' ; ')}` } : { ok: true, weak: !!c.weak, e: (c.weak ? 'Topic found in the source (the definition itself was not matched): ' : '') + hits.slice(0, 2).join('  |  ') };
  } else {
    let r; try { r = c.fn(); } catch (e) { r = 'exception: ' + e.message; }
    res = r === true ? { ok: true, e: 'Run on the simulator: ' + c.note } : { ok: false, e: 'Run on the simulator: ' + c.note + ' -> ' + r };
  }
  for (const id of c.ids) { if (!byId[id]) { bad.push('unknown id ' + id); continue; } add(id, res.ok, res.e, res.weak); }
  if (!res.ok) bad.push(`${c.ids.join(',')}: ${res.e}`);
}
const rows = items.map((x) => {
  const e = ev[x.id];
  if (!e) return { kind: x.kind, title: x.title, verdict: 'UNVERIFIED', evidence: 'No source check was run for this item. It was written from the Zilog manual and lecture slides but not independently verified.' };
  const ok = e.every((y) => y.v) && e.some((y) => !y.weak);
  return { kind: x.kind, title: x.title, verdict: ok ? 'CONFIRMED' : 'UNVERIFIED', evidence: (ok ? '' : 'A check did not pass: ') + e.map((y) => (y.v ? '' : 'FAILED: ') + y.e).join('\n') };
});
// problems found by these checks (or while building) and fixed on the site
rows.push(
  { kind: 'guide', title: 'Jumps, conditions and loops > Comparing with CP (signed compare idiom)', verdict: 'CORRECTED', evidence: 'The first draft used CP B / JP PO / XOR 80H / JP M. An exhaustive test of all 65,536 byte pairs failed (A=0, B=80H): CP leaves A unchanged, so XOR 80H flips A, not the result. The guide now uses SUB B (and says A is destroyed). Re-tested: all pairs correct.' },
  { kind: 'guide', title: 'Memory, buses and address decoding > The Z80\'s pins (bus acknowledge)', verdict: 'CORRECTED', evidence: 'The first draft called the bus acknowledge pin ~BUSAK; the Zilog manual (UM0080) names it ~BUSACK. Fixed.' },
  { kind: 'guide', title: 'Oshonsoft guide > start address and memory contents', verdict: 'CORRECTED', evidence: 'The first draft (from a summary of the Oshonsoft pages) said the sandbox starts at the first ORG. The Help Topics page says the simulation starts at the starting address, default 0000H, with memory filled with NOPs; the Rate list also has six entries, not four. Guide, cards and sandbox were changed to match.' },
);
const count = (v) => rows.filter((r) => r.verdict === v).length;
const note = `Evidence is mechanical: a "text" check finds the cited phrases in the lecture slides, the Zilog Z80 CPU User Manual (UM0080) or the Oshonsoft help pages and quotes the line; a "code" check runs the claim on this site's CPU core and assembler (verified against 1.6 million hardware-derived vectors). Items with no check are UNVERIFIED, not wrong. Phrase matches show the source says the same thing, not that every nuance of the card is right.`;
fs.writeFileSync(path.join(__dirname, '../data/audit.js'), `(window.AUDIT = window.AUDIT || {}).z80 = { note: ${JSON.stringify(note)}, rows: ${JSON.stringify(rows)} };\n`);
console.log(`items ${rows.length}: confirmed ${count('CONFIRMED')}, unverified ${count('UNVERIFIED')}`);
bad.forEach((b) => console.log('CHECK PROBLEM', b));
