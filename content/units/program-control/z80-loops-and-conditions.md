---
track: z80
title: "Z80 compares, conditions and loops"
summary: "CP sets the flags like CMP; JR cc branches; DJNZ is a built-in counted loop; BIT tests a single bit."
needs: [programmers-model.z80-flags, z80-jumps-and-calls]
sources:
  - { type: oracle, ref: "the loops and the bit test below are run on the Z80 core" }
  - { type: own, ref: "Z80 translation of the lecture's 68000 FOR loop and bit-test examples (slides 233-239); the lecture shows no Z80 version of these" }
programs:
  - cpu: z80
    name: "FOR loop with DJNZ: sum 1+2+...+9"
    source: |
      ; program
              .ORG 0100H
      START:  LD B,9
              LD C,0
              LD D,1
      LOOP:   LD A,C
              ADD A,D
              LD C,A
              INC D
              DJNZ LOOP
              HALT
              .END
    expect:
      regs: { c: 45, b: 0 }
  - cpu: z80
    name: "test bit 1 of H with BIT (the DB9 example in a 16-bit register pair)"
    source: |
      ; program
              .ORG 0100H
      START:  LD HL,0200H
              BIT 1,H
              JR NZ,ONE
              LD A,0
              HALT
      ONE:    LD A,1
              HALT
              .END
    expect:
      regs: { a: 1 }
checks:
  - type: choice
    prompt: "What does `DJNZ LOOP` do?"
    options: ["Decrement B; if B is not zero jump back to LOOP", "Decrement A; jump if zero", "Jump if not zero", "Decrement the stack pointer"]
    answer: 0
    explain: "DJNZ (Decrement and Jump if Not Zero) is a built-in loop counter using B. The 68000 has `DBRA`/`DBcc` for a similar job, and the lecture's loops use SUBQ and BNE."
  - type: choice
    prompt: "The 68000 compares with `CMP.B D0,D1`. Which Z80 instruction compares a register with the accumulator?"
    options: ["`CP D` (A - D, flags only)", "`CMP D`", "`SUB A,D` and keep the result", "`LD A,D`"]
    answer: 0
    explain: "CP r subtracts r from A and sets the flags without storing the result, like the 68000's CMP. The accumulator is always the other operand."
  - type: choice
    prompt: "The 68000 tests bit 9 of D6 with a mask and AND. How does the Z80 test a single bit?"
    options: ["With BIT n,r (sets Z to the complement of the bit), then JR NZ/Z", "With MASK", "It cannot test bits", "With CP only"]
    answer: 0
    explain: "BIT n,r sets the Z flag to 1 if the bit is 0 and to 0 if the bit is 1, without changing the register, so `BIT 1,H` then `JR NZ,ONE` branches when the bit is 1. Bit 9 of a 16-bit word is bit 1 of the high byte."
  - type: choice
    prompt: "In the DJNZ sum loop, B starts at 9. How many passes does the body make?"
    options: ["9", "10", "8", "1"]
    answer: 0
    explain: "DJNZ decrements B before testing, so a start of 9 gives 9 passes (the loop stops when B reaches 0). The sum 1+...+9 = 45 (verified on the core)."
card:
  front: "Z80 compare, branch and loop instructions?"
  back: "CP r (A - r, flags only); JR cc,nn / JP cc,nn on Z, NZ, C, NC, ...; DJNZ nn (decrement B, jump if not zero); BIT n,r (Z = complement of bit n). Arithmetic and compares involve A."
glossary: []
bridge:
  to: program-control.m68k-loops-and-ifs
  same: "Pair a flag-setting instruction with a conditional branch; test at the top for FOR/WHILE; the loop ends when a count or pointer reaches its limit."
  different: "The Z80 has DJNZ, a built-in counted loop on B, and compares against A (CP). The 68000's CMP can compare any data register or memory operand and its loops use CMP/BEQ or SUBQ/BNE."
  why: "The Z80's accumulator design means compares and arithmetic go through A, and its designers added DJNZ for the common counted-loop case."
---

## Learn

**Callback.** The 68000 built its loops from `CMP` and `Bcc`. The Z80 has the same pairing with its own instructions:

- **Compare:** `CP D` computes A - D and sets the flags only. The accumulator is always the other operand.
- **Branch on flags:** `JR NZ,label`, `JR Z,label`, `JR NC,label`, `JR C,label` (and `JP cc` for absolute).
- **Counted loops:** `DJNZ label` decrements **B** and jumps while B is not zero, so a loop that starts with `LD B,9` runs 9 times.
- **Bit test:** `BIT n,r` sets Z when bit n of r is 0, and leaves the register unchanged (the 68000 version needs a mask, an AND and a register to hold the mask).

The FOR example (sum 1 to 9) and the bit test above run on the Z80 core. This Z80 material is our own translation of the lecture's 68000 examples.

## Worked example

*Trace the sum loop for the first two passes.*

1. B = 9, C (sum) = 0, D = 1. Pass 1: A = C + D = 1; C = 1; D = 2; DJNZ: B = 8, not zero, jump back.
2. Pass 2: A = 1 + 2 = 3; C = 3; D = 3; B = 7.
3. After 9 passes B = 0, the loop ends and C = 45.

## Try it

*Why can't the loop counter be register C with DJNZ?*

???

DJNZ is defined to use **B** only. If you need a different counter you decrement it yourself and use `JR NZ`.
