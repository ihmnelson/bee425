/* Answer checking. A check is {type, prompt, answer, ...}; this decides whether a learner's response is right.
   Types: choice (answer is an option index), numeric (decimal, $hex, 0xhex, 1,024 or binary 0b), fill (accepted strings). */

export function parseNumber(s) {
  if (typeof s === 'number') return s;
  const t = String(s).trim().replace(/[,_\s]/g, '');
  if (!t) return NaN;
  if (/^\$[0-9a-f]+$/i.test(t)) return parseInt(t.slice(1), 16);
  if (/^0x[0-9a-f]+$/i.test(t)) return parseInt(t.slice(2), 16);
  if (/^0b[01]+$/i.test(t)) return parseInt(t.slice(2), 2);
  if (/^[0-9][0-9a-f]*h$/i.test(t)) return parseInt(t.slice(0, -1), 16);   /* Z80 style: 3FFFFH, 0A4H */
  if (/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(t)) return Number(t);
  return NaN;
}

const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

export function isCorrect(check, response) {
  switch (check.type) {
    case 'choice': return Number(response) === check.answer;
    case 'numeric': {
      const v = parseNumber(response), want = parseNumber(check.answer);
      if (Number.isNaN(v) || Number.isNaN(want)) return false;
      const tol = check.tolerance || 0;
      return Math.abs(v - want) <= tol * Math.max(1, Math.abs(want));
    }
    case 'fill': {
      const list = Array.isArray(check.answer) ? check.answer : [check.answer];
      return list.some((a) => norm(a) === norm(response));
    }
    default: return false;
  }
}

/* The answer as text, for showing after a miss. */
export function answerText(check) {
  if (check.type === 'choice') return check.options[check.answer];
  if (check.type === 'fill') return Array.isArray(check.answer) ? check.answer[0] : check.answer;
  return check.display ?? String(check.answer);
}
