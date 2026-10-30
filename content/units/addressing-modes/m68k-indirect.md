---
track: m68k
title: "Mode 2: address register indirect"
summary: "(An) means the memory location whose address is in An; the register is a pointer."
needs: [m68k-register-direct]
sources:
  - { type: slide, ref: "L5 s203", quote: "The parentheses around A3, () means A3 is a pointer to memory" }
  - { type: slide, ref: "L5 s204", quote: "MOVE.W D0,(A0) * Contents of D0 are copied into memory location contained in A0" }
  - { type: slide, ref: "L5 s205", quote: "Note that this was a word transfer, not a long word" }
  - { type: oracle, ref: "both assessment problems below are run on the 68000 core" }
programs:
  - cpu: m68k
    name: "assessment problem 1: ADD.B D0,(A5)"
    source: |
      * program
              ORG     $1000
      START   MOVE.L  #$0056AB27,D0
              LEA     $00002000,A5
              MOVE.L  #$3FD90146,(A5)
              ADD.B   D0,(A5)
              SIMHALT
              END     START
    expect:
      mem: { 8192: [0x66, 0xD9, 0x01, 0x46] }
  - cpu: m68k
    name: "assessment problem 2: ADDQ.L #3,A2 then AND.B D6,(A2)"
    source: |
      * program
              ORG     $1000
      START   MOVE.L  #$0056AB55,D6
              LEA     $00AA2600,A2
              MOVE.L  #$3FD901AA,(A2)
              ADDQ.L  #3,A2
              AND.B   D6,(A2)
              SIMHALT
              END     START
    expect:
      mem: { 11150848: [0x3F, 0xD9, 0x01, 0x00] }
      regs: { A2: 0x00AA2603 }
checks:
  - type: choice
    prompt: "What does the instruction `MOVE.W D0,(A0)` do?"
    options: ["Copies the word in D0 to the memory location whose address is in A0", "Copies D0 into register A0", "Copies the memory at D0 into A0", "Adds D0 to A0"]
    answer: 0
    explain: "The parentheses around an address register mean indirect addressing: A0 is a pointer, and the data goes to the memory location it contains. `MOVEA.W D0,A0` (no parentheses) copies D0 into A0 itself."
  - type: choice
    prompt: "`<A5> = $2000` and the long word at $2000 is `$3FD90146`, `<D0> = $0056AB27`. What is the long word at $2000 after `ADD.B D0,(A5)`?"
    options: ["$66D90146", "$3FD90146", "$3FD9016D", "$0056AB27"]
    answer: 0
    explain: "A byte operation at $2000 touches only the first (most significant) byte of the big-endian long word: $3F + $27 = $66, so the long word becomes $66D90146. Verified by running it."
  - type: choice
    prompt: "In the second problem, after `ADDQ.L #3,A2` the AND works on which byte of the long word at $00AA2600?"
    options: ["The last (fourth) byte, $AA, giving $AA AND $55 = $00", "The first byte", "All four bytes", "The second byte"]
    answer: 0
    explain: "ADDQ.L #3,A2 moves the pointer to $00AA2603, the fourth byte (the long word is $3F D9 01 AA). $AA AND $55 = $00, so the long word becomes $3FD90100. Verified by running it."
  - type: choice
    prompt: "In a memory read `MOVE.W (A5),D3` with A5 = $0085AB6E and the word at that address $0A30, what is D3's low word?"
    options: ["$0A30; the upper word is unchanged", "$0085", "The long word at A5", "$AB6E"]
    answer: 0
    explain: "A word transfer moves only 16 bits: the low word of D3 becomes $0A30 and the high word is left alone (shown as $XXXX 0A30 on the slide)."
card:
  front: "What does (An) mean, and how does a byte operation address a long word in memory?"
  back: "(An): A_n holds a pointer, and the operand is the memory at that address (parentheses = indirect). On a big-endian 68000 a byte access at the long word's address touches its most significant byte; ADDQ.L #3 on the pointer reaches the least significant byte."
glossary:
  - { term: "Pointer", def: "A stored address (in a register or memory location) rather than data." }
  - { term: "Indirect addressing", def: "Using a register's value as the address of the operand; written with parentheses on the 68000: (A3)." }
---

## Learn

**Indirect addressing**: the value in a register (or memory location) is the **address of the data**, not the data. A stored address is a **pointer**. On the 68000 only address registers hold pointers, and the parentheses mean "the memory that this register points to":

- `MOVE.L D3,(A3)` writes D3 to the memory address in A3. With `<A3> = $00A34000` and `<D3> = $F34CEF00`, the long word $F34CEF00 is written at $00A34000.
- `MOVEA.W D0,A0` copies D0 into A0; `MOVE.W D0,(A0)` copies D0 into the memory A0 points to.

Indirect addressing lets you do **arithmetic on addresses**. Other architectures differ: some can do indirect addressing through memory locations (not the 68K), ARM lets any register hold addresses, the 80x86 uses indirect addressing almost exclusively, and the Z80 reaches memory through `[HL]` (`LD [HL],B`). C and C++ pointers are the same idea.

The 68000 is **big-endian**: a long word stored at $2000 keeps its most significant byte at $2000. So a byte instruction on `(A5)` changes only the first byte of that long word.

## Worked example

*`<A5> = $2000`, long word at $2000 = $3FD90146, `<D0> = $0056AB27`. Compute `ADD.B D0,(A5)`.*

1. The operand size is a byte: only the byte at $2000 (the $3F) is involved.
2. The source byte is the low byte of D0, $27.
3. $3F + $27 = $66, so memory becomes **$66D90146**. The other three bytes are untouched. (The program above is run on the core and shows exactly this.)

## Try it

*`<D6> = $0056AB55`, `<A2> = $00AA2600`, long word there = $3FD901AA. What is the long word after `ADDQ.L #3,A2` then `AND.B D6,(A2)`?*

???

A2 becomes $00AA2603, the last byte ($AA). $AA AND $55 = $00, so the long word is **$3FD90100**. The first three bytes are untouched.
