---
track: shared
title: "Single-ramp and successive-approximation converters"
summary: "A ramp counts up until it passes the input (slow, variable); successive approximation tests one bit at a time (N steps)."
needs: ["dac", "adc-resolution-step"]
sources:
  - { type: slide, ref: "L10 s451", quote: "What is a problem with a single ramp A/D?" }
  - { type: slide, ref: "L10 s452", quote: "Still the workhorse of data acquisition circuits" }
  - { type: slide, ref: "L10 s452", quote: "13.8 microsecond conversion time" }
  - { type: slide, ref: "L10 s452", quote: "Circuit that stores the instantaneous" }
checks:
  - gen: conv.rampTime
  - type: choice
    prompt: "What is the **problem with a single-ramp** A/D converter?"
    options: ["The conversion time depends on the input voltage and is long for large inputs (it counts from zero each time)", "It cannot digitise voltages", "It needs a flash encoder", "It uses no counter"]
    answer: 0
    explain: "The counter runs from 0 until the D/A output passes the unknown voltage, so the conversion time is non-deterministic (the count = the digitised voltage), up to 2^N counts."
  - type: choice
    prompt: "How many comparisons does a **successive-approximation** converter make for an N-bit result?"
    options: ["N (it decides one bit per step, MSB first)", "2^N", "1", "2N"]
    answer: 0
    explain: "It tests the most significant bit first with a D/A trial voltage, keeps or clears it depending on the comparator, then moves to the next bit: N steps for N bits (a binary search), far fewer than a ramp's up to 2^N."
  - type: choice
    prompt: "The ADC1241 shown in the lecture is..."
    options: ["12 bits plus sign, 13.8 µs conversion, self-calibrating, with an internal sample-and-hold", "8 bits, 1 ns", "24 bits, 10 samples per second", "A flash converter"]
    answer: 0
    explain: "The National Semiconductor ADC1241 is a successive-approximation converter: 12-bit plus sign, 13.8 microsecond conversion time, self-calibrating, with an internal sample and hold."
card:
  front: "Compare single-ramp and successive approximation."
  back: "Single ramp: a counter drives a D/A; count until the D/A output passes Vx; count = result; time depends on Vx (up to 2^N counts). Successive approximation: a binary search, one bit per step, MSB first, N comparisons; deterministic, the workhorse for 12-18 bits."
glossary:
  - { term: "Sample and hold", def: "A circuit that stores the instantaneous input voltage and keeps it constant during the A/D conversion." }
---

## Learn

Other than flash, a converter needs three elements: a **reference voltage, a comparator and a D/A converter**.

**Single-ramp:** a counter feeds a D/A whose output ramps up. The comparator tests whether the D/A output is greater than Vx; initialise COUNT to 0, read the TEST bit, and while it is not true increment COUNT. When TEST goes true, COUNT is the digitised voltage. Problem: the digitising time depends on the input (a large voltage needs a long count).

**Successive approximation (SAR):** still the **workhorse of data acquisition circuits**. It makes a binary search: set the MSB, compare, keep or clear it, then do the next bit. N bits take N steps. The National Semiconductor **ADC1241**: 12 bits plus sign, **13.8 µs** conversion, self-calibrating, with an internal **sample and hold**.

## Worked example

*A 10-bit SAR converter finds an input of 3.3 V on a 0-5 V range with a 1023-step scale. Trace the first two bits.*

1. Trial 1: MSB set = half scale 2.5 V. 3.3 > 2.5, keep the bit.
2. Trial 2: next bit adds 1.25 V, giving 3.75 V. 3.3 < 3.75, clear the bit.
3. Continue 8 more times: ten comparisons total for ten bits.

## Try it

*How many comparisons does a 12-bit SAR converter need, and how many counts could a 12-bit single ramp need?*

???

The SAR needs **12** comparisons. The single ramp could need up to 2^12 = **4,096** counts.
