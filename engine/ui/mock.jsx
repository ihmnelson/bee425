/* Mock exams and per-family practice. Every problem comes from content/problems (checked by the audit against an independent
   solver). Auto-graded parts take an answer box; programs run on the in-site 68000 core; free-response parts reveal a model
   answer and a rubric to self-grade. */
import { useState } from 'preact/hooks';
import { families } from '@course/problems';
import { makeMock, MOCK_ORDER } from '@course/problems/mock';
import { gradeProgram } from '@course/problems/grade';
import { rng } from '../lib/rng.js';
import { gradePart } from '../lib/gradepart.js';
import { mixedResult } from '../lib/mastery.js';
import * as store from './store.js';
import { fmt } from './format.js';
import { newSeed } from './quiz.jsx';

const Html = ({ s, tag: T = 'span' }) => <T dangerouslySetInnerHTML={{ __html: fmt(s) }} />;
/* prompts may hold ``` code blocks and blank lines */
const Rich = ({ s }) => String(s).split(/```\n?/).map((chunk, i) => (i % 2 ? <pre class="code">{chunk}</pre> : chunk.split(/\n\n+/).filter(Boolean).map((para) => <p><Html s={para} /></p>)));

const HINT = { numeric: 'Number (decimal, or hex such as $1F)', numlist: 'Numbers, e.g. 0, 17, 18, 23', hex: 'Hex words, e.g. $36FC $3400', hexlist: 'Hex addresses, e.g. $000000-$03FFFF, ...' };

function Sentence({ text }) {
  const [mine, setMine] = useState(''), [open, setOpen] = useState(false);
  return (
    <div class="sentence">
      <label class="meta">In a sentence, what does this pair do?</label>
      <textarea class="answer" rows="2" autocapitalize="sentences" value={mine} onInput={(e) => setMine(e.currentTarget.value)} aria-label="Your sentence" />
      {open ? <p class="solution"><b>Model sentence:</b> <Html s={text} /></p> : <button class="btn" onClick={() => setOpen(true)}>Show model sentence</button>}
    </div>
  );
}

function Part({ part, problem, state, setState }) {
  const [resp, setResp] = useState(state.resp ?? '');
  const [shown, setShown] = useState(false);
  const [ticks, setTicks] = useState({});
  const [run, setRun] = useState(null);
  const save = (patch) => setState({ ...state, ...patch });
  const done = state.verdict !== undefined;
  if (part.kind === 'free') {
    const got = (part.rubric || []).filter((_, i) => ticks[i]).length;
    return (
      <div class="part">
        <p><b>{part.label}.</b> <Html s={part.prompt} /></p>
        <textarea class="answer" rows="4" autocapitalize="sentences" value={resp} onInput={(e) => setResp(e.currentTarget.value)} placeholder="Write your answer, then compare with the model answer" aria-label="Your answer" />
        {!shown ? <div><button class="btn" onClick={() => setShown(true)}>Show model answer</button></div> : (
          <div class="solution"><p><Html s={part.answer} /></p>
            <p class="meta">Tick what your answer covered:</p>
            {(part.rubric || []).map((r, i) => <label class="opt"><input type="checkbox" checked={!!ticks[i]} onChange={(e) => { const t = { ...ticks, [i]: e.currentTarget.checked }; setTicks(t); save({ verdict: Object.values(t).filter(Boolean).length >= Math.ceil(part.rubric.length * 0.67) }); }} /> <Html s={r} /></label>)}
            <p class="meta">{got} of {part.rubric.length} points</p></div>)}
      </div>
    );
  }
  if (part.kind === 'code') {
    const go = () => { const g = gradeProgram({ ...problem, tests: part.tests, forbid: part.forbid, outSize: part.outSize }, resp); setRun(g); save({ resp, verdict: !g.error && g.passed === g.total }); };
    return (
      <div class="part">
        <Rich s={part.prompt} />
        <textarea class="answer code" rows="14" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck={false} value={resp} onInput={(e) => setResp(e.currentTarget.value)} placeholder={part.cpu === 'z80' ? '        ORG     0100H\nSTART:  ...\n        HALT\n        END' : '        ORG     $1000\nSTART   ...\n        SIMHALT\n        END     START'} aria-label="Your program" />
        <div class="cta"><button class="btn primary" onClick={go} disabled={!resp.trim()}>Run tests</button>
          <button class="btn" onClick={() => setShown(!shown)}>{shown ? 'Hide' : 'Show'} reference solution</button></div>
        {run && (run.error ? <div class="feedback bad" role="status"><b>{run.error}</b></div> : (
          <div class={'feedback ' + (run.passed === run.total ? 'ok' : 'bad')} role="status"><b>{run.passed} of {run.total} tests passed.</b>
            <ul>{run.results.map((r) => <li>{r.pass ? 'Pass' : 'Fail'}: {r.name}{r.pass ? '' : ` (${r.detail})`}</li>)}</ul></div>))}
        {shown && <div class="solution"><pre class="code">{part.answer}</pre><p><Html s={part.explain} /></p></div>}
      </div>
    );
  }
  const check = (v) => { const ok = gradePart(part, v); save({ resp: v, verdict: ok }); };
  return (
    <div class="part">
      <p><b>{part.label}.</b> <Html s={part.prompt} /></p>
      {part.kind === 'choice' ? (
        <div class="options" role="radiogroup">{part.options.map((o) => <label class={'opt' + (done && o === part.answer ? ' right' : '') + (done && o === state.resp && !state.verdict ? ' wrong' : '')}><input type="radio" disabled={done} checked={state.resp === o} onChange={() => check(o)} /> <Html s={o} /></label>)}</div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (resp.trim() && !done) check(resp); }}>
          <input class="answer" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck={false} disabled={done} value={resp} onInput={(e) => setResp(e.currentTarget.value)} placeholder={HINT[part.kind]} aria-label="Your answer" />
          {!done && <button class="btn primary" type="submit" disabled={!resp.trim()}>Check</button>}
        </form>)}
      {done && <div class={'feedback ' + (state.verdict ? 'ok' : 'bad')} role="status"><b>{state.verdict ? 'Correct.' : `Not quite. The answer is ${part.display ?? part.answer}.`}</b><p><Html s={part.explain} /></p></div>}
      {done && part.sentence && <Sentence text={part.sentence} />}
    </div>
  );
}

function ProblemCard({ p, title, parts, setParts }) {
  return (
    <section class="problem">
      <h2>{title}</h2>
      <Rich s={p.prompt} />
      <details class="conv"><summary>Conventions used</summary><p><Html s={p.conventions} /></p></details>
      {p.parts.map((x) => <Part key={x.label} part={x} problem={p} state={parts[x.label] || {}} setState={(s) => setParts({ ...parts, [x.label]: s })} />)}
      {p.solution && <details><summary>Model solution</summary><Rich s={p.solution} /></details>}
    </section>
  );
}

/* when every part of a problem has a verdict, update the problem's concepts once (missing any part counts as a miss) */
function creditOnce(examId, q, parts, rec) {
  if (store.examStatus(examId, q.n)) return;
  if (!q.parts.every((x) => parts[x.label]?.verdict !== undefined)) return;
  const ok = q.parts.every((x) => parts[x.label].verdict), upd = {};
  for (const cid of q.concepts || []) if (window.COURSE.concepts[cid]) upd[cid] = mixedResult(rec(cid), ok);
  store.setRecords(upd); store.setExam(examId, q.n, ok ? 'got' : 'missed');
}

const score = (p, parts) => { const done = p.parts.filter((x) => parts[x.label]?.verdict !== undefined); return { right: done.filter((x) => parts[x.label].verdict).length, total: p.parts.length }; };

/* ---- a full mock exam ---- */
export function Mock({ seed, Link, rec }) {
  const probs = makeMock(seed);
  const [all, setAll] = useState({});
  const [i, setI] = useState(0);
  const p = probs[i];
  const s = probs.map((q) => score(q, all[q.n] || {}));
  const right = s.reduce((t, x) => t + x.right, 0), total = s.reduce((t, x) => t + x.total, 0);
  store.useStore();
  const setProblem = (q, v) => { setAll({ ...all, [q.n]: v }); creditOnce('mock-' + seed, q, v, rec); };
  return (
    <main>
      <p class="crumb"><Link to="/exam">Exam prep</Link> / Mock exam</p>
      <h1>Mock exam #{seed}</h1>
      <p class="meta">Same format as the instructor's practice midterm, with fresh numbers. Link to this exact exam: <code>#/mock/{seed}</code>. {right} of {total} parts right so far. Each problem you finish updates your review list (once per exam).</p>
      <ol class="steps" aria-label="Problems">{probs.map((q, k) => <li class={k === i ? 'cur' : s[k].right === s[k].total ? 'done' : ''}><a href="#/mock/x" onClick={(e) => { e.preventDefault(); setI(k); }}>{q.n}</a></li>)}</ol>
      <ProblemCard key={p.n + '-' + seed} p={p} title={`Problem ${p.n}: ${p.title}`} parts={all[p.n] || {}} setParts={(v) => setProblem(p, v)} />
      <div class="cta">
        {i > 0 && <button class="btn" onClick={() => setI(i - 1)}>Previous</button>}
        {i < probs.length - 1 && <button class="btn primary" onClick={() => setI(i + 1)}>Next problem</button>}
        <a class="btn" href={'#/mock/' + newSeed()} onClick={() => setTimeout(() => location.reload(), 0)}>New mock exam</a>
      </div>
    </main>
  );
}

/* ---- practice by problem family ---- */
export function PracticeList({ Link }) {
  return (
    <main>
      <h1>Problem practice</h1>
      <p class="lede">Each family makes fresh problems on demand. Every answer is computed two independent ways before you see it (the site's audit requires zero disagreements).</p>
      <ul class="rows">{Object.values(families).map((f) => <li><Link to={'/practice/' + f.id + '/' + newSeed()}><span><b>{f.title}</b><br /><span class="meta">{f.conventions.slice(0, 110)}...</span></span></Link></li>)}</ul>
      <p><Link to={'/mock/' + newSeed()} class="btn primary">Generate a full mock exam</Link></p>
    </main>
  );
}
export function Practice({ id, seed, Link }) {
  const f = families[id], p = f.make(rng(Number(seed) || 1));
  const [parts, setParts] = useState({});
  const rec = (cid) => store.record(cid);
  store.useStore();
  return (
    <main>
      <p class="crumb"><Link to="/practice">Problem practice</Link> / {f.title}</p>
      <ProblemCard key={seed} p={p} title={p.title} parts={parts} setParts={(v) => { setParts(v); creditOnce('practice-' + id + '-' + seed, { ...p, n: 1 }, v, rec); }} />
      <div class="cta"><a class="btn primary" href={'#/practice/' + id + '/' + newSeed()}>New problem</a></div>
    </main>
  );
}
export { MOCK_ORDER };
