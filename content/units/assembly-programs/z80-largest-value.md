---
track: z80
title: Finding the largest of four bytes (Z80)
summary: CP against A, then JR NC keeps the larger; the Z80's carry test is an unsigned compare.
needs: [z80-load, programmers-model.z80-flags]
sources:
  - { type: oracle, ref: "both Z80 programs below are run on the Z80 core" }
  - { type: own, ref: "Z80 translation of the lecture's 68000 largest-value program (slides 193-197); the lecture shows no Z80 version" }
programs:
  - cpu: z80
    name: "data 05 4C 42 7F"
    source: |
      ; program
              .ORG 0100H
      START:  LD HL,DATA
              LD A,[HL]
              LD B,3
      LOOP:   INC HL
              CP [HL]
              JR NC,NEXT
              LD A,[HL]
      NEXT:   DJNZ LOOP
              LD [MAXNUM],A
              HALT
      DATA:   .DB 05H,4CH,42H,7FH
      MAXNUM: .DS 1
              .END
    expect:
      mem: { MAXNUM: [0x7F] }
  - cpu: z80
    name: "data 05 90 42 30 (unsigned compare)"
    source: |
      ; program
              .ORG 0100H
      START:  LD HL,DATA
              LD A,[HL]
              LD B,3
      LOOP:   INC HL
              CP [HL]
              JR NC,NEXT
              LD A,[HL]
      NEXT:   DJNZ LOOP
              LD [MAXNUM],A
              HALT
      DATA:   .DB 05H,90H,42H,30H
      MAXNUM: .DS 1
              .END
    expect:
      mem: { MAXNUM: [0x90] }
checks:
  - type: choice
    prompt: "In the Z80 loop, what is in **A** at each step?"
    options: ["The largest value found so far", "The loop counter", "The address of the data", "The last value read"]
    answer: 0
    explain: "A plays the role D0 had on the 68000: it holds the running maximum. The compare (CP) must be against A because arithmetic and logic use the accumulator."
  - type: choice
    prompt: "`CP [HL]` computes A minus the byte at HL and sets flags. When is the **carry flag** set?"
    options: ["When A < (HL) as unsigned numbers", "When A > (HL)", "When they are equal", "Never"]
    answer: 0
    explain: "A borrow (carry) occurs when A is smaller than the byte, unsigned. `JR NC,NEXT` therefore keeps A when A >= (HL), and falls through to `LD A,[HL]` when the new byte is larger."
  - type: choice
    prompt: "The data bytes are 05H, 90H, 42H, 30H. What does the Z80 program give, and why does it differ from the 68000 BGE program?"
    options: ["90H: the carry test is unsigned, while BGE compared signed numbers (giving 42H)", "42H: both are signed", "30H: the last value", "05H: the first"]
    answer: 0
    explain: "Z80 CP with the carry flag compares unsigned, so 90H (144) is the largest. The 68000 program used BGE, a signed branch, where 90H is -112 and the answer is 42H. Both results are verified by running the programs."
  - type: choice
    prompt: "What does `DJNZ LOOP` do?"
    options: ["Decrements B and jumps to LOOP unless B has reached zero", "Jumps when the zero flag is set", "Decrements A", "Halts"]
    answer: 0
    explain: "DJNZ is the Z80's built-in loop counter: it decrements B and branches back if the result is not zero. Here B = 3 gives three comparisons after the first value."
card:
  front: "Write the Z80 pattern that keeps the larger of two bytes, and say how it differs from the 68000."
  back: "LD A,[HL] (first) ... INC HL / CP [HL] / JR NC,NEXT (A >= byte) / LD A,[HL] / NEXT. The carry test is an unsigned compare; the 68000 program used BGE, a signed compare. A holds the running maximum, DJNZ counts the loop."
glossary: []
bridge:
  to: assembly-programs.m68k-largest-value
  same: "Both walk through the four bytes, keep the largest so far in a register, and store it at the end. A compare sets the flags and a conditional branch chooses the path."
  different: "The 68000 compares with CMP.B D1,D0 and BGE (signed); the Z80 compares against A with CP and tests carry with JR NC (unsigned). The 68000 loads each value into D1 with auto-increment; the Z80 uses INC HL and DJNZ."
  why: "Signed and unsigned tests are separate branch instructions on both processors. The programs differ because the 68000 version chose a signed test and the Z80 version an unsigned one, not because of a difference between the processors."
---

## Learn

**Callback.** The 68000 program kept the running maximum in D0 and compared with `CMP.B D1,D0` and `BGE`. The Z80 version keeps it in **A** (the accumulator is where compares happen) and walks HL along the data:

```
START:  LD HL,DATA
        LD A,[HL]       ; first number is the maximum so far
        LD B,3          ; three more to examine
LOOP:   INC HL
        CP [HL]         ; A - (HL), flags only
        JR NC,NEXT      ; no carry: A >= (HL), keep A
        LD A,[HL]       ; otherwise the new byte is larger
NEXT:   DJNZ LOOP
        LD [MAXNUM],A
        HALT
```

Note the contrast the programs expose: the 68000 version used **BGE (signed)** and returned `$42` for `$05,$90,$42,$30`; this Z80 version uses the **carry flag (unsigned)** and returns `90H`. Both processors have signed and unsigned tests; the difference is the test chosen. Both results are confirmed by running the programs.

## Worked example

*Trace data 05H, 4CH, 42H, 7FH.*

1. A = 05H, B = 3. Examine 4CH: A - 4C borrows (carry set), so `JR NC` is not taken and A = 4CH.
2. Examine 42H: 4C - 42 does not borrow, so A stays 4CH.
3. Examine 7FH: 4C - 7F borrows, so A = 7FH. DJNZ ends the loop (B = 0). MAXNUM = 7FH.

## Try it

*How would you make this Z80 program find the **signed** maximum?*

???

Use a signed test instead of the carry test: after `CP [HL]`, compare the sign and overflow flags (S and P/V), for example with `JP P,...` / `JP PE,...` combinations, or flip the sign bit of both numbers (XOR 80H) and use the carry test. The key idea is the same as on the 68000: pick the branch that matches the number format.
