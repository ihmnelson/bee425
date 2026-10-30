---
track: shared
title: "Darlington and compound (Sziklai) pairs"
summary: "Two transistors multiply their betas so a weak pin can switch a large load; a Darlington needs 1.2 V, a compound pair 0.6 V."
needs: [base-resistor-design]
sources:
  - { type: slide, ref: "L8 s376", quote: "This configuration is called a" }
  - { type: slide, ref: "L8 s378", quote: "Turn on voltage of Darlington pair = 1.2 V" }
  - { type: slide, ref: "L8 s379", quote: "Advantage is that the turn on voltage is only 0.6 V" }
  - { type: slide, ref: "L8 s379", quote: "Similar to a Darlington pair, except it uses one NPN" }
checks:
  - gen: bjt.darlington
  - gen: bjt.darlington
  - type: choice
    prompt: "A Darlington pair has β1 = 200 and β2 = 50. What is the effective beta?"
    options: ["10,000 (the product)", "250", "150", "4"]
    answer: 0
    explain: "The collector current is multiplied by the product of the betas: β = β1 x β2 = 200 x 50 = 10,000."
  - type: choice
    prompt: "Why does a Darlington pair need **1.2 V** at its base while a single transistor needs 0.6 V?"
    options: ["Two base-emitter junctions are in series, each dropping about 0.6 V", "It has a bigger resistor", "Because β is larger", "It is a rule of thumb with no cause"]
    answer: 0
    explain: "The first transistor's emitter drives the second's base, so two Vbe drops (2 x 0.6 V = 1.2 V) are in series between the base and ground."
  - type: choice
    prompt: "What is the **advantage of the compound feedback (Sziklai) pair** over a Darlington?"
    options: ["It uses one NPN and one PNP and turns on at only 0.6 V instead of 1.2 V", "It has a larger beta", "It needs no base resistor", "It works only on AC"]
    answer: 0
    explain: "The compound pair has current gain similar to a Darlington, but the turn-on voltage is only about 0.6 V. Its total emitter current is about IB x βQ1 x βQ2."
card:
  front: "How do Darlington and compound pairs work and how do you size their base resistor?"
  back: "Pre-driver transistor Q1 feeds the base of power transistor Q2: β = β1 x β2. Darlington (two NPN) turn-on 1.2 V; Sziklai/compound (NPN + PNP) turn-on 0.6 V. Ic = Vcc / RL; Ib = Ic / β; R = (V_IO - turn-on) / Ib."
glossary:
  - { term: "Darlington pair", def: "Two transistors with the first driving the second's base, giving a current gain equal to the product of their betas." }
---

## Learn

One transistor may not be enough for large currents (a 2N3055 power transistor has β of only 20-70). A **pre-driver** transistor boosts the current into the driver: a **Darlington pair**, whose effective **β = β1 x β2**. With β(Q1) = 200 and β(Q2) = 50, β = 10,000.

Example from the lecture: β1 = 20 (2N3055) and β2 = 100 (2N2222), so β = 2,000, driving a 10 Ω load from 40 V:
- IC = 40 / 10 = **4 A**.
- IB = 4 / 2,000 = **2 mA**.
- The pair turns on at **1.2 V** (two base-emitter drops in series).
- With a 5 V pin: R = (5 - 1.2) / 2 mA = **1.9 kΩ**.

**Compound feedback pair** (also the **Sziklai pair**): one NPN and one PNP. Current gain is similar, but the **turn-on voltage is only 0.6 V**. Total emitter current = IB (1 + βQ1 + βQ2 x βQ1); since βQ2 x βQ1 is much bigger than 1 + βQ1, it is about IB x βQ2 x βQ1.

## Worked example

*Power rail 75 V, load 50 Ω, βQ1 = 200, βQ2 = 50, pin 5 V at 5 mA max (the lecture's question). Choose Rx.*

1. IC = 75 / 50 = 1.5 A.
2. IB = 1.5 / (200 x 50) = 0.15 mA.
3. Rx = (5 - 0.6) / 0.15 mA = 29 kΩ (compound pair turn-on 0.6 V); 27 kΩ standard gives a little extra current.

## Try it

*What does a single transistor with β = 50 need as base current for a 1.5 A load, and why is that too much for a pin limited to 5 mA?*

???

IB = 1.5 A / 50 = 30 mA, six times the pin's 5 mA limit. That is exactly why a Darlington or compound pair (or a MOSFET) is needed.
