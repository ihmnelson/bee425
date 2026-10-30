---
track: m68k
title: "Modes 0 and 1: register direct"
summary: The operand is in a data or address register; fast, compact, and the compiler's favourite.
needs: [m68k-effective-address]
sources:
  - { type: slide, ref: "L5 s201", quote: "Register direct addressing is efficient" }
  - { type: slide, ref: "L5 s201", quote: "External memory does not have to be accessed" }
  - { type: oracle, ref: "the exchange program below is run on the 68000 core" }
programs:
  - cpu: m68k
    name: "exchange D0 and D1 with EXG; add bytes of D3 and D4"
    source: |
      * program
              ORG     $1000
      START   MOVE.L  #$11111111,D0
              MOVE.L  #$22222222,D1
              EXG     D0,D1
              MOVE.B  #$F0,D3
              MOVE.B  #$20,D4
              ADD.B   D3,D4
              SIMHALT
              END     START
    expect:
      regs: { D0: 0x22222222, D1: 0x11111111, D4: 0x10 }
      flags: { C: 1 }
checks:
  - type: choice
    prompt: "Which addressing mode is used for `ADD.B D0,D1`?"
    options: ["Mode 0, data register direct, for both operands", "Mode 1, address register direct", "Mode 2, indirect", "Immediate"]
    answer: 0
    explain: "Mode 0 means the operand is a data register (D0-D7); mode 1 means it is an address register (A0-A7)."
  - type: choice
    prompt: "Why is **register direct** addressing fast?"
    options: ["External memory does not have to be accessed", "It uses fewer instructions", "Registers are slower but cheaper", "It skips the clock"]
    answer: 0
    explain: "The data is already inside the processor, so no memory access is needed; and it takes only three bits in the op-code word to name one of the eight registers."
  - type: choice
    prompt: "After `ADD.B D3,D4` with D3 = $F0 and D4 = $20, what is the low byte of D4 and the carry flag?"
    options: ["$10 with C = 1 (the 8-bit sum wraps past $FF)", "$110 with C = 0", "$10 with C = 0", "$F0 with C = 1"]
    answer: 0
    explain: "$F0 + $20 = $110, which does not fit in a byte. The byte keeps $10 and the carry flag is set (the lecture asks 'what happens if the result is greater than 256?'). Verified by running it."
card:
  front: "What are addressing modes 0 and 1?"
  back: "Mode 0: the operand is a data register (D0-D7). Mode 1: an address register (A0-A7; A7 is also called SP). Fast and compact because no memory access is needed."
glossary: []
---

## Learn

- **Mode 0**: the source or destination is a **data register** (D0 to D7).
- **Mode 1**: it is an **address register** (A0 to A7; A7 may be written SP).

Register direct addressing is **efficient** (only 3 bits in the op-code word name one of 8 registers) and **fast** (external memory does not have to be accessed), so programmers keep frequently used data in registers. Compilers use it for performance, and modern processors have 32 or 64 general registers (the AMD AM29000 had 256).

In-class exercises from the lecture, answered here: exchange D0 and D1 with `EXG D0,D1`; exchange D0-D3 with A0-A3 with four `EXG Dn,An` instructions; add the bytes of D3 and D4 with `ADD.B D3,D4`, and a byte sum above $FF wraps and sets the **carry** flag.

## Worked example

*Add $F0 and $20 as bytes. What happens?*

1. $F0 + $20 = $110: nine bits needed.
2. `ADD.B` keeps only the low 8 bits: **$10**.
3. The ninth bit becomes the **carry flag** (C = 1; X is set the same way). The program above is run to confirm.

## Try it

*Which instruction swaps the contents of D0 and D1 without using a third register?*

???

`EXG D0,D1` (exchange registers). The program at the top does exactly this and the core shows the swapped values.
