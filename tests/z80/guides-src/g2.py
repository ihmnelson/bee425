# -*- coding: utf-8 -*-
from g1 import G, guide

guide('instructions', 'Instruction reference', 'L4-5', '⚙️', ['inst', 'Register Tracer'], 'The Z80 instruction groups with bytes, T-states and flag effects.', r'''
Times are in T-states (clock cycles) and were measured on this site's CPU core, which matches the SingleStepTests hardware-derived vectors. **Destination first.** `r` is a register, `n` an 8-bit constant, `nn` a 16-bit constant or address, `d` a signed displacement.

## Load and exchange

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| `LD r,r'` | copy a register (`LD B,C`) | 1 | 4 |
| `LD r,n` | register ← constant | 2 | 7 |
| `LD r,(HL)` / `LD (HL),r` | memory ↔ register through HL | 1 | 7 |
| `LD (HL),n` | store a constant | 2 | 10 |
| `LD A,(BC)` `LD A,(DE)` and the reverse | A ↔ memory at BC/DE | 1 | 7 |
| `LD A,(nn)` / `LD (nn),A` | A ↔ absolute address | 3 | 13 |
| `LD rr,nn` | 16-bit constant into BC/DE/HL/SP | 3 | 10 |
| `LD HL,(nn)` / `LD (nn),HL` | 16-bit memory transfer (little-endian) | 3 | 16 |
| `LD SP,HL` | set the stack pointer | 1 | 6 |
| `LD r,(IX+d)` / `LD (IX+d),r` | indexed access | 3 | 19 |
| `LD (IX+d),n` | store a constant, indexed | 4 | 19 |
| `LD IX,nn` | load an index register | 4 | 14 |
| `PUSH rr` / `POP rr` | stack (BC, DE, HL, AF, IX, IY) | 1 | 11 / 10 |
| `EX DE,HL` | swap DE and HL | 1 | 4 |
| `EX AF,AF'` / `EXX` | swap register sets | 1 | 4 |
| `EX (SP),HL` | swap HL with the top of the stack | 1 | 19 |

There is no `LD` between two memory locations, and no `LD rr,rr'`.

## 8-bit arithmetic and logic (accumulator A)

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| `ADD A,r` / `ADD A,n` / `ADD A,(HL)` | A ← A + operand | 1 / 2 / 1 | 4 / 7 / 7 |
| `ADC A,x` | A ← A + operand + carry | | |
| `SUB x` / `SBC A,x` | A ← A − operand (− carry) | | |
| `AND x` `OR x` `XOR x` | bitwise logic | | |
| `CP x` | A − operand, flags only | 1 / 2 | 4 / 7 |
| `INC r` / `DEC r` | add / subtract 1 (carry unchanged) | 1 | 4 |
| `INC (HL)` / `DEC (HL)` | in memory | 1 | 11 |
| `NEG` | A ← 0 − A | 2 | 8 |
| `CPL` | complement A | 1 | 4 |
| `DAA` | decimal adjust after BCD add/subtract | 1 | 4 |
| `SCF` / `CCF` | set / complement the carry flag | 1 | 4 |

`XOR A` and `OR A` are the classic one-byte idioms: `XOR A` sets A = 0; `OR A` clears the carry and tests A for zero without changing it.

## 16-bit arithmetic

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| `ADD HL,rr` | HL ← HL + BC/DE/HL/SP | 1 | 11 |
| `ADD IX,rr` | with IX (rr = BC, DE, IX, SP) | 2 | 15 |
| `ADC HL,rr` / `SBC HL,rr` | with carry; all flags updated | 2 | 15 |
| `INC rr` / `DEC rr` | no flags change | 1 | 6 |

There is **no 16-bit SUB**: write `OR A` (clear carry) then `SBC HL,DE`.

## Rotates, shifts and bit instructions

| Instruction | Effect | T |
|---|---|---|
| `RLCA RRCA RLA RRA` | rotate A (RLCA/RRCA: 8-bit; RLA/RRA: through carry) | 4 |
| `RLC r  RRC r  RL r  RR r` | the same on any register | 8 |
| `SLA r` | shift left, 0 into bit 0, bit 7 to carry | 8 |
| `SRA r` | shift right, sign bit kept | 8 |
| `SRL r` | shift right, 0 into bit 7 | 8 |
| `BIT b,r` | test bit b: Z = 1 when the bit is 0 | 8 (`(HL)`: 12) |
| `SET b,r` / `RES b,r` | set / clear bit b | 8 (`(HL)`: 15) |
| `RLD` / `RRD` | rotate BCD digits between A and (HL) | 18 |

On `(HL)` the rotates take 15 T-states, indexed forms 23.

## Jumps, calls and returns

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| `JP nn` | absolute jump | 3 | 10 |
| `JP cc,nn` | conditional (8 conditions) | 3 | 10 |
| `JP (HL)` | jump to the address in HL | 1 | 4 |
| `JR e` / `JR cc,e` | relative (cc: NZ, Z, NC, C) | 2 | 12 / 12 taken, 7 not |
| `DJNZ e` | B ← B − 1, jump if not zero | 2 | 13 taken, 8 not |
| `CALL nn` / `CALL cc,nn` | push PC, jump | 3 | 17 / 17 taken, 10 not |
| `RET` / `RET cc` | pop PC | 1 | 10 / 11 taken, 5 not |
| `RETI` / `RETN` | return from interrupt | 2 | 14 |
| `RST p` | one-byte call to 00H, 08H, ... 38H | 1 | 11 |

## Block instructions

| Instruction | Effect | T |
|---|---|---|
| `LDI` / `LDD` | (DE) ← (HL); HL, DE ±1; BC − 1 | 16 |
| `LDIR` / `LDDR` | repeat until BC = 0 | 21 per repeat, 16 on the last |
| `CPI` / `CPD` | compare A with (HL); HL ±1; BC − 1 | 16 |
| `CPIR` / `CPDR` | repeat until match or BC = 0 | 21 per repeat |
| `INI IND OUTI OUTD` and the `R` forms | block I/O using B as the counter | 16 / 21 |

## Input, output and control

| Instruction | Effect | T |
|---|---|---|
| `IN A,(n)` / `OUT (n),A` | port n (00H–FFH) ↔ A | 11 |
| `IN r,(C)` / `OUT (C),r` | port numbered in C | 12 |
| `NOP` | do nothing | 4 |
| `HALT` | stop until an interrupt or reset | 4 |
| `DI` / `EI` | disable / enable interrupts | 4 |
| `IM 0` `IM 1` `IM 2` | interrupt mode | 8 |
| `LD A,I` `LD A,R` `LD I,A` `LD R,A` | special registers | 9 |

## Reading the Z80 data book

Each entry shows the **operation**, the **assembler syntax**, the **flags** (a table of S Z H P/V N C marked "•" affected, "0"/"1" forced, "?" unknown), the **encoding** and the **T-states / M-cycles**. The lecture's example: `ADD A,n` is the Z80's version of the 68K's `ADDI.B #data,<ea>`; its machine code is `C6 n`, so `C6 22` adds 22H to A. Note the direction: the Z80 reads *destination ← destination + source*, the 68K *source + destination → destination*.
''')

guide('modes', 'Addressing modes in depth', 'L5', '🎯', ['modes', 'Mode Match'], 'Where the operand lives: register, immediate, indirect, indexed, extended, relative.', r'''
An **addressing mode** tells the CPU how to find an operand. The Z80 has fewer modes than the 68000, but each instruction supports only some of them (the lecture's key point: *each instruction has its own set of permissible addressing modes*).

| Mode | Example | The operand is… |
|---|---|---|
| Register | `LD A,B` / `ADD A,C` | in a CPU register |
| Immediate | `LD C,55H` | the byte after the opcode |
| Immediate extended | `LD DE,0A34BH` | the two bytes after the opcode (16-bit, low byte first) |
| Register indirect | `LD B,[HL]` | in memory at the address held in HL (or BC, DE) |
| Indexed | `LD A,(IX+5)` | in memory at IX (or IY) + signed 8-bit displacement |
| Extended (absolute) | `LD A,(1234H)` / `JP 0ABCDH` | in memory at the 16-bit address after the opcode |
| Relative | `JR NZ,LOOP` / `DJNZ LOOP` | an offset from the next instruction |
| Implied | `CPL` / `EXX` / `DAA` | built into the opcode (usually A or HL) |
| Bit | `BIT 3,A` / `SET 7,[HL]` | a bit number (0–7) selects one bit |
| Modified page-zero | `RST 38H` | a call to one of eight addresses in page zero |

## Register indirect: a register pair as a pointer

HL is the general pointer: `LD A,(HL)`, `LD (HL),B`, `ADD A,(HL)`, `INC (HL)`, `CP (HL)`, `BIT 0,(HL)`... BC and DE work only with A: `LD A,(BC)`, `LD (BC),A`, `LD A,(DE)`, `LD (DE),A`. Pointers make arithmetic on addresses possible: `INC HL` moves to the next byte.

```asm
        LD HL,TABLE        ; HL = address of the table
        LD A,[HL]          ; A = first byte
        INC HL             ; point at the next one
        ADD A,[HL]         ; add the second byte
```

## Immediate vs extended: the brackets

`LD A,(1234H)` reads memory at address 1234H. `LD HL,1234H` puts the number 1234H into HL. `LD HL,(1234H)` reads two bytes from memory at 1234H and 1235H into L and H. Forgetting or adding brackets changes the meaning completely.

Absolute addressing has limits: the only 8-bit register that can use it is **A**; for 16-bit data it works with HL (and BC, DE, SP, IX, IY). To store another register at an address, load the address into HL and use `LD (HL),r`.

## Indexed: tables and structures

```asm
        LD IX,RECORD       ; RECORD: id, score, bonus
        LD A,[IX+1]        ; score
        ADD A,[IX+2]       ; + bonus
```

The displacement is a *signed* byte (−128 to +127); the index register is not changed. For arrays, add the element size to IX each time (`LD DE,3` / `ADD IX,DE`).

## Relative addressing

`JR` and `DJNZ` store a signed offset instead of an address. The code works wherever it is loaded (position independent), at the price of a ±128-byte reach.

## What is not available

- No memory-to-memory `LD` (the 68K has it); use a register, or the block instructions.
- No post-increment or pre-decrement addressing: advance pointers with `INC HL` / `DEC HL`.
- No 16-bit register-to-register `LD` except `LD SP,HL`; use `EX DE,HL` or two 8-bit loads.
''')

guide('branches', 'Jumps, conditions and loops', 'L5', '🔀', ['flow', 'Branch Oracle'], 'JP, JR, DJNZ and the eight conditions; loop patterns.', r'''
Computers decide by changing the program counter. On the Z80 that means `JP` (absolute), `JR` (relative) and `DJNZ` (relative loop), each optionally conditional on a **flag**.

## The eight conditions

| cc | Meaning | Tests | Works with |
|---|---|---|---|
| `NZ` | not zero / not equal | Z = 0 | JP JR CALL RET |
| `Z` | zero / equal | Z = 1 | JP JR CALL RET |
| `NC` | no carry | C = 0 | JP JR CALL RET |
| `C` | carry | C = 1 | JP JR CALL RET |
| `PO` | parity odd / no overflow | P/V = 0 | JP CALL RET |
| `PE` | parity even / overflow | P/V = 1 | JP CALL RET |
| `P` | sign positive | S = 0 | JP CALL RET |
| `M` | sign negative (minus) | S = 1 | JP CALL RET |

(The lecture lists NZ, Z, NC, C, P and M for `JP cc`; the Z80 has PO and PE as well.) `JR` is limited to the first four.

## Comparing with CP

`CP B` computes A − B and sets the flags without changing A.

| After `CP B` | Condition |
|---|---|
| A = B | `Z` |
| A ≠ B | `NZ` |
| A < B (unsigned) | `C` |
| A ≥ B (unsigned) | `NC` |
| A > B (unsigned) | `NZ` **and** `NC` (test NC after excluding Z) |

For **signed** numbers the true condition is "S ≠ V" (sign differs from overflow). The Z80 has no single condition for that. The usual idiom uses `SUB`, because it needs the *result* in A (the compare `CP` throws the result away, so you cannot fix up its sign):

```asm
        SUB B              ; A = A - B (signed compare; A is destroyed)
        JP PO,NOOVF        ; no overflow: the sign flag is right
        XOR 80H            ; overflow: the sign is inverted, flip it
NOOVF:  JP M,LESS          ; now M means the original A < B
```

(Save A first with `LD C,A` if you still need it.) An exhaustive test of all 65,536 pairs of bytes confirms the idiom (`tests/audit/checks.js`).

## Loops

### Count down with DJNZ

```asm
        LD B,10            ; ten passes
LOOP:   ; ... body ...
        DJNZ LOOP          ; B = B - 1, repeat while B is not zero
```

`DJNZ` is the only instruction that decrements and branches in one, changes no flags, and runs 8 T-states when it falls through. `LD B,0` gives 256 passes.

### Count with the accumulator

```asm
        LD A,10
LOOP:   ; ... body ...
        DEC A
        JR NZ,LOOP
```

### Stop on a sentinel

```asm
        LD HL,DATA
NEXT:   LD A,[HL]
        OR A               ; sets Z if the byte is 0
        JR Z,DONE          ; zero byte ends the table
        ; ... use A ...
        INC HL
        JR NEXT
DONE:   HALT
DATA:   .DB 12,13,5,0
```

## If / else

```asm
        CP 10              ; if (A >= 10)
        JR C,SMALL
        ; ... A >= 10 ...
        JR END
SMALL:  ; ... A < 10 ...
END:
```

## Plan with a flow chart

The course asks for flow charts: rectangles for operations, diamonds for decisions, arrows for flow. Students usually write the program first and chart it later; the charts exist to prevent avoidable errors.

## Z80 vs 68K

The Z80 has **conditional jumps to absolute addresses, conditional calls and conditional returns**; the 68K has only conditional (relative) branches. The 68K's `DBcc` loop instruction corresponds to the Z80's `DJNZ`.
''')

guide('stack', 'The stack, subroutines and interrupts', 'L5', '📚', ['flow', 'Program Sorter'], 'PUSH, POP, CALL, RET, the reset and interrupt vectors.', r'''
The **stack** is a LIFO region of memory addressed by SP. On the Z80 it grows toward **lower addresses**: `PUSH` decrements SP by two and stores the pair (high byte at the higher address); `POP` loads the pair and adds 2.

```
SP = 8000H, BC = 1234H
PUSH BC      -> SP = 7FFEH, (7FFFH) = 12H, (7FFEH) = 34H
POP DE       -> DE = 1234H, SP = 8000H
```

Set SP yourself before using it: `LD SP,0F000H` (after reset SP is undefined).

## Subroutines

`CALL nn` pushes the address of the next instruction and loads PC with nn; `RET` pops that address back into PC. `CALL cc,nn` and `RET cc` are the conditional forms the 68K lacks.

```asm
        .ORG 0100H
START:  LD SP,0F000H
        LD A,7
        CALL SQUARE        ; A = A * A
        HALT
SQUARE: PUSH BC            ; save the caller's BC
        LD B,A
        LD C,A
        XOR A
SQ1:    ADD A,C
        DJNZ SQ1
        POP BC             ; restore it
        RET
```

Rules of thumb:

1. **Balance the stack.** Every `PUSH` needs a `POP` before `RET`, in the opposite order.
2. **Save what you change** if the caller expects it back. Decide on a convention (which registers a routine may destroy) and document it.
3. Pass values in registers: A for a byte, HL or DE for a 16-bit value or address.
4. An extra PUSH or POP makes `RET` jump to the wrong address, the classic crash.

The lecture's list of what happens: save the return address, transfer to the routine, run it, restore, and return to where it was called from.

## RST: a one-byte call

`RST 38H` pushes PC and jumps to 0038H. The eight targets are 00H, 08H, 10H, 18H, 20H, 28H, 30H, 38H. It is used for fast system calls and by interrupts.

## Interrupts

An interrupt makes the CPU stop, save PC and run a service routine. The Z80 has:

| Input | Maskable? | Goes to | Return with |
|---|---|---|---|
| Reset | no | 0000H | n/a |
| NMI | no | 0066H | `RETN` |
| INT, mode 0 | yes (`DI`/`EI`) | the device places an instruction (usually an RST) on the data bus | `RETI` |
| INT, mode 1 | yes | 0038H | `RETI` |
| INT, mode 2 | yes | address stored in a table at (I × 256 + vector byte from the device) | `RETI` |

Facts to remember:

- Interrupts are **disabled after reset**; `EI` enables them (after the *next* instruction), `DI` disables them.
- When an interrupt is accepted the CPU disables further maskable interrupts; the routine ends with `EI` then `RETI`.
- `RETI` tells Z80-family peripherals the routine is done; `RETN` also restores the interrupt-enable flag after an NMI.
- Save every register the routine uses (`PUSH`), or swap sets quickly with `EXX` and `EX AF,AF'`.

```asm
        .ORG 0000H
        JP START
        .ORG 0038H          ; mode 1 vector
        PUSH AF
        LD A,[COUNT]
        INC A
        LD [COUNT],A
        POP AF
        EI
        RETI
        .ORG 0100H
START:  LD SP,0F000H
        IM 1
        EI
IDLE:   JR IDLE
        .ORG 0200H
COUNT:  .DB 0
```

The sandbox's **INT** button raises this interrupt, so you can step into the routine and watch the stack.
''')
