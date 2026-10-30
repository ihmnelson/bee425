---
track: shared
title: "Decoding the Z80 sample program from the trace"
summary: "Op-code bytes and operands appear in bus order; 16-bit operands are stored little endian; instruction length depends on the op-code."
needs: ["z80-la-procedure", "assembly-programs.z80-instruction-bytes"]
sources:
  - { type: handout, ref: "lab2 I", quote: "The op-code for the first instruction, located at ROM address 0000H, is 09H" }
  - { type: handout, ref: "lab2 I", quote: "This tells the computer to load the number 9A7CH into the register pair HL" }
  - { type: handout, ref: "lab2 I", quote: "not as 21H, 9AH, 7CH!" }
  - { type: oracle, ref: "the three encodings below are assembled with the Z80 assembler" }
encodings:
  - { cpu: z80, asm: "ADD HL,BC", hex: "09" }
  - { cpu: z80, asm: "LD A,55H", hex: "3E 55" }
  - { cpu: z80, asm: "LD HL,9A7CH", hex: "21 7C 9A" }
checks:
  - type: choice
    prompt: "The first instruction in the sample ROM has op-code 09H. What does it do and how long is it?"
    options: ["ADD HL,BC: adds the 16-bit pairs and puts the sum in HL; one byte", "LD A,55H; two bytes", "LD HL,nn; three bytes", "NOP"]
    answer: 0
    explain: "The op-code at 0000H is 09H: add register pair BC to HL, result in HL. It needs no operand, so it is a single byte; the next instruction starts at 0001H."
  - type: choice
    prompt: "The bytes 3EH 55H are fetched. Which instruction is it, and where does the next instruction start if this one is at 0001H?"
    options: ["LD A,55H (op-code 3EH plus operand 55H); the next instruction is at 0003H", "LD A,3EH; 0002H", "ADD A,55H; 0002H", "NOP"]
    answer: 0
    explain: "3EH is LD A,n; the operand 55H is the second byte, so the instruction occupies 0001H and 0002H and the next begins at 0003H."
  - type: choice
    prompt: "`LD HL,9A7CH` appears on the bus as which byte sequence?"
    options: ["21H, 7CH, 9AH (low byte first: little endian)", "21H, 9AH, 7CH", "7CH, 9AH, 21H", "9AH, 7CH"]
    answer: 0
    explain: "The op-code is 21H, then the 16-bit operand is sent with the low byte first (7CH then 9AH). The Z80 stores 16-bit values little endian, as you saw in the memory lessons."
  - type: choice
    prompt: "How many bus cycles does an instruction like `LD HL,9A7CH` (3 bytes) use for fetching?"
    options: ["Four T-state M1 cycle for the op-code plus two 3-T-state memory reads for the operand bytes", "One 4-T cycle only", "Three M1 cycles", "Two cycles"]
    answer: 0
    explain: "The op-code is fetched in an M1 cycle (4 T states); each operand byte is a plain memory read of 3 T states. Total fetch time 10 T states = 2.5 µs at 4 MHz."
card:
  front: "How do you read the Z80 state trace?"
  back: "Find the ~M1 rows for op-codes; the following memory-read rows are operand bytes (or data reads/writes). Instruction length is set by the op-code: 09H (ADD HL,BC) 1 byte; 3EH nn (LD A,n) 2 bytes; 21H lo hi (LD HL,nn) 3 bytes with the operand low byte first. Next instruction address = current + length."
glossary: []
---

## Learn

The lecture's sample program in Lab 2 does nothing useful: it exists to give signals to trace. The program starts at 0000H when ~RESET goes from low to high (the DS1232 holds the Z80 in reset until power is stable or you release the button).

| Address | Bytes | Instruction |
|---|---|---|
| 0000H | `09H` | `ADD HL,BC`: add the 16-bit register pairs, result in HL (1 byte) |
| 0001H-0002H | `3EH 55H` | `LD A,55H`: op-code plus operand (2 bytes) |
| 0003H-0005H | `21H 7CH 9AH` | `LD HL,9A7CH`: **low byte first** (3 bytes) |

Note that `LD HL,9A7CH` appears as 21H, **7CH, 9AH**, not 21H, 9AH, 7CH: the Z80 is **little endian**. All three encodings here are checked by assembling them on this site's Z80 assembler.

To decode a trace: the **M1 rows** (with ~M1, ~MREQ and ~RD low) are op-code fetches; the following memory-read rows are operand bytes; the op-code tells you how many operand bytes to expect, so you can find where the next instruction begins. Real-time traces also show data reads and writes from the instructions themselves.

## Worked example

*After `LD HL,9A7CH` at 0003H, where does the next op-code fetch occur?*

1. The instruction is 3 bytes: 0003H, 0004H, 0005H.
2. The next instruction starts at **0006H**.
3. The analyzer shows an M1 row with address 0006H.

## Try it

*What bytes does `LD A,0A4H` produce?*

???

`3EH A4H`: the op-code 3EH (LD A,n) followed by the operand byte A4H.
