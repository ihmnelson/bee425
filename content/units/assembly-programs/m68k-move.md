---
track: m68k
title: "MOVE: copying data on the 68000"
summary: MOVE copies (it does not remove); the source comes first and the size is part of the instruction.
needs: [assembly-intro.machine-and-assembly, programmers-model.m68k-registers]
sources:
  - { type: slide, ref: "L4 s186", quote: "MOVE or LOAD is misleading, it means copy" }
  - { type: slide, ref: "L4 s186", quote: "Copy the long word stored in the memory" }
  - { type: oracle, ref: "the MOVE program below is run on the 68000 core" }
programs:
  - cpu: m68k
    name: "the lecture's three MOVE forms"
    source: |
      * program
              ORG     $1000
      START   MOVE.B  #$11,D0
              MOVE.B  D0,D1
              MOVE.W  #$2233,D7
              MOVE.W  D7,$00004000
              LEA     $00004100,A3
              MOVE.L  #$AABBCCDD,(A3)
              MOVE.L  (A3),D4
              SIMHALT
              END     START
    expect:
      regs: { D0: 0x11, D1: 0x11, D4: 0xAABBCCDD }
      mem: { 16384: [0x22, 0x33], 16640: [0xAA, 0xBB, 0xCC, 0xDD] }
checks:
  - type: choice
    prompt: "After `MOVE.B D0,D1`, what is in D0?"
    options: ["Unchanged: MOVE copies, it does not remove the source", "Zero", "The old value of D1", "The sum of both"]
    answer: 0
    explain: "'MOVE' or 'LOAD' is misleading: it means copy. The source stays unchanged; the destination gets a copy of the data."
  - type: choice
    prompt: "In `MOVE.W D7,$004AAA00`, which operand is the **source**?"
    options: ["D7 (the first operand)", "$004AAA00 (the second operand)", "Neither", "Both"]
    answer: 0
    explain: "68000 assembly writes the source first and the destination second: the word in D7 is copied to memory location $004AAA00."
  - type: choice
    prompt: "What does `MOVE.L (A3),D4` do?"
    options: ["Copies the long word stored at the memory address held in A3 into D4", "Copies A3 itself into D4", "Copies D4 into memory", "Adds A3 to D4"]
    answer: 0
    explain: "The parentheses mean 'the memory location pointed to by A3'. A 32-bit long word is read from there into D4."
  - type: choice
    prompt: "What does the **size suffix** (.B, .W, .L) of MOVE control?"
    options: ["How many bits are copied: 8, 16 or 32", "Which register is used", "The addressing mode", "Whether the flags change"]
    answer: 0
    explain: "The size is part of the 68000 instruction: .B = byte (8-bit), .W = word (16-bit), .L = long word (32-bit)."
card:
  front: "What does the 68000 MOVE instruction do, and in what order are its operands?"
  back: "It copies data from the first operand (source) to the second (destination); the source is unchanged. The size suffix .B/.W/.L says how many bits. Examples: MOVE.B D0,D1; MOVE.W D7,$004AAA00; MOVE.L (A3),D4."
glossary: []
---

## Learn

The most frequently used instructions move data between the processor and memory, or between internal registers. **MOVE** (68000) and **LD** (Z80) are misleading names: they **copy**. The source is left unchanged.

68000 forms from the lecture (source first, destination second):

- `MOVE.B D0,D1` copy the byte in D0 to D1.
- `MOVE.W D7,$004AAA00` copy the word from D7 to memory location $004AAA00.
- `MOVE.L (A3),D4` copy the long word at the address pointed to by A3 into D4.

The size is part of the instruction. `#` before a number marks an **immediate** value (`MOVE.B #$55,D7`); `(A3)` means **the memory location whose address is in A3**.

This concept's program is assembled and run on the 68000 core, and the registers and memory it ends with are asserted.

## Worked example

*D0 = $11. After `MOVE.B D0,D1` and `MOVE.W #$2233,D7`, what are D1 and D7?*

1. `MOVE.B D0,D1` copies the low byte: D1's low byte = $11 (the upper bytes of D1 are untouched).
2. `MOVE.W #$2233,D7` loads $2233 into D7's low word.
3. D0 still holds $11.

## Try it

*Write the 68000 instruction that copies the byte in D2 to memory address $3000.*

???

`MOVE.B D2,$3000` (source D2 first, destination the absolute address second).
