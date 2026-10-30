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
  };
}
const { course } = data;
const units = course.units.map((u) => ({
  id: u.id, title: u.title, lesson: u.lesson, blurb: u.blurb,
  concepts: Object.fromEntries(Object.entries(u.concepts).map(([t, names]) => [t, names.map((n) => `${u.id}.${n}`)])),
}));
const payload = { id: course.id, title: course.title, subtitle: course.subtitle, note: course.note || '', tracks: course.tracks, units, concepts };

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'course.js'), 'window.COURSE=' + JSON.stringify(payload) + ';');

await esbuild.build({
  entryPoints: [path.join(root, 'engine/ui/main.jsx')],
  bundle: true, minify: true, format: 'iife', target: 'es2020', outfile: path.join(dist, 'app.js'),
  jsx: 'automatic', jsxImportSource: 'preact', alias: { '@course/generators': path.join(contentDir, 'generators/index.js') },
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
