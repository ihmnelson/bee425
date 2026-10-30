---
track: shared
title: Design for testability and mechanical limits
summary: Sockets, test points, mounting, cooling and connector placement are layout decisions.
needs: [pcb-workflow]
sources:
  - { type: slide, ref: "L2 s66", quote: "Provide test points for power and ground, especially ground!" }
  - { type: slide, ref: "L2 s73", quote: "Cooling of heat-generating components" }
  - { type: slide, ref: "L2 s74", quote: "Use the largest trace widths that you can get away with" }
  - { type: slide, ref: "L2 s74", quote: "4-layer boards are more expensive than 2 layer boards" }
checks:
  - type: choice
    prompt: "Which of these is a **design-for-testability** practice from the lecture?"
    options: ["Bring critical signals and ground to accessible test points", "Bury every signal on inner layers", "Solder every part directly with no sockets", "Remove the clock access point"]
    answer: 0
    explain: "Consider debugging while you design: socket components where possible, bring critical signals to accessible test points, provide test points for power and especially ground, and leave room for probes."
  - type: choice
    prompt: "Why does the lecture say to use the **widest** traces you can get away with?"
    options: ["Wider traces and pads are more robust and survive unsoldering and repair", "They make the board cheaper", "They reduce the number of layers", "They remove the need for ground"]
    answer: 0
    explain: "Wider traces and pads hold up better to unsoldering and repair, and wide power and ground traces also lose less voltage."
  - type: choice
    prompt: "What does the lecture say about the **cost** of a board?"
    options: ["Bigger boards cost more, and 4-layer boards cost more than 2-layer boards", "Layer count does not affect cost", "Smaller boards cost more", "Cost depends only on the vendor name"]
    answer: 0
    explain: "Keep cost in mind: the bigger the board the more expensive it is, and 4-layer boards are more expensive than 2-layer boards."
card:
  front: "Name layout choices that make a board easier to debug and build."
  back: "Sockets, test points (especially ground), clock access, room for probes, wide traces and pads, a modular layout following the schematic, labels that stay visible, and connector/cooling/mounting placed for the chassis."
glossary:
  - { term: "Test point", def: "A pad or hole that lets you probe a signal; it can be as simple as a hole that takes a wire." }
---

## Learn

**Design for testability.** Very few hardware designers treat the first working hardware as the final board, so plan to debug it:

- **Socket** components if you can.
- Bring **critical signals** (such as the clock) to accessible **test points**.
- Provide test points for **power and ground**, especially ground, and room for probes.

**Mechanical and thermal limits.** The board has to fit something:

- Plan **mounting holes**, the **type and location of connectors** (someone has to assemble and repair it) and **cooling** (fan and air-flow often fix where parts can go).
- Some parts mount on the board and attach to the chassis too: audio jacks, power connectors, serial and USB.

**Dos and don'ts.** Design in **functional blocks** that sit together; keep the layout flow like the schematic; keep part labels visible after soldering; use the **largest traces** you can; remember that **bigger and more layers cost more**. Through-hole parts are easier to work with, but are becoming harder to find.

## Worked example

*You have a 2-layer board with a clock, a 5 V rail and a debug header. Which test points do you add?*

1. A **clock** test point near the oscillator output.
2. A **ground** test point (a hole or pad tied to the ground plane or trace). The lecture's own 68008 board lacked one and needed a wire tacked to a ground pin.
3. A **5 V** test point.
4. Leave clearance so a probe or scope clip fits.

## Try it

*Give two reasons for putting a socket under an IC on a prototype board.*

???

It can be swapped if it fails or is wrongly programmed without damaging the board, and a single pin can be lifted from the socket so a "green wire" can repair a trace error (both reasons are given on the slide).
