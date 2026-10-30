---
track: shared
title: "CMOS power: voltage, frequency and heat"
summary: "Power rises with the square of the supply voltage and linearly with clock frequency; most of it is spent while gates switch."
needs: []
sources:
  - { type: slide, ref: "L10 s477", quote: "When a gate is switching between states" }
  - { type: slide, ref: "L10 s479", quote: "Power dissipation rises linearly with clock frequency" }
  - { type: slide, ref: "L10 s479", quote: "power dissipation goes down as Vcc" }
  - { type: slide, ref: "L10 s475", quote: "Example for 68K: 0.13 watts @ 8MHz clock and 0.38 watts @ 20 MHz" }
checks:
  - gen: conv.cmosPower
  - gen: conv.cmosPower
  - type: choice
    prompt: "Why does a CMOS gate dissipate power mainly when it is **switching**?"
    options: ["While high or low only leakage flows, but while switching there is a short window with both transistors conducting", "It dissipates only when idle", "The load heats it", "Leakage dominates"]
    answer: 0
    explain: "When a CMOS gate is steady high or low the only current is leakage; during a transition there is a small window when both transistors conduct, and charging the load capacitance also takes current."
  - type: choice
    prompt: "Which of these reduces CMOS power dissipation?"
    options: ["Lower supply voltage, lower clock frequency, fewer gates switching, faster edges", "Over-clocking", "Higher Vcc", "Slower rise and fall times"]
    answer: 0
    explain: "Power depends on gates switching per unit time (disable clocks to unused regions), falls as Vcc squared, rises with slower rise/fall times and linearly with clock frequency; over-clocking may exceed the package's ability to shed heat."
  - type: choice
    prompt: "The slide says 68K power is 0.13 W at 8 MHz and 0.38 W at 20 MHz. Is that exactly linear?"
    options: ["Not exactly: linear scaling of 0.13 W gives 0.325 W at 20 MHz; the slide's 0.38 W is higher", "Exactly linear", "Exactly quadratic", "Independent of frequency"]
    answer: 0
    explain: "0.13 x 20/8 = 0.325 W. The real figure of 0.38 W is about 17% higher, so 'scales linearly' is an approximation (other terms do not scale with the clock)."
card:
  front: "How does CMOS power scale?"
  back: "P is proportional to Vcc^2 and to clock frequency (more transitions per second), rises with slower edges and with the number of gates switching; save power by gating clocks to idle blocks and sleep modes. Heat is limited by the package and heat sink."
glossary:
  - { term: "Sleep mode", def: "A processor state with almost all internal activity stopped for low power." }
---

## Learn

Modern processors need anywhere from microwatts to tens of watts. **Power scales roughly linearly with clock speed** (the lecture: 0.13 W at 8 MHz and 0.38 W at 20 MHz for the 68K, a bit more than strictly linear) and drives the cooling requirement.

**Why CMOS dissipates power:** a CMOS gate held high or low passes only leakage; during a transition there is a small window when both transistors conduct (and the load capacitance has to be charged). So power depends on:

1. the number of gates switching per unit time (save power by **disabling the clock** to unneeded parts of the processor),
2. the supply voltage: it falls as **Vcc squared**,
3. rise and fall times: it **rises with slower edges**,
4. clock frequency: it rises **linearly**,
5. over-clocking can exceed the package's ability to move heat from die to heat sink.

This is why a 3.5 GHz processor needs a massive cooler while a data logger on a whale can run for a year on a few AAA batteries.

## Worked example

*A chip dissipates 2 W at 5 V and 16 MHz. Estimate its power at 3.3 V and 16 MHz.*

1. Voltage factor = (3.3 / 5)^2 = 0.4356.
2. Power = 2 W x 0.4356 = **0.87 W**.
3. Halving the clock as well would halve it again, to about 0.44 W.

## Try it

*Which saves more: lowering Vcc by 30%, or lowering the clock by 30%?*

???

Lowering Vcc by 30% multiplies power by 0.7^2 = 0.49 (a 51% saving); lowering the clock by 30% multiplies it by 0.7 (a 30% saving). The voltage change saves more.
