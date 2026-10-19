# -*- coding: utf-8 -*-
# Guide sources (part 1). Backticks are literal; the builder escapes them for a JS template literal.
G = []
def guide(id, title, lesson, icon, practice, summary, md):
    G.append(dict(id=id, title=title, lesson=lesson, icon=icon, practice=practice, summary=summary, md=md.strip('\n')))

guide('cpu', 'How a processor runs a program', 'L3', '🧠', ['cpu', 'Register Tracer'], 'Fetch, decode, execute, and the blocks inside the CPU.', r'''
A microprocessor is a machine that repeats one cycle forever: **fetch** an instruction from memory, **decode** it, **execute** it. Everything else (registers, ALU, buses) exists to make that cycle work.

## The blocks inside the CPU

| Block | Job |
|---|---|
| Control logic (state machine) | The "brain": decodes instructions, sequences memory reads and writes, makes decisions. It is why processors are synchronous (clock driven). |
| ALU (arithmetic and logic unit) | Performs every add, subtract, AND, OR, shift. Operands come from registers; results set the flags. |
| General registers | Fast local storage built from D flip-flops, right next to the CPU. Efficient programs work register to register. |
| Flag register | Holds flag bits (Zero, Sign, Carry...) set by the ALU. If A = B then A − B gives Zero flag = 1. |
| Program counter (PC) | Address of the next instruction. Jumps and calls work by changing the PC. |
| Stack pointer (SP) | Points into the stack (LIFO memory) used for subroutine calls and interrupts. |
| Instruction register | Holds the opcode just fetched while the control logic decodes it. |
| Address and data buffers | Drive the address bus and connect the internal data path to the data bus. |
| Interrupt logic | Sequences interrupts into the running program. |

## The three buses

Every processor talks to the outside world through three groups of wires:

- **Address bus:** the CPU says *where*. It is unidirectional (CPU to memory). With n address lines you can address 2ⁿ bytes; the Z80 has 16 (A0–A15), so 64 KB.
- **Data bus:** the information being read or written. It is bidirectional; the Z80's is 8 bits wide (D0–D7).
- **Control bus:** housekeeping signals such as RESET, INT, RD, WR and MREQ. Some are inputs, some outputs.

## One instruction, step by step

Take `ADD A,(HL)` (add the byte in memory at the address in HL to the accumulator). It takes 7 clock cycles (T-states):

1. The PC value goes on the address bus; the **opcode** `86H` is read from memory into the instruction register (4 T-states, the M1 cycle).
2. The PC advances to the next instruction as the opcode is decoded.
3. The decoder sees "ADD to A, source is the memory byte addressed by HL".
4. HL goes on the address bus; the byte is read (3 T-states) and the ALU adds it to A.
5. The sum is stored in A and the flags S Z H P/V N C are updated.

> Assembly language maps one-to-one onto machine instructions, so understanding assembly means understanding the machine from the programmer's side. That is why hardware designers use it to bring up new boards.

## Microprocessor vs microcontroller

A **microprocessor** is just the CPU: program memory, data memory, serial and parallel I/O and timers live on the PCB around it. A **microcontroller** integrates the CPU plus those peripherals (UARTs, timers, A/D and D/A, SRAM, flash) onto a single chip. The Z80 is a microprocessor; the Z80 family also has peripheral chips (PIO, SIO, CTC) that you add around it.

## CISC vs RISC

| | CISC (Z80, 68000) | RISC (ARM) |
|---|---|---|
| Instructions | Many, variable length (the Z80: 1 to 4 bytes) | Fewer, all the same size |
| Addressing modes | Many | Few |
| Registers | Fewer, with specific roles (the Z80 accumulator A, pointer HL) | Many, general purpose |
| Memory access | Operations may read memory directly (`ADD A,(HL)`) | Only load and store touch memory; ALU works on registers |
| Memory model | von Neumann (one memory for code and data) | Often Harvard (separate code and data memories) |
''')

guide('numbers', "Numbers, hex and two's complement", 'L3', '🔢', ['num', 'Number Ninja'], 'Hex and binary notation, negative numbers, flags after arithmetic, and little-endian storage.', r'''
## Writing numbers in Z80 assembly

| Base | Z80 (Zilog style) | Also accepted by Oshonsoft | 68K | C |
|---|---|---|---|---|
| Hexadecimal | `0AF56H` (leading 0 if it starts with A–F) | `0xAF56`, `$AF56`, `&HAF56`, `H'AF56'` | `$AF56` | `0xAF56` |
| Binary | `10101100B` | `%10101100`, `0b10101100`, `B'10101100'` | `%10101100` | `0b10101100` |
| Decimal | `25` | `.25`, `D'25'` | `25` | `25` |
| Character | `'A'` | `"A"`, `A'A'` | `'A'` | `'A'` |

The leading 0 matters: `FFH` would be read as a label called FFH, and the assembler would complain that it is undefined. Write `0FFH`.

## Two's complement

All subtraction becomes addition of a negative number. To negate a byte: **complement every bit, then add 1**.

```
5EH = 0101 1110
complement = 1010 0001
+ 1        = 1010 0010 = 0A2H   (this is -5EH, that is -94)
```

For n bits the range is −2ⁿ⁻¹ to +2ⁿ⁻¹−1: a byte is −128 to +127, a 16-bit value −32,768 to +32,767. Zero counts as positive, so there is one more negative number than positive ones. The same bit pattern can mean 255 or −1: **the CPU does not know; the programmer decides** (and picks the matching flag to test).

## Flags after arithmetic

| Instruction | A before, operand | A after | S | Z | H | P/V | N | C |
|---|---|---|---|---|---|---|---|---|
| `ADD A,B` | 7FH + 01H | 80H | 1 | 0 | 1 | **1** | 0 | 0 |
| `ADD A,B` | 0FFH + 01H | 00H | 0 | 1 | 1 | 0 | 0 | **1** |
| `ADD A,B` | 80H + 80H | 00H | 0 | 1 | 0 | **1** | 0 | **1** |
| `ADD A,B` | 0FH + 01H | 10H | 0 | 0 | **1** | 0 | 0 | 0 |
| `SUB B` | 01H − 02H | 0FFH | 1 | 0 | 1 | 0 | 1 | **1** |
| `SUB B` | 80H − 01H | 7FH | 0 | 0 | 1 | **1** | 1 | 0 |
| `CP B` | 05H, 05H | 05H | 0 | **1** | 0 | 0 | 1 | 0 |
| `CP B` | 03H, 09H | 03H | 1 | 0 | 1 | 0 | 1 | **1** |

(Every row was produced by running the instruction on this site's CPU core.) Reading it:

- **C (carry)** is the *unsigned* warning: the result did not fit in 8 bits (add) or a borrow was needed (subtract).
- **P/V (overflow)** is the *signed* warning: two positives gave a negative (7FH + 01H = 80H) or two negatives gave a positive (80H + 80H).
- **Z** says the result is zero. **S** copies bit 7. **H** is the carry from bit 3 into bit 4, used by DAA. **N** is 1 after a subtraction.

## Parity

After logic instructions (AND, OR, XOR) and rotates/shifts, **P/V holds parity**: 1 if the result has an *even* number of 1 bits. `XOR A` leaves A = 00H, which has zero (an even number of) 1 bits, so P/V = 1. Conditions `PE` (parity even) and `PO` (parity odd) test it.

## Decimal arithmetic: BCD and DAA

Packed BCD stores one decimal digit per nibble: 47 decimal is `47H`. Adding in binary breaks this (47H + 38H = 7FH), so **DAA** (decimal adjust) corrects the sum using H, C and N: `LD A,47H` / `ADD A,38H` / `DAA` leaves A = 85H, which reads as decimal 85.

## Characters

ASCII codes: `'0'`–`'9'` are 30H–39H, `'A'` is 41H, `'a'` is 61H, CR is 0DH, LF is 0AH. Adding `'0'` (30H) to a digit value 0–9 makes the character.

## Little-endian storage

The Z80 stores a 16-bit value with the **low byte at the lower address**. `LD (1234H),HL` with HL = 0ABCDH stores `CDH` at 1234H and `ABH` at 1235H. Immediate values in instructions follow the same rule: `LD DE,0A34BH` assembles to `11 4B A3`. The 68000 is the opposite (big-endian).
''')

guide('model', "The Z80 programmer's model", 'L3', '🗂️', ['cpu', 'Flag Flipper'], 'Registers, flags, the alternate set, IX/IY, I and R.', r'''
## Registers

| Register | Size | Role |
|---|---|---|
| A | 8 | **Accumulator.** One operand and the destination of 8-bit arithmetic and logic. |
| F | 8 | **Flags** (S Z H P/V N C). Not loaded directly; PUSH AF / POP AF move it. |
| B, C, D, E, H, L | 8 | General purpose. Pairs **BC, DE, HL** form 16-bit registers. |
| A', F', B', C', D', E', H', L' | 8 | **Alternate set**, swapped in by `EX AF,AF'` and `EXX`. |
| IX, IY | 16 | **Index registers**: base address plus a signed displacement, `(IX+d)`. |
| SP | 16 | **Stack pointer.** Grows toward lower addresses. |
| PC | 16 | **Program counter.** |
| I | 8 | **Interrupt vector** high byte (interrupt mode 2). |
| R | 8 | **Memory refresh** counter; increments on every instruction fetch. |

Examples from the lecture: `LD E,55H` (hex number into E), `LD C,L` (copy L into C), `LD B,(HL)` (memory addressed by HL into B), `ADD A,D`, `AND B`, `PUSH BC`, `CALL 2000H`, `LD (IX+d),L`.

## The flag register

| Bit | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|---|---|---|
| Flag | S | Z | (Y) | H | (X) | P/V | N | C |
| Meaning | Sign | Zero | unused | Half carry | unused | Parity / Overflow | Subtract | Carry |

Bits 5 and 3 are not documented flags; on real chips they copy bits of the result. This simulator reproduces that, but do not rely on it.

| Flag | Set when… |
|---|---|
| **S** | Bit 7 of the result is 1 (negative as a signed number). |
| **Z** | The result is zero. |
| **H** | A carry crossed from bit 3 to bit 4 (BCD arithmetic uses it). |
| **P/V** | After arithmetic: signed overflow. After logic and rotates: even parity. |
| **N** | The last arithmetic instruction was a subtraction (DAA uses it). |
| **C** | A carry out of bit 7 (add) or a borrow (subtract); rotates and shifts put the bit that fell off here. |

### Which instructions change which flags (summary)

| Instructions | S Z H P/V N C |
|---|---|
| `ADD ADC SUB SBC CP NEG` | all six |
| `AND` | S Z P(parity); H = 1; N = 0; C = 0 |
| `OR XOR` | S Z P(parity); H = 0; N = 0; C = 0 |
| `INC r` / `DEC r` | S Z H P/V N; **C is unchanged** |
| `INC rr` / `DEC rr` / `LD` / `PUSH` / `POP` (not AF) / `JP` / `CALL` / `RET` | none |
| `ADD HL,rr` | H, N and C only (S, Z and P/V unchanged) |
| `RLCA RRCA RLA RRA` | C, H = 0, N = 0 |
| `RLC RRC RL RR SLA SRA SRL` | S Z P(parity) C; H = 0, N = 0 |
| `BIT` | Z (inverse of the bit), H = 1, N = 0 |
| `SET RES EX EXX` | none |

## The alternate register set

`EX AF,AF'` swaps AF with AF'. `EXX` swaps **BC, DE and HL** with BC', DE' and HL' (it does not touch A or F). Together they save and restore a whole working set in two instructions, which is why interrupt routines use them.

> The slides say a "single instruction swaps main and alternate register sets". Strictly it takes two: `EXX` for BC/DE/HL and `EX AF,AF'` for the accumulator and flags.

## Index registers

IX and IY hold a base address; instructions add a signed 8-bit displacement: `LD A,(IX+5)`, `LD (IY-2),B`, `INC (IX+0)`. The index register is unchanged. Use them for tables of records: point IX at a record and `(IX+d)` picks a field. Under the hood the instruction gets a prefix byte (`DDH` for IX, `FDH` for IY) in front of the HL form, which is why indexed instructions are longer and slower.

## After RESET

PC = 0000H, I = 00H, R = 00H, interrupts disabled, interrupt mode 0. All other registers are undefined. Execution begins at address 0000H.

## Undocumented parts

The halves of the index registers (IXH, IXL, IYH, IYL), `SLL`, and `OUT (C),0` work on real chips but are not in the official manual. This site's assembler and CPU support them, as does the Oshonsoft simulator ("support for unofficial instructions").
''')

guide('machine-code', 'From assembly to machine code', 'L4-5', '🧬', ['num', 'Number Ninja'], 'Opcodes, prefixes, operands and how the assembler builds the bytes.', r'''
An assembly instruction becomes **1 to 4 bytes** in memory. The first byte is the **opcode** (unlike the 68K, whose instructions start with a 16-bit opcode word). Operands follow: constants, addresses (low byte first), or displacements.

## Register-to-register LD has a pattern

`LD r,r'` is the bit pattern `01 ddd sss`, where `ddd` is the destination and `sss` the source register:

| Code | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| Register | B | C | D | E | H | L | (HL) | A |

So `LD A,B` is `01 111 000` = `78H`, `LD B,A` is `01 000 111` = `47H`, and `LD A,(HL)` is `01 111 110` = `7EH`. The pattern `01 110 110` would be `LD (HL),(HL)` and is used for **HALT** (`76H`).

The ALU group works the same way: `10 ooo sss` where `ooo` = ADD, ADC, SUB, SBC, AND, XOR, OR, CP. So `ADD A,B` is `80H` and `XOR A` is `0AFH`.

## Examples (assembled and checked on this site)

| Instruction | Bytes | Length | T-states |
|---|---|---|---|
| `NOP` | `00` | 1 | 4 |
| `LD B,C` | `41` | 1 | 4 |
| `LD A,5` | `3E 05` | 2 | 7 |
| `ADD A,5` | `C6 05` | 2 | 7 |
| `LD HL,1234H` | `21 34 12` | 3 | 10 |
| `LD A,(1234H)` | `3A 34 12` | 3 | 13 |
| `JP 1234H` | `C3 34 12` | 3 | 10 |
| `LD A,(IX+5)` | `DD 7E 05` | 3 | 19 |
| `LD IX,1234H` | `DD 21 34 12` | 4 | 14 |
| `LD (IX+5),7` | `DD 36 05 07` | 4 | 19 |

The lecture example: `ADD A,22H` is `C6 22`; with A = 33H the result is 55H.

## Prefix bytes

Most opcodes fit in one byte. Four **prefix bytes** open extra pages of instructions:

| Prefix | Page |
|---|---|
| `CBH` | Rotates, shifts, `BIT`, `SET`, `RES` (`BIT 3,B` = `CB 58`) |
| `EDH` | Extended: block moves (`LDIR` = `ED B0`), 16-bit `ADC`/`SBC`, `NEG`, `IM`, `IN r,(C)`, `OUT (C),r`, `RETI`... |
| `DDH` | Same instruction but with **IX** in place of HL (`LD A,(IX+5)` = `DD 7E 05`) |
| `FDH` | Same instruction but with **IY** in place of HL |

Each prefix costs 4 extra T-states, which is why `LD A,(HL)` takes 7 and `LD A,(IX+5)` takes 19.

## Relative jumps

`JR` and `DJNZ` are two bytes: the opcode and a **signed displacement**. The CPU adds it to the address of the *next* instruction. A loop at `0100H` ending with `JR NZ,LOOP` at `0108H`: the next instruction is at `010AH`, so the displacement is `0100H − 010AH = −10 = 0F6H`. You write the label; the assembler computes the number, and reports an error if the target is more than 127 bytes ahead or 128 behind.

## Little-endian operands

16-bit operands are stored low byte first, so `JP 0ABCDH` is `C3 CD AB`.

## What the assembler does

1. **Pass 1:** reads every line, works out how many bytes each instruction takes, and records each label's address.
2. **Pass 2:** now that all addresses are known, fills in the operands (including labels used before they were defined) and emits the bytes. It also produces the **listing** (address, bytes, source) and the **symbol table**.

Because an instruction's length does not depend on the value of its operand, the first pass can size everything without knowing forward labels.
''')

guide('syntax', 'Writing assembly: syntax and directives', 'L4', '📝', ['dirs', 'Bug Hunt'], 'Fields of a line, the Oshonsoft conventions, and every directive.', r'''
## Anatomy of a line

```
LABEL:   OPCODE  OPERAND1,OPERAND2    ; comment
loop:    ADD     A,[HL]               ; add a byte, then move on
```

- **Label** (optional): a name for the address of the line. End it with a colon. In Oshonsoft source a label may also be written *without* a colon when it stands in column 1 (`STACK .EQU 0FFFFH`).
- **Opcode / directive**: what to do.
- **Operands**: separated by commas. On the Z80 the **destination comes first**: `LD A,B` copies B into A.
- **Comment**: from a semicolon to the end of the line.

## Numbers and brackets

Hex ends with `H` and needs a leading 0 when it starts with A–F (`0FF20H`). Memory operands go in brackets: `(HL)` and `[HL]` mean the same. `LD A,(1234H)` loads the byte *stored at* 1234H, while `LD A,1234H` would be an immediate value (and fails because it does not fit in A).

> The lecture shows both forms, `LD B,[HL]` and `LD A,(1234H)`. This site accepts either. The real IDE's exact rules could not be checked here, so confirm in the lab if you are unsure.

## Directives

| Directive | Alias(es) | Meaning |
|---|---|---|
| `.ORG addr` | `ORG` | Place the following bytes starting at `addr`. |
| `name .EQU value` | `EQU`, `=` | Define a symbol. Generates no code. |
| `.DB v1,v2,...` | `DEFB`, `BYTE` | Define bytes. Strings are allowed: `.DB "Hi",0DH,0AH,0`. |
| `.DW v1,...` | `DEFW`, `WORD` | Define 16-bit words (low byte first). |
| `.DS n` | `DEFS`, `BLOCK` | Reserve `n` bytes (filled with 0). |
| `.END` | `END` | End of the source. |

The lecture notes that the Oshonsoft assembler wants a leading period on these (`.END` rather than `END`). The Oshonsoft help lists the directives both with and without it. Using the dotted form is safe either way.

`$` (or `PC`) means the address of the current line, so `LEN .EQU $-MSG` computes the length of a string defined at `MSG` just above it. Expressions may use `+ - * / %`, `& | ^ ~`, `<<` and `>>`, and parentheses.

## 68K versus Z80 pseudo-ops

| Meaning | 68000 | Z80 |
|---|---|---|
| Set origin | `ORG` | `ORG` |
| Equate | `EQU` | `EQU` |
| End of source | `END` | `END` |
| Define byte | `DC.B` | `DEFB` / `DB` |
| Define word | `DC.W` | `DEFW` / `DW` |
| Reserve bytes | `DS.B nn` | `DEFS nn` / `DS nn` |
| Reserve words | `DS.W nn` | none (use `DEFS 2*nn`) |
| String | `DC.B 'text'` | `DEFB "text"` |

## A complete program

```asm
        .ORG 0100H
TERM    .EQU 02H            ; output terminal port
START:  LD HL,MSG           ; HL points at the string
LOOP:   LD A,[HL]           ; get a character
        OR A                ; zero ends the string
        JR Z,DONE
        OUT (TERM),A        ; print it
        INC HL
        JR LOOP
DONE:   HALT
MSG:    .DB "Hi!",0
        .END
```

## Common mistakes

- **FFH instead of 0FFH:** read as an undefined label.
- **Source and destination swapped** from 68K habit.
- **Forgetting the brackets:** `LD A,HL` is an error, `LD A,(HL)` is a memory read.
- **Using JR for far targets:** JR reaches only about ±128 bytes; use `JP`.
- **Missing HALT** at the end: the CPU runs on into whatever bytes follow, usually data.
- **Unbalanced PUSH and POP** before RET.
''')
