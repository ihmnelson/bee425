/* Homework 3: every reference solution must pass its checker, and known-wrong variants must fail. */
const H = require('../../js/m68k/homework.js');
let bad = 0;
const fail = (m) => { console.log('FAIL ' + m); bad++; };
const hw = H.HW3;
for (const p of hw.problems) {
  const check = p.checkFn;
  for (const s of p.solutions) {
    const r = check(s.code);
    if (r.error) fail(`problem ${p.n} "${s.title}": ${r.error}`);
    else if (!r.results.every((x) => x.ok)) fail(`problem ${p.n} "${s.title}": ` + JSON.stringify(r.results.filter((x) => !x.ok)));
    else console.log(`ok   problem ${p.n} "${s.title}" (${r.results.length} data sets)`);
  }
}
const wrong = (n, from, to, why) => {
  const p = hw.problems[n - 1], r = p.checkFn(p.solutions[0].code.replace(from, to));
  if (r.error || !r.results.every((x) => x.ok)) console.log(`ok   wrong variant rejected: ${why}`); else fail(`wrong variant accepted: ${why}`);
};
wrong(1, 'ADD.L   $A304', 'ADD.W   $A304', 'problem 1 with ADD.W');
wrong(2, 'LEA     -2(A0),A2', 'MOVEA.L A0,A2', 'problem 2 forgetting the -2');
wrong(3, 'BGT     loop', 'BHI     loop', 'signed problem using the unsigned branch');
wrong(4, 'BHI     loop', 'BGT     loop', 'unsigned problem using the signed branch');
wrong(3, '#$7F,D0', '#$00,D0', 'signed problem starting at 0');
process.exit(bad ? 1 : 0);
