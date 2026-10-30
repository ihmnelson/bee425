---
track: shared
title: Why learn assembly language
summary: Hardware engineers bring up new hardware in assembly, and it is the tightest, most deterministic code you can write.
needs: []
sources:
  - { type: slide, ref: "L4 s147", quote: "The most direct way to write test drivers is in assembly language" }
  - { type: slide, ref: "L4 s147", quote: "1:1 match between the assembly language instruction and the machine language" }
  - { type: slide, ref: "L4 s148", quote: "Code that must be absolutely, positively deterministic cannot be written in C" }
checks:
  - type: choice
    prompt: "Which is a reason the lecture gives for **still learning assembly language**?"
    options: ["You can control the program down to a single clock cycle, so timing is deterministic", "It is portable between processors", "Compilers cannot generate code", "It is shorter to write than C"]
    answer: 0
    explain: "Assembly lets you control a program at the level of a single clock cycle, so code that must be deterministic (interrupt handlers, DSP algorithms) can be written there. It is not portable and is not shorter."
  - type: choice
    prompt: "What is the relationship between an assembly instruction and a machine instruction?"
    options: ["1:1: one assembly instruction is one machine instruction", "Many assembly lines become one machine instruction", "One assembly line becomes a library call", "There is no relationship"]
    answer: 0
    explain: "Assembly language is tightly coupled to the processor's design: there is a 1:1 match between the assembly instruction and the machine language instruction."
  - type: choice
    prompt: "Who typically writes the first software on **new hardware**?"
    options: ["The hardware designer, in assembly, as test drivers", "The marketing team", "A compiler", "The operating system"]
    answer: 0
    explain: "Hardware designers are responsible for turning on new hardware; the most direct way to write test drivers is in assembly. Once the functionality is assured, coders write the applications in C, C++ or Java."
card:
  front: "Why learn assembly language when compilers exist?"
  back: "Bring-up and test drivers for new hardware; 1:1 match to machine code, so you understand the architecture; tightest, fastest code with no overhead; deterministic timing to a single clock cycle; parts of the run-time environment; debugging real-time systems; not every architecture has a compiler."
glossary: []
---

## Learn

Reasons from the lecture:

- **Hardware bring-up.** Electrical engineers must turn on new hardware, and the most direct way to write test drivers is in assembly. When functionality is assured the coders write the applications in C, C++ or Java.
- **It is tied to the processor.** There is a **1:1 match** between an assembly instruction and a machine instruction, so understanding assembly means understanding the architecture from the programmer's point of view.
- **Tightest, fastest code.** No overhead in space or time. Game engines and critical parts of programs are written in assembly.
- **Compilers are not perfect**, especially for interrupt handlers and DSP algorithms; not every architecture (for example 4-bit parts) has a compiler.
- **Determinism.** Code that must be absolutely, positively deterministic cannot be written in C; assembly controls the program at the level of a single clock cycle.
- **Run-time environments** need some assembly, and **debugging real-time systems** requires understanding it.

## Worked example

*An interrupt handler must respond within exactly 40 clock cycles. Which language, and why?*

1. A compiler decides the instructions, so its cycle count is hard to guarantee.
2. In assembly you choose each instruction and know its cycle count, so you can control timing at the single-clock level.
3. Use **assembly** (this is the lecture's example of critical code and interrupt handlers).

## Try it

*Give two reasons the lecture says assembly has not been made obsolete by compilers.*

???

Any two of: not all processors have compiler support; the tightest code is written in assembly; deterministic cycle-level control; run-time environment code; debugging real-time systems.
