---
track: shared
title: "Resolution, step size and using the full range"
summary: "Step = full scale divided by (2^N - 1); amplify small signals so they use the converter's whole range."
needs: ["adc-methods"]
sources:
  - { type: slide, ref: "L10 s450", quote: "An 8-bit A/D converter can digitize its input range into 255" }
  - { type: slide, ref: "L10 s450", quote: "10/65,535 = .00015 volts per step resolution" }
  - { type: slide, ref: "L10 s450", quote: "Without amplifying the input voltage, we would have 1 bit of resolution" }
checks:
  - gen: adc.stepSize
  - gen: adc.stepSize
  - type: choice
    prompt: "An 8-bit converter spans 0-10 V. What is one step, per the lecture?"
    options: ["10 / 255 = about 0.04 V", "10 / 256 = 0.039 V exactly", "10 / 8 = 1.25 V", "10 / 65,535 V"]
    answer: 0
    explain: "The lecture divides the range into 2^N - 1 = 255 steps: about 0.04 V per step (a 16-bit converter over the same range gives 10 / 65,535 = 0.00015 V)."
  - type: choice
    prompt: "A 16-bit converter spans 0-10 V (0.00015 V steps) and your signal is only 0.00015 V. What do you do?"
    options: ["Amplify it so it spans most of the converter's range; unamplified you get about 1 bit of resolution", "Nothing, 16 bits is plenty", "Use a slower clock", "Lower the reference"]
    answer: 0
    explain: "Without amplification the whole signal is one step: 1 bit of resolution. Amplify the signal to use the converter's full-scale range."
card:
  front: "How do you find the step size and make use of resolution?"
  back: "Step = full-scale range / (2^N - 1), e.g. 10 V / 255 = 0.04 V for 8 bits, 10 V / 65,535 = 0.00015 V for 16 bits. Resolution is only useful if the signal fills the range: amplify small signals first."
glossary:
  - { term: "LSB step", def: "The voltage change that corresponds to one code step of a converter." }
---

## Learn

**Resolution** is the converter's ability to measure small differences; **accuracy** is how well the code represents the true input. The lecture's numbers: an **8-bit** converter divides its input range into **255** steps; over 0 to 10 V that is 10/255 = **0.04 V** per step. A **16-bit** converter over the same range gives 10/65,535 = **0.00015 V** per step.

Typically you want to **amplify the signal** so it uses the converter's range. If the input is only 0.00015 V and you do not amplify it, a 16-bit converter gives you **1 bit** of resolution. (A programmable-gain amplifier does exactly this.)

## Worked example

*A sensor outputs 0 to 100 mV into a 12-bit converter spanning 0-5 V. How many codes does the signal use, and how can you do better?*

1. Step = 5 V / 4,095 = 1.22 mV; 100 mV spans about 82 codes.
2. Amplify by 50 (to 5 V full scale).
3. Now the signal uses all 4,095 steps, and the resolution at the sensor is 100 mV / 4,095 = 0.024 mV.

## Try it

*An 8-bit converter spans 0-5 V. What is one step?*

???

5 V / 255 = **19.6 mV** (about 20 mV).
