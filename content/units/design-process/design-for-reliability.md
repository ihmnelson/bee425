---
track: shared
title: Designing in reliability (worst-case timing, reviews, thermal checks, ESD)
summary: Reliability must be designed in; an HP example shows worst-case timing analysis, peer review, netlist checking, thermal and environmental tests, ESD control and MTBF.
needs: [design-review]
sources:
  - { type: handout, ref: "hp Reliability (HP Journal 1984, scanned page read with OCR)" }
checks:
  - type: choice
    prompt: "In the HP example, what does 'design margin' let a product do, and how was it ensured for the critical timing paths?"
    options: ["It lets the product work over a wide range of conditions and component variations; each critical timing path got a worst-case analysis", "It lets the product run faster than its rated clock; paths were simply tested at room temperature", "It reduces the part count; paths were rerouted by the autorouter", "It extends the warranty; paths were checked by the customer"]
    answer: 0
    explain: "Design margin is what lets a product function over a wide range of environmental conditions and component variations. A worst-case analysis took into account power supply variation, output loading, temperature variation and the stripline characteristics of the board."
  - type: choice
    prompt: "Why did HP read the finished layout back into software, produce a list of all wires and connections, and compare it with the schematic?"
    options: ["To check that the laid-out board matches the schematic before fabrication", "To count the parts for the bill of materials", "To tune the clock frequency of the board", "To prepare the silkscreen text for printing"]
    answer: 0
    explain: "The connection list was checked against the schematic as one final verification before boards were fabricated. This catches wiring errors that crept in during layout."
  - type: choice
    prompt: "Why is electrostatic discharge (ESD) damage dangerous even when a component keeps working?"
    options: ["A weakened part can pass factory tests and fail after a few hours at the customer's site", "ESD always destroys the part immediately, so it is found in test", "ESD makes the part faster but less accurate", "ESD only affects the packaging, not the silicon"]
    answer: 0
    explain: "Often a component is not destroyed by ESD but merely weakened. HP used antistatic mats, grounding straps and conductive packaging to prevent it."
  - type: choice
    prompt: "A CPU board has a predicted MTBF of 10,400 hours, and field data shows 2 to 2.5 times better. About what field MTBF does that imply?"
    options: ["About 20,800 to 26,000 hours", "About 5,200 to 4,160 hours", "About 10,400 to 10,402 hours", "About 104,000 to 260,000 hours"]
    answer: 0
    explain: "2 x 10,400 = 20,800 and 2.5 x 10,400 = 26,000 hours (calc from the reading's figures)."
card:
  front: "How did HP design in reliability (1984 example)?"
  back: "Reliability must be designed in, not added later. Worst-case analysis of each critical timing path (supply, loading, temperature, board stripline); peer design reviews; layout read back as a connection list and checked against the schematic; thermocouples for hot spots and junction temperature; environmental tests; ESD control; MTBF predictions compared with field data."
glossary:
  - { term: "Design margin", def: "The attribute that lets a product work properly over a wide range of conditions and component variations." }
  - { term: "MTBF", def: "Mean time between failures: a predicted or measured average operating time between failures." }
---

## Learn

A 1984 Hewlett-Packard example (one page, scanned) shows reliability being **designed in**, because, in its words, reliability, like quality, "must be designed in. It cannot be added on later." The practices:

1. **Design margin by worst-case analysis** of each critical timing path, accounting for power supply variation, output loading, temperature variation and the stripline characteristics of the circuit board.
2. **Peer design reviews** of each module before the board is made; each engineer learns a part well enough to explain it to the group.
3. **Layout check:** the board layout is read back by software into a list of all wires and connections and compared with the schematic before fabrication.
4. **Thermal check:** thermocouples find hot spots, and the data gives each IC's junction temperature so no device is overstressed.
5. **Environmental tests** over temperature, line voltage and frequency, humidity, altitude and vibration.
6. **ESD control** in manufacturing, since weakened parts can pass factory tests and fail soon at the customer.
7. **MTBF** predicted (RADC II methods) and compared with field data; here the field results were 2 to 2.5 times better than predicted.

## Worked example

*A board has a predicted MTBF of 7,400 hours and field data 2 to 2.5 times better. What field range does that imply?*

1. 2 x 7,400 = **14,800 hours**.
2. 2.5 x 7,400 = **18,500 hours**.

## Try it

*Which two earlier steps of this course's own workflow match steps 2 and 3 in the list above?*

???

The **design review** (step 2) and checking the **layout against the schematic** (step 3), which this course also stresses before ordering boards.
