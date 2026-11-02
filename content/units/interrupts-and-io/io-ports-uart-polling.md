---
track: shared
title: I/O ports, the data direction register and a polled UART
summary: An I/O port looks like memory but is not; a DDR sets each bit as input or output; a UART is read by testing its status bits.
needs: [interrupts-vs-polling]
sources:
  - { type: handout, ref: "ch12 I/O ports", quote: "We call them I/O ports rather than registers when they are used to interface to the outside world." }
  - { type: handout, ref: "ch12 I/O ports", quote: "writing $FF to the DDR makes all of the bits of the I/O port output bits" }
  - { type: handout, ref: "ch12 I/O ports", quote: "the data that I write to the port (output) will generally not be the data that I read from the port (input)" }
  - { type: handout, ref: "ch12 I/O ports", quote: "may spontaneously change value without warning" }
  - { type: handout, ref: "ch12 I/O ports", quote: "If we write to DB8 - DB15 when TB = 1 then we may overwrite the data being sent and corrupt it." }
checks:
  - type: choice
    prompt: "In a data direction register (DDR), a 1 makes the matching port bit an output and a 0 makes it an input. What does writing $FF to the DDR do?"
    options: ["Makes all eight bits of the port outputs", "Makes all eight bits of the port inputs", "Makes the odd bits inputs and the even bits outputs", "Clears the port so it reads as zero"]
    answer: 0
    explain: "Writing $FF puts a 1 in every DDR bit, so every port bit is an output; writing $00 makes every bit an input."
  - type: choice
    prompt: "A DDR holds $AA (10101010) with 1 = output. Which port bits, numbered 0 to 7 from the right, are outputs?"
    options: ["Bits 1, 3, 5 and 7", "Bits 0, 2, 4 and 6", "All eight bits", "None of them"]
    answer: 0
    explain: "The 1s of $AA are in bit positions 1, 3, 5 and 7. (The chapter words this as 'odd bits inputs, even bits outputs', which only matches if bits are counted from 1 rather than from 0.)"
  - type: choice
    prompt: "You write $5A to an I/O port configured as an output and immediately read the same address. Why might you not read $5A back?"
    options: ["The output and input halves of a port are different, and the input side can change on its own", "Reading a port always clears the data to zero", "Ports store only the high nibble of each byte", "The processor caches the write so the read returns an old value"]
    answer: 0
    explain: "Unlike memory, the data you write to a port is not necessarily what you read: the output and input portions are different, and the input side may change spontaneously. This is also why a C++ pointer to a port is declared volatile."
  - type: choice
    prompt: "A UART's status word is at $006000: bit DB0 = DR (data ready, 1 when a received character waits) and DB1 = TB (1 while the transmitter is busy). Which code waits until a character can be read?"
    options: ["MOVE.W (A5),D0 / ANDI.W #$0001,D0 / BEQ back to the MOVE", "MOVE.W (A5),D0 / ANDI.W #$0002,D0 / BNE back to the MOVE", "MOVE.W (A5),D0 / ANDI.W #$0001,D0 / BNE back to the MOVE", "MOVE.W (A5),D0 / ANDI.W #$0100,D0 / BEQ back to the MOVE"]
    answer: 0
    explain: "Mask bit 0 (DR). If the result is zero, no data is ready, so BEQ loops back and polls again. BNE would loop while data IS ready; mask $0002 tests TB and $0100 tests a data bit."
  - type: choice
    prompt: "When is it safe to write a new character to the UART's transmitter?"
    options: ["When TB = 0, meaning the transmitter is idle", "When TB = 1, meaning the transmitter is busy", "When DR = 1, meaning received data is waiting", "At any time, because the UART buffers all writes"]
    answer: 0
    explain: "Writing while TB = 1 may overwrite the data being sent and corrupt it, so the program polls TB until it reads 0."
  - type: choice
    prompt: "Study the listing. While the loop is running, what is the processor waiting for, and what does the BEQ do?"
    code: "START   LEA      $00006000,A5   * UART status word address\nLOOP1   MOVE.W   (A5),D0        * get UART status\n        ANDI.W   #$0001,D0      * test DR (bit 0)\n        BEQ      LOOP1          * keep waiting\n        * ...character is now ready"
    options: ["A received character: BEQ repeats the loop while DR = 0, so it falls through when DR = 1", "A free transmitter: BEQ repeats the loop while TB = 0", "A received character: BEQ repeats the loop while DR = 1", "An interrupt: BEQ enables interrupts and then returns"]
    answer: 0
    explain: "ANDI.W #$0001 isolates DR (bit 0). If DR is 0 the result is zero, Z is set and BEQ branches back to poll again; when DR = 1 the branch is not taken and the program continues with the character ready."
card:
  front: "How does an I/O port differ from memory, and how is a UART polled?"
  back: "A port is a latch that interfaces to the outside world. A DDR bit of 1 = output, 0 = input. What you write is not necessarily what you read; the input side can change on its own (volatile in C). UART: test DR before reading, test TB = 0 before writing."
glossary:
  - { term: "DDR", def: "Data direction register: one bit per port line, 1 for output and 0 for input in the reading's example." }
  - { term: "UART", def: "Universal asynchronous receiver/transmitter: a serial port with status bits for data ready and transmitter busy." }
---

## Learn

A D-type flip-flop or latch lets the fast processor bus and the slow outside world meet. When it faces the outside world we call it an **I/O port**. The 68K and ARM treat ports as part of **memory space** (memory-mapped I/O), so one instruction set serves both; the x86 uses a separate I/O space with its own instructions.

An 8-bit port may sit at an **even** address, with a **data direction register (DDR)** at the next odd address. Writing a 1 to a DDR bit makes that line an **output**; a 0 makes it an **input**. Writing $FF gives an 8-bit output port.

A port is **not memory**. What you wrote to the output side is not necessarily what you read from the input side, and the input side can change at any time. A C++ pointer to a port must be declared **volatile** so the compiler does not optimise the accesses away.

**Polling a UART.** The status bits tell you when to act: **DR = 1** means a received character can be read; **TB = 0** means the transmitter is free. Both loops mask the status bit and branch back until it is right (`ANDI.W #$0001,D0 / BEQ` for DR, `ANDI.W #$0002,D0 / BNE` for TB).

## Worked example

*A 16-bit UART word has status in DB0-DB7 and data in DB8-DB15. The word read is $4101. Is a character ready, and what is it?*

1. DB0 = bit 0 of $01 = **1**, so DR = 1: a character is ready.
2. The data byte is DB8-DB15 = **$41**, the ASCII letter A.
3. Reading the data clears DR, so the next poll will wait for a new character.

## Try it

*A port's DDR is set to $0F with 1 = output. How many lines are outputs and which are they?*

???

$0F = 00001111, so the **low four lines (bits 0 to 3) are outputs** and the upper four (bits 4 to 7) are inputs.
