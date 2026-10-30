---
track: z80
title: The Z80 registers
summary: 8-bit A, F, B-L and alternates, 16-bit pairs and index registers, SP and PC; EXX swaps the sets.
needs: [programmers-model]
sources:
  - { type: slide, ref: "L3 s134", quote: "Single instruction swaps Main and Alternate register sets" }
  - { type: slide, ref: "L3 s137", quote: "Register pairs BC, DE, HL" }
  - { type: slide, ref: "L3 s138", quote: "Must be used with any arithmetic or logical" }
  - { type: slide, ref: "L3 s139", quote: "Stack grows towards lower memory" }
  - { type: slide, ref: "L3 s140", quote: "IX and IY: Index registers" }
  - { type: own, ref: "the comparison of register roles in the callback box" }
checks:
  - type: choice
    prompt: "Which Z80 register is the **accumulator**, which every arithmetic or logical operation must use?"
    options: ["A", "B", "HL", "F"]
    answer: 0
    explain: "Register A is the accumulator and must be used with any arithmetic or logical operation, for example ADD A,D or AND B."
  - type: choice
    prompt: "How can the Z80 use the registers B and C **together** as a 16-bit value?"
    options: ["As the register pair BC", "As register IX", "It cannot", "As the stack pointer"]
    answer: 0
    explain: "B, C, D, E, H and L are 8-bit, but they pair as BC, DE and HL for 16-bit operations. A pair such as HL can also be a pointer to memory."
  - type: choice
    prompt: "What is the purpose of the Z80's **alternate register set** (B', C', D', E', H', L', A', F')?"
    options: ["It can be swapped with the main set by a single instruction, for fast interrupt handling", "It holds the stack", "It stores the program", "It doubles the address bus"]
    answer: 0
    explain: "A single instruction (EXX for BC, DE, HL; EX AF,AF' for A and F) swaps main and alternate registers, which improves real-time performance for interrupts."
  - type: choice
    prompt: "Which direction does the Z80 stack grow?"
    options: ["Toward lower memory addresses", "Toward higher memory addresses", "It does not move", "Into the I/O space"]
    answer: 0
    explain: "The stack grows toward lower memory. PUSH stores a register pair on the stack; CALL pushes the PC and RET pops it."
card:
  front: "List the Z80 registers."
  back: "A (accumulator) and F (flags); B, C, D, E, H, L (8-bit; pairs BC, DE, HL for 16-bit); alternate set A', F', B'-L' (swapped with EXX and EX AF,AF'); IX and IY (16-bit index registers); SP (stack pointer, grows toward lower memory); PC (program counter); I and R."
glossary:
  - { term: "Accumulator (Z80)", def: "Register A; must be used with any arithmetic or logical operation." }
  - { term: "Register pair", def: "Two 8-bit Z80 registers (BC, DE, HL) used together as a 16-bit value, often as a memory pointer." }
bridge:
  to: programmers-model.m68k-registers
  same: "Both have a program counter, a stack pointer, a status/flag register, and registers that can be used as memory pointers."
  different: "The Z80 has a few 8-bit registers with set roles (A is the accumulator), 16-bit pairs and two index registers. The 68000 has eight 32-bit data registers and seven general address registers plus a stack pointer, and almost any register works with any instruction."
  why: "The Z80 is an 8-bit design that grew from the 8080 and extends 8-bit registers by pairing them. The 68000 was designed as a 32-bit architecture, so registers are wide and orthogonal."
---

## Learn

**Callback.** The 68000 gave you eight wide data registers and eight address registers. The Z80 is a smaller, 8-bit machine:

- **A** (accumulator): **must** be used with any arithmetic or logical operation (`ADD A,D`, `AND B`).
- **F** (flags): the results of arithmetic and logical operations.
- **B, C, D, E, H, L**: 8-bit general-purpose registers (`LD E,55H`, `LD C,L`).
- **Register pairs BC, DE, HL**: 16-bit values; they become specific for some instructions, for example `LD B,(HL)` uses the address in HL as a pointer.
- **Alternate registers** A', F', B', C', D', E', H', L': swapped with the main set by a **single instruction** (`EXX`, `EX AF,AF'`) for fast interrupt handling.
- **IX and IY**: 16-bit index registers for tables and data structures: `LD (IX+d),L` stores L at IX plus an 8-bit displacement.
- **SP**: the 16-bit stack pointer; the stack is LIFO and **grows toward lower memory**. `PUSH BC` stacks a pair; `CALL 2000H` pushes the PC and loads 2000H; `RET` pops it back into the PC.
- **PC**: 16-bit program counter.
- **I** (interrupt vector) and **R** (memory refresh).

## Worked example

*Add the contents of D to A, then add 1 to the 16-bit pair HL. Which registers are used?*

1. `ADD A,D`: the accumulator **A** must be one operand and gets the result.
2. `INC HL`: HL is a 16-bit **register pair** and is incremented as one value.
3. The flags in **F** are updated by the add.

## Try it

*Why can't you write `ADD B,C` on a Z80?*

???

Arithmetic must go through the accumulator: one operand and the result are always in A (for example `ADD A,C`). The 68000 has no such restriction, as in `ADD.B D1,D0`.
