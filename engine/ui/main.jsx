/* Views and routing. Hash routes:
   #/  #/unit/<id>  #/learn/<concept>  #/test/<unit>  #/testout/<unit>  #/diagnostic  #/review  #/progress */
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { LEVELS, FAMILIAR, finishLearn, mixedResult, testOutResult, isDue, unitProgress } from '../lib/mastery.js';
import * as store from './store.js';
import { Runner, CheckLoop } from './quiz.jsx';
import { Feedback } from './quiz.jsx';
import { answerText } from '../lib/check.js';
import { fmt } from './format.js';

const COURSE = window.COURSE;
const C = COURSE.concepts;
store.init(COURSE.id);

const trackTitle = (id) => COURSE.tracks.find((t) => t.id === id)?.title || id;
const myTrack = () => store.get().prefs.track || COURSE.tracks[0].id;
const unitById = (id) => COURSE.units.find((u) => u.id === id);
/* a unit's concepts for one track: the shared ones first, then that track's own */
const pathOf = (unit, track) => [...(unit.concepts.shared || []), ...(unit.concepts[track] || [])];
const rec = (id) => store.record(id);
const dueIds = () => COURSE.units.flatMap((u) => pathOf(u, myTrack())).filter((id) => isDue(rec(id)));

const useHash = () => {
  const [h, setH] = useState(location.hash || '#/');
  useEffect(() => { const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h;
};
const Link = ({ to, ...p }) => <a href={'#' + to} {...p} />;
const Level = ({ id }) => { const l = rec(id).level; return <span class={'level l' + l}>{LEVELS[l]}{rec(id).testedOut && l >= 3 ? ' (tested out)' : ''}</span>; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const Html = ({ html, ...p }) => <div dangerouslySetInnerHTML={{ __html: html }} {...p} />;

/* ---------- header and footer ---------- */
function Header() {
  store.useStore();
  const t = myTrack();
  return (
    <header class="top">
      <Link to="/" class="brand">{COURSE.title}</Link>
      <nav aria-label="Sections">
        <Link to="/" class="on">Learn</Link>
        <span class="soon" title="Not rebuilt yet">Games</span>
        <span class="soon" title="Not rebuilt yet">Simulators</span>
        <span class="soon" title="Not rebuilt yet">Exam prep</span>
        <Link to="/progress">Progress</Link>
      </nav>
      <div class="tracks" role="group" aria-label="Processor track">
        {COURSE.tracks.map((x) => <button class={'chip' + (x.id === t ? ' on' : '')} onClick={() => store.setTrack(x.id)} aria-pressed={x.id === t}>{x.title}</button>)}
      </div>
    </header>
  );
}
const Footer = () => <footer class="foot">{COURSE.note} <a href="archive/">Previous version</a></footer>;

/* ---------- home ---------- */
function Home() {
  store.useStore();
  const t = myTrack(), due = dueIds().length;
  return (
    <main>
      <h1>{COURSE.title}</h1>
      <p class="lede">{COURSE.subtitle}. Short lessons, a check after each idea, and everything comes back later until it sticks.</p>
      <div class="cta">
        <Link to="/diagnostic" class="btn primary">Start with a diagnostic</Link>
        {due > 0 && <Link to="/review" class="btn">Review {due} due</Link>}
      </div>
      <p class="meta">Following the <b>{trackTitle(t)}</b> track. {COURSE.tracks.find((x) => x.id === t).blurb}</p>
      <h2>Units</h2>
      <ul class="rows">
        {COURSE.units.map((u) => { const p = unitProgress(pathOf(u, t).map(rec)); return (
          <li><Link to={'/unit/' + u.id}>
            <span><b>{u.title}</b> <span class="meta">{u.lesson}</span><br /><span class="meta">{u.blurb}</span></span>
            <span class="meta">{Math.round(p.proficient * 100)}% proficient</span>
          </Link></li>); })}
      </ul>
    </main>
  );
}

/* ---------- unit ---------- */
function Unit({ id }) {
  store.useStore();
  const u = unitById(id), t = myTrack(), ids = pathOf(u, t);
  const allFamiliar = ids.every((c) => rec(c).level >= FAMILIAR);
  return (
    <main>
      <p class="crumb"><Link to="/">Course</Link> / {u.lesson}</p>
      <h1>{u.title}</h1>
      <p class="lede">{u.blurb}</p>
      <div class="cta">
        <Link to={'/testout/' + id} class="btn">Test out of this unit</Link>
        <Link to={'/test/' + id} class={'btn' + (allFamiliar ? ' primary' : '')}>Chapter test</Link>
      </div>
      <p class="meta">Track: {trackTitle(t)}. Do the concepts in order; each one ends with checks. The chapter test mixes all of them.</p>
      <ol class="path">
        {ids.map((cid, i) => { const c = C[cid]; const blocked = c.needs.filter((n) => rec(n).level < FAMILIAR); return (
          <li>
            <Link to={'/learn/' + cid}>
              <span class="n">{i + 1}</span>
              <span class="grow"><b>{c.title}</b>{c.track !== 'shared' && <span class="tag">{trackTitle(c.track)}</span>}<br /><span class="meta">{c.summary}</span>
                {blocked.length > 0 && <span class="meta warn"> Builds on: {blocked.map((n) => C[n].title).join(', ')}.</span>}</span>
              <Level id={cid} />
            </Link>
          </li>); })}
      </ol>
    </main>
  );
}

/* ---------- the learn flow: Learn -> Worked example -> Try it -> Checks ---------- */
function Learn({ id }) {
  const c = C[id], u = unitById(c.unit), ids = pathOf(u, myTrack());
  const [step, setStep] = useState(0);                      /* 0 learn, 1 worked, 2 try, 3 checks, 4 done */
  const [reveal, setReveal] = useState(false);
  const [result, setResult] = useState(null);
  const idx = ids.indexOf(id), nextId = ids[idx + 1];
  const steps = ['Learn', 'Worked example', 'Try it', 'Checks'];
  const finish = ({ firstTry, total }) => {
    const before = rec(id);
    const after = finishLearn(before, firstTry, total);
    store.setRecords({ [id]: after });
    setResult({ firstTry, total, level: after.level }); setStep(4);
  };
  const bridge = c.bridge;
  return (
    <main class="learn">
      <p class="crumb"><Link to="/">Course</Link> / <Link to={'/unit/' + u.id}>{u.title}</Link> / {c.title}</p>
      <ol class="steps" aria-label="Progress">{steps.map((s, i) => <li class={i === step ? 'cur' : i < step ? 'done' : ''}>{s}</li>)}</ol>
      <h1>{c.title}</h1>
      {step === 0 && <>
        {bridge && <aside class="bridge"><b>Callback to the {trackTitle(C[bridge.to].track)} lesson: <Link to={'/learn/' + bridge.to}>{C[bridge.to].title}</Link></b>
          <dl><dt>Same</dt><dd>{bridge.same}</dd><dt>Different</dt><dd>{bridge.different}</dd><dt>Why</dt><dd>{bridge.why}</dd></dl></aside>}
        <Html class="prose" html={c.html.learn} />
        <Sources c={c} />
        <button class="btn primary" onClick={() => setStep(1)}>See a worked example</button>
      </>}
      {step === 1 && <>
        <h2>Worked example</h2>
        <Html class="prose" html={c.html.worked} />
        <button class="btn primary" onClick={() => setStep(2)}>Try one yourself</button>
      </>}
      {step === 2 && <>
        <h2>Try it</h2>
        <Html class="prose" html={c.html.tryProblem} />
        {!reveal ? <button class="btn" onClick={() => setReveal(true)}>Show the solution</button> : <Html class="prose solution" html={c.html.trySolution} />}
        <div><button class="btn primary" onClick={() => setStep(3)}>Check my understanding</button></div>
      </>}
      {step === 3 && <>
        <h2>Checks</h2>
        <p class="meta">Answer each one. A miss comes back later with new numbers.</p>
        <CheckLoop defs={c.checks} onDone={finish} />
      </>}
      {step === 4 && result && <>
        <div class={'feedback ' + (result.firstTry === result.total ? 'ok' : 'bad')}>
          <b>{result.firstTry} of {result.total} right on the first try. Level: {LEVELS[result.level]}.</b>
          <p>{result.firstTry === result.total ? 'Proficient. This concept will come back in review so it sticks.' : 'You finished every check, but this stays at ' + LEVELS[result.level] + ' until you get a full set on the first try or answer it correctly in a later mixed test.'}</p>
        </div>
        <div class="cta">
          {nextId ? <Link to={'/learn/' + nextId} class="btn primary">Next: {C[nextId].title}</Link> : <Link to={'/test/' + u.id} class="btn primary">Take the chapter test</Link>}
          <Link to={'/unit/' + u.id} class="btn">Back to the unit</Link>
          <button class="btn" onClick={() => { setStep(0); setResult(null); setReveal(false); }}>Review this lesson</button>
        </div>
      </>}
    </main>
  );
}

function Sources({ c }) {
  const label = { slide: 'Lecture slide', handout: 'Handout', manual: 'Manual', datasheet: 'Datasheet', oracle: 'Tested against', own: 'Our own analysis', carried: 'Carried from the previous site (not re-checked)' };
  return (
    <details class="sources"><summary>Sources ({c.sources.length})</summary>
      <ul>{c.sources.map((s) => <li><b>{label[s.type]}:</b> {s.ref}{s.note ? ` (${s.note})` : ''}</li>)}</ul>
    </details>
  );
}

/* ---------- tests ---------- */
/* one question per concept from a list of concept ids; extra = additional distinct questions per concept */
function sample(ids, per = 1) {
  const items = [];
  for (const cid of ids) {
    const defs = [...C[cid].checks].sort(() => Math.random() - .5);
    for (let k = 0; k < per; k++) items.push({ conceptId: cid, def: defs[k % defs.length] });
  }
  return items.sort(() => Math.random() - .5);
}

function Results({ results, mode, back }) {
  const byConcept = {};
  for (const r of results) (byConcept[r.conceptId] ||= []).push(r);
  return (
    <>
      <h2>Results</h2>
      <ul class="rows">
        {Object.entries(byConcept).map(([cid, rs]) => { const ok = rs.every((r) => r.ok); return (
          <li><span><b>{C[cid].title}</b> <span class="meta">{rs.filter((r) => r.ok).length} of {rs.length} right</span></span><Level id={cid} /></li>); })}
      </ul>
      {results.some((r) => !r.ok) && <><h3>What to fix</h3>
        {results.filter((r) => !r.ok).map((r) => <div class="missed"><p class="meta">{C[r.conceptId].title}</p><p dangerouslySetInnerHTML={{ __html: fmt(r.q.prompt) }} /><Feedback q={r.q} ok={false} /></div>)}</>}
      <div class="cta">{back}</div>
    </>
  );
}

function Test({ unitId, mode }) {                            /* mode: mixed | testout | diagnostic | review */
  const t = myTrack();
  let ids, title, intro, per = 1;
  if (mode === 'diagnostic') { ids = COURSE.units.flatMap((u) => pathOf(u, t)); title = 'Course diagnostic'; intro = 'One question per concept. Get one right and that concept is credited as Proficient (tested out); it still comes back in review. Skip anything you do not know: a wrong answer changes nothing.'; }
  else if (mode === 'review') { ids = dueIds().slice(0, 10); title = 'Review'; intro = 'Concepts that are due. A miss moves a concept down a level so it returns sooner.'; }
  else if (mode === 'testout') { ids = pathOf(unitById(unitId), t); title = `Test out: ${unitById(unitId).title}`; intro = 'One question per concept. Each one you get right is credited as Proficient. A wrong answer changes nothing, so you can still take the lessons.'; }
  else { ids = pathOf(unitById(unitId), t); per = 2; title = `Chapter test: ${unitById(unitId).title}`; intro = 'Two questions per concept, mixed together. A concept is right only if both are right. Right moves Proficient concepts to Mastered; wrong moves a concept down.'; }
  const [items] = useState(() => sample(ids, per));
  const [results, setResults] = useState(null);
  const [started, setStarted] = useState(false);
  const finish = (r) => {
    const byConcept = {};
    for (const x of r) byConcept[x.conceptId] = (byConcept[x.conceptId] ?? true) && x.ok;
    const upd = {};
    for (const [cid, ok] of Object.entries(byConcept)) upd[cid] = mode === 'mixed' || mode === 'review' ? mixedResult(rec(cid), ok) : testOutResult(rec(cid), ok);
    store.setRecords(upd); setResults(r);
  };
  const back = unitId ? <Link to={'/unit/' + unitId} class="btn primary">Back to the unit</Link> : <Link to="/" class="btn primary">Back to the course</Link>;
  if (!ids.length) return <main><h1>{title}</h1><p>{mode === 'review' ? 'Nothing is due. Come back after you have learned a concept and some time has passed.' : 'No concepts here yet.'}</p>{back}</main>;
  return (
    <main>
      <h1>{title}</h1>
      {!started && !results && <><p class="lede">{intro}</p><p class="meta">{items.length} questions.</p><button class="btn primary" onClick={() => setStarted(true)}>Start</button></>}
      {started && !results && <Runner items={items} onFinish={finish} />}
      {results && <Results results={results} mode={mode} back={back} />}
    </main>
  );
}

/* ---------- progress ---------- */
function Progress() {
  store.useStore();
  const [msg, setMsg] = useState('');
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([store.exportJSON()], { type: 'application/json' }));
    a.download = `${COURSE.id}-progress.json`; a.click(); URL.revokeObjectURL(a.href);
  };
  const upload = (e) => {
    const f = e.currentTarget.files[0]; if (!f) return;
    f.text().then((t) => { try { store.importJSON(t); setMsg('Progress loaded.'); } catch (err) { setMsg(err.message); } });
  };
  return (
    <main>
      <h1>Progress</h1>
      <p class="lede">Saved in this browser only. Export it to move it to another device or keep a copy.</p>
      {COURSE.units.map((u) => <section><h2>{u.title}</h2>
        <ul class="rows">{[...new Set([...(u.concepts.shared || []), ...COURSE.tracks.flatMap((t) => u.concepts[t.id] || [])])].map((cid) => (
          <li><Link to={'/learn/' + cid}><span><b>{C[cid].title}</b>{C[cid].track !== 'shared' && <span class="tag">{trackTitle(C[cid].track)}</span>}</span><Level id={cid} /></Link></li>))}</ul></section>)}
      <h2>Backup</h2>
      <div class="cta">
        <button class="btn" onClick={download}>Export progress</button>
        <label class="btn">Import progress<input type="file" accept="application/json" hidden onChange={upload} /></label>
        <button class="btn" onClick={() => { if (confirm('Erase all progress in this browser?')) store.reset(); }}>Reset</button>
      </div>
      {msg && <p class="meta" role="status">{msg}</p>}
    </main>
  );
}

/* ---------- router ---------- */
function App() {
  const hash = useHash();
  const [, a, b] = hash.split('/');                         /* '#', 'learn', 'id' */
  let view;
  if (a === 'unit' && unitById(b)) view = <Unit key={b} id={b} />;
  else if (a === 'learn' && C[b]) view = <Learn key={b} id={b} />;
  else if (a === 'test' && unitById(b)) view = <Test key={'t' + b} unitId={b} mode="mixed" />;
  else if (a === 'testout' && unitById(b)) view = <Test key={'o' + b} unitId={b} mode="testout" />;
  else if (a === 'diagnostic') view = <Test key="d" mode="diagnostic" />;
  else if (a === 'review') view = <Test key="r" mode="review" />;
  else if (a === 'progress') view = <Progress />;
  else view = <Home />;
  return <><Header />{view}<Footer /></>;
}

render(<App />, document.getElementById('app'));
