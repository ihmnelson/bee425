---
track: shared
title: "Homework 4, problem 1: chip enables for two ROMs and two RAMs"
summary: "Chip depth sets the offset lines; the remaining high lines (A19 down to the chip's top line) decide each ~CE."
needs: ["memory-decoding.pages-and-offsets", "memory-decoding.chip-select"]
sources:
  - { type: handout, ref: "hw4 P1", quote: "produces the chip enable signals" }
  - { type: handout, ref: "hw4 P1", quote: "Assume that the processor outputs a 20-bit address" }
  - { type: own, ref: "address ranges from the homework table; decode patterns worked out by hand (calc)" }
checks:
  - type: choice
    prompt: "A 128 KB ROM (2^17 bytes) sits on a processor with a 20-bit address bus. Which address lines go straight to the ROM's address pins, and which go to the chip-enable logic?"
    options: ["A0-A16 to the ROM; A17-A19 to the logic", "A0-A19 to the ROM; none to the logic", "A0-A17 to the ROM; A18-A19 to the logic", "A0-A15 to the ROM; A16-A19 to the logic"]
    answer: 0
    explain: "2^17 = 128K locations, so 17 offset lines (A0-A16) address the chip. The 3 remaining lines, A17-A19, say which block of the 1 MB space is being addressed."
  - type: choice
    prompt: "ROM 1 occupies 00000H-1FFFFH and ROM 2 occupies 20000H-3FFFFH. Which values of A19 A18 A17 make ROM 2's ~CE go low?"
    options: ["0 0 1", "0 1 0", "1 0 0", "0 0 0"]
    answer: 0
    explain: "20000H = 0010 0000 0000 0000 0000, so A19 A18 A17 = 0 0 1 for the whole range 20000H-3FFFFH. 0 0 0 is ROM 1 (00000H-1FFFFH)."
  - type: choice
    prompt: "A 64 KB RAM occupies 90000H-9FFFFH. Which values of A19 A18 A17 A16 select it?"
    options: ["1 0 0 1", "1 0 0 0", "0 1 1 0", "1 0 1 1"]
    answer: 0
    explain: "90000H = 1001 0000 0000 0000 0000, and 64 KB = 2^16 uses A0-A15 as offset, so the page lines A19-A16 are 1001. 1000 is the other RAM (80000H-8FFFFH)."
  - type: choice
    prompt: "The two 64 KB RAMs sit at 80000H-8FFFFH and 90000H-9FFFFH. Which single address line tells them apart?"
    options: ["A16", "A15", "A17", "A19"]
    answer: 0
    explain: "Both have A19 A18 A17 = 1 0 0. Only A16 differs: 0 for the RAM at 80000H, 1 for the RAM at 90000H."
  - type: choice
    prompt: "Why does every ~CE circuit in this design also take the processor's address-valid signal as an input?"
    options: ["So no chip is enabled while the address lines are still settling", "To give each chip a different supply voltage", "To make the ROMs and RAMs share one ~CE", "To change the size of each memory chip"]
    answer: 0
    explain: "The address lines can hold garbage between cycles. Qualifying every ~CE with address-valid keeps all four chips disabled until the address is stable."
card:
  front: "Homework 4, P1: how do you build the ~CE for each of ROM 00000-1FFFF, ROM 20000-3FFFF, RAM 80000-8FFFF and RAM 90000-9FFFF (20-bit address)?"
  back: "ROMs (2^17 bytes): offset A0-A16, decode A19 A18 A17: ROM1 = 000, ROM2 = 001. RAMs (2^16 bytes): offset A0-A15, decode A19-A16: RAM1 = 1000, RAM2 = 1001. Each ~CE = a gate that goes low only when its pattern matches and address-valid is true (NAND of true and inverted address bits)."
glossary: []
---

## Learn

**Problem 1** gives four memory parts on a processor with a 20-bit address bus (1 MB space) and asks for the logic that turns address lines into the four ~CE signals.

| Part | Size | Low | High | Offset lines | Decode lines | Pattern |
|---|---|---|---|---|---|---|
| ROM 1 | 128 KB (2^17) | 00000H | 1FFFFH | A0-A16 | A19 A18 A17 | 0 0 0 |
| ROM 2 | 128 KB (2^17) | 20000H | 3FFFFH | A0-A16 | A19 A18 A17 | 0 0 1 |
| RAM 1 | 64 KB (2^16) | 80000H | 8FFFFH | A0-A15 | A19 A18 A17 A16 | 1 0 0 0 |
| RAM 2 | 64 KB (2^16) | 90000H | 9FFFFH | A0-A15 | A19 A18 A17 A16 | 1 0 0 1 |

Each chip's low address lines connect directly to its address pins. Each ~CE is low only when **every** decode line matches the pattern **and** the address is valid. With a NAND gate, put an inverter on each line that must be 0:

```
~CE_ROM1 = NAND( /A19, /A18, /A17, valid )
~CE_ROM2 = NAND( /A19, /A18,  A17, valid )
~CE_RAM1 = NAND(  A19, /A18, /A17, /A16, valid )
~CE_RAM2 = NAND(  A19, /A18, /A17,  A16, valid )
```

The two RAMs share A19-A17 and differ only in A16; the two ROMs differ only in A17. Addresses 40000H-7FFFFH and A0000H-FFFFFH select nothing.

## Worked example

*A 32 KB RAM must occupy 60000H-67FFFH on the same 20-bit bus. Which lines decode it, and what pattern?*

1. 32 KB = 2^15, so A0-A14 are offset lines.
2. The decode lines are A19-A15 (5 lines).
3. 60000H = 0110 0000 0000 0000 0000, so A19-A15 = 0 1 1 0 0.
4. ~CE = NAND( /A19, A18, A17, /A16, /A15, valid ).

## Try it

*Write the pattern on A19-A16 for a 64 KB part at A0000H-AFFFFH.*

???

A0000H = 1010 0000 ..., so A19 A18 A17 A16 = **1 0 1 0** (A0-A15 are the offset).
