---
track: shared
title: "What the 68008 does after RESET"
summary: "It loads A7 from the long word at 0000-0003 and the PC from 0004-0007, then runs from there."
needs: [m68008-board]
sources:
  - { type: handout, ref: "lab3 §V", quote: "the processor will fetch the long word stored at byte addresses 0000..0003 and put that value in the stack pointer register" }
  - { type: handout, ref: "lab3 §V", quote: "the processor begins executing code at the value in the PC" }
  - { type: slide, ref: "L7 s333", quote: "Processor begins execution from an address stored in the Exception Vector" }
  - { type: oracle, ref: "the vector bytes and the first instruction fetch are encoded and checked below" }
encodings:
  - { cpu: m68k, asm: "NOP", hex: "4E71" }
checks:
  - type: choice
    prompt: "After a hard RESET, what does the 68008 read first?"
    options: ["The long word at addresses 0000-0003, which goes into the stack pointer A7", "The first instruction at $1000", "The PC from $1000", "The last address of RAM"]
    answer: 0
    explain: "It fetches the long word at byte addresses 0000..0003 into the stack pointer, then reads the next long word at 0004..0007 into the program counter, and begins executing there."
  - type: choice
    prompt: "The sample program has `DC.L stack` and `DC.L pc_st` at address 0, with `pc_st EQU $1000`. Where does the processor start executing?"
    options: ["$00001000", "$00000000", "$0000FFFF", "$00000004"]
    answer: 0
    explain: "The second long word (at 0004-0007) is loaded into the PC: $00001000. That is why the code has a second ORG at $1000."
  - type: choice
    prompt: "Why does the listing begin with **two ORG statements**?"
    options: ["The first places the reset vectors at address 0; the second places the program at the address the vectors name", "To make the file longer", "One for ROM and one for the simulator", "They are comments"]
    answer: 0
    explain: "ORG 0000 is needed because of how the processor starts after RESET: it reads the stack pointer and the PC from the first eight bytes. ORG $1000 then places the program where the vector says execution begins."
  - type: choice
    prompt: "The vector for the stack pointer in the lab program is $0000FFFF (also called the highest RAM address). In which direction does the stack grow from there?"
    options: ["Toward lower addresses", "Toward higher addresses", "It does not grow", "Into ROM"]
    answer: 0
    explain: "The 68000 stack grows from high memory toward low memory, so starting at the top of RAM leaves the whole RAM for the stack to grow into."
card:
  front: "What happens after a 68008 RESET?"
  back: "It reads the long word at 0000-0003 into A7 (the stack pointer), then the long word at 0004-0007 into the PC, and executes from that address. So code must place two vectors at address 0 (ORG 0 / DC.L stack / DC.L start) and the program at the address in the second."
glossary:
  - { term: "Reset vector", def: "The initial stack pointer and initial program counter values stored at addresses 0 and 4." }
---

## Learn

After a **hard RESET** the 68008 does not start executing at address 0. First it reads two long words from the bottom of memory:

1. The long word at byte addresses **0000..0003** goes into the **stack pointer, A7**.
2. The next long word at **0004..0007** goes into the **program counter, PC**.

Then it begins executing at the address in the PC. The lab's program therefore begins:

```
stack   EQU     $0FFFF
pc_st   EQU     $00001000
        ORG     0000
        DC.L    stack          * initial stack pointer
        DC.L    pc_st          * initial program counter
        ORG     pc_st
start   NOP                    * the first instruction executed
```

The two ORGs exist for exactly this reason. This is the same **exception vector table** idea from the memory-map lesson: the processor begins from an address stored in the vector table, and the stack address is assigned there too. With 8 bits of data bus each long word takes four byte fetches, so you see these eight reads at the start of every trace after RESET.

## Worked example

*A 68008 board's first eight ROM bytes are 00 00 FF FF 00 00 20 00. Where do the stack and the program start?*

1. First long word: $0000FFFF becomes **A7**.
2. Second long word: $00002000 becomes the **PC**.
3. The first instruction fetched is at **$2000**, and the stack grows down from $FFFF.

## Try it

*Why is it a problem if ROM does not appear at address 0 on a 68000-family system?*

???

The processor reads its initial stack pointer and PC from addresses 0-7 at reset, so there must be valid memory (normally ROM) there holding the vectors, or it will start from garbage.
