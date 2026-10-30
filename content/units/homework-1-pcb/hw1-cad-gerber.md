---
track: shared
title: "PCB CAD tools, Gerber files and layout choices"
summary: "Learn a CAD tool on a practice design; Gerber files let any fabricator build the board; make layout decisions deliberately."
needs: ["hw1-schematic-first"]
sources:
  - { type: handout, ref: "hw1 III", quote: "A Gerber file is the industry standard file format for converting a PCB design" }
  - { type: handout, ref: "hw1 III", quote: "there is no way around a learning curve" }
  - { type: handout, ref: "hw1 III", quote: "their software produces design files that can only be used with their manufacturing process" }
  - { type: handout, ref: "hw1 III", quote: "Number of layers (1, 2, 4, etc )" }
checks:
  - type: choice
    prompt: "What is a **Gerber file**?"
    options: ["The industry-standard file format for turning a PCB design into a physical board; any fabricator can use it", "A schematic", "A parts list", "A simulation file"]
    answer: 0
    explain: "If you do not want to be locked in to one fabricator, use CAD software that outputs Gerber files (Eagle, Fritzing, KiCad and others). ExpressPCB and Sunstone designs can be built only by their own processes (ExpressPCB will send the Gerber file after you place the first order)."
  - type: choice
    prompt: "What is the disadvantage of using ExpressPCB or Sunstone software?"
    options: ["Their design files can be used only with their own manufacturing process: you are locked in", "They cost thousands", "They cannot draw schematics", "They have no support"]
    answer: 0
    explain: "Other free packages named: Eagle (student version), Fritzing, EasyEDA, KiCad (possibly on the lab computers)."
  - type: choice
    prompt: "Which decisions does Step 3 (designing the board) list?"
    options: ["Number of layers, mounting holes, connector locations, ground and power busses, signal trace width and power bus width", "Colour and logo", "Only the part list", "Only the price"]
    answer: 0
    explain: "Place components, move them around until the layout works (several iterations), then route; trace width, especially power and ground, matters (see the trace-resistance lesson)."
  - type: choice
    prompt: "When should you learn the CAD tool?"
    options: ["Early, on this practice design: there is a learning curve, and at some point you have to dive in", "On the final project only", "Never", "After ordering boards"]
    answer: 0
    explain: "The handout: invest time learning the tools, then 'dive off the deep end'. The first homework exists to do the learning before the project board is designed."
card:
  front: "What do you need to know about PCB CAD tools?"
  back: "Any CAD tool has a learning curve; practice on a simple design. ExpressPCB/Sunstone lock you to their manufacturing; tools that output Gerber files (Eagle, Fritzing, KiCad) let you use any fabricator. Board decisions: layers, mounting holes, connectors, power/ground buses, trace and power widths."
glossary:
  - { term: "Gerber file", def: "The industry-standard file format describing the layers of a PCB for fabrication." }
---

## Learn

**Step 0 and 1: pick and learn a tool.** The handout's example is ExpressPCB (classic), with Sunstone's PCB123, Autodesk Eagle (free student version), Fritzing, EasyEDA and KiCad as alternatives. **No matter what CAD software you use, you will need to invest time learning it**; there is no way around a learning curve.

**Lock-in vs Gerber:** ExpressPCB and Sunstone software produce design files that can only be used with their own manufacturing, so you are **locked in**. To use any other fabricator (including inexpensive ones abroad, where shipping can cost more than the boards) you need CAD software that outputs **Gerber files**, the industry standard format for converting a design into a physical PCB. Eagle and Fritzing produce them.

**Step 3: the board.** Open the board editor (for ExpressPCB a standard 2.75 x 3.75 in outline) and decide: the **number of layers**, **mounting holes** (screw size), **location of connectors**, **ground and power busses**, **signal trace width** and **power bus width**. Place components and move them around until the positions work; it may take several iterations. (This mirrors the PCB-design lesson.)

## Worked example

*You want to use a cheap overseas fabricator. Which CAD tools can you use?*

1. The fabricator needs Gerber files.
2. Use Eagle, Fritzing, KiCad or another tool that exports Gerber.
3. A tool that only exports its own format (ExpressPCB, Sunstone) would tie you to its own manufacturer.

## Try it

*Why does the handout tell you to practise before the real board?*

???

A first design has errors (most are mechanical), and re-spinning a board costs time and money that a project does not have; practising on a throw-away design builds the skill first.
