---
track: shared
title: Functional blocks inside a processor
summary: State machine, ALU, registers, status register, PC, stack pointer, instruction register, bus interface.
needs: [micro-vs-controller]
sources:
  - { type: slide, ref: "L3 s119", quote: "Reason why microprocessors are synchronous (clock driven)" }
  - { type: slide, ref: "L3 s120", quote: "Holds the address of the next instruction to be fetched from" }
  - { type: slide, ref: "L3 s120", quote: "Points to current location in stack (LIFO) memory block" }
  - { type: slide, ref: "L3 s120", quote: "then the ZERO Flag = 1" }
checks:
  - type: choice
    prompt: "Which block holds the **address of the next instruction** to be fetched?"
    options: ["Program counter (PC)", "Stack pointer", "Status register", "Instruction decode register"]
    answer: 0
    explain: "The program counter holds the address of the next instruction. Branches and jumps work by changing its contents."
  - type: choice
    prompt: "Which block **decodes instructions and sequences memory reads and writes**, and is the reason a processor is clock driven?"
    options: ["The microcode state machine", "The ALU", "The general-purpose registers", "The debug core"]
    answer: 0
    explain: "The microcode state machine is the brains: it decodes instructions, sequences memory accesses, makes decisions, and coordinates internal and external behavior. The ALU is generally not a synchronous system."
  - type: choice
    prompt: "An instruction computes A - B and A equals B. Which flag is set?"
    options: ["Zero (Z)", "Carry (C)", "Overflow (V)", "None"]
    answer: 0
    explain: "The status register holds flags set by ALU results. If A = B, the result of A - B is zero, so the Zero flag is 1."
  - type: choice
    prompt: "What does the **stack pointer** point to, and what is it used for?"
    options: ["The current top of the stack (a LIFO block), for subroutine calls and interrupt service routines", "The next instruction", "The ALU result", "The cache"]
    answer: 0
    explain: "The stack pointer points to the current location in the stack (LIFO) memory and manages stack-based operations such as subroutines and interrupt service routines."
card:
  front: "Name the main functional blocks of a microprocessor and what each does."
  back: "State machine (decode and sequence, clock driven); ALU (math and logic, results set flags); registers (fast local storage); status register (flags); PC (next instruction address); SP (top of stack, LIFO); instruction register (holds the fetched instruction); bus interface unit; interrupt controller; debug core; caches."
glossary:
  - { term: "ALU", def: "Arithmetic and Logic Unit: performs all mathematical and logical operations; results (zero, positive, negative, overflow) go to the status register." }
  - { term: "Program counter", def: "The register holding the address of the next instruction to be fetched." }
---

## Learn

The blocks inside a processor and what each does:

- **Microcode state machine**: decodes instructions, sequences memory reads and writes, provides decision capability and coordinates all internal and external behavior. It is **why microprocessors are synchronous (clock driven)**.
- **ALU (arithmetic and logic unit)**: all mathematical and logical operations. Generally not synchronous (simple arrays of gates). Operands are in registers; results (zero, positive, negative, overflow) go to the status register.
- **General-purpose registers**: local storage for operands, built from D-type flip-flops close to the CPU. Efficient operation is between registers. They may be fully general-purpose or special-purpose, and can often be ganged to hold larger data types.
- **Status register**: bit **flags** that are set (1) or reset (0) by ALU results. For A - B with A = B, the **Zero flag = 1**.
- **Program counter (PC)**: the address of the next instruction to fetch; branches and jumps change it.
- **Stack pointer (SP)**: the current top of the **LIFO** stack, used for subroutines and interrupt service routines.
- **Temporary register(s)**: hold operands or intermediate results; may be hidden.
- **Instruction decode (instruction) register**: holds the fetched instruction for the state machine.
- **Interrupt controller, bus interface unit, debug core, cache control unit, instruction and data caches**: interrupts, the memory interface, debug hardware and on-chip high-speed memory.

## Worked example

*Trace one instruction through the blocks: ADD D0,D1 on a 68000.*

1. The **PC** gives the address; the instruction word is fetched through the **bus interface unit** into the **instruction register**.
2. The **state machine** decodes it as "add, register to register".
3. The operands come from the **registers**; the **ALU** adds them and the result goes back to a register.
4. The **status register** flags (zero, negative, carry, overflow) are updated, and the **PC** advances.

## Try it

*Which block makes a processor "synchronous", and which one usually is not?*

???

The **microcode state machine** is clock driven and makes the processor synchronous. The **ALU** is generally not a synchronous system (it is an array of gates).
