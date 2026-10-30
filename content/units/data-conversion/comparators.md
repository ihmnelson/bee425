---
track: shared
title: "Comparators"
summary: "A comparator is a 1-bit converter: its output says which of two voltages is higher."
needs: ["analog-world"]
sources:
  - { type: slide, ref: "L10 s435", quote: "Output is TRUE (1) if the voltage on the + input is more positive" }
  - { type: slide, ref: "L10 s435", quote: "Basically, an op-amp running open-loop" }
  - { type: slide, ref: "L10 s437", quote: "More comparators > higher resolution" }
checks:
  - type: choice
    prompt: "A comparator has V+ = 2.1 V and V- = 1.8 V. What is its output?"
    options: ["Logic 1 (the + input is more positive)", "Logic 0", "Hi-Z", "1.8 V"]
    answer: 0
    explain: "The output is TRUE (1) if the voltage on the + input is more positive than the - input, and FALSE (0) if it is less positive."
  - type: choice
    prompt: "What is a comparator, electrically?"
    options: ["An op-amp running open-loop, with output conditioning so it matches logic levels", "A resistor network", "A flip-flop", "A digital counter"]
    answer: 0
    explain: "The comparator is a combination of an analog and a digital circuit: basically an op-amp with no feedback, with signal conditioning on the output to be logic compatible."
  - type: choice
    prompt: "Three comparators with thresholds at 0.25, 0.50 and 0.75 of VMAX watch an unknown voltage of 0.6 VMAX. How many output 1, and what code is that?"
    options: ["Two comparators output 1: the code is 2", "Three: the code is 3", "One: the code is 1", "None: the code is 0"]
    answer: 0
    explain: "The 0.25 and 0.50 comparators see a voltage above their thresholds, the 0.75 does not, so the number of 1s (the code) is 2. More comparators means higher resolution."
card:
  front: "What does a comparator do and how do comparators make a converter?"
  back: "Output = 1 if V+ > V-, else 0 (an open-loop op-amp with logic-level output). A bank of comparators with evenly spaced thresholds counts how many thresholds the input exceeds: that count is the digital code (more comparators, higher resolution)."
glossary:
  - { term: "Comparator", def: "A circuit that compares two voltages and gives a logic output saying which is higher." }
---

## Learn

The **comparator** combines analog and digital circuitry: basically an **op-amp running open-loop**, with conditioning on its output so that it is compatible with logic levels. It compares the voltage at its two inputs:

- Output **1 (TRUE)** if the voltage on the **+ input is more positive** than on the - input.
- Output **0 (FALSE)** if it is less positive.

One comparator is a 1-bit converter. **More comparators give higher resolution**: with thresholds at 0.25, 0.50 and 0.75 of VMAX, an input sweeping up from 0 to VMAX produces codes 0, 1, 2, 3 as it crosses each threshold (the lecture's waveform shows the code stepping 0, 1, 2, 3, 3, 3, 2, 2, 1, 0 as the unknown voltage rises and falls).

## Worked example

*Thresholds at 1, 2, 3 and 4 V (four comparators). What code for an input of 2.7 V?*

1. The 1 V and 2 V comparators output 1 (2.7 > 1, 2.7 > 2).
2. The 3 V and 4 V comparators output 0.
3. Two comparators are 1, so the code is **2**.

## Try it

*Why can a single comparator alone not measure a voltage?*

???

It only says whether the input is above or below its one threshold (1 bit of information). To measure a value you need many thresholds (a bank of comparators) or a way to vary the threshold and compare repeatedly (ramp or successive approximation).
