---
track: shared
title: "Voltage-to-frequency, delta-sigma and dual-slope converters"
summary: "Counting V/F pulses averages out noise; dual slope integrates the input then the reference so errors cancel."
needs: ["ramp-and-sar"]
sources:
  - { type: slide, ref: "L10 s453", quote: "The longer the digitization period, the greater the noise rejection" }
  - { type: slide, ref: "L10 s453", quote: "Not useful for AC voltages" }
  - { type: slide, ref: "L10 s456", quote: "Errors introduced during one slope of the conversion are cancelled out" }
  - { type: slide, ref: "L10 s457", quote: "Since the total count is the same, we can say that" }
checks:
  - gen: conv.vfCounts
  - gen: conv.dualSlope
  - type: choice
    prompt: "Why is voltage-to-frequency conversion good in electrically noisy factories?"
    options: ["Counting pulses over a long window acts like a digital integrator, so noise averages out (the longer the period, the more noise rejection)", "It is the fastest", "It is unaffected by the reference", "It only measures AC"]
    answer: 0
    explain: "It has the highest resolution (not necessarily the most accurate), excellent noise performance for industrial control, but it is not useful for AC voltages and it is slow."
  - type: choice
    prompt: "Why is a dual-slope converter more accurate than a single-ramp one?"
    options: ["Errors introduced during the first slope are cancelled during the second slope", "It uses more bits", "It is faster", "It uses no reference"]
    answer: 0
    explain: "Dual slope is built from discrete components (more costly) and the errors of one slope cancel in the second. Triple and quad slope refine it for even higher accuracy but about 10 measurements per second."
card:
  front: "Explain V/F and dual-slope conversion."
  back: "V/F: Fout = k x Vin; count pulses for a fixed time: counts = k x Vin x T (longer window, more noise rejection; no AC). Dual slope: count V/F pulses from Vx for time T, then count down using Vref for time tref; equal area: Vx x T = Vref x tref, so Vx = Vref x tref / T."
glossary:
  - { term: "Dual-slope converter", def: "A converter that integrates the input for a fixed time and then the reference until the count returns to zero; Vx = Vref x tref / T." }
---

## Learn

**Voltage-to-frequency (V/F):** the highest-resolution method (not necessarily the most accurate). A V/F converter outputs **Fout = k x Vin** (k = 100 kHz per volt: 5 V gives 500 kHz); counting pulses for 1 s gives 500,000, for 10 s 5,000,000, for 100 s 50,000,000. **The longer the digitising period, the greater the noise rejection**: it acts like a digital integrator, ideal for noisy industrial control, but it is **not useful for AC voltages**. The AD537 gives 0-10 or 0-100 kHz for 0-10 V with 0.01% linearity.

**Delta-sigma** is an advanced technique: think of it as a V/F converter with feedback (an integrator, comparators and a D flip-flop producing a bit stream).

**Dual slope:** based on V/F conversion. (1) Convert Vx to a frequency (say 1 MHz per volt); (2) count the cycles for a fixed window T (100 ms gives 506,382 counts, say); (3) switch to the accurate reference Vref (say 10.0000 V); (4) count down, one per pulse, recording time; (5) when the counter reaches zero, capture the time tref. The counts are equal, so the two areas are equal: **Vx x T = Vref x tref**, hence **Vx = Vref x tref / T**. Errors in one slope cancel in the other. Triple and quad slope refine it (about 10 measurements per second).

## Worked example

*Vref = 10 V. The fixed window T is 100 ms and the return time tref is 50 ms. What is Vx?*

1. Vx x 100 ms = 10 V x 50 ms.
2. Vx = 500 / 100 = **5 V**.
3. Any error common to both slopes (clock drift, say) cancels in the ratio.

## Try it

*A V/F converter gives 100 kHz per volt. How many counts in 10 s for 2.5 V?*

???

2.5 V x 100 kHz/V = 250 kHz; x 10 s = **2,500,000 counts**.
