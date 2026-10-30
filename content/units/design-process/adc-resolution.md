---
track: shared
title: "Choosing a microcontroller: the A/D resolution example"
summary: "A 10-bit A/D over 0-5 V steps in about 5 mV; check resolution, accuracy and support before choosing."
needs: [design-phases]
sources:
  - { type: slide, ref: "L1 s49", quote: "Arduino has a 10-bit A/D over a range of 0 – 5V" }
  - { type: slide, ref: "L1 s49", quote: "Resolution of the Arduino A/D is 1 part in 1023, or about 5 mV per step" }
  - { type: slide, ref: "L1 s49", quote: "Can use an external A/D converter that is far more accurate" }
checks:
  - gen: adc.stepSize
  - gen: adc.stepSize
  - type: choice
    prompt: "Which options does the lecture list when the on-board A/D is **not accurate enough or the signal is too small**?"
    options: ["Use a more accurate external A/D converter, or an op-amp for more gain", "Lower the clock", "Use a bigger battery", "Remove the A/D"]
    answer: 0
    explain: "Use an external A/D converter that is far more accurate, or an op-amp for greater gain if the voltage signal is too low. Others have 12-bit A/Ds but less support than the Arduino."
  - type: choice
    prompt: "The lecture says the Arduino A/D accuracy is +/- 2 LSB, 'or +/- 15 mV'. Check it: with a 4.89 mV step, what is 2 LSB?"
    options: ["About 9.8 mV, so the slide's 15 mV does not match 2 LSB (it is closer to 3 LSB)", "Exactly 15 mV", "About 2 mV", "About 100 mV"]
    answer: 0
    explain: "2 x 4.887 mV = 9.77 mV. 15 mV is about 3 LSB, so the slide's two figures are not consistent; know the idea (accuracy is a few LSB, worse than the resolution) rather than the exact number."
card:
  front: "What are the resolution and accuracy of a 10-bit Arduino A/D over 0-5 V?"
  back: "Resolution: 1 part in 1023, about 5 mV (4.89 mV) per step. Accuracy: a couple of LSB (the slide says +/-2 LSB or +/-15 mV, which are not quite consistent: 2 LSB is about 10 mV). Better accuracy: external A/D; small signals: an op-amp for gain."
glossary:
  - { term: "LSB", def: "Least significant bit: the size of one step of an A/D or D/A converter." }
---

## Learn

When designing, say, a function generator, the microprocessor handles the user interface, waveform generation and control of digital resistors and switched capacitors. You might pick an Arduino, Raspberry Pi, Teensy 4.1 or ESP32: **any microcontroller board can work, but you must understand the strengths and limits of each.**

The lecture's example is the Arduino's A/D converter:

- **10-bit** over **0 to 5 V**: resolution is **1 part in 1023**, about **5 mV per step** (5 V / 1023 = 4.89 mV).
- Accuracy is worse than resolution: the slide says **+/- 2 LSB, or +/- 15 mV**. (2 LSB is really about 10 mV; 15 mV would be about 3 LSB. The slide's two numbers disagree.)
- Better accuracy: an **external A/D converter**. Too-small signals: an **op-amp** for gain. Some boards have 12-bit A/Ds but less software support than the Arduino. The Arduino uses a 16 MHz clock.

This is the pattern for choosing any part: compute what the specification needs (resolution, range, speed), and compare it with what the board offers.

## Worked example

*How small a voltage change can a 12-bit converter on 0-3.3 V resolve?*

1. Steps = 2^12 - 1 = 4,095.
2. Step = 3.3 V / 4,095 = **0.806 mV**.
3. Compared with the Arduino's 4.89 mV, it resolves a change about six times smaller.

## Try it

*A sensor outputs 0 to 50 mV and you need to see 0.1 mV changes with a 10-bit, 5 V A/D (4.89 mV steps). What should you do?*

???

Amplify the signal with an op-amp: a gain of 100 turns 50 mV into 5 V, so a 0.1 mV change becomes 10 mV, about two steps. (Or use a converter with finer resolution.)
