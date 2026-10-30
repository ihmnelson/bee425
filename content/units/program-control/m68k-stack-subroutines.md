---
track: m68k
title: "The stack, subroutines and parameter passing"
summary: "JSR pushes the return address and RTS pops it; MOVEM saves registers; the programmer keeps pushes and pops matched."
needs: [addressing-modes.m68k-post-pre, m68k-loops-and-ifs]
sources:
  - { type: slide, ref: "L5 s243", quote: "The stack pointer is referenced as SP, not A7, in the Easy68K assembler" }
  - { type: slide, ref: "L5 s244", quote: "Without the SP pointing to the top of the stack, your program will crash" }
  - { type: slide, ref: "L5 s246", quote: "JSR instruction PUSHES the long word address of the next instruction onto the" }
  - { type: slide, ref: "L5 s249", quote: "Each subroutine should have a comment block header" }
  - { type: oracle, ref: "the subroutine program below is run on the 68000 core" }
encodings:
  - { cpu: m68k, asm: "RTS", hex: "4E75" }
  - { cpu: m68k, asm: "MOVEM.L D1,-(SP)", hex: "48E7 4000" }
programs:
  - cpu: m68k
    name: "a subroutine that doubles D0 and preserves D1"
    source: |
      * program
              ORG     $1000
      START   LEA     $00100000,SP
              MOVE.L  #5,D0
              MOVE.L  #99,D1
              JSR     double
              MOVE.L  D0,D3
              SIMHALT
      double  MOVEM.L D1,-(SP)
              MOVE.L  D0,D1
              ADD.L   D1,D0
              MOVEM.L (SP)+,D1
              RTS
              END     START
    expect:
      regs: { D3: 10, D1: 99, A7: 0x100000 }
checks:
  - type: choice
    prompt: "What does **JSR** do?"
    options: ["Pushes the long word address of the next instruction on the stack, then jumps to the subroutine", "Jumps without saving anything", "Pops the stack", "Stops the program"]
    answer: 0
    explain: "JSR saves the return address on the stack and then jumps. RTS at the end of the subroutine pops the address back into the PC, so execution continues after the JSR."
  - type: choice
    prompt: "Where should the stack pointer be initialised, and why must it be set?"
    options: ["To the highest RAM address, because the stack grows downward and, without it, the program will crash", "To 0", "To the start of the program", "It needs no setting on any processor"]
    answer: 0
    explain: "The stack normally starts at the top of RAM and grows toward lower memory. The 68K sets SP on power-up from the vector table, but you must make sure your environment gives it a valid value: without SP pointing at the top of a stack, the program will crash."
  - type: choice
    prompt: "A subroutine uses D1 internally. How does it avoid disturbing the caller?"
    options: ["Save D1 on entry with MOVEM.L D1,-(SP) and restore it on exit with MOVEM.L (SP)+,D1", "Never use registers", "Use JMP instead of JSR", "Clear the stack"]
    answer: 0
    explain: "The subroutine must save the resources it uses (registers and memory) and restore them before returning. MOVEM pushes or pops a list of registers in one instruction."
  - type: choice
    prompt: "What must be on **top of the stack** just before the RTS executes?"
    options: ["The return address", "The first parameter", "The saved registers", "Nothing"]
    answer: 0
    explain: "Subroutines need careful stack management: the pushes and pops must line up, so that the return address is at the top when RTS runs. Otherwise RTS returns to the wrong place."
card:
  front: "How do subroutines and the stack work on the 68000?"
  back: "JSR pushes the 32-bit return address on the stack (SP goes down by 4) and jumps; RTS pops it into the PC. Initialise SP at the top of RAM. Save used registers with MOVEM.L list,-(SP) and restore with MOVEM.L (SP)+,list. Document name, purpose, registers and parameters in a header comment. Subroutines nest."
glossary:
  - { term: "Subroutine", def: "The assembly analog of a C function or Java method; entered with JSR or BSR and left with RTS." }
---

## Learn

**Why a stack?** It manages subroutine calls (functions in C, methods in Java) and variable scope. The 68000 manages it as a LIFO structure using **A7 (or A7')**, written **SP** in the EASy68K assembler. The stack grows from the top of RAM toward lower addresses, so **PUSH = pre-decrement** and **POP = post-increment**. Make sure SP is initialised, normally to the highest RAM address, or the program will crash.

**Subroutines.**
- `JSR` pushes the **long word** address of the next instruction and jumps; `RTS` pops it back into the PC.
- The programmer must make sure all pushes and pops line up, save and restore every register or memory location the subroutine uses, and decide how to **pass parameters**.
- `MOVEM <register list>,-(SP)` on entry and `MOVEM (SP)+,<register list>` on exit save and restore registers.
- Subroutines can **nest** (FOO calls BAR). They return to the instruction after the JSR (jump tables are an exception).

Guidelines from the lecture: set up the stack first; put subroutines **after** the main program; give each a **comment header** (name, what it does, registers used and saved, parameters in and out); put a **label** on the first line; save registers on entry, restore on exit.

The lecture's memory-test program calls `BSR do_test` (not JSR); the program above shows the same pattern running on the core.

## Worked example

*Trace `JSR double` with SP = $00100000 in the program above.*

1. JSR pushes the 4-byte return address: SP = $00FFFFFC.
2. `MOVEM.L D1,-(SP)` pushes D1: SP = $00FFFFF8.
3. D0 doubles to 10; `MOVEM.L (SP)+,D1` restores D1 (99) and SP = $00FFFFFC.
4. `RTS` pops the return address: SP = $00100000, and execution continues at `MOVE.L D0,D3`.

## Try it

*What goes wrong if a subroutine pushes a register but forgets to pop it before RTS?*

???

The top of the stack is then the saved register, not the return address, so `RTS` loads the wrong value into the PC and the program jumps to a random place (and SP is off by 4 afterwards).
