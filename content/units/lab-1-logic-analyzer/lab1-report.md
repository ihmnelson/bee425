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
    options: ["Logisim circuit screen capture and simulated listing with the number of states, the measured listing and cycle length, a timing discussion, and a bibliography", "Only a photo", "Only a spreadsheet", "Nothing"]
    answer: 0
    explain: "The report should look like a research paper: an introduction, what you measured, what you observed and conclusions. Cite your sources (including classmates who helped), explain which clock edge you sampled and why, and include a paragraph on what you thought of the lab."
  - type: choice
    prompt: "Which questions are worth **10% each** in the logic analyzer step?"
    options: ["The number of states before the circuit cycles, the clock-to-data propagation delay, the data-sheet comparison and the max/min frequency and critical path", "The colour of the board", "The cable length", "The software version"]
    answer: 0
    explain: "Step 25 (how many states until the circuit cycles back), the measured propagation delay, the data-sheet comparison, and the maximum and minimum clock frequency with the critical path."
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
