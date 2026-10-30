/* Written guides and glossary. Content follows BEE 425 Lessons 3-8; each guide notes its source lesson.
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
    /* ===================================================== */
    { id: 'cpu', title: 'How a processor runs a program', lesson: 'L3', icon: '🧠', practice: ['regs', 'Register Tracer'], summary: 'Fetch, decode, execute, and the blocks inside the CPU.', md: `
A microprocessor is a machine that repeats one cycle forever: **fetch** an instruction from memory, **decode** it, **execute** it. Everything else (registers, ALU, buses) exists to make that cycle work.

## The blocks inside the CPU

| Block | Job |
|---|---|
| Microcode state machine | The "brain": decodes instructions, sequences memory reads and writes, makes decisions. It is why processors are synchronous (clock driven). |
| ALU (arithmetic and logic unit) | Performs every add, subtract, AND, OR, shift. Operands come from registers; results set the flags. |
| General registers | Fast local storage built from D flip-flops, right next to the CPU. Efficient programs work register to register. |
| Status register | Holds flag bits (Zero, Negative, Carry, Overflow...) set by the ALU. If A = B then A − B gives Zero flag = 1. |
| Program counter (PC) | Address of the next instruction. Branches and jumps work by changing the PC. |
| Stack pointer (SP) | Points into the stack (LIFO memory) used for subroutine calls and interrupts. |
| Instruction register | Holds the instruction just fetched while the state machine decodes it. |
| Bus interface unit | Talks to memory, interleaving instruction fetches and data accesses. |
| Interrupt controller | Sequences internal and external interrupts (exceptions) into the program. |

## The three buses

Every processor talks to the outside world through three groups of wires:

- **Address bus:** the CPU says *where*. It is unidirectional (CPU to memory). With n address lines you can address 2ⁿ bytes.
- **Data bus:** the information being read or written. It is bidirectional.
- **Status and control bus:** housekeeping signals such as RESET, INTERRUPT, READ, WRITE and ADDRESS VALID. These are heterogeneous: some are inputs, some outputs, some both.

## One instruction, step by step

Take \`ADD.B D0,(A0)\` (add the byte in D0 to the byte in memory at the address in A0):

1. The PC value is put on the address bus; the **op-code word** is read from memory into the instruction register.
2. The PC advances past the instruction as it is decoded.
3. The decoder sees "ADD, byte, source = D0, destination = memory pointed to by A0".
4. The byte at the address in A0 is read, the ALU adds D0's low byte to it.
5. The sum is written back to that memory location, and the flags (X N Z V C) are updated.

> Assembly language maps one-to-one onto machine instructions, so understanding assembly means understanding the machine from the programmer's side. That is why hardware designers use it to bring up new boards.

## Microprocessor vs microcontroller

A **microprocessor** is just the CPU: program memory, data memory, serial and parallel I/O and timers live on the PCB around it. A **microcontroller** integrates the CPU plus those peripherals (UARTs, timers, A/D and D/A, SRAM, flash) onto a single chip. Examples from the lectures: the 68000 is a microprocessor; the TI TM4C123 and the Raspberry Pi Pico are microcontrollers.

## CISC vs RISC

| | CISC (68000) | RISC (ARM) |
|---|---|---|
| Instructions | Many, variable length (2 to 10 bytes) | Fewer, all the same size |
| Addressing modes | Many | Few |
| Registers | Fewer, with specific roles | Many, general purpose |
| Memory access | Memory-to-memory operations allowed | Only load and store touch memory; ALU works on registers |
| Memory model | von Neumann (one memory for code and data) | Often Harvard (separate code and data memories) |

The lecture's side-by-side: adding two longs in memory takes \`LEA\`, \`LEA\`, \`MOVE.L (A0),D0\`, \`ADD.L D0,(A1)\` on the 68000, but six instructions on ARM (two loads of the addresses, two loads of the data, an add, a store).
` },

    /* ===================================================== */
    { id: 'numbers', title: 'Numbers, hex and two\'s complement', lesson: 'L3', icon: '🔢', practice: ['num', 'Number Ninja'], summary: 'Hex and binary notation, negative numbers, and what the flags mean.', md: `
## Writing numbers in 68K assembly

| Base | 68K | Z80 | C |
|---|---|---|---|
| Hexadecimal | \`$AF56\` | \`0AF56H\` (leading 0 if it starts with A-F) | \`0xAF56\` |
| Binary | \`%10101100\` | n/a | \`0b10101100\` |
| Octal | \`@755\` | n/a | n/a |
| Decimal | \`25\` | \`25\` | \`25\` |

A \`#\` in front means "this is a literal number": \`MOVE.B #24,D0\` loads decimal 24; \`MOVE.B #$24,D0\` loads hex $24 (decimal 36).

## Sizes

| Suffix | Name | Bits | Unsigned range | Signed range |
|---|---|---|---|---|
| \`.B\` | byte | 8 | 0 to 255 | −128 to +127 |
| \`.W\` | word | 16 | 0 to 65,535 | −32,768 to +32,767 |
| \`.L\` | long word | 32 | 0 to 4,294,967,295 | −2,147,483,648 to +2,147,483,647 |

In 68K-speak a **word is 16 bits**.

## Two's complement

Subtraction is done by adding the negative. To negate a number:

1. Complement every bit (1s become 0s, 0s become 1s).
2. Add 1.

Example from the lecture: $5E = 0101 1110. Complement: 1010 0001. Add 1: 1010 0010 = **$A2**. So $A2 is −94 as a signed byte.

To read a signed byte: if bit 7 is 0 it is the plain value; if bit 7 is 1 subtract 256. $F3 → 243 − 256 = −13.

The processor does not know whether your bytes are signed or unsigned: it always just adds. **You** decide how to interpret the result, and you pick the branch (signed or unsigned) to match.

## What the flags tell you

After an arithmetic instruction:

| Flag | Set when |
|---|---|
| **Z** | The whole result is zero |
| **N** | The top bit of the result is 1 (bit 7, 15 or 31 depending on size) |
| **C** | A carry came out of the top bit (add) or a borrow was needed (subtract) |
| **V** | The signed result does not fit: two positives gave a negative, or two negatives gave a positive |
| **X** | A copy of C kept for multi-precision arithmetic; moves do not change it |

### Worked examples (byte adds)

| Operation | Result | N | Z | V | C | Why |
|---|---|---|---|---|---|---|
| $7F + $01 | $80 | 1 | 0 | **1** | 0 | 127 + 1 should be 128, but a signed byte tops out at 127 |
| $FF + $01 | $00 | 0 | **1** | 0 | **1** | 255 + 1 wraps to 0 with a carry out (as signed: −1 + 1 = 0, no overflow) |
| $80 + $80 | $00 | 0 | 1 | **1** | **1** | −128 + −128 overflows signed; 128 + 128 carries unsigned |

> Adding a positive and a negative number can never overflow. Overflow needs two operands of the same sign.

## Memory sizes from address lines

n address lines reach 2ⁿ bytes: 10 lines = 1 KB, 16 lines = 64 KB, 20 lines = 1 MB, 24 lines (the 68000) = 16 MB, 32 lines = 4 GB.
` },

    /* ===================================================== */
    { id: 'programmers-model', title: 'The 68000 programmer\'s model', lesson: 'L3', icon: '🗂️', practice: ['regs', 'Flag Flipper'], summary: 'Registers D0-D7, A0-A7, PC, CCR, user vs supervisor mode.', md: `
The **programmer's model** is the part of the processor you can see from assembly: the registers, the flags, and the instruction set with its addressing modes.

## Registers

\`\`\`
 31            16 15             0
 D0 ..................................   8 data registers D0-D7, 32 bits each
 ...
 D7
 A0 ..................................   address registers A0-A6
 ...
 A6
 A7  (SP)  user stack pointer            A7 and A7' are banked:
 A7' (SSP) supervisor stack pointer      only one is visible at a time
 PC        program counter               address of next instruction
 CCR  X N Z V C                          low 5 bits of the status register
\`\`\`

### Data registers (D0 - D7)

General-purpose variables. A byte, word or long operation uses the low 8, 16 or 32 bits. **A byte or word operation changes only that low part; the upper bits are left alone.**

\`\`\`
D0 = $12345678
ADD.B  #1,D0     -> D0 = $12345679    (only the low byte changes)
CLR.W  D0        -> D0 = $12340000
\`\`\`

### Address registers (A0 - A7)

Hold memory addresses. They can only be word or long: **there are no byte addresses**. Word results are sign-extended to 32 bits (so $8000 becomes $FFFF8000). Address registers are your tool for "walking" through memory.

A7 is the **stack pointer**. EASy68K lets you write \`SP\` instead of \`A7\`.

## Two modes

- **User mode** can run only a subset of the instructions, which stops applications interfering with each other under an operating system.
- **Supervisor mode** can run everything. It uses its own stack pointer, A7'.

## The condition code register (CCR)

Five flags, X N Z V C, change with most instructions. Put the instruction that sets them directly before the branch that tests them, because the next instruction will probably overwrite them.

| Instruction | N, Z | V, C | X |
|---|---|---|---|
| MOVE, AND, OR, EOR | set from result | cleared | unchanged |
| ADD, SUB | set | set | set (= C) |
| CMP | set | set | unchanged |
| MOVEA, LEA, ADDA, SUBA | unchanged | unchanged | unchanged |
| ADDQ, SUBQ to an address register | unchanged | unchanged | unchanged |

## Little tricks worth remembering

- \`MOVEA\` changes **no** flags, so \`MOVEA.W #0,A3\` followed by \`BNE\` branches on stale flags (the lecture's trick question).
- Address registers work as pointers: \`(A0)\` means "the memory that A0 points to".
- A word or long access must start on an **even** address. On a real 68000 a violation raises an address error exception (the course slides do not cover this; the sandbox reports it).
` },

    /* ===================================================== */
    { id: 'machine-code', title: 'From assembly to machine code', lesson: 'L4-5', icon: '🧬', practice: ['num', 'Number Ninja'], summary: 'How the op-code word is built and why there are eight modes.', md: `
An **assembler** turns assembly text into machine code, one instruction at a time. Each 68000 instruction is at least one 16-bit **op-code word**, followed by zero to four extension words.

## The op-code word

The first word contains everything the processor needs to decode the instruction:

1. What to do (ADD, AND, MOVE...)
2. The size (byte, word, long)
3. Where the source is (register or memory)
4. Where the result goes
5. Extras such as post-increment or pre-decrement

It also tells the processor how many more words to fetch.

## Worked example: ADD.B D0,(A0) = $D110

\`\`\`
bit: 15 14 13 12 | 11 10 9 | 8 7 6 | 5 4 3 | 2 1 0
      1  1  0  1 |  0  0 0 | 1 0 0 | 0 1 0 | 0 0 0
      ADD        | reg D0  | byte, | mode 2| reg 0
                 |         | Dn->EA| (An)  | = A0
\`\`\`

The 6-bit **effective address (EA) field** (bits 5-0) is a 3-bit mode plus a 3-bit register number. The 3-bit mode field gives eight mode codes (0-7), and mode 7 is split by its register field into absolute, immediate and PC-relative forms, so the 68000 offers more than eight addressing modes. The 3-bit register field is why there are eight data and eight address registers.

Note that field boundaries do not line up with hex digits, which is why $D110 looks unrelated to the bit pattern at a glance.

## Examples from the lectures

| Assembly | Machine code | Words |
|---|---|---|
| \`NOP\` | \`$4E71\` | 1 |
| \`MOVE.B D0,D3\` | \`$1600\` | 1 |
| \`ADD.L D4,D7\` | \`$DE84\` | 1 |
| \`ADDI.W #$4000,D5\` | \`$0645 $4000\` | 2 |
| \`MOVE.W (A6),$4000A000\` | \`$33D6 $4000 $A000\` | 3 |
| \`ADDI.W #$AA55,$5A33A706\` | \`$0679 $AA55 $5A33 $A706\` | 4 |
| \`MOVE.B $AA550000,$5A33A706\` | \`$13F9 $AA55 $0000 $5A33 $A706\` | 5 (longest) |

## Reading a list file

The assembler can print a **list file**: address, machine code, line number, source.

\`\`\`
00001000  41F9 00001036   LEA  DATA,A0     <- op-code $41F9 then a 32-bit address
00001006  43F9 0000103A   LEA  MAX_NUM,A1
0000100C  1018            MOVE.B (A0)+,D0  <- one word
0000100E  1218            MOVE.B (A0)+,D1
00001010  B001            CMP.B D1,D0
00001012  6C00 0004       BGE  NEXT1       <- branch: op-code + 16-bit displacement
\`\`\`

Each address is the previous address plus the previous instruction's length. The **symbol table** at the end of the list file maps each label to its address.

## Why the machine-language view matters

- Instructions are **atomic**: once started, they run to completion (the lecture notes this is not strictly true of modern processors).
- Absolute addresses cost extra extension words (and extra memory cycles), which is one reason registers and pointers are preferred.
- A branch is stored as a signed **displacement** from the PC, so it works wherever the program is loaded (relocatable code).
` },

    /* ===================================================== */
    { id: 'syntax', title: 'Writing assembly: syntax and directives', lesson: 'L4', icon: '📝', practice: ['dirs', 'Bug Hunt'], summary: 'Line format, labels, comments, and every directive you need.', md: `
## The format of a line

\`\`\`
LABEL    OPCODE.SIZE  OPERAND1,OPERAND2   * COMMENT
loop     ADD.B        (A0)+,D1            * add a byte
\`\`\`

- **Label:** optional, must start in column 1. A label is a name for that line's address; it makes the assembler compute branch targets for you.
- **Opcode:** begins after the first whitespace. Add a size suffix \`.B\`, \`.W\` or \`.L\` where it matters (do not rely on defaults: different assemblers differ).
- **Operands:** separated by a **comma with no spaces**. For two operands, the **source comes first, destination last**.
- **Comment:** starts with \`*\` or \`;\`. A whole-line comment starts in column 1.
- Each instruction fits on one line.

| Operands | Example |
|---|---|
| none | \`NOP\` |
| one | \`BRA FOO\` |
| two | \`ADD.W D0,D3\` (adds D0's word to D3's word, result in D3) |

## Directives (pseudo-ops)

Directives instruct the **assembler**; they are not CPU instructions. Only \`MACRO\` can generate executable code.

| Directive | Meaning | Example |
|---|---|---|
| \`ORG\` | Where the code will run in memory | \`ORG $1000\` |
| \`EQU\` | Name a constant (like \`#define\`) | \`max_cnt EQU 10\` |
| \`SET\` | Like EQU but redefinable later | \`counter SET 0\` |
| \`REG\` | Name a register list for \`MOVEM\` | \`save REG A0-A3/D0-D7\` |
| \`DC.size\` | Define constants in memory | \`DC.B 'Hi',$0D,$0A,$00\` |
| \`DCB.size\` | Fill a block with one value | \`DCB.B 100,$AA\` |
| \`DS.size\` | Reserve uninitialised space | \`DS.L 200\` (= 800 bytes) |
| \`END\` | End of source (and where to start) | \`END START\` |
| \`OPT\` | Assembler options | \`OPT CRE\` |
| \`MACRO\` / \`ENDM\` | Group instructions under one name | see below |

\`ORG\` and \`END\` are complementary: ORG tells the assembler how to resolve addresses, while END tells the loader where to put and start the code.

### A macro

\`\`\`
max_err EQU   5
ERR   MACRO                  * macro named ERR
      MOVE.W (A4),D2         * load error count
      CMPI.W #max_err,D2     * reached max?
      BEQ    \\1              * exit; \\1 = first argument
      ENDM
      ERR    done            * expands the body with \\1 = done
done  SIMHALT
\`\`\`

## EASy68K specifics

- \`SIMHALT\` stops the simulator. It is **not a real 68000 instruction**; on hardware you could use \`done BRA done\`.
- \`TRAP #15\` with \`D0 = 9\` also halts; \`STOP #$2700\` appears in some lecture programs.
- Hex numbers use \`$\`, binary \`%\`, octal \`@\`.

## Good habits

- Put a **header block** at the top: what the program does.
- Define constants with \`EQU\` so numbers have names and live in one place.
- Comment almost every line: assembly is cryptic.
- **Flow chart first**: rectangles for operations, diamonds for decisions. It saves time and prevents avoidable errors.
- Start the stack pointer yourself (\`LEA stack,SP\`).

> Assembly gives you total control: you can overwrite memory, trash variables, ignore constants and even write self-modifying code. Nothing will stop you, so be careful.
` },

    /* ===================================================== */
    { id: 'instructions', title: 'Instruction reference', lesson: 'L4-5', icon: '⚙️', practice: ['inst', 'Register Tracer'], summary: 'Every instruction from the lectures: syntax, effect, flags.', md: `
Notation: **src** = source, **dst** = destination, **Dn** = data register, **An** = address register, **ea** = any addressing mode that is legal for that operand.

## Data movement

| Instruction | Does | Flags |
|---|---|---|
| \`MOVE.s src,dst\` | Copy src to dst (src unchanged). Destination cannot be An or immediate. | N,Z set; V,C cleared; X unchanged |
| \`MOVEA.s src,An\` | Copy into an address register; a word source is sign-extended to 32 bits. | none |
| \`MOVEQ #n,Dn\` | Load a small constant (−128..127) into all 32 bits, sign-extended. | N,Z set; V,C cleared |
| \`LEA ea,An\` | Load the **address** of ea (not its contents) into An. | none |
| \`MOVEM.s list,-(SP)\` | Push several registers (save on entry). | none |
| \`MOVEM.s (SP)+,list\` | Pop several registers (restore before RTS). | none |
| \`EXG Rx,Ry\` | Swap two registers. | none |
| \`SWAP Dn\` | Swap the two 16-bit halves of Dn. | N,Z set; V,C cleared |
| \`CLR.s ea\` | Set ea to zero. | N=0, Z=1, V=0, C=0 |

## Arithmetic

| Instruction | Does | Flags |
|---|---|---|
| \`ADD.s src,dst\` | dst = dst + src | X N Z V C |
| \`ADDI.s #n,dst\` | Add an immediate value | X N Z V C |
| \`ADDQ.s #1..8,dst\` | Quick add of 1-8. To An: whole register, no flags. | X N Z V C (not for An) |
| \`SUB.s src,dst\` | dst = dst − src | X N Z V C |
| \`SUBI\`, \`SUBQ\` | Immediate and quick subtract | as SUB (SUBQ to An: whole register, no flags) |
| \`ADDA\`, \`SUBA\` | Add/subtract to an address register | none |
| \`NEG.s ea\` | ea = 0 − ea | X N Z V C |
| \`CMP.s src,Dn\` | Computes **Dn − src**, keeps only the flags | N Z V C (X unchanged) |
| \`CMPI\`, \`CMPA\` | Compare with an immediate / an address register | as CMP |
| \`TST.s ea\` | Compare ea with zero (ea cannot be An on the 68000) | N,Z set; V,C cleared |

> **CMP vs SUB:** both subtract the source from the destination. SUB stores the result; CMP throws it away and only sets the flags, so the operands are unchanged.

## Logic

| Instruction | Does |
|---|---|
| \`AND.s\`, \`ANDI\` | Bitwise AND: clear bits / isolate bits with a mask |
| \`OR.s\`, \`ORI\` | Bitwise OR: set bits |
| \`EOR.s\`, \`EORI\` | Exclusive OR: flip bits |
| \`NOT.s ea\` | Invert every bit |

All set N and Z from the result, clear V and C, and leave X unchanged.

## Program control

| Instruction | Does |
|---|---|
| \`BRA label\` | Branch always (goto), PC-relative |
| \`Bcc label\` | Branch if condition true (see the branches guide) |
| \`BSR label\` | Push return address, branch |
| \`JSR ea\` | Push the return address, jump to the address given by a control-mode ea (absolute, \`(An)\`, \`d(An)\`, PC-relative) |
| \`JMP ea\` | Jump (no return address) |
| \`RTS\` | Pop return address into PC |
| \`RTE\` | Return from exception/interrupt (privileged): restores SR, then PC |
| \`TRAP #n\` | Software exception through vector 32+n (used for OS calls; EASy68K I/O uses \`TRAP #15\`) |
| \`STOP #n\` | Load #n into the status register (privileged) and halt until an interrupt. In EASy68K, \`STOP #$2700\` ends the run; \`SIMHALT\` is the usual choice. |
| \`NOP\` | Do nothing (machine code $4E71) |

## Rules of thumb

- **Address registers** only support word and long sizes.
- The CPU has no MOVE to an address register: use **MOVEA** or **LEA**. EASy68K quietly converts \`MOVE\` to \`MOVEA\`, but other assemblers may reject it.
- The \`I\` forms (ADDI, CMPI, ANDI, SUBI, ORI) are the real instructions behind \`ADD #n\`, \`CMP #n\`, etc. EASy68K converts automatically, but other assemblers may reject it.
- The 68000 has **no** conditional JMP, JSR or RTS: only conditional **branches**.
` },

    /* ===================================================== */
    { id: 'modes', title: 'Addressing modes in depth', lesson: 'L5', icon: '🎯', practice: ['modes', 'Mode Match'], summary: 'Where the operand lives: modes 0-7 with pictures and examples.', md: `
An **addressing mode** tells the processor where to find an operand and what to do with the address afterwards. Each instruction accepts only certain modes for its source and destination (for example \`MOVE.W D0,D1\` is legal, \`MOVE.W D0,A1\` is not a real MOVE form but \`MOVEA.W D0,A1\` is; EASy68K quietly converts the first into the second).

## The eight modes

| Mode | Name | Syntax | Operand is... |
|---|---|---|---|
| 0 | Data register direct | \`D3\` | in the data register |
| 1 | Address register direct | \`A3\` | in the address register |
| 2 | Address register indirect | \`(A3)\` | in memory at the address in A3 |
| 3 | Post-increment | \`(A3)+\` | as mode 2, then A3 += size |
| 4 | Pre-decrement | \`-(A3)\` | A3 −= size first, then as mode 2 |
| 5 | Indirect with displacement | \`(d16,A3)\` | in memory at A3 + 16-bit signed d |
| 6 | Indirect with index | \`(d8,A3,Xn)\` | in memory at A3 + Xn + 8-bit signed d |
| 7 | Special: abs.W, abs.L, PC-relative, immediate | \`($1234).W\`, \`($00001234).L\`, \`(d16,PC)\`, \`#5\` | see below |

The parentheses mean **indirect**: the register holds a *pointer* to the data, not the data itself.

## Modes 0 and 1: register direct

Fast and compact: only three bits in the op-code word name the register and no memory access is needed. \`ADD.B D0,D1\`.

## Mode 2: register indirect

\`\`\`
A3 = $00A34000   D3 = $F34CEF00
MOVE.L D3,(A3)   -> writes $F34CEF00 to the memory at $00A34000
\`\`\`

Because the address is in a register, you can do **arithmetic on addresses**, which makes loops over arrays easy.

## Modes 3 and 4: auto-increment and decrement

The step equals the operand size: **1 for .B, 2 for .W, 4 for .L** (a byte access through A7 steps by 2, to keep the stack word-aligned).

\`\`\`
MOVE.B D0,(A2)+     A2 += 1
MOVE.W D1,(A6)+     A6 += 2
MOVE.L D4,(A3)+     A3 += 4
\`\`\`

Example: A0 = $1000, memory at $1000 = $57, D0 = $3A. \`ADD.B (A0)+,D0\` gives D0 = $91 and A0 = $1001.

These two modes **are** the stack: **PUSH = pre-decrement \`-(SP)\`**, **POP = post-increment \`(SP)+\`**.

## Mode 5: displacement

\`(d16,An)\` adds a signed 16-bit offset. Compilers use it for variables: A5 points to a block of variables and each one lives at a fixed offset.

\`\`\`
A5 = $00BC9A00,  displacement = $3AE4   ->  address $00BCD4E4
\`\`\`

## Mode 6: index

\`(d8,An,Xn.size)\`: base register + index register (word or long) + small displacement. Ideal for 2-D arrays.

Worked example from the lecture: a 50 × 50 array of longs at $4000, element (row 23, column 11).

\`\`\`
index        D0 = 23 x 50 x 4 = 4600 = $11F8
displacement     = 11 x 4     =   44 = $2C
MOVE.L ($2C,A0,D0.W),D3     with A0 = $00004000
\`\`\`

## Mode 7: special modes

| Sub | Name | Notes |
|---|---|---|
| 0 | Absolute short \`(xxx).W\` | 16-bit address, **sign-extended**: reaches only $000000-$007FFF and $FF8000-$FFFFFF |
| 1 | Absolute long \`(xxx).L\` | full 32-bit address; takes extra words and memory cycles |
| 2 | PC with displacement | EA = PC + d16: **relocatable code** |
| 3 | PC with index | EA = PC + Xn + d8 |
| 4 | Immediate \`#n\` | a literal; **source only** |

The lecture text also calls immediate "subclass 5" on one slide; the encoding is 100 binary (4).

### Why avoid absolute addressing?

It prevents relocation, slows the processor (extra fetches) and uses extra memory. For an address you use repeatedly, load it into an address register. Absolute short is the worst offender: the sign extension makes $008000-$FF7FFF unreachable and is a classic source of bugs.

## Immediate: a reminder

\`#\` means "number", \`$\` means "hex". \`MOVE.B #24,D0\` and \`MOVE.B #$24,D0\` load different values.
` },

    /* ===================================================== */
    { id: 'branches', title: 'Branches, conditions and loops', lesson: 'L5', icon: '🔀', practice: ['flow', 'Branch Oracle'], summary: 'How CMP and Bcc make decisions, signed vs unsigned, loop patterns.', md: `
A computer makes decisions by changing the program counter. **A conditional branch** reads the flags and either jumps or falls through. The pattern is always the same:

1. An instruction **sets the flags** (CMP, TST, or any arithmetic/logic op).
2. A Bcc tests them, ideally the **very next** instruction (only flag-preserving instructions such as \`LEA\` or \`MOVEA\` may sit in between).

## The key flags

- \`BEQ\` branches if **Z = 1** (the result was zero, e.g. operands equal). \`BNE\` branches if Z = 0.
- \`BMI\` branches if **N = 1** (negative). \`BPL\` if N = 0.
- \`BCS\` / \`BCC\`: carry set / clear. \`BVS\` / \`BVC\`: overflow set / clear.

## Comparing: signed vs unsigned

\`CMP D0,D1\` computes **D1 − D0** and sets the flags. Which branch you use depends on whether your numbers are signed or unsigned.

| Relation | Signed | Unsigned |
|---|---|---|
| D1 < D0 | \`BLT\` | \`BCS\` (borrow) |
| D1 ≤ D0 | \`BLE\` | \`BLS\` |
| D1 = D0 | \`BEQ\` | \`BEQ\` |
| D1 ≠ D0 | \`BNE\` | \`BNE\` |
| D1 > D0 | \`BGT\` | \`BHI\` |
| D1 ≥ D0 | \`BGE\` | \`BCC\` |

### Why they differ

The byte $FF is 255 unsigned but −1 signed. With D0 = 1 and D1 = $FF: unsigned, D1 > D0 (BHI taken); signed, D1 < D0 (BLT taken). Same bits, different meaning.

| Condition | Flags tested |
|---|---|
| EQ / NE | Z = 1 / Z = 0 |
| CS / CC | C = 1 / C = 0 |
| HI | C = 0 and Z = 0 |
| LS | C = 1 or Z = 1 |
| GE / LT | N = V / N ≠ V |
| GT | Z = 0 and N = V |
| LE | Z = 1 or N ≠ V |

## How a branch works

A branch adds a signed **displacement** to the PC: 8-bit (−128 to +127 bytes) or 16-bit (−32768 to +32767 bytes). It is relative, so the code runs anywhere in memory. \`BRA\` is the unconditional version (a goto). \`JMP\` loads the PC from any control address (absolute, \`(An)\`, PC-relative). The 68000 has **no conditional jump**, only conditional branches.

## Building loops

Assembly has no \`for\` or \`while\`. You build them from compare, branch and a counter.

### WHILE-style (test at the top)

\`\`\`
        LEA    st_addr,A0
        LEA    end_addr,A1
loop    CMPA.L A1,A0         * reached the end?
        BEQ    done
        CLR.L  (A0)+         * body: clear a long, advance pointer
        BRA    loop
done    ...
\`\`\`

### FOR-style (counter)

\`\`\`
        MOVE.B #1,D0         * counter
        MOVE.B #10,D1        * terminal value
for     CMP.B  D0,D1
        BEQ    next_code
        ...                  * loop body
        ADDQ.B #1,D0
        BRA    for
next_code
\`\`\`

### Countdown with SUBQ (the compact classic)

\`\`\`
        MOVE.B #5,D0         * five numbers
        LEA    Table,A0
        CLR.W  D1
loop    ADD.B  (A0)+,D1      * REPEAT add a number
        SUBQ.B #1,D0         * decrement counter (sets Z at 0)
        BNE    loop          * UNTIL counter is zero
\`\`\`

### DO/WHILE-style

The body always executes at least once, because the test is at the bottom:

\`\`\`
test_loop  JSR    subroutine
           CMPI.B #test_value,(A2)+
           BNE    test_loop
\`\`\`

### Counted loop with DBRA

\`DBRA\` (also written \`DBF\`) is the 68000's counted loop, the equivalent of the Z80's \`DJNZ\`:

\`\`\`
        MOVEQ  #4,D0         * N - 1: five passes
loop    ...                  * body
        DBRA   D0,loop       * D0 = D0 - 1; branch unless D0 is now -1
\`\`\`

It subtracts 1 from the **low word** of the counter and branches unless the result is **−1**, so you load N − 1 (the Z80's \`DJNZ\` stops at 0 and takes N). \`DBRA\` is not on the slides; it is the \`DBcc\` family from the 68000 manual, whose other members also stop early when a condition is true. The **Compare** page runs it next to \`DJNZ\`.

## Testing a single bit

Mask everything except the bit, then test for zero:

\`\`\`
mask    EQU    %0000001000000000     * isolates bit 9
        MOVE.W #mask,D0
        AND.W  D0,D6                 * clear all other bits
        BNE    bit9_is_1             * non-zero -> the bit was 1
\`\`\`
` },

    /* ===================================================== */
    { id: 'stack', title: 'The stack and subroutines', lesson: 'L5', icon: '📚', practice: ['flow', 'Program Sorter'], summary: 'Push, pop, JSR, RTS, MOVEM and parameter passing.', md: `
The **stack** is a block of memory used last-in, first-out. It is how subroutines (the assembly version of C functions and Java methods) work.

## How the 68000 stack behaves

- It lives in RAM and **grows downward**, from high addresses to low.
- The stack pointer (SP = A7) holds the address of the last item pushed.
- **PUSH** = write with **pre-decrement**: \`MOVE.W D0,-(SP)\`
- **POP** = read with **post-increment**: \`MOVE.W (SP)+,D0\`

\`\`\`
before:  SP = $01000000
MOVE.L #$87654321,-(SP)
after:   SP = $00FFFFFC           (dropped by 4)
         $00FFFFFC: 87 65        (big-endian: high word first)
         $00FFFFFE: 43 21
\`\`\`

Initialise the stack pointer yourself at the start of a program (\`LEA stack,SP\`) to the top of RAM; without a valid stack pointer the first subroutine call corrupts memory or crashes. (The EASy68K simulator presets SP to \`$01000000\`, but real hardware does not.) (A real 68000 loads the initial value from the exception vector table at power-up.)

## Subroutine calls

| Instruction | Does |
|---|---|
| \`JSR ea\` | Pushes the address of the *next* instruction (4 bytes), then jumps to any control-mode address (usually an absolute label) |
| \`BSR label\` | The same, but PC-relative |
| \`RTS\` | Pops that return address into the PC |

The caller continues right after the JSR, as if nothing happened. Calls can be **nested**. The one rule: just before \`RTS\`, the return address must be on top of the stack, so every push inside the routine must be matched by a pop.

## Saving registers: MOVEM

A subroutine should not trample its caller's registers. Save what you use on entry; restore on exit:

\`\`\`
double   MOVEM.L D1,-(SP)     * save D1
         MOVE.B  D0,D1
         ADD.B   D1,D0        * D0 = D0 * 2
         MOVEM.L (SP)+,D1     * restore D1
         RTS
\`\`\`

For several registers use a list: \`MOVEM.L D0-D3/A0-A2,-(SP)\`. The \`REG\` directive can name a list: \`save REG D0-D3/A0-A2\`, then \`MOVEM.L save,-(SP)\`. Registers are always stored in a fixed order, whatever order you write them in.

## A good subroutine

1. Stack established before the first call.
2. Place subroutines after the main program.
3. A **header comment block**: name, what it does, registers used and saved, parameters in and out.
4. The first line has a label with the subroutine's name.
5. Save used registers on entry, restore on exit.
6. Return with \`RTS\`.

### Passing parameters

You must agree on a mechanism. The lecture's memory-test subroutine \`do_test\` takes its parameters in registers: A0 = start address, A1 = end address, A2 = pointer to the test pattern, A3 = pointer to the bad-address list, A4 = pointer to the bad count, D7 = maximum errors. Its header comment states this "API" so a reader never has to guess.

## BSR or JSR?

Both push the return address. BSR is relative (works if the program is moved, shorter), JSR takes an absolute address (reaches any location, even far away).

> A subroutine in assembly is a function call in C. The stack is also what C compilers use for local variables and scope.
` },

    /* ===================================================== */
    { id: 'memory', title: 'Memory, buses and address decoding', lesson: 'L6-7', icon: '🧱', practice: ['hw', 'Hardware Lab'], summary: 'Tri-state buses, chip selects, pages, endianness, SRAM vs DRAM.', md: `
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

With n address lines a processor can address 2ⁿ bytes. The 68000 brings out address lines A1-A23 (the \`~UDS\`/\`~LDS\` strobes stand in for A0): a 24-bit address, 16 MB. That is the *capability*, not what is fitted.

To build memory from chips, split the address:

- **Offset bits** (low address bits) go straight to the chip's address pins.
- **Page bits** (high address bits), plus ADDRESS VALID, go to **decoder** logic that asserts exactly one chip select.

Example: 32 KB chips on a 24-bit bus. 32 KB = 2¹⁵, so A0-A14 are offset bits and A15-A23 (9 bits) select one of 512 pages. A page that responds to $FF8000-$FFFFFF is selected when A15-A23 are all 1.

### Chip organisation does not change the chip count

Building 1 MB (20 address lines, 8-bit data) from any of these takes 8 chips:

| Chip | Pages | Page bits | Offset bits |
|---|---|---|---|
| 1M × 1 | 1 | none | A0-A19 |
| 512K × 2 | 2 | A19 | A0-A18 |
| 256K × 4 | 4 | A18-A19 | A0-A17 |
| 128K × 8 | 8 | A17-A19 | A0-A16 |

The page address ranges for 256K × 4: page 0 = $00000-$3FFFF, page 1 = $40000-$7FFFF, page 2 = $80000-$BFFFF, page 3 = $C0000-$FFFFF. When page boundaries don't fall on hex digits (as with 128K), **write the addresses in binary**.

### Decoder tools

- A **74x138** (3:8 decoder) with three enables splits space into 8 regions, e.g. eight 2 MB regions of the 68000's space. Add a second 138 and another address bit for 16 regions.
- Gates (NAND/OR) can decode one page. A small **memory used as a lookup table** can decode many pages at once.

## Paging to extend the address space

A Z80 with 64 KB can reach 1 MB by writing a page number to a special register that selects which of sixteen 64 KB chips is mapped in. Code at the top of each page switches pages and jumps. The 80x86 uses segment × 16 + offset in a similar spirit.

## Word widths and byte lanes

On a 16-bit bus the A0 line is **implied**: the CPU asks for words at even addresses, and two write strobes (WR0, WR1) select which byte lane(s) are written. A byte write asserts one strobe, a word write both. On a 32-bit bus, four strobes (WR0-WR3). So:

- **Byte** access: any address.
- **Word** access: even addresses.
- **Long word** access: also even addresses on a 68000 (the lecture's "divisible by 4" rule describes 32-bit buses).

## Endianness

Storing the word $AA55 at $1000-$1001:

| Order | $1000 | $1001 | Used by |
|---|---|---|---|
| **Big-endian** | AA | 55 | MC68000 |
| **Little-endian** | 55 | AA | Z80, Intel x86 |

The problem appears as soon as the bus is wider than 8 bits.

## SRAM vs DRAM

| | SRAM | DRAM |
|---|---|---|
| Cell | Cross-coupled inverters, 6 transistors | 1 transistor + 1 capacitor |
| Speed | Fast, simple interface | Slower, complex interface |
| Refresh | None | Required (charge leaks) |
| Use | Caches, small fast memory | Bulk memory |

DRAM is addressed as rows and columns: the row address is clocked in with **~RAS**, then the column address with **~CAS**. A 64 Mbit DRAM has 8192 × 8192 cells (13 row + 13 column bits). Touching a row refreshes all its cells. In the lecture's example, refreshing 8192 rows every 16.384 ms needs a refresh cycle every 2 µs (16.384 ms ÷ 8192; real parts typically specify around 64 ms, i.e. about 7.8 µs per row), which noticeably interrupts the CPU's access, so modern systems use caches and DRAM controllers.

## Timing must match

The processor's read-cycle timing and the memory's read timing have to be compatible. Decoding logic eats into the cycle: one decoder's delay can cost tens of nanoseconds. The checklist: gather datasheets, extract timings, compute the worst-case arrival of address, ~OE and ~CE for a read, work out when the CPU samples the data, compare with the memory's needs. If it fails, add **wait states** or choose faster memory. Also allow for temperature, process and board trace variation.

## A typical 68K memory map

Low memory holds the **exception vector table** (including the initial stack pointer and start address); ROM, RAM and peripheral devices are placed by the designer in the rest of the 16 MB.
` },

    /* ===================================================== */
    { id: 'transistor', title: 'Transistors as switches', lesson: 'L8', icon: '💡', practice: ['io', 'Hardware Lab'], summary: 'Driving real loads from an I/O pin: the base resistor, saturation, worst case.', md: `
A microcontroller pin supplies only about 1 to 20 mA at 3.3-5 V. Real loads (motors, relays, lamps) may need amps or hundreds of volts. A transistor lets the pin *control* a bigger supply.

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

    /* ===================================================== */
    { id: 'z80', title: '68000 vs Z80 side by side', lesson: 'L3-5', icon: '🆚', practice: ['z80', 'Quiz Blitz'], summary: 'Two CISC processors, many differences in notation and behaviour.', md: `
The course uses two processors: the **68000** (32-bit registers, 16-bit data bus) (clean, regular, big-endian) and the 8-bit **Z80** (simple bus timing, small register set, little-endian). Ideas transfer between them even when the notation does not.

## Quick comparison

| | 68000 | Z80 |
|---|---|---|
| Width | 8/16/32-bit data, 24-bit address | 8-bit data, 16-bit address |
| Registers | D0-D7, A0-A7 | A, F, B, C, D, E, H, L (+ alternate set), IX, IY, SP, PC, I, R |
| Arithmetic | Any data register | Accumulator **A** for 8-bit arithmetic (16-bit adds use HL, IX, IY) |
| Byte order | Big-endian | Little-endian |
| Hex notation | \`$55\` | \`55H\` (\`0FFH\`: a leading 0 before A-F) |
| Indirect | \`(A0)\` | \`(HL)\` (some assemblers also accept \`[HL]\`) |
| Flags | X N Z V C | S Z H P/V N C |
| Package | 64-pin | 40-pin |

## Instruction translations

| What | 68000 | Z80 |
|---|---|---|
| Copy register to register | \`MOVE.B D0,D1\` | \`LD B,A\` |
| Load a constant | \`MOVE.B #$55,D1\` | \`LD C,55H\` |
| Load through a pointer | \`MOVE.B (A0),D1\` | \`LD B,(HL)\` |
| Store to a fixed address | \`MOVE.B D0,$0000FF35\` | \`LD (0FF35H),A\` (only A can) |
| Compare | \`CMP.B D0,D1\` | \`CP B\` (compares B against A) |
| Branch if zero | \`BEQ label\` | \`JR Z,label\` |
| Jump | \`JMP $ABCD\` | \`JP 0ABCDH\` |
| Call / return | \`JSR\` / \`RTS\` | \`CALL\` / \`RET\` |
| Return from interrupt | \`RTE\` | \`RETI\` (maskable interrupts; \`RETN\` for NMI) |
| Conditional call/return | **does not exist** | \`CALL cc,nn\` / \`RET cc\` |
| Conditional absolute jump | **does not exist** | \`JP cc,nn\` |

## Directive translations

| Purpose | 68000 | Z80 |
|---|---|---|
| Origin | \`ORG\` | \`ORG\` |
| Equate | \`EQU\` | \`EQU\` |
| Define byte | \`DC.B\` | \`DEFB\` |
| Define word | \`DC.W\` | \`DEFW\` |
| Reserve bytes | \`DS.B n\` | \`DEFS n\` |
| End | \`END\` | \`END\` (the Oshonsoft assembler wants \`.END\`) |

## Z80 fast tricks

- **Register pairs:** BC, DE and HL join 8-bit registers into 16-bit ones for pointers and 16-bit math.
- **Alternate register set:** \`EXX\` swaps BC/DE/HL with their alternates and \`EX AF,AF'\` swaps AF in one instruction, which makes interrupt handlers fast.
- **Stack:** \`PUSH BC\` / \`POP BC\`; \`CALL\` pushes the PC; the stack grows toward lower addresses.

## Why compare them?

The 68000's bus cycle is more complicated; the Z80's is simple enough to watch on a logic analyser, which is why it is used for debugging labs. The 68000's instruction set is easier to read. Assembly language is not portable: a program for one architecture will not run on another. A C++ program, once recompiled, might.
` },
    /* ===================================================== */
    { id: 'workflow', title: 'Using EASy68K: from source file to running program', lesson: 'HW2', icon: '🛠️', practice: ['dirs', 'Bug Hunt'], summary: 'Source, listing and S-record files, assembling, single-stepping, and reading the memory window.', md: `
This guide follows the workflow from Homework 2: write a source file, assemble it, and run it in an **instruction set simulator** (ISS). Everything here also works in this site's **Sandbox**, which behaves like EASy68K.

## The tool chain

\`\`\`
  you type          assembler           loader / simulator
  HW2.X68  ──────►  HW2.L68  (listing)
  (source)   F9     HW2.S68  (S-record) ──►  Sim68K runs it as if it were a 68000
\`\`\`

| File | What it is | When it exists |
|---|---|---|
| \`.X68\` | Your assembly source (plain text) | You write it. Always save with the .X68 extension |
| \`.L68\` | The **list file**: addresses, machine code, your source, errors, symbol table | Always, even when there are errors |
| \`.S68\` | The executable, as a **Motorola S-record** | Only when there were no assembly errors |

An **ISS** is a program on your PC that executes the object code and behaves like the target CPU, so you can run and inspect programs without a real 68000.

## Steps (EASy68K)

1. Install EASy68K from easy68k.com (Windows). On a Mac the course notes suggest running it under Wine; there is also an open-source native macOS port, and this site's Sandbox needs no install.
2. Open the editor. It gives you a template with a title block and the line \`ORG $1000\`.
3. **Type the program in** (do not paste). Pasted text can carry invisible formatting characters that produce baffling assembly errors. Name it \`HW2.X68\` and save before doing anything else.
4. Keep the layout rules: labels (including the names on \`EQU\` lines) start in **column 1**; instructions and directives start in **column 2 or later**, usually one tab in; comment lines start with \`*\`.
5. Assemble with **F9** (or the Project tab, or the green arrow). If there are errors, open the \`.L68\` file: the offending lines are marked "ERROR".
6. With no errors you are asked whether to run the simulation. Choose **EXECUTE**. You can ignore the Sim I/O window and use the main simulator window.
7. **Single-step** and watch the registers change. Open **View > Memory** to see memory.

The sandbox equivalent: **Assemble** (Ctrl+Enter), then **Step**; the right-hand panel shows registers and flags, and the **Memory** tab shows the bytes. Use **Save .X68 / .S68 / .L68** to get the same three files.

## Reading the list file

\`\`\`
00001000  303C A7FF                 13  start   MOVE.W #data2,D0     * Load D0
00001004  123C 004F                 14          MOVE.B #data6,D1     * Load D1
00000000  =00004000                  4  addr1 EQU $4000
\`\`\`

Columns: **address**, **machine code** (the instruction word, then any extension words), **line number**, then your source. An \`EQU\` line shows \`=\` and its value because it generates no code. At the end comes a **symbol table**. Printing the listing in landscape with a small font keeps each instruction on one line.

## S-records

An **S-record** is a text version of the executable. Each line is one record:

\`\`\`
S0 21 0000 36384B50524F47...            header text ("68KPROG ... CREATED BY EASY68K")
S1 23 1000 303CA7FF123C004F...C751FFFF 07  data: 16-bit address $1000, 32 bytes
S8 04 001000 EB                         start address $001000
\`\`\`

- **Type:** S0 header, S1 data with a 16-bit address, S2 data with a 24-bit address, S8 start address.
- **Count:** number of bytes that follow (address + data + checksum), in hex.
- **Address and data**, then a **checksum** (the one's complement of the low byte of the sum of count, address and data bytes).

It is the same format you would use to burn code into a programmable memory device, and it is the file the simulator loads.

## Reading memory

The simulator's memory window shows **bytes**, even when your program wrote words or long words. The 68000 is **big-endian**, so the word $4515 stored at $4000 appears as \`45\` at $4000 and \`15\` at $4001.

## Debugging habits

- Single-step the first time through; check each register against what you expect.
- Open the memory window before the run and again after: compare.
- Use a breakpoint (click the dot beside a line in the Sandbox listing) to skip ahead, and **Step back** to undo a step.
- A program that ends with \`BRA start\` runs forever. End test programs with \`SIMHALT\` so Run can finish.
` },

    /* ===================================================== */
    { id: 'errata', title: 'Slide errata and EASy68K quirks', lesson: 'L3-8', icon: '⚠️', practice: ['dirs', 'Bug Hunt'], summary: 'Where the lecture slides disagree with the manuals or the real tool, and how EASy68K bends the rules.', md: `
This site was audited against the lecture slides, Motorola's M68000 Programmer's Reference Manual (PRM), the EASy68K documentation, and a **real EASy68K assembler/simulator** used as a test oracle. Where they disagree, the cards and guides follow the manuals and the tool, and the differences are collected here so you are not surprised on an exam or in a lab. (The audit's full results are on the Tests page.)

## Statements in the slides that are not quite right

| Slide says | Actually | Evidence |
|---|---|---|
| \`END\` tells the loader where to put the code (L4) | \`END <start>\` gives the program's **entry address**; \`ORG\` sets where the code is placed | EASy68K S-records: ORG gives data addresses, END gives the S8 start record |
| \`OPT BRB / BRW / FRS / FRL\` and "use \`OPT FRL\`" (L4, L5) | EASy68K rejects them ("Invalid syntax"); its OPT knows CRE, MEX, SEX, CEX, WAR, BIT. Use size suffixes (\`.S\`, \`.W\`, \`.L\`) | Real assembler |
| MC68000 is "32-bit internal / 16-bit external" (L6) | 32-bit registers and instruction set, but a **16-bit ALU and data paths**; a long operation takes two steps | Motorola 68000 architecture |
| Index mode written \`MOVE.L ($2C,D0,A0),D3\` (L5) | The order is (d8,An,Xn): \`MOVE.L ($2C,A0,D0.W),D3\` | Real assembler rejects the slide's form |
| \`ANDI.W D0,D6\` to mask a bit (L5) | ANDI needs an immediate. Use \`AND.W D0,D6\`, or better \`BTST #9,D6\` | Real assembler: "Invalid addressing mode" |
| Immediate is "Mode 7, subclass 5" (L5, one slide) | Subclass 4 (register field 100). The same lecture also writes it as 100 | Encoding of \`MOVE.B #24,D0\` = \`$103C\` |
| After a push from $00100000, SP is "$FFFFFC" (L5) | $000FFFFC. The slide's diagram addresses are 16 MB values | Arithmetic; checked in the simulator |
| Post-increment adds "one" (L5) | One for **bytes**; 2 for words and 4 for longs. A byte access through A7 adds **2** | PRM; real simulator |
| \`MOVE.W D0,A1\` is illegal (L5) | True of the 68000, but **EASy68K silently assembles it as MOVEA** | Real assembler ($3240) |
| \`CLR.B $00001234\` is \`$4279 $0000 $1234\` (L5) | $4279 is \`CLR.W\`. \`CLR.B\` with an absolute long address is $4239 | Real assembler |
| After \`CMP.W D0,D1\`, "N would be set if D0 > D1" (L3) | N is the sign of the subtraction result and can disagree with the true comparison when V is set. Use the BGT/BLT family, which combine N, V and Z | PRM condition-code tables |
| The vector table ends at $1F (L7 memory map) | The 68000 exception vector table is 1 KB ($000-$3FF) | PRM |
| Harvard architecture "typical of RISC such as ARM Cortex-M" (L3) | Cortex-M0 is von Neumann; M3/M4/M7 are modified Harvard | ARM documentation |
| Z80: \`LD (0FF20H),A\` shown as equivalent to \`MOVE.B D0,$0000FF35\` (L5) | The addresses differ. Use \`LD (0FF35H),A\` | The slide's own operands |
| Z80 accumulator "must be used with any arithmetic or logical operation" (L3) | Only for 8-bit ALU operations. 16-bit adds use HL, IX, IY | Zilog UM0080 |
| Long words must be on multiples of 4 (L6) | On a 68000 they must be on **even** addresses. Multiples of 4 matter for 32-bit buses | PRM address-error rules |
| 3.38 kΩ base resistor (L8) | Exactly 3.30 kΩ with IB = 1.333 mA; the slide rounds IB to 1.3 mA | Arithmetic |
| \`STOP #exit\` / \`STOP #$2700\` "returns to the simulator" (L4-5) | The operand is the new status register value; STOP halts until an interrupt. The simulator just treats it as the end of the run | PRM |

## EASy68K does things the CPU does not

EASy68K is friendlier than a bare assembler, and the sandbox here copies those habits:

- \`ADD #1,D0\`, \`ADDI.W #1,D0\` and \`ADDA.W #5,A0\` become \`ADDQ\` when the constant is 1 to 8 (likewise for SUB). Larger constants use \`ADDI\`, or \`ADDA\` for address registers.
- \`MOVE.L #n,Dn\` becomes \`MOVEQ\` when n is −128 to 127.
- \`MOVE\` to an address register becomes \`MOVEA\`; \`CMP #n,An\` becomes \`CMPA\`; \`CMP #n,(ea)\` becomes \`CMPI\`.
- A backward branch that fits in 8 bits is assembled short automatically; forward branches default to the 16-bit form. \`.S\` forces short.
- Absolute addresses use the short form (16-bit) when the value fits and the long form otherwise; a forward reference to a label is always long.
- Spaces after a comma are tolerated (\`MOVE.B D0, D1\`).
- \`SIMHALT\` ($FFFF $FFFF) is not a 68000 instruction; the simulator uses it to stop.
- The simulator starts in supervisor mode with SP = $01000000 and USP = $00FF0000.

## Where the real tool departs from Motorola's manual

The sandbox follows the manual where the manual defines a behaviour:

- **MULS** : the manual clears V; EASy68K leaves V as it was.
- **DIVU / DIVS overflow:** the manual clears C; EASy68K leaves C as it was.
- **ABCD, SBCD, NBCD:** the N and V flags are "undefined" in the manual, and EASy68K produces particular values for them. Do not rely on either.
- **ASL by a register count larger than the operand size:** the hardware sets V (the sign changed on the first shift); EASy68K leaves V clear.
- **CHK exception frames:** the stacked values differ in minor ways.

> Rule of thumb: if a lab result depends on one of these, the real EASy68K is the reference for grading; if you want to understand the chip, the manual is.
` },
  ];

  /* ---------- Glossary: [term, definition, lesson] ---------- */
  const G = (term, def, lesson, cat) => ({ term, def, lesson, cat });
  const GLOSSARY = [
    G('Absolute addressing', 'The instruction contains the exact memory address of the operand. Needs extra words, blocks relocation, and is slower than register-based addressing.', 'L5', 'Addressing'),
    G('Active low', 'A control signal that is asserted when it is at logic 0, written with a ~ or overbar (~CS, ~OE, ~WE).', 'L6', 'Hardware'),
    G('ADDRESS VALID', 'A status signal showing that the address bus holds a valid address; combined with page bits to select memory.', 'L6', 'Hardware'),
    G('Address bus', 'The unidirectional lines (A0..An) by which the CPU says which memory or I/O location it wants. n lines address 2ⁿ bytes.', 'L3', 'Hardware'),
    G('Address register', 'One of A0-A7. Holds a word or long address used to point into memory. A7 is the stack pointer.', 'L3', '68K'),
    G('Addressing mode', 'The rule that tells an instruction where its operand is (register, memory via pointer, constant...) and what to do with the address afterwards.', 'L5', 'Addressing'),
    G('ALU', 'Arithmetic and Logic Unit: performs arithmetic and logical operations on operands in registers and sets the flags.', 'L3', 'CPU'),
    G('Assembler', 'A program that converts assembly language source into machine code.', 'L4', 'Tools'),
    G('Assembler directive', 'A pseudo-instruction that controls the assembler (ORG, EQU, DC...). It does not become a CPU instruction (MACRO can generate code).', 'L4', 'Tools'),
    G('Assembly language', 'Machine language written in human-readable mnemonics, essentially one assembly instruction per machine instruction (directives and macros aside). Different for every architecture.', 'L4', 'Tools'),
    G('Banked registers', 'Two registers sharing a name where only one is visible depending on mode, such as A7 and A7\' on the 68000.', 'L3', '68K'),
    G('Beta (β, hFE)', 'The current gain of a bipolar transistor, IC/IB. Varies with current, temperature and device, so design with the minimum.', 'L8', 'Transistors'),
    G('Big-endian', 'Byte order that stores the most significant byte at the lowest address. The 68000 is big-endian.', 'L6', 'Memory'),
    G('Branch', 'Changing the program counter by adding a signed displacement; conditional branches test flags. Relative, so code stays relocatable.', 'L5', 'Control'),
    G('Bus', 'A group of like signals (address, data, control) shared by devices.', 'L6', 'Hardware'),
    G('Bus contention', 'Two outputs driving the same line to opposite levels, giving an indeterminate level and possible damage. Avoided with open-collector or tri-state outputs.', 'L6', 'Hardware'),
    G('Byte / word / long word', '8, 16 and 32 bits respectively in 68000 terminology (suffixes .B .W .L).', 'L3', '68K'),
    G('Carry (C)', 'Flag set when an addition carries out of the top bit or a subtraction needs a borrow.', 'L3', 'Flags'),
    G('CCR', 'Condition Code Register: the low 5 bits (X N Z V C) of the 68000 status register.', 'L3', 'Flags'),
    G('Chip select (~CS/~CE)', 'Master enable for a memory/peripheral chip. When not asserted the chip ignores the bus and its outputs are Hi-Z.', 'L6', 'Hardware'),
    G('CISC', 'Complex Instruction Set Computer: many instructions and modes, variable-length instructions, compact code. The 68000 is CISC.', 'L3', 'CPU'),
    G('Condition codes', 'The flag bits that record the outcome of the last ALU operation; tested by Bcc instructions.', 'L5', 'Flags'),
    G('Data bus', 'The bidirectional lines carrying information to or from memory and I/O.', 'L3', 'Hardware'),
    G('Data register', 'One of D0-D7: general-purpose 32-bit registers holding byte, word or long data.', 'L3', '68K'),
    G('Decoder', 'Logic that turns an n-bit address (page) value into one active chip-select line; e.g. 74x138 (3-to-8).', 'L7', 'Hardware'),
    G('Displacement', 'A signed offset added to a register (mode 5/6) or to the PC (branches).', 'L5', 'Addressing'),
    G('DRAM', 'Dynamic RAM: one transistor and a capacitor per bit; dense but needs refresh and RAS/CAS addressing.', 'L7', 'Memory'),
    G('EA (effective address)', 'The operand location produced by an addressing mode. In the op-code word, a 3-bit mode plus 3-bit register.', 'L5', 'Addressing'),
    G('EASy68K', 'A free 68000 editor/assembler/simulator used in the course labs.', 'L4', 'Tools'),
    G('Endianness', 'The order in which the bytes of a multi-byte value are stored (big- vs little-endian).', 'L6', 'Memory'),
    G('Exception vector table', 'Table at the bottom of 68K memory holding the initial stack pointer, start address and handler addresses.', 'L7', '68K'),
    G('Extend (X)', 'Flag that copies carry for multi-precision arithmetic; not changed by moves.', 'L3', 'Flags'),
    G('Fetch-decode-execute', 'The processor cycle: fetch the op-code from memory at the PC, decode it, execute it, repeat.', 'L3', 'CPU'),
    G('Flag', 'A single status bit (Z, N, C, V, X) set by the ALU after an operation.', 'L3', 'Flags'),
    G('Flow chart', 'Diagram with rectangles (operations), diamonds (decisions) and arrows used to plan assembly programs.', 'L4', 'Tools'),
    G('Glue logic', 'Simple logic that interconnects processor, memory and I/O (decoders, gates, PLDs).', 'L3', 'Hardware'),
    G('Harvard architecture', 'Separate memory (or at least separate buses) for instructions and data, so both can be accessed at once. Examples: AVR and PIC; ARM Cortex-M3/M4/M7 use a modified form. Contrast von Neumann.', 'L3', 'CPU'),
    G('Hi-Z', 'High impedance: the third state of a tri-state output, electrically disconnected from the bus.', 'L6', 'Hardware'),
    G('Immediate', 'An operand that is a literal number written with #. A source only.', 'L5', 'Addressing'),
    G('Indirect addressing', 'The register holds the address of the operand, not the operand itself. Written with parentheses.', 'L5', 'Addressing'),
    G('Instruction register', 'Holds the op-code word currently being decoded.', 'L3', 'CPU'),
    G('Interrupt', 'An exception that suspends the program to run a handler, ending with RTE (68K) or RETI (Z80).', 'L3', 'CPU'),
    G('Label', 'A name for an address, starting in column 1; lets the assembler compute branch targets.', 'L4', 'Tools'),
    G('LEA', 'Load Effective Address: put an address (not data) into an address register. Preferred way to initialise pointers.', 'L4', 'Instructions'),
    G('LIFO', 'Last in, first out: the discipline of a stack.', 'L5', 'Control'),
    G('List file', 'Assembler output showing addresses, machine code and source, plus a symbol table.', 'L4', 'Tools'),
    G('Little-endian', 'Byte order that stores the least significant byte at the lowest address (Z80, x86).', 'L6', 'Memory'),
    G('Machine language', 'The bit patterns the processor decodes as instructions.', 'L4', 'CPU'),
    G('Macro', 'A named group of instructions that the assembler expands wherever the name is used.', 'L4', 'Tools'),
    G('MOVEM', 'Move Multiple registers to or from memory, used to save and restore registers around subroutines.', 'L5', 'Instructions'),
    G('Negative (N)', 'Flag equal to the most significant bit of the result.', 'L5', 'Flags'),
    G('Offset bits', 'Low address bits that select a location inside a memory chip or page.', 'L6', 'Hardware'),
    G('Op-code word', 'The first 16 bits of a 68000 instruction: operation, size, addressing modes; tells how many extension words follow.', 'L4', 'CPU'),
    G('Open collector', 'An output that can only pull low; needs a pull-up resistor to go high. Slow rising edges.', 'L6', 'Hardware'),
    G('Operand', 'The data an instruction works on (a noun); the operation is the verb.', 'L4', 'Tools'),
    G('Overflow (V)', 'Flag set when a signed result does not fit in the operand size.', 'L3', 'Flags'),
    G('Page', 'The block of address space covered by one memory chip (or group of chips); chosen by the page bits.', 'L6', 'Memory'),
    G('Page bits', 'High address bits fed to the decoder to choose a page.', 'L6', 'Hardware'),
    G('Paging', 'Mapping different physical memories into a small address space by writing to a page-select register.', 'L7', 'Memory'),
    G('Pointer', 'A register or memory location whose value is an address.', 'L5', 'Addressing'),
    G('Post-increment', 'Addressing mode (An)+: use the address, then add the operand size to An (1/2/4; a byte access through A7 adds 2).', 'L5', 'Addressing'),
    G('Pre-decrement', 'Addressing mode -(An): subtract the operand size from An (1/2/4; a byte access through A7 subtracts 2), then use the address.', 'L5', 'Addressing'),
    G('Program counter (PC)', 'Register holding the address of the next instruction.', 'L3', 'CPU'),
    G('Pseudo-op', 'Another name for an assembler directive.', 'L4', 'Tools'),
    G('RISC', 'Reduced Instruction Set Computer: few instructions and modes, fixed length, load/store architecture (e.g. ARM).', 'L3', 'CPU'),
    G('Relocatable code', 'Code that runs correctly wherever it is loaded, typically using PC-relative branches and addressing.', 'L5', 'Control'),
    G('RTS', 'Return from subroutine: pops the return address into the PC.', 'L5', 'Instructions'),
    G('Saturation', 'A transistor driven so hard (IB well above IC/beta) that the collector voltage stops falling (roughly 0.2-0.4 V; the lecture uses 0.4 V); acts as a closed switch.', 'L8', 'Transistors'),
    G('Sign extension', 'Copying the sign bit into the upper bits to widen a signed value (e.g. $8000 → $FFFF8000).', 'L5', 'Numbers'),
    G('Sinking / sourcing', 'Current flowing into an output pin (sink) or out of it (source).', 'L8', 'Transistors'),
    G('SRAM', 'Static RAM: bit stored by cross-coupled inverters (6 transistors); fast, no refresh.', 'L6', 'Memory'),
    G('Stack', 'LIFO memory region used for return addresses, saved registers and locals. Grows downward on the 68000.', 'L5', 'Control'),
    G('Stack pointer (SP)', 'Register (A7) pointing at the top of the stack.', 'L3', 'CPU'),
    G('Status register', 'Holds the flags and, on the 68000, mode and interrupt-level bits.', 'L3', 'CPU'),
    G('Subroutine', 'A reusable block of code called with JSR/BSR and ended with RTS; the equivalent of a C function.', 'L5', 'Control'),
    G('Supervisor mode', 'Privileged 68000 mode with full instruction access and its own stack pointer A7\'.', 'L3', '68K'),
    G('Symbol table', 'Assembler output mapping each label to its value.', 'L4', 'Tools'),
    G('Tri-state', 'Output with three states: 0, 1 and Hi-Z, enabling bus sharing.', 'L6', 'Hardware'),
    G('Two\'s complement', 'Signed number representation: negate by complementing all bits and adding 1.', 'L3', 'Numbers'),
    G('User mode', 'Restricted 68000 mode that cannot run privileged instructions.', 'L3', '68K'),
    G('VBE', 'Base-emitter voltage of a conducting BJT, about 0.6 V.', 'L8', 'Transistors'),
    G('von Neumann architecture', 'One memory space for both instructions and data (the 68000).', 'L3', 'CPU'),
    G('Wait state', 'An extra clock cycle added to a memory access so slow memory can keep up.', 'L7', 'Memory'),
    G('S-record', 'Motorola text format for executable code: records of type S0 (header), S1/S2 (data with 16/24-bit addresses) and S8 (start address), each with a byte count, address, data and checksum. The simulator loads it; it can also be burned into a ROM.', 'HW2', 'Tools'),
    G('Instruction set simulator (ISS)', 'A program that executes a processor\'s object code on another computer, behaving like the target CPU so programs can be stepped through without hardware. EASy68K\'s Sim68K is an ISS for the 68000.', 'HW2', 'Tools'),
    G('Source file (.X68)', 'The plain-text assembly program you write for EASy68K. Assembling it produces the .L68 listing and, if there are no errors, the .S68 S-record.', 'HW2', 'Tools'),
    G('Zero (Z)', 'Flag set when the result is zero (all bits 0).', 'L3', 'Flags'),
  ].sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase()));

  /* cross-links */
  const SEE = {
    cpu: ['numbers', 'programmers-model'], numbers: ['programmers-model', 'branches'], 'programmers-model': ['modes', 'instructions'],
    'machine-code': ['modes', 'instructions'], syntax: ['workflow', 'instructions', 'branches'], instructions: ['modes', 'branches'],
    modes: ['instructions', 'stack'], branches: ['numbers', 'stack'], stack: ['branches', 'syntax'], memory: ['cpu', 'z80'],
    transistor: ['memory'], z80: ['programmers-model', 'instructions'], errata: ['instructions', 'syntax'], workflow: ['syntax', 'machine-code', 'memory'],
  };
  const DECK_GUIDE = { regs: 'programmers-model', num: 'numbers', dirs: 'syntax', inst: 'instructions', modes: 'modes', flow: 'branches', hw: 'memory', io: 'transistor', z80: 'z80' };
  const CAT_GUIDE = { Addressing: 'modes', Flags: 'numbers', '68K': 'programmers-model', CPU: 'cpu', Tools: 'syntax', Instructions: 'instructions', Control: 'branches', Hardware: 'memory', Memory: 'memory', Transistors: 'transistor', Numbers: 'numbers' };
  const REFS = [
    { title: 'M68000 Family Programmer\'s Reference Manual (Motorola; mirrored copy)', url: 'https://www.eecg.utoronto.ca/~moshovos/ECE243-07/M68000PM.pdf', note: 'Authoritative instruction set, flags and addressing modes. NXP\'s own listing is M68000PRM.pdf.' },
    { title: 'EASy68K home page', url: 'http://www.easy68k.com/', note: 'The editor/assembler/simulator used in the course labs (Windows).' },
    { title: 'EASy68K text I/O (TRAP #15) help', url: 'https://acorn.huininga.nl/pub/projects/CiscOS/_emulators/EASy68Ksource/EASy68K_Help/textio.htm', note: 'Task numbers and register conventions the sandbox implements.' },
    { title: 'EASy68K for macOS (open-source port)', url: 'https://github.com/mikewolak/EASy68K-macos', note: 'Native Mac build; used here as a test oracle.' },
    { title: 'Zilog Z80 CPU User Manual (UM0080)', url: 'https://www.zilog.com/docs/z80/um0080.pdf', note: 'For the Z80 half of the course.' },
    { title: 'ASM Editor (Specy)', url: 'https://asm-editor.specy.app', note: 'A polished web IDE for several architectures, including 68K. Source: github.com/Specy/asm-editor (AGPL-3.0).' },
    { title: 'ECE 252 supplementary notes (NJIT)', url: 'https://web.njit.edu/~rosensta/classes/architecture/252software/suppnote.pdf', note: 'Another instructor\'s EASy68K notes, including TRAP #15 usage.' },
  ];
  const api = { GUIDES, GLOSSARY, render, SEE, DECK_GUIDE, CAT_GUIDE, REFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QUEST_GUIDES = api;
})(typeof window !== 'undefined' ? window : globalThis);
