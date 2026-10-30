---
track: shared
title: "Analog computers and op-amp arithmetic"
summary: "Before digital computers, op-amp circuits added, multiplied, differentiated and integrated, with about 5% accuracy."
needs: []
sources:
  - { type: slide, ref: "L1 s32", quote: "Typical accuracy of ~5%" }
  - { type: slide, ref: "L1 s32", quote: "Based upon the ability of vacuum" }
  - { type: slide, ref: "L1 s34", quote: "Once you have a log amp, you can multiply, divide and raise to a power" }
  - { type: slide, ref: "L1 s36", quote: "Torpedo Data Computer (TDC)" }
checks:
  - type: choice
    prompt: "What was the **typical accuracy** of the WWII analog computers, and what limited them?"
    options: ["About 5%, with a limited numeric range", "About 0.001%, with unlimited range", "Exactly accurate, but slow", "About 50%"]
    answer: 0
    explain: "Op-amp based analog computers had a typical accuracy of about 5% and a limited numeric range."
  - type: choice
    prompt: "How can an op-amp circuit **multiply** two variables?"
    options: ["With a logarithmic amplifier: add the logs, then take the antilog", "By adding the voltages", "By using a clock", "It cannot"]
    answer: 0
    explain: "A log amplifier uses the logarithmic relationship between the transistor's current and voltage. Once you have log and antilog circuits you can multiply, divide and raise to a power; op-amps can also differentiate and integrate."
  - type: choice
    prompt: "Which of these is an example of a **WWII analog computer** named in the lecture?"
    options: ["The Torpedo Data Computer and the Norden bombsight", "ENIAC", "The Teensy 4.1", "The Z80"]
    answer: 0
    explain: "The TDC computed when to fire a torpedo from the angle between ships, speeds and range; the Norden bombsight computed the bomb release point from height, distance, speed, wind and air resistance. ENIAC, in contrast, was the first general-purpose electronic digital computer."
card:
  front: "What could analog computers do, and how accurate were they?"
  back: "Op-amp circuits could add, subtract, multiply (by a constant or another variable via log amps), divide, exponentiate, take log/antilog, differentiate, integrate and generate sine waves, with about 5% accuracy and limited range. Examples: the Torpedo Data Computer and the Norden bombsight."
glossary:
  - { term: "Analog computer", def: "A computer that does mathematics with continuous voltages in op-amp circuits rather than with binary numbers." }
---

## Learn

Not all computers are digital. During WWII, **analog computers** used vacuum-tube **op-amp** circuits to do mathematics. Such circuits can **add, subtract, multiply by a constant (gain), multiply two variables, divide, exponentiate, take a log or antilog, and generate sine waves**. They can also **differentiate and integrate**. A **logarithmic amplifier** exploits the logarithmic current-voltage relationship of a transistor (with V_T about 28 mV at room temperature); once you have a log amp you can multiply, divide and raise to a power.

The limits: **typical accuracy about 5%** and **limited numeric range**.

Two famous WWII examples:
- The **Torpedo Data Computer (TDC)** on submarines took the angle between the ships, the speeds of sub and target, and the range, and output when to fire.
- The **Norden bombsight** computed the bomb release point from the plane's height, distance to target, speed, wind speed and air resistance; the discovery of the jet stream caused massive errors.

For contrast, **ENIAC** (Eckert and Mauchly, Penn's Moore School, funded by the Army for artillery firing tables) was the first electronic **digital** general-purpose computer: 18,000 vacuum tubes, about 1,900 additions per second, programmed by plugging cables and setting switches.

## Worked example

*An analog computer with 5% accuracy computes a quantity whose true value is 200. What range could the answer be in?*

1. 5% of 200 = 10.
2. The answer could be anywhere from about **190 to 210**.
3. Digital computers avoid this because a binary number can have as many bits of precision as you provide.

## Try it

*Which operation does the log amp make possible that a plain summing amplifier cannot do?*

???

**Multiplying two variables** (and dividing, or raising to a power): add the logarithms with a summing amplifier, then take the antilog.
