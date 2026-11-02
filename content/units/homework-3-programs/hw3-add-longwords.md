---
track: shared
title: "Homework 3, problem 1: add two longwords"
summary: "Three instructions: load, add, store; a long operation moves four bytes."
needs: ["assembly-programs.m68k-move"]
sources:
  - { type: handout, ref: "hw3 P1", quote: "adds together the long word" }
  - { type: handout, ref: "hw3 P1", quote: "stores the" }
  - { type: oracle, ref: "the program below is run on the 68000 core" }
programs:
  - cpu: m68k
    name: "add the longwords at $A300 and $A304 into $A308"
    source: |
      * program
              ORG     $1000
      start   MOVE.L  $A300,D0
              ADD.L   $A304,D0
              MOVE.L  D0,$A308
              SIMHALT
              ORG     $A300
              DC.L    $00012345,$00054321
              END     start
    expect: {"mem": {"41736": [0, 6, 102, 102]}}
checks:
  - type: choice
    prompt: "Which instruction sequence adds the long word at $A300 to the long word at $A304 and stores the sum at $A308?"
    options: ["MOVE.L $A300,D0 / ADD.L $A304,D0 / MOVE.L D0,$A308", "MOVE.W $A300,D0 / ADD.W $A304,D0 / MOVE.W D0,$A308", "MOVE.B $A300,D0 / ADD.B $A304,D0 / MOVE.B D0,$A308", "ADD.L $A300,$A308"]
    answer: 0
    explain: "The operands are long words, so every instruction must be .L: load the first, add the second and store the sum at $A308. Using .W would add only the low words (the lecture's checker rejects ADD.W)."
  - type: choice
    prompt: "With $00012345 at $A300 and $00054321 at $A304, what is stored at $A308 after adding the two long words?"
    options: ["$00066666", "$00054321", "$00012345", "$00066664"]
    answer: 0
    explain: "$00012345 + $00054321 = $00066666. Verified by running the program."
  - type: choice
    prompt: "A handout writes the first address as $000A300 (seven digits). What is the intended address?"
    options: ["$0000A300, with the others at $0000A304 and $0000A308", "$000A3000, shifted one hex digit left", "$00A300, with the leading zeros dropped", "It is correct as printed; a 7-digit address is valid"]
    answer: 0
    explain: "The handout writes $000A300 (seven digits) for the first operand but $0000A304 and $0000A308 for the others, so $0000A300 is meant."
card:
  front: "How do you add two longwords in memory?"
  back: "MOVE.L first,D0 / ADD.L second,D0 / MOVE.L D0,result. Use .L throughout; the sum wraps modulo 2^32 and sets the flags (carry if it overflows)."
glossary: []
---

## Learn

**Problem 1:** write a short program in 68K assembly that adds the **long word** at one address to the long word at $0000A304 and stores the result at $0000A308. (The handout prints the first address as `$000A300`, an apparent typo for `$0000A300`.)

The solution uses three instructions, all with the **.L** size:

```
start   MOVE.L  $A300,D0     * first longword
        ADD.L   $A304,D0     * plus the second
        MOVE.L  D0,$A308     * store the sum
```

The program above, with test data $00012345 and $00054321, leaves $00066666 at $A308 (the core confirms the four bytes 00 06 66 66). A wrong size (`ADD.W`) would add only the low words and be rejected by a checker.

## Worked example

*Which flags are affected by the ADD.L?*

1. ADD sets X, N, Z, V and C from the long result.
2. Here the sum is positive and non-zero: N = 0, Z = 0; no overflow or carry: V = 0, C = 0.
3. The following MOVE.L resets N and Z from the stored value.

## Try it

*Why not use `ADD.L $A300,$A304`?*

???

On the 68000 the destination of an ADD must be a data register unless the source is one (ADD <ea>,Dn or ADD Dn,<ea>); adding memory to memory directly is not allowed, so you go through D0.
