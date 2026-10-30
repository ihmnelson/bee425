---
track: shared
title: "D/A converters"
summary: "Binary-weighted currents summed into a resistor give an output voltage proportional to the digital code."
needs: ["analog-world"]
sources:
  - { type: slide, ref: "L10 s446", quote: "Inject current sources into a summing junction" }
  - { type: slide, ref: "L10 s446", quote: "Arrange the current values in a binary progression" }
  - { type: slide, ref: "L10 s447", quote: "Minimum voltage resolution = 0.1V" }
  - { type: slide, ref: "L10 s448", quote: "D/A Converters actually form the heart of most A/D converters" }
checks:
  - gen: conv.dacOutput
  - gen: conv.dacOutput
  - type: choice
    prompt: "In the lecture's 4-bit D/A (i = 0.1 mA, R = 1 kΩ), what are the maximum output and the step size?"
    options: ["Maximum 1.5 V, step 0.1 V", "Maximum 1.0 V, step 0.1 V", "Maximum 5 V, step 1 V", "Maximum 1.5 V, step 0.5 V"]
    answer: 0
    explain: "The currents i, 2i, 4i, 8i total 15i = 1.5 mA at code 15, so Vmax = 1.5 mA x 1 kΩ = 1.5 V. One step is i x R = 0.1 V."
  - type: choice
    prompt: "Why is the D/A converter described as 'the heart of most A/D converters'?"
    options: ["Ramp and successive-approximation converters use a D/A to make the reference voltage they test the unknown against", "A/D converters are made of D/A converters only", "D/A converters are faster", "They share a package"]
    answer: 0
    explain: "Other than flash, an A/D conversion needs a reference voltage, a comparator and a D/A converter: the D/A produces the trial voltage that is compared with the unknown input."
card:
  front: "How does a binary-weighted D/A converter work?"
  back: "Current sources i, 2i, 4i, 8i... are switched by the digital bits into a summing junction; a current-to-voltage converter (a resistor, V = I x R) gives the output: Vout = code x (i x R). Full scale = (2^N - 1) x i x R."
glossary:
  - { term: "D/A converter", def: "Converts a digital code into an analog output voltage." }
---

## Learn

A **D/A converter (DAC)** does the opposite of an A/D converter: a digital word in, an analog voltage out. Conceptually simple:

- Inject **current sources into a summing junction**: the total current is the sum of the currents entering.
- Arrange the currents in a **binary progression** (i, 2i, 4i, 8i, ... 128i), each controlled by one digital bit (an analog switch).
- A current-to-voltage converter (here a resistor, **V = i x R**) turns the sum into the output voltage.

The lecture's 4-bit example: i = 0.1 mA and R = 1 kΩ, so each step is **0.1 V** and the maximum (all bits on, 15 x 0.1 mA) is **1.5 V**.

DACs are also the heart of most A/D converters: single-ramp and successive-approximation converters need a **reference voltage, a comparator and a D/A converter**.

## Worked example

*Code 1010 (decimal 10) into the lecture's DAC (i = 0.1 mA, R = 1 kΩ). Output?*

1. Bits set: 8i and 2i = 10i = 1.0 mA.
2. V = 1.0 mA x 1 kΩ = **1.0 V**.
3. Equivalent: 10 steps x 0.1 V.

## Try it

*An 8-bit DAC has a full scale of 2.55 V. What is its step size?*

???

Full scale = 255 steps (2^8 - 1), so each step is 2.55 / 255 = **10 mV**.
