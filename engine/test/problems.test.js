/* Problem families that need the simulator cores: the code grader, hand assembly against the instructor's answers,
   pairing equivalence and the mock exam. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeProgram } from '../../content/problems/program.js';
import { writeProgramZ80 } from '../../content/problems/zprogram.js';
import { gradeProgram } from '../../content/problems/grade.js';
import { CLASSES, equivalentOp } from '../../content/problems/pairing.js';
import { encode68 } from '../../content/problems/cores.js';
import { makeMock } from '../../content/problems/mock.js';
import { families } from '../../content/problems/index.js';
import { checkProblem } from '../lib/problemcheck.js';
import { rng } from '../lib/rng.js';

test('every program task: reference passes, wrong variants and an empty program fail', () => {
  for (const id of Object.keys(writeProgram.tasks)) for (let s = 1; s <= 60; s++) {
    const p = writeProgram.make(rng(s), { task: id }), ref = gradeProgram(p, p.reference);
    assert.equal(ref.passed, ref.total, `${id} seed ${s}: reference fails`);
    for (const m of p._mutants) { const g = gradeProgram(p, m.source); assert.ok(g.passed < g.total, `${id} seed ${s}: "${m.name}" passes every test`); }
    const e = gradeProgram(p, '        NOP'); assert.ok(e.passed < e.total, `${id} seed ${s}: empty program passes`);
  }
});

test('grader: runaway loops, assembly errors and forbidden instructions are reported', () => {
  const p = writeProgram.make(rng(1), { task: 'count-ones' });
  assert.match(gradeProgram(p, 'loop BRA loop').results[0].detail, /did not stop/);
  assert.ok(gradeProgram(p, 'FOO D0').error);
  const m = writeProgram.make(rng(1), { task: 'multiply-const' });
  assert.match(gradeProgram(m, '        MULU #5,D0').error, /MULU/);
});

test('hand assembly matches the instructor\'s practice answers', () => {
  const want = { 'MOVE.W #$3400,(A3)+': '36FC3400', 'ADD.B D6,$A4578A04': 'DD39A4578A04', 'EOR.L D3,D6': 'B786', 'SWAP D6': '4846', 'CLR.W $AD459BC0': '4279AD459BC0' };
  for (const [asm, hex] of Object.entries(want)) assert.equal(encode68(asm).bytes.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase(), hex);
});

test('pairing: each 68000 instruction is equivalent to its own Z80 twin and to no other class', () => {
  const ids = Object.keys(CLASSES);
  for (let t = 1; t <= 3; t++) {
    const r = rng(t), ps = ids.map((id) => ({ id, ...CLASSES[id].build(r) }));
    for (const a of ps) for (const b of ps) assert.equal(equivalentOp(a.m, b.z), a.id === b.id, `${a.m.asm} vs ${b.z.asm}`);
  }
});

test('mock exam: seven problems in the practice-exam order, reproducible, and independently verified', () => {
  for (let s = 1; s <= 20; s++) {
    const a = makeMock(s), b = makeMock(s);
    assert.deepEqual(a.map((p) => p.id), ['trace-temp', 'true-false', 'memory-design', 'discussion', 'pairing', 'hand-assembly', 'write-program']);
    assert.deepEqual(a.map((p) => p.parts.map((x) => x.prompt)), b.map((p) => p.parts.map((x) => x.prompt)));
    for (const p of a) assert.deepEqual(checkProblem(families[p.id], p), [], `seed ${s} ${p.id}`);
  }
});

test('Z80 program tasks: reference passes, wrong variants and an empty program fail', () => {
  for (const id of Object.keys(writeProgramZ80.tasks)) for (let s = 1; s <= 60; s++) {
    const p = writeProgramZ80.make(rng(s), { task: id }), ref = gradeProgram(p, p.reference);
    assert.equal(ref.passed, ref.total, `${id} seed ${s}: reference fails`);
    for (const m of p._mutants) { const g = gradeProgram(p, m.source); assert.ok(g.passed < g.total, `${id} seed ${s}: "${m.name}" passes every test`); }
    const e = gradeProgram(p, '        NOP'); assert.ok(e.passed < e.total, `${id} seed ${s}: empty program passes`);
  }
});

test('memory design covers 8-, 16- and 32-bit buses and the lecture example shape', () => {
  for (const bus of [8, 16, 32]) for (let s = 1; s <= 200; s++) {
    const p = families['memory-design'].make(rng(s), { bus });
    assert.equal(p.params.bus, bus);
    assert.deepEqual(checkProblem(families['memory-design'], p), []);
  }
});
