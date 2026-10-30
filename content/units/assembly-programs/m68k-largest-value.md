---
track: m68k
title: Finding the largest of four bytes (68000)
summary: CMP.B followed by BGE keeps the larger value; BGE is a signed compare.
needs: [m68k-zero-block, assembly-intro.flowcharts]
sources:
  - { type: slide, ref: "L4 s194", quote: "CMP and BGE instructions are paired together" }
  - { type: slide, ref: "L4 s193", quote: "stores the number with the largest number in another memory location" }
  - { type: slide, ref: "L4 s196", quote: "SYMBOL TABLE INFORMATION" }
  - { type: oracle, ref: "both programs below are run on the 68000 core" }
programs:
  - cpu: m68k
    name: "the lecture's program, data 05 4C 42 7F"
    source: |
      * program
              OPT     CRE
              ORG     $00001000
      START   LEA     DATA,A0
              LEA     MAX_NUM,A1
              MOVE.B  (A0)+,D0
              MOVE.B  (A0)+,D1
              CMP.B   D1,D0
              BGE     NEXT1
              MOVE.B  D1,D0
      NEXT1   MOVE.B  (A0)+,D1
              CMP.B   D1,D0
              BGE     NEXT2
              MOVE.B  D1,D0
      NEXT2   MOVE.B  (A0),D1
              CMP.B   D1,D0
              BGE     NEXT3
              MOVE.B  D1,(A1)
              BRA     DONE
      NEXT3   MOVE.B  D0,(A1)
      DONE    SIMHALT
      DATA    DC.B    $05,$4C,$42,$7F
      MAX_NUM DS.B    1
              END     START
    expect:
      mem: { MAX_NUM: [0x7F] }
  - cpu: m68k
    name: "same program, data 05 90 42 30 (signed compare)"
    source: |
      * program
              ORG     $00001000
      START   LEA     DATA,A0
              LEA     MAX_NUM,A1
              MOVE.B  (A0)+,D0
              MOVE.B  (A0)+,D1
              CMP.B   D1,D0
              BGE     NEXT1
              MOVE.B  D1,D0
      NEXT1   MOVE.B  (A0)+,D1
              CMP.B   D1,D0
              BGE     NEXT2
              MOVE.B  D1,D0
      NEXT2   MOVE.B  (A0),D1
              CMP.B   D1,D0
              BGE     NEXT3
              MOVE.B  D1,(A1)
              BRA     DONE
      NEXT3   MOVE.B  D0,(A1)
      DONE    SIMHALT
      DATA    DC.B    $05,$90,$42,$30
      MAX_NUM DS.B    1
              END     START
    expect:
      mem: { MAX_NUM: [0x42] }
checks:
  - type: choice
    prompt: "In the program, D0 holds the largest value found so far. After `CMP.B D1,D0`, what does `BGE NEXT1` mean?"
    options: ["If D0 >= D1 (signed), keep D0 and skip the MOVE.B D1,D0", "If D0 < D1, branch", "Branch always", "Branch if equal only"]
    answer: 0
    explain: "CMP.B D1,D0 computes D0 - D1. BGE (branch if greater or equal, signed) is taken when D0 >= D1, so the current maximum is kept; otherwise MOVE.B D1,D0 replaces it."
  - type: choice
    prompt: "The data bytes are $05, $4C, $42, $7F. What does the program store at MAX_NUM?"
    options: ["$7F", "$05", "$4C", "$42"]
    answer: 0
    explain: "Running it: the maximum is $7F (the last number beats $4C). This is verified by running the program on the 68000 core."
  - type: choice
    prompt: "The data bytes are $05, $90, $42, $30. What does this **BGE** program store?"
    options: ["$42, because BGE is signed and $90 is -112", "$90, the largest unsigned value", "$30", "$05"]
    answer: 0
    explain: "BGE compares as signed numbers: $90 = -112, so the signed maximum is $42. An unsigned comparison would give $90. This is verified by running the program on the 68000 core."
  - type: choice
    prompt: "Why are `CMP.B` and `BGE` 'paired together'?"
    options: ["CMP sets the flags and BGE tests them to decide the branch", "They share an op-code", "BGE does the subtraction", "They always execute in parallel"]
    answer: 0
    explain: "A compare sets the condition codes; a conditional branch tests them. The comparison result itself is thrown away."
card:
  front: "Write the 68000 pattern that keeps the larger of two bytes."
  back: "MOVE.B (A0)+,D1 / CMP.B D1,D0 / BGE keep / MOVE.B D1,D0 / keep ... D0 holds the largest so far. BGE is a signed test, so bytes $80-$FF count as negative."
glossary: []
---

## Learn

The lecture's sample program compares four bytes stored in successive memory locations and saves the largest. The method: get two numbers, compare, keep the larger in D0; get the next, compare, keep the larger; and so on. The flow chart's diamonds are `CMP.B D1,D0` + `BGE`:

```
START   LEA     DATA,A0        * pointer to data
        LEA     MAX_NUM,A1     * pointer to result
        MOVE.B  (A0)+,D0       * first number
        MOVE.B  (A0)+,D1       * second number
        CMP.B   D1,D0          * D0 - D1, flags only
        BGE     NEXT1          * keep D0 if D0 >= D1
        MOVE.B  D1,D0          * else the second is bigger
NEXT1   ...                    * repeat for the third and fourth
DATA    DC.B    $05,$4C,$42,$7F
MAX_NUM DS.B    1              * result goes here
```

The assembler's **list file** shows each instruction's address and machine code, and a **symbol table** (for example `DATA = 1036`, `START = 1000`). Data and variable regions are placed after the code; `END START` ends the source.

**Signed or unsigned?** `BGE` treats bytes as signed, so `$90` counts as -112. The program therefore picks `$42` from `$05,$90,$42,$30`. If you want the unsigned maximum you need an unsigned branch such as `BHS`; this is exactly the signed/unsigned ambiguity of Homework 3.

## Worked example

*Trace the first comparison for data $05 then $4C.*

1. D0 = $05, D1 = $4C. `CMP.B D1,D0` computes $05 - $4C = $B9 (negative).
2. N = 1 and V = 0, so BGE (taken when N = V) is **not** taken.
3. `MOVE.B D1,D0` runs: D0 = $4C, the larger.

## Try it

*Change the data to `$80,$01,$02,$03`. What value does the signed program leave in MAX_NUM?*

???

$80 = -128 is the smallest signed byte, so the signed maximum is **$03**. (Unsigned, $80 = 128 would win.)
