---
track: m68k
title: "Mode 7: absolute and immediate addressing"
summary: "Absolute names the exact address (avoid it); immediate puts a number in the instruction (# prefix, source only)."
needs: [m68k-post-pre]
sources:
  - { type: slide, ref: "L5 s216", quote: "Prevents code from being relocated" }
  - { type: slide, ref: "L5 s217", quote: "The range $008000..$FF7FFF cannot be reached" }
  - { type: slide, ref: "L5 s219", quote: "Immediate addressing can be only be used to specify a source operand" }
  - { type: slide, ref: "L5 s220", quote: "Some assemblers, but not all assemblers, will allow" }
  - { type: oracle, ref: "the encodings below are assembled with the 68000 assembler" }
encodings:
  - { cpu: m68k, asm: "CLR.B $00001234.L", hex: "4239 0000 1234" }
  - { cpu: m68k, asm: "CLR.W $00001234.L", hex: "4279 0000 1234" }
  - { cpu: m68k, asm: "MOVE.B #24,D0", hex: "103C 0018" }
  - { cpu: m68k, asm: "MOVE.B #$24,D0", hex: "103C 0024" }
  - { cpu: m68k, asm: "ADDI.W #$5000,D6", hex: "0646 5000" }
  - { cpu: m68k, asm: "ADD.W #$5000,D6", hex: "0646 5000" }
checks:
  - type: choice
    prompt: "A 16-bit **absolute short** address `$A3C0` is sign-extended to what 32-bit address?"
    options: ["$FFFFA3C0", "$0000A3C0", "$FF00A3C0", "$A3C00000"]
    answer: 0
    explain: "The top bit of the 16-bit address is 1, so it is sign-extended with ones: $FFFFA3C0. That is why the short form covers only $000000-$007FFF and $FF8000-$FFFFFF, and cannot reach $008000-$FF7FFF."
  - type: choice
    prompt: "Why does the lecture say to **avoid absolute addressing**?"
    options: ["It prevents code from being relocated, slows the processor and takes extra memory", "It does not work with data registers", "It is illegal", "It only works for bytes"]
    answer: 0
    explain: "Absolute addressing needs extra fetches (the address words), so it is slower and bigger, and it ties code to fixed addresses, which prevents relocation. Use address registers for repeatedly used addresses."
  - type: choice
    prompt: "What does `MOVE.B #$24,D0` put in D0, and how does it differ from `MOVE.B #24,D0`?"
    options: ["$24 (decimal 36) versus decimal 24 ($18)", "Both put $24", "Both put 24 decimal", "The first is an error"]
    answer: 0
    explain: "The # marks an immediate (literal) value; the $ marks hex. #$24 is $24 = 36, while #24 is decimal 24 = $18."
  - type: choice
    prompt: "Where can **immediate** addressing be used?"
    options: ["Only for a source operand", "Only for a destination", "For either", "Only in branches"]
    answer: 0
    explain: "Immediate addressing can only specify a source: you cannot store a value into a number. It is mainly used to initialise registers and memory."
  - type: choice
    prompt: "`ADD.W #$5000,D6` and `ADDI.W #$5000,D6` give which machine code on EASy68K?"
    options: ["The same: $0646 $5000; EASy68K converts ADD to ADDI", "Different codes", "ADD.W is an error on every assembler", "$D646"]
    answer: 0
    explain: "Other than MOVE, immediate is hard coded into a separate instruction (ADDI, SUBI, CMPI, ORI). EASy68K allows the plain form and converts it, but the lecture recommends against it because other assemblers may reject it."
card:
  front: "Summarise absolute and immediate addressing on the 68000."
  back: "Absolute word (short): 16-bit address sign-extended, reaches only $000000-$007FFF and $FF8000-$FFFFFF; 'evil'. Absolute long: full 32-bit address. Both slow and non-relocatable. Immediate: #value, source only, mostly to initialise; instructions other than MOVE have their own immediate forms (ADDI, SUBI, CMPI, ORI)."
glossary:
  - { term: "Immediate addressing", def: "The operand is a number stored in the instruction itself, written with a # prefix; also called a literal." }
---

## Learn

**Mode 7 is a group of "special" modes**; its register field is a *subclass*: 0 = absolute word, 1 = absolute long, 2 = PC with displacement, 3 = PC with index, 4/5 = immediate.

**Absolute (direct) addressing** gives the exact address in the instruction. It needs extra fetches, so it is slow, takes extra memory and prevents code from being relocated. It is rarely used with high-level languages.

- **Absolute word (subclass 0)**: a 16-bit address, **sign-extended** to 32 bits. `$A3C0` becomes `$FFFFA3C0`. It reaches only **$000000-$007FFF** and **$FF8000-$FFFFFF**, never $008000-$FF7FFF. The lecture calls it **evil**: a source of many coding errors.
- **Absolute long (subclass 1)**: a 32-bit address, `MOVE.B D0,($00001234).L`. `OPT FRL` forces long forms everywhere.
- Rule of thumb: if an address is used repeatedly, load it into an address register.

**Immediate addressing** puts a number in the instruction (a *literal*), marked by **#**: `MOVE.B #24,D0` (decimal 24) versus `MOVE.B #$24,D0` (hex $24 = 36). It can only be a **source**. Use it once to initialise, not continually. For instructions other than MOVE the immediate form is its own instruction: `ADDI`, `SUBI`, `CMPI`, `ORI`.

A slide-accuracy note: the lecture shows `CLR.B $00001234 -> $4279 $0000 $1234`. By assembling it, `$4279 $0000 $1234` is the encoding of **`CLR.W`** with a long absolute address; `CLR.B $00001234.L` is `$4239 $0000 $1234`. Without `.L`, the assembler uses the short form `$4238 $1234` because the address fits in 16 bits.

## Worked example

*Which addresses can `MOVE.B D0,($7000).W` and `MOVE.B D0,($9000).W` reach?*

1. $7000: top bit 0, so it stays $00007000, inside $000000-$007FFF. OK.
2. $9000: top bit 1, so it becomes **$FFFF9000**, inside $FF8000-$FFFFFF. It does **not** reach $00009000.
3. This is the trap: a short address can silently mean the top of memory.

## Try it

*Is `MOVE.B D0,#$12` legal?*

???

**No.** Immediate addressing can only be a source operand; you cannot store into a literal.
