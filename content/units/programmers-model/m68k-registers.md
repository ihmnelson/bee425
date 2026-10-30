---
track: m68k
title: The 68000 registers and modes
summary: Eight data registers, seven address registers plus A7, a program counter and a status register; user and supervisor modes.
needs: [programmers-model]
sources:
  - { type: slide, ref: "L3 s135", quote: "Addresses can only be words or long-words, no byte addresses allowed" }
  - { type: slide, ref: "L3 s135", quote: "A7 and A7’ are banked registers" }
  - { type: slide, ref: "L3 s136", quote: "Data registers: 8 general-purpose registers" }
  - { type: slide, ref: "L3 s132", quote: "USER STACK POINTER" }
checks:
  - type: choice
    prompt: "How many **data registers** does the 68000 have, and how wide can the values in them be?"
    options: ["8 (D0-D7); bytes, words or long words", "7 (D0-D6); 32 bits only", "16 general registers; 16 bits only", "8; bytes only"]
    answer: 0
    explain: "D0 to D7 hold 8-bit, 16-bit or 32-bit values (byte, word, long)."
  - type: choice
    prompt: "Which operand sizes can an **address register** hold?"
    options: ["Words or long words only, never a byte", "Bytes only", "Bytes, words or long words", "Long words only"]
    answer: 0
    explain: "Addresses can only be words or long words; no byte addresses are allowed in address registers."
  - type: choice
    prompt: "What are **A7 and A7'** on the 68000?"
    options: ["The user and supervisor stack pointers, banked so only one is active depending on the mode", "Two extra data registers", "The program counter and status register", "Read-only constants"]
    answer: 0
    explain: "A7 is the user stack pointer and A7' the supervisor stack pointer. They are banked: one or the other acts as the stack pointer depending on whether the processor is in user or supervisor mode."
  - type: choice
    prompt: "Why does the 68000 have a **user mode** with fewer instructions?"
    options: ["To prevent different applications from interfering with each other under an operating system", "To save power", "To make programs faster", "To allow byte addresses"]
    answer: 0
    explain: "User mode can execute only a subset of the instructions. This stops applications from interfering with each other under an O/S."
card:
  front: "List the 68000 programmer's registers."
  back: "D0-D7 data registers (8/16/32 bits); A0-A6 address registers plus A7 (user stack pointer) and A7' (supervisor stack pointer), banked by mode; PC (program counter); SR (status register with the CCR flags X N Z V C). Address registers hold words or long words only."
glossary:
  - { term: "Data register (68000)", def: "One of D0-D7; holds byte, word or long word values for the CPU." }
  - { term: "Address register (68000)", def: "One of A0-A7; holds a word or long word address used to access memory." }
---

## Learn

The 68000's programmer-visible registers:

- **Data registers D0 to D7**: 8 general-purpose registers, each holding a **byte, word or long word** (8, 16 or 32 bits).
- **Address registers A0 to A6 and A7**: hold addresses so that memory addresses can be manipulated mathematically. They can only hold **words or long words**, never bytes. **A7 is the stack pointer.**
- **A7 and A7'**: the **user** and **supervisor** stack pointers; they are **banked**, so only one is active, depending on the processor mode.
- **Program counter (PC)**: always holds the address of the next instruction; changing it changes program flow (this is how if-then-else works).
- **Status register (SR)**: holds the **condition code register (CCR)** flags (X, N, Z, V, C), processor status, the debug (trace) bit and the interrupt level.

Internally there are also hidden registers: the **effective address register** (holds the memory address being used), the **instruction register** (holds the first word of the current instruction) and a **temporary register**.

**Two modes:** **user mode** can execute only a subset of instructions, which keeps applications from interfering with each other under an O/S; **supervisor mode** uses the supervisor stack pointer A7'.

## Worked example

*A 68000 program needs to hold a byte count, a word index and a long address. Which registers?*

1. The byte and the word go in **data registers** (for example D0 for the count and D1 for the index): data registers accept any size.
2. The long address goes in an **address register** (for example A0). It could not be a byte.
3. Stack operations use A7 implicitly.

## Try it

*True or false: the 68000 has 16 identical general-purpose registers.*

???

**False.** It has 8 data registers (D0-D7) and 8 address registers (A0-A7, with A7 as the stack pointer). They are separate sets with different jobs.
