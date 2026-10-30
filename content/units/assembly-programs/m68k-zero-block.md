---
track: m68k
title: Zeroing a block of memory (68000)
summary: "From eight MOVE.B instructions to a loop: long moves, address-register pointers, auto-increment and a WHILE loop."
needs: [m68k-directives, programmers-model.m68k-flags]
sources:
  - { type: slide, ref: "L4 s158", quote: "This works perfectly well but is inefficient" }
  - { type: slide, ref: "L4 s159", quote: "Autoincrementing (+ sign) makes the code" }
  - { type: slide, ref: "L4 s172", quote: "Branch Always to instruction labeled “clr_loop”" }
  - { type: slide, ref: "L4 s173", quote: "SIMHALT: Easy68K pseudo-instruction to stop simulation" }
  - { type: oracle, ref: "the loop program below is run on the 68000 core with the block preloaded to $FF" }
programs:
  - cpu: m68k
    name: "zero $2000 up to but not including $2010"
    source: |
      * program
      st_addr   EQU     $00002000
      end_addr  EQU     $00002010
                ORG     $1000
      START     LEA     st_addr,A0
                LEA     end_addr,A1
      clr_loop  CMPA.L  A1,A0
                BEQ     done
                CLR.L   (A0)+
                BRA     clr_loop
      done      SIMHALT
                END     START
    expect:
      preload: { 8192: [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255] }
      mem: { 8192: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 8208: [255,255,255,255] }
      regs: { A0: 0x2010 }
      flags: { Z: 1 }
checks:
  - type: choice
    prompt: "In the loop `CLR.L (A0)+`, what does the **+** do?"
    options: ["After the clear, A0 is advanced by 4 bytes (one long word)", "It adds 1 to the data", "It makes the address negative", "It is a comment"]
    answer: 0
    explain: "Auto-increment: the memory at the address in A0 is cleared, then A0 is advanced by the operand size. With .L that is 4 bytes."
  - type: choice
    prompt: "How does the loop **decide to stop**?"
    options: ["CMPA.L A1,A0 sets Z when the pointer A0 reaches the end address in A1, and BEQ done leaves the loop", "It counts down from 100", "It waits for a key", "SIMHALT stops it after one pass"]
    answer: 0
    explain: "CMPA.L A1,A0 subtracts A1 from A0 and ignores the result; Z = 1 when A0 equals A1. BEQ done then branches out. The end address itself is never cleared."
  - type: choice
    prompt: "Which loop type is this?"
    options: ["A WHILE loop (the test is at the top)", "A DO-WHILE loop (the test is at the bottom)", "A FOR loop with a counter", "No loop"]
    answer: 0
    explain: "The test (CMPA.L/BEQ) comes first, then the body (CLR.L), then BRA back to the top: a WHILE structure."
  - type: choice
    prompt: "Why use `LEA st_addr,A0` instead of `MOVEA.L #st_addr,A0`?"
    options: ["LEA is the preferred, flexible way to initialise an address register", "LEA is faster to type only", "MOVEA cannot take a number", "They are different operations"]
    answer: 0
    explain: "The lecture: LEA (Load Effective Address) is the preferred way to initialise an address register with a value."
  - type: choice
    prompt: "What does `SIMHALT` do, and will it run on a real 68000?"
    options: ["It stops the EASy68K simulator; it is a simulator pseudo-instruction, not a 68000 instruction", "It halts any 68000", "It resets the processor", "It is a directive"]
    answer: 0
    explain: "SIMHALT is unique to the EASy68K simulator. On real hardware you might loop forever with `done BRA done`."
card:
  front: "Write the 68000 loop that zeroes memory from st_addr up to (not including) end_addr."
  back: "LEA st_addr,A0 / LEA end_addr,A1 / clr_loop CMPA.L A1,A0 / BEQ done / CLR.L (A0)+ / BRA clr_loop / done SIMHALT. CLR.L (A0)+ clears a long word and advances the pointer by 4."
glossary:
  - { term: "Auto-increment (An)+", def: "Use the address in An, then add the operand size (1, 2 or 4) to An." }
---

## Learn

The lecture starts simple and improves the code step by step, to clear a block from `$00002000` up to but **not including** `$00002008`:

1. **Eight `MOVE.B #$00,addr` instructions**: works, but inefficient and not suitable for large blocks.
2. **Two `MOVE.L #0,addr`**: clear 4 bytes at a time (the end must be on a long-word boundary).
3. **Address register as a pointer**: `MOVEA.L #$2000,A0` then `MOVE.L #0,(A0)`; use `MOVEA` when the destination is an address register.
4. **Auto-increment**: `MOVE.L #0,(A0)+` clears and advances the pointer, nearly halving the code.
5. **`LEA`** initialises the pointer.
6. **A loop**, once the block is large. Three things to settle: the loop type (FOR, WHILE, DO-WHILE), how to initialise it, and how to stop it.

The final program (checked by running it on this site's 68000 core, with the block preloaded to $FF so it must really clear it):

```
st_addr   EQU   $00002000
end_addr  EQU   $00003000
          ORG   $1000
START     LEA     st_addr,A0     * pointer to the start
          LEA     end_addr,A1    * pointer to the end
clr_loop  CMPA.L  A1,A0          * A0 - A1, result ignored
          BEQ     done           * Z = 1 when A0 = A1
          CLR.L   (A0)+          * clear a long word, advance 4
          BRA     clr_loop       * end of the loop (a GOTO)
done      SIMHALT
          END     START
```

Pseudo-ops: `EQU` makes the program readable and flexible (like `#define`); `ORG` sets where it assembles; `END START` marks the end and the start address. Header and comment lines start with `*` or `;`.

## Worked example

*Trace the loop for `st_addr = $2000` and `end_addr = $2008`.*

1. A0 = $2000, A1 = $2008. Compare: not equal, so Z = 0 and BEQ is not taken.
2. `CLR.L (A0)+` clears $2000-$2003; A0 = $2004. BRA back.
3. Compare again: still not equal; clear $2004-$2007; A0 = $2008.
4. Compare: A0 = A1, Z = 1, BEQ takes the branch to `done`. **$2008 itself is never cleared.**

## Try it

*In-class exercise from the lecture: change the program to fill the block with the byte $AA instead. Which instruction(s) change?*

???

Only the clear instruction: use `MOVE.B #$AA,(A0)+` in place of `CLR.L (A0)+` (the pointer then advances by 1, so the loop runs once per byte, still stopping when A0 = A1). With `MOVE.L #$AAAAAAAA,(A0)+` the pointer advances by 4 as before.
