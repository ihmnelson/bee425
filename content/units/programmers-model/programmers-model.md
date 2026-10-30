---
track: shared
title: The programmer's model and why assembly is not portable
summary: The instruction set plus the addressing modes; assembly language is specific to each processor.
needs: [processor-basics.functional-blocks]
sources:
  - { type: slide, ref: "L3 s130", quote: "Programmer’s model consists of the instruction set and the addressing modes" }
  - { type: slide, ref: "L3 s130", quote: "assembly language is not portable between computers" }
  - { type: slide, ref: "L3 s125", quote: "Assembly language is different for every processor architecture" }
checks:
  - type: choice
    prompt: "What does the **programmer's model** of a processor consist of?"
    options: ["The instruction set and the addressing modes", "The pin layout", "The clock frequency and the supply voltage", "The size of the PCB"]
    answer: 0
    explain: "The instruction set describes what the processor can do; the addressing modes describe how it finds the data for an instruction and what to do with the data afterwards."
  - type: choice
    prompt: "An assembly program written for the Intel 8086 is run on a Motorola 68000. What happens?"
    options: ["It will not run; assembly language is specific to each processor", "It runs unchanged", "It runs after recompiling the assembly", "It runs slower"]
    answer: 0
    explain: "Assembly language is different for every processor architecture and is not portable. A C++ program might run on the other processor once the source is recompiled for it."
  - type: choice
    prompt: "What is **common** between assembly languages on different processors?"
    options: ["The coding principles", "The instruction names and opcodes", "The register names", "The machine code bytes"]
    answer: 0
    explain: "The coding principles (loops, tests, memory access) are common to almost all architectures, but the instructions, registers and machine code differ."
card:
  front: "What is the programmer's model, and is assembly portable?"
  back: "The programmer's model is the instruction set (what the processor can do) plus the addressing modes (how it finds and stores the data). Assembly is not portable between processors; C or C++ source can be recompiled."
glossary:
  - { term: "Programmer's model", def: "The part of a processor's architecture visible to the programmer: its instruction set and addressing modes (and registers)." }
---

## Learn

Before writing assembly we need the processor's **programmer's model**: its **instruction set** and its **addressing modes**.

- The **instruction set** says what the processor can do.
- The **addressing modes** say how the processor finds the data for the instruction, and what to do with the data afterwards.

Unlike a Java, C or C++ program, **assembly language is not portable**: a program for an Intel 8086 will not run on a Motorola 68000. A C++ program written for the 8086 might run on the 68000 once the original source is **recompiled**. Coding principles are common across architectures, but every architecture has its own assembly language.

The course looks at two: the **68K** (8-16-32 bit CISC, easy to learn, bus operation more complicated) and the **Z80** (8-bit CISC, assembly trickier, bus operation very simple).

## Worked example

*Why can't you copy a 68000 `MOVE.B D1,D0` into a Z80 program?*

1. `MOVE.B D1,D0` uses 68000 data registers and a 68000 opcode.
2. The Z80 has no D0 or D1 as 32-bit data registers and no MOVE instruction; its equivalent is a load such as `LD A,B`.
3. The two processors have different instruction sets, registers and machine code, so the translation is by hand, not automatic.

## Try it

*Which one can be moved to another processor with just a recompile: a C program or an assembly program?*

???

The **C program**. The assembly program is tied to one processor's instruction set.
