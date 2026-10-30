---
track: z80
title: "The Z80 stack, PUSH, POP, CALL and RET"
summary: "SP is 16 bits and grows toward lower memory; PUSH/POP move register pairs; CALL pushes the 16-bit PC."
needs: [programmers-model.z80-registers, z80-jumps-and-calls]
sources:
  - { type: slide, ref: "L3 s139", quote: "Stack grows towards lower memory" }
  - { type: slide, ref: "L3 s139", quote: "RET (RETURN) instruction automatically transfers return" }
  - { type: oracle, ref: "the stack program below is run on the Z80 core" }
programs:
  - cpu: z80
    name: "PUSH, POP and CALL on the Z80 stack"
    source: |
      ; program
              .ORG 0100H
      START:  LD SP,0F000H
              LD BC,1234H
              PUSH BC
              LD BC,0
              POP DE
              CALL SUB
              HALT
      SUB:    RET
              .END
    expect:
      regs: { d: 0x12, e: 0x34, sp: 0xF000 }
      mem: { 61438: [0x0E, 0x01] }
checks:
  - type: choice
    prompt: "SP = F000H. After `PUSH BC`, what is SP?"
    options: ["EFFEH (a register pair is 2 bytes and the stack grows down)", "F002H", "F001H", "F000H"]
    answer: 0
    explain: "PUSH stores a 16-bit pair, so SP decreases by 2 to EFFEH. The stack grows toward lower memory, like the 68000's."
  - type: choice
    prompt: "What does `CALL 2000H` do?"
    options: ["Pushes the current PC (the return address) on the stack and loads 2000H into the PC", "Jumps without saving", "Pops the stack", "Loads 2000H into SP"]
    answer: 0
    explain: "CALL automatically transfers the current PC value to the stack and loads the target address. RET pops the return address back into the PC."
  - type: choice
    prompt: "How wide is the return address that the Z80's CALL pushes, compared with the 68000's JSR?"
    options: ["16 bits (2 bytes) versus 32 bits (4 bytes)", "32 bits versus 16", "Both 16", "Both 32"]
    answer: 0
    explain: "The Z80 has a 16-bit PC, so CALL pushes 2 bytes. The 68000's JSR pushes a long word (the PC register is 32 bits)."
  - type: choice
    prompt: "Which direction does each processor's stack grow?"
    options: ["Both toward lower memory addresses", "68000 down, Z80 up", "68000 up, Z80 down", "Both up"]
    answer: 0
    explain: "Both stacks start at the top of memory and grow toward lower addresses, so PUSH decrements SP and POP increments it."
card:
  front: "How does the Z80 stack compare with the 68000's?"
  back: "Both grow toward lower memory. Z80: SP is 16 bits; PUSH/POP move register pairs (2 bytes); CALL pushes the 16-bit PC; RET pops it. 68000: -(SP) and (SP)+ with any size; JSR pushes a 32-bit address; MOVEM saves a register list."
glossary: []
bridge:
  to: program-control.m68k-stack-subroutines
  same: "A LIFO stack at the top of RAM growing toward lower addresses; the call instruction saves the return address, the return instruction restores it; the programmer must keep pushes and pops matched and set SP first."
  different: "The Z80 has dedicated PUSH and POP instructions on register pairs (no auto-increment addressing modes), a 16-bit return address, and no MOVEM; you set SP yourself with LD SP,nn. The 68000 builds PUSH and POP from -(SP) and (SP)+ in the MOVE instruction."
  why: "The Z80 has no pre-decrement or post-increment addressing modes, so the designers gave the stack its own instructions."
---

## Learn

**Callback.** The 68000 stack used `-(SP)` and `(SP)+`. The Z80 gives the stack its **own instructions**:

- **SP** is a 16-bit register holding the top of the stack; the stack is LIFO and **grows toward lower memory**. You set it with `LD SP,0F000H`.
- `PUSH BC` stores the register pair on the stack (SP decreases by 2); `POP DE` takes it back.
- `CALL 2000H` pushes the current PC and loads 2000H; `RET` pops the return address into the PC.

The program above pushes 1234H, clears BC, pops it into DE, then makes a CALL and RET; afterwards DE = 1234H and SP = F000H again. The memory just below F000H still holds the last thing pushed: the CALL's return address 010EH (the address after the CALL), stored low byte first (0EH at EFFEH, 01H at EFFFH). The core shows exactly those bytes.

## Worked example

*Trace `PUSH BC` with BC = 1234H and SP = F000H.*

1. SP is reduced by 2 to EFFEH.
2. The register pair BC (B = 12H, C = 34H) is written to the stack.
3. `POP DE` reads it back, DE = 1234H, and SP returns to F000H.

## Try it

*Why does a Z80 program need `LD SP,nn` near the start, while the 68000's lecture says the 68K initialises SP on power-up?*

???

The Z80 resets with SP at an undefined/default value and has no vector table that supplies one, so the program must set it to the top of RAM before any CALL or PUSH. The 68000 loads its initial stack pointer from the first long word of its vector table on reset (see the 68008 lab).
