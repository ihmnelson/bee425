/* Grades a learner's response to one problem part (kinds: numeric, numlist, hex, hexlist, choice). Returns true/false. */
import { parseNumber } from './check.js';
import { hexCanon } from './problemcheck.js';

const hexTokens = (s) => {
  const withDollar = [...String(s).matchAll(/(?:\$|0x)([0-9a-f]+)/gi)].map((m) => parseInt(m[1], 16));
  if (withDollar.length) return withDollar;
  return String(s).split(/[^0-9a-f]+/i).filter((t) => t.length >= 4).map((t) => parseInt(t, 16));
};

export function gradePart(part, response) {
  const r = String(response ?? '').trim();
  if (!r) return false;
  switch (part.kind) {
    case 'numeric': {
      const v = parseNumber(r), want = parseNumber(part.answer);
      return !Number.isNaN(v) && Math.abs(v - want) <= (part.tolerance || 0) * Math.max(1, Math.abs(want)) + 1e-9;
    }
    case 'numlist': { const v = (r.match(/\d+/g) || []).map(Number); return v.length === part.answer.length && v.every((n, i) => n === part.answer[i]); }
    case 'hexlist': { const v = hexTokens(r); return v.length === part.answer.length && v.every((n, i) => n === part.answer[i]); }
    case 'hex': return hexCanon(r) === hexCanon(part.answer);
    case 'choice': return r === part.answer;
    default: return false;
  }
}
