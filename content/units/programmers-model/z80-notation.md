---
track: z80
title: Number notation in Z80 assembly
summary: Hex ends with H and must start with a digit.
needs: [programmers-model]
sources:
  - { type: slide, ref: "L3 s143", quote: "Hexadecimal numbers end with an H" }
  - { type: slide, ref: "L3 s143", quote: "Must put 0 in front of any number beginning with A-F" }
checks:
  - type: choice
    prompt: "How do you write hexadecimal **A4** as a Z80 number?"
    options: ["0A4H", "$A4", "A4H", "0xA4"]
    answer: 0
    explain: "Z80 hex numbers end with H, and a number that would begin with A-F must have a 0 in front so it is not read as a name: 0A4H."
  - type: choice
    prompt: "Which line is **valid** Z80 assembly?"
    options: ["LD E,55H", "LD E,$55", "LD E,H55", "LD E,0x55"]
    answer: 0
    explain: "55H is valid hex (it begins with a digit and ends in H). $55 is the 68000 style and 0x55 the C style."
  - type: choice
    prompt: "Why is `FFFFH` a problem and `0FFFFH` correct?"
    options: ["A number starting with A-F would be read as a label/name, so a leading 0 is required", "FFFF is not a valid hex number", "H must be lowercase", "It would be too large"]
    answer: 0
    explain: "The rule on the slide: put a 0 in front of any number beginning with A-F."
card:
  front: "Z80 hex notation vs 68000?"
  back: "Z80: hex ends with H and needs a leading 0 if it starts with A-F (0FFFFH, 55H). 68000: hex starts with $ ($FFFF, $55)."
glossary: []
bridge:
  to: programmers-model.m68k-notation
  same: "Both write the same numbers; only the marker for the base changes."
  different: "The 68000 puts a $ in front ($0A4); the Z80 puts an H behind (0A4H) and needs a leading 0 when the first digit is A-F."
  why: "They are conventions of each assembler: the Z80 style comes from the 8080-era assemblers, where a leading letter would be read as a symbol name."
---

## Learn

**Callback.** The 68000 uses `$` in front of hex. The Z80 puts an **H after** it:

- `55H`, `0FFFFH`.
- A number that would begin with a letter A-F **must begin with 0** (`0A4H`, not `A4H`), otherwise the assembler reads it as a name.

| Number | 68000 | Z80 |
|---|---|---|
| 55 hex | `$55` | `55H` |
| FFFF hex | `$FFFF` | `0FFFFH` |
| A4 hex | `$A4` | `0A4H` |

In C and C++, hex is `0x` and binary is `0b`.

## Worked example

*Write `$FF35` for a Z80 assembler.*

1. The hex digits are FF35 and it starts with F (a letter).
2. Add a leading 0 and a trailing H: **`0FF35H`**.

## Try it

*Write 3F hex for a Z80, and say whether it needs a leading 0.*

???

`3FH`. It begins with a digit (3), so **no** leading 0 is needed.
