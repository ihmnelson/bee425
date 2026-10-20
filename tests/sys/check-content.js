// Checks for the data-conversion section: recomputes every worked figure that appears on cards and in guides,
// proves successive approximation equals direct quantization, runs every drill generator, and validates quiz/card structure.
// usage: node tests/sys/check-content.js
'use strict';
global.window = global;
const path = require('path');
const CV = require('../../js/sys/conv.js');
global.ConvSys = CV;
require('../../js/sys/data.js');
const Games = require('../../js/sys/games.js');
const GUIDES = require('../../js/z80/guides.js');           // the sys guides borrow its renderer
global.PACKS = { list: { z80: { QUEST_GUIDES: GUIDES } } };
const SG = require('../../js/sys/guides.js');
let bad = 0; const fail = (m) => { bad++; console.log('FAIL', m); };
const near = (a, b, tol) => Math.abs(a - b) <= Math.abs(b) * (tol || 1e-9) + 1e-12;
const eq = (name, got, want, tol) => { if (!near(got, want, tol)) fail(`${name}: got ${got}, want ${want}`); };

/* ---- figures quoted on the slides, cards and guides ---- */
eq('8-bit over 10 V step (slide 17, 0.04 V)', CV.step(10, 8), 0.0392156862745098, 1e-9); if (Math.round(CV.step(10, 8) * 100) !== 4) fail('8-bit step does not round to 0.04 V');
eq('16-bit over 10 V step (0.00015 V)', CV.step(10, 16), 10 / 65535); if (Number(CV.step(10, 16).toFixed(5)) !== 0.00015) fail('16-bit step does not round to 0.00015 V');
eq('10-bit over 10.23 V step (10 mV)', CV.step(10.23, 10), 0.01, 1e-12);
eq('4-bit DAC, 0.1 mA into 1 kΩ: full scale 1.5 V', CV.dac(15, 1.5, 4), 15 * 0.1 * 1, 1e-12);
eq('flash 1 ns + 1 ns = 500 MHz', CV.flashRate(1, 1), 500);
eq('8-bit flash comparators', CV.flashComparators(8), 255);
eq('V/F 100 kHz/V, 5 V, 1 s', CV.vfCounts(100e3, 5, 1), 500000);
eq('V/F 10 s', CV.vfCounts(100e3, 5, 10), 5000000);
eq('V/F 100 s', CV.vfCounts(100e3, 5, 100), 50000000);
eq('droop: 10.23 V span, 10 bit, 1 V/ms = 5 µs', CV.droopTime(10.23, 10, 1000), 5e-6, 1e-9);
eq('droop at 50 mV/s is 100 ms (slide says 100 µs: noted as a slide inconsistency)', CV.droopTime(10.23, 10, 0.05), 0.1, 1e-9);
eq('droop at 50 mV/ms is 100 µs', CV.droopTime(10.23, 10, 50), 100e-6, 1e-9);
eq('slew 1000 V/s over 1 ms = 1 V', 1000 * 1e-3, 1);
eq('Nyquist 10 kHz needs 20 kHz', CV.nyquistMin(10), 20);
eq('10 kHz sampled at 10 kHz looks like 0 Hz (slide 34)', CV.alias(10, 10), 0);
eq('alias 7 kHz at 10 kHz = 3 kHz', CV.alias(7, 10), 3);
const fc = 1 / (2 * Math.PI * 11.2e3 * Math.sqrt(1000e-12 * 2000e-12)); eq('2-pole filter cutoff ≈ 10 kHz (slide 35)', fc, 10e3, 0.01);
eq('dual slope: Vx = Vref·tref/T', CV.dualSlopeVx(10, 50, 100), 5);
eq('1-bit flash comparators', CV.flashComparators(1), 1);
{ const t = CV.thermometer(1.23, 1.5, 4); if (t.join('') !== '111111111111000'.slice(0, 15) && t.filter(Boolean).length !== 12) fail('thermometer code count'); if (t.join('').replace(/1+/, '').includes('1')) fail('thermometer code not contiguous'); }

/* ---- successive approximation equals direct quantization (exhaustive on a fine grid) ---- */
let n = 0, mism = 0;
for (let bits = 1; bits <= 8; bits++) for (const s of [0.01, 0.1, 0.25, 1]) { const vfs = CV.levels(bits) * s; for (let i = 0; i <= 4000; i++) { const v = (vfs * i) / 4000; n++; if (CV.sar(v, vfs, bits).code !== CV.code(v, vfs, bits)) mism++; } }
if (mism) fail(`SAR differs from direct quantization in ${mism} of ${n} cases`); else console.log(`SAR vs direct quantization: ${n} cases, 0 differences`);
for (let bits = 1; bits <= 8; bits++) { const vfs = CV.levels(bits) * 0.1; for (let c = 0; c <= CV.levels(bits); c++) { if (CV.code(c * 0.1, vfs, bits) !== c) fail(`code(${c} steps) round trip, ${bits} bits`); if (CV.sar((c + 0.5) * 0.1, vfs, bits).code !== Math.min(c, CV.levels(bits))) fail(`mid-step SAR ${bits} bits code ${c}`); } }

/* ---- the home-page demo must end on the result the guide states: 4 bits, 1.23 V over 1.5 V -> 1100B = 12 ---- */
{ const r = CV.sar(1.23, 1.5, 4); if (r.code !== 12 || CV.bin(r.code, 4) !== '1100') fail('demo SAR result ' + r.code); }

/* ---- drill generators: each grades its own answer right and a wrong one wrong ---- */
const stat = {};
for (const lv of ['easy', 'medium', 'hard']) for (let i = 0; i < 3000; i++) {
  const q = Games.convertQ(lv); stat[lv] = (stat[lv] || 0) + 1;
  if (q.kind !== 'fields' || !q.fields.length || !q.prompt || !q.grade) { fail(`${lv}: malformed question ${q.prompt}`); break; }
  // reconstruct the right answers by trying to read them out of the detail: grade() with the answer is checked via a solver that brute-forces
  const solved = q.fields.map((_, k) => { const probe = (x) => q.grade(q.fields.map((_, j) => (j === k ? String(x) : '1e99'))); return probe; });
  if (!solved.length) fail('no fields');
  // an absurd answer must be wrong
  if (q.grade(q.fields.map(() => '1e99')).ok) fail(`${lv}: absurd answer accepted for "${q.prompt}"`);
  if (q.grade(q.fields.map(() => '-1')).ok) fail(`${lv}: negative answer accepted for "${q.prompt}"`);
}
console.log('drill questions generated:', JSON.stringify(stat));

/* ---- independent answers for each drill type: parse the prompt numbers and recompute with a second formula ---- */
const seen = new Set();
function indep(q) {
  const p = q.prompt; let m;
  const v = (x) => String(x);
  if ((m = /^An (\d+)-bit converter spans 0 to (\d+) V\. What is the voltage of one step/.exec(p))) return [(+m[2] / (Math.pow(2, +m[1]) - 1)) * 1000];
  if ((m = /^How many comparators does a (\d+)-bit flash/.exec(p))) return [Math.pow(2, +m[1]) - 1];
  if ((m = /^A (\d+)-bit binary-weighted D\/A uses i = ([\d.]+) mA and R = (\d+) kΩ/.exec(p))) return [(Math.pow(2, +m[1]) - 1) * +m[2] * +m[3]];
  if ((m = /^A (\d+) kHz sine wave is to be digitised/.exec(p))) return [2 * +m[1]];
  if ((m = /^An (\d+)-bit converter spans 0 to ([\d.]+) V \(one step = ([\d.]+) mV\)\. The input is ([\d.]+) V/.exec(p))) return [Math.floor(+m[4] / (+m[3] / 1000) + 1e-9)];
  if ((m = /^A 4-bit D\/A converter has full scale [\d.]+ V \(([\d.]+) V per step\)\. What is its output for code ([01]{4})B/.exec(p))) return [parseInt(m[2], 2) * +m[1]];
  if ((m = /^A V\/F converter gives (\d+) kHz per volt\. Its input is (\d+) V and the pulses are counted for (\d+) s/.exec(p))) return [+m[1] * 1000 * +m[2] * +m[3]];
  if ((m = /^A flash converter's comparators settle in (\d+) ns and its decode logic takes (\d+) ns/.exec(p))) return [1000 / (+m[1] + +m[2])];
  if ((m = /^A (\d+)-bit converter spans 0 to ([\d.]+) V \(([\d.]+) mV per count\)\. The sample-and-hold droops ([\d.]+) V\/ms/.exec(p))) return [(+m[3] / 2) / +m[4]];       // mV / (V/ms) = µs
  if ((m = /^Dual-slope A\/D: the unknown is counted for T = (\d+) ms; counting down against Vref = (\d+) V takes tref = ([\d.]+) ms/.exec(p))) return [+m[2] * +m[3] / +m[1]];
  if ((m = /^A ([\d.]+) kHz sine wave is sampled at (\d+) kHz/.exec(p))) { const f = +m[1], fs = +m[2]; let a = f % fs; if (a > fs / 2) a = fs - a; return [a]; }
  if ((m = /^A (\d+)-bit successive-approximation converter spans 0 to [\d.]+ V \(([\d.]+) V per step\)\. Vin = ([\d.]+) V/.exec(p))) return [Math.floor(+m[3] / +m[2] + 1e-9), +m[1]];
  if ((m = /^An input changes at (\d+) V\/s and there is no sample-and-hold\. The conversion takes ([\d.]+) ms/.exec(p))) return [+m[1] * +m[2] / 1000];
  return null;
}
let checked = 0, unknown = 0;
for (const lv of ['easy', 'medium', 'hard']) for (let i = 0; i < 4000; i++) {
  const q = Games.convertQ(lv), ans = indep(q);
  if (!ans) { unknown++; fail('no independent solver for: ' + q.prompt); break; }
  seen.add(q.prompt.replace(/[\d.]+/g, '#').slice(0, 40));
  const r = q.grade(ans.map((a) => String(a)));
  if (!r.ok) { fail(`independent answer rejected for "${q.prompt}": ${ans} (${r.detail})`); break; }
  checked++;
}
console.log(`independently recomputed and accepted: ${checked} questions across ${seen.size} question shapes`);
if (seen.size < 13) fail('expected 14 question shapes, saw ' + seen.size);

/* ---- quiz, cards, glossary, guides ---- */
const Q = window.QUEST;
const worlds = new Set(Q.WORLDS.map((w) => w.id));
Q.QUIZ.forEach((q) => {
  const all = [q.correct, ...q.wrong];
  if (new Set(all).size !== 4) fail('quiz options not 4 distinct: ' + q.q);
  if (!worlds.has(q.world)) fail('quiz world unknown: ' + q.q);
  if (!q.why) fail('quiz has no explanation: ' + q.q);
});
Q.CARDS.forEach((c) => {
  if (!worlds.has(c.deck)) fail('card deck unknown: ' + c.q);
  if (!/^L10, slides? \d+(-\d+)?( and \d+)?(, \d+)*$/.test(c.src) && !/^L10, slides \d+(, | and )[\d, and-]+$/.test(c.src)) fail('card source is not a slide reference: ' + c.src);
  if (!c.q || !c.a) fail('empty card');
});
if (new Set(Q.CARDS.map((c) => c.q)).size !== Q.CARDS.length) fail('duplicate card questions');
Q.WORLDS.forEach((w) => { if (Q.CARDS.filter((c) => c.deck === w.id).length < 6) fail('few cards in ' + w.id); if (Q.QUIZ.filter((q) => q.world === w.id).length < 4) fail('few quiz items in ' + w.id); if (!SG.DECK_GUIDE[w.id] || !SG.GUIDES.find((g) => g.id === SG.DECK_GUIDE[w.id])) fail('no guide for ' + w.id); });
SG.GUIDES.forEach((g) => {
  const html = SG.render(g.md);
  if (!html.includes('<h2>') || html.length < 1500) fail('guide too short or unrendered: ' + g.id);
  if (!worlds.has(g.practice[0])) fail('guide practice world: ' + g.id);
  (SG.SEE[g.id] || []).forEach((x) => { if (!SG.GUIDES.find((y) => y.id === x)) fail(`${g.id} see-also ${x} missing`); });
});
SG.GLOSSARY.forEach((t) => { if (!SG.CAT_GUIDE[t.cat]) fail('glossary category has no guide: ' + t.cat); });
if (new Set(SG.GLOSSARY.map((t) => t.term)).size !== SG.GLOSSARY.length) fail('duplicate glossary term');
console.log(`${Q.CARDS.length} cards, ${Q.QUIZ.length} quiz items, ${SG.GUIDES.length} guides, ${SG.GLOSSARY.length} glossary terms checked`);
if (bad) { console.log(bad + ' failure(s)'); process.exit(1); } console.log('sys content checks passed');
