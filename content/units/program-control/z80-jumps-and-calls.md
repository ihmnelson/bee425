---
track: z80
title: "Z80 jumps, relative jumps, calls and returns"
summary: "JP is absolute, JR is relative (+/-128), CALL/RET use the stack; the Z80 has conditional jumps, calls and returns that the 68000 lacks."
needs: [programmers-model.z80-flags, assembly-programs.z80-zero-block]
sources:
  - { type: slide, ref: "L5 s225", quote: "Z80: IF cc TRUE, nn → PC : JP cc,nn" }
  - { type: slide, ref: "L5 s226", quote: "nn can be +/- 128 bytes" }
  - { type: slide, ref: "L5 s227", quote: "Conditional return from subroutine" }
  - { type: oracle, ref: "the CALL/RET and conditional-jump program below is run on the Z80 core" }
encodings:
  - { cpu: z80, asm: "RET", hex: "C9" }
  - { cpu: z80, asm: "RET Z", hex: "C8" }
  - { cpu: z80, asm: "JP 0ABCDH", hex: "C3 CD AB" }
programs:
  - cpu: z80
    name: "CALL a subroutine, and a conditional return"
    source: |
      ; program
              .ORG 0100H
      START:  LD SP,0F000H
              LD A,5
              CALL DOUBLE
              LD B,A
              XOR A
              CALL ZERO_OR_SEVEN
              LD C,A
              HALT
      DOUBLE: ADD A,A
              RET
      ZERO_OR_SEVEN:
              OR A
              RET Z
              LD A,7
              RET
              .END
    expect:
      regs: { b: 10, c: 0, sp: 0xF000 }
checks:
  - type: choice
    prompt: "Which of these exists on the **Z80 but not on the 68000**?"
    options: ["A conditional absolute jump (JP cc,nn), a conditional CALL and a conditional RET", "An unconditional jump", "A subroutine call", "A branch relative to the PC"]
    answer: 0
    explain: "The 68000 has only conditional branches (Bcc); there is no conditional jump, conditional JSR or conditional RTS. The Z80 has JP cc,nn, CALL cc,nn and RET cc."
  - type: choice
    prompt: "What is the range of the Z80's **JR** (jump relative) instruction?"
    options: ["About +/-128 bytes (an 8-bit displacement)", "+/-32K bytes", "The whole 64K", "0 to 255 only"]
    answer: 0
    explain: "JR nn uses an 8-bit signed offset (+/- 128 bytes) from the PC. The 68000's BRA nnnn has a 16-bit displacement and reaches +/- 32K. Both are relative to the PC, so they are independent of where the code sits in memory."
  - type: choice
    prompt: "Match the pairs: subroutine call/return, return from interrupt."
    options: ["68000 JSR / RTS / RTE with Z80 CALL / RET / RETI", "68000 CALL / RET with Z80 JSR / RTS", "Both use CALL / RET", "They have no equivalents"]
    answer: 0
    explain: "The lecture's table: JSR nnnn / CALL nn, RTS / RET, RTE / RETI. In both cases the return address goes on the stack."
  - type: choice
    prompt: "Which condition codes (cc) can follow JP on the Z80?"
    options: ["NZ, Z, NC, C, P (sign positive), M (sign negative)", "EQ, NE, GT, LT", "X, N, Z, V, C", "Only Z"]
    answer: 0
    explain: "The lecture lists NZ (non-zero), Z (zero), NC (no carry), C (carry), P (sign positive) and M (sign negative); the Z80 has more (parity) in its full set."
card:
  front: "Compare Z80 and 68000 jumps, branches, calls and returns."
  back: "Absolute jump: JMP / JP (Z80 also has JP cc,nn; the 68000 does not). Relative: BRA nnnn (+/-32K) / JR nn (+/-128), conditional Bcc / JR cc. Call: JSR / CALL (Z80 also CALL cc). Return: RTS / RET (Z80 also RET cc). Interrupt return: RTE / RETI."
glossary: []
bridge:
  to: program-control.m68k-stack-subroutines
  same: "Calls push the return address on the stack and returns pop it; relative jumps/branches add a signed displacement to the PC and are independent of where the code is."
  different: "The Z80 has absolute conditional jumps, calls and returns (JP cc, CALL cc, RET cc). The 68000 only has conditional branches. JR reaches +/-128 bytes, BRA +/-32K. The Z80 pushes a 16-bit return address, the 68000 a 32-bit one."
  why: "The 68000 puts its conditional logic in one family (Bcc) and keeps jumps unconditional; the Z80 adds a condition field to several instruction types."
---

## Learn

**Callback.** The 68000 had `JMP`, `BRA`/`Bcc` and `JSR`/`RTS`. The Z80's versions (from the lecture):

| Job | 68000 | Z80 |
|---|---|---|
| Absolute jump | `JMP $0000ABCD` (16 or 32-bit address) | `JP 0ABCDH` (16-bit) |
| Conditional absolute jump | **does not exist** | `JP cc,nn` with cc = NZ, Z, NC, C, P, M |
| Relative unconditional | `BRA nnnn` (16 bits, +/-32K) | `JR nn` (8 bits, +/-128) |
| Relative conditional | `Bcc nnnn` | `JR cc,nn` |
| Call a subroutine | `JSR nnnn` | `CALL nn` |
| Conditional call | does not exist | `CALL cc,nn` |
| Return | `RTS` | `RET` |
| Conditional return | does not exist | `RET cc` |
| Return from interrupt | `RTE` | `RETI` |

In both cases `JSR`/`CALL` places the address of the next instruction on the stack.

A **relative** jump or branch adds a **signed** displacement to the PC, so it can go backward or forward and is independent of where the code is loaded.

The program above runs `CALL DOUBLE` (A = 5 becomes 10) and `RET Z` (a conditional return: with A = 0 it returns immediately, so A stays 0).

## Worked example

*What does `ZERO_OR_SEVEN` return when A = 3?*

1. `OR A` sets flags from A; A = 3 is non-zero, so Z = 0.
2. `RET Z` is **not** taken, so execution continues.
3. `LD A,7` then `RET`: A = 7. With A = 0, Z = 1 and the first `RET Z` returns with A = 0.

## Try it

*Can a 68000 program branch only if the carry flag is clear, and jump to a 32-bit absolute address?*

???

It can branch on carry clear with `BCC` (relative, +/-32K), but there is **no conditional absolute jump**. To do both you would branch around an unconditional `JMP` using the opposite condition.
