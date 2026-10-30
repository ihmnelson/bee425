/* Reads content/ into plain objects. No validation here (see schema.js); this only parses.

   content/course.yaml                       course, tracks, units, which concepts belong to which unit and track
   content/units/<unit>/<name>.md            one concept: YAML front matter + Markdown body
   Concept id = "<unit>.<name>".
   Body sections: "## Learn", "## Worked example", "## Try it" (problem and solution separated by a line "???").
*/
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { marked } from 'marked';

const SECTIONS = { learn: 'Learn', worked: 'Worked example', tryIt: 'Try it' };

export function splitFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { meta: null, body: text };
  return { meta: yaml.load(m[1]) || {}, body: m[2] };
}

export function splitSections(body) {
  const out = {};
  const parts = body.split(/^## (.+)$/m);        /* [pre, title1, text1, title2, text2, ...] */
  for (let i = 1; i < parts.length; i += 2) out[parts[i].trim()] = parts[i + 1].trim();
  return out;
}

/* active-low signal names (~CS, ~OE) use a tilde, so turn off GFM strikethrough */
marked.use({ tokenizer: { del() { return undefined; } } });
const html = (md) => (md ? marked.parse(md, { gfm: true }) : '');

export function loadCourse(root) {
  const course = yaml.load(fs.readFileSync(path.join(root, 'course.yaml'), 'utf8'));
  const concepts = {};
  const problems = [];
  const unitsDir = path.join(root, 'units');
  for (const unit of fs.existsSync(unitsDir) ? fs.readdirSync(unitsDir) : []) {
    const dir = path.join(unitsDir, unit);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const id = `${unit}.${file.replace(/\.md$/, '')}`;
      let parsed;
      try { parsed = splitFrontMatter(fs.readFileSync(path.join(dir, file), 'utf8')); }
      catch (e) { problems.push(`${id}: front matter is not valid YAML (${e.message.split('\n')[0]})`); continue; }
      if (!parsed.meta) { problems.push(`${id}: no front matter`); continue; }
      const sec = splitSections(parsed.body);
      const [problem, solution] = (sec[SECTIONS.tryIt] || '').split(/^\?\?\?\s*$/m).map((s) => (s || '').trim());
      concepts[id] = {
        id, unit, file: `units/${unit}/${file}`, ...parsed.meta,
        md: { learn: sec[SECTIONS.learn] || '', worked: sec[SECTIONS.worked] || '', tryProblem: problem || '', trySolution: solution || '' },
        html: { learn: html(sec[SECTIONS.learn]), worked: html(sec[SECTIONS.worked]), tryProblem: html(problem), trySolution: html(solution) },
      };
    }
  }
  return { course, concepts, problems };
}
