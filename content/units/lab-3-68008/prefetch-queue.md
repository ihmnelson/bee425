---
track: shared
title: "The prefetch queue and why traces look out of order"
summary: "The 68008 fetches the next instruction before the current one finishes, so branches and writes appear delayed in a bus trace."
needs: [reset-vector-fetch, program-control.m68k-loops-and-ifs]
sources:
  - { type: handout, ref: "lab3 §V", quote: "has a two-word prefetch queue" }
  - { type: handout, ref: "lab3 §V", quote: "On a branch instruction the next instruction after the branch will be prefetched before the branch is taken" }
  - { type: handout, ref: "lab3 §V", quote: "the write will usually occur after the next instruction has been prefetched" }
  - { type: handout, ref: "lab3 §V", quote: "the Z80 fetches the next instruction only when it knows where the next instruction is to be fetched from" }
  - { type: oracle, ref: "the instruction encodings and the ADD.L result in the lab's listing are assembled and run" }
encodings:
  - { cpu: m68k, asm: "MOVE.B D0,$00008020", hex: "13C0 0000 8020" }
  - { cpu: m68k, asm: "LEA $00008AAA,A2", hex: "45F9 0000 8AAA" }
  - { cpu: m68k, asm: "MOVE.L #$11111111,(A2)", hex: "24BC 1111 1111" }
  - { cpu: m68k, asm: "ADD.L D3,(A2)", hex: "D792" }
  - { cpu: m68k, asm: "SWAP D6", hex: "4846" }
  - { cpu: m68k, asm: "EXG D7,D5", hex: "CF45" }
programs:
  - cpu: m68k
    name: "the ADD.L D3,(A2) step of the lab's sample program"
    source: |
      * program
              ORG     $1000
      START   LEA     $00008AAA,A2
              MOVE.L  #$55555555,D3
              MOVE.L  #$11111111,(A2)
              ADD.L   D3,(A2)
              SIMHALT
              END     START
    expect:
      mem: { 35498: [0x66, 0x66, 0x66, 0x66] }
checks:
  - type: choice
    prompt: "In the lab's trace, `MOVE.B D0,$00008020` is at $102E, yet the next instruction's op-code ($45F9) is fetched **before** the byte is written. Why?"
    options: ["The 68008 prefetches the next instruction while decoding the current one, and a write usually happens after the next prefetch", "The write is slow", "The trace is wrong", "The ROM is out of order"]
    answer: 0
    explain: "The prefetch queue holds two words. When an instruction writes to memory, the write usually occurs after the next instruction has been prefetched, so the trace shows the next op-code before the write."
  - type: choice
    prompt: "A `BRA` is executed. What appears in the bus trace right after it?"
    options: ["The instruction that follows the BRA in memory is prefetched (but never executed) before the branch is taken", "Only the branch target", "Nothing", "A reset"]
    answer: 0
    explain: "On a branch, the next instruction after the branch is prefetched before the branch is taken. If the branch is taken, that prefetched instruction is never executed, which is confusing when you read the trace as a program listing."
  - type: choice
    prompt: "How does the **Z80** differ?"
    options: ["It fetches the next instruction only when it knows where it is, and writes occur in the same cycle as the instruction", "It prefetches two words", "It cannot fetch", "It writes before fetching"]
    answer: 0
    explain: "On the Z80 there is no ambiguity between the trace and what the processor is doing: the sequence in the trace matches the program. On the 68008, address, data and status buses alone can mislead you."
  - type: choice
    prompt: "In the lab's example, `ADD.L D3,(A2)` with D3 = $55555555 and (A2) = $11111111 writes back what?"
    options: ["$66666666", "$44444444", "$55555555", "$11111111"]
    answer: 0
    explain: "$55555555 + $11111111 = $66666666, written back as four bytes high byte first (big endian). Verified by running it."
card:
  front: "What is prefetch, and what two rules explain 68008 traces?"
  back: "The 68008 has a two-word prefetch queue: it fetches the next instruction before the current one has finished. Rules: (1) on a branch, the next instruction after the branch is prefetched before the branch is taken; (2) a write to memory usually happens after the next instruction has been prefetched. The Z80 does not prefetch, so its traces read in program order."
glossary:
  - { term: "Prefetch", def: "Fetching the next instruction from memory before the current instruction has been completed." }
---

## Learn

The Z80 was a good first logic-analyzer subject because there is **no ambiguity** between the trace and what the processor does. The 68008, like modern processors, uses **prefetching** to improve performance, which can confuse anyone who reads only the address, data and status buses.

The 68008 has a **two-word prefetch queue**. For our purposes there are two general rules:

1. **On a branch instruction, the instruction after the branch is prefetched before the branch is taken.** If the branch is taken, that instruction is never executed.
2. **When an instruction writes to memory, the write usually happens after the next instruction has been prefetched.**

The Z80, in contrast, fetches the next instruction only when it knows where it will come from, and writes occur in the same instruction cycle.

The lab's list file shows this at $102E: `MOVE.B D0,$00008020` ($13C0 $0000 $8020). In the trace its write of $AA appears only **after** the op-code $45F9 of the next instruction (`LEA $00008AAA,A2`) has been fetched. Similarly `MOVE.L #$11111111,(A2)` writes its data after the following `NOP` ($4E71) has been prefetched.

The pipeline, stepwise for `MOVE.L #$11111111,(A2)` ($24BC $1111 $1111):
1. The op-code word $24BC is fetched into the first stage of the queue (IRC).
2. It moves to the instruction register (IR) and the upper half of the data enters IRC.
3. $24BC moves to the instruction decode register (IRD) and is decoded; IR and IRC now hold its operand.
4. The **next** instruction ($4E71) is prefetched into IRC.
5. Only now does the instruction complete and write $11111111 at $8AAA-$8AAD. The bus is busy with the write, so the following op-code ($D792) cannot be prefetched yet.

Writes appear in **big-endian** order: high-order word high byte first, down to low-order word low byte.

## Worked example

*Why might you see the instruction after a `BRA` in a trace even though it never ran?*

1. The queue holds two words, so the word after the BRA was fetched while the BRA was being decoded.
2. The BRA is then taken, so the prefetched word is discarded.
3. The trace shows the fetch, but the instruction never executed.

## Try it

*A trace shows a data write to $8AAA two lines after the op-code of the *next* instruction. Which rule explains it?*

???

Rule 2: a write usually occurs after the next instruction has been prefetched.
