---
track: m68k
title: "68000 machine code: the op-code word and extension words"
summary: Every instruction is at least one 16-bit op-code word; operands and addresses add extension words (up to five words in the lecture's examples).
needs: [assembly-intro.machine-and-assembly, programmers-model.m68k-registers]
sources:
  - { type: slide, ref: "L4 s152", quote: "Every 68000 instruction is at least 16-bits long" }
  - { type: slide, ref: "L4 s152", quote: "Op-code word tells the processor how many more words are contained in the instruction" }
  - { type: slide, ref: "L4 s153", quote: "Instruction requiring five words" }
  - { type: oracle, ref: "the 68000 assembler (tested against a real EASy68K) reproduces every encoding below" }
encodings:
  - { cpu: m68k, asm: "NOP", hex: "4E71" }
  - { cpu: m68k, asm: "MOVE.B D0,D3", hex: "1600" }
  - { cpu: m68k, asm: "ADD.L D4,D7", hex: "DE84" }
  - { cpu: m68k, asm: "ADDI.W #$4000,D5", hex: "0645 4000" }
  - { cpu: m68k, asm: "MOVE.W (A6),$4000A000", hex: "33D6 4000 A000" }
  - { cpu: m68k, asm: "ADDI.W #$AA55,$5A33A706", hex: "0679 AA55 5A33 A706" }
  - { cpu: m68k, asm: "MOVE.B $AA550000,$5A33A706", hex: "13F9 AA55 0000 5A33 A706" }
  - { cpu: m68k, asm: "MOVE.W $0A550000,$1000BB00", hex: "33F9 0A55 0000 1000 BB00" }
checks:
  - type: choice
    prompt: "What is the **shortest** a 68000 instruction can be?"
    options: ["16 bits (one op-code word)", "8 bits", "32 bits", "One byte plus a prefix"]
    answer: 0
    explain: "Every 68000 instruction is at least 16 bits long. The first 16 bits, the op-code word, hold everything needed to start decoding and tell the processor how many more words follow."
  - type: choice
    prompt: "`MOVE.B D0,D3` assembles to `$1600`. How many words long is it?"
    options: ["1 word (just the op-code word)", "2 words", "3 words", "It depends on D0"]
    answer: 0
    explain: "Register-to-register instructions fit in the op-code word alone: NOP = $4E71, MOVE.B D0,D3 = $1600, ADD.L D4,D7 = $DE84."
  - type: choice
    prompt: "`ADDI.W #$4000,D5` assembles to `$0645 $4000`. What is the second word?"
    options: ["The immediate data $4000", "The address of D5", "The size field", "A checksum"]
    answer: 0
    explain: "The first word is the op-code word (add immediate, word size, destination D5). The immediate value follows as an extension word."
  - type: choice
    prompt: "`MOVE.W $0A550000,$1000BB00` assembles to `$33F9 $0A55 $0000 $1000 $BB00`. What do the last four words hold?"
    options: ["The 32-bit source address, then the 32-bit destination address", "Four data values", "The register contents", "Four copies of the op-code"]
    answer: 0
    explain: "Absolute operands exactly specify the memory addresses: source high word $0A55, source low word $0000, destination high word $1000, destination low word $BB00. The op-code word $33F9 says MOVE.W with both operands absolute long."
card:
  front: "How is a 68000 instruction laid out in memory?"
  back: "At least one 16-bit op-code word (operation, size, addressing modes), then extension words for immediate data or absolute addresses (high word first). Examples: NOP $4E71; MOVE.B D0,D3 $1600; ADD.L D4,D7 $DE84; ADDI.W #$4000,D5 $0645 $4000."
glossary:
  - { term: "Op-code word", def: "The first 16 bits of a 68000 instruction; it holds the operation, size and addressing modes and tells the processor how many words follow." }
---

## Learn

Every 68000 instruction is **at least 16 bits** long. The first word is the **op-code word**: it holds the operation, and the addressing modes for the source and destination operands, and it tells the processor how many more words belong to the instruction. Extra words carry immediate data or absolute addresses (high word first).

| Assembly | Machine code | Words |
|---|---|---|
| `NOP` | `$4E71` | 1 |
| `MOVE.B D0,D3` | `$1600` | 1 |
| `ADD.L D4,D7` | `$DE84` | 1 |
| `ADDI.W #$4000,D5` | `$0645 $4000` | 2 |
| `MOVE.W (A6),$4000A000` | `$33D6 $4000 $A000` | 3 |
| `ADDI.W #$AA55,$5A33A706` | `$0679 $AA55 $5A33 $A706` | 4 |
| `MOVE.B $AA550000,$5A33A706` | `$13F9 $AA55 $0000 $5A33 $A706` | 5 |

Every encoding in this table is checked by assembling the line with this site's 68000 assembler.

Instruction length is why the 68000 is CISC: it varies from 2 bytes up to 10.

## Worked example

*How many bytes is `MOVE.W $0A550000,$1000BB00`?*

1. Op-code word `$33F9`: 2 bytes.
2. Source absolute long address: 2 words = 4 bytes.
3. Destination absolute long address: 4 bytes.
4. Total: 2 + 4 + 4 = **10 bytes**, five words.

## Try it

*How many bytes is `ADDI.W #$AA55,$5A33A706`?*

???

Op-code word `$0679` (2 bytes), immediate word `$AA55` (2 bytes), absolute long address `$5A33 $A706` (4 bytes): **8 bytes**, four words.
