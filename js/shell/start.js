/* Start here: a from-zero path through Lessons 3-8, written before any flashcards.
   Each lesson explains one idea in plain words, works an example, then asks a few questions to check understanding.
   Every program shown was run on the 68000 emulator in this site and the printed results come from that run.
   Authoring format: the tiny markdown subset of QUEST_GUIDES.render(). */
(function (root) {
  'use strict';
  const render = (root.QUEST_GUIDES && root.QUEST_GUIDES.render) || ((s) => '<pre>' + s + '</pre>');

  const LESSONS = [
    {
      id: 'numbers', title: 'Numbers a computer uses', lecture: 'L3', mins: 10, needs: 'Nothing.',
      goal: 'Read and write binary and hex, and know what the same bits mean as signed and unsigned numbers.',
      md: `## Bits, bytes and hex

A **bit** is one 0 or 1. A **byte** is 8 bits, so it can hold 2^8 = 256 different patterns. In general N bits give 2^N patterns: 12 bits give 4,096, 16 bits give 65,536.

Binary is long to write, so we group bits in fours and write each group as one **hex** digit (0-9, then A=10 up to F=15). In the 68000 world a leading \`$\` means hex and \`%\` means binary.

| Binary | Hex | Decimal |
|---|---|---|
| 0000 | 0 | 0 |
| 1001 | 9 | 9 |
| 1010 | A | 10 |
| 1111 | F | 15 |

**Worked example.** \`$4F\` is \`0100 1111\`. As a number: 4 x 16 + 15 = **79**.

## The same bits, two meanings

A byte is just 8 bits. Whether it is a number from 0 to 255 or from -128 to 127 depends on how *you* choose to read it. That choice is called **unsigned** versus **signed**.

Signed numbers use **two's complement**: the top bit is the sign (1 means negative), and to negate a number you **invert every bit and add 1**.

**Worked example: -5 as a byte.** 5 is \`0000 0101\`. Invert: \`1111 1010\`. Add 1: \`1111 1011\` = **$FB**.

| Byte | Unsigned | Signed |
|---|---|---|
| $7F | 127 | +127 (largest signed byte) |
| $80 | 128 | -128 (smallest signed byte) |
| $FF | 255 | -1 |

> The hardware does not remember which reading you meant. The *instructions you choose afterwards* (for example the signed or unsigned branches) are what give the bits a meaning. Homework 3 problem 3 is exactly this.

## Sizes on the 68000

Byte = 8 bits, **word = 16 bits**, **long word = 32 bits** (so "word" does not mean the machine's native width the way it can elsewhere). You will see these as the suffixes \`.B\`, \`.W\` and \`.L\`.`,
      check: [
        ['Convert $2A to decimal.', '2 x 16 + 10 = 42.'],
        ['What is -5 as a byte in hex?', 'Invert 00000101 to get 11111010, add 1 to get 11111011, which is $FB.'],
        ['What does the byte $80 mean when read as signed? As unsigned?', 'Signed: -128. Unsigned: 128.'],
        ['How many different values fit in 12 bits?', '2^12 = 4,096.'],
      ],
      next: { guide: 'numbers', topic: 'num' },
    },
    {
      id: 'system', title: 'What is inside a computer system', lecture: 'L3', mins: 10, needs: 'Numbers lesson.',
      goal: 'Name the parts of a microprocessor system and say what the three buses carry.',
      md: `## The parts

A microprocessor system has three kinds of part:

- **The CPU**, which fetches instructions and does the work.
- **Memory**: ROM (keeps its contents without power, holds the startup program) and RAM (loses them, holds data and running code).
- **I/O**: the chips and pins that talk to the outside world (LEDs, switches, serial ports, converters).

They are joined by **buses**, which are just groups of wires shared by everything.

| Bus | Carries | Direction |
|---|---|---|
| **Address bus** | *Which* memory location or I/O device the CPU wants | CPU to everything else |
| **Data bus** | The actual value being read or written | Both ways |
| **Control bus** | Timing and meaning: read or write, "the address is valid now" | Mostly from the CPU |

{{fig:system}}

**Analogy.** Memory is a long street of numbered mailboxes. The address bus is the number the CPU shouts; the data bus is the letter that goes in or comes out; the control lines say *whether* it is putting a letter in or taking one out.

## How big is the street?

With N address lines the CPU can name 2^N locations. 16 address lines reach 65,536 locations (the Z80). The 68000 has a 24-bit address, which reaches 16,777,216 bytes (16 MB). Its external data bus is 16 bits wide, even though its registers are 32 bits.

## Microprocessor or microcontroller?

A **microprocessor** is only the CPU; you add memory and I/O chips on the circuit board (this course's 68000 and Z80 systems). A **microcontroller** puts the CPU, memory and peripherals on one chip.`,
      check: [
        ['Which bus carries the value being stored in memory?', 'The data bus.'],
        ['How many bytes can 16 address lines reach?', '2^16 = 65,536.'],
        ['What is the difference between a microprocessor and a microcontroller?', 'A microprocessor is just the CPU, with memory and I/O on separate chips. A microcontroller has the CPU, memory and peripherals on one chip.'],
      ],
      next: { guide: 'cpu', topic: 'regs' },
    },
    {
      id: 'running', title: 'How a CPU runs a program', lecture: 'L3-4', mins: 12, needs: 'The two lessons above.',
      goal: 'Explain fetch, decode and execute, and the difference between assembly language and machine code.',
      md: `## A program is bytes in memory

The CPU has no idea what a "program" is. It only repeats one loop:

1. **Fetch**: read the word of memory the **program counter (PC)** points at.
2. **Decode**: work out which instruction those bits mean.
3. **Execute**: do it (and read any extra words the instruction needs). The PC now points at the next instruction.

A jump or branch works by simply putting a different number in the PC.

{{fig:cycle}}

## Assembly versus machine code

People write **assembly language**: short readable names like \`MOVE.W #5,D0\`. An **assembler** translates each line into **machine code**, the numbers the CPU actually runs. Assembly and machine code are one-to-one: each line is one instruction.

Here is a three-instruction program and what the assembler produced for it (run on this site's assembler):

\`\`\`
Address  Machine code   Assembly
$1000    303C 0005      MOVE.W #5,D0
$1004    5640           ADD.W  #3,D0
$1006    31C0 2000      MOVE.W D0,$2000
\`\`\`

The lecture shows the same idea with its own examples; the machine-code values on this slide match what the real EASy68K assembler produces.

{{img:L4-s8}}

Reading it: the first word \`$303C\` *means* "move a word, immediate value to D0", and the next word \`$0005\` is the 5. Instructions are different lengths, which is why the next one starts at $1004, not $1002.

After it runs, D0 holds 8 and memory at $2000 holds the word $0008. Open it in the sandbox below and press **Step** to watch each instruction run.

> **Directives are not instructions.** Lines like \`ORG $1000\` and \`END start\` tell the *assembler* what to do (where to put the code); they produce no machine code. \`SIMHALT\` is a simulator command that stops the program.`,
      examples: [{ title: 'Add 5 and 3, store the result', src: `        ORG $1000
start   MOVE.W #5,D0
        ADD.W  #3,D0
        MOVE.W D0,$2000
        SIMHALT
        END start
` }],
      check: [
        ['What does the program counter hold?', 'The address of the next instruction to fetch.'],
        ['How does a branch change what runs next?', 'It puts a new address in the program counter.'],
        ['Is ORG a CPU instruction?', 'No. It is an assembler directive: it controls where code is placed and produces no machine code.'],
      ],
      next: { guide: 'machine-code', topic: 'dirs' },
    },
    {
      id: 'registers', title: 'The 68000 registers and first instructions', lecture: 'L4-5', mins: 15, needs: 'How a CPU runs a program.',
      goal: 'Use D0-D7 and A0-A7, the .B/.W/.L sizes and the flags in simple MOVE and ADD instructions.',
      md: `## Registers

Registers are tiny, very fast storage inside the CPU.

- **D0-D7**: eight **data registers**, 32 bits each, for numbers.
- **A0-A7**: eight **address registers**, for addresses (pointers). **A7 is the stack pointer.**
- **PC**: the program counter.
- **CCR**: five **flags** (X N Z V C) describing the last result. **Z** = result was zero, **N** = result was negative (top bit set), **C** = carry or borrow out, **V** = signed overflow, **X** = a copy of carry for multi-word arithmetic.

## MOVE and ADD: the source comes first

\`\`\`
MOVE.W  #5,D0     copy 5 into D0
ADD.W   D1,D0     D0 = D0 + D1
\`\`\`

Read it as **MOVE source, destination**. The suffix says how many bits to work on: \`.B\` 8, \`.W\` 16, \`.L\` 32.

## A size only touches part of the register

This surprises everyone once. Run this:

\`\`\`
MOVE.L #$12345678,D0   D0 = $12345678
MOVE.B #$FF,D0         D0 = $123456FF   (only the low byte changed)
ADD.B  #1,D0           D0 = $12345600   (low byte wrapped; upper bits untouched)
\`\`\`

{{fig:regsizes}}

The last result: the low byte went from $FF to $00, so **Z = 1** (the byte result is zero) and **C = 1** and **X = 1** (it carried out of the byte). N is 0 and V is 0. The flags describe only the byte that was operated on. (Run on this site's emulator: flags XNZVC = 10101.)

> **Byte order in memory.** The 68000 is **big-endian**: the most significant byte of a word or long word goes at the *lowest* address. A long $12345678 at $2000 is stored as 12 at $2000, 34 at $2001, 56 at $2002, 78 at $2003. The lecture's own example: the word $AA55 stored at $1000 and $1001 is AA 55 big-endian and 55 AA little-endian. The **Z80 is little-endian**, so the same word is stored low byte first.

{{fig:endian}}

{{img:L6-s25}}

> **Words and longs must start at even addresses** on the 68000. A word access at an odd address causes an address error.`,
      examples: [{ title: 'Sizes and flags', src: `        ORG $1000
start   MOVE.L #$12345678,D0
        MOVE.B #$FF,D0
        ADD.B  #1,D0
        SIMHALT
        END start
` }],
      check: [
        ['In MOVE.W D1,D2, which register is the source?', 'D1. The source always comes first.'],
        ['D0 = $12345678. After MOVE.B #$FF,D0, what is D0?', '$123456FF. Only the low byte changes.'],
        ['In big-endian memory, where does the byte $12 of the long $12345678 go?', 'At the lowest address of the four.'],
        ['Store the word $AA55 at $1000 and $1001. What is in each byte, big-endian and little-endian?', 'Big-endian: AA at $1000, 55 at $1001. Little-endian: 55 at $1000, AA at $1001.'],
      ],
      next: { guide: 'programmers-model', topic: 'regs' },
    },
    {
      id: 'modes', title: 'Where an operand lives: addressing modes', lecture: 'L5', mins: 15, needs: 'The registers lesson.',
      goal: 'Tell apart #value, register, memory address, and the pointer forms (An), (An)+, -(An), d(An).',
      md: `## The idea

An instruction says *what to do*. An **addressing mode** says *where each piece of data is*. The same ADD can take its data from a constant, a register or memory, just by how you write the operand.

The lecture numbers the 68000's addressing modes **Mode 0 to Mode 7**; exam questions may use those numbers.

| Mode | Written as | Name | Meaning |
|---|---|---|---|
| 0 | \`D0\` | Data register | the contents of D0 |
| 1 | \`A0\` | Address register | the contents of A0 |
| 2 | \`(A0)\` | Indirect | memory at the address held in A0 |
| 3 | \`(A0)+\` | Post-increment | memory at A0, **then** A0 moves on by the operand size |
| 4 | \`-(A0)\` | Pre-decrement | A0 moves back first, **then** memory at A0 |
| 5 | \`4(A0)\` | Displacement | memory at A0 + 4 |
| 6 | \`4(A0,D1)\` | Indexed | memory at A0 + D1 + 4 (walks a table or array row) |
| 7 | \`$A300\` | Absolute (short or long) | the contents of memory at address $A300 |
| 7 | \`#5\` | Immediate | the value 5 itself |
| 7 | \`label(PC)\` | Program-counter relative | memory at the PC plus a displacement |

Mode 7 is a family: the lecture calls the variants its **subclasses** (absolute short and long, PC with displacement, PC with index, immediate).

{{img:L5-s6}}

> **The most common mistake:** \`#\` means "the value", no \`#\` means "the contents of that address". \`MOVE.W #$A300,D0\` puts $A300 in D0. \`MOVE.W $A300,D0\` puts whatever is stored *at* $A300 in D0.

{{img:L5-s10}}

{{fig:postinc}}

## Why pointers matter

\`(A0)+\` is how you walk through an array: use the element, and A0 automatically steps to the next one (by 1, 2 or 4 bytes for \`.B\`, \`.W\`, \`.L\`).

**Worked example: add four words.** The table holds 10, 20, 30, 40.

\`\`\`
        LEA     table,A0     A0 = address of the table
        CLR.W   D0           running total = 0
        MOVEQ   #4,D1        loop counter: four words (see the next lesson)
loop    ADD.W   (A0)+,D0     add a word, A0 += 2
        SUBQ.W  #1,D1        count down
        BNE     loop         until the count is 0
\`\`\`

Result: **D0 = 100** ($64), and A0 has moved past the table. (Run on this site's emulator.) \`LEA\` ("load effective address") puts the *address* of \`table\` in A0, not the data stored there.`,
      examples: [{ title: 'Sum four words with (A0)+', src: `        ORG $1000
start   LEA table,A0
        CLR.W D0
        MOVEQ #4,D1
loop    ADD.W (A0)+,D0
        SUBQ.W #1,D1
        BNE loop
        SIMHALT
table   DC.W 10,20,30,40
        END start
` }],
      check: [
        ['Which addressing mode numbers are post-increment, pre-decrement and displacement?', 'Mode 3 post-increment, Mode 4 pre-decrement, Mode 5 displacement (Mode 2 is plain indirect, Mode 6 indexed).'],
        ['What is the difference between MOVE.W #$A300,D0 and MOVE.W $A300,D0?', 'The first puts the number $A300 into D0. The second reads the word stored at memory address $A300.'],
        ['After ADD.W (A0)+,D0, how far has A0 moved?', '2 bytes, because the operation is word sized.'],
        ['What does LEA table,A0 put in A0?', 'The address of table, not the data stored there.'],
      ],
      next: { guide: 'modes', topic: 'modes' },
    },
    {
      id: 'branches', title: 'Decisions and loops', lecture: 'L5', mins: 15, needs: 'Addressing modes.',
      goal: 'Use CMP with a conditional branch, pick the signed or unsigned branch, and write a counted loop (FOR and DO/WHILE shapes).',
      md: `## Compare, then branch

A program decides in two steps: an instruction sets the **flags**, then a **conditional branch** looks at them.

\`\`\`
        MOVE.W  #7,D0
        CMP.W   #10,D0     computes D0 - 10 and sets the flags (result thrown away)
        BGT     big        branch if D0 > 10
        MOVE.W  #0,D1      not taken: D1 = 0
\`\`\`

\`CMP source,destination\` computes **destination - source**, so \`CMP.W #10,D0\` asks "how does D0 compare with 10?". Here 7 - 10 is negative, so BGT is not taken and D1 ends up 0. (Run on this site's emulator.)

## Signed or unsigned: pick the right branch

After \`CMP D0,D1\` (so D1 - D0):

| Relationship | Signed | Unsigned |
|---|---|---|
| D1 < D0 | BLT | BCS |
| D1 <= D0 | BLE | BLS |
| D1 = D0 | BEQ | BEQ |
| D1 <> D0 | BNE | BNE |
| D1 > D0 | BGT | BHI |
| D1 >= D0 | BGE | BCC |

This is the table in Homework 3. The names for the unsigned column are not symmetrical (that is a Motorola quirk) but the table is what to learn. **Use the signed set for numbers that can be negative, the unsigned set for addresses and counts.**

## Loops

A loop is just a branch backwards.

**Counting down with SUBQ and BNE:** add 5 + 4 + 3 + 2 + 1.

\`\`\`
        CLR.W   D0
        MOVEQ   #5,D1
loop    ADD.W   D1,D0      D0 += D1
        SUBQ.W  #1,D1      D1 -= 1 (sets Z when it reaches 0)
        BNE     loop       repeat until D1 = 0
\`\`\`

Result: **D0 = 15**. (Run on this site's emulator.)

## The loop shapes in the lecture

The lecture shows the same constructs as C++: a **FOR** loop tests at the *top* (compare, branch out if done, body, \`BRA\` back to the test), and a **DO/WHILE** loop tests at the *bottom*, so its body always runs **at least once**. Counting down with \`SUBQ\` and \`BNE\`, as above, is the DO/WHILE shape.

> **Optional extra (not in Lectures 3 to 8):** the 68000 also has \`DBRA D1,loop\`, a built-in counted loop that decrements D1 and branches *until D1 reaches -1*; to run N times, load N - 1. Some of this site's other pages use it. If a lecture or exam problem uses SUBQ and BNE, use that.`,
      examples: [{ title: 'Compare and branch', src: `        ORG $1000
start   MOVE.W #7,D0
        CMP.W #10,D0
        BGT big
        MOVE.W #0,D1
        BRA fin
big     MOVE.W #1,D1
fin     SIMHALT
        END start
` }, { title: 'Loop: 5+4+3+2+1', src: `        ORG $1000
start   CLR.W D0
        MOVEQ #5,D1
loop    ADD.W D1,D0
        SUBQ.W #1,D1
        BNE loop
        SIMHALT
        END start
` }],
      check: [
        ['After CMP.W #10,D0 with D0 = 7, is BGT taken?', 'No. The comparison is 7 - 10 = -3, so D0 is not greater than 10.'],
        ['You want the smallest value in a block of signed bytes. Which skip-branch: BGT or BHI?', 'BGT. BHI is the unsigned test and would treat $FF as 255.'],
        ['Which loop form always runs its body at least once?', 'DO/WHILE, because the test is at the bottom. A FOR loop tests at the top first.'],
        ['In the SUBQ/BNE loop above, what happens if the counter starts at 0?', 'SUBQ makes it -1 (not zero), so BNE keeps looping for a very long time. The test happens after the body, so the counter must start at the number of passes you want, not zero.'],
      ],
      next: { guide: 'branches', topic: 'flow', extra: [['#/homework/hw3', 'Homework 3 uses all of this']] },
    },
    {
      id: 'stack', title: 'The stack and subroutines', lecture: 'L5', mins: 10, needs: 'Decisions and loops.',
      goal: 'Explain push and pop, and what BSR and RTS do with the stack.',
      md: `## The stack

The **stack** is a region of memory used last-in, first-out, like a pile of plates. The **stack pointer (A7, also written SP)** points at the top.

- **Push:** \`MOVE.W D0,-(SP)\` (pre-decrement: SP moves down, then the value is stored).
- **Pop:** \`MOVE.W (SP)+,D0\` (read, then SP moves up).

The 68000 stack grows **downward** toward lower addresses.

## Subroutines

A **subroutine** is code you can call from several places. \`BSR double\` (or \`JSR\`) **pushes the return address** (the address of the instruction after the call) on the stack and jumps. \`RTS\` **pops** that address into the PC, so the program carries on right after the call.

\`\`\`
        MOVE.W  #5,D0
        BSR     double       push return address, jump
        SIMHALT              (execution resumes here)
double  ADD.W   D0,D0        D0 = D0 + D0
        RTS                  pop return address into PC
\`\`\`

Result: **D0 = 10**, and the stack pointer is back to where it started. (Run on this site's emulator.)

{{fig:stack}}

> **Why BSR and not JSR?** A lecture slide asks this about its memory-test program but does not answer it. The standard answer (general knowledge, not from the slide): \`BSR\` is a *relative* branch, so it is shorter and the code works wherever it is loaded, while \`JSR\` carries a full absolute address.

> **Matching matters.** Every push needs a pop, and the stack must hold the return address when RTS runs. A subroutine that pushes something and forgets to pop it makes RTS jump to the wrong place.`,
      examples: [{ title: 'Call a subroutine', src: `        ORG $1000
start   MOVE.W #5,D0
        BSR double
        SIMHALT
double  ADD.W D0,D0
        RTS
        END start
` }],
      check: [
        ['Which direction does the 68000 stack grow?', 'Downward, toward lower addresses.'],
        ['What does BSR push?', 'The return address: the address of the instruction after the BSR.'],
        ['On the 68000, how do you push and pop?', 'Push with pre-decrement, MOVE.W D0,-(SP); pop with post-increment, MOVE.W (SP)+,D0. This works because the stack grows downward.'],
        ['A subroutine pushes D1 but never pops it. What goes wrong at RTS?', 'RTS pops the saved D1 value as if it were the return address and jumps to the wrong place.'],
      ],
      next: { guide: 'stack', topic: 'flow' },
    },
    {
      id: 'buses', title: 'Buses and tri-state outputs', lecture: 'L6', mins: 10, needs: 'What is inside a computer system.',
      goal: 'Explain why bus outputs have a third "disconnected" state and what a bus conflict is.',
      md: `## Many devices, one set of wires

The data bus is shared by the CPU, every memory chip and every I/O chip. That raises a problem: a normal logic output is always driving the wire either high or low. If two devices drive the same wire to different levels at once, they fight: the result is an **indeterminate logic level** and can overheat the chips.

## The third state

A **tri-state** (three-state) output can be:

1. driving **high** (1),
2. driving **low** (0), or
3. **high impedance** ("high-Z"): effectively disconnected from the wire.

{{img:L6-s8}}

An **output enable** pin chooses between "drive the bus" and "disconnect". With it disabled, the chip's outputs are all in the high-Z state and it does not interfere with anyone else.

{{img:L6-s4}}

**Analogy.** A conference call where everyone is muted except the one person whose turn it is. Tri-state is the mute button; the rule is *exactly one device talks at a time*.

## Who gets to talk?

- On a **read**, the memory chip being read is the only one that enables its outputs onto the data bus; the CPU listens.
- On a **write**, the CPU drives the data bus; every memory chip listens but only the selected one stores the value.

Deciding *which* chip is selected is the job of address decoding, next.`,
      check: [
        ['What are the three states of a tri-state output?', 'Driving high, driving low, and high impedance (disconnected).'],
        ['What goes wrong if two devices drive the data bus at the same time?', 'A bus conflict: the level on the bus is indeterminate and the chips can be damaged.'],
        ['During a memory read, who drives the data bus?', 'Only the selected memory chip (through its enabled outputs).'],
      ],
      next: { guide: 'memory', topic: 'hw' },
    },
    {
      id: 'decoding', title: 'Memory decoding', lecture: 'L7', mins: 15, needs: 'Buses and tri-state outputs.',
      goal: 'Split an address into "which chip" and "where in the chip", and work out a chip\'s address range.',
      md: `## Why decode

A memory chip has its own small set of address pins. A 4 KB chip has 12 (because 2^12 = 4,096). The CPU has more address lines than that, so somebody has to decide **which chip answers** a given address. That is **address decoding**.

## The idea: split the address

Take the CPU's address lines and split them in two:

- The **low** lines go to every chip's address pins. They say *where inside the chip* (the **offset**).
- The **high** lines go to a **decoder**, which turns exactly one **chip select** line on. They say *which chip* (the **page**).

**Worked example.** A system has 16 address lines (A15-A0) and uses 4 KB memory chips.

- A 4 KB chip needs 12 offset lines: **A11-A0** go to all chips.
- That leaves **A15-A12** (4 lines) to choose among 2^4 = 16 pages of 4 KB.
- A decoder on A15-A12 enables chip select 0 for pages $0xxx, chip select 1 for $1xxx, and so on.

| A15-A12 | Page | Address range |
|---|---|---|
| 0000 | 0 | $0000-$0FFF |
| 0001 | 1 | $1000-$1FFF |
| 0010 | 2 | $2000-$2FFF |
| ... | ... | ... |

{{fig:decode}}

**Check one address.** Take $2A5C. Its top four bits are 0010 (page 2) so chip 2 is selected, and the low twelve bits $A5C are the location inside it.

## The lecture's example: 16 MB in 32K pages

Lecture 7 uses 16 MB of address space (24 address lines, A23-A0) and **32K pages**. A 32K page needs 15 offset lines (2^15 = 32,768), so **A14-A0 are the offset** and **A23-A15 (9 lines) are the page select**: 2^9 = 512 pages.

The lecture's example selects the page at page address **$1A4** (binary 1 1010 0100). Its **~CS (chip select) goes low** only when A23-A15 equal that pattern.

(calc) Where is that page? It starts at $1A4 x $8000 = **$D20000** and ends at $D27FFF, so it covers **$D20000-$D27FFF**. Check with an address: $D23456 in binary starts 1101 0010 0, and those nine bits are 110100100 = $1A4. So $D23456 is on that page, at offset $3456.

The lecture's two decoding slides show this in circuit form. The first decodes a page by watching A23-A15 with a NAND gate; the second shows the bit pattern for page $1A4, where the address lines that must be 0 pass through inverters first so that every NAND input is 1 only for that page.

{{img:L7-s2}}

{{img:L7-s4}}

## Things to watch for

- A 4 KB chip covers $1000 addresses: **$1000 = 4,096**, so the ranges step by $1000.
- If no decoder output is connected to a chip for some page, nothing answers at those addresses.
- I/O chips can be decoded the same way, with their own chip select.`,
      check: [
        ['How many address pins does a 4 KB memory chip need?', '12, because 2^12 = 4,096.'],
        ['In the example, which address lines select the chip?', 'A15-A12, the upper four.'],
        ['Which page and offset is address $2A5C?', 'Page 2 (A15-A12 = 0010), offset $A5C.'],
        ['What range does the chip at page 1 cover?', '$1000-$1FFF.'],
        ['16 MB of memory in 32K pages: how many page-select lines and how many offset lines?', '9 page-select lines (A23-A15, giving 512 pages) and 15 offset lines (A14-A0).'],
        ['Which page contains address $D23456 (32K pages)?', 'Page $1A4: the top nine bits (A23-A15) are 110100100 = $1A4; the offset is $3456.'],
      ],
      next: { guide: 'memory', topic: 'hw' },
    },
    {
      id: 'io', title: 'Transistors and I/O pins', lecture: 'L8', mins: 15, needs: 'Buses and tri-state outputs.',
      goal: 'Use a transistor as a switch driven from a microprocessor pin and size its base resistor the way the lecture does.',
      md: `## The problem

A processor output pin can supply only a few milliamps. A relay, motor or bright LED needs far more. The solution: let the pin control a **transistor** that switches the big current.

## An NPN transistor as a switch

An NPN transistor has a **base**, a **collector** and an **emitter**. A small current into the base lets a much larger current flow from collector to emitter: it is **current controlled**. With the base at 0 mA the switch is off; with enough base current it is fully on.

- The base-emitter junction behaves like a diode: when it conducts, **Vbe is about 0.6 V** (the lecture says approximately 600 mV).
- **Never apply a voltage directly to the base.** Always put a **resistor in series** to set the base current. Without it, the junction (a diode) would draw far too much current.

## Sizing the base resistor

The lecture's rule: **design for the worst case**. The transistor's current gain beta is only known as a range (the example says 75 to 200), so size the base current using the **smallest** beta, which guarantees enough base current even for the weakest transistor.

\`\`\`
Ib = Ic / beta(min)
Rb = (Vout - Vbe) / Ib
\`\`\`

**Worked example (the lecture's).** An I/O pin outputs 5 V at 5 mA. You want 100 mA through the collector. Beta ranges from 75 to 200.

\`\`\`
Ib = 100 mA / 75 = 1.33 mA       (use beta = 75, the worst case)
Rb = (5 V - 0.6 V) / 1.33 mA = 3.3 kilohms
\`\`\`

{{img:L8-s16}}

The lecture rounds the base current to 1.3 mA and gets 3.38 kilohms; either way the closest standard value is **3.3 kilohms**. Note that 1.33 mA is well inside what the pin can supply (the lecture says an I/O pin can safely output about 1 mA to 20 mA).

{{img:L8-s15}}

When enough base current flows the transistor **saturates**: the collector voltage drops to about 0.4 V and the transistor acts as a closed switch.

## Two extra practical points

These are general knowledge, not from the slides I checked, so treat them as background:

- A **diode across a relay or motor** (a flyback diode) gives the coil's current a path when the transistor turns off, protecting the transistor.
- A **pull-down resistor** on the base keeps the transistor off if the pin is disconnected or high-Z.`,
      check: [
        ['Roughly what voltage appears across a conducting base-emitter junction?', 'About 0.6 V.'],
        ['Why do you never connect a pin straight to the base?', 'The base-emitter junction acts like a diode and would draw excessive current; a series resistor sets the base current.'],
        ['The pin outputs 5 V and you want Ib = 2 mA. What Rb?', '(5 - 0.6) / 0.002 = 2,200 ohms (2.2 k).'],
        ['Which beta do you use to size the base resistor if beta is only known as a range, and why?', 'The smallest one (the worst case), so there is enough base current even for the weakest transistor.'],
        ['Lecture 8 "Now you try" problem 1: beta = 150, 50 mA collector current, 50 V supply, 500 ohm collector resistor, a 3.3 V pin. Find the base resistor and the collector voltage.', 'Ib = 50 mA / 150 = 0.333 mA. Rb = (3.3 - 0.6) / 0.333 mA = 8.1 kilohms. Collector voltage = 50 V - (50 mA x 500 ohms) = 50 - 25 = 25 V. (Worked here from the problem statement; check it against your own notes.)'],
      ],
      next: { guide: 'transistor', topic: 'io' },
    },
  ];

  root.START = { LESSONS, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.START;
})(typeof window !== 'undefined' ? window : globalThis);
