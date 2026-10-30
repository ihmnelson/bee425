---
track: shared
title: The PCB design workflow
summary: Schematic first, every part labelled, parts placed before any wire is routed.
needs: []
sources:
  - { type: slide, ref: "L2 s61", quote: "Don’t skip the schematic capture step" }
  - { type: slide, ref: "L2 s61", quote: "Integrated circuits > U numbers" }
  - { type: slide, ref: "L2 s63", quote: "Don’t start wiring just yet" }
checks:
  - type: choice
    prompt: "On a schematic, which letter prefix labels an **integrated circuit**?"
    options: ["U", "R", "Q", "J"]
    answer: 0
    explain: "The course's labels are R for resistors, C for capacitors, Q for transistors, U for integrated circuits and J for connectors."
  - type: choice
    prompt: "In what order should you work when laying out a board?"
    options: ["Schematic, then place parts, then route traces", "Route traces first, then place parts", "Place parts, then draw the schematic", "Order the board, then fix errors"]
    answer: 0
    explain: "Never skip schematic capture, and do not start wiring until the parts are placed so the layout will not paint you into a corner."
  - type: choice
    prompt: "The schematic has a wrong pinout for a regulator. What is the effect on the finished board?"
    options: ["The PCB will be wrong too", "The layout software corrects it", "Nothing; pin order does not matter on a PCB", "Only the silkscreen is affected"]
    answer: 0
    explain: "If the schematic is wrong the PCB will be wrong. Get the data sheets for all complex parts and check pinouts and footprints before layout."
card:
  front: "In what order do you design a PCB, and what does each reference-designator letter stand for?"
  back: "Understand the circuit, capture the schematic, label every part (R resistors, C capacitors, Q transistors, U ICs, J connectors), place parts, then route traces, then review."
glossary:
  - { term: "Footprint", def: "The pattern of pads and holes on the board that a component's pins solder into; it comes from the data sheet or a CAD library." }
---

## Learn

The lecture gives a "cookbook" for going from a schematic to an error-free board. The key rules:

1. **Understand the circuit** before you lay it out.
2. **Do not skip schematic capture** and go straight to the PCB. The schematic must name **every part**: R (resistors), C (capacitors), Q (transistors), U (integrated circuits), J (connectors), plus the power and ground buses.
3. **Learn the CAD tool on a practice design**, not on your real board.
4. **If the schematic is wrong, the PCB will be wrong.** Get data sheets for every complex part, and the footprint dimensions for the layout.
5. **Place parts first and do not start wiring yet.** Move and rotate parts until the traces look easy. A consistent strategy helps, for example north-south traces on one layer and east-west on the other.
6. **Plan trace width early**, especially for power and ground.
7. **Watch hole and via sizes.** A via connects traces on different layers; vias and through-holes are not the same thing.
8. **Allow time to check**, assume there will be errors, and have others review the design.

## Worked example

*You have the schematic for a board with a microcontroller, a regulator, two connectors and a handful of resistors. List the order of work.*

1. Confirm the circuit works (simulation or a known design) and collect data sheets for the microcontroller and the regulator.
2. Capture the schematic with every part labelled: U1 (microcontroller), U2 (regulator), J1 and J2 (connectors), R1 to R6.
3. Pick footprints from the CAD library, checking them against the data sheets.
4. Place parts: connectors at the board edge where the chassis needs them, the microcontroller central.
5. Plan trace widths (wide power and ground), then route.
6. Run the design rule check and get an independent review before ordering.

## Try it

*A friend wants to start laying out their PCB straight from a circuit they found online, without drawing the schematic. Name two things that go wrong.*

???

Without a captured and checked schematic there is no list of every part, so parts and connections get missed, and any mistake in the source circuit is copied into the board. The lecture says to never skip schematic capture, to get data sheets for the parts, and that a wrong schematic gives a wrong PCB.
