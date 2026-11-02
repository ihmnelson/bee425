---
track: shared
title: "The instrumentation amplifier: gain, supplies and matched resistors"
summary: "Gain 100-1000, matched resistors (trim with a pot and 4-wire measurement), +/-5 V from a single supply with an ICL7660."
needs: ["hw1-schematic-first"]
sources:
  - { type: handout, ref: "hw1 II", quote: "Anything between 100 and 1000 is the usual gain range" }
  - { type: handout, ref: "hw1 II", quote: "you might want to consider specifying matched resistors" }
  - { type: handout, ref: "hw1 II", quote: "using a 4-wire measurement" }
  - { type: handout, ref: "hw1 III", quote: "The Op-07 will operate from +/- 3V to +/- 18V" }
  - { type: handout, ref: "hw1 III", quote: "as long as your current requirements are less than 100mA" }
checks:
  - type: choice
    prompt: "Two 1% resistors of 10 kilohms nominal can differ by at most how much?"
    options: ["About 200 ohms in the extreme (each is within +/-100 ohms)", "Exactly 0, since both are 10 kilohms nominal", "About 1 ohm, because 1% resistors are laser trimmed to match", "About 1 kilohm, which is the 10% tolerance range"]
    answer: 0
    explain: "Each 1% resistor of 10 kilohms can be off by up to 100 ohms in either direction, so two of them can differ by about 200 ohms. A series trim pot of up to 100 ohms on the smaller one can bring them together."
  - type: choice
    prompt: "Why do some resistors in the instrumentation amplifier have to be matched?"
    options: ["A difference amplifier's common-mode rejection depends on matched resistor ratios", "Matched resistors reduce cost through bulk purchasing", "Matched resistors save board space under the op-amp", "Matched resistors only make the schematic look neat"]
    answer: 0
    explain: "The instrumentation amplifier makes low-level differential measurements (for example in medical equipment), so mismatched resistors would convert common-mode signals into errors."
  - type: choice
    prompt: "How does the handout suggest getting -5 V on the board?"
    options: ["Use a single +5 V supply and an ICL7660 converter, as long as the current is under 100 mA", "Use a second battery wired in series with reversed polarity", "It cannot be done from a single 5 V supply", "Use a transformer on the 5 V supply"]
    answer: 0
    explain: "A +5 V input and an ICL7660 voltage converter produce -5 V. The OP-07 works from +/-3 V to +/-18 V (at least 6 V total); low-voltage op-amps from Maxim or Analog Devices work at lower supplies."
  - type: choice
    prompt: "What gain range is usual for an instrumentation amplifier?"
    options: ["100 to 1,000", "1 to 2", "10,000 to 100,000", "0.1 to 1"]
    answer: 0
    explain: "The designer chooses; avoid resistors that are too big or too small ('Goldilocks'); don't forget filter capacitors and I/O connectors."
card:
  front: "Key design points for the Homework 1 instrumentation amplifier."
  back: "DC gain 100-1000 (your choice); single +5 V with an ICL7660 for -5 V (under 100 mA) or a dual supply; OP-07 works from +/-3 to +/-18 V; use moderate resistor values; match critical resistors (matched parts or a trim pot in series, measured four-wire); add filter/bypass capacitors and connectors."
glossary:
  - { term: "Instrumentation amplifier", def: "A differential amplifier with high input impedance and matched resistors for accurate low-level measurements such as medical signals." }
---

## Learn

The circuit is an **instrumentation amplifier (IAmp)**, commonly used for **low-level differential measurements** such as medical equipment. Design choices from the handout:

- **DC gain:** anything between **100 and 1,000** is usual; you decide.
- **Supplies:** single or dual. The instructor used a single **+5 V** supply and an **ICL7660** converter to make **-5 V** (fine while the current requirement is under **100 mA**). The suggested op-amp, the **OP-07**, operates from **+/-3 V to +/-18 V** (you need at least 6 V in total on a single supply); lower-voltage op-amps exist for very low supplies.
- **Resistor values:** not too big, not too small ("Goldilocks").
- **Matched resistors:** specify matched parts, or use close resistors with a **trim pot in series**. Example: two 1%, 10 kΩ resistors may differ by up to 100 Ω from nominal; put a 100 Ω variable resistor in series with the smaller and tune it using a **four-wire (Kelvin) measurement** on a good multimeter, matching them to better than **0.01%**. (Four-wire measurement is used because it removes the lead and contact resistance that would swamp a 0.01% measurement.)
- Don't forget **filter capacitors and I/O connectors**.

## Worked example

*Gain resistors R1 = 9.9 kΩ and R2 = 10.1 kΩ (both 1%). What trim do you need to match them?*

1. The difference is 200 Ω.
2. A 100 Ω trim pot cannot cancel 200 Ω; the handout's example assumes the pair differ by no more than 100 Ω (nominal 10 kΩ, within 1% each, measured).
3. Measure the actual values, choose the closer pair or a bigger trim range.

## Try it

*Why measure resistors with four wires?*

???

A four-wire measurement uses separate wires to force current and sense voltage, so the lead and contact resistance does not add to the reading; this is needed to match to 0.01%.
