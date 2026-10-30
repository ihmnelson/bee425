/* Generators for two's complement and signed arithmetic (Lessons 3-5). verify() redoes each by search or by a different route. */

const hex2 = (n) => '$' + (n & 0xff).toString(16).toUpperCase().padStart(2, '0');
const toSigned = (b) => (b >= 128 ? b - 256 : b);

/* ---- Two's complement (negate) of a byte, as hex ---- */
const negateByte = {
  make(rand) {
    const x = rand.int(1, 127);
    const comp = (~x) & 0xff, neg = (comp + 1) & 0xff;
    return {
      type: 'numeric', params: { x },
      prompt: `Find the **two's complement** of the byte **${hex2(x)}** (that is, ${hex2(x)} negated). Give the answer in hex.`,
      answer: hex2(neg), display: hex2(neg),
      explain: `${hex2(x)} = ${x.toString(2).padStart(8, '0')}. Complement every bit: ${comp.toString(2).padStart(8, '0')}. Add 1: ${neg.toString(2).padStart(8, '0')} = **${hex2(neg)}**. Check: ${hex2(x)} + ${hex2(neg)} = $100, which is 0 in a byte.`,
    };
  },
  verify({ params: { x } }) { for (let y = 0; y < 256; y++) if (((x + y) & 0xff) === 0) return y; return NaN; },
};

/* ---- Signed value of a byte ---- */
const signedValue = {
  make(rand) {
    const b = rand.int(128, 255);
    const v = toSigned(b);
    return {
      type: 'numeric', params: { b },
      prompt: `The byte **${hex2(b)}** holds a two's complement number. What is its **decimal value**?`,
      answer: v, display: String(v),
      explain: `The top bit is 1, so the number is negative. Negate it: complement ${b.toString(2).padStart(8, '0')} to ${((~b) & 0xff).toString(2).padStart(8, '0')} and add 1 to get ${256 - b} = ${hex2(256 - b)}. So ${hex2(b)} = **-${256 - b}**. (Shortcut: ${b} - 256 = ${v}.)`,
    };
  },
  verify({ params: { b } }) { let n = 0; for (let v = -128; v <= 127; v++) if ((v & 0xff) === b) n = v; return n; },
};

/* ---- Does an 8-bit signed add overflow (V flag)? Answer 1 or 0 ---- */
const addOverflow = {
  make(rand) {
    const a = rand.int(-128, 127), b = rand.int(-128, 127);
    const sum = a + b, v = sum > 127 || sum < -128 ? 1 : 0;
    return {
      type: 'numeric', params: { a, b },
      prompt: `An 8-bit processor adds **${a}** and **${b}** as signed numbers (${hex2(a)} + ${hex2(b)}). Is the **overflow flag V set**? Enter **1** for yes or **0** for no.`,
      answer: v, display: v ? '1 (overflow)' : '0 (no overflow)',
      explain: `The true sum is ${a} + ${b} = ${sum}. A signed byte holds -128 to +127, so the result ${v ? 'does not fit, and V = 1 (the byte would read ' + toSigned((sum) & 0xff) + ')' : 'fits, and V = 0'}. Adding a positive and a negative number can never overflow; two positives or two negatives can.`,
    };
  },
  verify({ params: { a, b } }) {
    const r = toSigned((a + b) & 0xff);                    /* what the byte actually reads */
    return r === a + b ? 0 : 1;
  },
};

export const generators = { 'number.negateByte': negateByte, 'number.signedValue': signedValue, 'number.addOverflow': addOverflow };
