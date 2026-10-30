---
track: m68k
title: "Effective addresses: modes 0 to 7"
summary: "The low six bits of the op-code word are a 3-bit mode and a 3-bit register; that is why there are 8 modes and 8 registers."
needs: [assembly-programs.m68k-instruction-words]
sources:
  - { type: slide, ref: "L5 s198", quote: "Each instruction has its own set of permissible addressing modes" }
  - { type: slide, ref: "L5 s199", quote: "The 68K has eight addressing modes, defined as Mode 0" }
  - { type: slide, ref: "L5 s200", quote: "Bits 3-5 = Mode field" }
  - { type: oracle, ref: "the encodings below are assembled with the 68000 assembler" }
encodings:
  - { cpu: m68k, asm: "ADD.B D0,(A0)", hex: "D110" }
  - { cpu: m68k, asm: "MOVEA.W D0,A1", hex: "3240" }
  - { cpu: m68k, asm: "MOVE.W D0,A1", hex: "3240" }
checks:
  - type: choice
    prompt: "Why does the 68000 have exactly **8 addressing modes** and **8 data registers**?"
    options: ["The effective address field is two 3-bit fields: a mode (0-7) and a register (0-7)", "It was chosen for marketing", "The data bus is 8 bits", "There are 8 pins for addresses"]
    answer: 0
    explain: "Bits 3-5 of the op-code word are the mode field and bits 0-2 the register field, each 3 bits wide. 3 bits give 8 values, which is why there are modes 0-7 and registers D0-D7 / A0-A7."
  - type: choice
    prompt: "`ADD.B D0,(A0)` assembles to `$D110`. Which part of the op-code word says the destination is **(A0)**?"
    options: ["The low six bits (010 000): mode 2, register A0", "The top four bits", "The size bits", "The D0 field only"]
    answer: 0
    explain: "$D110 = 1101 0001 0001 0000. The low six bits 010 000 are mode 2 (address register indirect), register 0 (A0). The 1101 at the top means ADD and bits 11-9 hold D0."
  - type: choice
    prompt: "The lecture says `MOVE.W D0,A1` is **illegal** and `MOVEA.W D0,A1` is legal. Why?"
    options: ["MOVE is not permitted to have an address register destination; that is the job of MOVEA", "A1 is read-only", "D0 cannot be a source", "Word size is not allowed"]
    answer: 0
    explain: "Each instruction has its own set of permissible addressing modes. The processor's MOVE does not allow an address register as the destination; MOVEA does. (EASy68K and this site's assembler quietly accept MOVE.W D0,A1 as MOVEA.W D0,A1, and both give $3240, but a different assembler may flag it.)"
  - type: choice
    prompt: "How many words long is `ADD.B D0,(A0)`?"
    options: ["1 (the op-code word is enough)", "2", "3", "It depends on A0"]
    answer: 0
    explain: "Both operands are in registers or register indirect, so no extra words are needed."
card:
  front: "How is an effective address encoded in the 68000 op-code word?"
  back: "In the low six bits: bits 3-5 = mode (0-7), bits 0-2 = register (0-7). Hence 8 modes and 8 registers. Each instruction allows only some modes (MOVE.W D0,A1 is illegal; use MOVEA)."
glossary:
  - { term: "Effective address (EA)", def: "The addressing mode and register that tell the processor where an operand is; the 6-bit field in the op-code word." }
---

## Learn

An instruction's **op-code word** is always 16 bits and holds: what to do (ADD, AND, XOR), the size, where to find the source, where to put the destination, and extra operations such as post-increment or pre-decrement.

The **effective address (EA)** says where an operand is. It is a 6-bit field made of two 3-bit parts:

- bits **3-5**: the **mode** (0 to 7),
- bits **0-2**: the **register** (0 to 7).

That is why there are **8 modes** and **8 data registers** and **8 address registers**.

Example: `ADD.B D0,(A0)` assembles to `$D110`:

```
15 14 13 12 | 11 10 9 | 8 7 6 | 5 4 3 | 2 1 0
 1  1  0  1 |  0  0 0 | 1 0 0 | 0 1 0 | 0 0 0
   ADD      |   D0    | opmode| mode 2| reg 0 (A0)
```

The bit fields do not line up with hex digits, which is why you decode instructions in binary.

**Each instruction has its own set of permitted modes.** For example `MOVE.W D0,D1` is legal; `MOVE.W D0,A1` is not (use `MOVEA.W D0,A1`).

## Worked example

*Decode the low six bits of `$D110`.*

1. `$D110` = 1101 0001 0001 0000. The low six bits are 010000.
2. Bits 5-3 = 010 = **mode 2** (address register indirect).
3. Bits 2-0 = 000 = **register 0** = A0. So the destination is `(A0)`.

## Try it

*An instruction's EA field is 000 101. Which mode and register?*

???

Mode 000 = **0** (data register direct), register 101 = **5**: the operand is **D5**.
