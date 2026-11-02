---
track: shared
title: Timing analyzer sampling, transitional timing and glitches
summary: A timing analyzer samples against one threshold; faster sampling shortens the record, transitional timing saves memory, and a glitch is two crossings between samples.
needs: [logic-analyzer-tool]
sources:
  - { type: handout, ref: "laan Choosing the right sampling method", quote: "Remember that every sampling point uses one memory location." }
  - { type: handout, ref: "laan Choosing the right sampling method", quote: "the higher the resolution (faster sampling rate), the shorter the acquisition window" }
  - { type: handout, ref: "laan Choosing the right sampling method", quote: "The worst case for this ambiguity is one sample period" }
  - { type: handout, ref: "laan Transitional sampling", quote: "we use only two memory locations per transition and no memory at all if there is no activity at the input" }
  - { type: handout, ref: "laan Glitch capture", quote: "a glitch is defined as any transition that crosses logic threshold more than once between samples" }
checks:
  - type: choice
    prompt: "A timing analyzer samples every 4 ns into a 4K (4,096-sample) memory. How long can it record?"
    options: ["About 16.4 microseconds", "About 4 microseconds", "About 1 millisecond", "About 16.4 milliseconds"]
    answer: 0
    explain: "Every sample uses one memory location, so the record lasts 4,096 x 4 ns = 16.384 microseconds. A second data burst after that would be missed."
  - type: choice
    prompt: "A signal edge occurs just after one sample point. The analyzer places the transition at the next sample. What is the worst-case timing error?"
    options: ["One sample period", "Half a sample period", "Two sample periods", "None, because the analyzer stores the exact time"]
    answer: 0
    explain: "The analyzer only knows the line changed between two samples, so it shows the edge at the next sample. The worst case is a transition immediately after the previous sample: one full sample period."
  - type: choice
    prompt: "How does transitional timing use memory more efficiently?"
    options: ["It stores only samples that follow a transition, with the time since the last one", "It lowers the sampling rate whenever the signal is slow", "It stores every sample but compresses the file afterwards", "It samples only the clock input"]
    answer: 0
    explain: "A transition detector and a counter mean only two memory locations are used per transition and none when the input is idle, so high resolution (such as 4 ns) can be kept over a long time."
  - type: choice
    prompt: "What counts as a glitch to a timing analyzer?"
    options: ["A transition that crosses the logic threshold more than once between two samples", "Any signal that stays low for a whole sample period", "A single clean edge between two samples", "A voltage above the supply rail"]
    answer: 0
    explain: "The analyzer already tracks single transitions between samples; keeping track of multiple transitions lets it recognise and display glitches."
card:
  front: "Timing analyzer: sampling resolution, transitional timing and glitches."
  back: "Samples a signal against one threshold. Every sample uses one memory location, so faster sampling gives a shorter record (4 ns x 4,096 = 16.4 microseconds). An edge can be misplaced by up to one sample period. Transitional timing stores only transitions (two locations each). A glitch is more than one threshold crossing between samples."
glossary:
  - { term: "Transitional timing", def: "Storing a sample only after a transition, with the elapsed time, so idle periods use no memory." }
  - { term: "Glitch", def: "To a timing analyzer, a transition that crosses the logic threshold more than once between two samples." }
---

## Learn

A **timing analyzer** samples each input against a single user-set voltage threshold: above it is shown as 1, below as 0. The result is a one-bit picture of the waveform. It is not a parametric tool (use a scope for rise time) but it shows **many signals at once** and their timing relationships.

- **Resolution against record length.** Each sample uses one memory location, so a faster sampling rate means a **shorter acquisition window**. At 4 ns a 4K memory covers only 16.4 microseconds.
- **Placement ambiguity.** An edge is placed at the sample after it happened, so it can be late by up to **one sample period**.
- **Transitional timing** stores only a sample that follows a transition plus the time since the last transition: **two locations per transition and none when idle**. That keeps 4 ns resolution while catching later data bursts.
- **Glitches.** Because the analyzer tracks transitions between samples, it can flag any line that **crosses the threshold more than once between samples**, and can trigger on it to show what led up to a rare failure (for example a glitch that occurs once every 36 hours).

## Worked example

*A burst of fast pulses is followed 30 microseconds later by a second burst. The analyzer must resolve 4 ns. Does a 4K memory with plain sampling catch the second burst?*

1. Window = 4,096 x 4 ns = **16.4 microseconds**.
2. The second burst starts at 30 microseconds, after the memory is full, so it is **missed**.
3. With transitional timing, the idle gap costs no memory, so both bursts fit if they have only a few transitions.

## Try it

*A timing analyzer samples every 10 ns. What is the worst-case error in where an edge is displayed?*

???

One sample period: **10 ns**.
