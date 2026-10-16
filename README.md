# 68K Quest

A fully static website for learning **Motorola 68000 assembly**, built as a study aid for a university microprocessor-systems course (BEE 425, lessons 3-8). It runs entirely in the browser: no build step, no server, no dependencies. Open `index.html`, or host the folder on any static host such as GitHub Pages.

## What it does

| Area | What you get |
|---|---|
| **World map** | Nine topic "worlds": the CPU, bits and encoding, writing assembly, instructions, addressing modes, branches and the stack, memory and buses, transistors and I/O, and a Z80 contrast. |
| **Flashcards** | 147 cards with Leitner-box spaced repetition. Cards link to the matching guide. |
| **Arcade** | Nine eight-question games: Register Tracer, Flag Flipper, Branch Oracle, Mode Match, Bug Hunt, Program Sorter, Number Ninja, Hardware Lab and Quiz Blitz. Tracer/Flag/Branch questions are generated and graded by running real code on the emulator. |
| **Guides** | 13 written guides (CPU, number systems, programmer's model, machine code, syntax and directives, instruction reference, addressing modes, branches, stack, memory and buses, transistors, Z80, and **slide errata and EASy68K quirks**), an 84-term searchable glossary, and a list of references. |
| **Read Code** | Type any 68K line for a plain-English breakdown, or open a lecture program and read it line by line. |
| **Sandbox** | An EASy68K-compatible editor, assembler and simulator that runs real 68000 machine code. Listing with machine code, step / step over / **step back** / run / pause, breakpoints, registers with changed values highlighted, flags, SR, memory, stack and symbol views, **TRAP #15 console I/O** (text and number input/output, halt), .X68/.S68/.L68 download, file open, shareable links, **named projects** saved in the browser, **Export all (.zip)** of every project as .X68 files, and a **JSON backup / restore** of projects plus study progress (also on the Progress page). |
| **Homework** | Homework 2 (problems 1-4): hints, a collapsed walkthrough, a try-it box that checks your program on several test inputs, and verified solutions with an instruction-by-instruction trace. Plus a guide to the EASy68K workflow (files, list file, S-records). |
| **Tests** | The content audit results (every card, quiz item, glossary term and guide section) and a description of how the emulator was verified. |
| **Progress** | XP, levels, a daily streak, badges and per-world mastery. |

## Running it

Open `index.html` in a browser. All paths are relative and routing uses the URL hash (`#/cards`, `#/sandbox`, ...), so it works from `file://` and from a project URL like `user.github.io/repo/`.

Progress, the sandbox source and breakpoints are kept in the browser's `localStorage`. They stay on your device and are not synced anywhere.

## Layout

```
index.html            page shell
style.css             styling
js/cpu.js             68000 CPU core: executes real machine code from a 16 MB byte array
js/asm.js             two-pass assembler (EASy68K source conventions), listing, S-records
js/io.js              TRAP #15 text/number I/O services and console
js/examples.js        example programs for the sandbox
js/snippet.js         runs a few lines on the CPU with a preset state (used by the games)
js/data.js            flashcards, quiz bank, bug-hunt items, sortable programs
js/guides.js          guides, glossary, references, cross-link maps
js/explain.js         line-by-line explainer behind Read Code
js/games.js           question generators for the arcade games
js/store.js           XP, levels, badges, spaced-repetition state (localStorage)
js/homework.js        homework problems, solutions, checker and tracer
js/homework-ui.js     homework pages
js/projects.js        named projects, JSON backup/restore, ZIP export
js/sandbox-ui.js      sandbox page
js/app.js             router, flashcards, game engine, progress and tests pages
tests/data/audit.js   content audit results (generated)
tests/oracle/         developer tools: differential testing against a real EASy68K
```

## How it was tested

- **Content audit.** All 147 flashcards, 44 quiz questions, 84 glossary terms and 73 guide sections were reviewed against the lecture slides, Motorola's M68000 Programmer's Reference Manual, the EASy68K documentation and, for anything executable, a real EASy68K assembler/simulator. 21 items were wrong or misleading and were corrected; the slide errors found are listed in the *Slide errata* guide. Reviews were done by small-model agents; checks of manual details they could not run are marked in the evidence and are weaker than the oracle-backed ones.
- **Assembler.** Reproduces the lecture's published list file byte for byte, and matches the real assembler line by line on two broad instruction/addressing-mode probe files.
- **CPU and assembler together.** `tests/oracle/fuzz.js` runs random instructions in both the real EASy68K and this site and compares machine code, D0-D7, A0-A7, flags and memory. On the latest 3,000-case run there was 1 disagreement (`ASL` by a register count larger than the operand size; the site follows the hardware, see the errata guide). A run of 6,000 cases earlier in development was later found not to have compared flags because of a bug in the test script; the flag comparison was repaired and re-run as above.
- **Examples.** The bundled example programs finish with the same registers, memory and output as the real EASy68K.
- **UI.** The pages, games and sandbox were exercised end to end in a simulated browser (jsdom).

Known, intentional differences from EASy68K (the site follows Motorola's manual): `MULS` flag V, `DIVU`/`DIVS` overflow flag C, `ASL` V for very large counts, undefined `ABCD`/`SBCD`/`NBCD` flags, and `CHK` exception frames.

The homework solutions were also run on the real EASy68K. The workflow guide, the seven flashcards and three glossary terms added with the homework were written after the content audit and have not been audited.

## Limitations

- Not a replacement for the real EASy68K for graded work where exact cycle counts, graphics `TRAP #15` tasks, file I/O, structured assembly (`IF`/`FOR`/`WHILE`), or `INCLUDE` are required. Those are not implemented.
- The Tests page shows the audit; it does not yet re-run the oracle vectors inside the browser.
- The layout was checked in a simulated browser, not on real devices.

## Roadmap

- **Saving work, next steps:** projects and progress can now be exported and restored by hand. Still to do: optional sync across devices and automatic periodic backups.
- Run the oracle test vectors live in the browser and show them case by case on the Tests page.
- Structured assembly, `INCLUDE`, a disassembler view, cycle counts, graphics and file `TRAP #15` tasks.
- More fuzz coverage (multi-instruction sequences, exceptions).

## Credits and disclaimer

Course content is adapted from the BEE 425 lecture slides by Arnold S. Berger, University of Washington Bothell. This is an independent student study project: it is not affiliated with or endorsed by the instructor, the university, or the authors of EASy68K.

The EASy68K name and behaviour belong to Chuck Kelly and Tim Larson; this project contains none of their code and uses their tool only as a black-box reference. The idea of a browser-based teaching IDE was also inspired by [ASM Editor](https://asm-editor.specy.app) (AGPL-3.0); no code from it is used.
