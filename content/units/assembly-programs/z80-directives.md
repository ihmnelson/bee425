---
track: z80
title: Z80 assembler directives
summary: The same ideas as the 68000 under different names (DEFB, DEFS); the Oshonsoft assembler wants a leading period.
needs: [assembly-intro.assembly-line-format]
sources:
  - { type: slide, ref: "L4 s183", quote: "Define storage block in bytes" }
  - { type: slide, ref: "L4 s183", quote: "requires that the pseudo-op codes have a period in front" }
  - { type: oracle, ref: "the directive example below is assembled and run" }
programs:
  - cpu: z80
    name: "EQU, DB, DS together"
    source: |
      ; program
              .ORG 0100H
      VAL     .EQU 5
      START:  LD A,VAL
              HALT
      BLOCK:  .DB 0AAH,0AAH
      MSG:    .DB "Hi",0
      BUF:    .DS 2
              .END
    expect:
      regs: { a: 5 }
      mem: { BLOCK: [0xAA, 0xAA], MSG: [0x48, 0x69, 0x00] }
checks:
  - type: choice
    prompt: "Which Z80 directive corresponds to the 68000's **DC.B** (define a byte)?"
    options: ["DEFB", "DEFS", "ORG", "EQU"]
    answer: 0
    explain: "The lecture's table: DC.B is DEFB on the Z80; DC.W is DEFW; DS.B nn is DEFS nn. ORG, EQU and END have the same names on both."
  - type: choice
    prompt: "What does the **Oshonsoft** Z80 assembler require of pseudo-ops?"
    options: ["A period in front, for example .END", "A dollar sign in front", "Upper case only", "Nothing; it is the same as the 68000"]
    answer: 0
    explain: "The Oshonsoft assembler requires a period in front of the pseudo-op codes: END becomes .END."
  - type: choice
    prompt: "Which 68000 directive has **no Z80 counterpart** in the lecture's table?"
    options: ["DS.W (define storage in words)", "ORG", "EQU", "END"]
    answer: 0
    explain: "The table lists the Z80 equivalent of DS.W as N/A, since the Z80 is byte oriented."
card:
  front: "Map 68000 directives to the Z80's."
  back: "ORG = ORG, EQU = EQU, END = END, DC.B = DEFB, DC.W = DEFW, DS.B nn = DEFS nn, DS.W = N/A, DC.B 'string': the slide prints DEFII 's' (a typo; Oshonsoft style is .DB with the string in quotes). In the Oshonsoft assembler every pseudo-op begins with a period (.ORG, .EQU, .DB, .DS, .END)."
glossary: []
bridge:
  to: assembly-programs.m68k-directives
  same: "ORG, EQU and END work the same way: origin, a named constant, and the end of the source. Directives are instructions to the assembler and generate no code."
  different: "The Z80 names are DEFB/DEFW/DEFS where the 68000 uses DC/DS, there is no word-sized DS, and the Oshonsoft assembler needs a leading period."
  why: "Directive names are assembler conventions, not processor features, so they follow each vendor's assembler."
---

## Learn

**Callback.** The 68000 directives you met (ORG, EQU, DC, DS, END) all exist on the Z80, sometimes under other names:

| Directive | 68000 | Z80 |
|---|---|---|
| Set origin | `ORG` | `ORG` |
| Equate | `EQU` | `EQU` |
| End of source | `END` | `END` |
| Define byte | `DC.B` | `DEFB` |
| Define word | `DC.W` | `DEFW` |
| Define storage in bytes | `DS.B nn` | `DEFS nn` |
| Define storage in words | `DS.W nn` | N/A |
| ASCII string | `DC.B 'string'` | the slide prints `DEFII 's'`, which looks like a typo; in Oshonsoft style use `.DB "string"` |

The **Oshonsoft** Z80 assembler used in the lab requires a **period in front** of the pseudo-op codes: `END` becomes `.END`. (This site's Z80 sandbox follows that style, with `.ORG`, `.EQU`, `.DB`, `.DS` and `.END`.)

## Worked example

*Reserve a 2-byte buffer named BUF and define the string "Hi" ending in 0, in Oshonsoft style.*

1. `MSG:  .DB "Hi",0` places the bytes 48H 69H 00H.
2. `BUF:  .DS 2` reserves two uninitialised bytes.
3. Both are directives: no executable code is generated.

## Try it

*Write the Oshonsoft form of the 68000 line `ORG $2000`.*

???

`.ORG 2000H`: the leading period, and hex written with a trailing H.
