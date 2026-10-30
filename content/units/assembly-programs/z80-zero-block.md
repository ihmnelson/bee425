---
track: z80
title: Zeroing a block of memory (Z80)
summary: HL as the pointer, DE as the end address, and a compare of both halves because the Z80 has no 16-bit compare.
needs: [z80-load, programmers-model.z80-flags]
sources:
  - { type: oracle, ref: "the Z80 loop below is run on the Z80 core with the block preloaded to FFH" }
  - { type: own, ref: "Z80 translation of the lecture's 68000 zeroing loop (slides 158-173); the lecture shows no Z80 version" }
programs:
  - cpu: z80
    name: "zero 2000H up to but not including 2010H"
    source: |
      ; program
              .ORG 0100H
      STADDR  .EQU 2000H
      ENADDR  .EQU 2010H
      START:  LD HL,STADDR
              LD DE,ENADDR
      LOOP:   LD A,H
              CP D
              JR NZ,CLR
              LD A,L
              CP E
              JR Z,DONE
      CLR:    LD [HL],0
              INC HL
              JR LOOP
      DONE:   HALT
              .END
    expect:
      preload: { 8192: [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255] }
      mem: { 8192: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 8208: [255,255,255,255] }
      regs: { hl: 0x2010 }
checks:
  - type: choice
    prompt: "Why does the Z80 loop compare **H with D, then L with E**, instead of one `CMP`?"
    options: ["The Z80's CP works on the 8-bit accumulator, so a 16-bit pointer has to be compared a byte at a time", "H and D are special", "CP is slow", "The Z80 cannot compare"]
    answer: 0
    explain: "CP compares an 8-bit register or memory byte with A. There is no 16-bit address compare like the 68000's CMPA.L A1,A0, so HL is compared with DE high byte then low byte."
  - type: choice
    prompt: "What replaces the 68000's `CLR.L (A0)+` in the Z80 loop?"
    options: ["`LD [HL],0` then `INC HL` (store, then advance the pointer by hand)", "`CLR (HL)+`", "`LD (HL)+,0`", "`DEC HL`"]
    answer: 0
    explain: "The Z80 has no auto-increment addressing mode: store the byte with LD (HL),0, then INC HL. It also clears one byte per pass, not four."
  - type: choice
    prompt: "Is the byte at the **end address** (2010H) cleared?"
    options: ["No. The loop stops when HL = DE, before clearing it", "Yes", "Only if it is zero", "Only the first time"]
    answer: 0
    explain: "Like the 68000 version, the test is at the top of the loop, so the end address is never cleared."
card:
  front: "Write the Z80 loop that zeroes memory from HL up to (not including) DE."
  back: "LOOP: LD A,H / CP D / JR NZ,CLR / LD A,L / CP E / JR Z,DONE / CLR: LD (HL),0 / INC HL / JR LOOP. No auto-increment and no 16-bit compare, so the pointer is advanced by hand and compared a byte at a time."
glossary: []
bridge:
  to: assembly-programs.m68k-zero-block
  same: "A WHILE loop with the test at the top: initialise a pointer and an end address, stop when they are equal, clear, advance, branch back. The end address is not cleared."
  different: "The 68000 has CMPA.L (a 32-bit pointer compare), CLR.L and the (A0)+ auto-increment, and clears 4 bytes per pass. The Z80 compares H and L separately, clears one byte per pass, and advances the pointer with INC HL."
  why: "The Z80 is an 8-bit machine with an accumulator, no auto-increment mode and no 16-bit compare, so what the 68000 does in a few powerful instructions takes several simple ones."
---

## Learn

**Callback.** The 68000 loop was `LEA`, `LEA`, `CMPA.L A1,A0`, `BEQ done`, `CLR.L (A0)+`, `BRA`. The same job on the Z80 uses **HL as the pointer** and **DE as the end address**:

```
START:  LD HL,STADDR
        LD DE,ENADDR
LOOP:   LD A,H          ; compare the high bytes
        CP D
        JR NZ,CLR       ; different: not at the end
        LD A,L          ; same: compare the low bytes
        CP E
        JR Z,DONE       ; equal: finished
CLR:    LD [HL],0       ; clear one byte
        INC HL          ; advance the pointer by hand
        JR LOOP
DONE:   HALT
```

Differences to notice: no `CMPA`-style 16-bit compare (so two byte compares through A), no auto-increment (so `INC HL`), one byte per pass instead of a long word, and `HALT` in place of the simulator's `SIMHALT`. The lecture shows only the 68000 version; this Z80 version is our own, and it is run on the Z80 core with the block preloaded to FFH to prove it clears exactly 2000H to 200FH.

## Worked example

*Which flags drive the two branches in the loop?*

1. `CP D` sets Z when H = D. `JR NZ,CLR` is taken when Z = 0 (high bytes differ, so definitely not at the end).
2. If the high bytes match, `CP E` sets Z when L = E, and `JR Z,DONE` leaves the loop.
3. The 68000 gets the same result from a single Z flag after `CMPA.L`.

## Try it

*How many passes (iterations that clear a byte) does the loop make from 2000H to 2010H?*

???

**16**: one byte per pass from 2000H through 200FH. The 68000 version clears 4 bytes per pass, so it needs only 4.
