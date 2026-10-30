---
track: shared
title: "Hysteresis, Schmitt triggers and debouncing"
summary: "Hysteresis gives a deadband so noise near the threshold does not toggle the output; an RC filter plus Schmitt trigger debounces a switch."
needs: ["data-conversion.comparators"]
sources:
  - { type: slide, ref: "L10 s470", quote: "Hysteresis is designed into the circuit to reduce or eliminate spurious switching" }
  - { type: slide, ref: "L10 s470", quote: "Switching range is called the Deadband" }
  - { type: slide, ref: "L10 s470", quote: "Schmitt trigger circuit uses hysteresis to" }
  - { type: slide, ref: "L10 s471", quote: "The RC circuit acts as a low-pass filter to provide the debouncing" }
checks:
  - type: choice
    prompt: "What does **hysteresis** do in a comparator or Schmitt trigger?"
    options: ["Uses two different thresholds (a deadband) so noise near the switching point does not cause spurious toggling", "Speeds up the output", "Adds gain", "Removes the reference"]
    answer: 0
    explain: "When the two inputs are nearly identical the output is unstable. With hysteresis the voltage must pass the reference by the deadband before the output switches back, so noise close to the switching point is ignored."
  - type: choice
    prompt: "A Schmitt trigger switches high at 3.0 V rising and low at 1.8 V falling. What is the deadband?"
    options: ["1.2 V", "3.0 V", "4.8 V", "0 V"]
    answer: 0
    explain: "Deadband = V_high - V_low = 3.0 - 1.8 = 1.2 V. It sets the noise margin but also limits the accuracy of the circuit."
  - type: choice
    prompt: "Why does a mechanical switch need debouncing?"
    options: ["The contacts open and close electrically many times before settling, and the circuit sees each bounce as a separate input", "It is too slow", "It has no contacts", "It produces analog levels"]
    answer: 0
    explain: "Switch bounce causes unpredictable behaviour. An RC low-pass filter smooths it, and a NAND gate with Schmitt-trigger inputs converts the slow RC ramp into a clean logic edge (without hysteresis a slow ramp would make the output oscillate near the threshold)."
  - type: choice
    prompt: "In the lecture's RESET circuit, what part does the **Schmitt-trigger NAND** play?"
    options: ["It turns the slowly rising RC voltage into a clean logic transition; without hysteresis the output would oscillate near the threshold", "It stores the reset", "It filters the supply", "It generates the clock"]
    answer: 0
    explain: "The RC acts as the debouncing low-pass filter; the Schmitt input then gives a fast, single transition to the processor's reset."
card:
  front: "What are hysteresis and debouncing?"
  back: "Hysteresis: separate rising and falling thresholds (the deadband = V_high - V_low) so noise near the threshold does not toggle the output. Debouncing: mechanical contacts bounce; use an RC low-pass filter followed by a Schmitt-trigger gate (or a latch) so the processor sees one clean edge."
glossary:
  - { term: "Hysteresis", def: "A circuit property with different switching thresholds for rising and falling inputs, giving noise immunity." }
  - { term: "Deadband", def: "The voltage range between the two switching thresholds of a circuit with hysteresis." }
---

## Learn

When the two voltages at a comparator's input are nearly identical the output can become **unstable**. **Hysteresis** is designed in to reduce or eliminate spurious switching: the changing voltage must pass the reference by a margin before the output switches. The switching range is the **deadband** (V_high - V_low); it gives a noise margin but limits accuracy.

**Switch bounce.** Any mechanical device interfaced to a computer needs special circuitry: the contacts open and close electrically many times before the circuit actually opens or closes, and the circuit sees each bounce as an input. A **Schmitt trigger** (a gate with hysteresis) debounces mechanical switch inputs. In the lecture's RESET circuit, an **RC low-pass filter** debounces the switch and a **NAND gate with Schmitt-trigger inputs** converts the slow ramp into a proper logic edge; without hysteresis the output would oscillate as the slowly rising input approaches the threshold.

## Worked example

*A Schmitt trigger has thresholds 2.0 V and 3.0 V. A noisy signal wanders between 2.4 V and 2.7 V. How many times does the output toggle?*

1. The output only switches high above 3.0 V and low below 2.0 V.
2. The signal never reaches either, so the output **does not toggle**.
3. A plain comparator at 2.5 V would toggle on every wiggle.

## Try it

*What is the deadband for thresholds of 1.4 V and 2.1 V?*

???

2.1 - 1.4 = **0.7 V**.
