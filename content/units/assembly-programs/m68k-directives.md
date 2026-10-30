---
track: m68k
title: 68000 assembler directives
summary: ORG, EQU, SET, REG, DC, DCB, DS, END and MACRO instruct the assembler; they are not processor instructions.
needs: [assembly-intro.assembly-line-format]
sources:
  - { type: slide, ref: "L4 s178", quote: "Pseudo opcodes are directives to the assembler" }
  - { type: slide, ref: "L4 s179", quote: "Instructs the assembler where the code will execute in memory" }
  - { type: slide, ref: "L4 s181", quote: "Fill 100 bytes of memory with $AA" }
  - { type: slide, ref: "L4 s182", quote: "ORG and END are complementary" }
  - { type: oracle, ref: "the directive example below is assembled and run" }
programs:
  - cpu: m68k
    name: "EQU, DCB, DC.B and DS together"
    source: |
      * program
      VAL     EQU     5
              ORG     $1000
      START   MOVE.B  #VAL,D0
              SIMHALT
      BLOCK   DCB.B   4,$AA
      MSG     DC.B    'Hi',0
      BUF     DS.L    2
      AFTER   DC.B    $77
              END     START
    expect:
      regs: { D0: 5 }
      mem: { BLOCK: [0xAA, 0xAA, 0xAA, 0xAA], MSG: [0x48, 0x69, 0x00] }
checks:
  - type: choice
    prompt: "What does the directive `ORG $1000` do?"
    options: ["Tells the assembler to assemble the code to run at address $1000", "Loads the program at $1000 on the board", "Branches to $1000", "Defines a constant $1000"]
    answer: 0
    explain: "ORG sets the origin: it instructs the assembler where the code will execute in memory, which resolves address references. END (with an address) instructs the loader where to put the code; the two are complementary."
  - type: choice
    prompt: "Which directive allocates **uninitialised** storage, `DC`, `DCB` or `DS`?"
    options: ["DS (Define Storage): reserves space without a value", "DC", "DCB", "EQU"]
    answer: 0
    explain: "DS generates an uninitialised block (DS.L 200 reserves 200 long words = 800 bytes). DC defines constants, and DCB fills a block with the same value (DCB.B 100,$AA fills 100 bytes with $AA)."
  - type: choice
    prompt: "`DS.L 200` reserves how many bytes?"
    options: ["800", "200", "400", "100"]
    answer: 0
    explain: "The size is in long words: 200 x 4 bytes = 800 bytes."
  - type: choice
    prompt: "Which directive can **generate executable code** (all the others do not)?"
    options: ["MACRO", "ORG", "EQU", "DS"]
    answer: 0
    explain: "The MACRO pseudo-op can generate executable code (it groups instructions under a name); all other pseudo-ops do not generate executable instructions."
  - type: choice
    prompt: "What is the difference between **EQU** and **SET**?"
    options: ["SET can redefine the symbol to another value later; EQU defines it once", "EQU can be redefined; SET cannot", "They are identical", "SET reserves memory"]
    answer: 0
    explain: "SET is like EQU except that a SET symbol may be redefined later on; compilers make use of it. EQU is like #define in C."
card:
  front: "List the 68000 assembler directives and what each does."
  back: "ORG: where code is assembled to run. EQU: symbolic constant (like #define). SET: like EQU but redefinable. REG: register list for MOVEM. DC: define constants (DC.B can hold ASCII). DCB: block of the same value. DS: uninitialised storage. END: end of source and start address for the loader. OPT: assembler options. MACRO: groups instructions (generates code)."
glossary:
  - { term: "Pseudo-op (directive)", def: "An instruction to the assembler itself; it does not generate an executable instruction (except MACRO)." }
  - { term: "EQU", def: "Equate: gives a symbolic name to a constant; the assembler substitutes the value wherever the label appears." }
---

## Learn

**Pseudo-ops** (assembler **directives**) tell the assembler how to assemble and load the program. They do **not** generate executable instructions, except `MACRO`.

| Directive | Meaning |
|---|---|
| `ORG <expr>` | Where the code will execute in memory; resolves address references |
| `label EQU <expr>` | Symbolic name for a constant (like `#define`); replaced at assembly time |
| `label SET <expr>` | Like EQU, but may be redefined later |
| `label REG <list>` | A register list such as `A0-A3/A5/D0-D7`, used only with `MOVEM` |
| `DC.<size> a,b,c` | Define constants; `DC.B` also takes ASCII in quotes: `DC.B 'Error',$0D,$0A,0` |
| `DCB.<size> n,value` | Define a block of n copies of a value: `DCB.B 100,$AA` |
| `DS.<size> n` | Define storage: n uninitialised units: `DS.L 200` is 800 bytes |
| `END <address>` | End of source; the address tells the **loader** where to put the code |
| `OPT ...` | Assembler options (CRE cross-reference, BRB/BRW 8/16-bit branches, MEX macro expansion) |
| `MACRO ... ENDM` | A named group of instructions; `\1` is a parameter |

**ORG and END are complementary**: ORG tells the assembler how to resolve addresses; END tells the loader where to put the code. A label equated with EQU does not use any memory.

The oracle check at the top of this concept assembles and runs a program that uses EQU, DCB, DC.B and DS together.

## Worked example

*Define a 3-byte message "Hi" ending in 0, then a 2-long-word buffer.*

1. `MSG   DC.B  'Hi',0`: the bytes $48 $69 $00.
2. `BUF   DS.L  2`: reserves 2 x 4 = 8 uninitialised bytes right after.
3. Neither line produces an executable instruction; they only place data.

## Try it

*Without directives, the lecture shows `MOVE.B #%01011100,D4`. How does EQU improve it?*

???

Define `testData1 EQU %01011100` once and write `MOVE.B #testData1,D4`: the value gets a meaningful name and changes in one place.
