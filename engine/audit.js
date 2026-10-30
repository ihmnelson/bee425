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
  let lines_h = '';

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
      const slack = (q.tolerance || 0) * Math.max(1, Math.abs(want)) / 2 + 1e-9;   /* the stored answer may be rounded, within half the allowed tolerance */
      if (!(Math.abs(got - want) <= slack)) { bad++; if (bad <= 3) errors.push(`generator ${id} seed ${s}: make() says ${q.answer}, independent solver says ${want} (${q.prompt.slice(0, 70)})`); }
      for (const f of ['prompt', 'explain']) if (!q[f]) { errors.push(`generator ${id} seed ${s}: no ${f}`); break; }
    }
    genStats.push(`${id}: ${seeds} seeds, ${kinds.size} distinct questions, ${bad} disagreements`);
  }

  /* executable claims: encodings and programs in a concept are assembled and run on the course's oracle modules */
  const oracles = {};
  for (const [cpu, rel] of Object.entries(data.course.oracles || {})) oracles[cpu] = await import(pathToFileURL(path.join(contentDir, rel)).href);
  let encChecked = 0, progChecked = 0;
  for (const c of Object.values(data.concepts)) {
    for (const e of c.encodings || []) {
      const o = oracles[e.cpu]; if (!o) { errors.push(`${c.id}: no oracle for cpu "${e.cpu}"`); continue; }
      const got = o.encode(e.asm); encChecked++;
      if (got.error) errors.push(`${c.id}: "${e.asm}" does not assemble: ${got.error}`);
      else if (got.hex !== String(e.hex).replace(/\s+/g, '').toUpperCase()) errors.push(`${c.id}: "${e.asm}" assembles to ${got.hex}, the concept says ${e.hex}`);
    }
    for (const p of c.programs || []) {
      const o = oracles[p.cpu]; if (!o) { errors.push(`${c.id}: no oracle for cpu "${p.cpu}"`); continue; }
      const fails = o.run(p.source, p.expect || {}); progChecked++;
      for (const f of fails) errors.push(`${c.id}: program "${(p.name || p.source.trim().split('\n')[0]).slice(0, 40)}": ${f}`);
    }
    const claimsOracle = (c.sources || []).some((x) => x.type === 'oracle');
    const hasClaims = (c.encodings || []).length + (c.programs || []).length > 0;
    if (claimsOracle && !hasClaims) warnings.push(`${c.id}: lists an oracle source but has no encodings or programs to run`);
    if (hasClaims && !claimsOracle) warnings.push(`${c.id}: has executable claims but no { type: oracle } source`);
  }

  for (const ex of Object.values(data.exams || {})) for (const pr of ex.problems || []) {
    for (const e of pr.encodings || []) {
      const o = oracles[e.cpu]; const got = o.encode(e.asm); encChecked++;
      if (got.error) errors.push(`exam ${ex.id} problem ${pr.n}: "${e.asm}" does not assemble: ${got.error}`);
      else if (got.hex !== String(e.hex).replace(/\s+/g, '').toUpperCase()) errors.push(`exam ${ex.id} problem ${pr.n}: "${e.asm}" assembles to ${got.hex}, the solution says ${e.hex}`);
    }
    for (const p of pr.programs || []) {
      const fails = oracles[p.cpu].run(p.source, p.expect || {}); progChecked++;
      for (const f of fails) errors.push(`exam ${ex.id} problem ${pr.n}: program "${(p.name || '').slice(0, 40)}": ${f}`);
    }
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
        /* one PDF page = one slide. The printed slide number is read from the footer; a page whose footer has no number
           (the footer is sometimes empty) is numbered from its neighbours. */
        const pages = txt.split('\f'); if (pages.length && !pages[pages.length - 1].trim()) pages.pop();
        const re = new RegExp(sl.footer);
        let nums = pages.map((t) => { const m = re.exec(t); return m ? Number(m[1]) : null; });
        /* a footer number far from where its neighbours put it is a misread (a number split across lines): treat as unknown */
        let lastNum = null, lastIdx = -1;
        nums = nums.map((v, i) => {
          if (v === null) return null;
          if (lastNum === null || Math.abs(v - (lastNum + (i - lastIdx))) <= 3) { lastNum = v; lastIdx = i; return v; }
          return null;
        });
        const map = {};
        pages.forEach((t, i) => {
          let num = nums[i];
          if (num === null) {
            let j = i - 1; while (j >= 0 && nums[j] === null) j--;
            if (j >= 0) num = nums[j] + (i - j);
            else { j = i + 1; while (j < nums.length && nums[j] === null) j++; if (j < nums.length) num = nums[j] - (j - i); }
          }
          if (num !== null) map[num] = (map[num] || '') + squash(t);
        });
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

  /* handout quotes: {type: handout, ref: "<id> <section>", quote} is looked up in the .docx text */
  const handoutText = {};
  const hdir = data.course.handouts || {};
  let hChecked = 0, hOk = 0;
  for (const c of Object.values(data.concepts)) for (const x of c.sources || []) {
    if (x.type !== 'handout' || !x.quote) continue;
    const id = String(x.ref).split(' ')[0], file = hdir[id];
    if (!file) { warnings.push(`${c.id}: handout "${id}" is not listed under handouts: in course.yaml`); continue; }
    const full = path.resolve(root, file);
    if (!fs.existsSync(full)) { warnings.push(`${c.id}: handout file for "${id}" not found, quote not checked`); continue; }
    if (!(id in handoutText)) {
      const xml = execFileSync('unzip', ['-p', full, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 64e6 });
      handoutText[id] = squash(xml.replace(/<w:tab\/>|<\/w:p>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
    }
    hChecked++;
    if (handoutText[id].includes(squash(x.quote))) hOk++; else errors.push(`${c.id}: quote not found in handout ${id}: "${x.quote}"`);
  }
  if (hChecked) lines_h = `Handout quotes: ${hOk} of ${hChecked} found`;

  const concepts = Object.values(data.concepts);
  const unverified = warnings.filter((w) => w.includes(': unverified'));
  lines.push(`Exam problems: ${Object.values(data.exams || {}).reduce((n, e) => n + e.problems.length, 0)}`);
  lines.push(`Concepts: ${concepts.length}   Checks: ${concepts.reduce((n, c) => n + (c.checks || []).length, 0)}   Generated check slots: ${concepts.reduce((n, c) => n + (c.checks || []).filter((k) => k.gen).length, 0)}`);
  lines.push(`Slide quotes: ${quoteReport}`);
  if (lines_h) lines.push(lines_h);
  lines.push(`Executable claims run on the cores: ${encChecked} encodings, ${progChecked} programs`);
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
