---
track: m68k
title: "Modes 3 and 4: post-increment and pre-decrement"
summary: "(An)+ uses then advances the pointer; -(An) steps back then uses it; both move by the operand size, and they build the stack."
needs: [m68k-indirect]
sources:
  - { type: slide, ref: "L5 s207", quote: "Mode 3: Post-increment" }
  - { type: slide, ref: "L5 s207", quote: "Mode 4: Pre-decrement" }
  - { type: slide, ref: "L5 s210", quote: "68K stacks grow from high memory to low memory" }
  - { type: slide, ref: "L5 s211", quote: "Indirect addressing with pre-decrement" }
  - { type: oracle, ref: "the post-increment, loop and stack programs below are run on the 68000 core" }
programs:
  - cpu: m68k
    name: "ADD.B (A0)+,D0 from the lecture"
    source: |
      * program
              ORG     $1000
      START   MOVE.B  #$3A,D0
              LEA     $00001500,A0
              MOVE.B  #$57,(A0)
              ADD.B   (A0)+,D0
              SIMHALT
              END     START
    expect:
      regs: { D0: 0x91, A0: 0x1501 }
  - cpu: m68k
    name: "sum five bytes with a post-increment loop"
    source: |
      * program
              ORG     $1000
      START   MOVE.B  #5,D0
              LEA     Table,A0
              CLR.W   D1
      Loop    ADD.B   (A0)+,D1
              SUBQ.B  #1,D0
              BNE     Loop
              SIMHALT
      Table   DC.B    1,4,2,6,5
              END     START
    expect:
      regs: { D1: 18 }
  - cpu: m68k
    name: "push and pop with the stack pointer"
    source: |
      * program
              ORG     $1000
      START   LEA     $00100000,SP
              MOVE.L  #$87654321,-(SP)
              MOVE.L  (SP)+,D5
              SIMHALT
              END     START
    expect:
      regs: { D5: 0x87654321, A7: 0x00100000 }
      mem: { 1048572: [0x87, 0x65, 0x43, 0x21] }
checks:
  - type: choice
    prompt: "`<A0> = $00001000`, the byte there is $57, `<D0> = $3A`. After `ADD.B (A0)+,D0`, what are D0's low byte and A0?"
    options: ["$91 and $00001001", "$91 and $00001000", "$57 and $00001001", "$3A and $00001004"]
    answer: 0
    explain: "A0 is used first to read the byte ($57), the sum $3A + $57 = $91 goes to D0, and then A0 is incremented by the operand size (1 for a byte): $00001001. Verified by running it."
  - type: choice
    prompt: "By how much does `MOVE.W D1,(A6)+` change A6?"
    options: ["+2 (the size of a word)", "+1", "+4", "0"]
    answer: 0
    explain: "Modes 3 and 4 are aware of the operand size: .B changes the register by 1, .W by 2 and .L by 4."
  - type: choice
    prompt: "SP = $00100000. After `MOVE.L #$87654321,-(SP)`, what is SP, and where is the high word $8765?"
    options: ["SP = $00FFFFFC, with $8765 at $00FFFFFC and $4321 at $00FFFFFE", "SP = $00100004", "SP = $00100000, with $8765 at $00100000", "SP = $00FFFFFE"]
    answer: 0
    explain: "Pre-decrement: SP is reduced by 4 before the write, so SP = $FFFFFC, and big-endian storage puts the high word at the lower address. The 68000 stack grows from high memory toward low."
  - type: choice
    prompt: "Which addressing modes do **PUSH** and **POP** use on a stack that grows downward (as the 68000's does)?"
    options: ["PUSH: pre-decrement. POP: post-increment", "PUSH: post-increment. POP: pre-decrement", "Both use post-increment", "Both use absolute addressing"]
    answer: 0
    explain: "PUSH is `-(SP)` (move down, then store) and POP is `(SP)+` (read, then move up). A stack that grows upward would use the opposite pair."
card:
  front: "What do (An)+ and -(An) do, and how do they make a stack?"
  back: "(An)+: use the address, then add the operand size (1/2/4). -(An): subtract the size, then use the address. PUSH = MOVE x,-(SP); POP = MOVE (SP)+,x. The 68000 stack grows from high memory toward low."
glossary:
  - { term: "Stack", def: "A block of memory accessed last-in, first-out; the stack pointer holds the address of the last item pushed on a downward-growing stack." }
---

## Learn

- **Mode 3, post-increment `(An)+`**: after the instruction uses the address, the address register is **incremented** by the operand size.
- **Mode 4, pre-decrement `-(An)`**: **before** the instruction uses it, the address register is **decremented** by the operand size.

Both are **size aware**: `MOVE.B D0,(A2)+` adds 1 to A2, `MOVE.W D1,(A6)+` adds 2, `MOVE.L D4,(A3)+` adds 4.

They are made for walking through consecutive memory and for **stacks**. A 68K stack is initialised at the top of memory and grows toward lower addresses. When the stack grows downward:

- **PUSH** = indirect with **pre-decrement**: `MOVE.B D0,-(SP)`.
- **POP** = indirect with **post-increment**: `MOVE.B (SP)+,D0`.
- The stack pointer points at the last item pushed.

(A stack growing the other way would use post-increment for PUSH and pre-decrement for POP, with the pointer at the next empty slot.)

The lecture's loop adds five bytes with `ADD.B (A0)+,D1` and `SUBQ.B #1,D0`/`BNE` as the counter; the table 1, 4, 2, 6, 5 sums to 18. All three programs here run on the 68000 core.

## Worked example

*Trace `MOVE.L #$87654321,-(SP)` with SP = $00100000.*

1. Pre-decrement by 4: SP = $00FFFFFC.
2. Write the long word at $FFFFFC: the high word $8765 at $FFFFFC, the low word $4321 at $FFFFFE.
3. `MOVE.L (SP)+,D5` then reads it back into D5 and returns SP to $00100000.

## Try it

*Which mode and register pair would you use to push a byte from D0 onto the stack?*

???

`MOVE.B D0,-(SP)` : mode 4 (pre-decrement) with A7. Note SP is decremented by 1 for a byte.
