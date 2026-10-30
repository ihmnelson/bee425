---
track: shared
title: "Sharing a bus: contention, open collector and tri-state"
summary: "Plain gate outputs cannot share a wire; open-collector outputs can, slowly; tri-state outputs can, quickly."
needs: [processor-basics.bus-types]
sources:
  - { type: slide, ref: "L6 s259", quote: "Short circuit ( bus contention)" }
  - { type: slide, ref: "L6 s261", quote: "OC outputs can only pull the bus wire low" }
  - { type: slide, ref: "L6 s261", quote: "LOW to HIGH transitions are problematic due to RC time constant" }
  - { type: slide, ref: "L6 s264", quote: "Truth table for Bus Interface Gate" }
  - { type: own, ref: "the 10%-90% rise time of an RC circuit is about 2.2 RC (standard result; the slide asks for the calculation without giving the formula)" }
checks:
  - gen: bus.ocRise
  - type: choice
    prompt: "Two ordinary gate outputs drive the same wire, one high and one low. What happens?"
    options: ["Bus contention: a short circuit, with an indeterminate logic level", "The wire goes high", "The wire averages to 2.5 V and works fine", "The lower output wins safely"]
    answer: 0
    explain: "A high output (5 V) and a low output (0 V) connected together form a short circuit, and the actual level is indeterminate."
  - type: choice
    prompt: "Which statement about an **open-collector** bus is correct?"
    options: ["Outputs can only pull the wire low; a pull-up resistor makes it high, so falling edges are fast and rising edges are slow", "Outputs can drive both high and low quickly", "No pull-up is needed", "Multiple low outputs cause a conflict"]
    answer: 0
    explain: "OC outputs can only pull low, so several lows cannot conflict. The resistor pulls the line high, but the RC time constant makes low-to-high transitions slow and limits system speed."
  - type: choice
    prompt: "A **tri-state** output with Output Enable = 1 (disabled) is in which state?"
    options: ["High impedance (Hi-Z): disconnected from the bus", "Logic 0", "Logic 1", "Undefined short circuit"]
    answer: 0
    explain: "The truth table: with OE = 0 the output follows the input (1 or 0); with OE = 1 the output is Hi-Z regardless of the input. The lecture's bus interface closes a switch to connect and opens it to isolate."
card:
  front: "How can many devices share one bus line?"
  back: "Not with plain outputs (contention = short circuit). Open collector: outputs only pull low, a pull-up resistor makes high; falling edges fast, rising edges slow (RC). Tri-state: each output has a switch (output enable); only one device is enabled, the others are Hi-Z."
glossary:
  - { term: "Bus contention", def: "Two outputs driving a shared line to opposite levels, causing a short circuit and an indeterminate level." }
  - { term: "Tri-state (Hi-Z)", def: "An output with three states: 0, 1 and high impedance (disconnected); an output enable switches it onto the bus." }
---

## Learn

Busses simplify how data moves: many devices connect to the same data path. The problem: **how do you connect outputs together without a short circuit?** Two ordinary outputs, one at 5 V and one at 0 V, create **bus contention**, a short circuit with an indeterminate level.

**Open collector (OC).** The output is the uncommitted collector of an NPN transistor: either an open circuit or a short to ground.
- OC outputs can only **pull the wire low**; a **pull-up resistor** makes it high. Multiple LOW outputs cannot conflict.
- HIGH-to-LOW is fast (a low-impedance path to ground); **LOW-to-HIGH is slow** because of the RC time constant of the pull-up and the wire's capacitance, which limits system speed.
- The lecture's rise-time exercise: 1 kΩ pull-up, one OC output (10 pF), gate inputs (10 pF each) and a 10-inch trace (1 pF per inch). The 10%-90% rise time of an RC circuit is about **2.2 RC**.

**Tri-state.** Every bus device is a logic block plus a **bus interface unit** that can supply drive current for both transitions. The interface is a switch (a MOSFET in series with the output): close it to connect, open it to disconnect.

| Output Enable | Input | Output |
|---|---|---|
| 0 | 1 | 1 |
| 0 | 0 | 0 |
| 1 | 1 | Hi-Z |
| 1 | 0 | Hi-Z |

Only one device's output is enabled at a time, which is how memories and registers share a bus.

## Worked example

*A 1 kΩ pull-up and 40 pF of total load. What is the rise time?*

1. RC = 1,000 ohm x 40 pF = 40 ns.
2. 10%-90% rise time = 2.2 x 40 ns = **88 ns**.
3. That is why OC buses are slow: a few tens of pF with a kilohm pull-up costs tens of ns per rising edge.

## Try it

*Why can a tri-state bus run faster than an open-collector bus?*

???

A tri-state output actively drives **both** the high and the low level through its bus interface, so neither edge waits for a pull-up resistor to charge the line's capacitance through an RC time constant.
