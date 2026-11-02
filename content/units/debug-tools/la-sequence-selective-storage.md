---
track: shared
title: State analyzer sequence levels and selective storage
summary: Sequence levels let a state analyzer wait for several events in order, and selective storage keeps only the states you need.
needs: [la-triggering]
sources:
  - { type: handout, ref: "laan Understanding sequence levels", quote: "Sequence levels allow you to qualify data storage more accurately than a single trigger point." }
  - { type: handout, ref: "laan Understanding sequence levels", quote: "Sequence levels are especially useful for getting into a subroutine from a specific point in the program." }
  - { type: handout, ref: "laan Selective storage saves memory and time", quote: "Selective storage simply means storing only a portion out of a larger whole." }
  - { type: handout, ref: "laan Selective storage saves memory and time", quote: "When the end of the routine is found, we tell the analyzer to stop storing" }
checks:
  - type: choice
    prompt: "What is selective storage on a state analyzer?"
    options: ["Storing only a portion of the states, such as one routine, out of the whole run", "Storing every state and deleting the extras afterwards", "Storing only the states in which the clock is high", "Storing only the first state after a reset"]
    answer: 0
    explain: "Selective storage keeps only what matters, which saves memory and time. It is made possible by sequence levels."
  - type: choice
    prompt: "A routine that squares a number gives the wrong answer. How do you set up the analyzer to capture just that routine?"
    options: ["Level 1: find the start address and store; level 2: find the end and stop", "Trigger on the first clock edge and store everything", "Trigger on RESET and store until memory is full", "Store only the states whose data lines are all zero"]
    answer: 0
    explain: "First the analyzer finds the start of the routine; then it stores everything until it finds the ending address, at which point it stores no more states."
  - type: choice
    prompt: "Why use sequence levels instead of a single trigger point?"
    options: ["To reach a specific point, such as a subroutine entered from one caller", "To make the trace run faster than real time", "To avoid needing a state clock at all", "To hide the address bus from the display"]
    answer: 0
    explain: "A single trigger fires every time its pattern appears. Sequence levels (find A, then find B, then trigger) window in on the data you want without storing information you do not need."
card:
  front: "What are sequence levels and selective storage?"
  back: "Sequence levels: 'find X, else go to level..., then find Y, then trigger' to qualify storage more accurately than a single trigger (e.g. reach a subroutine from one specific caller). Selective storage: store only part of the run, e.g. start storing at a routine's start address and stop at its end address."
glossary:
  - { term: "Sequence level", def: "One step in a multi-step trigger specification (find this, then find that, then trigger)." }
  - { term: "Selective storage", def: "Storing only a selected portion of the states, such as the states of one routine." }
---

## Learn

A **state analyzer** records the bus states on each processor clock. A single trigger point is often too blunt, so it has **sequence levels**, a list of steps like:

1. find A (else go to level ...)
2. then find B
3. trigger on C

This lets the analyzer **qualify what it stores more accurately** than one trigger point, for example to enter a **subroutine from one specific place** in the program.

Sequence levels make **selective storage** possible: store only a portion of the whole. To debug a squaring routine, tell the analyzer to **find the start address, store everything in between, and stop storing when it finds the end address**. Nothing outside the routine uses memory.

## Worked example

*A routine from $1000 to $10A0 is called from many places. You want only the call made from $2400. How do you use sequence levels?*

1. Level 1: find the instruction at **$2400** (the call).
2. Level 2: then find **$1000**, the start of the routine; start storing.
3. Level 3: find **$10A0** and stop storing.

Calls made from other places never satisfy level 1, so they are not stored.

## Try it

*Why is selective storage useful when a routine runs a million times?*

???

It stores only the states of the routine (or only the run you qualified), so memory is not filled with the same repeated states and the interesting one is not lost.
