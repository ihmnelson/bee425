---
track: m68k
title: 68000 exception vectors and interrupt response
summary: The first 1,024 bytes of memory hold 256 long-word vectors; an interrupt saves SR and PC, then jumps through its vector.
needs: [interrupt-priority-exceptions]
sources:
  - { type: handout, ref: "ch12 Motorola 68K Interrupts", quote: "byte addresses from 0x000000 to 0x0003FF are reserved for interrupts and exceptions" }
  - { type: handout, ref: "ch12 Motorola 68K Interrupts", quote: "the ISR for a NMI is stored at address 0x00007C" }
  - { type: handout, ref: "ch12 Motorola 68K Interrupts", quote: "saves a copy of the status register on the stack" }
  - { type: handout, ref: "ch12 Motorola 68K Interrupts", quote: "After a RESET is asserted, the 68K will fetch the vector at 0x000000 and place it in the stack pointer register." }
checks:
  - type: choice
    prompt: "How much memory at the bottom of the 68K address space is reserved for exception and interrupt vectors?"
    options: ["1,024 bytes, which is 256 long-word vectors", "256 bytes, which is 64 long-word vectors", "1,024 long words, which is 4,096 bytes", "64 KB, which is 16,384 long-word vectors"]
    answer: 0
    explain: "Byte addresses $000000 to $0003FF are reserved, so a user program should not start below $000400. Each vector is one 32-bit long word, so there are 1,024 / 4 = 256 of them."
  - type: choice
    prompt: "A 68K receives an NMI. Which sequence describes its response?"
    options: ["Finish the instruction, push SR and the next PC, enter supervisor mode, fetch the long word at $00007C and jump there", "Push D0-D7, fetch the word at $0000FC, and run the routine in user mode", "Fetch the stack pointer from $000000, then run the program from $000004", "Finish the instruction and run from $000400 without saving anything"]
    answer: 0
    explain: "The processor completes the current instruction, saves the status register and the address of the next instruction on the stack, switches to supervisor mode, then fetches the 32-bit address stored at the vector location ($00007C for the NMI) and begins the ISR there."
  - type: choice
    prompt: "The long word stored at $00007C is $00001200. Where does the NMI service routine start?"
    options: ["At $00001200, because the vector holds the address of the routine", "At $00007C, because that is the vector's own address", "At $00007C + $1200 = $00127C", "At $000400, the first free address"]
    answer: 0
    explain: "A vector is a pointer: the memory location holds the address of the first instruction of the routine, not the routine itself. This is indirect addressing."
  - type: choice
    prompt: "After RESET, where does the 68K get its initial stack pointer and program counter?"
    options: ["SP from $000000 and PC from $000004", "PC from $000000 and SP from $000004", "Both from the long word at $000400", "Both from the top of RAM"]
    answer: 0
    explain: "The first two long words of memory are special: the processor loads the stack pointer from $000000, then the program counter from $000004, and starts executing at that address."
card:
  front: "68000 vector table and interrupt response."
  back: "$000000-$0003FF = 256 long-word vectors, each the address of its ISR. RESET: SP from $000000, PC from $000004. Interrupt: finish instruction, push SR and next PC, enter supervisor mode, fetch the vector (NMI at $00007C) and jump to the ISR."
glossary:
  - { term: "Vector", def: "A long word in the exception table that holds the address of the service routine for one interrupt or exception." }
---

## Learn

The 68000 keeps a **vector table** in the lowest 1,024 bytes of memory: 256 long words, each the **address** of a service routine. A user program therefore starts at $000400 or above.

On an interrupt (for example the NMI, whose vector is at **$00007C**) the processor does this:

1. completes the current instruction;
2. saves the **status register** on the stack;
3. saves the **address of the next instruction** on the stack;
4. switches to **supervisor mode**;
5. fetches the 32-bit vector from its table address;
6. starts executing the ISR at that address.

The last step is **indirect addressing**: the table location holds a pointer. The first two vectors are special. After RESET the 68K loads the **stack pointer from $000000** and the **program counter from $000004**.

## Worked example

*The long word at $000064 is $00002400. What does it mean, and which address does the vector table entry occupy for the 100th vector (counting the first as vector 0)?*

1. The entry at $000064 is vector number $64 / 4 = **25**, and it says the service routine begins at **$00002400**.
2. Vector 100 sits at 100 x 4 = 400 = **$000190**.

## Try it

*Which table address holds the vector with number 31?*

???

31 x 4 = 124 = **$00007C**, the NMI vector discussed in the reading.
