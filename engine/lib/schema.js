/* Structural validation of a loaded course. Returns {errors, warnings}: errors fail the build, warnings are listed by the audit. */

const CHECK_TYPES = ['choice', 'numeric', 'fill'];
const SOURCE_TYPES = ['slide', 'handout', 'manual', 'datasheet', 'oracle', 'own', 'carried'];
/* "verified" kinds: someone looked at the thing itself. 'own' is our own reasoning; 'carried' came from the previous site. */
export const EVIDENCE = new Set(['slide', 'handout', 'manual', 'datasheet', 'oracle']);

export const conceptIds = (course, unit) => Object.values(unit.concepts).flat().map((n) => `${unit.id}.${n}`);

const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i || 1); };

export function validate({ course, concepts, problems }, generators = {}) {
  const errors = [...problems], warnings = [];
  const E = (id, msg) => errors.push(`${id}: ${msg}`);
  const W = (id, msg) => warnings.push(`${id}: ${msg}`);

  const trackIds = new Set((course.tracks || []).map((t) => t.id).concat('shared'));
  const listed = new Map();
  for (const unit of course.units || []) {
    for (const [track, names] of Object.entries(unit.concepts || {})) {
      if (!trackIds.has(track)) E(unit.id, `unit lists concepts for unknown track "${track}"`);
      for (const n of names) {
        const id = `${unit.id}.${n}`;
        if (listed.has(id)) E(id, 'listed twice in course.yaml');
        listed.set(id, track);
        if (!concepts[id]) E(id, `listed in course.yaml but no file units/${unit.id}/${n}.md`);
      }
    }
  }

  const titles = new Map();
  for (const c of Object.values(concepts)) {
    const id = c.id;
    if (!listed.has(id)) E(id, 'file exists but is not listed in course.yaml');
    else if (c.track !== listed.get(id)) E(id, `front matter track "${c.track}" does not match course.yaml ("${listed.get(id)}")`);
    if (!c.title) E(id, 'missing title');
    if (!c.summary) E(id, 'missing summary');
    if (titles.has(c.title?.toLowerCase())) E(id, `same title as ${titles.get(c.title.toLowerCase())}`);
    else if (c.title) titles.set(c.title.toLowerCase(), id);

    for (const n of c.needs || []) {
      const full = n.includes('.') ? n : `${c.unit}.${n}`;
      if (!concepts[full]) E(id, `needs unknown concept "${n}"`);
    }
    if (!c.md.learn) E(id, 'missing "## Learn" section');
    if (!c.md.worked) E(id, 'missing "## Worked example" section');
    if (!c.md.tryProblem || !c.md.trySolution) E(id, 'missing "## Try it" with a problem and a solution separated by a line "???"');

    const sources = c.sources || [];
    if (!sources.length) E(id, 'no sources');
    for (const s of sources) {
      if (!SOURCE_TYPES.includes(s.type)) E(id, `source type "${s.type}" is not one of ${SOURCE_TYPES.join(', ')}`);
      if (!s.ref) E(id, 'a source has no ref');
      if (s.type === 'slide' && !/^L\d+ s\d+$/.test(s.ref || '')) E(id, `slide ref "${s.ref}" should look like "L7 s294"`);
    }
    if (sources.length && !sources.some((s) => EVIDENCE.has(s.type))) W(id, `unverified: sources are only ${[...new Set(sources.map((s) => s.type))].join('/')}`);

    const checks = c.checks || [];
    if (checks.length < 2) E(id, 'needs at least 2 checks');
    checks.forEach((chk, i) => {
      const where = `check ${i + 1}`;
      if (chk.gen) { if (!generators[chk.gen]) E(id, `${where}: unknown generator "${chk.gen}"`); return; }
      if (!CHECK_TYPES.includes(chk.type)) return E(id, `${where}: type must be one of ${CHECK_TYPES.join(', ')}`);
      if (!chk.prompt) E(id, `${where}: no prompt`);
      if (chk.answer === undefined) E(id, `${where}: no answer`);
      if (!chk.explain) E(id, `${where}: no explain (shown after a miss)`);
      if (chk.type === 'choice') {
        if (!Array.isArray(chk.options) || chk.options.length < 2) E(id, `${where}: choice needs options`);
        else if (!Number.isInteger(chk.answer) || chk.answer < 0 || chk.answer >= chk.options.length) E(id, `${where}: answer must be the index of an option`);
        else if (new Set(chk.options.map(String)).size !== chk.options.length) E(id, `${where}: duplicate options`);
      }
    });

    if (!c.card?.front || !c.card?.back) W(id, 'no flashcard');
    const follows = (course.tracks || []).find((t) => t.id === c.track)?.follows;
    if (follows && !c.bridge) E(id, `track "${c.track}" follows "${follows}", so this concept needs a bridge (or "bridge: none" with a reason in bridgeNote)`);
    if (c.bridge && c.bridge !== 'none') {
      for (const f of ['to', 'same', 'different', 'why']) if (!c.bridge[f]) E(id, `bridge is missing "${f}"`);
      if (c.bridge.to && !concepts[c.bridge.to]) E(id, `bridge.to "${c.bridge.to}" is not a concept`);
    }
  }

  /* near-duplicate prompts and cards across concepts */
  const items = [];
  for (const c of Object.values(concepts)) {
    if (c.card?.front) items.push({ id: c.id, kind: 'card', text: c.card.front, w: words(c.card.front) });
    for (const chk of c.checks || []) if (chk.prompt) items.push({ id: c.id, kind: 'check', text: chk.prompt, w: words(chk.prompt) });
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.id !== b.id && a.w.length > 4 && jaccard(a.w, b.w) >= 0.8) W(a.id, `near-duplicate ${a.kind} of ${b.id}: "${a.text.slice(0, 60)}"`);
  }
  return { errors, warnings };
}
