/* Written guides and glossary for Z80 Quest. Content follows BEE 425 Lessons 3-8, the Zilog Z80 CPU User Manual (UM0080)
   and the Oshonsoft Z80 help pages; each guide notes its source. GENERATED from tests/guides-src (see README); edit the sources.
   Authoring format is a tiny markdown subset rendered by QUEST_GUIDES.render(). */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').split(/(<code>.*?<\/code>)/).map((seg, i) => (i % 2 ? seg : seg.replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>'))).join('');
  function render(md) {
    const lines = md.replace(/\r/g, '').split('\n'); const out = [];
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (/^```/.test(l)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(`<pre class="code">${esc(buf.join('\n'))}</pre>`); continue; }
      if (/^### /.test(l)) { out.push(`<h3>${inline(l.slice(4))}</h3>`); i++; continue; }
      if (/^## /.test(l)) { out.push(`<h2>${inline(l.slice(3))}</h2>`); i++; continue; }
      if (/^> /.test(l)) { const buf = []; while (i < lines.length && /^> /.test(lines[i])) buf.push(lines[i++].slice(2)); out.push(`<aside class="callout">${inline(buf.join(' '))}</aside>`); continue; }
      if (/^\|/.test(l)) {
        const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(rows[0]), body = rows.slice(/^\|[\s:|-]+\|?$/.test(rows[1] || '') ? 2 : 1).map(cells);
        out.push(`<div class="tablewrap"><table class="gt"><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^- /.test(l)) { const buf = []; while (i < lines.length && /^- /.test(lines[i])) buf.push(lines[i++].slice(2)); out.push(`<ul>${buf.map((b) => `<li>${inline(b)}</li>`).join('')}</ul>`); continue; }
      if (/^\d+\. /.test(l)) { const buf = []; while (i < lines.length && /^\d+\. /.test(lines[i])) buf.push(lines[i++].replace(/^\d+\. /, '')); out.push(`<ol>${buf.map((b) => `<li>${inline(b)}</li>`).join('')}</ol>`); continue; }
      if (!l.trim()) { i++; continue; }
      const buf = []; while (i < lines.length && lines[i].trim() && !/^(```|## |### |> |\||- |\d+\. )/.test(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join(' '))}</p>`);
    }
    return out.join('\n');
  }

  const GUIDES = [
    { id: "cpu", title: "How a processor runs a program", lesson: "L3", icon: "🧠", practice: ["cpu", "Register Tracer"], summary: "Fetch, decode, execute, and the blocks inside the CPU.", md: `A microprocessor is a machine that repeats one cycle forever: **fetch** an instruction from memory, **decode** it, **execute** it. Everything else (registers, ALU, buses) exists to make that cycle work.

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

Take \`ADD A,(HL)\` (add the byte in memory at the address in HL to the accumulator). It takes 7 clock cycles (T-states):

1. The PC value goes on the address bus; the **opcode** \`86H\` is read from memory into the instruction register (4 T-states, the M1 cycle).
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
| Memory access | Operations may read memory directly (\`ADD A,(HL)\`) | Only load and store touch memory; ALU works on registers |
| Memory model | von Neumann (one memory for code and data) | Often Harvard (separate code and data memories) |
` },

    { id: "numbers", title: "Numbers, hex and two's complement", lesson: "L3", icon: "🔢", practice: ["num", "Number Ninja"], summary: "Hex and binary notation, negative numbers, flags after arithmetic, and little-endian storage.", md: `## Writing numbers in Z80 assembly

| Base | Z80 (Zilog style) | Also accepted by Oshonsoft | 68K | C |
|---|---|---|---|---|
| Hexadecimal | \`0AF56H\` (leading 0 if it starts with A–F) | \`0xAF56\`, \`$AF56\`, \`&HAF56\`, \`H'AF56'\` | \`$AF56\` | \`0xAF56\` |
| Binary | \`10101100B\` | \`%10101100\`, \`0b10101100\`, \`B'10101100'\` | \`%10101100\` | \`0b10101100\` |
| Decimal | \`25\` | \`.25\`, \`D'25'\` | \`25\` | \`25\` |
| Character | \`'A'\` | \`"A"\`, \`A'A'\` | \`'A'\` | \`'A'\` |

The leading 0 matters: \`FFH\` would be read as a label called FFH, and the assembler would complain that it is undefined. Write \`0FFH\`.

## Two's complement

All subtraction becomes addition of a negative number. To negate a byte: **complement every bit, then add 1**.

\`\`\`
5EH = 0101 1110
complement = 1010 0001
+ 1        = 1010 0010 = 0A2H   (this is -5EH, that is -94)
\`\`\`

For n bits the range is −2ⁿ⁻¹ to +2ⁿ⁻¹−1: a byte is −128 to +127, a 16-bit value −32,768 to +32,767. Zero counts as positive, so there is one more negative number than positive ones. The same bit pattern can mean 255 or −1: **the CPU does not know; the programmer decides** (and picks the matching flag to test).

## Flags after arithmetic

| Instruction | A before, operand | A after | S | Z | H | P/V | N | C |
|---|---|---|---|---|---|---|---|---|
| \`ADD A,B\` | 7FH + 01H | 80H | 1 | 0 | 1 | **1** | 0 | 0 |
| \`ADD A,B\` | 0FFH + 01H | 00H | 0 | 1 | 1 | 0 | 0 | **1** |
| \`ADD A,B\` | 80H + 80H | 00H | 0 | 1 | 0 | **1** | 0 | **1** |
| \`ADD A,B\` | 0FH + 01H | 10H | 0 | 0 | **1** | 0 | 0 | 0 |
| \`SUB B\` | 01H − 02H | 0FFH | 1 | 0 | 1 | 0 | 1 | **1** |
| \`SUB B\` | 80H − 01H | 7FH | 0 | 0 | 1 | **1** | 1 | 0 |
| \`CP B\` | 05H, 05H | 05H | 0 | **1** | 0 | 0 | 1 | 0 |
| \`CP B\` | 03H, 09H | 03H | 1 | 0 | 1 | 0 | 1 | **1** |

(Every row was produced by running the instruction on this site's CPU core.) Reading it:

- **C (carry)** is the *unsigned* warning: the result did not fit in 8 bits (add) or a borrow was needed (subtract).
- **P/V (overflow)** is the *signed* warning: two positives gave a negative (7FH + 01H = 80H) or two negatives gave a positive (80H + 80H).
- **Z** says the result is zero. **S** copies bit 7. **H** is the carry from bit 3 into bit 4, used by DAA. **N** is 1 after a subtraction.

## Parity

After logic instructions (AND, OR, XOR) and rotates/shifts, **P/V holds parity**: 1 if the result has an *even* number of 1 bits. \`XOR A\` leaves A = 00H, which has zero (an even number of) 1 bits, so P/V = 1. Conditions \`PE\` (parity even) and \`PO\` (parity odd) test it.

## Decimal arithmetic: BCD and DAA

Packed BCD stores one decimal digit per nibble: 47 decimal is \`47H\`. Adding in binary breaks this (47H + 38H = 7FH), so **DAA** (decimal adjust) corrects the sum using H, C and N: \`LD A,47H\` / \`ADD A,38H\` / \`DAA\` leaves A = 85H, which reads as decimal 85.

## Characters

ASCII codes: \`'0'\`–\`'9'\` are 30H–39H, \`'A'\` is 41H, \`'a'\` is 61H, CR is 0DH, LF is 0AH. Adding \`'0'\` (30H) to a digit value 0–9 makes the character.

## Little-endian storage

The Z80 stores a 16-bit value with the **low byte at the lower address**. \`LD (1234H),HL\` with HL = 0ABCDH stores \`CDH\` at 1234H and \`ABH\` at 1235H. Immediate values in instructions follow the same rule: \`LD DE,0A34BH\` assembles to \`11 4B A3\`. The 68000 is the opposite (big-endian).
` },

    { id: "model", title: "The Z80 programmer's model", lesson: "L3", icon: "🗂️", practice: ["cpu", "Flag Flipper"], summary: "Registers, flags, the alternate set, IX/IY, I and R.", md: `## Registers

| Register | Size | Role |
|---|---|---|
| A | 8 | **Accumulator.** One operand and the destination of 8-bit arithmetic and logic. |
| F | 8 | **Flags** (S Z H P/V N C). Not loaded directly; PUSH AF / POP AF move it. |
| B, C, D, E, H, L | 8 | General purpose. Pairs **BC, DE, HL** form 16-bit registers. |
| A', F', B', C', D', E', H', L' | 8 | **Alternate set**, swapped in by \`EX AF,AF'\` and \`EXX\`. |
| IX, IY | 16 | **Index registers**: base address plus a signed displacement, \`(IX+d)\`. |
| SP | 16 | **Stack pointer.** Grows toward lower addresses. |
| PC | 16 | **Program counter.** |
| I | 8 | **Interrupt vector** high byte (interrupt mode 2). |
| R | 8 | **Memory refresh** counter; increments on every instruction fetch. |

Examples from the lecture: \`LD E,55H\` (hex number into E), \`LD C,L\` (copy L into C), \`LD B,(HL)\` (memory addressed by HL into B), \`ADD A,D\`, \`AND B\`, \`PUSH BC\`, \`CALL 2000H\`, \`LD (IX+d),L\`.

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
| \`ADD ADC SUB SBC CP NEG\` | all six |
| \`AND\` | S Z P(parity); H = 1; N = 0; C = 0 |
| \`OR XOR\` | S Z P(parity); H = 0; N = 0; C = 0 |
| \`INC r\` / \`DEC r\` | S Z H P/V N; **C is unchanged** |
| \`INC rr\` / \`DEC rr\` / \`LD\` / \`PUSH\` / \`POP\` (not AF) / \`JP\` / \`CALL\` / \`RET\` | none |
| \`ADD HL,rr\` | H, N and C only (S, Z and P/V unchanged) |
| \`RLCA RRCA RLA RRA\` | C, H = 0, N = 0 |
| \`RLC RRC RL RR SLA SRA SRL\` | S Z P(parity) C; H = 0, N = 0 |
| \`BIT\` | Z (inverse of the bit), H = 1, N = 0 |
| \`SET RES EX EXX\` | none |

## The alternate register set

\`EX AF,AF'\` swaps AF with AF'. \`EXX\` swaps **BC, DE and HL** with BC', DE' and HL' (it does not touch A or F). Together they save and restore a whole working set in two instructions, which is why interrupt routines use them.

> The slides say a "single instruction swaps main and alternate register sets". Strictly it takes two: \`EXX\` for BC/DE/HL and \`EX AF,AF'\` for the accumulator and flags.

## Index registers

IX and IY hold a base address; instructions add a signed 8-bit displacement: \`LD A,(IX+5)\`, \`LD (IY-2),B\`, \`INC (IX+0)\`. The index register is unchanged. Use them for tables of records: point IX at a record and \`(IX+d)\` picks a field. Under the hood the instruction gets a prefix byte (\`DDH\` for IX, \`FDH\` for IY) in front of the HL form, which is why indexed instructions are longer and slower.

## After RESET

PC = 0000H, I = 00H, R = 00H, interrupts disabled, interrupt mode 0. All other registers are undefined. Execution begins at address 0000H.

## Undocumented parts

The halves of the index registers (IXH, IXL, IYH, IYL), \`SLL\`, and \`OUT (C),0\` work on real chips but are not in the official manual. This site's assembler and CPU support them, as does the Oshonsoft simulator ("support for unofficial instructions").
` },

    { id: "machine-code", title: "From assembly to machine code", lesson: "L4-5", icon: "🧬", practice: ["num", "Number Ninja"], summary: "Opcodes, prefixes, operands and how the assembler builds the bytes.", md: `An assembly instruction becomes **1 to 4 bytes** in memory. The first byte is the **opcode** (unlike the 68K, whose instructions start with a 16-bit opcode word). Operands follow: constants, addresses (low byte first), or displacements.

## Register-to-register LD has a pattern

\`LD r,r'\` is the bit pattern \`01 ddd sss\`, where \`ddd\` is the destination and \`sss\` the source register:

| Code | 000 | 001 | 010 | 011 | 100 | 101 | 110 | 111 |
|---|---|---|---|---|---|---|---|---|
| Register | B | C | D | E | H | L | (HL) | A |

So \`LD A,B\` is \`01 111 000\` = \`78H\`, \`LD B,A\` is \`01 000 111\` = \`47H\`, and \`LD A,(HL)\` is \`01 111 110\` = \`7EH\`. The pattern \`01 110 110\` would be \`LD (HL),(HL)\` and is used for **HALT** (\`76H\`).

The ALU group works the same way: \`10 ooo sss\` where \`ooo\` = ADD, ADC, SUB, SBC, AND, XOR, OR, CP. So \`ADD A,B\` is \`80H\` and \`XOR A\` is \`0AFH\`.

## Examples (assembled and checked on this site)

| Instruction | Bytes | Length | T-states |
|---|---|---|---|
| \`NOP\` | \`00\` | 1 | 4 |
| \`LD B,C\` | \`41\` | 1 | 4 |
| \`LD A,5\` | \`3E 05\` | 2 | 7 |
| \`ADD A,5\` | \`C6 05\` | 2 | 7 |
| \`LD HL,1234H\` | \`21 34 12\` | 3 | 10 |
| \`LD A,(1234H)\` | \`3A 34 12\` | 3 | 13 |
| \`JP 1234H\` | \`C3 34 12\` | 3 | 10 |
| \`LD A,(IX+5)\` | \`DD 7E 05\` | 3 | 19 |
| \`LD IX,1234H\` | \`DD 21 34 12\` | 4 | 14 |
| \`LD (IX+5),7\` | \`DD 36 05 07\` | 4 | 19 |

The lecture example: \`ADD A,22H\` is \`C6 22\`; with A = 33H the result is 55H.

## Prefix bytes

Most opcodes fit in one byte. Four **prefix bytes** open extra pages of instructions:

| Prefix | Page |
|---|---|
| \`CBH\` | Rotates, shifts, \`BIT\`, \`SET\`, \`RES\` (\`BIT 3,B\` = \`CB 58\`) |
| \`EDH\` | Extended: block moves (\`LDIR\` = \`ED B0\`), 16-bit \`ADC\`/\`SBC\`, \`NEG\`, \`IM\`, \`IN r,(C)\`, \`OUT (C),r\`, \`RETI\`... |
| \`DDH\` | Same instruction but with **IX** in place of HL (\`LD A,(IX+5)\` = \`DD 7E 05\`) |
| \`FDH\` | Same instruction but with **IY** in place of HL |

Each prefix costs 4 extra T-states, which is why \`LD A,(HL)\` takes 7 and \`LD A,(IX+5)\` takes 19.

## Relative jumps

\`JR\` and \`DJNZ\` are two bytes: the opcode and a **signed displacement**. The CPU adds it to the address of the *next* instruction. A loop at \`0100H\` ending with \`JR NZ,LOOP\` at \`0108H\`: the next instruction is at \`010AH\`, so the displacement is \`0100H − 010AH = −10 = 0F6H\`. You write the label; the assembler computes the number, and reports an error if the target is more than 127 bytes ahead or 128 behind.

## Little-endian operands

16-bit operands are stored low byte first, so \`JP 0ABCDH\` is \`C3 CD AB\`.

## What the assembler does

1. **Pass 1:** reads every line, works out how many bytes each instruction takes, and records each label's address.
2. **Pass 2:** now that all addresses are known, fills in the operands (including labels used before they were defined) and emits the bytes. It also produces the **listing** (address, bytes, source) and the **symbol table**.

Because an instruction's length does not depend on the value of its operand, the first pass can size everything without knowing forward labels.
` },

    { id: "syntax", title: "Writing assembly: syntax and directives", lesson: "L4", icon: "📝", practice: ["dirs", "Bug Hunt"], summary: "Fields of a line, the Oshonsoft conventions, and every directive.", md: `## Anatomy of a line

\`\`\`
LABEL:   OPCODE  OPERAND1,OPERAND2    ; comment
loop:    ADD     A,[HL]               ; add a byte, then move on
\`\`\`

- **Label** (optional): a name for the address of the line. End it with a colon. In Oshonsoft source a label may also be written *without* a colon when it stands in column 1 (\`STACK .EQU 0FFFFH\`).
- **Opcode / directive**: what to do.
- **Operands**: separated by commas. On the Z80 the **destination comes first**: \`LD A,B\` copies B into A.
- **Comment**: from a semicolon to the end of the line.

## Numbers and brackets

Hex ends with \`H\` and needs a leading 0 when it starts with A–F (\`0FF20H\`). Memory operands go in brackets: \`(HL)\` and \`[HL]\` mean the same. \`LD A,(1234H)\` loads the byte *stored at* 1234H, while \`LD A,1234H\` would be an immediate value (and fails because it does not fit in A).

> The lecture shows both forms, \`LD B,[HL]\` and \`LD A,(1234H)\`. This site accepts either. The real IDE's exact rules could not be checked here, so confirm in the lab if you are unsure.

## Directives

| Directive | Alias(es) | Meaning |
|---|---|---|
| \`.ORG addr\` | \`ORG\` | Place the following bytes starting at \`addr\`. |
| \`name .EQU value\` | \`EQU\`, \`=\` | Define a symbol. Generates no code. |
| \`.DB v1,v2,...\` | \`DEFB\`, \`BYTE\` | Define bytes. Strings are allowed: \`.DB "Hi",0DH,0AH,0\`. |
| \`.DW v1,...\` | \`DEFW\`, \`WORD\` | Define 16-bit words (low byte first). |
| \`.DS n\` | \`DEFS\`, \`BLOCK\` | Reserve \`n\` bytes (filled with 0). |
| \`.END\` | \`END\` | End of the source. |

The lecture notes that the Oshonsoft assembler wants a leading period on these (\`.END\` rather than \`END\`). The Oshonsoft help lists the directives both with and without it. Using the dotted form is safe either way.

\`$\` (or \`PC\`) means the address of the current line, so \`LEN .EQU $-MSG\` computes the length of a string defined at \`MSG\` just above it. Expressions may use \`+ - * / %\`, \`& | ^ ~\`, \`<<\` and \`>>\`, and parentheses.

## 68K versus Z80 pseudo-ops

| Meaning | 68000 | Z80 |
|---|---|---|
| Set origin | \`ORG\` | \`ORG\` |
| Equate | \`EQU\` | \`EQU\` |
| End of source | \`END\` | \`END\` |
| Define byte | \`DC.B\` | \`DEFB\` / \`DB\` |
| Define word | \`DC.W\` | \`DEFW\` / \`DW\` |
| Reserve bytes | \`DS.B nn\` | \`DEFS nn\` / \`DS nn\` |
| Reserve words | \`DS.W nn\` | none (use \`DEFS 2*nn\`) |
| String | \`DC.B 'text'\` | \`DEFB "text"\` |

## A complete program

\`\`\`asm
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
\`\`\`

## Common mistakes

- **FFH instead of 0FFH:** read as an undefined label.
- **Source and destination swapped** from 68K habit.
- **Forgetting the brackets:** \`LD A,HL\` is an error, \`LD A,(HL)\` is a memory read.
- **Using JR for far targets:** JR reaches only about ±128 bytes; use \`JP\`.
- **Missing HALT** at the end: the CPU runs on into whatever bytes follow, usually data.
- **Unbalanced PUSH and POP** before RET.
` },

    { id: "instructions", title: "Instruction reference", lesson: "L4-5", icon: "⚙️", practice: ["inst", "Register Tracer"], summary: "The Z80 instruction groups with bytes, T-states and flag effects.", md: `Times are in T-states (clock cycles) and were measured on this site's CPU core, which matches the SingleStepTests hardware-derived vectors. **Destination first.** \`r\` is a register, \`n\` an 8-bit constant, \`nn\` a 16-bit constant or address, \`d\` a signed displacement.

## Load and exchange

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| \`LD r,r'\` | copy a register (\`LD B,C\`) | 1 | 4 |
| \`LD r,n\` | register ← constant | 2 | 7 |
| \`LD r,(HL)\` / \`LD (HL),r\` | memory ↔ register through HL | 1 | 7 |
| \`LD (HL),n\` | store a constant | 2 | 10 |
| \`LD A,(BC)\` \`LD A,(DE)\` and the reverse | A ↔ memory at BC/DE | 1 | 7 |
| \`LD A,(nn)\` / \`LD (nn),A\` | A ↔ absolute address | 3 | 13 |
| \`LD rr,nn\` | 16-bit constant into BC/DE/HL/SP | 3 | 10 |
| \`LD HL,(nn)\` / \`LD (nn),HL\` | 16-bit memory transfer (little-endian) | 3 | 16 |
| \`LD SP,HL\` | set the stack pointer | 1 | 6 |
| \`LD r,(IX+d)\` / \`LD (IX+d),r\` | indexed access | 3 | 19 |
| \`LD (IX+d),n\` | store a constant, indexed | 4 | 19 |
| \`LD IX,nn\` | load an index register | 4 | 14 |
| \`PUSH rr\` / \`POP rr\` | stack (BC, DE, HL, AF, IX, IY) | 1 | 11 / 10 |
| \`EX DE,HL\` | swap DE and HL | 1 | 4 |
| \`EX AF,AF'\` / \`EXX\` | swap register sets | 1 | 4 |
| \`EX (SP),HL\` | swap HL with the top of the stack | 1 | 19 |

There is no \`LD\` between two memory locations, and no \`LD rr,rr'\`.

## 8-bit arithmetic and logic (accumulator A)

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| \`ADD A,r\` / \`ADD A,n\` / \`ADD A,(HL)\` | A ← A + operand | 1 / 2 / 1 | 4 / 7 / 7 |
| \`ADC A,x\` | A ← A + operand + carry | | |
| \`SUB x\` / \`SBC A,x\` | A ← A − operand (− carry) | | |
| \`AND x\` \`OR x\` \`XOR x\` | bitwise logic | | |
| \`CP x\` | A − operand, flags only | 1 / 2 | 4 / 7 |
| \`INC r\` / \`DEC r\` | add / subtract 1 (carry unchanged) | 1 | 4 |
| \`INC (HL)\` / \`DEC (HL)\` | in memory | 1 | 11 |
| \`NEG\` | A ← 0 − A | 2 | 8 |
| \`CPL\` | complement A | 1 | 4 |
| \`DAA\` | decimal adjust after BCD add/subtract | 1 | 4 |
| \`SCF\` / \`CCF\` | set / complement the carry flag | 1 | 4 |

\`XOR A\` and \`OR A\` are the classic one-byte idioms: \`XOR A\` sets A = 0; \`OR A\` clears the carry and tests A for zero without changing it.

## 16-bit arithmetic

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| \`ADD HL,rr\` | HL ← HL + BC/DE/HL/SP | 1 | 11 |
| \`ADD IX,rr\` | with IX (rr = BC, DE, IX, SP) | 2 | 15 |
| \`ADC HL,rr\` / \`SBC HL,rr\` | with carry; all flags updated | 2 | 15 |
| \`INC rr\` / \`DEC rr\` | no flags change | 1 | 6 |

There is **no 16-bit SUB**: write \`OR A\` (clear carry) then \`SBC HL,DE\`.

## Rotates, shifts and bit instructions

| Instruction | Effect | T |
|---|---|---|
| \`RLCA RRCA RLA RRA\` | rotate A (RLCA/RRCA: 8-bit; RLA/RRA: through carry) | 4 |
| \`RLC r  RRC r  RL r  RR r\` | the same on any register | 8 |
| \`SLA r\` | shift left, 0 into bit 0, bit 7 to carry | 8 |
| \`SRA r\` | shift right, sign bit kept | 8 |
| \`SRL r\` | shift right, 0 into bit 7 | 8 |
| \`BIT b,r\` | test bit b: Z = 1 when the bit is 0 | 8 (\`(HL)\`: 12) |
| \`SET b,r\` / \`RES b,r\` | set / clear bit b | 8 (\`(HL)\`: 15) |
| \`RLD\` / \`RRD\` | rotate BCD digits between A and (HL) | 18 |

On \`(HL)\` the rotates take 15 T-states, indexed forms 23.

## Jumps, calls and returns

| Instruction | Effect | Bytes | T |
|---|---|---|---|
| \`JP nn\` | absolute jump | 3 | 10 |
| \`JP cc,nn\` | conditional (8 conditions) | 3 | 10 |
| \`JP (HL)\` | jump to the address in HL | 1 | 4 |
| \`JR e\` / \`JR cc,e\` | relative (cc: NZ, Z, NC, C) | 2 | 12 / 12 taken, 7 not |
| \`DJNZ e\` | B ← B − 1, jump if not zero | 2 | 13 taken, 8 not |
| \`CALL nn\` / \`CALL cc,nn\` | push PC, jump | 3 | 17 / 17 taken, 10 not |
| \`RET\` / \`RET cc\` | pop PC | 1 | 10 / 11 taken, 5 not |
| \`RETI\` / \`RETN\` | return from interrupt | 2 | 14 |
| \`RST p\` | one-byte call to 00H, 08H, ... 38H | 1 | 11 |

## Block instructions

| Instruction | Effect | T |
|---|---|---|
| \`LDI\` / \`LDD\` | (DE) ← (HL); HL, DE ±1; BC − 1 | 16 |
| \`LDIR\` / \`LDDR\` | repeat until BC = 0 | 21 per repeat, 16 on the last |
| \`CPI\` / \`CPD\` | compare A with (HL); HL ±1; BC − 1 | 16 |
| \`CPIR\` / \`CPDR\` | repeat until match or BC = 0 | 21 per repeat |
| \`INI IND OUTI OUTD\` and the \`R\` forms | block I/O using B as the counter | 16 / 21 |

## Input, output and control

| Instruction | Effect | T |
|---|---|---|
| \`IN A,(n)\` / \`OUT (n),A\` | port n (00H–FFH) ↔ A | 11 |
| \`IN r,(C)\` / \`OUT (C),r\` | port numbered in C | 12 |
| \`NOP\` | do nothing | 4 |
| \`HALT\` | stop until an interrupt or reset | 4 |
| \`DI\` / \`EI\` | disable / enable interrupts | 4 |
| \`IM 0\` \`IM 1\` \`IM 2\` | interrupt mode | 8 |
| \`LD A,I\` \`LD A,R\` \`LD I,A\` \`LD R,A\` | special registers | 9 |

## Reading the Z80 data book

Each entry shows the **operation**, the **assembler syntax**, the **flags** (a table of S Z H P/V N C marked "•" affected, "0"/"1" forced, "?" unknown), the **encoding** and the **T-states / M-cycles**. The lecture's example: \`ADD A,n\` is the Z80's version of the 68K's \`ADDI.B #data,<ea>\`; its machine code is \`C6 n\`, so \`C6 22\` adds 22H to A. Note the direction: the Z80 reads *destination ← destination + source*, the 68K *source + destination → destination*.
` },

    { id: "modes", title: "Addressing modes in depth", lesson: "L5", icon: "🎯", practice: ["modes", "Mode Match"], summary: "Where the operand lives: register, immediate, indirect, indexed, extended, relative.", md: `An **addressing mode** tells the CPU how to find an operand. The Z80 has fewer modes than the 68000, but each instruction supports only some of them (the lecture's key point: *each instruction has its own set of permissible addressing modes*).

| Mode | Example | The operand is… |
|---|---|---|
| Register | \`LD A,B\` / \`ADD A,C\` | in a CPU register |
| Immediate | \`LD C,55H\` | the byte after the opcode |
| Immediate extended | \`LD DE,0A34BH\` | the two bytes after the opcode (16-bit, low byte first) |
| Register indirect | \`LD B,[HL]\` | in memory at the address held in HL (or BC, DE) |
| Indexed | \`LD A,(IX+5)\` | in memory at IX (or IY) + signed 8-bit displacement |
| Extended (absolute) | \`LD A,(1234H)\` / \`JP 0ABCDH\` | in memory at the 16-bit address after the opcode |
| Relative | \`JR NZ,LOOP\` / \`DJNZ LOOP\` | an offset from the next instruction |
| Implied | \`CPL\` / \`EXX\` / \`DAA\` | built into the opcode (usually A or HL) |
| Bit | \`BIT 3,A\` / \`SET 7,[HL]\` | a bit number (0–7) selects one bit |
| Modified page-zero | \`RST 38H\` | a call to one of eight addresses in page zero |

## Register indirect: a register pair as a pointer

HL is the general pointer: \`LD A,(HL)\`, \`LD (HL),B\`, \`ADD A,(HL)\`, \`INC (HL)\`, \`CP (HL)\`, \`BIT 0,(HL)\`... BC and DE work only with A: \`LD A,(BC)\`, \`LD (BC),A\`, \`LD A,(DE)\`, \`LD (DE),A\`. Pointers make arithmetic on addresses possible: \`INC HL\` moves to the next byte.

\`\`\`asm
        LD HL,TABLE        ; HL = address of the table
        LD A,[HL]          ; A = first byte
        INC HL             ; point at the next one
        ADD A,[HL]         ; add the second byte
\`\`\`

## Immediate vs extended: the brackets

\`LD A,(1234H)\` reads memory at address 1234H. \`LD HL,1234H\` puts the number 1234H into HL. \`LD HL,(1234H)\` reads two bytes from memory at 1234H and 1235H into L and H. Forgetting or adding brackets changes the meaning completely.

Absolute addressing has limits: the only 8-bit register that can use it is **A**; for 16-bit data it works with HL (and BC, DE, SP, IX, IY). To store another register at an address, load the address into HL and use \`LD (HL),r\`.

## Indexed: tables and structures

\`\`\`asm
        LD IX,RECORD       ; RECORD: id, score, bonus
        LD A,[IX+1]        ; score
        ADD A,[IX+2]       ; + bonus
\`\`\`

The displacement is a *signed* byte (−128 to +127); the index register is not changed. For arrays, add the element size to IX each time (\`LD DE,3\` / \`ADD IX,DE\`).

## Relative addressing

\`JR\` and \`DJNZ\` store a signed offset instead of an address. The code works wherever it is loaded (position independent), at the price of a ±128-byte reach.

## What is not available

- No memory-to-memory \`LD\` (the 68K has it); use a register, or the block instructions.
- No post-increment or pre-decrement addressing: advance pointers with \`INC HL\` / \`DEC HL\`.
- No 16-bit register-to-register \`LD\` except \`LD SP,HL\`; use \`EX DE,HL\` or two 8-bit loads.
` },

    { id: "branches", title: "Jumps, conditions and loops", lesson: "L5", icon: "🔀", practice: ["flow", "Branch Oracle"], summary: "JP, JR, DJNZ and the eight conditions; loop patterns.", md: `Computers decide by changing the program counter. On the Z80 that means \`JP\` (absolute), \`JR\` (relative) and \`DJNZ\` (relative loop), each optionally conditional on a **flag**.

## The eight conditions

| cc | Meaning | Tests | Works with |
|---|---|---|---|
| \`NZ\` | not zero / not equal | Z = 0 | JP JR CALL RET |
| \`Z\` | zero / equal | Z = 1 | JP JR CALL RET |
| \`NC\` | no carry | C = 0 | JP JR CALL RET |
| \`C\` | carry | C = 1 | JP JR CALL RET |
| \`PO\` | parity odd / no overflow | P/V = 0 | JP CALL RET |
| \`PE\` | parity even / overflow | P/V = 1 | JP CALL RET |
| \`P\` | sign positive | S = 0 | JP CALL RET |
| \`M\` | sign negative (minus) | S = 1 | JP CALL RET |

(The lecture lists NZ, Z, NC, C, P and M for \`JP cc\`; the Z80 has PO and PE as well.) \`JR\` is limited to the first four.

## Comparing with CP

\`CP B\` computes A − B and sets the flags without changing A.

| After \`CP B\` | Condition |
|---|---|
| A = B | \`Z\` |
| A ≠ B | \`NZ\` |
| A < B (unsigned) | \`C\` |
| A ≥ B (unsigned) | \`NC\` |
| A > B (unsigned) | \`NZ\` **and** \`NC\` (test NC after excluding Z) |

For **signed** numbers the true condition is "S ≠ V" (sign differs from overflow). The Z80 has no single condition for that. The usual idiom uses \`SUB\`, because it needs the *result* in A (the compare \`CP\` throws the result away, so you cannot fix up its sign):

\`\`\`asm
        SUB B              ; A = A - B (signed compare; A is destroyed)
        JP PO,NOOVF        ; no overflow: the sign flag is right
        XOR 80H            ; overflow: the sign is inverted, flip it
NOOVF:  JP M,LESS          ; now M means the original A < B
\`\`\`

(Save A first with \`LD C,A\` if you still need it.) An exhaustive test of all 65,536 pairs of bytes confirms the idiom (\`tests/audit/checks.js\`).

## Loops

### Count down with DJNZ

\`\`\`asm
        LD B,10            ; ten passes
LOOP:   ; ... body ...
        DJNZ LOOP          ; B = B - 1, repeat while B is not zero
\`\`\`

\`DJNZ\` is the only instruction that decrements and branches in one, changes no flags, and runs 8 T-states when it falls through. \`LD B,0\` gives 256 passes.

### Count with the accumulator

\`\`\`asm
        LD A,10
LOOP:   ; ... body ...
        DEC A
        JR NZ,LOOP
\`\`\`

### Stop on a sentinel

\`\`\`asm
        LD HL,DATA
NEXT:   LD A,[HL]
        OR A               ; sets Z if the byte is 0
        JR Z,DONE          ; zero byte ends the table
        ; ... use A ...
        INC HL
        JR NEXT
DONE:   HALT
DATA:   .DB 12,13,5,0
\`\`\`

## If / else

\`\`\`asm
        CP 10              ; if (A >= 10)
        JR C,SMALL
        ; ... A >= 10 ...
        JR END
SMALL:  ; ... A < 10 ...
END:
\`\`\`

## Plan with a flow chart

The course asks for flow charts: rectangles for operations, diamonds for decisions, arrows for flow. Students usually write the program first and chart it later; the charts exist to prevent avoidable errors.

## Z80 vs 68K

The Z80 has **conditional jumps to absolute addresses, conditional calls and conditional returns**; the 68K has only conditional (relative) branches. The 68K's \`DBcc\` loop instruction corresponds to the Z80's \`DJNZ\`.
` },

    { id: "stack", title: "The stack, subroutines and interrupts", lesson: "L5", icon: "📚", practice: ["flow", "Program Sorter"], summary: "PUSH, POP, CALL, RET, the reset and interrupt vectors.", md: `The **stack** is a LIFO region of memory addressed by SP. On the Z80 it grows toward **lower addresses**: \`PUSH\` decrements SP by two and stores the pair (high byte at the higher address); \`POP\` loads the pair and adds 2.

\`\`\`
SP = 8000H, BC = 1234H
PUSH BC      -> SP = 7FFEH, (7FFFH) = 12H, (7FFEH) = 34H
POP DE       -> DE = 1234H, SP = 8000H
\`\`\`

Set SP yourself before using it: \`LD SP,0F000H\` (after reset SP is undefined).

## Subroutines

\`CALL nn\` pushes the address of the next instruction and loads PC with nn; \`RET\` pops that address back into PC. \`CALL cc,nn\` and \`RET cc\` are the conditional forms the 68K lacks.

\`\`\`asm
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
\`\`\`

Rules of thumb:

1. **Balance the stack.** Every \`PUSH\` needs a \`POP\` before \`RET\`, in the opposite order.
2. **Save what you change** if the caller expects it back. Decide on a convention (which registers a routine may destroy) and document it.
3. Pass values in registers: A for a byte, HL or DE for a 16-bit value or address.
4. An extra PUSH or POP makes \`RET\` jump to the wrong address, the classic crash.

The lecture's list of what happens: save the return address, transfer to the routine, run it, restore, and return to where it was called from.

## RST: a one-byte call

\`RST 38H\` pushes PC and jumps to 0038H. The eight targets are 00H, 08H, 10H, 18H, 20H, 28H, 30H, 38H. It is used for fast system calls and by interrupts.

## Interrupts

An interrupt makes the CPU stop, save PC and run a service routine. The Z80 has:

| Input | Maskable? | Goes to | Return with |
|---|---|---|---|
| Reset | no | 0000H | n/a |
| NMI | no | 0066H | \`RETN\` |
| INT, mode 0 | yes (\`DI\`/\`EI\`) | the device places an instruction (usually an RST) on the data bus | \`RETI\` |
| INT, mode 1 | yes | 0038H | \`RETI\` |
| INT, mode 2 | yes | address stored in a table at (I × 256 + vector byte from the device) | \`RETI\` |

Facts to remember:

- Interrupts are **disabled after reset**; \`EI\` enables them (after the *next* instruction), \`DI\` disables them.
- When an interrupt is accepted the CPU disables further maskable interrupts; the routine ends with \`EI\` then \`RETI\`.
- \`RETI\` tells Z80-family peripherals the routine is done; \`RETN\` also restores the interrupt-enable flag after an NMI.
- Save every register the routine uses (\`PUSH\`), or swap sets quickly with \`EXX\` and \`EX AF,AF'\`.

\`\`\`asm
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
\`\`\`

The sandbox's **INT** button raises this interrupt, so you can step into the routine and watch the stack.
` },

    { id: "memory", title: "Memory, buses and address decoding", lesson: "L6-7", icon: "🧱", practice: ["hw", "Hardware Lab"], summary: "Z80 bus signals, tri-state buses, chip selects, decoding, endianness, SRAM vs DRAM.", md: `## The Z80's pins that matter for memory

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

IN and OUT use a separate 256-port address space, selected with ~IORQ instead of ~MREQ. The low address byte (A0–A7) carries the port number; the high byte carries A (for \`IN A,(n)\`) or B (for \`IN r,(C)\`). Devices can also be memory-mapped, with ordinary loads and stores.

## Endianness

Storing the word \`0AA55H\` at 1000H–1001H:

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
` },

    { id: "transistor", title: "Transistors as switches", lesson: "L8", icon: "💡", practice: ["io", "Hardware Lab"], summary: "Driving real loads from an I/O pin: the base resistor, saturation, worst case.", md: `A microcontroller pin supplies only about 1 to 20 mA at 3.3-5 V. Real loads (motors, relays, lamps) may need amps or hundreds of volts. A transistor lets the pin *control* a bigger supply.

## The NPN model

- Base current \`IB\` flows through the base-emitter junction, which looks like a forward-biased diode: **VBE ≈ 0.6 V**.
- Collector current is a multiple of it: **IC = β × IB** (β, also hFE, is the current gain).
- In **switching** use, the transistor is either off (no base current) or driven into **saturation**.

## Saturation

Push in more base current than the load needs and the collector voltage can't fall below about **0.4 V** (VCE(sat), the lecture's conservative figure; small-signal parts are often 0.1-0.3 V). The transistor is now a closed switch.

- Input 0 V: transistor off, collector at the supply voltage.
- Input high: collector ≈ 0.4 V.
- Power in the saturated transistor ≈ **0.4 V × IC**.

> The arithmetic can say a collector should be at −5 V. Sanity check: it can't go below ground, so the transistor is simply saturated.

## Sizing the base resistor

Never connect a pin straight to a base: the junction is a diode to ground and would burn out the pin. Always use a series resistor.

1. Collector current you need: \`IC\`.
2. Worst-case (minimum) gain: \`β(min)\`.
3. Base current: \`IB = IC / β(min)\`.
4. \`R = (V_IO − 0.6 V) / IB\`.
5. Choose a standard value at or just below the result.

### Worked example (from the lecture)

The pin gives 5 V; the load needs 100 mA; 75 ≤ β ≤ 200.

\`\`\`
IB = 100 mA / 75 = 1.33 mA
R  = (5 V - 0.6 V) / 1.33 mA = 3.3 kOhm      (rounding IB to 1.3 mA, as the lecture does, gives 3.38 k;
                                              either way the closest standard value is 3.3 k)
\`\`\`

### Worked example: a lightly driven transistor

25 V supply, 330 Ω collector resistor, 5 V drive through 10 kΩ, β = 100.

\`\`\`
IB = (5 - 0.6) / 10 k = 440 uA
IC = 100 x 440 uA = 44 mA
drop across 330 ohm = 14.5 V  ->  collector = 25 - 14.5 = 10.5 V
\`\`\`

Replace 10 kΩ by 1 kΩ: IB = 4.4 mA, the formula wants IC = 440 mA and 145 V across the resistor, which is impossible, so the transistor saturates (collector ≈ 0.4 V).

## Why β is not a constant

It changes with collector current, temperature and between supposedly identical parts (min/max can differ by 3× or more). Design for the **minimum** β.

## Choosing a transistor

- Maximum collector voltage when off must exceed the supply (a 100 V supply → pick a 200 V part).
- Maximum collector current and power dissipation.
- β range at your operating current.
- Linear vs switching type, and package.

## Sourcing and sinking

A pin can **source** current (flows out of the pin, through the load, to ground) or **sink** it (flows into the pin). Many outputs can sink more than they can source (modern CMOS pins are often symmetric).

## Small parts

- **Diode:** conducts anode to cathode once the anode is about 0.6 V above the cathode (silicon; Schottky diodes turn on nearer 0.2-0.4 V). Mind forward current and reverse breakdown.
- **Zener:** uses reverse breakdown as a voltage reference; needs a series resistor to limit current.
- **LED:** forward voltage about 1-4 V; brightness follows forward current; always use a current-limiting resistor.
` },

    { id: "oshonsoft", title: "Using the Oshonsoft Z80 Simulator IDE", lesson: "L4-5", icon: "🛠️", practice: ["sim", "Quiz Blitz"], summary: "The lab tool: assemble, load, run, step, ports and terminals; how this sandbox differs.", md: `The course uses the **Oshonsoft Z80 Simulator IDE** (oshonsoft.com/z80.html), a Windows program with an assembler, disassembler, BASIC compiler, debugger and simulator. The lecture says the trial version works long enough to finish lab 2; Oshonsoft says a license is required after the evaluation period. This site's sandbox is a study aid built from the IDE's published help pages: it is **not** a copy of the IDE and was not compared against it.

## Workflow in the IDE

1. Write the program in the assembler window (**Tools > Assembler**; default extension ASM) or open a \`.asm\` file.
2. **Tools > Assemble** produces a listing (\`.lst\`) and a binary image (\`.obj\`); with *Generate HEX File Also* it writes Intel HEX too. Fix any errors first.
3. **Tools > Load** (or **File > Load Program**) puts the object code into the simulated 64 KB memory. An OBJ image is loaded from an offset address (default 0000H); HEX files carry their own addresses.
4. **Simulation > Start** begins executing at the **starting address, default 0000H** (Options > Change Starting Address). All 64 KB of memory begins filled with NOPs (00H), so a program assembled with \`.ORG 0100H\` will run 256 NOPs before it reaches your code unless you change the starting address or begin the program with a jump.
5. The **Rate** menu: *Step By Step* (a STEP item appears; **F2** executes the next instruction and you can edit registers), *Slow* (1500 ms per instruction), *Normal* (250 ms), *Fast* (about 50 ms), *Extremely Fast*, and *Ultimate* (the window is refreshed only occasionally). You can change the rate while the simulation runs.
6. The **Fast Debugger / Breakpoints Manager** lists the program; click a line to set a breakpoint (a red circle). Reaching one switches to Step By Step.
7. **Simulation > Stop** reports the number of instructions, the duration in clock cycles and the real-time duration (default clock 4 MHz).

Useful options: *HALT Stops Simulation* (if off, HALT repeats like the real chip until an interrupt), *Enable Logging* (\`LOG.TXT\`), *Enable IN/OUT Instructions Logging* (\`IO.TXT\`), *Prompt For Value Before IN Instruction*, *Enable Unofficial Instructions*, *FF Power On Defaults* (registers start at 00H or FFH).

## Ports, terminals and interrupts

- **Peripheral Devices:** up to four basic I/O devices plus an output terminal that shows the ASCII characters sent to a port. Bytes sent by \`OUT\` are shown bit by bit; an input device's value can be typed or set bit by bit. The Getting Started examples use an input device on port \`01H\` and an output on port \`02H\`. The **I/O Ports Editor** exposes all 256 ports.
- **Prompt For Value Before IN** (on): the program asks you for every incoming byte on every port, as a hex value \`00\`–\`FF\` (a Keyboard button gives the ASCII code of a key). Off: the value comes from the Peripheral Devices or I/O Ports Editor window.
- **Interrupts:** NMI and all three INT modes are simulated, triggered by the NMI and INT buttons; **RESET** resets the simulation. NMI jumps to 0066H. Mode 0 asks you for the RST instruction the device supplies; mode 1 jumps to 0038H; mode 2 asks for the 8-bit vector and combines it with register I.
- Also in the IDE: Input/Output Terminal (a serial-style terminal on ports or memory-mapped), Video Memory Screen, Simulation Log Viewer, Interactive Assembler Editor, Watch Variables, External Modules, a ZX Spectrum ROM interface, and an external TASM assembler interface.

## What the sandbox does the same

- Accepts the IDE's source conventions: directives with or without a period (\`ORG EQU INCLUDE DB/DEFB/BYTE DW/DEFW/WORD DS/DEFS/BLOCK END\`, \`=\` for EQU), labels with or without colons, \`[HL]\` or \`(HL)\`, every number format in the help, the \`high\`/\`low\`/\`highw\`/\`loww\` and \`<\` \`>\` prefixes, \`$\` or \`PC\` for the current address, \`+ - * / \\ & | ^ << >>\`, and the help page's own test example (checked by \`tests/oshonsoft-expr.js\`).
- Starts at 0000H by default with memory filled with NOPs, a Starting address box, step by step, rates, breakpoints, HALT option, prompt-before-IN option, INT/NMI buttons (INT asks for the vector byte in modes 0 and 2), a terminal on port 02H, an input device on port 01H, and registers at 0 on power-up.
- Simulates every documented instruction and the common undocumented ones with exact T-states, and shows time at the IDE's default 4 MHz.

## What it does not do

- No BASIC compiler, disassembler window, interactive assembler editor, watch variables, video screen, serial terminals with status registers, ZX Spectrum interface, external modules or TASM interface.
- No \`INCLUDE\` (a browser cannot read other files) and no \`.obj\`/\`.hex\` loading from disk; it assembles into memory directly. It can download \`.asm\`, \`.lst\` and Intel-HEX files.
- It always simulates unofficial instructions (the IDE has an option).
- Label case: the sandbox treats \`Loop\` and \`LOOP\` as the same label. The IDE's rule was not found in its help pages.

## Example from the IDE's Getting Started page

The IDE ships \`memfill.asm\`: it fills FF00H–FFFFH with FFH down to 00H using \`LD A,0FFH\`, \`LD BC,0FF00H\`, a loop that ends with \`JP NZ\`, and \`HALT\`. Try writing your own version in the sandbox and compare the Memory view.
` },

    { id: "vs68k", title: "68000 vs Z80 side by side", lesson: "L3-5", icon: "🆚", practice: ["m68", "Quiz Blitz"], summary: "The same ideas in two machines: registers, notation, instructions, memory.", md: `| | 68000 | Z80 |
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
| Conditional call / return | none | \`CALL cc\`, \`RET cc\` |
| Bus operation | more complicated | very simple to follow |

## Instructions that correspond

| Idea | 68000 | Z80 |
|---|---|---|
| Copy a byte register to register | \`MOVE.B D0,D1\` | \`LD B,A\` |
| Copy through a pointer | \`MOVE.B (A0),D1\` | \`LD B,[HL]\` |
| Immediate into register | \`MOVE.B #$55,D1\` | \`LD C,55H\` |
| Register to absolute address | \`MOVE.B D0,$0000FF35\` | \`LD [0FF20H],A\` (only A) |
| 16-bit absolute | \`MOVE.W D0,$0000FF36\` | \`LD [0FF20H],HL\` |
| Compare | \`CMP.B D0,D1\` | \`CP D\` (A − D) |
| Branch if zero | \`BEQ label\` | \`JR Z,label\` |
| Jump | \`JMP $0000ABCD\` | \`JP 0ABCDH\` |
| Subroutine | \`JSR\` / \`BSR\` and \`RTS\` | \`CALL\` and \`RET\` |
| Return from interrupt | \`RTE\` | \`RETI\` / \`RETN\` |
| Loop counter | \`DBRA Dn,label\` | \`DJNZ label\` |
| Block copy | a loop with \`MOVE.B (A0)+,(A1)+\` | \`LDIR\` |
| Add immediate | \`ADDI.B #5,D0\` | \`ADD A,5\` |

## Reading the same program twice

Sum five bytes:

\`\`\`
68000                          Z80
      MOVE.B #5,D0                   LD B,5
      LEA Table,A0                   LD HL,TABLE
      CLR.W D1                       XOR A
Loop  ADD.B (A0)+,D1           LOOP: ADD A,[HL]
      SUBQ.B #1,D0                   INC HL
      BNE Loop                       DJNZ LOOP
\`\`\`

The 68K pointer auto-increments; the Z80 needs \`INC HL\`. The 68K counts with SUBQ and BNE; the Z80 has the single \`DJNZ\`. The Z80 accumulates in A; the 68K uses any data register.
` },

    { id: "errata", title: "Slide notes and Oshonsoft quirks", lesson: "L3-8", icon: "⚠️", practice: ["dirs", "Bug Hunt"], summary: "Places where the slides simplify or disagree with the Z80 manual or the Oshonsoft help.", md: `These are things to be aware of when studying the Z80 slides. Each was checked against the Zilog Z80 CPU User Manual (UM0080) or the Oshonsoft help pages. The slides are a teaching summary, so most of these are simplifications, not mistakes.

| Where | What the slide says | What the manual / help says |
|---|---|---|
| L3 (programmer's model) | "Single instruction swaps Main and Alternate register sets"; \`EXX ; Exchange all registers\` | \`EXX\` swaps only BC, DE, HL with BC', DE', HL'. A and F are swapped by the separate \`EX AF,AF'\`. |
| L4 (pseudo-opcodes table) | Z80 string directive shown as \`DEFII 's'\` | There is no DEFII. Use \`DEFB "text"\` / \`.DB "text"\` (Oshonsoft accepts strings in DB and DW). |
| L4 (pseudo-opcodes note) | "The Z80 assembler from Oshonsoft requires that the pseudo-op codes have a period in front: END >> .END" | The Oshonsoft help lists \`ORG, EQU, INCLUDE, DB (DEFB), DW (DEFW), DS (DEFS), END\` and says they "can also take a dot prefix". The dotted form always works. |
| L5 (absolute addressing) | "Only register A can be used with absolute addressing" and "some architectures do not support absolute addressing (Z80, sort of)" | True for 8-bit data. For 16-bit data \`LD HL,(nn)\` / \`LD (nn),HL\` (and BC, DE, SP, IX, IY) are also absolute, and \`JP nn\` / \`CALL nn\` use 16-bit absolute addresses. |
| L5 (conditional jumps) | Lists \`cc\` as NZ, Z, NC, C, P, M | \`JP cc\`, \`CALL cc\` and \`RET cc\` also accept PO and PE (parity/overflow). \`JR cc\` accepts only NZ, Z, NC, C. |
| L5 (relative jumps) | \`JR nn ; nn is 8-bits\` | The assembler takes a label or address and computes the signed 8-bit offset from the next instruction. |
| L4-L5 (brackets) | Examples switch between \`LD A,(1234H)\` (data-book style) and \`LD B,[HL]\` / \`LD [0FF20H],A\` (Oshonsoft style: "notice the types of parentheses used by each assembler"), then say "the parentheses are required" | Zilog's manual uses round parentheses. The Oshonsoft help page does not define the bracket syntax; this site accepts both. Check the IDE if in doubt. |

## Oshonsoft help versus Getting Started

- The Getting Started page says Example 3 loads \`memfill2.obj\` where it means \`bin2bcd.obj\`, and names \`bin2bcd2.lst\` for \`bin2bcd.lst\`. Typos on that page; the programs themselves are fine.
- The help lists several numeric formats (\`0xnn\`, \`$nn\`, \`&hnn\`, \`H'nn'\`...). The lecture only uses the \`H\`-suffix style.

## Things this site does differently (known, intentional)

- Treats labels case-insensitively (the IDE's help does not say).
- Always simulates unofficial instructions, and cannot \`INCLUDE\` other files.
- Reports an error for an undefined symbol or an out-of-range value; the real assembler's wording differs.
- Also accepts \`%\` as a modulo operator (the IDE's help lists \`+ - * / \\\`).
` },

  ];

  const G = (term, def, lesson, cat) => ({ term, def, lesson, cat });
  const GLOSSARY = [
    G("Accumulator (A)", "The 8-bit register that is one operand and the destination of Z80 arithmetic and logic instructions.", "L3", "CPU"),
    G("Address bus", "Unidirectional lines from the CPU that say which memory location or port is being accessed. The Z80 has 16 (A0–A15).", "L3", "Hardware"),
    G("Alternate registers", "The second register set A', F', B', C', D', E', H', L', swapped with EX AF,AF' and EXX.", "L3", "Z80"),
    G("ALU", "Arithmetic and logic unit: performs the adds, subtracts, ANDs, ORs and shifts and produces the flags.", "L3", "CPU"),
    G("Assembler", "A program that translates assembly source into machine code, two passes over the text.", "L4", "Tools"),
    G("Assembler directive", "A line that instructs the assembler (ORG, EQU, DB...) and generates no instruction. Also called a pseudo-op.", "L4", "Tools"),
    G("Base resistor", "The series resistor between an I/O pin and a transistor base; sets IB = (V − 0.6)/R.", "L8", "Transistors"),
    G("BCD", "Binary-coded decimal: one decimal digit per 4-bit nibble. DAA corrects the result of adding or subtracting BCD bytes.", "L3", "Numbers"),
    G("Beta (β)", "Forward current gain of a BJT, IC/IB. Varies widely; design with the minimum.", "L8", "Transistors"),
    G("Big-endian", "Most significant byte at the lowest address (68000).", "L6", "Memory"),
    G("BIT", "Z80 instruction that tests one bit of a register or memory byte, setting Z if the bit is 0.", "UM0080", "Instructions"),
    G("Breakpoint", "A marked instruction where the simulator stops so you can inspect the state.", "L4", "Tools"),
    G("Bus contention", "Two outputs driving a shared line at once with opposite levels; solved with tri-state or open-collector outputs.", "L6", "Hardware"),
    G("CALL", "Pushes the return address and jumps to a subroutine. CALL cc,nn is the conditional form.", "L5", "Control"),
    G("Carry (C)", "Flag: carry out of bit 7 on addition, borrow on subtraction, or the bit shifted out by a rotate.", "L3", "Flags"),
    G("CISC", "Complex Instruction Set Computer: many instructions and modes, variable length (Z80, 68000, x86).", "L3", "CPU"),
    G("Condition code (cc)", "One of NZ, Z, NC, C, PO, PE, P, M: tests a flag for JP, CALL and RET (JR accepts only NZ, Z, NC, C).", "L5", "Control"),
    G("CP", "Compare: computes A − operand, sets the flags and discards the result.", "L4", "Instructions"),
    G("DAA", "Decimal adjust accumulator: fixes A after BCD addition or subtraction using H, C and N.", "UM0080", "Instructions"),
    G("Data bus", "Bidirectional lines carrying the data; 8 bits on the Z80.", "L3", "Hardware"),
    G("Decoder (74x138)", "A 3-to-8 line decoder used to turn high address bits into one chip select.", "L7", "Hardware"),
    G("Destination", "The operand that receives the result. On the Z80 it is written first.", "L4", "Tools"),
    G("DJNZ", "Decrement B and jump relative if it is not zero: the Z80 loop instruction.", "UM0080", "Instructions"),
    G("DRAM", "Dynamic RAM: one transistor and a capacitor per bit; dense but needs refresh and RAS/CAS addressing.", "L6", "Memory"),
    G("Effective address", "The address the CPU finally uses to reach an operand after applying the addressing mode.", "L5", "Addressing"),
    G("EI / DI", "Enable / disable maskable interrupts (EI takes effect after the following instruction).", "UM0080", "Control"),
    G("EQU", "Directive that gives a symbol a value; generates no code.", "L4", "Tools"),
    G("Extended addressing", "The operand address is the 16-bit value following the opcode, as in LD A,(1234H).", "L5", "Addressing"),
    G("EXX", "Instruction that swaps BC, DE and HL with BC', DE' and HL'.", "UM0080", "Instructions"),
    G("Flag register (F)", "Holds S, Z, H, P/V, N and C, set by arithmetic and logic instructions.", "L3", "CPU"),
    G("Half carry (H)", "Flag: carry from bit 3 into bit 4; used by DAA.", "L3", "Flags"),
    G("HALT", "Instruction that stops execution (the CPU idles) until an interrupt or reset.", "UM0080", "Instructions"),
    G("Hi-Z", "High-impedance: the third state of a tri-state output, electrically disconnected from the bus.", "L6", "Hardware"),
    G("I register", "Interrupt-vector register; the high byte of the interrupt table address in mode 2.", "L3", "Z80"),
    G("Immediate addressing", "The operand is a constant that follows the opcode, as in LD C,55H.", "L5", "Addressing"),
    G("Index register (IX, IY)", "16-bit register used with a signed displacement: (IX+d).", "L3", "Z80"),
    G("Indexed addressing", "Effective address = IX or IY + displacement.", "L5", "Addressing"),
    G("Instruction set simulator", "A program that executes object code as if it were the target CPU, so programs can be stepped without hardware.", "L5", "Tools"),
    G("Interrupt", "An event that makes the CPU save PC and run a service routine. The Z80 has INT (maskable, modes 0–2) and NMI.", "L5", "Control"),
    G("Interrupt mode", "IM 0: the device supplies an instruction. IM 1: jump to 0038H. IM 2: vector table indexed by the I register and a device byte.", "UM0080", "Control"),
    G("IORQ", "Z80 output that marks an I/O port access (as opposed to ~MREQ for memory).", "UM0080", "Hardware"),
    G("JP / JR", "Jump to an absolute address / jump relative with a signed 8-bit offset.", "L5", "Control"),
    G("Label", "A name for an address, defined by writing it at the start of a line.", "L4", "Tools"),
    G("LD", "The Z80 load (copy) instruction; destination first.", "L4", "Instructions"),
    G("LDIR", "Block copy: (DE) ← (HL), HL++, DE++, BC−−, repeat until BC = 0.", "UM0080", "Instructions"),
    G("Listing", "Assembler output showing each line with its address and generated bytes.", "L4", "Tools"),
    G("Little-endian", "Least significant byte at the lowest address (Z80, x86).", "L6", "Memory"),
    G("M1 cycle", "The opcode-fetch machine cycle (4 T-states on the Z80), flagged by ~M1.", "UM0080", "Hardware"),
    G("Machine code", "The binary instructions the CPU executes.", "L4", "CPU"),
    G("Memory-mapped I/O", "Devices that appear at memory addresses and are accessed with ordinary load and store instructions.", "L7", "Memory"),
    G("Mnemonic", "The human-readable name of an instruction (LD, ADD, JP...).", "L4", "Tools"),
    G("Negative (S)", "The Z80 sign flag: a copy of bit 7 of the result.", "L3", "Flags"),
    G("NMI", "Non-maskable interrupt; cannot be disabled; vector 0066H; return with RETN.", "UM0080", "Control"),
    G("NOP", "No operation; machine code 00H; 4 T-states.", "L4", "Instructions"),
    G("Offset bits", "Low address bits that select a location inside a memory chip or page.", "L6", "Hardware"),
    G("Opcode", "The first byte of a Z80 instruction; says what to do and how many operand bytes follow.", "L4", "CPU"),
    G("Open collector", "An output that can only pull low; needs a pull-up resistor to go high. Slow rising edges.", "L6", "Hardware"),
    G("Operand", "The data an instruction works on (a noun); the operation is the verb.", "L4", "Tools"),
    G("ORG", "Directive that sets the address where following code or data is placed.", "L4", "Tools"),
    G("Overflow (V)", "Flag (shared with parity as P/V) set when a signed result does not fit in the operand size.", "L3", "Flags"),
    G("P/V flag", "Overflow after arithmetic, parity after logic instructions and rotates.", "L3", "Flags"),
    G("Page", "The block of address space covered by one memory chip (or group of chips); chosen by the page bits.", "L6", "Memory"),
    G("Page bits", "High address bits fed to the decoder to choose a page.", "L6", "Hardware"),
    G("Paging", "Mapping different physical memories into a small address space by writing to a page-select register.", "L7", "Memory"),
    G("Parity", "Whether a byte has an even or odd number of 1 bits; the Z80 keeps it in the P/V flag after logic instructions.", "L3", "Flags"),
    G("Pointer", "A register or memory location whose value is an address.", "L5", "Addressing"),
    G("Port", "One of the 256 I/O addresses reached with IN and OUT.", "UM0080", "Hardware"),
    G("Prefix byte", "CBH, DDH, EDH or FDH: opens an extra page of opcodes (bit operations, IX, extended, IY).", "UM0080", "CPU"),
    G("Program counter (PC)", "Register holding the address of the next instruction.", "L3", "CPU"),
    G("Pseudo-op", "Another name for an assembler directive.", "L4", "Tools"),
    G("PUSH / POP", "Store a register pair on the stack / load it back; SP moves by two.", "L3", "Instructions"),
    G("R register", "7-bit refresh counter that increments on every opcode fetch.", "L3", "Z80"),
    G("Register indirect addressing", "A register pair holds the address of the operand: LD A,(HL).", "L5", "Addressing"),
    G("Relative addressing", "A signed offset from the next instruction, used by JR and DJNZ.", "L5", "Addressing"),
    G("RET / RETI / RETN", "Return from subroutine / maskable interrupt / non-maskable interrupt.", "L5", "Control"),
    G("RISC", "Reduced Instruction Set Computer: few instructions and modes, fixed length, load/store architecture (e.g. ARM).", "L3", "CPU"),
    G("RST", "One-byte call to 00H, 08H ... 38H in page zero.", "UM0080", "Instructions"),
    G("Saturation", "A transistor driven so hard that the collector voltage stops falling (roughly 0.2–0.4 V; the lecture uses 0.4 V); acts as a closed switch.", "L8", "Transistors"),
    G("Sign extension", "Copying the sign bit into the upper bits to widen a signed value (e.g. 80H → 0FF80H).", "L5", "Numbers"),
    G("Sinking / sourcing", "Current flowing into an output pin (sink) or out of it (source).", "L8", "Transistors"),
    G("SRAM", "Static RAM: bit stored by cross-coupled inverters (6 transistors); fast, no refresh.", "L6", "Memory"),
    G("Stack", "LIFO memory region used for return addresses, saved registers and locals. Grows toward lower addresses on the Z80.", "L5", "Control"),
    G("Stack pointer (SP)", "Register pointing at the top of the stack.", "L3", "CPU"),
    G("Subroutine", "A reusable block of code called with CALL and ended with RET; the equivalent of a C function.", "L5", "Control"),
    G("Symbol table", "Assembler output mapping each label to its value.", "L4", "Tools"),
    G("T-state", "One clock period. Instruction times are counted in T-states (NOP = 4, LD A,(nn) = 13).", "UM0080", "Hardware"),
    G("Tri-state", "Output with three states: 0, 1 and Hi-Z, enabling bus sharing.", "L6", "Hardware"),
    G("Two's complement", "Signed number representation: negate by complementing all bits and adding 1.", "L3", "Numbers"),
    G("VBE", "Base-emitter voltage of a conducting BJT, about 0.6 V.", "L8", "Transistors"),
    G("von Neumann architecture", "One memory space for both instructions and data (the Z80 and 68000).", "L3", "CPU"),
    G("Wait state", "An extra clock cycle added to a memory access so slow memory can keep up (the Z80 ~WAIT input).", "L7", "Memory"),
    G("Zero (Z)", "Flag set when the result is zero (all bits 0).", "L3", "Flags"),
  ];

  const SEE = {"cpu": ["numbers", "model"], "numbers": ["model", "branches"], "model": ["modes", "instructions"], "machine-code": ["modes", "instructions"], "syntax": ["oshonsoft", "instructions", "branches"], "instructions": ["modes", "branches"], "modes": ["instructions", "stack"], "branches": ["numbers", "stack"], "stack": ["branches", "syntax"], "memory": ["cpu", "vs68k"], "transistor": ["memory"], "oshonsoft": ["syntax", "machine-code", "errata"], "vs68k": ["model", "instructions"], "errata": ["instructions", "syntax"]};
  const DECK_GUIDE = {"cpu": "model", "num": "numbers", "dirs": "syntax", "inst": "instructions", "modes": "modes", "flow": "branches", "hw": "memory", "io": "transistor", "sim": "oshonsoft", "m68": "vs68k"};
  const CAT_GUIDE = {"Addressing": "modes", "Flags": "numbers", "CPU": "model", "Tools": "syntax", "Instructions": "instructions", "Control": "branches", "Hardware": "memory", "Memory": "memory", "Transistors": "transistor", "Numbers": "numbers", "Z80": "model"};
  const REFS = [
  {
    "title": "Zilog Z80 CPU User Manual (UM0080)",
    "url": "https://www.zilog.com/docs/z80/um0080.pdf",
    "note": "The authoritative instruction set, flags, timing and interrupt reference."
  },
  {
    "title": "Oshonsoft Z80 Simulator IDE",
    "url": "http://www.oshonsoft.com/z80.html",
    "note": "The simulator used in the course lab (Windows, trial version)."
  },
  {
    "title": "Oshonsoft Z80 help topics",
    "url": "http://www.oshonsoft.com/z80helptopics.php",
    "note": "Assembler directives, number formats and menu reference."
  },
  {
    "title": "Oshonsoft Z80 Getting Started",
    "url": "http://www.oshonsoft.com/z80gettingstarted.php",
    "note": "Example programs, ports and the simulation workflow."
  },
  {
    "title": "SingleStepTests/z80",
    "url": "https://github.com/SingleStepTests/z80",
    "note": "Per-instruction hardware-derived test vectors (MIT licensed) used to verify this site's CPU core."
  },
  {
    "title": "Z80 instruction set (clrhome.org table)",
    "url": "https://clrhome.org/table/",
    "note": "A handy opcode table with flags and timings."
  }
];
  const api = { GUIDES, GLOSSARY, render, SEE, DECK_GUIDE, CAT_GUIDE, REFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QUEST_GUIDES = api;
})(typeof window !== 'undefined' ? window : globalThis);
