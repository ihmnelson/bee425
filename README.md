# BEE 425 Quest

A fully static study site for **BEE 425 Microprocessor System Design** (University of Washington Bothell, lessons 3-8). It covers both processors in the course, the **Motorola 68000** and the **Zilog Z80**, with flashcards, arcade games, written guides and an in-browser assembler and simulator for each, plus a shared **Data conversion** section (Lesson 10: comparators, D/A, A/D methods, sample and hold, Nyquist) with a converter lab instead of a simulator. It runs entirely in the browser: no build step, no server, no dependencies. Open `index.html`, or host the folder on any static host such as GitHub Pages.

Pick a processor on the home page (or with the switcher in the header). XP, level, streak, badges and spaced-repetition state are shared across both; saved sandbox projects are kept per processor; one backup file covers everything.

| URL | Page |
|---|---|
| `#/` | BEE 425 home: two live machines, one per processor |
| `#/68k/...` and `#/z80/...` | that processor's Topics, Guides, Flashcards, Practice, Explain code and Sandbox (the 68000 also has Homework 2) |
| `#/sys/...` | Data conversion, shared by both processors: Topics, Guides, Flashcards, Practice and the Converter lab (no Explain code page) |
| `#/progress` | shared progress, badges, backup and restore |

Links from the earlier single-processor site (`#/cards`, `#/sandbox?c=...`) still work and open the 68000 pages.

## What each processor has

| Area | What you get |
|---|---|
| **Topics** | Numbered topics in lecture order, each a lesson plan with a mastery trace (68000: nine; Z80: ten, including the Oshonsoft IDE and a 68K contrast). |
| **Flashcards** | 147 (68000) and 159 (Z80) cards with Leitner-box spaced repetition. |
| **Practice** | Nine eight-question games: Register Tracer, Flag Flipper, Branch Oracle, Mode Match, Bug Hunt, Program Sorter, Number Ninja, Hardware Lab, Quiz Blitz. Tracer/Flag/Branch answers come from running real code on that processor's simulator. |
| **Guides** | 13 (68000) and 14 (Z80) written guides, a searchable glossary (84 and 92 terms), and references. |
| **Explain code** | Type any line for a plain-English breakdown, or open an example program and read it line by line. The Z80 version also shows the machine code and T-states. |
| **Sandbox** | **68000:** an EASy68K-compatible editor, assembler and simulator (TRAP #15 console I/O, step back, breakpoints, .X68/.S68/.L68). **Z80:** an Oshonsoft-style editor, assembler and simulator with exact T-states, six run rates, starting address, a terminal on port 02H and an input device on port 01H with "prompt before IN", INT/NMI buttons, `.asm`/`.lst`/Intel-HEX downloads. Both: named projects, shareable links, ZIP export, JSON backup/restore. |
| **Homework** | 68000 only: Homework 2 (problems 1-4) with hints, walkthrough, a try-it box and verified solutions. |
| **How accurate is this site?** | What was verified and how, plus a content-audit table for that processor. |

## Data conversion section

Lesson 10, slides 1 to 35, in three numbered topics: Comparators and D/A, A/D methods, Data acquisition. 27 flashcards and 18 quiz questions (each tagged with its slide number), three guides, a 24-term glossary, **Converter Drills** (13 kinds of numeric question, new numbers every time: step size, code, comparator count, V/F counts, flash rate, droop time, dual-slope, aliasing, successive-approximation trials, slew error) and the **Converter lab**: a quantizer (bits, span and input give the code, a staircase, the flash thermometer code and each successive-approximation trial) and a sampling panel (signal and sample frequency, with the samples and the wave they imply). The home page runs a 4-bit successive-approximation converter on 1.23 V. Where the slides disagree with each other or with the arithmetic (comparator count on slide 6 against slide 12; the 50 mV/s droop figure on slide 31) the guides and the section's "How accurate is this site?" page say so. Hysteresis, isolation, watchdog, power and partitioning (slides 36 to 61) are not covered yet.

## Layout

```
index.html              page shell
style.css               styling
js/shell/packs.js       registry that lets several processors share the same page
js/shell/store.js       XP, levels, badges, spaced repetition (one record for the whole site)
js/shell/projects.js    per-processor projects, combined JSON backup, ZIP export
js/shell/app.js         router, header, flashcards, game engine, progress and tests pages
js/shell/icons.js       icon sprite (IBM Carbon icons, Apache-2.0) and the emoji-to-icon map
js/shell/demo.js        the live machines on the home page (real simulator cores stepping a short program)
fonts/                  IBM Plex Sans, Serif and Mono (SIL Open Font License), self-hosted
js/m68k/                68000: cpu.js, asm.js, io.js (TRAP #15), examples, snippet, data, games, explain, guides,
                        homework*, sandbox-ui.js, ui.js (strings and options for the shell)
js/z80/                 Z80: cpu.js, asm.js, dis.js, io.js (ports), examples, snippet, data, games, explain, guides,
                        sandbox-ui.js, ui.js
js/sys/                 Data conversion: conv.js (the arithmetic), data, games, guides, lab.js (the Converter lab), ui.js
tests/                  see "How it was tested"
```

Each processor is a *pack*: its scripts define the same global names (`QUEST`, `Games`, `QUEST_GUIDES`, `Explain`, `Sandbox`, ...); after a pack's scripts have run, `PACKS.capture(id)` files those names away and `PACKS.activate(id)` puts one pack's set back when its pages are open. Adding a processor means adding a folder of this shape and two `<script>` lines.

## How it was tested

`sh tests/run-all.sh` runs every check that needs no download (see the script for the optional ones).

**68000** (details in `tests/m68k/oracle/README.md`)
- **Content audit.** All 147 flashcards, 44 quiz questions, 84 glossary terms and 73 guide sections were reviewed against the lecture slides, Motorola's M68000 Programmer's Reference Manual, the EASy68K documentation and, for anything executable, a real EASy68K assembler/simulator. 21 items were wrong or misleading and were corrected. Reviews were done by small-model agents; checks of manual details they could not run are weaker than the oracle-backed ones.
- **Assembler** reproduces the lecture's published list file byte for byte and matches the real assembler line by line on two broad probe files.
- **CPU and assembler together:** `tests/m68k/oracle/fuzz.js` runs random instructions in both the real EASy68K and this site and compares machine code, registers, flags and memory (latest 3,000-case run: 1 disagreement, `ASL` by a register count larger than the operand size; the site follows the hardware). Known, intentional differences from EASy68K: `MULS` flag V, `DIVU`/`DIVS` overflow flag C, `ASL` V for very large counts, undefined `ABCD`/`SBCD`/`NBCD` flags, `CHK` exception frames.

**Z80** (details in `tests/z80/oracle/README.md`)
- **CPU core:** the [SingleStepTests/z80](https://github.com/SingleStepTests/z80) vectors (MIT): 1,604,000 single-instruction cases covering every documented and undocumented opcode, comparing registers, flags (including the undocumented bits), the internal WZ register, memory, port accesses and exact T-state counts. **0 failures.**
- **Assembler:** every opcode sequence disassembled by `z80dasm` (an independent tool) and re-assembled: 1,250 instruction forms, 0 mismatches. It also reproduces the test example printed in the Oshonsoft help (`tests/z80/oshonsoft-expr.js`).
- **Bus trace** (Z80 sandbox, Bus trace tab): the rows are checked against the vectors' per-clock bus states (all 1,604,000 traces exact; a held-out split of 801,993 exact), against the manual's cycle structure, and by reading each instruction back out of the displayed signals (80,200 instructions, 0 differences). `tests/z80/oracle/bustrace-*.js`.
- **Disassembler** round trip, **example programs**, **Bug Hunt / Program Sorter / game generators** are all executed on the CPU core.
- **Content audit** (`tests/z80/audit`): 433 items checked mechanically against the lecture text (Lessons 3-8, 10, 11), the Lab 2 handout, the Zilog Z80 CPU User Manual, the Oshonsoft help pages and the simulator: 338 confirmed, 3 corrected, 92 unverified. The confirmations are quoted phrases or executed checks, not a human reading of every nuance.

**Data conversion** (`node tests/sys/check-content.js`)
- Every worked figure on the cards and guides (0.04 V and 0.00015 V steps, the 1.5 V DAC maximum, 5 µs droop time, 500 MHz flash rate, V/F counts, the 10 kHz filter cutoff) is recomputed; successive approximation is compared with direct quantization in 128,032 cases (1 to 8 bits), 0 differences.
- Each of the 13 drill kinds is solved a second time by a separate parser-based solver for 12,000 generated questions; every answer is accepted and absurd answers are rejected.
- Not checked: the slides' content against other textbooks, and the three links copied from the slides.

**Site**
- `tests/ui-smoke.js` (jsdom) visits every route of both processors, starts every game, drives both sandboxes, and checks link rewriting, legacy URLs, per-processor project storage, combined backup/restore (including backups from the older sites) and the one-time migration of progress saved by the older sites.

## Limitations

- **Z80 sandbox vs the real Oshonsoft IDE:** the IDE (Windows trial software) was not run; behaviour follows its published help pages and the slides. Unknown: label case sensitivity, exactly which bracket forms it accepts, error wording. Not implemented: BASIC compiler, disassembler window, interactive assembler editor, `INCLUDE`, serial terminals with status registers, video screen, ZX Spectrum interface, external modules, TASM. Unofficial instructions are always simulated.
- **68000 sandbox:** not a replacement for EASy68K where graded work needs exact cycle counts, graphics `TRAP #15` tasks, file I/O, structured assembly or `INCLUDE`.
- Instruction-level simulators: no bus-level timing, wait states or DMA (Z80), no exception timing (68000).
- Some Z80 flashcards, quiz items and glossary terms are marked unverified on its Tests page.
- The Tests pages show the audits; they do not re-run the test vectors in the browser.
- The layout was checked in a simulated browser, not on real devices.

## Roadmap

- Data conversion: slides 36 to 61 of Lesson 10 (hysteresis, debouncing, optical isolation, watchdog, power, terminating traces, partitioning); Lesson 9 is not in the folder.
- Merge the duplicated hardware and transistor material (memory, buses, I/O pins, base resistors) so it lives once.
- Run the oracle test vectors live in the browser.
- 68000: structured assembly, `INCLUDE`, a disassembler view, cycle counts. Z80: homework-style walkthroughs when the lab handouts are available.
- Optional sync of progress across devices.

## How the site is organised

For each processor the pages follow one loop: **Learn** (guides), **Remember** (flashcards), **Practice** (drills), **Build** (sandbox and Explain code). *Topics* hold it together: they run in lecture order, and each topic page is a short lesson plan (read its guide, review its cards, practise the matching drills, take a quiz, try it in the sandbox) with links to the previous and next topic. The home page says which processor to open (EASy68K labs: 68000; Oshonsoft IDE: Z80), and every page tells a new student what to do next.

## Design

A lab-bench / datasheet look: paper and ink, hairline structure, IBM Plex type, one accent colour per processor (probe blue for the 68000, probe amber for the Z80), light and dark themes that follow the system setting. Tokens (colour, a 1.2 type scale, a 4 px spacing unit, two radii) are at the top of `style.css`. Topic, deck, game and guide lists are rows, not cards. Mastery is drawn as a logic-analyser trace with one bit per flashcard (high means mastered), and the home page runs a short program on each processor's real simulator core. XP and streaks are shown as plain numbers; milestones are a list.

## Credits and disclaimer

Course content is adapted from the BEE 425 lecture slides by Arnold S. Berger, University of Washington Bothell. This is an independent student study project: it is not affiliated with or endorsed by the instructor, the university, the authors of EASy68K, Zilog or Oshonsoft.

The EASy68K name and behaviour belong to Chuck Kelly and Tim Larson, and the Oshonsoft name and behaviour to Oshonsoft; this project contains none of their code and uses EASy68K, `z80dasm` and the SingleStepTests vectors (MIT) only as black-box references. The 68000 core and assembler were written independently from Motorola's M68000 Programmer's Reference Manual, and the Z80 core, assembler and disassembler from Zilog's Z80 CPU User Manual (UM0080). Typefaces are IBM Plex (SIL Open Font License 1.1) and icons are IBM Carbon icons (Apache-2.0), both included under their licences. The idea of a browser-based teaching IDE was also inspired by [ASM Editor](https://asm-editor.specy.app) (AGPL-3.0); no code from it is used.
