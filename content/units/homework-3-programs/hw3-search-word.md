---
track: shared
title: "Homework 3, problem 2: search a block for $AA55"
summary: "A WHILE loop with a pointer and an end address; CMP.W (A0)+,D0 compares and advances; BHS ends the loop."
needs: ["assembly-programs.m68k-zero-block", "program-control.m68k-loops-and-ifs"]
sources:
  - { type: handout, ref: "hw3 P2", quote: "searches a block of memory for the first occurrence" }
  - { type: handout, ref: "hw3 P2", quote: "The specific pattern to look for is $AA55" }
  - { type: oracle, ref: "the program below is run on the 68000 core with test data" }
programs:
  - cpu: m68k
    name: "first $AA55 in the block (A2 = its address)"
    source: |
      * program
      start_addr EQU $00002000
      end_addr   EQU $00002020
      pattern    EQU $AA55
              ORG     $1000
      start   LEA     start_addr,A0
              LEA     end_addr,A1
              MOVE.W  #pattern,D0
              SUBA.L  A2,A2
      loop    CMPA.L  A1,A0
              BHS     done
              CMP.W   (A0)+,D0
              BNE     loop
              LEA     -2(A0),A2
      done    SIMHALT
              ORG     $2000
              DC.W    $1234,$55AA,$AA55,$0000,$AA55,$FFFF,$AA55,$0001
              DC.W    $0000,$0000,$0000,$0000,$0000,$0000,$0000,$0000
              END     start
    expect: {"regs": {"A2": 8196}}
  - cpu: m68k
    name: "no match leaves A2 = 0"
    source: |
      * program
      start_addr EQU $00002000
      end_addr   EQU $00002010
      pattern    EQU $AA55
              ORG     $1000
      start   LEA     start_addr,A0
              LEA     end_addr,A1
              MOVE.W  #pattern,D0
              SUBA.L  A2,A2
      loop    CMPA.L  A1,A0
              BHS     done
              CMP.W   (A0)+,D0
              BNE     loop
              LEA     -2(A0),A2
      done    SIMHALT
              ORG     $2000
              DC.W    $1234,$55AA,$0000,$FFFF,$0001,$0002,$0003,$0004
              END     start
    expect: {"regs": {"A2": 0}}
checks:
  - type: choice
    prompt: "In the solution, why is the address of the match `A0 - 2` and not A0?"
    options: ["`CMP.W (A0)+,D0` post-increments A0 by 2 after the compare, so A0 points one word past the match", "A0 is always wrong", "The match is 2 bytes before the block", "LEA adds 2"]
    answer: 0
    explain: "The compare consumes the word and advances the pointer, so after a match A0 is one word beyond it. `LEA -2(A0),A2` recovers the match address."
  - type: choice
    prompt: "Why is the loop ended with the **unsigned** test BHS after `CMPA.L A1,A0`?"
    options: ["Addresses are unsigned: compare A0 with the end address as unsigned numbers", "BHS means branch if halted", "Signed is not allowed", "It is faster"]
    answer: 0
    explain: "Addresses are unsigned quantities (the lecture's example: 0006 is a lower address than FFFE although signed it is greater). BHS (higher or same) exits when A0 reaches or passes the end address."
  - type: choice
    prompt: "The data words are $1234, $55AA, $AA55, ... starting at $2000. What does the program leave in A2?"
    options: ["$2004 (the first $AA55 is the third word)", "$2000", "$2002", "0"]
    answer: 0
    explain: "Words at $2000, $2002, $2004: the third, at $2004, is the first $AA55. $55AA is not a match (bytes swapped). Verified by running it."
  - type: choice
    prompt: "What does the program leave in A2 when the pattern is **not** in the block?"
    options: ["0 (the 'not found' value set by SUBA.L A2,A2)", "The end address", "$FFFFFFFF", "Undefined"]
    answer: 0
    explain: "A2 is cleared first so that 0 means not found; the second test program confirms it."
card:
  front: "Write the HW3 search loop."
  back: "LEA start,A0 / LEA end,A1 / MOVE.W #pattern,D0 / SUBA.L A2,A2 / loop: CMPA.L A1,A0 / BHS done / CMP.W (A0)+,D0 / BNE loop / LEA -2(A0),A2 / done. The end address is not searched; words are on even addresses; A2 = 0 if not found."
glossary: []
---

## Learn

**Problem 2:** search a block of memory for the **first occurrence of a specific 16-bit word, $AA55**, on an even word boundary. The block can be any size, so use a loop and take the **starting and ending addresses as EQUates**.

The loop (confirmed on the core with test data):

```
start_addr EQU $00002000
end_addr   EQU $00002020     * first address NOT searched
pattern    EQU $AA55
        LEA     start_addr,A0  * pointer
        LEA     end_addr,A1    * limit
        MOVE.W  #pattern,D0
        SUBA.L  A2,A2          * A2 = 0: not found yet
loop    CMPA.L  A1,A0
        BHS     done           * unsigned: reached the end
        CMP.W   (A0)+,D0       * compare, then A0 += 2
        BNE     loop
        LEA     -2(A0),A2      * A0 is one word past the match
done    SIMHALT
```

Three ideas: the **WHILE** loop shape you already know; **post-increment** by 2 for words; and the address compare is **unsigned** (BHS), not signed.

## Worked example

*The block is three words: $0001, $AA55, $AA55 starting at $3000. What does the loop find?*

1. $3000: $0001 is not a match; A0 = $3002.
2. $3002: $AA55 matches; A0 = $3004.
3. A2 = $3004 - 2 = **$3002**, the first match (the second is ignored).

## Try it

*How would you change the program to search every byte address instead of words?*

???

Compare bytes, or step the pointer by 1 and compare a word at each address using a non-incrementing `CMP.W (A0),D0` with `ADDQ.L #1,A0`; but a word access at an odd address is not allowed on the 68000, so the handout limits it to word boundaries.
