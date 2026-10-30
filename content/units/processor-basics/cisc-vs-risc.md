---
track: shared
title: CISC, RISC and DSP architectures
summary: Many complex variable-length instructions versus few simple fixed-length ones.
needs: [micro-vs-controller]
sources:
  - { type: slide, ref: "L3 s113", quote: "Characterized by many instructions and addressing modes" }
  - { type: slide, ref: "L3 s114", quote: "One instruction executed per clock cycle" }
  - { type: slide, ref: "L3 s118", quote: "No memory to memory transfers" }
  - { type: slide, ref: "L3 s117", quote: "Add and store result" }
checks:
  - type: choice
    prompt: "Which pair of properties describes a **CISC** machine such as the 68000?"
    options: ["Many instructions and addressing modes; variable-length instructions", "Few instructions; all instructions the same size", "Separate memories for instructions and data only", "Every operation must be register to register"]
    answer: 0
    explain: "CISC has many instructions and addressing modes, variable-length instructions (2 to 10 bytes on the 68000), fewer, special-purpose registers, and mixed memory and register operations."
  - type: choice
    prompt: "In a **RISC** machine, how do you add two values that are in memory?"
    options: ["Load them into registers, add, then store the result", "Add them directly in memory with one instruction", "Use an absolute-address ADD", "It cannot be done"]
    answer: 0
    explain: "RISC arithmetic is between registers only, and memory is accessed by LOAD and STORE. The lecture's ARM example takes six instructions, while the 68000 needs two after setting up pointers (MOVE.L (A0),D0 and ADD.L D0,(A1))."
  - type: choice
    prompt: "Which memory architecture does the lecture associate with **CISC** and which with **RISC**?"
    options: ["CISC: von Neumann (one memory for instructions and data). RISC: Harvard (separate memories)", "CISC: Harvard. RISC: von Neumann", "Both von Neumann", "Both Harvard"]
    answer: 0
    explain: "The lecture pairs CISC with the von Neumann architecture (the same memory space serves instructions and data) and RISC with the Harvard architecture (separate memory spaces for instructions and data)."
card:
  front: "Compare CISC and RISC."
  back: "CISC: many instructions and addressing modes, variable length, few special-purpose registers, memory-to-memory operations, von Neumann. RISC: few instructions, fixed length, many general registers, register-only arithmetic with LOAD/STORE, no absolute addressing, can be Harvard. DSP: special instructions for signal processing."
glossary:
  - { term: "CISC", def: "Complex Instruction Set Computer: many instructions and addressing modes, variable length, compact code." }
  - { term: "RISC", def: "Reduced Instruction Set Computer: only the instructions compilers need, uniform length, register-to-register operations." }
  - { term: "Harvard architecture", def: "Separate memory spaces for instructions and data." }
---

## Learn

Three families of architecture:

- **CISC** (Complex Instruction Set Computer): **many instructions and addressing modes**, each able to do involved operations; code is compact; instructions are **variable length** and may take many clock cycles; **von Neumann** (one memory for instructions and data). The 68000 and Z80 are CISC.
- **RISC** (Reduced Instruction Set Computer): came from compiler research at IBM, which found that compilers use a small set of instructions. **Fewer instructions of uniform length**, about **one instruction per clock**, **many general-purpose registers**, **all arithmetic between registers**, memory only by LOAD and STORE, and often a **Harvard** architecture (separate instruction and data memories). ARM is the most popular.
- **DSP** (Digital Signal Processor): special instructions and an architecture designed for signal processing.

| | CISC | RISC |
|---|---|---|
| Instructions | Many, variable length | Fewer, single length |
| Addressing modes | Many | Few |
| Registers | Fewer, specific functions | Many, general purpose |
| Memory | Memory to memory, absolute addresses | Load/store only |

## Worked example

*Add the long word at mem1 to the long word at mem2, storing the sum in mem2. Compare the 68000 and ARM.*

- **68000:** `LEA mem1,A0`, `LEA mem2,A1`, `MOVE.L (A0),D0`, `ADD.L D0,(A1)`: the ADD works directly on memory, and the result lands in memory.
- **ARM:** load both addresses, `LDR` each value into a register, `ADD r3,r3,r2`, then `STR` the result: arithmetic only on registers.
- The CISC version is shorter because one instruction can mix a register and a memory operand.

## Try it

*True or false: a RISC machine can have a memory-to-memory ADD.*

???

**False.** In RISC, all arithmetic is register to register, and every memory access is a load or a store.
