# -*- coding: utf-8 -*-
import re
from g1 import G, guide
import g2  # registers guides

guide('memory', 'Memory, buses and address decoding', 'L6-7', '🧱', ['hw', 'Hardware Lab'], 'Z80 bus signals, tri-state buses, chip selects, decoding, endianness, SRAM vs DRAM.', r'''
## The Z80's pins that matter for memory

| Signal | Direction | Meaning |
|---|---|---|
| A0–A15 | out | 16-bit address bus (64 KB) |
| D0–D7 | in/out | 8-bit data bus |
| ~MREQ | out | the address is a **memory** address |
| ~IORQ | out | the address is an **I/O port** (or an interrupt acknowledge) |
| ~RD / ~WR | out | read or write strobe |
| ~M1 | out | this cycle is an opcode fetch |
| ~RFSH | out | refresh address is on A0–A6 (for DRAM) |
| ~WAIT | in | pull low to stretch the cycle for slow memory |
| ~INT / ~NMI | in | maskable / non-maskable interrupt |
| ~RESET, ~HALT, ~BUSRQ, ~BUSACK | | reset, halted indicator, bus request and acknowledge (for DMA) |
| CLK | in | the clock |

Bus timing is simple and synchronous: the CPU puts out an address, asserts ~MREQ and ~RD, and samples the data a clock cycle or two later. It does not wait for an acknowledgement; if the memory is too slow, the system asserts **~WAIT** and the CPU inserts extra clock cycles. An opcode fetch takes 4 T-states (the last two also drive the refresh address), a memory read or write 3, an I/O read or write 4.

## Sharing a bus: tri-state outputs

Many devices connect to one set of data lines. If two outputs drive opposite levels you get **bus contention** (a short circuit and an indeterminate level). Solutions:

- **Open-collector** outputs can only pull the line low; a pull-up resistor makes it high. Falling edges are fast, rising edges slow (RC time constant), which limits speed.
- **Tri-state** outputs have three states: 0, 1 and **Hi-Z** (disconnected). An **output enable (~OE)** switches the output onto the bus. This is how memories and registers share a bus.

## Chip control signals

- **~CS / ~CE (chip select or enable):** the master switch. If it is not asserted, the chip is off and its outputs are Hi-Z.
- **~OE (output enable):** puts data on the bus during **reads**.
- **~WE (write enable):** latches data from the bus during **writes**.

All are **active low**.

## Address space and pages

With n address lines a processor can address 2ⁿ bytes. The Z80's 16 lines give 64 KB. To build memory from chips, split the address:

- **Offset bits** (low address bits) go straight to the chip's address pins.
- **Page bits** (high address bits), plus ~MREQ, go to **decoder** logic that asserts exactly one chip select.

Example: 8 KB chips. 8 KB = 2¹³, so A0–A12 are offset bits and A13–A15 select one of 8 pages. A **74x138** 3-to-8 decoder with A13, A14, A15 on its inputs and ~MREQ on an enable gives:

| Output | A15 A14 A13 | Range |
|---|---|---|
| ~Y0 | 000 | 0000H–1FFFH (ROM: the Z80 starts here) |
| ~Y1 | 001 | 2000H–3FFFH |
| ~Y2 | 010 | 4000H–5FFFH |
| ~Y3 | 011 | 6000H–7FFFH |
| ~Y4 | 100 | 8000H–9FFFH |
| ~Y5 | 101 | 0A000H–0BFFFH |
| ~Y6 | 110 | 0C000H–0DFFFH |
| ~Y7 | 111 | 0E000H–0FFFFH |

The Z80 begins executing at 0000H, so ROM normally sits at the bottom of the map and RAM at the top (where the stack can start at FFFFH).

### Chip organisation does not change the chip count

Building 64 KB (16 address lines, 8-bit data) from 1-bit-wide chips always takes 8 chips; only the page structure changes:

| Chip | Pages | Page bits | Offset bits |
|---|---|---|---|
| 64K × 1 | 1 | none | A0–A15 |
| 32K × 2 | 2 | A15 | A0–A14 |
| 16K × 4 | 4 | A14–A15 | A0–A13 |
| 8K × 8 | 8 | A13–A15 | A0–A12 |

When page boundaries don't fall on hex digits, **write the addresses in binary**.

### Decoder tools

- A **74x138** (3:8 decoder) with three enables splits space into 8 regions. Add a second 138 and another address bit for 16 regions (the lecture's question).
- Gates (NAND/OR) can decode one page. A small **memory used as a lookup table** can decode many pages at once.

## Paging to extend the address space

A Z80 with 64 KB can reach 1 MB by writing a page number to a special register (or output port) that selects which of sixteen 64 KB chips is mapped in. Code at the top of each page switches pages and jumps. The 80x86 uses segment × 16 + offset in a similar spirit.

## I/O ports

IN and OUT use a separate 256-port address space, selected with ~IORQ instead of ~MREQ. The low address byte (A0–A7) carries the port number; the high byte carries A (for `IN A,(n)`) or B (for `IN r,(C)`). Devices can also be memory-mapped, with ordinary loads and stores.

## Endianness

Storing the word `0AA55H` at 1000H–1001H:

| Order | 1000H | 1001H | Used by |
|---|---|---|---|
| **Big-endian** | AA | 55 | MC68000 |
| **Little-endian** | 55 | AA | Z80, Intel x86 |

On an 8-bit bus like the Z80's there is no problem; it appears when the bus is wider.

## SRAM vs DRAM

| | SRAM | DRAM |
|---|---|---|
| Cell | Cross-coupled inverters, 6 transistors | 1 transistor + 1 capacitor |
| Speed | Fast, simple interface | Slower, complex interface |
| Refresh | None | Required (charge leaks) |
| Use | Caches, small fast memory | Bulk memory |

DRAM is addressed as rows and columns: the row address is clocked in with **~RAS**, then the column address with **~CAS**. A 64 Mbit DRAM has 8192 × 8192 cells (13 row + 13 column bits). Touching a row refreshes all its cells. In the lecture's example, refreshing 8192 rows every 16.384 ms needs a refresh cycle every 2 µs. The Z80 helps: register R is a 7-bit counter that increments on every opcode fetch, and ~RFSH puts it on the address bus so each fetch refreshes one DRAM row without extra software.

## Timing must match

The processor's read-cycle timing and the memory's read timing have to be compatible. Decoding logic eats into the cycle: one decoder's delay can cost tens of nanoseconds. The checklist: gather datasheets, extract timings, compute the worst-case arrival of address, ~OE and ~CE for a read, work out when the CPU samples the data, compare with the memory's needs. If it fails, add **wait states** or choose faster memory. Also allow for temperature, process and board trace variation.
''')

# --- transistor guide: reuse the audited 68K text verbatim (it is processor independent)
import os
HERE = os.path.dirname(os.path.abspath(__file__))
tmd = open(os.path.join(HERE, 'transistor.md'), encoding='utf8').read()

guide('transistor', 'Transistors as switches', 'L8', '💡', ['io', 'Hardware Lab'], 'Driving real loads from an I/O pin: the base resistor, saturation, worst case.', tmd)

guide('oshonsoft', 'Using the Oshonsoft Z80 Simulator IDE', 'L4-5', '🛠️', ['sim', 'Quiz Blitz'], 'The lab tool: assemble, load, run, step, ports and terminals; how this sandbox differs.', r'''
The course uses the **Oshonsoft Z80 Simulator IDE** (oshonsoft.com/z80.html), a Windows program with an assembler, disassembler, BASIC compiler, debugger and simulator. The lecture says the trial version works long enough to finish lab 2; Oshonsoft says a license is required after the evaluation period. This site's sandbox is a study aid built from the IDE's published help pages: it is **not** a copy of the IDE and was not compared against it.

## Workflow in the IDE

1. Write the program in the assembler window (**Tools > Assembler**; default extension ASM) or open a `.asm` file.
2. **Tools > Assemble** produces a listing (`.lst`) and a binary image (`.obj`); with *Generate HEX File Also* it writes Intel HEX too. Fix any errors first.
3. **Tools > Load** (or **File > Load Program**) puts the object code into the simulated 64 KB memory. An OBJ image is loaded from an offset address (default 0000H); HEX files carry their own addresses.
4. **Simulation > Start** begins executing at the **starting address, default 0000H** (Options > Change Starting Address). All 64 KB of memory begins filled with NOPs (00H), so a program assembled with `.ORG 0100H` will run 256 NOPs before it reaches your code unless you change the starting address or begin the program with a jump.
5. The **Rate** menu: *Step By Step* (a STEP item appears; **F2** executes the next instruction and you can edit registers), *Slow* (1500 ms per instruction), *Normal* (250 ms), *Fast* (about 50 ms), *Extremely Fast*, and *Ultimate* (the window is refreshed only occasionally). You can change the rate while the simulation runs.
6. The **Fast Debugger / Breakpoints Manager** lists the program; click a line to set a breakpoint (a red circle). Reaching one switches to Step By Step.
7. **Simulation > Stop** reports the number of instructions, the duration in clock cycles and the real-time duration (default clock 4 MHz).

Useful options: *HALT Stops Simulation* (if off, HALT repeats like the real chip until an interrupt), *Enable Logging* (`LOG.TXT`), *Enable IN/OUT Instructions Logging* (`IO.TXT`), *Prompt For Value Before IN Instruction*, *Enable Unofficial Instructions*, *FF Power On Defaults* (registers start at 00H or FFH).

## Ports, terminals and interrupts

- **Peripheral Devices:** up to four basic I/O devices plus an output terminal that shows the ASCII characters sent to a port. Bytes sent by `OUT` are shown bit by bit; an input device's value can be typed or set bit by bit. The Getting Started examples use an input device on port `01H` and an output on port `02H`. The **I/O Ports Editor** exposes all 256 ports.
- **Prompt For Value Before IN** (on): the program asks you for every incoming byte on every port, as a hex value `00`–`FF` (a Keyboard button gives the ASCII code of a key). Off: the value comes from the Peripheral Devices or I/O Ports Editor window.
- **Interrupts:** NMI and all three INT modes are simulated, triggered by the NMI and INT buttons; **RESET** resets the simulation. NMI jumps to 0066H. Mode 0 asks you for the RST instruction the device supplies; mode 1 jumps to 0038H; mode 2 asks for the 8-bit vector and combines it with register I.
- Also in the IDE: Input/Output Terminal (a serial-style terminal on ports or memory-mapped), Video Memory Screen, Simulation Log Viewer, Interactive Assembler Editor, Watch Variables, External Modules, a ZX Spectrum ROM interface, and an external TASM assembler interface.

## What the sandbox does the same

- Accepts the IDE's source conventions: directives with or without a period (`ORG EQU INCLUDE DB/DEFB/BYTE DW/DEFW/WORD DS/DEFS/BLOCK END`, `=` for EQU), labels with or without colons, `[HL]` or `(HL)`, every number format in the help, the `high`/`low`/`highw`/`loww` and `<` `>` prefixes, `$` or `PC` for the current address, `+ - * / \ & | ^ << >>`, and the help page's own test example (checked by `tests/oshonsoft-expr.js`).
- Starts at 0000H by default with memory filled with NOPs, a Starting address box, step by step, rates, breakpoints, HALT option, prompt-before-IN option, INT/NMI buttons (INT asks for the vector byte in modes 0 and 2), a terminal on port 02H, an input device on port 01H, and registers at 0 on power-up.
- Simulates every documented instruction and the common undocumented ones with exact T-states, and shows time at the IDE's default 4 MHz.

## What it does not do

- No BASIC compiler, disassembler window, interactive assembler editor, watch variables, video screen, serial terminals with status registers, ZX Spectrum interface, external modules or TASM interface.
- No `INCLUDE` (a browser cannot read other files) and no `.obj`/`.hex` loading from disk; it assembles into memory directly. It can download `.asm`, `.lst` and Intel-HEX files.
- It always simulates unofficial instructions (the IDE has an option).
- Label case: the sandbox treats `Loop` and `LOOP` as the same label. The IDE's rule was not found in its help pages.

## Example from the IDE's Getting Started page

The IDE ships `memfill.asm`: it fills FF00H–FFFFH with FFH down to 00H using `LD A,0FFH`, `LD BC,0FF00H`, a loop that ends with `JP NZ`, and `HALT`. Try writing your own version in the sandbox and compare the Memory view.
''')

guide('vs68k', '68000 vs Z80 side by side', 'L3-5', '🆚', ['m68', 'Quiz Blitz'], 'The same ideas in two machines: registers, notation, instructions, memory.', r'''
| | 68000 | Z80 |
|---|---|---|
| Word size | 8/16/32-bit instructions, 32-bit registers | 8-bit, with 16-bit register pairs |
| Data registers | D0–D7 (32 bits) | A (accumulator), B, C, D, E, H, L |
| Address registers | A0–A7 (A7 = stack pointer) | HL (main pointer), BC, DE, IX, IY; SP separate |
| Flags | X N Z V C in the CCR | S Z H P/V N C in F |
| Address bus | 24 bits (16 MB) | 16 bits (64 KB) |
| Data bus | 16 bits | 8 bits |
| Endianness | big | little |
| Operand order | source, destination | destination, source |
| Instruction size | 2 to 10 bytes | 1 to 4 bytes |
| Privilege | user / supervisor modes | one level |
| I/O | memory-mapped only | memory-mapped **and** IN/OUT ports |
| Interrupts | vectored (exception table) | IM 0/1/2, NMI at 0066H |
| Conditional call / return | none | `CALL cc`, `RET cc` |
| Bus operation | more complicated | very simple to follow |

## Instructions that correspond

| Idea | 68000 | Z80 |
|---|---|---|
| Copy a byte register to register | `MOVE.B D0,D1` | `LD B,A` |
| Copy through a pointer | `MOVE.B (A0),D1` | `LD B,[HL]` |
| Immediate into register | `MOVE.B #$55,D1` | `LD C,55H` |
| Register to absolute address | `MOVE.B D0,$0000FF35` | `LD [0FF20H],A` (only A) |
| 16-bit absolute | `MOVE.W D0,$0000FF36` | `LD [0FF20H],HL` |
| Compare | `CMP.B D0,D1` | `CP D` (A − D) |
| Branch if zero | `BEQ label` | `JR Z,label` |
| Jump | `JMP $0000ABCD` | `JP 0ABCDH` |
| Subroutine | `JSR` / `BSR` and `RTS` | `CALL` and `RET` |
| Return from interrupt | `RTE` | `RETI` / `RETN` |
| Loop counter | `DBRA Dn,label` | `DJNZ label` |
| Block copy | a loop with `MOVE.B (A0)+,(A1)+` | `LDIR` |
| Add immediate | `ADDI.B #5,D0` | `ADD A,5` |

## Reading the same program twice

Sum five bytes:

```
68000                          Z80
      MOVE.B #5,D0                   LD B,5
      LEA Table,A0                   LD HL,TABLE
      CLR.W D1                       XOR A
Loop  ADD.B (A0)+,D1           LOOP: ADD A,[HL]
      SUBQ.B #1,D0                   INC HL
      BNE Loop                       DJNZ LOOP
```

The 68K pointer auto-increments; the Z80 needs `INC HL`. The 68K counts with SUBQ and BNE; the Z80 has the single `DJNZ`. The Z80 accumulates in A; the 68K uses any data register.
''')

guide('errata', 'Slide notes and Oshonsoft quirks', 'L3-8', '⚠️', ['dirs', 'Bug Hunt'], 'Places where the slides simplify or disagree with the Z80 manual or the Oshonsoft help.', r'''
These are things to be aware of when studying the Z80 slides. Each was checked against the Zilog Z80 CPU User Manual (UM0080) or the Oshonsoft help pages. The slides are a teaching summary, so most of these are simplifications, not mistakes.

| Where | What the slide says | What the manual / help says |
|---|---|---|
| L3 (programmer's model) | "Single instruction swaps Main and Alternate register sets"; `EXX ; Exchange all registers` | `EXX` swaps only BC, DE, HL with BC', DE', HL'. A and F are swapped by the separate `EX AF,AF'`. |
| L4 (pseudo-opcodes table) | Z80 string directive shown as `DEFII 's'` | There is no DEFII. Use `DEFB "text"` / `.DB "text"` (Oshonsoft accepts strings in DB and DW). |
| L4 (pseudo-opcodes note) | "The Z80 assembler from Oshonsoft requires that the pseudo-op codes have a period in front: END >> .END" | The Oshonsoft help lists `ORG, EQU, INCLUDE, DB (DEFB), DW (DEFW), DS (DEFS), END` and says they "can also take a dot prefix". The dotted form always works. |
| L5 (absolute addressing) | "Only register A can be used with absolute addressing" and "some architectures do not support absolute addressing (Z80, sort of)" | True for 8-bit data. For 16-bit data `LD HL,(nn)` / `LD (nn),HL` (and BC, DE, SP, IX, IY) are also absolute, and `JP nn` / `CALL nn` use 16-bit absolute addresses. |
| L5 (conditional jumps) | Lists `cc` as NZ, Z, NC, C, P, M | `JP cc`, `CALL cc` and `RET cc` also accept PO and PE (parity/overflow). `JR cc` accepts only NZ, Z, NC, C. |
| L5 (relative jumps) | `JR nn ; nn is 8-bits` | The assembler takes a label or address and computes the signed 8-bit offset from the next instruction. |
| L4-L5 (brackets) | Examples switch between `LD A,(1234H)` (data-book style) and `LD B,[HL]` / `LD [0FF20H],A` (Oshonsoft style: "notice the types of parentheses used by each assembler"), then say "the parentheses are required" | Zilog's manual uses round parentheses. The Oshonsoft help page does not define the bracket syntax; this site accepts both. Check the IDE if in doubt. |

## Oshonsoft help versus Getting Started

- The Getting Started page says Example 3 loads `memfill2.obj` where it means `bin2bcd.obj`, and names `bin2bcd2.lst` for `bin2bcd.lst`. Typos on that page; the programs themselves are fine.
- The help lists several numeric formats (`0xnn`, `$nn`, `&hnn`, `H'nn'`...). The lecture only uses the `H`-suffix style.

## Things this site does differently (known, intentional)

- Treats labels case-insensitively (the IDE's help does not say).
- Always simulates unofficial instructions, and cannot `INCLUDE` other files.
- Reports an error for an undefined symbol or an out-of-range value; the real assembler's wording differs.
- Also accepts `%` as a modulo operator (the IDE's help lists `+ - * / \`).
''')

