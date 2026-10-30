---
track: shared
title: "A/D conversion methods compared"
summary: "Flash is fastest, successive approximation the workhorse, multi-slope the most precise, V/F the most noise immune."
needs: ["flash-adc", "dac"]
sources:
  - { type: slide, ref: "L10 s449", quote: "Flash conversion:      Fastest, lowest resolution, greatest cost per bit" }
  - { type: slide, ref: "L10 s449", quote: "Successive approximation:        Most widely used in 12-18-bit range" }
  - { type: slide, ref: "L10 s449", quote: "Voltage to frequency: Medium accuracy, slowest, highest noise immunity" }
  - { type: slide, ref: "L10 s449", quote: "Accuracy and resolution requirements generally dictate the number of digital" }
checks:
  - type: choice
    prompt: "Which method is **most widely used in the 12-18-bit range**?"
    options: ["Successive approximation", "Flash", "Single ramp", "Voltage to frequency"]
    answer: 0
    explain: "Successive approximation is the workhorse of data acquisition circuits; flash is fastest, multiple slope is highest precision (16-24 bits) but very slow, V/F is slowest with the highest noise immunity."
  - type: choice
    prompt: "Which method gives the **highest precision (16-24 bits)** but is very slow?"
    options: ["Multiple slope (dual, triple or quad slope)", "Flash", "Single ramp", "Successive approximation"]
    answer: 0
    explain: "Multiple-slope converters are hybrids of the single ramp; they trade speed for accuracy (roughly 10 measurements per second for triple and quad slope)."
  - type: choice
    prompt: "Which statement is true about **accuracy and resolution**?"
    options: ["They are not synonymous: resolution is the smallest difference measurable, accuracy is how well the code represents the true input", "They mean the same thing", "Accuracy is always better than resolution", "Resolution is how fast the converter runs"]
    answer: 0
    explain: "Resolution determines the ability to measure small differences; accuracy is an absolute measure of how well the digitised code represents the analog input voltage."
  - type: choice
    prompt: "Name the four trade-offs in picking a converter."
    options: ["Accuracy and resolution (bits), conversion speed, overall cost and noise immunity", "Colour, size, weight, price", "Clock, reset, power, ground", "Source, sink, pull-up, pull-down"]
    answer: 0
    explain: "The lecture: A/D conversion forces trade-offs among accuracy and resolution (bits), conversion speed, cost, and noise immunity."
card:
  front: "Compare the A/D conversion methods."
  back: "Flash: fastest, lowest resolution, most cost per bit. Single ramp: simple, non-deterministic time. Successive approximation: most widely used, 12-18 bits. Multiple slope (dual/triple/quad): highest precision, 16-24 bits, very slow. Voltage-to-frequency: medium accuracy, slowest, highest noise immunity."
glossary: []
---

## Learn

Choosing a converter forces trade-offs: **accuracy and resolution** (which dictate the number of bits; *they are not synonymous*), **conversion speed**, **overall cost** and **noise immunity**. The lecture's methods:

| Method | Character |
|---|---|
| **Flash** | Fastest, lowest resolution, greatest cost per bit |
| **Single ramp** | Simple, non-deterministic conversion time |
| **Successive approximation** | **Most widely used in the 12-18-bit range** |
| **Multiple slope** (dual, triple, quad) | Highest precision, 16-24 bits, **very slow** |
| **Voltage to frequency** | Medium accuracy, slowest, highest noise immunity |

Delta-sigma is an advanced converter that combines the earlier techniques (think of it as a V/F converter with feedback).

## Worked example

*A data logger needs 16-bit accuracy on a slow thermocouple signal in a noisy factory. Which method?*

1. Speed is not an issue (temperature changes slowly).
2. Accuracy (16 bits) and noise immunity matter.
3. A **dual-slope** (multi-slope) or a **V/F** converter fits; a flash converter would be wrong on cost, resolution and noise.

## Try it

*Which method would you pick for a 1 GSPS oscilloscope front end?*

???

**Flash**: it is the fastest, and the 8-bit resolution of an oscilloscope is within a flash converter's 8-10 bit range.
