/* Mastery model. Pure functions, no DOM, shared by the UI and the tests.

   Levels follow Khan Academy's published scheme (support.khanacademy.org, "How do Khan Academy's Mastery levels work?"):
   a partly right practice set reaches Familiar, a perfect first-try set reaches Proficient, and only a mixed (cumulative)
   check can promote Proficient to Mastered. A miss on a mixed check demotes.
   Our own choices, to be tuned: Khan's Familiar line is 70%, but a concept has only 2-4 checks, so we use 60% (2 of 3, 3 of 4).
   The review intervals are also ours.
*/

export const LEVELS = ['Not started', 'Attempted', 'Familiar', 'Proficient', 'Mastered'];
export const NOT_STARTED = 0, ATTEMPTED = 1, FAMILIAR = 2, PROFICIENT = 3, MASTERED = 4;

const DAY = 86400000;
export const FAMILIAR_AT = 0.6;
/* days until a concept is due for review again, by level */
export const INTERVAL_DAYS = [0, 0, 1, 3, 10];

export const blank = () => ({ level: NOT_STARTED, due: 0, seen: 0, streak: 0, testedOut: false });

const withDue = (rec, now) => ({ ...rec, due: now + INTERVAL_DAYS[rec.level] * DAY * Math.max(1, rec.streak) , seen: now });

/* Finish the Learn flow for one concept. firstTry = number of checks answered correctly on the first attempt. */
export function finishLearn(rec, firstTry, total, now = Date.now()) {
  const frac = total ? firstTry / total : 0;
  let level = rec.level;
  if (frac === 1) level = Math.max(level, PROFICIENT);
  else if (frac >= FAMILIAR_AT) level = Math.max(level, FAMILIAR);
  else level = Math.max(level, ATTEMPTED);
  return withDue({ ...rec, level, streak: frac === 1 ? rec.streak : 0 }, now);
}

/* One result from a mixed check (chapter test, review, or diagnostic). */
export function mixedResult(rec, correct, now = Date.now()) {
  let { level, streak } = rec;
  if (correct) {
    if (level === PROFICIENT) level = MASTERED;
    else if (level === NOT_STARTED || level === ATTEMPTED) level = FAMILIAR;
    streak = Math.min(streak + 1, 6);
  } else {
    if (level > FAMILIAR) level -= 1;       /* Mastered -> Proficient, Proficient -> Familiar */
    else if (level === FAMILIAR) level = ATTEMPTED;
    streak = 0;
  }
  return withDue({ ...rec, level, streak }, now);
}

/* Test-out: a correct answer in a placement check credits Proficient, never more. A miss changes nothing. */
export function testOutResult(rec, correct, now = Date.now()) {
  if (!correct || rec.level >= PROFICIENT) return rec;
  return withDue({ ...rec, level: PROFICIENT, testedOut: true }, now);
}

export const isDue = (rec, now = Date.now()) => rec.level >= FAMILIAR && rec.due <= now;

/* Unit status from its concept records: share of concepts at Proficient or better. */
export function unitProgress(recs) {
  const n = recs.length || 1;
  const prof = recs.filter((r) => r.level >= PROFICIENT).length;
  const mast = recs.filter((r) => r.level >= MASTERED).length;
  return { proficient: prof / n, mastered: mast / n, total: recs.length };
}

/* Concepts a learner can start: every prerequisite is at least Familiar. */
export function unlocked(concept, records) {
  return (concept.needs || []).every((id) => (records[id]?.level ?? 0) >= FAMILIAR);
}
