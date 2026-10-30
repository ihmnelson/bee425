---
track: z80
title: The Z80 flag register
summary: S, Z, H, P/V, N and C in F; P/V does double duty as parity and overflow.
needs: [z80-registers, signed-overflow]
sources:
  - { type: slide, ref: "L3 s138", quote: "P/V: Parity or Overflow Flag" }
  - { type: slide, ref: "L3 s144", quote: "On Z80, also indicates an even" }
  - { type: slide, ref: "L3 s144", quote: "Carry Bit for BCD Arithmetic" }
checks:
  - type: choice
    prompt: "Which flags are in the Z80's **F register**?"
    options: ["C, N, P/V, H, Z, S", "X, N, Z, V, C", "Z and C only", "A, F, B, C"]
    answer: 0
    explain: "F holds Carry (C), Add/Subtract (N), Parity/Overflow (P/V), Half carry (H), Zero (Z) and Sign (S)."
  - type: choice
    prompt: "On the Z80, what does the **P/V flag** indicate?"
    options: ["Overflow for arithmetic, and parity (an even number of 1 bits) for some other operations", "Only overflow", "Only parity", "A pending interrupt"]
    answer: 0
    explain: "The slide says P/V is set if the 2's complement result overflows the register; on the Z80 it also indicates an even number of bits set to 1 (parity)."
  - type: choice
    prompt: "Which Z80 flag is used for **BCD arithmetic**?"
    options: ["H, the half-carry flag", "N", "S", "C"]
    answer: 0
    explain: "H (half carry) is the carry bit for BCD arithmetic. The 68000 has no half-carry flag; N on the Z80 means 'last operation was a subtraction'."
card:
  front: "Match the Z80 flags to the 68000's."
  back: "Z = Z (zero). S = N (negative / sign). C = C (carry). P/V = V (overflow; also parity on the Z80). 68000 only: X (extend). Z80 only: H (half carry, BCD) and N (last operation was a subtraction)."
glossary:
  - { term: "Half carry (H)", def: "Z80 flag: carry from bit 3 to bit 4, used for BCD arithmetic." }
bridge:
  to: programmers-model.m68k-flags
  same: "Both set flags from each arithmetic or logical result and test them with conditional branches. Zero, sign (negative), carry and overflow behave the same."
  different: "The 68000 has X (extend) and calls the sign flag N. The Z80 calls it S, has H (half carry) and an N flag meaning 'last operation was a subtraction', and its P/V flag is overflow and parity."
  why: "The Z80's flags come from the 8080 design, which supported BCD correction (DAA) with H and N; the 68000 added X for multi-precision arithmetic."
---

## Learn

**Callback.** The 68000's flags were X N Z V C. The Z80's **F register** holds:

| Z80 flag | Name | Closest 68000 flag | Meaning |
|---|---|---|---|
| **Z** | Zero | Z | Set if the result is zero |
| **S** | Sign | N | Set if the result is negative (MSB = 1) |
| **C** | Carry | C | Set if the result generates a carry |
| **P/V** | Parity / overflow | V | Set if the 2's complement result overflows; on the Z80 also indicates an **even number of bits set to 1** |
| **H** | Half carry | none | Carry bit for BCD arithmetic |
| **N** | Subtract | none (different N) | Set if the last operation was a subtraction |
| none | none | **X** (Extend) | Carry bit for multi-precision arithmetic |

Careful: the letter **N** means *negative* on the 68000 but *subtract* on the Z80. The Z80's *sign* flag is **S**.

## Worked example

*On a Z80, `CP D` (compare) sets Z when A = D. What are Z and S after A = $10 and D = $20?*

1. A - D = $10 - $20 = -$10, not zero: **Z = 0**.
2. The result is negative: **S = 1**. (A comparison also sets N = 1 because it is a subtraction.)
3. This matches the 68000's `CMP` logic, except that the compare is against the accumulator A.

## Try it

*A student reads the Z80's N flag as 'negative result'. What is the correct meaning?*

???

The Z80's **N** flag means the last operation was a **subtraction**. A negative result is shown by the **S** (sign) flag.
