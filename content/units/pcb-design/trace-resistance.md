---
track: shared
title: Trace resistance, voltage drop and trace width
summary: R = rho x L / A; the drop is I x R and the loss is I^2 x R, so power traces must be wide.
needs: [pcb-workflow]
sources:
  - { type: slide, ref: "L2 s68", quote: "R( ohms ) = ρ x L /A" }
  - { type: slide, ref: "L2 s67", quote: "Thickness of copper (T)" }
  - { type: slide, ref: "L2 s68", quote: "Trace width = 125 mil" }
checks:
  - gen: pcb.traceDrop
  - gen: pcb.traceWidth
  - type: choice
    prompt: "A copper trace has a voltage drop that is too large. Which change **reduces** it?"
    options: ["Make the trace wider", "Make the trace longer", "Raise the current", "Make the copper thinner"]
    answer: 0
    explain: "R = ρL/A. A wider trace has more cross-sectional area A, so less resistance and less drop. A longer trace, more current or thinner copper all make it worse."
card:
  front: "How do you find the voltage drop and power loss of a PCB trace?"
  back: "R = ρL/A (A = width x thickness). Drop = I x R. Power loss = I^2 x R. Convert everything to the same units first (1 mil = 0.001 in = 0.00254 cm)."
glossary:
  - { term: "Mil", def: "One thousandth of an inch (0.001 in = 0.00254 cm); the usual unit for trace width and copper thickness." }
---

## Learn

A trace is a thin copper wire, so it has resistance:

> **R = ρ x L / A**, with ρ the resistivity of copper (1.68 x 10^-6 ohm-cm at 20 C), L the trace length and A its cross-sectional area (**width x copper thickness**).

The geometry that sets a trace's electrical behaviour is its **copper thickness (T)**, **width (W)**, **height above the ground plane (H)** and the **dielectric constant**.

Once you have R:

- **Voltage drop = I x R** (the power rail sags along the trace).
- **Power lost as heat = I^2 x R**, which is also what heats the trace.

Keep the units consistent. Units trap: 1 mil = 0.001 in, and 1 in = 2.54 cm, so 1 mil = 0.00254 cm. If ρ is in ohm-cm, convert width, thickness and length to **cm**.

This is why power and ground traces must be wide: a few amps through a thin trace gives a large drop and a lot of heat.

## Worked example

*The lecture's question: copper 1 mil thick, trace 125 mil wide and 3 in long, ρ = 1.68 x 10^-6 ohm-cm, current 10 A. Find the voltage drop and power loss.*

1. Area: 1 mil x 125 mil = 0.00254 cm x 0.3175 cm = 8.06 x 10^-4 cm^2.
2. Length: 3 in x 2.54 = 7.62 cm.
3. R = 1.68 x 10^-6 x 7.62 / 8.06 x 10^-4 = **0.0159 ohm**.
4. Drop = 10 A x 0.0159 = **0.159 V**. Power = 10^2 x 0.0159 = **1.59 W**.

## Try it

*A power trace is 4 in long, 2 mil thick, and must carry 8 A with at most 100 mV of drop. How wide must it be?*

???

R must be at most 0.1 V / 8 A = 0.0125 ohm. A = ρL/R = 1.68 x 10^-6 x 10.16 cm / 0.0125 = 1.37 x 10^-3 cm^2. Width = A / thickness = 1.37 x 10^-3 / 0.00508 cm = 0.269 cm = about **106 mil** (0.106 in).
