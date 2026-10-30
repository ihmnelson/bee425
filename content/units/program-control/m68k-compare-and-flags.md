---
track: m68k
title: "CMP, the Z and N flags and testing bits"
summary: "CMP subtracts to set the flags and discards the result; BEQ/BNE test Z, BMI/BPL test N; MOVEA changes no flags."
needs: [programmers-model.m68k-flags, addressing-modes.m68k-post-pre]
sources:
  - { type: slide, ref: "L5 s230", quote: "CMP does not save the result" }
  - { type: slide, ref: "L5 s231", quote: "Z = 1 if all the bits of the resulting operation are zero" }
  - { type: slide, ref: "L5 s232", quote: "Instruction BMI <label> ( Branch MInus) causes program to branch if N=1" }
  - { type: slide, ref: "L5 s234", quote: "Customary to place the test instruction" }
  - { type: oracle, ref: "the trick-question and bit-test programs below are run on the 68000 core" }
encodings:
  - { cpu: m68k, asm: "AND.W D0,D6", hex: "CC40" }
programs:
  - cpu: m68k
    name: "MOVEA does not change the flags (the lecture's trick question)"
    source: |
      * program
              ORG     $1000
      START   MOVE.W  #1,D0
              MOVEA.W #0,A3
              BNE     taken
              MOVE.B  #0,D7
              SIMHALT
      taken   MOVE.B  #1,D7
              SIMHALT
              END     START
    expect:
      regs: { D7: 1 }
  - cpu: m68k
    name: "test bit 9 of D6 with a mask"
    source: |
      * program
      mask    EQU     %0000001000000000
              ORG     $1000
      START   MOVE.W  #$0200,D6
              MOVE.W  #mask,D0
              AND.W   D0,D6
              BNE     db9_is_1
              MOVE.B  #0,D7
              SIMHALT
      db9_is_1 MOVE.B #1,D7
              SIMHALT
              END     START
    expect:
      regs: { D7: 1 }
checks:
  - type: choice
    prompt: "What is the difference between **CMP** and **SUB**?"
    options: ["Both subtract the source from the destination; SUB stores the result, CMP only sets the flags", "CMP adds", "SUB sets no flags", "They are identical"]
    answer: 0
    explain: "CMP tests for equality by subtraction without changing the operands; its sole purpose is to set the condition code flags. SUB places the result in the destination."
  - type: choice
    prompt: "`LOOP MOVEA.W #$0000,A3` is followed by `BNE LOOP`. Will the branch be taken, according to the lecture's trick question?"
    options: ["It depends on the flags left by earlier instructions: MOVEA does not affect any condition codes", "Never, because the value is zero", "Always", "It is an assembler error"]
    answer: 0
    explain: "MOVEA does not change the condition codes, so BNE tests whatever Z was before. In the program above Z = 0 after MOVE.W #1,D0, so the branch is taken, even though a zero was loaded."
  - type: choice
    prompt: "Which pair tests the **N flag**?"
    options: ["BMI (branch if N = 1) and BPL (branch if N = 0)", "BEQ and BNE", "BCS and BCC", "BRA and BSR"]
    answer: 0
    explain: "BMI (Branch MInus) branches if N = 1; BPL (Branch PLus) branches if N = 0. BEQ/BNE test Z."
  - type: choice
    prompt: "To find out whether bit 9 of D6 is 1, you AND D6 with a mask. What is the mask, and which branch tests the result?"
    options: ["%0000001000000000 ($0200); BNE (non-zero means the bit was 1)", "$0100; BEQ", "$FFFF; BMI", "$0200; BCS"]
    answer: 0
    explain: "The mask isolates bit 9 and zeroes everything else. If the AND result is non-zero the bit was 1 (BNE); zero means it was 0 (BEQ). The slide writes `ANDI.W D0,D6`, but ANDI needs an immediate operand; with a register mask the instruction is `AND.W D0,D6` (ANDI.W D0,D6 does not assemble)."
card:
  front: "How do you compare, and which branch tests which flag?"
  back: "CMP src,dst subtracts without storing and sets the flags; put the branch right after. BEQ: Z=1. BNE: Z=0. BMI: N=1. BPL: N=0. MOVEA changes no flags. To test bit n, AND with a mask and test Z."
glossary: []
---

## Learn

Programs decide by changing the execution path: most programs execute only 5 to 7 instructions before a non-sequential one (branch or jump). A **conditional branch** looks at the **flags** in the CCR (Z, N, V, X, C), and combinations of flags give more conditions.

**CMP versus SUB.** Both subtract the source from the destination. `SUB` stores the result; **`CMP` does not**: its sole purpose is to set the flags. Use it to find out whether two values are equal (the result is zero), whether a result is negative or positive, and whether one value is greater or less than another.

- **Z = 1** when all bits of the result are zero. `BEQ` branches if Z = 1; `BNE` branches if Z = 0.
- **N** equals the most significant bit of the result (bit 7, 15 or 31 for byte, word, long). `BMI` branches if N = 1; `BPL` if N = 0.
- Customary: put the test instruction **immediately before** its branch, because most instructions change the flags.
- **Trick question:** `MOVEA` does **not** affect the condition codes, so `MOVEA.W #0,A3` then `BNE` does not see a zero result. Always check the Programmer's Reference Manual for how each instruction affects the flags.

**Bit test with a mask.** To test bit 9 of D6, put a mask `%0000001000000000` in D0 and `AND.W D0,D6`; then `BNE` is taken if the bit was 1.

## Worked example

*D0 = 3, D1 = 5. After `CMP.L D0,D1` does `BEQ` branch?*

1. CMP computes D1 - D0 = 5 - 3 = 2, not zero.
2. Z = 0, so `BEQ equal` is **not** taken: execution falls into the `not_equal` code.
3. (If both were 3, Z = 1 and BEQ would branch.)

## Try it

*After `MOVE.W #$8000,D2` (which sets flags from the data moved), does `BMI` branch?*

???

Yes: MOVE sets N from the moved data, and $8000 has its top bit set, so **N = 1** and BMI branches.
