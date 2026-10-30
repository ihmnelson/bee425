---
track: shared
title: "Sample-and-hold and droop"
summary: "A capacitor holds the voltage; its droop rate sets how fast the converter must be, to stay under half an LSB."
needs: ["conversion-chain"]
sources:
  - { type: slide, ref: "L10 s463", quote: "Store the input signal on a capacitor until the A/D converter can digitize the signal" }
  - { type: slide, ref: "L10 s464", quote: "each count represents 10 mV" }
  - { type: slide, ref: "L10 s464", quote: "Therefore, we have 5 us to digitize the signal" }
  - { type: slide, ref: "L10 s464", quote: "typical droop rates are 50 mV / sec" }
checks:
  - gen: conv.droop
  - gen: conv.droop
  - type: choice
    prompt: "A 10-bit converter spans 0 to 10.23 V and the S/H droops 1 V/ms. How long can the conversion take (error under half an LSB)?"
    options: ["5 µs: one LSB is 10 mV, half is 5 mV, and 5 mV / (1 V/ms) = 5 µs", "5 ms", "50 µs", "0.5 µs"]
    answer: 0
    explain: "1023 counts over 10.23 V means 10 mV per count; half is 5 mV; at 1 V per millisecond the droop reaches 5 mV in 5 microseconds."
  - type: choice
    prompt: "The lecture then substitutes a typical droop rate of 50 mV/s. What is the allowed conversion time, and is the slide's '100 microseconds' right?"
    options: ["5 mV / (50 mV/s) = 0.1 s = 100 ms; the slide's 'microseconds' is a unit slip", "100 µs, as the slide says", "1 µs", "10 ms"]
    answer: 0
    explain: "5 mV / 50 mV per second = 0.1 second, which is 100 milliseconds (100,000 µs). The slide prints 100 microseconds, which would be a thousand times too short; the arithmetic gives 100 ms."
card:
  front: "How does droop limit a sample-and-hold system?"
  back: "The hold capacitor leaks, so the held voltage droops at some V/s. Conversion time must keep the droop below half an LSB: t < (LSB/2) / droop rate. Example: 10 mV LSB, 1 V/ms droop gives 5 µs; with 50 mV/s it is 100 ms (the slide says microseconds, a slip)."
glossary:
  - { term: "Droop rate", def: "How fast the voltage held by a sample-and-hold capacitor decays, in volts per second." }
---

## Learn

A **sample-and-hold** stores the input as **charge on a capacitor** until the converter can digitise it. Switch SW1 samples (closed) and SW2 connects the output to the system (open); in hold, SW1 opens and SW2 closes. A special circuit design holds the voltage with minimal loss of charge, but you must still check the **droop rate** against the desired accuracy.

The lecture's worked problem: a **10-bit** A/D over **0 to 10.23 V**:
1. 1,023 counts, so each count is **10 mV**.
2. Half an LSB = **5 mV**.
3. At a droop of **1 V per millisecond**: 5 x 10^-3 V / 10^3 V/s = **5 x 10^-6 s = 5 µs**.
4. So the converter has 5 µs.
5. With Analog Devices' typical droop of **50 mV/s** the allowed time is far longer: 5 mV / 50 mV/s = **0.1 s = 100 ms**. (The slide states it as 100 microseconds, which would be a unit slip: the arithmetic gives 100 milliseconds.)

## Worked example

*LSB = 20 mV; droop = 2 V/ms. Conversion time limit?*

1. Half LSB = 10 mV.
2. Time = 10 mV / (2 V/ms) = 0.01 V / 2,000 V/s = **5 µs**.
3. Halving the droop rate would double the time available.

## Try it

*Why is a half-LSB the usual error budget?*

???

An error of half an LSB is the most that rounding to the nearest code can already contribute; keeping droop below that means droop does not change the result by more than one code boundary.
