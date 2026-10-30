---
track: shared
title: "Memory cells: the flip-flop and the 6-transistor SRAM cell"
summary: "A bit is stored by feedback in two inverters; a real SRAM cell needs 6 transistors."
needs: [bus-contention-tristate]
sources:
  - { type: slide, ref: "L6 s268", quote: "A single bit memory cell" }
  - { type: slide, ref: "L6 s270", quote: "Real STATIC RAM (SRAM) memories are designed around a memory cell" }
  - { type: slide, ref: "L6 s270", quote: "Each inverter gate is two transistors" }
checks:
  - type: choice
    prompt: "How many transistors are in a real **SRAM 6T cell**, and where do they come from?"
    options: ["6: two inverters (two transistors each) plus two switch transistors", "1 transistor and a capacitor", "2: one per inverter", "8: two inverters and four switches"]
    answer: 0
    explain: "Each inverter is two transistors, and each of the two switches is one transistor: 2 + 2 + 1 + 1 = 6 transistors per cell."
  - type: choice
    prompt: "Why is the cross-coupled inverter pair a **memory**?"
    options: ["Feedback holds it in a stable 0 or 1 state until something temporarily grounds one input", "It stores charge on a capacitor", "It uses a magnetic core", "It is clocked by the CPU"]
    answer: 0
    explain: "The two-gate configuration is stable; temporarily grounding the input of one gate flips the state, and grounding the other flips it back. The switches (BIT and ~BIT) provide that access."
  - type: choice
    prompt: "A memory cell built from a D flip-flop with an output tri-state buffer has three connections to the outside. Which of these is **not** one of them?"
    options: ["A refresh strobe", "Data in/out (DATA I/O)", "Write (W, the clock)", "Output enable (OE)"]
    answer: 0
    explain: "The slide's one-bit cell has D/Q, a clock (W) and a tri-state OE. No refresh is needed because a flip-flop (SRAM) holds its state by feedback; refresh belongs to DRAM."
card:
  front: "How does an SRAM cell store a bit and how many transistors does it use?"
  back: "Two cross-coupled inverters (2 transistors each) hold a stable state by feedback; two switch transistors let a BIT/~BIT line temporarily force the state: 6 transistors per cell (6T)."
glossary:
  - { term: "SRAM (static RAM)", def: "Memory whose cell holds its state by feedback (a flip-flop); needs 5 or 6 transistors per bit and no refresh." }
---

## Learn

A single-bit memory cell is a **D flip-flop core** (without set/reset) with a **tri-state buffer** on its output: data in/out (D, Q), a write clock (W) and an output enable (OE). A memory chip arranges many of these cells in rows; the memory decoding logic selects a row from address bits (A0, A1) together with CS, RD and WR.

Real **static RAM (SRAM)** is built around a **6-transistor (6T) cell**: two cross-coupled inverters, which hold a stable 0/1 state through feedback, plus two switch transistors. Each inverter is two transistors, each switch one: **6 transistors per cell**. Briefly grounding the input of one inverter flips the state; grounding the other flips it back, and the BIT and ~BIT lines do exactly this when written.

SRAM works well for fast, local storage such as cache, and has a simple interface to the processor.

## Worked example

*How many transistors does a 1-Kbit SRAM array need for its cells (ignoring decoders)?*

1. 1 Kbit = 1,024 cells.
2. 6 transistors per cell = 1,024 x 6 = **6,144 transistors**.
3. A DRAM of the same size would use 1,024 (one per cell) plus capacitors.

## Try it

*Which two DRAM-versus-SRAM differences does this cell already hint at?*

???

SRAM holds its state by **feedback** (so no refresh) but needs about **6 transistors per bit**, while DRAM stores a charge on a capacitor with **1 transistor per bit** and must be refreshed.
