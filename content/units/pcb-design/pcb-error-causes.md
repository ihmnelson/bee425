---
track: shared
title: "Why PCBs fail: mechanical errors and design reviews"
summary: Most layout errors are mechanical, and only independent reviews catch them.
needs: [pcb-workflow]
sources:
  - { type: slide, ref: "L2 s59", quote: "75% - 90% of the errors on a PCB layout are mechanical issues" }
  - { type: slide, ref: "L2 s78", quote: "Three out of four errors were mechanical issues, not electrical" }
  - { type: slide, ref: "L2 s86", quote: "Every board design should have multiple, independent reviews" }
checks:
  - type: choice
    prompt: "According to the lecture, what kind of error is **most likely** on a first PCB layout?"
    options: ["Mechanical (holes, connectors, clearances, footprints)", "Electrical (wrong net connections)", "Software", "Component failure in manufacturing"]
    answer: 0
    explain: "The lecture's rule of thumb is that 75% to 90% of PCB layout errors are mechanical: hole alignment and size, connectors, interference and footprints."
  - type: choice
    prompt: "The author assumed a voltage regulator's pinout was 'normal' (Vin, ground, Vout) and it was not. What should have been done?"
    options: ["Check the data sheet before designing the board", "Order extra boards", "Trust the footprint from the CAD library", "Reverse the part after assembly"]
    answer: 0
    explain: "Error #4 in the case study: the pinout assumption was never checked against the data sheet. The fix was a kludge (rotating the part, cutting a trace and adding wires)."
  - type: choice
    prompt: "What is the best defence against errors you cannot see yourself?"
    options: ["Multiple, intensive, independent design reviews", "A faster CAD computer", "Fewer layers", "A bigger board"]
    answer: 0
    explain: "Mechanical problems are hard for the designer to find. The lecture says every board needs multiple, independent reviews of the circuit and of the PCB, and that the reviews must be intensive, not cursory."
card:
  front: "What fraction of PCB layout errors are mechanical, and what is the remedy?"
  back: "About 75% to 90% (hole alignment and size, connectors, clearances, footprints). The remedy is multiple independent design reviews and checking dimensions against the data sheet."
glossary: []
---

## Learn

The lecture's rule of thumb: **75% to 90% of the errors on a PCB layout are mechanical issues**: hole alignment, hole size, connectors, interference between parts, footprints that do not match the real part. They are hard for the designer to see, so you need a **design review**.

The author's own case study had four errors in the first boards:

| # | Error | Type |
|---|---|---|
| 1 | A typo in the data sheet's footprint dimensions (2 mm, but it mattered) | Mechanical |
| 2 | Footprint 1.000 in wide instead of 0.950 in | Mechanical |
| 3 | A module too close to the USB socket | Mechanical |
| 4 | Assumed the regulator's pinout was standard; it was not | Electrical |

Three of four were mechanical. The root-cause fixes are simple: use the **latest data sheet** and double-check it against the real part, check **clearances**, and **never assume a pinout**.

Boards can sometimes be salvaged with kludges (bent pins, cut traces, jumper wires), but the lecture's moral is that it is better not to need to. **Even experienced designers plan for revisions**, and every design should have multiple independent reviews, first of the circuit design and then of the PCB design.

## Worked example

*A 4-board project found 8 errors in total. Using the lecture's rule of thumb, how many would you expect to be mechanical?*

1. The rule of thumb is 75% to 90%.
2. 75% of 8 = 6, and 90% of 8 = 7.2.
3. So expect about **6 or 7** mechanical errors and only 1 or 2 electrical ones.

## Try it

*Your friend says 'my circuit simulated fine, so the PCB will be fine'. What kinds of errors does a simulation not catch?*

???

Simulation checks the electrical behaviour of the schematic. It does not see footprints that are the wrong size, holes that are too small, parts too close together, or connectors that will not mate. Those mechanical errors are most of what goes wrong, which is why a design review is needed.
