/* Audit of problem families: every auto-graded part is recomputed by the family's independent verify() and must match.
   Part kinds: numeric (answer is a number), hex (canonical hex string), choice (answer is the correct option's text; verify may
   also list notAnswers, which must cover every other option), text/free (self-graded, not compared). */
import { parseNumber } from './check.js';

const AUTO = new Set(['numeric', 'hex', 'numlist', 'hexlist', 'choice', 'tf', 'code']);
export const hexCanon = (s) => String(s).replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '').toUpperCase();

export function checkProblem(family, p) {
  const errs = [];
  for (const f of ['prompt', 'conventions', 'title']) if (!p[f]) errs.push(`no ${f}`);
  if (!p.parts?.length) errs.push('no parts');
  const want = family.verify ? family.verify(p) : {};
  for (const x of p.parts || []) {
    if (!x.prompt) errs.push(`part ${x.label}: no prompt`);
    if (!x.explain) errs.push(`part ${x.label}: no explanation`);
    if (!AUTO.has(x.kind)) continue;
    const w = want[x.label];
    if (w === undefined) { errs.push(`part ${x.label}: no independent answer from verify()`); continue; }
    const v = typeof w === 'object' && w !== null && 'answer' in w ? w.answer : w;
    let ok;
    if (x.kind === 'numeric') { const tol = x.tolerance || 0; ok = Math.abs(parseNumber(x.answer) - parseNumber(v)) <= tol * Math.max(1, Math.abs(parseNumber(v))) / 2 + 1e-9; }
    else if (x.kind === 'numlist' || x.kind === 'hexlist') ok = Array.isArray(v) && v.length === x.answer.length && v.every((n, i) => n === x.answer[i]);
    else if (x.kind === 'hex') ok = hexCanon(x.answer) === hexCanon(v);
    else if (x.kind === 'code') { ok = v === 'ok'; if (!ok) errs.push(`part ${x.label}: ${v}`); continue; }
    else ok = String(x.answer) === String(v);
    if (!ok) errs.push(`part ${x.label}: make() says ${x.display ?? x.answer}, independent check says ${v}  [${x.prompt.slice(0, 60)}]`);
    if (x.kind === 'choice' || x.kind === 'tf') {
      if (!x.options.includes(x.answer)) errs.push(`part ${x.label}: answer is not among the options`);
      const bad = w?.notAnswers;
      if (x.kind === 'choice' && !bad) errs.push(`part ${x.label}: distractors are not independently verified wrong`);
      else if (bad) for (const o of x.options) if (o !== x.answer && !bad.includes(o)) errs.push(`part ${x.label}: option "${o}" is not verified wrong`);
    }
  }
  return errs;
}
