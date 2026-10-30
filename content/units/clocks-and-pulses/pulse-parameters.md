---
track: shared
title: Pulse width, rise time and fall time
summary: Width is measured at 50%; rise and fall times between 10% and 90%; logic levels have thresholds.
needs: [duty-cycle]
sources:
  - { type: slide, ref: "L2 s104", quote: "Rise time: Time to get from 10% to 90% of pulse height" }
  - { type: slide, ref: "L2 s104", quote: "Pulse width: Width of pulse at 50% of maximum voltage" }
  - { type: slide, ref: "L2 s106", quote: "logic 1 is greater than 2.5 volts and logic 0 is less than 1 volt" }
checks:
  - type: choice
    prompt: "Between which two points of the pulse height is **rise time** measured?"
    options: ["10% to 90%", "0% to 100%", "50% to 100%", "25% to 75%"]
    answer: 0
    explain: "Rise time is the time to get from 10% to 90% of pulse height; fall time is the time from 90% down to 10%."
  - type: choice
    prompt: "Where is the **pulse width** measured?"
    options: ["At 50% of the maximum voltage", "At the 10% point", "At the 90% point", "At ground"]
    answer: 0
    explain: "Pulse width is the width of the pulse at 50% of maximum voltage."
  - type: choice
    prompt: "In the lecture's example of a real clock, which levels will be read correctly as logic 1 and logic 0?"
    options: ["Above 2.5 V as 1 and below 1 V as 0", "Anything above 0 V as 1", "Exactly 5 V as 1 and 0 V as 0", "Above 1 V as 1 and below 0.1 V as 0"]
    answer: 0
    explain: "The slide's real clock is judged against thresholds: as long as logic 1 is above 2.5 V and logic 0 below 1 V it is interpreted properly. In between is 'not defined'."
card:
  front: "How are pulse width, rise time and fall time defined?"
  back: "Pulse width: width at 50% of maximum voltage. Rise time: from 10% to 90% of pulse height. Fall time: from 90% to 10%."
glossary:
  - { term: "Rise time", def: "The time for a pulse to go from 10% to 90% of its height." }
---

## Learn

Dissecting a **positive pulse**:

- **Pulse width**: the width of the pulse measured at **50% of the maximum voltage**.
- **Rise time**: the time to go from **10% to 90%** of the pulse height.
- **Fall time**: the time to go from **90% to 10%**.

An oscilloscope can calculate these automatically.

Real pulses are not ideal, and that is fine as long as they stay on the right side of the logic thresholds. In the lecture's real-clock slide, a signal above **2.5 V** is a logic 1 and one below **1 V** is a logic 0; in between is **not defined**, so the signal must pass through that region quickly.

## Worked example

*A pulse swings from 0 V to 3 V. At what voltages do you measure rise time and pulse width?*

1. Rise time: from 10% of 3 V = **0.3 V** to 90% = **2.7 V**.
2. Pulse width: at 50% = **1.5 V** (the time between the rising and falling crossings of 1.5 V).
3. Fall time: from 2.7 V down to 0.3 V.

## Try it

*A 5 V pulse takes 12 ns to go from 0.5 V to 4.5 V. What is the rise time?*

???

10% of 5 V is 0.5 V and 90% is 4.5 V, so those are exactly the rise-time points: the rise time is **12 ns**.
