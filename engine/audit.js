/* node engine/audit.js [--slides] : the accuracy report.
   1. structure and duplicates (schema.js)   2. every generator checked against an independent solver over many seeds
   3. unverified concepts   4. slide quotes: each {type: slide, ref, quote} must appear on that slide in the lecture PDF
   Exit code 1 if anything is an error. Warnings are listed, not fatal. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCourse } from './lib/load.js';
import { validate } from './lib/schema.js';
import { rng } from './lib/rng.js';
import { parseNumber } from './lib/check.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const squash = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

export async function audit({ slides = true, seeds = 400 } = {}) {
  const { generators } = await import(pathToFileURL(path.join(contentDir, 'generators', 'index.js')).href);
  const data = loadCourse(contentDir);
  const { errors, warnings } = validate(data, generators);
  const lines = [];

  /* generators */
  const used = new Set(Object.values(data.concepts).flatMap((c) => (c.checks || []).filter((k) => k.gen).map((k) => k.gen)));
  const genStats = [];
  for (const id of Object.keys(generators)) {
    if (!used.has(id)) warnings.push(`generator ${id}: defined but no concept uses it`);
    const g = generators[id];
    let bad = 0, kinds = new Set();
    for (let s = 1; s <= seeds; s++) {
      const q = g.make(rng(s));
      const got = parseNumber(q.answer), want = g.verify(q);
      kinds.add(q.prompt);
      if (!(Math.abs(got - want) < 1e-9)) { bad++; if (bad <= 3) errors.push(`generator ${id} seed ${s}: make() says ${q.answer}, independent solver says ${want} (${q.prompt.slice(0, 70)})`); }
      for (const f of ['prompt', 'explain']) if (!q[f]) { errors.push(`generator ${id} seed ${s}: no ${f}`); break; }
    }
    genStats.push(`${id}: ${seeds} seeds, ${kinds.size} distinct questions, ${bad} disagreements`);
  }

  /* slide quotes */
  let quoteReport = 'skipped';
  const sl = data.course.slides;
  if (slides && sl) {
    const dir = path.resolve(root, sl.dir);
    if (!fs.existsSync(dir)) quoteReport = `skipped (no folder ${dir})`;
    else {
      const cache = {};
      const slideText = (n) => {
        if (cache[n]) return cache[n];
        const pdf = path.join(dir, sl.file.replace('{n}', n));
        if (!fs.existsSync(pdf)) return (cache[n] = null);
        const txt = execFileSync('pdftotext', [pdf, '-'], { encoding: 'utf8', maxBuffer: 64e6 });
        const re = new RegExp(sl.footer, 'g'); const map = {}; let last = 0, m;
        while ((m = re.exec(txt))) { map[m[1]] = squash(txt.slice(last, m.index)); last = m.index + m[0].length; }
        return (cache[n] = map);
      };
      let checked = 0, ok = 0;
      for (const c of Object.values(data.concepts)) for (const s of c.sources || []) {
        if (s.type !== 'slide') continue;
        const m = /^L(\d+) s(\d+)$/.exec(s.ref || ''); if (!m) continue;
        const map = slideText(m[1]);
        if (!map) { warnings.push(`${c.id}: cannot check ${s.ref}, lecture PDF ${m[1]} not found`); continue; }
        if (!map[m[2]]) { errors.push(`${c.id}: ${s.ref} is not a slide number found in Lesson ${m[1]}`); continue; }
        if (!s.quote) { warnings.push(`${c.id}: ${s.ref} has no quote, so it is not verified`); continue; }
        checked++;
        if (map[m[2]].includes(squash(s.quote))) ok++;
        else errors.push(`${c.id}: quote not found on ${s.ref}: "${s.quote}"`);
      }
      quoteReport = `${ok} of ${checked} quotes found on their slide`;
    }
  }

  const concepts = Object.values(data.concepts);
  const unverified = warnings.filter((w) => w.includes(': unverified'));
  lines.push(`Concepts: ${concepts.length}   Checks: ${concepts.reduce((n, c) => n + (c.checks || []).length, 0)}   Generated check slots: ${concepts.reduce((n, c) => n + (c.checks || []).filter((k) => k.gen).length, 0)}`);
  lines.push(`Slide quotes: ${quoteReport}`);
  lines.push('Generators:', ...genStats.map((s) => '  ' + s));
  lines.push(`Unverified concepts (no slide/manual/oracle evidence): ${unverified.length}`);
  return { errors, warnings, lines, data };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings, lines } = await audit({ slides: !process.argv.includes('--no-slides') });
  console.log(lines.join('\n'));
  if (warnings.length) console.log('\nWarnings\n' + warnings.map((w) => '  ' + w).join('\n'));
  if (errors.length) console.log('\nERRORS\n' + errors.map((e) => '  ' + e).join('\n'));
  console.log(errors.length ? `\n${errors.length} error(s).` : '\nAudit passed.');
  process.exit(errors.length ? 1 : 0);
}
