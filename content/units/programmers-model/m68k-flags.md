---
track: m68k
title: The 68000 condition code flags
summary: X, N, Z, V and C in the CCR, set by the result of the last operation; CMP sets them for the branch that follows.
needs: [m68k-registers, signed-overflow]
sources:
  - { type: slide, ref: "L3 s132", quote: "CONDITION CODES ( FLAGS )" }
  - { type: slide, ref: "L3 s144", quote: "Z would be set if D0 = D1 because D1 – D0 = 0" }
  - { type: slide, ref: "L3 s144", quote: "Carry bit for multi-precision arithmetic" }
checks:
  - type: choice
    prompt: "Which five flags are in the 68000's **condition code register**?"
    options: ["X, N, Z, V, C", "S, Z, H, P/V, N, C", "Z, C only", "A, B, C, D, E"]
    answer: 0
    explain: "The CCR holds X (extend), N (negative), Z (zero), V (overflow) and C (carry). The Z80's F register is different: S, Z, H, P/V, N, C."
  - type: choice
    prompt: "After `CMP.W D0,D1`, when is the **Z flag set**?"
    options: ["When D0 equals D1 (because D1 - D0 = 0)", "When D0 is greater than D1", "When D1 is odd", "Never"]
    answer: 0
    explain: "CMP.W D0,D1 computes D1 - D0 without storing it. Z is set when they are equal; N when the result is negative (D0 > D1); V on overflow; C on a borrow."
  - type: choice
    prompt: "What is the **X (extend)** flag for?"
    options: ["A carry bit for multi-precision arithmetic", "Marking a negative result", "Signalling a parity error", "BCD half-carry"]
    answer: 0
    explain: "X is the carry bit used for multi-precision (extended) arithmetic. The Z80 has no equivalent."
card:
  front: "What do the 68000 flags X N Z V C mean?"
  back: "X extend (carry for multi-precision), N negative (MSB = 1), Z zero, V overflow (2's complement result overflowed), C carry (or borrow). CMP.W D0,D1 does D1 - D0 and sets them: Z if equal, N if D0 > D1."
glossary:
  - { term: "CCR", def: "Condition Code Register: the low byte of the 68000 status register, holding X, N, Z, V and C." }
---

## Learn

The **condition code register (CCR)** is the low byte of the status register. Its five flags display the result of the instruction just executed:

| Flag | Name | Set when |
|---|---|---|
| **X** | Extend | a carry bit for multi-precision arithmetic |
| **N** | Negative | the result is negative (MSB = 1) |
| **Z** | Zero | the result is zero |
| **V** | Overflow | the 2's complement result overflowed the register |
| **C** | Carry | the operation generated a carry (or a borrow) |

A common use is **compare**. `CMP.W D0,D1` subtracts D0 from D1 but throws away the result and just sets the flags:

- **Z** set if D0 = D1 (because D1 - D0 = 0).
- **N** set if D0 > D1 (the result D1 - D0 is negative).
- **V** set if D1 - D0 overflowed.
- **C** set if D1 - D0 resulted in a borrow.

A conditional branch then tests those flags (for example `BEQ` branches when Z is set).

## Worked example

*D0 = 5 and D1 = 5 (words). After `CMP.W D0,D1`, which flags are set, and does `BEQ` branch?*

1. D1 - D0 = 0, so **Z = 1**.
2. The result is not negative (N = 0), there is no overflow (V = 0) and no borrow (C = 0).
3. `BEQ` branches when Z = 1, so **it branches**.

## Try it

*D0 = 7 and D1 = 3. After `CMP.W D0,D1`, is N set?*

???

D1 - D0 = 3 - 7 = -4, which is negative, so **N = 1** (consistent with "N is set if D0 > D1"). Z = 0, so BEQ would not branch.
