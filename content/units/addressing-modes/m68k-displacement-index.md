---
track: m68k
title: "Modes 5 and 6: displacement and index"
summary: "An + d16 reaches a field of a structure; An + Xn + d8 reaches an element of a 2-D array."
needs: [m68k-post-pre]
sources:
  - { type: slide, ref: "L5 s212", quote: "A 16-bit, two’s complement displacement (offset)" }
  - { type: slide, ref: "L5 s213", quote: "Address register indirect with index" }
  - { type: slide, ref: "L5 s214", quote: "Index = 23 x 50 x 4 = 4600 = $11F8" }
  - { type: oracle, ref: "the array example below is run on the 68000 core" }
encodings:
  - { cpu: m68k, asm: "MOVE.W D0,($1300,A3)", hex: "3740 1300" }
  - { cpu: m68k, asm: "MOVE.L ($2C,A0,D0.L),D3", hex: "2630 082C" }
programs:
  - cpu: m68k
    name: "element at row 23, column 11 of a 50 x 50 long word array"
    source: |
      * program
              ORG     $1000
      START   LEA     $00004000,A0
              MOVE.L  #$CAFE0001,($00004000+4600+44).L
              MOVE.L  #4600,D0
              MOVE.L  ($2C,A0,D0.L),D3
              SIMHALT
              END     START
    expect:
      regs: { D3: 0xCAFE0001 }
checks:
  - type: choice
    prompt: "`A5 = $00BC9A00` and the 16-bit displacement is `$3AE4`. What is the effective address of `($3AE4,A5)`?"
    options: ["$00BCD4E4", "$00BC9A00", "$00003AE4", "$00BCD400"]
    answer: 0
    explain: "Mode 5 adds the sign-extended 16-bit displacement to the address register: $00BC9A00 + $3AE4 = $00BCD4E4."
  - type: choice
    prompt: "In the lecture's array of 50 x 50 long words starting at $4000, which value goes in **D0** (the index register) to reach row 23?"
    options: ["23 x 50 x 4 = 4600 = $11F8", "23 x 50 = 1150", "23 x 4 = 92", "11 x 4 = 44"]
    answer: 0
    explain: "D0 = row number x columns per row x bytes per element = 23 x 50 x 4 = 4600 = $11F8. The column goes in the 8-bit displacement: 11 x 4 = 44 = $2C."
  - type: choice
    prompt: "What is the **size of the displacement** in mode 6 (address register indirect with index), and in mode 5?"
    options: ["Mode 6: 8-bit. Mode 5: 16-bit", "Both 16-bit", "Mode 6: 16-bit. Mode 5: 8-bit", "Both 32-bit"]
    answer: 0
    explain: "Mode 5 (d16,An) uses a 16-bit two's complement displacement; mode 6 (d8,An,Xn) uses an 8-bit two's complement displacement plus an index register A0-A7 or D0-D7."
  - type: choice
    prompt: "Why do compilers like **mode 5** (displacement)?"
    options: ["Each variable is an offset from a pointer such as A5 that points at a data region", "It is the fastest mode", "It avoids needing registers", "It makes code position-dependent"]
    answer: 0
    explain: "Compilers reference variables relative to a pointer: A5 points to a data region and each variable's address is a displacement from <A5>."
card:
  front: "Describe modes 5 and 6 and give the array index formula."
  back: "Mode 5 (d16,An): address = An + sign-extended 16-bit displacement. Mode 6 (d8,An,Xn.W/.L): address = An + Xn + sign-extended 8-bit displacement. For an array: Xn = row x columns x bytes per element; d8 = column x bytes per element."
glossary:
  - { term: "Displacement", def: "A signed offset added to a register to form an address." }
---

## Learn

- **Mode 5, address register indirect with displacement `(d16,An)`**: a **16-bit two's complement** displacement is added to the address register. The displacement may be a number or a label: `MOVE.W D0,($1300,A3)`. Compilers use it to reach variables as offsets from a pointer (A5 points to the data region).
- **Mode 6, address register indirect with index `(d8,An,Xn.L)` or `(d8,An,Xn.W)`**: An + an index register (A0-A7 or D0-D7, used as word or long) + a **two's complement 8-bit displacement**. It suits two-dimensional arrays and linked lists: the address register points to the array start, the index register picks the row, and the displacement picks the element.

The lecture's example: a 50 x 50 array of long words starting at $4000, element (row 23, column 11):

- Index = 23 x 50 x 4 = 4,600 = **$11F8** (in D0).
- Offset = 11 x 4 = 44 = **$2C**.
- `MOVE.L ($2C,D0,A0),D3` (the assembler accepts the register order `($2C,A0,D0.L)`).

The effective address is $4000 + $11F8 + $2C = **$5224**. The program above is run on the core.

## Worked example

*Compute the address of element (row 23, column 11).*

1. Array start = $4000 = 16,384.
2. Row offset = 23 x 50 x 4 = 4,600.
3. Column offset = 11 x 4 = 44.
4. Address = 16,384 + 4,600 + 44 = 21,028 = **$5224**.

## Try it

*A 10-column array of words (2 bytes each) starts at $3000. Find D0 (index) and the d8 for row 4, column 3.*

???

D0 = 4 x 10 x 2 = **80** ($50). d8 = 3 x 2 = **6**. The address is $3000 + 80 + 6 = $3056.
