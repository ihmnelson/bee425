---
track: shared
title: "Power distribution: central versus local regulation"
summary: "A tightly regulated central supply needs only local filters but drops voltage on the way; local regulators cost more and make heat on each board."
needs: ["cmos-power"]
sources:
  - { type: slide, ref: "L10 s478", quote: "Central power regulation: Power supply distributes well-regulated power to" }
  - { type: slide, ref: "L10 s478", quote: "Local regulation: Each board contains its own power supply regulation" }
  - { type: slide, ref: "L10 s475", quote: "Typical versus worst-case current specifications" }
checks:
  - type: choice
    prompt: "Which is an advantage of **local regulation** (a regulator on each board)?"
    options: ["It tolerates a loosely regulated supply and voltage drop in the distribution, at the cost of extra parts and heat on each board", "It is cheaper", "It needs no regulators", "It removes the need for a supply"]
    answer: 0
    explain: "Local regulation lets each board have its own regulator fed from a loosely regulated supply: additional cost and heat dissipation on each board, but the voltage drop between supply and board matters less."
  - type: choice
    prompt: "What is the drawback of **central regulation**?"
    options: ["The well-regulated supply may cost more and you must worry about the voltage drop between the supply and each board", "It needs more regulators", "Boards need big capacitors", "It has no drawbacks"]
    answer: 0
    explain: "Each board then only needs a local filter capacitor, but the tightly regulated supply may be more expensive than a loosely regulated one and the distribution drop must be checked."
  - type: choice
    prompt: "When calculating power requirements, which current specification should you design for?"
    options: ["Check both the typical and worst-case specifications; supplies must meet the worst case", "Typical only", "Minimum only", "None"]
    answer: 0
    explain: "The lecture says to calculate the requirement from typical versus worst-case current specifications; the supply and cooling must handle the worst case."
card:
  front: "Compare central and local power regulation."
  back: "Central: one tightly regulated supply feeds all boards (each needs only a filter capacitor), maybe costlier, watch distribution voltage drop. Local: each board regulates from a loosely regulated supply (extra cost and heat per board). Size the supply from worst-case currents."
glossary: []
---

## Learn

**Power distribution** has two approaches:

- **Central regulation:** one well-regulated supply distributes power to each board; each board needs only a **local filter capacitor**. The supply may cost more than a loosely regulated one, and you must worry about the **voltage drop** between the supply and the boards (see the trace-resistance lesson).
- **Local regulation:** each board has its own regulation circuit fed from a loosely regulated supply (for example a 78M05 regulator): **additional cost and heat dissipation** on each board.

When **calculating power requirements**, compare **typical versus worst-case** current specifications.

## Worked example

*Three boards each draw 1 A at 5 V and are 2 m from the supply through wires with 0.05 Ω resistance each way. Why might you regulate locally?*

1. Drop = 1 A x (0.05 + 0.05) = 0.1 V per board (and more with all three on one cable).
2. A 0.1 V loss on a 5 V rail is 2% and varies with load.
3. A local regulator fed from a slightly higher voltage removes that variation.

## Try it

*What does each board need under central regulation?*

???

Only a local filter (bypass) capacitor.
