---
track: shared
title: "Lab 1 grading and the report"
summary: "Simulation 40%, logic analyzer 50% (with three 10% timing questions), report 20% of the lab; write it like a research paper."
needs: ["pseudorandom-generator"]
sources:
  - { type: handout, ref: "lab1 Step 1", quote: "Simulation: 40% of grade" }
  - { type: handout, ref: "lab1 Step 2", quote: "Using the logic analyzer: 50% of Grade" }
  - { type: handout, ref: "lab1 IV", quote: "Deliverables (20%)" }
  - { type: handout, ref: "lab1 IV", quote: "a paragraph or more on what you thought of the lab" }
checks:
  - type: choice
    prompt: "Which are the deliverables of Lab 1?"
    options: ["Logisim capture and listing, measured listing and cycle length, timing discussion, bibliography", "Only a photo of the breadboard and a signed lab sheet", "Only a spreadsheet of the measured propagation delays", "A fabricated PCB along with its Gerber files"]
    answer: 0
    explain: "The report should look like a research paper: an introduction, what you measured, what you observed and conclusions. Cite your sources (including classmates who helped), explain which clock edge you sampled and why, and include a paragraph on what you thought of the lab."
  - type: choice
    prompt: "Your measured clock-to-data delay is smaller than the sum of the typical data-sheet delays for the flip-flop and XOR gates. How should the report treat this?"
    options: ["Report both numbers, state the conditions, and explain the gap", "Discard the measurement, since only data-sheet values count", "Round the measurement up to the data-sheet value", "Leave the comparison out, because the numbers cannot differ"]
    answer: 0
    explain: "A data sheet gives typical and maximum values under stated conditions, and the analyzer has its own resolution. A good report shows both numbers and reasons about why they differ."
card:
  front: "How is Lab 1 weighted?"
  back: "Step 1 simulation 40%; Step 2 logic analyzer 50% (including 10% questions on the cycle length, the measured propagation delay, the data-sheet comparison, and the frequency limits); deliverables/report 20% (as the handout states). Report like a research paper with citations and lab feedback."
glossary: []
---

## Learn

The lab handout's scoring: **Step 1, simulation: 40%** of the grade; **Step 2, using the logic analyzer: 50%** (with several **10%** questions); and the **deliverables (20%)**. (The handout's percentages are as printed; the course syllabus is the authority on how the lab counts toward the course grade.)

The report should look like a **research paper**: an introduction; what you measured; what you observed; any conclusions; and a bibliography including classmates who helped ("good form"). For example, if you sampled on the rising or falling clock edge, explain why. Include a paragraph or more on what you thought of the lab and suggestions for improving it.

## Worked example

*Why does the handout ask you to justify the clock edge you sampled on?*

1. D flip-flops change after the rising edge.
2. Sampling on the rising edge risks capturing changing data; sampling on the falling edge gives stable values.
3. Explaining the choice shows you understand setup, hold and propagation delay.

## Try it

*Where should you save your analyzer set-up?*

???

Not on the lab computer's desktop (it is not safe there): save to a flash drive or cloud storage.
