---
track: m68k
title: Number notation in 68000 assembly
summary: $ for hex, % for binary, @ for octal, no symbol for decimal.
needs: [programmers-model]
sources:
  - { type: slide, ref: "L3 s143", quote: "Hexadecimal: Number begins with “$”" }
  - { type: slide, ref: "L3 s143", quote: "Binary: Number begins with “%”" }
checks:
  - type: choice
    prompt: "How do you write the hexadecimal number AF56 in 68000 assembly?"
    options: ["$AF56", "AF56H", "0xAF56", "%AF56"]
    answer: 0
    explain: "The 68K assembler uses a leading $ for hexadecimal. (AF56H is Z80 style; 0xAF56 is C style; % means binary.)"
  - type: choice
    prompt: "What does `%10101100` mean in 68000 assembly?"
    options: ["A binary number", "A hexadecimal number", "A decimal number", "A comment"]
    answer: 0
    explain: "A leading % marks binary, $ marks hex, and @ marks octal; plain digits are decimal (this is assembler dependent)."
  - type: choice
    prompt: "In 68000 assembly, what marks an **octal** number?"
    options: ["@", "$", "%", "o"]
    answer: 0
    explain: "Octal numbers begin with @ in the lecture's assembler. Notation is assembler dependent."
card:
  front: "68000 assembly number prefixes?"
  back: "$ hex ($AF56, $55), % binary (%10101100), @ octal, no symbol for decimal. (Assembler dependent.)"
glossary: []
---

## Learn

In the lecture's 68000 assembler, the **base** of a number is shown by a **prefix**:

| Base | Prefix | Example |
|---|---|---|
| Hexadecimal | **$** | `$AF56`, `$55` |
| Binary | **%** | `%10101100` |
| Octal | **@** | |
| Decimal | none | `255` |

Notation is **assembler dependent**. In C or C++, hex uses `0x` and binary `0b`; on the Z80 hex ends with `H`. A `#` in front of an operand (as in `MOVE.B #$55,D7`) means an **immediate** value, a separate idea from the base.

## Worked example

*Write 255 in all three 68000 bases.*

1. Decimal: `255`.
2. Hex: 255 = 15 x 16 + 15 = `$FF`.
3. Binary: `%11111111`.

## Try it

*What decimal value is `$1A`?*

???

$1A = 1 x 16 + 10 = **26**.
