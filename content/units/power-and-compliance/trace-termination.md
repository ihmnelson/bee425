---
track: shared
title: "Trace termination"
summary: "Fast or long traces are transmission lines; terminate when the length is at least tR / (2 x tPR)."
needs: ["rf-compliance", "pcb-design.clock-skew"]
sources:
  - { type: slide, ref: "L10 s482", quote: "Traces on PC boards are transmission lines" }
  - { type: slide, ref: "L10 s482", quote: "Length ≥ tR / [ 2 x tPR ]" }
  - { type: slide, ref: "L10 s482", quote: "Signal propagation rate ( ~150 ps/inch on normal PC board )" }
  - { type: slide, ref: "L10 s483", quote: "Thévenin Trace termination" }
checks:
  - gen: conv.termLength
  - gen: conv.termLength
  - type: choice
    prompt: "Why terminate a trace at all?"
    options: ["Traces are transmission lines: without termination the signal reflects at the receiver, causing RF interference and a lower noise margin", "To save power", "To speed up the clock", "To add capacitance"]
    answer: 0
    explain: "Reflected signals cause RF interference and lower the noise margin. Impedance control matters when the rise time approaches the round-trip propagation time."
  - type: choice
    prompt: "Which are the common termination methods in the lecture?"
    options: ["Parallel (R = ZT at the receiver), Thévenin (R1 || R2 = ZT with the Thévenin voltage at the switching point, not for floating outputs), and with a capacitor to reduce steady-state current", "Only series", "None", "Only capacitors"]
    answer: 0
    explain: "Parallel termination: a resistor equal to the characteristic impedance. Thévenin: two resistors whose parallel value equals ZT. The capacitor variant blocks DC and reduces steady-state current drain."
card:
  front: "When and how do you terminate a trace?"
  back: "Terminate when length >= tR / (2 x tPR), with tR the fastest edge and tPR about 150 ps/inch (0.5 ns gives 1.67 in). Methods: parallel R = ZT; Thévenin R1 || R2 = ZT (set the voltage at the switching point; not for floating outputs); add a capacitor to cut DC current."
glossary:
  - { term: "Characteristic impedance", def: "The impedance a transmission line presents to a travelling signal; a termination equal to it prevents reflections." }
---

## Learn

PC board traces are **transmission lines**. Without termination, a signal **reflects at the receiving end**, causing RF interference and lowering the noise margin. Impedance control becomes an issue when a signal's rise time approaches the **round-trip propagation time**.

**When to terminate** (rule of thumb): **length >= tR / (2 x tPR)**, where tR is the rise or fall time (whichever is faster) and tPR is the propagation rate, about **150 ps per inch** on a normal PC board. Example: a 0.5 ns edge gives 500 ps / (2 x 150 ps) = **1.67 inches**.

**Methods:**
- **Parallel:** a resistor R = ZT at the receiver.
- **Thévenin:** R1 and R2 with R1 || R2 = ZT; set the Thévenin voltage at the switching point; do not use with floating outputs.
- Add a **capacitor** (in series with the resistor) to reduce the steady-state current drain.

## Worked example

*A 1 ns edge on a board with 150 ps/inch. Terminate traces longer than?*

1. Length >= 1,000 ps / (2 x 150 ps/in).
2. = 1,000 / 300 = **3.33 inches**.
3. A faster 0.25 ns edge would cut that to 0.83 inches.

## Try it

*Why does a faster edge need termination on shorter traces?*

???

The threshold length is proportional to the rise time, so a faster edge (smaller tR) makes even a short trace behave like a transmission line.
