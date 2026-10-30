---
track: m68k
title: "Mode 7: PC-relative addressing"
summary: "The operand's address is the program counter plus an offset, so code can be relocated."
needs: [m68k-absolute-immediate, m68k-displacement-index]
sources:
  - { type: slide, ref: "L5 s221", quote: "Very important for generating relocatable code" }
  - { type: slide, ref: "L5 s221", quote: "EA = (PC) + d16" }
  - { type: slide, ref: "L5 s221", quote: "EA = (PC) + (Xn) + d8" }
  - { type: oracle, ref: "the PC-relative program below is run on the 68000 core" }
programs:
  - cpu: m68k
    name: "table read through the program counter"
    source: |
      * program
              ORG     $1000
      START   MOVE.L  #1,D1
              MOVE.B  (table,PC),D0
              MOVE.B  (table,PC,D1.W),D2
              SIMHALT
      table   DC.B    $11,$22,$33
              END     START
    expect:
      regs: { D0: 0x11, D2: 0x22 }
checks:
  - type: choice
    prompt: "What is the effective address in **PC with displacement**?"
    options: ["(PC) + d16", "(An) + d16", "(PC) + (Xn) + d8", "d16 alone"]
    answer: 0
    explain: "Subclass 2 adds a signed 16-bit displacement to the program counter. Subclass 3 (PC with index) is (PC) + (Xn) + d8."
  - type: choice
    prompt: "Why is PC-relative addressing important?"
    options: ["It makes relocatable code: you need not load an address register with a fixed address each time", "It is the fastest mode", "It works with absolute addresses", "It replaces the stack"]
    answer: 0
    explain: "The operand's address is relative to where the instruction is, so the code works wherever it is loaded. Branches are PC-relative for the same reason."
  - type: choice
    prompt: "PC-relative addressing is the same family as which type of instruction?"
    options: ["Branches (the destination is the PC plus a signed displacement)", "Moves to the stack", "Interrupts only", "Immediate arithmetic"]
    answer: 0
    explain: "A branch adds a two's complement displacement (sign-extended) to the current PC, independent of where the code sits in memory."
card:
  front: "What are the PC-relative modes and why use them?"
  back: "Mode 7 subclass 2: EA = (PC) + d16. Subclass 3: EA = (PC) + (Xn) + d8. They give relocatable code (no address register needs initialising) and work like branches."
glossary:
  - { term: "Relocatable code", def: "Code that works at any load address, because its references are relative to the PC." }
---

## Learn

PC-relative modes are like the register modes with the **program counter** instead of an address register:

- **Subclass 2, PC with displacement**: a signed 16-bit displacement is added to the PC. **EA = (PC) + d16**. Very important for **relocatable code**.
- **Subclass 3, PC with index**: the PC plus an index register (A0-A6 or D0-D6) plus an 8-bit displacement. **EA = (PC) + (Xn) + d8**.

Because the address is relative to where the instruction is, there is no need to initialise an address register each time the code runs, and the program works wherever it is loaded. **Branches** are the same idea: the destination is the PC plus a signed displacement.

In source you write a label and let the assembler compute the displacement: `MOVE.B (table,PC),D0` and `MOVE.B (table,PC,D1.W),D2`. PC-relative addressing can be used only to **read** operands (it is not a destination mode on the 68000).

## Worked example

*A table `$11,$22,$33` sits after the code. Read the second element with PC-relative indexing.*

1. `MOVE.L #1,D1` sets the index.
2. `MOVE.B (table,PC,D1.W),D2` computes PC + index + displacement to land on table[1].
3. D2 = $22. (The program above is run and the register is asserted.)

## Try it

*Which is more relocatable: `MOVE.B $2000,D0` or `MOVE.B (table,PC),D0`?*

???

`MOVE.B (table,PC),D0`. The absolute form hard-codes the address $2000; the PC-relative form only depends on the distance from the instruction to the table.
