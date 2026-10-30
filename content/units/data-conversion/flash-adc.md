---
track: shared
title: "Flash A/D converters"
summary: "2^N - 1 comparators decode a thermometer code in one step: the fastest converter, but costly and limited to 8-10 bits."
needs: ["comparators"]
sources:
  - { type: slide, ref: "L10 s445", quote: "An N-bit converter requires 2N - 1 comparators" }
  - { type: slide, ref: "L10 s445", quote: "Flash ADC is still the fastest A/D converter available" }
  - { type: slide, ref: "L10 s445", quote: "Limited to 8 to 10 bits of resolution" }
  - { type: slide, ref: "L10 s440", quote: "This is called a thermometer circuit" }
  - { type: slide, ref: "L10 s439", quote: "the FLASH circuit can digitize a voltage every 2 ns, or 500 MHz" }
checks:
  - gen: conv.flashComparators
  - gen: conv.flashRate
  - type: choice
    prompt: "Which statement about **flash** converters is true?"
    options: ["Fastest converter (up to about 1 GSPS), but it uses more power, is expensive and limited to 8-10 bits", "Slowest converter", "Highest resolution (24 bits)", "Uses one comparator and a counter"]
    answer: 0
    explain: "Flash converters are the fastest available (bandwidths around 1 GSPS), consume more power than other technologies, are expensive and are limited to 8 to 10 bits of resolution."
  - type: choice
    prompt: "A 4-bit flash converter (reference 16 V) sees 9.87 V. How many comparators output 1, and what is the pattern called?"
    options: ["9 of the 15 comparators (C1 to C9), a thermometer code", "16 comparators", "15 comparators", "Only one comparator"]
    answer: 0
    explain: "Comparators C1 to C9 (thresholds 1 V to 9 V) output 1 and C10 to C15 output 0: a 'thermometer' or 'ladder' code that an encoder converts to binary 1001. (The lecture's figure labels C16 as an over-range comparator.)"
card:
  front: "How does a flash ADC work and what are its limits?"
  back: "2^N - 1 comparators on a resistor ladder give a thermometer code (all 1s up to the input level); an encoder turns it into binary. Speed = comparator + logic delay (1 ns + 1 ns gives 500 MHz). Fastest (about 1 GSPS), but power-hungry, expensive, 8-10 bits."
glossary:
  - { term: "Thermometer code", def: "The output of a comparator ladder: 1s for every threshold below the input and 0s above it." }
---

## Learn

A **flash converter** puts a **resistor ladder** across the reference and a comparator at each tap. The lecture's 2-bit example has taps at 1/5, 2/5, 3/5 and 4/5 of Vr and the allowable input range is 0 to 4/5 Vr (an over-range output flags larger inputs); with Vr = 5 V it resolves 1 V.

An **N-bit** flash converter needs **2^N - 1 comparators**. The comparator outputs form a **thermometer (ladder) code**; a **ladder-to-binary encoder** finds the highest comparator that is 1 (detect Cn = 1 and Cn+1 = 0, so only one row of the truth table is true; without this the truth table over all 16 comparator outputs would need 65,535 terms).

**Speed** depends only on the comparators' and encoder's propagation delays: 1 ns + 1 ns = 2 ns per conversion, **500 MHz**. Commercial flash converters reach about **1 GSPS** (giga samples per second).

**Cons:** more power, expensive, limited to **8 to 10 bits**. (A slide-accuracy note: the lecture says an 8-bit flash needs '257 equally matched resistors and 256 comparators', but also gives the general rule 2^N - 1 = 255 comparators; the rule is the one to remember.)

## Worked example

*A flash converter's comparators take 0.8 ns and its encoder 1.2 ns. What is the conversion rate?*

1. One conversion = 0.8 + 1.2 = 2.0 ns.
2. Rate = 1 / 2 ns = **500 MHz**.
3. How many comparators for 8 bits? 2^8 - 1 = 255.

## Try it

*How many comparators for a 10-bit flash converter?*

???

2^10 - 1 = **1,023** comparators (which is why flash converters rarely go beyond 8-10 bits).
