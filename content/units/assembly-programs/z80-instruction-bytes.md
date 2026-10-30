---
track: z80
title: "Z80 machine code: opcode bytes and the direction of the operation"
summary: A Z80 instruction starts with an opcode byte; the Z80 writes destination first, the 68000 source first.
needs: [assembly-intro.machine-and-assembly, programmers-model.z80-registers]
sources:
  - { type: slide, ref: "L4 s175", quote: "the first byte (8-bits) of a Z80 instruction is called the Opcode" }
  - { type: slide, ref: "L4 s189", quote: "Z80: destination ← destination + source" }
  - { type: slide, ref: "L4 s185", quote: "Z80: Copies a byte from A to B" }
  - { type: oracle, ref: "the Z80 assembler (checked against z80dasm) reproduces each encoding below" }
encodings:
  - { cpu: z80, asm: "ADD A,22H", hex: "C6 22" }
  - { cpu: z80, asm: "LD A,C", hex: "79" }
  - { cpu: z80, asm: "LD B,A", hex: "47" }
  - { cpu: z80, asm: "CP D", hex: "BA" }
checks:
  - type: choice
    prompt: "What is the **first byte** of a Z80 instruction called?"
    options: ["The opcode", "The op-code word", "The prefix word", "The operand"]
    answer: 0
    explain: "The first 16 bits of a 68000 instruction are the op-code word; the first 8 bits of a Z80 instruction are the opcode. Extra bytes follow for immediate data or addresses."
  - type: choice
    prompt: "`ADD A,n` with A = 33H and n = 22H leaves what in A, and assembles to what bytes?"
    options: ["A = 55H; C6 22", "A = 22H; 22 C6", "A = 11H; C6 22", "A = 55H; 33 22"]
    answer: 0
    explain: "A + n = 33H + 22H = 55H, and the encoding is the opcode C6 followed by the immediate byte 22 (the lecture's own example)."
  - type: choice
    prompt: "Which way does the **operation direction** go on each processor?"
    options: ["68000: source + destination goes to destination. Z80: destination = destination + source (written destination first)", "Both write the source first", "Both write the destination first", "The Z80 has no direction"]
    answer: 0
    explain: "The lecture: the direction of the operation is opposite the 68K. In 68K assembly the source comes first (ADD.B D0,D1 adds D0 into D1). In Z80 assembly the destination comes first (ADD A,D, LD B,A)."
card:
  front: "How does Z80 machine code and operand order differ from the 68000?"
  back: "Z80: opcode byte(s), then immediate bytes (ADD A,22H = C6 22). Operand order is destination, source (LD B,A copies A into B). 68000: op-code word then extension words, operand order is source, destination (MOVE.B D0,D1 copies D0 into D1)."
glossary:
  - { term: "Opcode (Z80)", def: "The first byte of a Z80 instruction; it identifies the operation." }
bridge:
  to: assembly-programs.m68k-instruction-words
  same: "Both start with a field that says what the instruction is (and how much more follows), then carry any immediate data or address."
  different: "The Z80 instruction starts with a single opcode byte and can be 1 to 4 bytes; the 68000's is a 16-bit op-code word and instructions are 2 to 10 bytes. The Z80 writes the destination first, the 68000 the source first."
  why: "The Z80 is a byte-oriented 8-bit design, while the 68000 is 16/32-bit: its instruction stream is made of 16-bit words."
---

## Learn

**Callback.** In the 68000 lesson an instruction began with a 16-bit op-code word. On the Z80 the first **byte** is the **opcode**, and it holds all the information needed to decode the rest. The lecture's example: `ADD A,n` adds an 8-bit number n to the accumulator and puts the result in A. With A = 33H and n = 22H, afterwards A = 55H. The machine code is **C6 22**.

Z80 code that you will see on the exam as pairs with the 68000:

| 68000 | Z80 | Meaning |
|---|---|---|
| `MOVE.B D0,D1` | `LD B,A` | 68000 copies D0 to D1; Z80 copies A to B |
| `CMP.B D0,D1` | `CP D` | 68000 compares the byte values in D0 and D1; Z80 compares register D with A |
| `BEQ Label` | `JR Z,Label` | both branch to Label if the Zero flag is true |

**Direction.** On the 68000 the **source comes first** (source + destination goes to destination). On the Z80 the **destination comes first** (destination = destination + source). Also note that the Z80 can use **A only** for arithmetic and logic.

## Worked example

*Which register ends up changed by `LD B,A`, and by `MOVE.B D0,D1`?*

1. `LD B,A`: destination is first, so **B** is overwritten with A.
2. `MOVE.B D0,D1`: source is first, so **D1** is overwritten with D0.
3. Reading order is reversed between the processors.

## Try it

*What is the machine code for `LD A,C`?*

???

**79** (one byte; checked with the Z80 assembler). Register-to-register loads are a single opcode byte.
