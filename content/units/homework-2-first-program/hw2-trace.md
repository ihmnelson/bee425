---
track: shared
title: "Homework 2: tracing the program"
summary: "Word-wide AND of the bytes stored at $4000-$4001: the answer is $4515."
needs: ["hw2-workflow", "addressing-modes.m68k-post-pre"]
sources:
  - { type: handout, ref: "hw2 P1", quote: "What is the WORD VALUE (not byte, or" }
  - { type: handout, ref: "hw2 P1", quote: "MOVE.B    D1,(A0)+      * transfer byte to memory" }
  - { type: handout, ref: "hw2 P1", quote: "AND.W     D3,(A1)       * Logical AND" }
  - { type: oracle, ref: "the program below is run on the 68000 core and memory at $4000 is asserted" }
programs:
  - cpu: m68k
    name: "the homework program (BRA replaced by SIMHALT)"
    source: |
      * program
      addr1     EQU     $4000
      addr2     EQU     $4001
      data2     EQU     $A7FF
      data3     EQU     $5555
      data4     EQU     $0000
      data5     EQU     4678
      data6     EQU     %01001111
      data7     EQU     %00010111
                ORG     $1000
      start     MOVE.W  #data2,D0
                MOVE.B  #data6,D1
                MOVE.B  #data7,D2
                MOVE.W  #data3,D3
                MOVEA.W #addr1,A0
                MOVE.B  D1,(A0)+
                MOVE.B  D2,(A0)+
                MOVEA.W #addr1,A1
                AND.W   D3,(A1)
                SIMHALT
                END     start
    expect: {"mem": {"16384": [69, 21]}, "regs": {"D0": 43007, "D3": 21845}}
checks:
  - type: choice
    prompt: "What is the **word value at $4000** when the program is about to loop back (the homework question)?"
    options: ["$4515", "$4F17", "$5555", "$A7FF"]
    answer: 0
    explain: "`MOVE.B D1,(A0)+` stores %01001111 = $4F at $4000 and `MOVE.B D2,(A0)+` stores %00010111 = $17 at $4001, so the word at $4000 is $4F17 (big endian). `AND.W D3,(A1)` ANDs it with $5555: $4F17 AND $5555 = $4515. Verified by running it."
  - type: choice
    prompt: "After `MOVE.B D1,(A0)+`, what is A0?"
    options: ["$4001 (A0 advanced by one byte)", "$4000", "$4002", "$4F"]
    answer: 0
    explain: "Post-increment by the operand size: .B adds 1. The second byte goes to $4001, and A0 ends at $4002."
  - type: choice
    prompt: "Why does the memory window show **bytes** even for a word AND?"
    options: ["The simulator displays bytes; a word occupies two consecutive bytes, high byte at the lower address (big endian)", "The AND is a byte operation", "The window is broken", "It shows words only"]
    answer: 0
    explain: "Remember the simulator displays bytes even though the program writes words or long words. The word value $4515 appears as $45 at $4000 and $15 at $4001."
  - type: choice
    prompt: "Which 68000 flags does `AND.W D3,(A1)` set from $4515?"
    options: ["N = 0 (top bit clear), Z = 0 (non-zero), V = 0, C = 0", "N = 1", "Z = 1", "All set"]
    answer: 0
    explain: "AND sets N and Z from the result and clears V and C; $4515 is positive and non-zero."
card:
  front: "What does the HW2 program compute?"
  back: "It builds the word $4F17 at $4000 from two bytes (%01001111 and %00010111) using post-increment, then ANDs the word with $5555: result $4515 (hex), i.e. $45 at $4000 and $15 at $4001. Use bytes in memory, big endian."
glossary: []
---

## Learn

The homework program (with the loop `BRA start` replaced here by `SIMHALT` so it can be run to completion):

```
start   MOVE.W  #data2,D0     * D0 low word = $A7FF
        MOVE.B  #data6,D1     * D1 low byte = %01001111 = $4F
        MOVE.B  #data7,D2     * D2 low byte = %00010111 = $17
        MOVE.W  #data3,D3     * D3 low word = $5555
        MOVEA.W #addr1,A0     * A0 = $4000
        MOVE.B  D1,(A0)+      * [$4000] = $4F, A0 = $4001
        MOVE.B  D2,(A0)+      * [$4001] = $17, A0 = $4002
        MOVEA.W #addr1,A1     * A1 = $4000
        AND.W   D3,(A1)       * word at $4000: $4F17 AND $5555
```

The word at $4000 is $4F17 before the AND (high byte at the lower address, as the 68000 is big endian), and **$4515** after it. This answer was confirmed by running the program on the 68000 core.

## Worked example

*Compute $4F17 AND $5555 by hand.*

1. $4F17 = 0100 1111 0001 0111; $5555 = 0101 0101 0101 0101.
2. AND bit by bit: 0100 0101 0001 0101.
3. = **$4515**.

## Try it

*What would the word at $4000 be if the AND used $FFFF instead of $5555?*

???

$4F17 AND $FFFF = **$4F17** (all bits pass).
