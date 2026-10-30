---
track: z80
title: "LD: copying data on the Z80"
summary: LD copies too, but writes the destination first; (HL) uses a register pair as a pointer.
needs: [assembly-intro.machine-and-assembly, programmers-model.z80-registers]
sources:
  - { type: slide, ref: "L4 s186", quote: "Copy the byte from register A to the memory" }
  - { type: slide, ref: "L4 s186", quote: "Put the contents of memory address 1234H in A" }
  - { type: oracle, ref: "the LD program below is run on the Z80 core" }
programs:
  - cpu: z80
    name: "the lecture's three LD forms"
    source: |
      ; program
              .ORG 0100H
      START:  LD C,5AH
              LD A,C
              LD [1234H],A
              LD HL,1240H
              LD A,0A5H
              LD [HL],A
              LD A,[1234H]
              LD B,A
              HALT
              .END
    expect:
      regs: { a: 0x5A, b: 0x5A, c: 0x5A }
      mem: { 4660: [0x5A], 4672: [0xA5] }
checks:
  - type: choice
    prompt: "What does `LD A,C` do?"
    options: ["Copies the byte in C into A", "Copies A into C", "Loads the address of C", "Adds C to A"]
    answer: 0
    explain: "The Z80 writes the destination first: LD A,C copies register C into register A. C is unchanged."
  - type: choice
    prompt: "What does `LD (HL),A` do?"
    options: ["Copies A into the memory location whose address is in HL", "Copies HL into A", "Loads HL with A", "Copies memory into A"]
    answer: 0
    explain: "The parentheses (or brackets in Oshonsoft style) mean 'the memory location pointed to by HL'; the byte in A is stored there."
  - type: choice
    prompt: "What does `LD A,(1234H)` do?"
    options: ["Puts the contents of memory address 1234H into A", "Puts the number 1234H into A", "Stores A at 1234H", "Jumps to 1234H"]
    answer: 0
    explain: "With parentheses around the number, it is a memory address (absolute addressing). Without them (`LD A,12H`) the value itself is loaded."
  - type: choice
    prompt: "Which pair of instructions does the **same job**: copy a byte from the source register to the destination?"
    options: ["MOVE.B D0,D1 (68000) and LD B,A (Z80)", "MOVE.B D0,D1 and LD A,B", "MOVE.B D1,D0 and LD B,A", "They differ"]
    answer: 0
    explain: "The lecture pairs them: the 68000 copies D0 to D1 (source first); the Z80 copies A to B (destination first). The roles of the registers are different, but each copies a byte."
card:
  front: "How does Z80 LD compare with 68000 MOVE?"
  back: "Both copy and leave the source unchanged. Z80 writes the destination first: LD A,C (C to A), LD A,(1234H) (memory to A), LD (HL),A (A to memory at HL). The 68000 writes the source first: MOVE.B D0,D1."
glossary: []
bridge:
  to: assembly-programs.m68k-move
  same: "Both copy rather than move; both can copy register to register, memory to register and register to memory; parentheses mean 'the memory at this address'."
  different: "Operand order is reversed (Z80: destination first). The Z80 needs A for many memory forms, has no size suffix (LD is 8-bit, with 16-bit pair loads separate), and writes hex as 1234H."
  why: "The 68000 is a 32-bit orthogonal design with sizes in the instruction; the Z80 is an 8-bit design with a special accumulator and register pairs."
---

## Learn

**Callback.** `MOVE` copied data on the 68000. On the Z80 the instruction is **LD** ("load"), and it also **copies**. The big difference is operand order: **destination first**.

- `LD A,C` copies the byte from C into A.
- `LD A,(1234H)` puts the contents of memory address 1234H into A.
- `LD (HL),A` copies A into the memory location pointed to by HL.

The Oshonsoft assembler accepts brackets as well: `LD A,[HL]`. There is no size suffix: 8-bit loads are `LD r,r'`, and 16-bit loads use register pairs (`LD HL,1240H`).

Compare with the lecture's pairs: `MOVE.B D0,D1` copies D0 to D1; `LD B,A` copies A to B.

## Worked example

*Copy the byte at address 1234H into B, using only A as the go-between.*

1. `LD A,(1234H)`: memory to A.
2. `LD B,A`: A to B.
3. Both copy; the memory byte is not changed. (The program above does the same and is run on the Z80 core.)

## Try it

*Translate `MOVE.B D2,$3000` into a Z80 instruction that stores a byte from A at address 3000H.*

???

`LD (3000H),A`: destination (the memory address) first, source (A) second.
