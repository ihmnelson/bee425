/* Question rendering and the three ways questions are run:
   Learn flow  - feedback after every answer; a miss re-queues a fresh variant, so the concept is not finished until it is answered right.
   Runner      - a test (chapter test, test-out, diagnostic, review): no feedback until the end, no retries. */
import { useState } from 'preact/hooks';
import { generators } from '@course/generators';
import { rng } from '../lib/rng.js';
import { isCorrect, answerText } from '../lib/check.js';
import { fmt } from './format.js';

export const newSeed = () => Math.floor(Math.random() * 1e9) + 1;

/* turn a check definition (fixed, or {gen}) into a concrete question; choices are shuffled by seed unless shuffle: false */
export function instantiate(def, seed = newSeed()) {
  let q = def.gen ? { ...generators[def.gen].make(rng(seed)) } : { ...def };
  if (q.type === 'choice' && q.shuffle !== false) {
    const order = rng(seed + 7).shuffle(q.options.map((_, i) => i));
    q = { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  }
  return { ...q, seed, def };
}

const Html = ({ s, tag: T = 'span' }) => <T dangerouslySetInnerHTML={{ __html: fmt(s) }} />;

/* One question with an answer box. onSubmit(response). `locked` disables input; `verdict` is null | true | false. */
export function Question({ q, onSubmit, locked = false, verdict = null, submitLabel = 'Check' }) {
  const [resp, setResp] = useState('');
  const submit = (e) => { e.preventDefault(); if (!locked && String(resp).trim() !== '') onSubmit(resp); };
  return (
    <form class="question" onSubmit={submit}>
      <p class="prompt"><Html s={q.prompt} /></p>
      {q.type === 'choice' ? (
        <div class="options" role="radiogroup">
          {q.options.map((o, i) => (
            <label class={'opt' + (locked && i === q.answer ? ' right' : '') + (locked && String(resp) === String(i) && verdict === false ? ' wrong' : '')}>
              <input type="radio" name="opt" value={i} disabled={locked} checked={String(resp) === String(i)} onChange={() => setResp(String(i))} />
              <Html s={o} />
            </label>
          ))}
        </div>
      ) : (
        <input class="answer" type="text" autocomplete="off" autocapitalize="off" spellcheck={false} disabled={locked}
          value={resp} onInput={(e) => setResp(e.currentTarget.value)} placeholder="Your answer" aria-label="Your answer" />
      )}
      {!locked && <button class="btn primary" type="submit" disabled={String(resp).trim() === ''}>{submitLabel}</button>}
    </form>
  );
}

export function Feedback({ q, ok }) {
  return (
    <div class={'feedback ' + (ok ? 'ok' : 'bad')} role="status">
      <b>{ok ? 'Correct.' : `Not quite. The answer is ${answerText(q)}.`}</b>
      <p><Html s={q.explain || ''} /></p>
    </div>
  );
}

/* Learn-flow checks. onDone({firstTry, total}) when every question has been answered correctly. */
export function CheckLoop({ defs, onDone }) {
  const [queue, setQueue] = useState(() => defs.map((d) => ({ q: instantiate(d), retry: false })));
  const [i, setI] = useState(0);
  const [first, setFirst] = useState(0);
  const [shown, setShown] = useState(null);                 /* {ok, resp} after an answer */
  const cur = queue[i];
  const answer = (resp) => {
    const ok = isCorrect(cur.q, resp);
    setShown({ ok });
    if (ok && !cur.retry) setFirst((n) => n + 1);
    if (!ok) setQueue((qq) => [...qq, { q: instantiate(cur.q.def), retry: true }]);   /* forced reinforcement: ask again with fresh numbers */
  };
  const next = () => {
    setShown(null);
    if (i + 1 >= queue.length) onDone({ firstTry: first, total: defs.length });
    else setI(i + 1);
  };
  return (
    <div>
      <p class="meta">Check {Math.min(i + 1, defs.length)} of {defs.length}{cur.retry ? ' (asked again with new numbers)' : ''}</p>
      <Question key={i} q={cur.q} onSubmit={answer} locked={!!shown} verdict={shown ? shown.ok : null} />
      {shown && <><Feedback q={cur.q} ok={shown.ok} /><button class="btn primary" onClick={next} autofocus>{i + 1 >= queue.length ? 'Finish' : 'Continue'}</button></>}
    </div>
  );
}

/* Test runner. items: [{conceptId, def}]. onFinish(results) once, results: [{conceptId, q, ok}] */
export function Runner({ items, onFinish }) {
  const [qs] = useState(() => items.map((it) => ({ conceptId: it.conceptId, q: instantiate(it.def) })));
  const [i, setI] = useState(0);
  const [results, setResults] = useState([]);
  const answer = (resp) => {
    const r = [...results, { conceptId: qs[i].conceptId, q: qs[i].q, ok: isCorrect(qs[i].q, resp) }];
    setResults(r);
    if (i + 1 >= qs.length) onFinish(r); else setI(i + 1);
  };
  return (
    <div>
      <p class="meta">Question {i + 1} of {qs.length}</p>
      <div class="bar"><span style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <Question key={i} q={qs[i].q} onSubmit={answer} submitLabel={i + 1 >= qs.length ? 'Submit' : 'Next'} />
    </div>
  );
}
