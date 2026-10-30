# BEE 425 Quest: overhaul plan

Written 2026-10-30. Goals: (1) remove duplicated material, (2) make it a good learning tool, (3) make it as accurate and factual as possible, and (4) turn the engine and workflow into a reusable skill for other courses. The current site is frozen as git tag `v1-archive` and as a copy in `archive/` (served at `/archive/`).

## Decisions

| Topic | Decision |
|---|---|
| Build | Content in structured files, validated and built into static files for GitHub Pages. UI in Preact. |
| Skill | Template + workflow (engine, content schema, audit tools, written process), extracted from this site once it works. |
| Distribution | Public. Lecture slide images and professor-supplied exam items are kept, in a separate labelled folder so they can be removed quickly. A permission email to the professor is still advised. |
| Progress | Browser-local with export/import. No accounts, no server. |
| Test-out | Course diagnostic on first visit, plus a per-chapter test-out. |
| Processors | Two separate learning tracks. 68000 leads (lecture order: Lessons 4-5 are 68000, the Z80 appears alongside in 3-5, Lessons 6-8 are shared hardware). The Z80 track opens each topic with a callback to its 68000 twin: what is the same, what differs, and why. |
| Old site | Rebuild in place on a branch, merge to `main` when Lessons 3-8 are covered. `/archive/` stays linked from the header. |

## Learning model

- **Concept record**: one small file per idea. Explanation, worked example, faded example, 2-4 checks (fixed or generated numeric variants), one flashcard, one glossary line, sources (slide number, manual page, or "own analysis"). Every other view is generated from it.
- **Bridge**: a Z80 concept names its 68000 twin and gives `same`, `different`, `why`.
- **Mastery states** per concept: Not started, Familiar, Proficient, Mastered. Practice reaches Proficient; only mixed cumulative checks reach Mastered. A later miss demotes. Old concepts return on a spaced schedule, interleaved with new ones.
- **Test-out**: counts as Proficient and still returns for review.
- **Chapter flow**: concept, check, next concept, check, combine check, repeat, chapter test.

## Structure

- **Shared core** (taught once): number systems, buses, memory decoding, I/O and transistors, PCB and power, data conversion.
- **68000 track**: registers, addressing modes, instructions, branches, stack.
- **Z80 track**: the same ideas with callbacks, plus Z80-only material (Oshonsoft, bus cycles, T-states).
- **Labs**: Labs 1, 2 and 3 (Lab 3: 68008, prefetch, logic-analyzer decode).
- **Lesson 9**: stub until the slides are available.
- **Sections**: Learn, Games (fed from concept records), Simulators (unchanged, linked from concepts), Exam Prep (professor's practice problems, problem sets by type, timed mocks, weak-concepts drill).

## Accuracy pipeline

- Build fails on: a concept with no source, a duplicate, a broken link.
- Generated numeric questions are checked by an independent solver.
- Existing oracle tests (EASy68K comparison, Z80 SingleStepTests, audits) keep running.
- An "unverified" report is the to-do list.

## Phases

0. **Archive** (done 2026-10-30): tag `v1-archive`, copy in `archive/`.
1. **Engine** (pilot built 2026-10-30 on branch `rebuild`): schema, build, audit, Preact player, mastery model, one pilot unit end to end (memory decoding: 5 shared concepts, one 68000, one Z80 with a bridge). `npm run build`, `npm run audit`, `npm test`. Not yet: games, simulators, exam prep, the other units.
2. **Migrate**: decompose existing flashcards, guides, quiz items, Start here and homework into concept records, one chapter at a time in lecture order. Delete the old duplicate as each lands.
3. **Add**: gaps found in the mock exam (trace width from resistivity, clock skew, split ground planes, bypass capacitors, duty cycle, hand assembly to hex, write-a-program) and Lab 3.
4. **Test-out and Exam Prep**, then navigation overhaul and cutover.
5. **Extract the skill** with a short guide; try it on a second class.

## Risks and open items

- Midterm Tue 2026-11-03: `main` stays on the old site until the new one covers Lessons 3-8.
- Scale: decompose and reuse existing verified text instead of rewriting, so earlier audits stay useful.
- Lesson 9 slides are missing; the diagnostic and chapter list will have a gap.
- `archive/` shares the browser's localStorage with the new site (same origin). The new progress format needs a version key and a migration so the archive does not corrupt it.
- Slides, practice problems and the Lab 3 handout belong to the professor; keep them separable.
