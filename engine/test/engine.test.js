import test from 'node:test';
import assert from 'node:assert/strict';
import { blank, finishLearn, mixedResult, testOutResult, isDue, NOT_STARTED, ATTEMPTED, FAMILIAR, PROFICIENT, MASTERED } from '../lib/mastery.js';
import { isCorrect, parseNumber } from '../lib/check.js';
import { rng } from '../lib/rng.js';

const T0 = 1_000_000_000_000;

test('learn flow: perfect -> Proficient, 2 of 3 -> Familiar, 1 of 3 -> Attempted', () => {
  assert.equal(finishLearn(blank(), 3, 3, T0).level, PROFICIENT);
  assert.equal(finishLearn(blank(), 2, 3, T0).level, FAMILIAR);
  assert.equal(finishLearn(blank(), 1, 3, T0).level, ATTEMPTED);
});
test('learn flow thresholds with other set sizes', () => {
  assert.equal(finishLearn(blank(), 3, 4, T0).level, FAMILIAR);
  assert.equal(finishLearn(blank(), 2, 4, T0).level, ATTEMPTED);
  assert.equal(finishLearn(blank(), 1, 2, T0).level, ATTEMPTED);
  assert.equal(finishLearn(blank(), 0, 3, T0).level, ATTEMPTED);
});
test('learn flow never lowers a level', () => {
  const r = { ...blank(), level: MASTERED };
  assert.equal(finishLearn(r, 0, 3, T0).level, MASTERED);
});
test('only a mixed check promotes Proficient to Mastered', () => {
  let r = finishLearn(blank(), 3, 3, T0);
  assert.equal(r.level, PROFICIENT);
  r = mixedResult(r, true, T0);
  assert.equal(r.level, MASTERED);
});
test('a miss on a mixed check demotes one level, and Familiar to Attempted', () => {
  assert.equal(mixedResult({ ...blank(), level: MASTERED }, false, T0).level, PROFICIENT);
  assert.equal(mixedResult({ ...blank(), level: PROFICIENT }, false, T0).level, FAMILIAR);
  assert.equal(mixedResult({ ...blank(), level: FAMILIAR }, false, T0).level, ATTEMPTED);
  assert.equal(mixedResult({ ...blank(), level: NOT_STARTED }, false, T0).level, NOT_STARTED);
});
test('test-out credits Proficient, never Mastered, and a miss changes nothing', () => {
  const r = testOutResult(blank(), true, T0);
  assert.equal(r.level, PROFICIENT); assert.equal(r.testedOut, true);
  assert.equal(testOutResult(blank(), false, T0).level, NOT_STARTED);
  assert.equal(testOutResult({ ...blank(), level: MASTERED }, true, T0).level, MASTERED);
});
test('review: due only when at least Familiar and past its due time', () => {
  const r = finishLearn(blank(), 3, 3, T0);
  assert.equal(isDue(r, T0 + 1000), false);
  assert.equal(isDue(r, T0 + 4 * 86400000), true);
  assert.equal(isDue(blank(), T0 + 1e12), false);
});

test('parseNumber accepts decimal, $hex, 0xhex, trailing H, commas and binary', () => {
  assert.equal(parseNumber('1,048,576'), 1048576);
  assert.equal(parseNumber('$3FFFF'), 0x3ffff);
  assert.equal(parseNumber('0x3ffff'), 0x3ffff);
  assert.equal(parseNumber('3FFFFH'), 0x3ffff);
  assert.equal(parseNumber('0b101'), 5);
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber('')));
});
test('isCorrect by type', () => {
  assert.ok(isCorrect({ type: 'numeric', answer: '$80000' }, '524288'));
  assert.ok(!isCorrect({ type: 'numeric', answer: 4 }, '5'));
  assert.ok(isCorrect({ type: 'choice', answer: 2 }, '2'));
  assert.ok(!isCorrect({ type: 'choice', answer: 2 }, '1'));
  assert.ok(isCorrect({ type: 'fill', answer: ['Page bits'] }, '  page   BITS '));
});
test('rng is repeatable from a seed', () => {
  assert.equal(rng(42)(), rng(42)());
  assert.notEqual(rng(1)(), rng(2)());
});
