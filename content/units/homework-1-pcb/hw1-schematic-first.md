---
track: shared
title: "Homework 1: schematic before layout"
summary: "A sketch is an idea; the schematic is the circuit, with every part, value, footprint, pinout, connector and designator."
needs: ["pcb-design.pcb-workflow"]
sources:
  - { type: handout, ref: "hw1 II", quote: "You must never, ever, ever start designing PCBs without" }
  - { type: handout, ref: "hw1 III", quote: "The sketch of a house and plans to build the" }
  - { type: handout, ref: "hw1 III", quote: "Footprint (surface-mount, through-hole)" }
  - { type: handout, ref: "hw1 III", quote: "Filter and bypass capacitors" }
checks:
  - type: choice
    prompt: "What is the difference between a **sketch** and a **schematic**?"
    options: ["The sketch is the idea for a circuit; the schematic is the circuit, with every part fully specified and labelled", "They are the same", "A schematic is a photo of the board", "A sketch has part numbers"]
    answer: 0
    explain: "The handout's analogy: a sketch of a house and the plans to build it are different things. A schematic includes resistors (value, size, tolerance, type), op-amps (type, packaging, electrical characteristics, footprint, pinout, power), connectors, part designations and filter and bypass capacitors."
  - type: choice
    prompt: "Which belongs on the **schematic** for an op-amp?"
    options: ["Manufacturer and package, electrical characteristics, footprint, pinout and power requirements", "Only its name", "Nothing", "Its colour"]
    answer: 0
    explain: "The schematic must make the PCB unambiguous: footprint (surface-mount or through-hole), pinout and power requirements for every IC, plus resistor tolerance and type and capacitor type, value and polarity."
  - type: choice
    prompt: "Which labels would you use: resistors, ICs and connectors?"
    options: ["R1, R2...; U1, U2...; J1, J2...", "A, B, C", "X1, X2, X3", "1, 2, 3"]
    answer: 0
    explain: "Part designations: resistors R, integrated circuits U, connectors J (capacitors C and transistors Q as in the lecture)."
  - type: choice
    prompt: "Why does the handout say never to design the PCB without the schematic?"
    options: ["Students asked for design reviews of boards that had no schematic; a reviewer (and you) need the schematic to check the design", "It is a school rule only", "The CAD tool requires it", "Schematics are free"]
    answer: 0
    explain: "A design review starts with the schematic: without it nobody can check that the board is what you intended."
card:
  front: "What must a schematic contain before PCB layout?"
  back: "Every part with value, size/rating, tolerance and type (resistors), IC type, package, footprint, pinout and power needs, connectors (input, power, output), designators (R, U, J, C), and filter/bypass capacitors with type, value and polarity; power and ground clearly shown. Draw it first: the sketch is not a schematic."
glossary: []
---

## Learn

**Homework Assignment #1** is a jump start on PCB design: design a board for an **instrumentation amplifier** sketched on a napkin. The handout's key rule: **you must never start designing PCBs without first creating the schematic diagram.** The instructor has been asked to review boards for which no schematic existed.

The sketch is not a schematic, just as a sketch of a house is not the plan to build it. The schematic includes:

- **Resistors:** value, size (1/8 W, 1/4 W...), tolerance (1%, 5%, 10%), type (carbon composition, metal film, wire-wound).
- **Op-amps:** type (manufacturer, packaging), electrical characteristics, footprint (surface-mount or through-hole), pinout, power requirements.
- **Connectors:** input, power, output.
- **Part designations:** R1, R2...; U1, U2...; J1, J2...
- **Filter and bypass capacitors:** type (electrolytic, ceramic), value (0.1 µF, 1 µF, 10 µF), polarity.

Only after the schematic is drawn, with all parts labelled and pins numbered, do you go on to the board design. This is the same workflow as the PCB lesson.

## Worked example

*You designed the op-amp stage but have not chosen the capacitors yet. Can you start the layout?*

1. No: the schematic is not complete (no filter or bypass capacitors, no connectors).
2. A missing part on the schematic means a missing part on the board.
3. Finish and review the schematic first.

## Try it

*Name the part designators you will see on the instrumentation amplifier schematic.*

???

R (resistors, including the gain and matched resistors), U (the op-amp and the ICL7660 converter), C (capacitors) and J (connectors).
