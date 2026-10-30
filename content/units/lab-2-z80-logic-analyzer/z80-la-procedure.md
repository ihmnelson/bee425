---
track: shared
title: "Z80 logic analyzer procedure: state mode, triggers and timing"
summary: "Sample on the falling edge of CLK1, trigger on the first fetch after RESET, and compare measured timing with the Z80A data sheet."
needs: ["z80-m1-cycle", "lab-1-logic-analyzer.la-state-mode-setup"]
sources:
  - { type: handout, ref: "lab2 I", quote: "using the falling edge of CLK1 to record your states" }
  - { type: handout, ref: "lab2 I", quote: "The Z80 comes out of RESET and begins to" }
  - { type: handout, ref: "lab2 I", quote: "you should at least use the ~MREQ signal to qualify" }
  - { type: handout, ref: "lab2 I", quote: "Why is the maximum resolution of your timing measurement limited to +/- 2 ns?" }
checks:
  - gen: lab.laResolution
  - type: choice
    prompt: "How should the analyzer be set up to capture the program from power-up?"
    options: ["State mode on the falling edge of CLK1; trigger on the first instruction fetch after ~RESET goes high, qualified by ~MREQ (and optionally ~M1); hold RESET, arm, release", "Timing mode only", "Trigger on any signal", "Hold RESET and never arm"]
    answer: 0
    explain: "The Z80 comes out of RESET at address 0000H, so qualify the address with ~MREQ (and ~M1) and use ~RESET going high as the Edge A condition. Press single acquisition while holding the RESET button; when 'prefill complete' appears, release it."
  - type: choice
    prompt: "In the timing-mode measurements, what do you compare with the published Z80A data?"
    options: ["The time from a clock edge to ~M1 and ~MREQ becoming active, and becoming inactive; check each lies between the published min and max", "The cable length", "The oscillator colour", "The EPROM label"]
    answer: 0
    explain: "Measure with the cursors at the 500 MHz setting, use a timing diagram from the web (or Appendix B), and answer whether each measured value falls in the allowed window. Resolution is limited to +/- 2 ns by the 500 MHz sample clock."
  - type: choice
    prompt: "The analyzer's state trace shows 'unadulterated bus cycle data'. What does that mean?"
    options: ["Raw bus cycles, not a post-processed instruction listing: you must decode op-codes and operands yourself", "A disassembly", "Only the program counter", "The source code"]
    answer: 0
    explain: "The lab expects you to do a bit of post-processing yourself (for example in Excel) to recognise instructions, operands and data cycles from the raw states."
card:
  front: "What is the Z80 analyzer procedure?"
  back: "Set groups for the address and data buses; state mode on the falling edge of CLK1; insert the sample EPROM; connect cable and power; verify T (toggling) on all signals; timing mode at 50-100 MHz then 500 MHz to measure ~M1/~MREQ timing against the Z80A spec (+/- 2 ns resolution); state-mode trace from RESET with Edge A on ~RESET rising, qualified by ~MREQ; export CSV to Excel."
glossary: []
---

## Learn

**Procedure (condensed from the handout):**

1. Match the analyzer's inputs to the board's signals; use groups so the address and data buses read as hexadecimal.
2. Set **state mode, recording on the falling edge of CLK1**.
3. Insert the sample EPROM (LAB 2-0) with the power off, connect the analyzer first and then the power, and check that all signals show **T**. If a control or data signal is not toggling, press RESET.
4. **Timing mode** (50-100 MHz for a 4 MHz clock) for a first trace; then find the published bus-cycle timing for a **Z80A instruction fetch** and set the analyzer to its **500 MHz** maximum.
5. Answer: the time from the clock edge to ~M1 and ~MREQ **becoming active**, and **becoming inactive**; do they fall within the published min/max; why is the resolution limited to **+/- 2 ns** (screen capture required)?
6. **State mode capture from RESET:** the Z80 starts at 0000H; qualify the address with ~MREQ and use ~RESET going high (and optionally ~M1) as the trigger so the first fetch is captured. Hold RESET, press single acquisition, release when 'prefill complete' appears.
7. Export the state trace as a CSV file to Excel and compare it with the sample program's listing.

## Worked example

*Why trigger on ~RESET rising rather than on the address 0000H alone?*

1. Address 0000H also appears later, for example after a jump to 0000H or if the program wraps.
2. ~RESET going high marks exactly the start of execution after reset.
3. Qualifying with ~MREQ ensures it is a memory address, not an I/O one.

## Try it

*How fast should the analyzer sample to see edges of a 4 MHz Z80 to about 2 ns?*

???

500 MHz (one sample every 2 ns), the analyzer's maximum in timing mode.
