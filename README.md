# 68K Quest

A small, fully static website that turns studying **Motorola 68000 assembly** into a game. It was built as a study aid for a university microprocessor-systems course (BEE 425, lessons 3-8), and it runs entirely in the browser: no build step, no server, no dependencies.

## What it does

| Area | What you get |
|---|---|
| **World map** | Nine topic "worlds": the CPU, bits and encoding, writing assembly, instructions, addressing modes, branches and the stack, memory and buses, transistors and I/O, and a Z80 contrast. |
| **Flashcards** | 147 cards with Leitner-box spaced repetition. Missed cards return sooner; cards that reach box 4 count as mastered. |
| **Arcade** | Nine eight-question games: Register Tracer, Flag Flipper, Branch Oracle, Mode Match, Bug Hunt, Program Sorter, Number Ninja, Hardware Lab and Quiz Blitz. |
| **Sandbox** | An EASy68K-style editor where you assemble a program, then step or run it while watching D0-D7, A0-A7, the X N Z V C flags and memory. Includes example programs. |
| **Progress** | XP, levels, a daily streak, badges and per-world mastery. |

The Register Tracer, Flag Flipper and Branch Oracle games are driven by a small 68000 simulator (`js/sim.js`), so problems are generated at random and graded by actually executing the code rather than from stored answers.

## Running it

Open `index.html` in a browser. That's all. It also works on any static host, for example GitHub Pages: publish the repository root and it runs as-is, because every path is relative and routing uses the URL hash (`#/cards`, `#/sandbox`, ...).

Progress and your sandbox source are kept in the browser's `localStorage`. They stay on your device and are not synced anywhere. The *Progress* page has a reset button.

## Layout

```
index.html        page shell
style.css         styling
js/sim.js         68000 simulator (registers, flags, addressing modes, Bcc conditions)
js/data.js        flashcards, quiz bank, bug-hunt items, sortable programs
js/store.js       XP, levels, badges, spaced-repetition state (localStorage)
js/games.js       question generators for the arcade games
js/sandbox.js     two-pass assembler + step-through machine
js/sandbox-ui.js  sandbox page
js/app.js         router, flashcards, game engine, progress page
```

## Limitations

- **It is not EASy68K.** The sandbox does not generate machine code. It supports the instructions and modes taught in the lectures (`MOVE`, `MOVEA`, `MOVEQ`, `MOVEM`, `LEA`, the ADD/SUB/CMP/AND/OR/EOR families, `CLR`, `TST`, `NOT`, `NEG`, `EXG`, `SWAP`, `Bcc`, `BRA`, `BSR`, `JSR`, `JMP`, `RTS`, `STOP`, `TRAP #15` task 9, `SIMHALT`) and the directives `ORG`, `EQU`, `SET`, `REG`, `DC`, `DS`, `DCB`, `END`. Macros, PC-relative addressing, shifts, multiply/divide and I/O traps are not simulated. Use the real EASy68K for lab work.
- Data-label addresses can differ slightly from a real assembler's output, because instruction lengths are computed with simplified rules. For the lecture's "largest of 4 bytes" example they match its published list file exactly.
- A byte-sized `A7` access steps by 2 as on real hardware; most other corner cases (privilege modes, exceptions, bus errors) are not modelled.
- Flashcard and quiz content was written from the course slides and may contain mistakes. Where the slides themselves appeared inconsistent, the cards follow the standard 68000 behaviour. Check against your own course materials.

## Credits and disclaimer

Course content is adapted from the BEE 425 lecture slides by Arnold S. Berger, University of Washington Bothell. This is an independent student study project: it is not affiliated with or endorsed by the instructor, the university, or the authors of EASy68K.

EASy68K is by Chuck Kelly; this project contains none of its code.
