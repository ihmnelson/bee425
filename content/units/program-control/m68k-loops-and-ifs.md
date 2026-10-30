---
track: m68k
title: "if, FOR and DO/WHILE in assembly"
summary: "Build each construct from a test (or an instruction that changes a variable) and the matching branch."
needs: [m68k-compare-and-flags]
sources:
  - { type: slide, ref: "L5 s237", quote: "pair an instruction that either TESTS A CONDITION" }
  - { type: slide, ref: "L5 s239", quote: "Loop constructs in assembly language follow the same general structure" }
  - { type: slide, ref: "L5 s240", quote: "the function call (JSR subroutine) happens at least once" }
  - { type: slide, ref: "L5 s242", quote: "Program to find the largest value in an array of bytes" }
  - { type: oracle, ref: "the FOR loop and the array-maximum program below are run on the 68000 core" }
programs:
  - cpu: m68k
    name: "FOR loop: counts 9 passes"
    source: |
      * program
              ORG     $1000
      START   MOVE.L  #1,D0
              MOVE.L  #10,D1
              CLR.L   D2
      for_loop CMP.B  D0,D1
              BEQ     next_code
              ADDQ.L  #1,D2
              ADDQ.L  #1,D0
              BRA     for_loop
      next_code SIMHALT
              END     START
    expect:
      regs: { D2: 9 }
  - cpu: m68k
    name: "largest value in a null-terminated array"
    source: |
      * program
              ORG     $400
      start   LEA     data,A0
              CLR.B   D0
      next    MOVE.B  (A0)+,D1
              BEQ     exit
              CMP.B   D0,D1
              BLE     end_test
              MOVE.B  D1,D0
      end_test BRA    next
      exit    SIMHALT
              ORG     $1000
      data    DC.B    12,13,5,6,8,4,10,0
              END     start
    expect:
      regs: { D0: 13 }
checks:
  - type: choice
    prompt: "Which test is at the **top** of a FOR or WHILE loop but at the **bottom** of a DO/WHILE loop?"
    options: ["The compare and conditional branch that decides whether to continue", "The label", "The SIMHALT", "The counter initialisation"]
    answer: 0
    explain: "A FOR/WHILE tests first, so the body may run zero times. A DO/WHILE runs the body first, so it always executes at least once; the lecture's example shows the JSR subroutine call happening at least once."
  - type: choice
    prompt: "In the lecture's FOR loop (D0 counts from 1, D1 = 10, test `CMP.B D0,D1` then `BEQ next_code`), how many times does the body run?"
    options: ["9 times: it stops when D0 reaches 10 before running the body", "10 times", "1 time", "11 times"]
    answer: 0
    explain: "The loop ends when D0 = 10, so the body runs for D0 = 1 to 9: nine passes. The core confirms D2 = 9."
  - type: choice
    prompt: "What does a **null byte** ($00) do in the array-maximum program?"
    options: ["It ends the array: MOVE.B sets Z, so BEQ exit leaves the loop", "It is the largest value", "It is skipped", "It causes an error"]
    answer: 0
    explain: "MOVE.B (A0)+,D1 sets the flags from the byte read; a zero sets Z, and `BEQ exit` leaves the loop."
  - type: choice
    prompt: "Which general rule does the lecture give for building loops and ifs?"
    options: ["Pair an instruction that tests a condition or changes a variable with the proper branch instruction", "Always use JSR", "Avoid labels", "Use as few registers as possible"]
    answer: 0
    explain: "Assembly has no built-in if/while/for; you build them from a flag-setting instruction (CMP, or any instruction that changes a variable) and a branch (Bcc, BRA, JSR)."
card:
  front: "How do you build if, FOR, WHILE and DO/WHILE in assembly?"
  back: "Pair a flag-setting instruction (CMP, or one that changes the variable) with a conditional branch. FOR/WHILE: test at the top, BRA back at the bottom. DO/WHILE: body first, test and branch back at the bottom (runs at least once). if: CMP, then branch around or to the matching code."
glossary: []
---

## Learn

C++ and Java have built-in if/else, while, do/while, switch, for and function calls. In assembly you build them from **branch, jump and jump-to-subroutine** instructions. The rule: **pair an instruction that tests a condition or changes a variable with the proper branch**.

- **if**: `CMP.L D0,D1` then `BEQ equal`. The lecture's example loads 3 and 5; since they differ, `not_equal` executes.
- **FOR**: initialise the counter and the terminal value; `CMP` at the top; `BEQ` out when done; body; increment; `BRA` back.
- **DO/WHILE**: initialise; do the body (even a `JSR`) first; then `CMPI.B #test_value,(A2)+` and `BNE test_loop`. The body always runs at least once.

Both loop programs below are run on the core.

The array-maximum program: the array is null-terminated; `MOVE.B (A0)+,D1` reads a byte and sets the flags; a zero ends the loop; `CMP.B D0,D1` then `BLE` skips the replacement when the new byte is not larger. D0 ends holding 13 for `12,13,5,6,8,4,10,0`. (The lecture ends it with `STOP #$2700`; `SIMHALT` is used in the simulator.)

## Worked example

*Trace the array program for data 12, 13, 5, 0.*

1. D0 = 0. Read 12: not zero; 12 > 0 so D0 = 12.
2. Read 13: 13 > 12 so D0 = 13.
3. Read 5: 5 <= 13 so `BLE` skips. Read 0: Z = 1, so `BEQ exit` ends with **D0 = 13**.

## Try it

*Which loop type is `CMPA.L A1,A0` / `BEQ done` / ... / `BRA clr_loop`?*

???

A **WHILE** loop (test at the top, `BRA` back at the bottom).
