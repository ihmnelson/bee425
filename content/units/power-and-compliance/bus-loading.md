---
track: shared
title: "Bus loading and buffering"
summary: "Each input adds capacitance and the driver can handle only so many; buffer busses with 74xx245 and 74xx244 parts at the cost of delay."
needs: ["buses-and-cells.bus-contention-tristate"]
sources:
  - { type: slide, ref: "L10 s481", quote: "As more inputs are connected to a single data line the capacitance loading increases" }
  - { type: slide, ref: "L10 s481", quote: "For standard TTL logic, the average output can reliably drive 10 inputs" }
  - { type: slide, ref: "L10 s481", quote: "74XX245 is a bi-directional bus transmitter and receiver" }
  - { type: slide, ref: "L10 s481", quote: "Adds to propagation delay of processor to memory transactions" }
checks:
  - type: choice
    prompt: "What is **fan-out**, and what is the standard-TTL figure in the lecture?"
    options: ["How many inputs one output can reliably drive: about 10 for standard TTL", "How many outputs one input has", "The number of pins", "The clock speed"]
    answer: 0
    explain: "The ability of a processor's output to drive a number of input loads is limited; for standard TTL, the average output can reliably drive 10 inputs (fan-out and fan-in)."
  - type: choice
    prompt: "Which buffer would you use on the **data bus**, and which on the **address bus**?"
    options: ["74xx245 (bidirectional transceiver) for data; 74xx244 (unidirectional buffer) for address", "74xx244 for data; 74xx245 for address", "Both 74xx245", "Neither"]
    answer: 0
    explain: "The data bus is bidirectional, so it needs a bus transceiver (74xx245); the address bus is one way, so a unidirectional buffer (74xx244) suffices."
  - type: choice
    prompt: "What is the **cost** of buffering a memory bus?"
    options: ["Extra propagation delay in every processor-to-memory transaction", "More wait states never matter", "Higher capacitance", "A slower clock is required"]
    answer: 0
    explain: "Buffers let a large memory system load the bus acceptably, but they add to the propagation delay, which eats into the memory timing margin (see the memory timing lesson)."
card:
  front: "What limits the number of devices on a bus, and how do you fix it?"
  back: "Every input adds capacitance, and a driver can reliably drive only a limited number (standard TTL about 10: fan-out). For large memory systems buffer the busses: 74xx245 bidirectional transceiver on data, 74xx244 unidirectional buffer on address; it adds propagation delay."
glossary:
  - { term: "Fan-out", def: "The number of inputs an output can drive reliably." }
---

## Learn

**Bus loading:** as more inputs connect to a single line, the **capacitance** loading increases, and a processor's output can drive only a limited number of loads. For standard TTL the average output can reliably drive **10 inputs** (the terms are **fan-out** and **fan-in**).

For large memory systems it is common to **buffer** the address and data busses: the **74xx245** is a **bidirectional** bus transmitter/receiver (for the data bus) and the **74xx244** a **unidirectional** buffer (for the address bus). The cost: buffers **add to the propagation delay** of processor-to-memory transactions.

## Worked example

*A processor output must drive 32 memory chips. How do you handle it?*

1. 32 loads exceeds the roughly 10-input limit.
2. Put a 74xx244 buffer on each address line (and 74xx245 transceivers on data) so each buffer drives its share.
3. Re-check the memory timing, since the buffer adds delay.

## Try it

*Why is a 74xx245 and not a 74xx244 used on the data bus?*

???

Data travels both ways (reads and writes), so a bidirectional transceiver is needed; a unidirectional buffer would only pass it one way.
