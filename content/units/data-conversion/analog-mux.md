---
track: shared
title: "Analog switches and multiplexers"
summary: "FET analog switches are fast and bounce-free but have on-resistance and limited current; mechanical switches are the opposite."
needs: ["conversion-chain"]
sources:
  - { type: slide, ref: "L10 s460", quote: "Analog switch is a Field Effect Transistor (FET)" }
  - { type: slide, ref: "L10 s460", quote: "No mechanical switch bounce" }
  - { type: slide, ref: "L10 s462", quote: "Switching Speed" }
  - { type: slide, ref: "L10 s461", quote: "4 to 1 Analog MUX model" }
checks:
  - type: choice
    prompt: "Which is an advantage of an **analog switch** over a mechanical switch?"
    options: ["Much faster (about 250 ns versus about 10 ms) and no contact bounce", "Lower on-resistance", "Higher current", "Higher bandwidth"]
    answer: 0
    explain: "Analog switch: ~250 ns, no bounce, about 100 Ω on, about 1 GΩ off, infinite lifetime, 10-100 MHz bandwidth, 30 mA. Mechanical: ~10 ms, bounce, 0 Ω on, infinite off, finite lifetime, above 1 GHz, 1 A."
  - type: choice
    prompt: "Why are mechanical switches still used for some measurements?"
    options: ["Very high accuracy and low-speed signal processing: 0 Ω on-resistance, infinite off-resistance", "They are faster", "They never wear out", "They need no control"]
    answer: 0
    explain: "The lecture notes that mechanical switches are still used for very high accuracy and low-speed signal processing, because they have no on-resistance error."
  - type: choice
    prompt: "How is a **4-to-1 analog multiplexer** controlled?"
    options: ["Two select lines A0 and A1 drive a 2:4 decoder that turns on one of four analog switches", "Four select lines", "One select line", "By a clock only"]
    answer: 0
    explain: "A 2:4 decoder chooses one of four FET switches so exactly one input reaches the output. The MUX-08 is an 8-channel part and the AD684 a quad S/H."
  - type: choice
    prompt: "Why does an analog switch's **100 Ω on-resistance** matter?"
    options: ["It can introduce an error term in the measurement, unless the load has a very high input resistance (such as an op-amp's non-inverting input)", "It makes it faster", "It lowers power", "It does not matter"]
    answer: 0
    explain: "Depending on the application the on-resistance can introduce an error; analog switches are ideal when the output goes to a very high input resistance such as a non-inverting op-amp input."
card:
  front: "Compare analog and mechanical switches."
  back: "Analog (FET): ~250 ns, no bounce, ~100 Ω on, ~1 GΩ off, unlimited life, 10-100 MHz, ~30 mA. Mechanical: ~10 ms, bounce, 0 Ω on, infinite off, finite life, >1 GHz, ~1 A. A MUX is a decoder driving analog switches."
glossary:
  - { term: "Analog multiplexer (MUX)", def: "A device that connects one of several analog inputs to its output, selected by digital address lines." }
---

## Learn

A mechanical switch is normally too slow for a computer system (a burglar alarm is an exception). An **analog switch** is a **FET** whose channel resistance is controlled by the gate voltage: it works like a mechanical switch but switches in under a microsecond, has **no bounce**, and works directly from logic levels.

| Parameter | Mechanical | Analog |
|---|---|---|
| Switching speed | ~10 ms | 250 ns |
| Bounce | yes | no |
| On resistance | 0 Ω | 100 Ω |
| Off resistance | infinite | ~1 GΩ |
| Lifetime | finite | infinite |
| Bandwidth | > 1 GHz | 10-100 MHz |
| Current | 1 A | 30 mA |

A **4-to-1 analog MUX** is four such switches selected by a **2:4 decoder** (select A0, A1). Commercial parts: the **MUX-08** (8-channel multiplexer) and the **AD684** (quad sample-and-hold).

## Worked example

*Which switch should connect a thermocouple amplifier (high-impedance input) to an ADC at 1,000 channels per second?*

1. 1,000 per second is far too fast for a mechanical switch (10 ms each).
2. The amplifier input is high impedance, so the 100 Ω on-resistance causes negligible error.
3. Use an **analog multiplexer**.

## Try it

*How many select lines does an 8-channel analog MUX need?*

???

Three (2^3 = 8), driving a 3-to-8 decoder.
