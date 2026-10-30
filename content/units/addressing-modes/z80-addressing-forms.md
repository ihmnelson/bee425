---
track: z80
title: "Z80 addressing: register, immediate, indirect and absolute"
summary: "Register, immediate and (HL) forms are general; absolute addressing is mostly A only; 16-bit values are stored little endian."
needs: [programmers-model.z80-registers, assembly-programs.z80-load]
sources:
  - { type: slide, ref: "L5 s222", quote: "Copy the contents of B into A, note direction" }
  - { type: slide, ref: "L5 s223", quote: "Only register A can be used with absolute addressing" }
  - { type: slide, ref: "L5 s224", quote: "Stores 16-bit memory values in Little Endian" }
  - { type: oracle, ref: "the addressing program below is run on the Z80 core" }
encodings:
  - { cpu: z80, asm: "LD A,B", hex: "78" }
  - { cpu: z80, asm: "LD C,55H", hex: "0E 55" }
  - { cpu: z80, asm: "LD B,[HL]", hex: "46" }
  - { cpu: z80, asm: "LD [0FF20H],A", hex: "32 20 FF" }
  - { cpu: z80, asm: "LD DE,0A34BH", hex: "11 4B A3" }
programs:
  - cpu: z80
    name: "the lecture's Z80 forms, with little-endian storage"
    source: |
      ; program
              .ORG 0100H
      START:  LD B,3CH
              LD A,B
              LD C,55H
              LD HL,3000H
              LD [HL],C
              LD B,[HL]
              LD [3010H],A
              LD HL,1234H
              LD [3020H],HL
              LD DE,0A34BH
              HALT
              .END
    expect:
      regs: { a: 0x3C, b: 0x55, c: 0x55 }
      mem: { 12288: [0x55], 12304: [0x3C], 12320: [0x34, 0x12] }
      regs2: {}
checks:
  - type: choice
    prompt: "Which Z80 instruction is the equivalent of the 68000's `MOVE.B D0,$0000FF35` (register to absolute memory)?"
    options: ["LD [0FF35H],A (only A can use absolute addressing)", "LD [0FF35H],B", "LD 0FF35H,A", "MOVE B,[0FF35H]"]
    answer: 0
    explain: "Z80 restriction 1: only register A can be used with absolute addressing for 8-bit transfers. The brackets (or parentheses) are required to mean 'the memory at this address'."
  - type: choice
    prompt: "`LD HL,1234H` followed by `LD [3020H],HL` leaves which bytes at 3020H and 3021H?"
    options: ["34H at 3020H and 12H at 3021H (little endian)", "12H at 3020H and 34H at 3021H", "1234H at 3020H only", "Nothing"]
    answer: 0
    explain: "The Z80 stores 16-bit values little endian: the low byte first. The 68000 is big endian and would put $12 first. Verified by running it."
  - type: choice
    prompt: "Which way do the operands of `LD A,B` go, compared with `MOVE.B D0,D1`?"
    options: ["Z80: copy B into A (destination first). 68000: copy D0 into D1 (source first)", "Both copy the left register to the right", "Both copy the right register to the left", "Neither copies"]
    answer: 0
    explain: "The lecture stresses the direction: LD A,B copies B into A."
  - type: choice
    prompt: "Why is `0A34BH` written with a leading zero in `LD DE,0A34BH`?"
    options: ["So the assembler does not read A34BH as a label", "Because the register is 16 bits", "It is part of the opcode", "It is optional"]
    answer: 0
    explain: "A number starting with A-F needs a leading 0 so it cannot be mistaken for a name."
card:
  front: "Z80 versions of the 68000 transfers, and what to watch for?"
  back: "Reg-reg: LD A,B (dest first). Immediate: LD C,55H; 16-bit LD DE,0A34BH. Indirect: LD B,[HL] (pair as pointer). Absolute 8-bit: only A: LD [0FF20H],A. Absolute 16-bit: LD [nn],HL, stored little endian (low byte first)."
glossary:
  - { term: "Little endian", def: "Multi-byte values are stored with the least significant byte at the lowest address (Z80); the 68000 is big endian." }
bridge:
  to: addressing-modes.m68k-effective-address
  same: "Both can use register, immediate, indirect (register as pointer) and absolute (exact address) operands, and both write 'memory at this address' in brackets or parentheses."
  different: "The 68000 has 8 general modes, usable by most instructions on any data register; the Z80's forms are tied to specific registers: HL (or BC, DE, IX, IY) as pointers, absolute only with A for bytes. 16-bit data is little endian on the Z80 and big endian on the 68000."
  why: "The 68000's effective address field is built into every op-code word (modes 0-7); the Z80 has separate opcodes for each form, so only the combinations the designers chose exist."
---

## Learn

**Callback.** You met the 68000's effective-address modes. The Z80 has the same ideas with fewer, more restricted forms. The lecture's comparisons:

| Idea | 68000 | Z80 |
|---|---|---|
| Register to register | `MOVE.B D0,D1` | `LD A,B` (copies B into A: note direction) |
| Immediate | `MOVE.B #$55,D1` | `LD C,55H` |
| Indirect through a pointer | `MOVE.B (A0),D1` | `LD B,[HL]` (HL is the pointer) |
| Absolute, 8-bit | `MOVE.B D0,$0000FF35` | `LD [0FF20H],A` (**only A**) |
| 16-bit immediate | `MOVE.W #$ABFF,D1` | `LD DE,0A34BH` |
| Absolute, 16-bit | `MOVE.W D0,$0000FF36` | `LD [0FF20H],HL` (absolute only; **little endian**) |

The Z80's bracket (or parenthesis) around an address is **required** for absolute addressing. A hex number starting with A-F needs a leading 0.

**Endianness.** The 68000 is **big endian** (high byte first). The Z80 stores 16-bit values **little endian**: `LD HL,1234H` then `LD [3020H],HL` puts 34H at 3020H and 12H at 3021H. The program above shows this by running on the Z80 core.

## Worked example

*Copy the byte at address 3000H into register B using a pointer.*

1. `LD HL,3000H`: HL is the pointer.
2. `LD B,[HL]`: B gets the byte at the address in HL (no need to go through A).
3. The 68000 equivalent: `LEA $3000,A0` then `MOVE.B (A0),D1`.

## Try it

*Can you write `LD [3000H],B`?*

???

**No.** Absolute 8-bit addressing is available only with **A**: `LD [3000H],A`. To store B you would use `LD A,B` first, or a pointer: `LD HL,3000H` then `LD [HL],B`.
