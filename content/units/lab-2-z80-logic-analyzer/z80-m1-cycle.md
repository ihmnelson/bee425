---
track: shared
title: "The Z80 op-code fetch (M1) cycle"
summary: "Four T states: ~M1, ~MREQ and ~RD go low in T1; the op-code is read at the rising edge of T3; at 4 MHz it takes 1 µs."
needs: ["processor-basics.bus-types", "clocks-and-pulses.time-and-frequency"]
sources:
  - { type: handout, ref: "lab2 VI", quote: "Fetching the op-code requires 4 complete periods of the clock" }
  - { type: handout, ref: "lab2 VI", quote: "With a 4 Mhz clock, each clock period, or T state, lasts 250 ns" }
  - { type: handout, ref: "lab2 VI", quote: "the Z80 reads in the op-code" }
  - { type: handout, ref: "lab2 VI", quote: "focus the line where the signals ~M1, ~RD and ~MREQ are all active" }
checks:
  - type: choice
    prompt: "How long does a Z80 op-code fetch (the M1 cycle) take at 4 MHz?"
    options: ["4 clock periods x 250 ns = 1 µs", "250 ns", "3 µs", "4 ns"]
    answer: 0
    explain: "The M1 cycle consists of T1 to T4: four complete clock periods. At 4 MHz each T state is 250 ns, so the fetch takes 1 microsecond."
  - type: choice
    prompt: "Which signals are **all low** while an op-code is being fetched?"
    options: ["~M1, ~MREQ and ~RD", "~WR, ~IORQ and ~RD", "~RESET and ~WAIT", "~HALT and ~NMI"]
    answer: 0
    explain: "~M1 goes low at the beginning of T1; at the falling edge in T1 the Z80 also asserts ~MREQ (a memory operation, not I/O) and ~RD (a read); the address is then stable."
  - type: choice
    prompt: "When does the Z80 actually **read** the op-code from the data bus?"
    options: ["On the rising edge of the clock in T3", "In T1", "In T4", "Never; the memory writes it"]
    answer: 0
    explain: "The memory places the data on the bus during T2 and the Z80 reads it at the rising edge in T3; T3 and T4 are used to decode and execute internally (and for the refresh address, which this lab ignores)."
  - type: choice
    prompt: "Why is the Z80 a good first microprocessor to look at with a logic analyzer?"
    options: ["No ambiguity between what you see on the analyzer and what the processor is doing (no caches or prefetch queues)", "It is the fastest", "It has the most pins", "It is a RISC"]
    answer: 0
    explain: "More complex processors have caches and prefetch queues that make real-time analysis hard. The 68008 in Lab 3 has a two-word prefetch queue that reorders fetch and execution."
card:
  front: "Describe the Z80 M1 cycle."
  back: "Four T states (T1-T4). T1: address valid; ~M1 low; at the falling edge ~MREQ and ~RD go low (address now stable). T2: memory puts data on the bus. Rising edge of T3: Z80 reads the op-code; signals go inactive. T3-T4 decode (and refresh). At 4 MHz: 250 ns per T state, 1 µs per fetch."
glossary:
  - { term: "M1 cycle", def: "The first machine cycle of a Z80 instruction, in which the op-code is fetched; ~M1 is low during it." }
  - { term: "T state", def: "One clock period of a Z80 machine cycle." }
---

## Learn

The **Z80** is a state machine: every operation is synchronised to the clock. The **op-code fetch** (the first part of an instruction, telling the processor what to do) is the **M1 cycle**: **4 complete clock periods, T1 to T4**, with the **~M1** pin asserted (low) at the start of T1. At **4 MHz** each T state is **250 ns**, so the fetch takes **1 µs**.

- Shortly after the rising edge in T1 the address starts appearing on the 16 address lines; at the **falling edge in T1** the Z80 asserts **~MREQ** (a processor-to-memory operation rather than I/O) and **~RD** (a read). Now the address is stable for this M1 cycle and the memory may respond.
- During T2 the memory places the data (the op-code) on the data lines; on the **rising edge in T3** the Z80 **reads the op-code**. Soon ~M1, ~MREQ and ~RD return to idle.
- During T3 and T4 the processor decodes the instruction. Ordinary memory reads and writes that follow take 3 clock cycles because no decoding is needed.

On the analyzer, find the row where **~M1, ~RD and ~MREQ are all low**: an op-code is being fetched and the address is stable. The ~RFSH refresh address and ~WAIT behaviour can be ignored in this lab (on later boards ~RFSH became ~IOREQ).

## Worked example

*A Z80 runs at 2 MHz. How long is an M1 cycle?*

1. T state = 1 / 2 MHz = 500 ns.
2. M1 = 4 x 500 ns = **2 µs**.
3. An instruction with an op-code and one operand (a 3-cycle read after the M1) takes longer than one fetch.

## Try it

*Which signal tells outside logic that an op-code is being fetched?*

???

**~M1** (active low). With ~MREQ and ~RD low as well, memory knows an op-code read is under way.
