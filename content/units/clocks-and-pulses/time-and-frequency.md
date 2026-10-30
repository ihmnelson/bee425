---
track: shared
title: Period, frequency and engineering prefixes
summary: Frequency is the inverse of period; 1 ns is 1 GHz, and signals travel about 2 ns per foot on a PCB.
needs: []
sources:
  - { type: slide, ref: "L2 s101", quote: "Clock period of 1 nsec has a frequency of 1 GHz" }
  - { type: slide, ref: "L2 s99", quote: "approximately 2 nanoseconds per foot on a printed circuit board" }
  - { type: slide, ref: "L2 s100", quote: "Frequencies are the inverse of time" }
checks:
  - gen: clock.freqFromPeriod
  - gen: clock.freqFromPeriod
  - type: choice
    prompt: "A clock has a **period of 1 ms**. What is its frequency?"
    options: ["1 kHz", "1 MHz", "1 GHz", "1 Hz"]
    answer: 0
    explain: "f = 1/T = 1 / 0.001 s = 1,000 Hz = 1 kHz. (A 1 s period is 1 Hz; a 1 µs period is 1 MHz; a 1 ns period is 1 GHz.)"
card:
  front: "Convert a clock period to a frequency. What are 1 ns, 1 µs and 1 ms as frequencies?"
  back: "f = 1/T. A 1 ns period is 1 GHz, 1 µs is 1 MHz, 1 ms is 1 kHz, 1 s is 1 Hz."
glossary:
  - { term: "Period", def: "The time of one full clock cycle; the inverse of frequency." }
---

## Learn

Frequency is the **inverse of time**: **f = 1 / T**. The lecture's engineering prefixes:

| Prefix | Factor | Example |
|---|---|---|
| tera (T) | 10^12 | |
| giga (G) | 10^9 | 1 ns period = **1 GHz** |
| mega (M) | 10^6 | 1 µs period = **1 MHz** |
| kilo (k) | 10^3 | 1 ms period = **1 kHz** |
| milli (m) | 10^-3 | |
| micro (µ) | 10^-6 | |
| nano (n) | 10^-9 | |
| pico (p) | 10^-12 | |
| femto (f) | 10^-15 | |

(The slide's printed list shows "Micro = 10^6" next to "Giga"; that is a typo for **Mega**. Micro is 10^-6.)

A quick way to convert: **1000 / (period in ns) = frequency in MHz**. A 2 ns period is 500 MHz, **not** 50 GHz.

Distance matters too: the lecture's figure of merit is that a signal travels **about 1 ns per foot in free space** and **about 2 ns per foot on a printed circuit board**.

## Worked example

*A clock has a period of 8 ns. What is its frequency?*

1. 1000 / 8 = **125 MHz**.
2. Check: 125 MHz = 125 x 10^6 Hz, and 1 / (125 x 10^6) = 8 x 10^-9 s = 8 ns. ✓

## Try it

*A 4 MHz Z80 clock has what period?*

???

T = 1 / 4 MHz = 0.25 µs = **250 ns**.
