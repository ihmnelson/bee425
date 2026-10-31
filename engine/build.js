/* node engine/build.js : validate content, bundle the UI, write dist/ (static files for GitHub Pages).
   Fails (exit 1) on any validation error. The accuracy audit is separate: node engine/audit.js */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { loadCourse } from './lib/load.js';
import { validate } from './lib/schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const dist = path.join(root, 'dist');

const { generators } = await import(pathToFileURL(path.join(contentDir, 'generators', 'index.js')).href);
const data = loadCourse(contentDir);
const { errors, warnings } = validate(data, generators);
if (errors.length) { console.error('Content errors:\n' + errors.map((e) => '  ' + e).join('\n')); process.exit(1); }

/* what the browser needs: no raw Markdown, needs expanded to full ids */
const concepts = {};
for (const c of Object.values(data.concepts)) {
  concepts[c.id] = {
    id: c.id, unit: c.unit, track: c.track, title: c.title, summary: c.summary,
    needs: (c.needs || []).map((n) => (n.includes('.') ? n : `${c.unit}.${n}`)),
    sources: c.sources || [], checks: c.checks || [], card: c.card || null, glossary: c.glossary || [],
    bridge: c.bridge && c.bridge !== 'none' ? c.bridge : null, html: c.html,
    programs: (c.programs || []).map((p) => ({ cpu: p.cpu, name: p.name, source: p.source })),
  };
}
const { course } = data;
/* One lesson order per unit: shared concepts first, then each processor-specific concept of the first track with the
   concepts of the following track that call back to it placed right after it, then any left over. */
const firstTrack = course.tracks[0].id;
const pathFor = (u) => {
  const full = (t) => (u.concepts[t] || []).map((n) => `${u.id}.${n}`);
  const path = [...full('shared')], placed = new Set(path);
  const add = (id) => { if (!placed.has(id)) { placed.add(id); path.push(id); } };
  for (const id of full(firstTrack)) {
    add(id);
    for (const t of course.tracks.filter((x) => x.id !== firstTrack)) for (const z of full(t.id)) if (concepts[z]?.bridge?.to === id) add(z);
  }
  for (const t of course.tracks) full(t.id).forEach(add);
  return path;
};
const units = course.units.map((u) => ({
  id: u.id, title: u.title, lesson: u.lesson, blurb: u.blurb, path: pathFor(u),
  concepts: Object.fromEntries(Object.entries(u.concepts).map(([t, names]) => [t, names.map((n) => `${u.id}.${n}`)])),
}));
const exams = Object.values(data.exams).map((e) => ({ id: e.id, title: e.title, source: e.source, problems: e.problems.map((p) => ({ n: p.n, title: p.title, concepts: p.concepts || [], parts: p.parts || [], html: p.html })) }));
const gens = {};
for (const c of Object.values(concepts)) for (const k of c.checks) if (k.gen) (gens[k.gen] ||= []).push(c.id);
const payload = { gens, exams, id: course.id, title: course.title, subtitle: course.subtitle, note: course.note || '', tracks: course.tracks, units, concepts };

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'course.js'), 'window.COURSE=' + JSON.stringify(payload) + ';');

await esbuild.build({
  entryPoints: [path.join(root, 'engine/ui/main.jsx')],
  bundle: true, minify: true, format: 'iife', target: 'es2020', outfile: path.join(dist, 'app.js'),
  jsx: 'automatic', jsxImportSource: 'preact', alias: { '@course/generators': path.join(contentDir, 'generators/index.js'), '@course/problems/mock': path.join(contentDir, 'problems/mock.js'), '@course/problems/grade': path.join(contentDir, 'problems/grade.js'), '@course/problems': path.join(contentDir, 'problems/index.js') },
  logLevel: 'warning',
});
fs.copyFileSync(path.join(root, 'engine/ui/style.css'), path.join(dist, 'style.css'));
fs.cpSync(path.join(root, 'engine/assets/fonts'), path.join(dist, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${course.title}</title>
<link rel="stylesheet" href="fonts/fonts.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div id="app"></div>
<noscript>This site needs JavaScript.</noscript>
<script src="course.js"></script>
<script src="app.js"></script>
</body>
</html>
`);
console.log(`Built ${Object.keys(concepts).length} concepts into dist/` + (warnings.length ? ` (${warnings.length} warnings, run npm run audit)` : ''));
