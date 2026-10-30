---
track: shared
title: "The logic analyzer as a debugging tool"
summary: "A very low-resolution digital scope with 30-400 channels: timing mode for hardware, state mode for software, triggered traces in a circular buffer."
needs: [embedded-systems-and-process]
sources:
  - { type: slide, ref: "L11 s508", quote: "Think of the logic analyzer (LA) as a very low-" }
  - { type: slide, ref: "L11 s512", quote: "The LA will be able to record 10 states for each clock cycle of the" }
  - { type: slide, ref: "L11 s513", quote: "Most useful operating mode for the software designer" }
  - { type: slide, ref: "L11 s511", quote: "Enables the trace to record events prior to the trigger point" }
  - { type: slide, ref: "L11 s519", quote: "Lose relevance when the observed behavior at the I/O pins of the processor do not" }
checks:
  - gen: la.statesPerClock
  - gen: la.traceBuffer
  - type: choice
    prompt: "What is the difference between **timing mode** and **state mode**?"
    options: ["Timing mode samples with the analyzer's internal clock (waveform view, best for hardware); state mode samples with the processor's clock (a list of bus states, best for software)", "They are the same", "State mode uses an internal clock", "Timing mode shows instructions"]
    answer: 0
    explain: "In timing mode the LA's own clock sets when channels are recorded, giving a waveform display useful to the hardware designer. In state mode data collection is synchronised to the processor clock, one snapshot per cycle, and post-processing can reduce bus-level data to instruction level."
  - type: choice
    prompt: "How can a logic analyzer record events **before** the trigger?"
    options: ["The trace memory is a circular buffer that always overwrites old data; the trigger point decides when to stop", "It predicts the future", "It uses a second analyzer", "It cannot"]
    answer: 0
    explain: "The trace runs continuously into a circular buffer; the trigger point sets how many states are kept before and after, so events can be seen in 'negative time'."
  - type: choice
    prompt: "When does a logic analyzer's trace **lose relevance**?"
    options: ["When what happens at the processor's pins does not reflect internal operation, such as with an instruction cache enabled", "When the clock is slow", "When the board is large", "When using state mode"]
    answer: 0
    explain: "The limit of usability is when both possible destinations of a branch lie entirely within the cache. Other cons: it needs many tiny probes on fine-pitch pins (0.005 in), so fragile adapters and boards designed for the analyzer help."
card:
  front: "What can a logic analyzer do, and what are its limits?"
  back: "30-400 channels ($400 to $25,000+). Timing mode (internal clock, waveforms, +/- one sample period); state mode (processor clock, bus states, time-stamped, post-processed to instructions and C functions). Complex triggers (levels, ranges, counters); circular buffer shows events before the trigger; can benchmark with markers. Limits: caches, prefetch, tiny pins."
glossary:
  - { term: "Trace trigger", def: "The event that tells the analyzer to stop overwriting its circular buffer; set anywhere in the buffer." }
---

## Learn

The **logic analyzer (LA)** is the premier tool for the digital hardware designer: think of it as a **very low-resolution digital storage oscilloscope with 30 to 400 input channels**, costing from $400 to over $25,000. It can also act as a **pattern generator**, providing digital stimuli.

**Operation:** inputs from the target (16-256 channels with an adjustable trigger threshold) go to clock and trigger logic and into a memory; a PC or built-in screen is the interface.

- **Timing mode:** the LA's internal clock decides when inputs are recorded. With a 100 MHz processor and a 1 GHz LA, **10 samples per processor cycle** and resolution of about +/- 1 ns; gives a waveform display, most useful to the **hardware designer**. The lab's LogicPort samples at 500 MHz internally, with a 2K-state buffer extended by data compression.
- **State mode:** collection is synchronised to the **processor clock**, one snapshot per cycle of the busses or other signals; most useful to the **software designer**; post-processing reduces bus-level data to **instructions** and even **C functions**; data is **time-stamped** so software timing can be measured.
- **Real-time trace:** the trace memory is a **circular buffer**; the **trigger point** decides when to stop overwriting. With a 16M-deep buffer and the trigger at the middle, 8M states are recorded before and 8M after. Events are recorded in "negative time".
- **Trace specification:** triggers can use levels of conditions (address, data, status), ranges, don't cares, counters and timers (the LogicPort uses counter, range, timer and logical AND/OR/NOT; HP analyzers have an 8-level sequence state machine and link to high-level languages).
- **Benchmarking:** markers in the code (for example writing 5555 on entry to a function and AAAA on exit) let the LA time functions from the time stamps.

**Pros:** versatile, inexpensive units work quite well, both timing and state mode, complex triggering, and the trace can be abstracted to the level you need. **Cons:** loses relevance when pin-level behaviour does not reflect internal operation (instruction cache on); both branch destinations in cache is the limit; needs many tiny probes on pins as close as 0.005 in.

## Worked example

*A 16M-state buffer with the trigger set at 25%: states before and after?*

1. Before = 25% of 16M = **4M** states.
2. After = 75% = **12M** states.
3. A later trigger point shows more history; an earlier one more of the aftermath.

## Try it

*A 25 MHz processor is observed with a 500 MHz timing-mode analyzer. How many samples per processor cycle?*

???

500 / 25 = **20 samples per cycle** (resolution 2 ns).
