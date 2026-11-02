---
track: m68k
title: AND, OR, EOR and NOT
summary: The 68000 logical instructions work bit by bit on the operand size given; AND with a mask isolates bits, and NOT has no immediate form.
needs: []
sources:
  - { type: handout, ref: "ch9 Logical Instructions", quote: "The AND instruction performs the bit-wise, logical AND." }
  - { type: handout, ref: "ch9 Logical Instructions", quote: "Note that only the lower 16-bits of each register are used in the operation." }
  - { type: handout, ref: "ch9 Other Logical Instructions", quote: "NOT: Perform the bit-wise logical complement of the operand" }
  - { type: handout, ref: "ch9 Other Logical Instructions", quote: "you cannot have a NOT Immediate instruction" }
checks:
  - type: choice
    prompt: "D0 = $3795AC5F and D1 = $B6D34B9D. What is D1 after AND.W D0,D1?"
    options: ["$B6D3081D", "$3691081D", "$B6D3EFDF", "$B6D3E7C2"]
    answer: 0
    explain: "A .W operation uses only the low 16 bits: $AC5F AND $4B9D = $081D, and the upper word of D1 ($B6D3) is untouched. $3691081D is what a 32-bit AND would give; $EFDF is the OR and $E7C2 the EOR of the low words."
  - type: choice
    prompt: "Which instruction clears every bit of D2.B except the low nibble?"
    options: ["ANDI.B #$0F,D2", "ANDI.B #$F0,D2", "ORI.B #$0F,D2", "EORI.B #$0F,D2"]
    answer: 0
    explain: "AND with F keeps a digit and AND with 0 gives 0, so the mask $0F keeps the low nibble and clears the high one. $F0 keeps the high nibble; OR would set bits and EOR would flip them."
  - type: choice
    prompt: "D3 = $FF4567FF. What is D3 after NOT.B D3?"
    options: ["$FF456700", "$00BA9800", "$FF459800", "$FF4567FF"]
    answer: 0
    explain: "NOT.B complements only the low byte: $FF becomes $00 and the other bytes are unchanged. $00BA9800 would be NOT.L and $FF459800 would be NOT.W."
  - type: choice
    prompt: "Why is there no NOTI.B #$67,D3 instruction?"
    options: ["NOT complements one operand in place, so an immediate constant gives it nothing to act on", "Immediate data can only be used with AND instructions", "NOT works only on address registers", "The assembler converts it to ANDI automatically"]
    answer: 0
    explain: "NOT takes a single operand and complements it; a constant has no storage to complement, so the reading says NOTI has no meaning. The two-operand logic instructions do have immediate forms: ANDI, ORI, EORI."
card:
  front: "68000 logical instructions: AND, OR, EOR, NOT."
  back: "Bit-wise on the given size (.B/.W/.L); other bits of the register are untouched. AND with F keeps a digit, with 0 clears it. ANDI/ORI/EORI take immediates; NOT takes one operand and has no immediate form. Example: AND.W D0,D1 with D0=$3795AC5F, D1=$B6D34B9D gives D1=$B6D3081D."
glossary:
  - { term: "Mask", def: "A constant ANDed with a value to keep some bits (mask bit 1) and clear the rest (mask bit 0)." }
---

## Learn

The logical instructions apply their operation **bit by bit** to the size you give. **Only that size is touched**: `AND.W D0,D1` changes the low 16 bits of D1 and leaves its upper word alone.

- **AND** keeps a bit only where both are 1. Hex shortcuts: AND with **F** returns the digit, AND with **0** returns 0. That makes it the instruction for **masks** (`ANDI.B #$0F,D2` keeps the low nibble).
- **OR** sets bits; **EOR** (exclusive OR) flips bits where the mask is 1.
- Each has an immediate form: **ANDI, ORI, EORI**.
- **NOT** complements its single operand (`NOT.B D3` on $FF4567FF gives $FF456700). It has **no immediate form**.

## Worked example

*D0 = $3795AC5F, D1 = $B6D34B9D. Find D1 after AND.W D0,D1.*

1. Only the low words matter: $AC5F AND $4B9D.
2. In binary: 1010 1100 0101 1111 AND 0100 1011 1001 1101 = 0000 1000 0001 1101 = **$081D**.
3. The upper word $B6D3 is unchanged, so D1 = **$B6D3081D**.

## Try it

*D4 = $12345678. What is D4 after ANDI.W #$00FF,D4 and then ORI.W #$A000,D4?*

???

ANDI.W #$00FF keeps the low byte of the low word: low word $5678 becomes $0078. ORI.W #$A000 then sets the top bits: $0078 OR $A000 = $A078. D4 = **$1234A078**.
