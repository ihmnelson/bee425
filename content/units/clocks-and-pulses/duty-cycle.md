---
track: shared
title: Duty cycle
summary: Duty cycle = time high / (time high + time low); 50% means high and low are equal.
needs: [time-and-frequency]
sources:
  - { type: slide, ref: "L2 s103", quote: "Duty cycle = tPH / (tPH + tPL) x 100%" }
  - { type: slide, ref: "L2 s103", quote: "The clock signal shown below has a 25% duty cycle" }
checks:
  - gen: clock.dutyCycle
  - gen: clock.dutyCycle
  - type: choice
    prompt: "A clock is **low for half as long as it is high**. Is its duty cycle 50%?"
    options: ["No. It is 66.7%: high two-thirds of the time", "Yes. 50% means low is half of high", "No. It is 33.3%", "It cannot be found without the frequency"]
    answer: 0
    explain: "50% duty cycle means the high time equals the low time. If low is half of high, say high = 2 and low = 1, the duty cycle is 2 / (2 + 1) = 66.7%."
card:
  front: "Define duty cycle and give the value for a symmetrical clock."
  back: "Duty cycle = t_high / (t_high + t_low) x 100%. A symmetrical clock (high time equals low time) has a 50% duty cycle."
glossary:
  - { term: "Duty cycle", def: "The share of each clock cycle that the signal is high: t_high / (t_high + t_low)." }
---

## Learn

A clock is a continuous stream of pulses, but the pulses need not be symmetrical. Let **tPH** be the time the pulse is high and **tPL** the time it is low in one cycle.

> **Duty cycle = tPH / (tPH + tPL) x 100%**

- High time equals low time: **50%**.
- High for 1/4 of the cycle: **25%**.
- Note that tPH + tPL is the whole **period**, so duty cycle = tPH / T.

Duty cycle says nothing about frequency: a 1 kHz and a 1 MHz clock can both be 50%.

## Worked example

*A clock is high for 30 ns and low for 90 ns. Find its duty cycle and frequency.*

1. Period = 30 + 90 = 120 ns.
2. Duty cycle = 30 / 120 = **25%**.
3. Frequency = 1000 / 120 = **8.33 MHz**.

## Try it

*A clock has a 40% duty cycle and a period of 50 ns. How long is it high?*

???

High time = 0.40 x 50 ns = **20 ns**, so it is low for 30 ns.
