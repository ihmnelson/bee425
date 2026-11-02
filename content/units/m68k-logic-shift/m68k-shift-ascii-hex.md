---
track: m68k
title: Shift instructions and converting ASCII digits to a number
summary: ASL moves bits left (a 0 enters at the bottom, the top bit goes to C and X); combined with OR it packs hex digits into a word.
needs: [m68k-logic-instructions]
sources:
  - { type: handout, ref: "ch9 Shift and rotate instruction", quote: "Each time the bits are shifted, a 0 is inserted in the least significant bit position, DB0." }
  - { type: handout, ref: "ch9 Shift and rotate instruction", quote: "When a memory location is involved, only one bit is shifted at a time and only word operands are allowed" }
  - { type: handout, ref: "ch9 Shift and rotate instruction", quote: "Instructions in this group may be byte, word or long word operations." }
  - { type: handout, ref: "ch9 Shift and rotate instruction", quote: "If the number of shifts is greater than 8, then the number must be in another data register." }
checks:
  - type: choice
    prompt: "D0 = $AB005501. What is D0 after ASL.B #3,D0?"
    options: ["$AB005508", "$AB005501", "$AB0055A8", "$5802A808"]
    answer: 0
    explain: "ASL.B shifts only the low byte three places left: $01 becomes $08. The rest of the register is unchanged. ($5802A808 would be a long-word shift by 3.)"
  - type: choice
    prompt: "During ASL, what enters the least significant bit, and what happens to the bit shifted out of the top?"
    options: ["A 0 enters bit 0; the old top bit goes to the carry and extend bits", "A 1 enters bit 0; the old top bit is lost", "The old top bit wraps around into bit 0; the flags are unchanged", "A 0 enters bit 0; the old top bit is lost with no flag change"]
    answer: 0
    explain: "ASL shifts left, inserts 0 at DB0, and moves the most significant bit into the carry (C) and extend (X) bits of the condition code register."
  - type: choice
    prompt: "A shift of a data register by 12 places is needed. How is the count supplied?"
    options: ["In another data register; the immediate form covers small counts", "As an immediate #12, like any other count", "In an address register such as A0", "In memory, at the address being shifted"]
    answer: 0
    explain: "When the register is the operand, the instruction must supply the shift count: small counts can be immediate; larger counts must be in another data register."
  - type: choice
    prompt: "The bytes $31, $41, $30, $30 are the ASCII text '1A00'. To build the number $1A00 the program strips the ASCII code and then packs the digits with ASL and OR. Why is each digit shifted left before it is ORed in?"
    options: ["Each hex digit is 4 bits, so shifting puts it in its own position", "ASL converts the ASCII code into a hex digit", "OR only works on values that have been shifted", "The shift clears the carry flag so OR works"]
    answer: 0
    explain: "The first digit must end up in bits 12-15, the second in 8-11, the third in 4-7 and the last in 0-3. Shifting by 12, 8, 4 and 0 and ORing places each digit without disturbing the others."
  - type: choice
    prompt: "The subroutine converts an ASCII letter in the range A-F to a number. What does it subtract from the ASCII code for 'C' ($43), and what is the result?"
    options: ["$37, giving $0C", "$30, giving $13", "$57, giving $EC", "$41, giving $02"]
    answer: 0
    explain: "Digits 0-9 ($30-$39) subtract $30; capital A-F ($41-$46) subtract $37 (so A becomes $0A); lower-case a-f ($61-$66) subtract $57. $43 - $37 = $0C."
card:
  front: "ASL and packing hex digits from ASCII."
  back: "ASL.B #3 on $01 gives $08 (a 0 enters bit 0; the top bit goes to C and X). Counts above 8 must be in a data register; memory operands shift one bit, word size only. ASCII to hex: subtract $30 for 0-9, $37 for A-F, $57 for a-f; then ASL by 12, 8, 4, 0 and OR the digits together."
glossary:
  - { term: "ASL", def: "Arithmetic shift left: bits move left, a 0 enters the least significant bit and the top bit goes to the carry and extend flags." }
---

## Learn

**ASL** moves every bit of a byte, word or long word to the left. Each shift inserts a **0 at bit 0** and moves the **top bit into C and X** (the old C is discarded). `ASL.B #3,D0` with D0 = $AB005501 gives $AB005508 because only the low byte shifts.

Rules for the shift and rotate group:

- byte, word or long operations;
- the operand is a **data register** or a **memory location**;
- for a register, the instruction supplies the **count**: an immediate for small counts, otherwise **another data register**;
- for a memory operand, **one bit at a time and word size only**.

**Application: ASCII to a number.** Four ASCII characters such as $31 $41 $30 $30 ("1A00") become $1A00 in three steps per digit: isolate the byte (`ANDI.W #$00FF`), **strip the ASCII code** (subtract $30 for 0-9, $37 for A-F, $57 for a-f), then **shift into place and OR into the result** (shifts of 12, 8, 4 and 0 bits).

## Worked example

*Convert the ASCII characters '7' ($37) and 'B' ($42) into the two-digit value $7B.*

1. '7': $37 - $30 = **$07**. 'B': $42 - $37 = **$0B**.
2. Shift the first digit left 4 places: $07 becomes **$70** (ASL.B #4).
3. OR in the second digit: $70 OR $0B = **$7B**.

## Try it

*D1.B = $0F. What is D1.B after ASL.B #2,D1, and what does the carry flag hold?*

???

$0F shifted left twice is $3C (00001111 becomes 00111100). The last bit shifted out of the top was a 0, so **C = 0** (and X = 0).
