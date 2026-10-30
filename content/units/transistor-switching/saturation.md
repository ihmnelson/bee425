---
track: shared
title: "Saturation: what the collector voltage does"
summary: "More base current than needed does not push the collector below about 0.4 V; the transistor is then a closed switch."
needs: [base-resistor-design]
sources:
  - { type: slide, ref: "L8 s360", quote: "We have merely driven the transistor into saturation" }
  - { type: slide, ref: "L8 s360", quote: "The collector voltage cannot go lower than slightly above ground" }
  - { type: slide, ref: "L8 s364", quote: "Any base current greater than approximately 2.45 mA is" }
  - { type: slide, ref: "L8 s359", quote: "Example: if β (or hfe)= 100, what is the voltage at the collector of the" }
checks:
  - gen: bjt.collectorVoltage
  - gen: bjt.collectorVoltage
  - gen: bjt.satBase
  - type: choice
    prompt: "With a 330 Ω load on 25 V, β = 100, and a 1 kΩ base resistor from 5 V, the 'formula' gives a collector voltage of -120 V. What actually happens?"
    options: ["The transistor saturates and the collector sits near 0.4 V", "The collector goes to -120 V", "The transistor burns out immediately", "Nothing; the voltage is 25 V"]
    answer: 0
    explain: "IB = 4.4 mA gives a wanted IC of 440 mA, but the load can only pass (25 - 0.4) / 330 = 74.5 mA. The transistor is driven into saturation: the collector cannot go below about 0.4 V. Input = 0 V gives collector = 25 V; input = 5 V gives 0.4 V: a switch."
  - type: choice
    prompt: "Why must the simple formula V = Vcc - β x IB x RL always get a **sanity check**?"
    options: ["It can predict a collector voltage below ground, which is impossible; then the transistor is saturated", "It always gives the right answer", "It only works for PNP", "It ignores Vcc"]
    answer: 0
    explain: "The lecture's exercise: iB = 3 mA with β = 100 and 100 Ω on 25 V predicts -5 V. That fails the sanity check, because the collector cannot go below ground; it saturates at about 0.4 V. Any base current above about 2.45 mA saturates it."
card:
  front: "What is saturation and how do you find the collector voltage?"
  back: "Compute IC wanted = β x IB. The load can pass at most (Vcc - 0.4) / RL. If wanted >= max, the transistor is saturated: Vc = 0.4 V (a closed switch). Otherwise Vc = Vcc - IC x RL. Saturation needs IB >= (Vcc - 0.4) / (RL x β)."
glossary:
  - { term: "Saturation", def: "The state where more base current no longer lowers the collector voltage; Vce is about 0.4 V and the transistor acts as a closed switch." }
---

## Learn

Biasing for switching, with a 25 V supply and a 330 Ω collector resistor:

- **10 kΩ base resistor:** IB = (5 - 0.6) / 10 kΩ = **440 µA**; with β = 100, IC = 44 mA; V across 330 Ω = 14.5 V; **collector = 25 - 14.5 = 10.5 V** (not saturated).
- **1 kΩ base resistor:** IB = 4.4 mA; the formula says IC = 440 mA and 145 V across the resistor: impossible. Don't worry: we have merely driven the transistor into **saturation**. The collector voltage cannot go lower than slightly above ground (about **0.4 V**, Vce(sat)). The transistor is now a switch: **input 0 V gives collector 25 V; input 5 V gives collector 0.4 V.**

Design exercises from the lecture (25 V supply, 100 Ω load, β = 100):
- To make the collector **1 V**: ΔV = 24 V, i = 240 mA, so IB = 2.4 mA; the transistor dissipates 1 V x 240 mA = **240 mW**.
- With **IB = 3 mA**: the formula gives 30 V across the load and -5 V at the collector: fails the **sanity check**, so the transistor is saturated at about 0.4 V. Any base current above roughly **2.45 mA** saturates it.

Completed circuit: a 5 V, 3 mA pin and a **1.5 kΩ** resistor (4.4 V / 3 mA, rounded) switch the 100 Ω load.

## Worked example

*A 50 V supply, 500 Ω collector resistor, β = 150, and a 3.3 V I/O pin through a base resistor: what is the base current needed for saturation?*

1. IC(sat) = (50 - 0.4) / 500 = 99.2 mA (about 100 mA; the lecture rounds to 50 mA for the stated spec).
2. IB(min) = 99.2 / 150 = **0.66 mA**.
3. Any more than that just saturates harder.

## Try it

*A transistor is saturated. What is its power dissipation if it carries 200 mA?*

???

About 0.4 V x 200 mA = **80 mW**. Saturation is efficient: little voltage across the transistor, so little power lost in it.
