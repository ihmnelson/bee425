---
track: shared
title: Signed overflow
summary: Adding two positives or two negatives can overflow; a positive plus a negative cannot.
needs: [twos-complement]
sources:
  - { type: slide, ref: "L3 s142", quote: "Adding a positive and negative number will always be correct" }
  - { type: slide, ref: "L3 s142", quote: "Overflow bit (V bit ) in the Status Register warns when an overflow may have" }
checks:
  - gen: number.addOverflow
  - gen: number.addOverflow
  - type: choice
    prompt: "Which addition can **never** overflow in two's complement?"
    options: ["A positive number plus a negative number", "Two positive numbers", "Two negative numbers", "Any addition can overflow"]
    answer: 0
    explain: "Adding a positive and a negative number always gives a result between the two operands, so it always fits. Adding two positives or two negatives can give an erroneous result."
card:
  front: "When can a signed addition overflow, and which flag warns of it?"
  back: "Only when both operands have the same sign (two positives, or two negatives) and the true sum does not fit the size. The V (overflow) flag in the status register warns of it."
glossary:
  - { term: "Overflow (V flag)", def: "Set when a signed result does not fit in the operand size; warns that the answer is wrong." }
---

## Learn

Because the range is cut in half by the sign bit, **overranging is always possible**. Two's complement addition goes wrong only when:

- you add **two positive numbers** and the sum exceeds +127 (byte), or
- you add **two negative numbers** and the sum is below -128.

Adding a **positive and a negative** number is always correct. The **overflow flag (V)** in the status register warns when an overflow may have occurred.

Quick check by sign: if the operands have the **same sign** but the result has the **opposite sign**, V is set.

## Worked example

*Does $64 + $64 overflow as bytes?*

1. $64 = 100, so the true sum is 200.
2. A signed byte tops out at 127, so 200 does not fit.
3. The byte holds $C8, which reads as -56. **V = 1** (two positives gave a negative).

## Try it

*Does $90 + $90 overflow as signed bytes?*

???

$90 = -112. The true sum is -224, below -128, so it does **not fit**. The byte holds $20 (positive), which has the opposite sign to the operands: **V = 1**.
