---
track: shared
title: "Logic-analyzer measurements and trigger set-up"
summary: "Timing mode resolves edges to one sample period (2 ns at 500 MHz); set triggers on an address pattern qualified by ~AS and ~RD."
needs: [m68008-board]
sources:
  - { type: handout, ref: "lab3 §X", quote: "Why is the maximum resolution of a timing measurement +/- 2 ns?" }
  - { type: handout, ref: "lab3 §X", quote: "The GAL22V10B can introduce up to a 15 ns additional time delay" }
  - { type: handout, ref: "lab3 §IX", quote: "You should always have the logic analyzer powered on before you power on the experimental board" }
  - { type: handout, ref: "lab3 Appendix B", quote: "the maximum time delay for an 8 MHz clock is 62 nanoseconds" }
checks:
  - gen: lab.laResolution
  - gen: lab.laResolution
  - type: choice
    prompt: "Measured clock-high-to-address-valid is **28 ns**; the published maximum for an 8 MHz clock is **62 ns**. What do you conclude?"
    options: ["It is within specification (28 ns is below the 62 ns maximum)", "The processor is faulty", "The analyzer is wrong", "It is out of specification"]
    answer: 0
    explain: "The lab's own example: measured 28 ns against a published maximum of 62 ns. Measured times can differ from published data; you are fine as long as the value is within the published limits."
  - type: choice
    prompt: "Why does the handout warn about measuring signals that come from the **GAL22V10B**?"
    options: ["The GAL can add up to 15 ns of delay, so the real time may be less than measured", "The GAL is faster than the processor", "The GAL has no outputs", "The GAL changes the clock"]
    answer: 0
    explain: "Function codes go into the GAL, which makes Pfetch and Dfetch. If a measurement involves a GAL output, report that the true total time could be up to 15 ns less."
  - type: choice
    prompt: "In what order should you power the analyzer and the experiment board?"
    options: ["Analyzer first on, and off last; board powered after the analyzer is on and removed before it is off", "Board first", "Both at once", "Order does not matter"]
    answer: 0
    explain: "Have the logic analyzer powered before powering the board, to prevent excessive current from being driven into the analyzer; remove power from the board before removing power from the analyzer."
  - type: choice
    prompt: "To capture the fetch of the first op-code at address $1000, what should the **trigger pattern** be?"
    options: ["Address $1000 with ~CSROM = 0, ~AS = 0, ~RD = 0 and Pfetch = 1, all other signals don't care", "Any signal toggling", "RESET high", "The clock only"]
    answer: 0
    explain: "Qualify the address pattern with the chip select, address strobe, read and program-fetch signals so you trigger on exactly the op-code fetch from ROM."
card:
  front: "How do you measure and trigger with the logic analyzer in this lab?"
  back: "Timing mode at 500 MHz resolves to one sample period (2 ns). Trigger on a pattern: address plus ~CSROM, ~AS, ~RD low and Pfetch high, or on the RESET edge. Place cursors A and B on edges, read the interval, compare with the published 68000 timing table (e.g. clock-to-address-valid max 62 ns at 8 MHz). GAL outputs can add up to 15 ns. Power the analyzer before the board."
glossary:
  - { term: "Timing mode", def: "Logic-analyzer mode that samples with its own internal clock to show a waveform; state mode samples with the target's clock." }
---

## Learn

**Timing resolution.** In timing mode the analyzer samples at its own clock. At its maximum of **500 MHz** each sample is **2 ns** apart, so an edge is located only to within about **+/- 2 ns**: resolution is one sample period (the lab asks you to explain this).

**Triggers.** Use *Edge A* on RESET (high to low) to capture from reset; use *Pattern A* to catch a specific bus cycle. For the op-code fetch at $1000, set A0..A15 = $1000, **~CSROM, ~AS, ~RD = 0**, **Pfetch = 1**, and everything else don't care. Hold RESET, press single acquisition (wait for "prefill complete"), then release RESET.

**Measurement.** Place cursor A on the clock edge and cursor B on the edge of interest (turn off snap-to-grid for finer placement) and read the interval in the measurement bar. Compare with the published timing table for a 68000 read/write cycle (the 68008 has the same relationships at the same clock). Example: clock high-to-low between S0 and S1 to address valid: published maximum **62 ns** at 8 MHz; the lab example measured **28 ns**, which is within spec. Do **not** compute statistical deviations from published values; that has no meaning for a handful of measurements.

**GAL warning.** Signals from the GAL22V10B (Pfetch, Dfetch, chip selects) can add up to **15 ns**, so report that the actual time might be less.

**Procedure safety.** Power the analyzer **before** the board and remove board power first.

## Worked example

*The analyzer samples at 250 MHz. You measure an interval of 12 samples. What is the interval and its uncertainty?*

1. Sample period = 1000 / 250 = 4 ns.
2. Interval = 12 x 4 = **48 ns**.
3. Uncertainty about +/- one sample period: **+/- 4 ns**.

## Try it

*Why can the lab say the maximum resolution is +/- 2 ns?*

???

The fastest sampling clock is 500 MHz, which gives a sample every 2 ns; an edge can only be placed to within one sample period, so +/- 2 ns.
