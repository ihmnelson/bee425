---
track: shared
title: "Memory timing and wait states"
summary: "The processor's and memory's timing must match; glue logic eats margin; wait states or faster parts fix a failure."
needs: [memory-map-decoders]
sources:
  - { type: slide, ref: "L7 s336", quote: "The ~WAIT output from the memory systems extends the memory timing" }
  - { type: slide, ref: "L7 s337", quote: "Could reduce the available" }
  - { type: slide, ref: "L7 s338", quote: "Add WAIT states" }
  - { type: slide, ref: "L7 s340", quote: "Any decoding reduces timing margins" }
checks:
  - type: choice
    prompt: "The Z80's memory timing is **synchronous**. What does the ~WAIT input let a slow memory do?"
    options: ["Extend the memory cycle for slow devices", "Speed up the clock", "Skip the cycle", "Acknowledge the address"]
    answer: 0
    explain: "Synchronous timing needs no acknowledgement from memory; the ~WAIT output from the memory system extends the memory timing for slow devices."
  - type: choice
    prompt: "Your calculation shows the SRAM is **not fast enough** for the processor's read cycle. What are the two fixes in the lecture?"
    options: ["Add wait states, or use a faster part", "Increase the supply voltage or the clock", "Remove the decoder or the bus", "Add a cache or a fan"]
    answer: 0
    explain: "Don't be surprised if the part you chose isn't fast enough: add WAIT states or use a faster part."
  - type: choice
    prompt: "Why does **address decoding** matter for timing?"
    options: ["Every gate delay in the decoder reduces the memory cycle time available (a 74ALS138 could cost as much as 36 ns)", "It increases the clock", "It has no effect on timing", "It only matters for ROM"]
    answer: 0
    explain: "Any decoding reduces timing margins: the glue logic adds delay before ~CE reaches the memory, and the lecture's 74ALS138 data shows it could reduce the available cycle time by as much as 36 ns."
  - type: choice
    prompt: "Which of these varies the real timing margins, according to the lecture?"
    options: ["Temperature, processor design speed, manufacturing lot and process, and PCB path lengths", "Only the supply voltage", "The software", "Nothing; the data sheet numbers are exact"]
    answer: 0
    explain: "Minimum, typical and maximum intervals vary with temperature, design speed, manufacturing lot, process and path length, plus the delays of the glue logic (which depend on logic family and loading)."
card:
  front: "How do you check memory timing, and what if it fails?"
  back: "Collect the data sheets; compute worst-case times for address, ~OE and ~CE to reach and settle at the memory for a read; compute when the processor samples the data; compare with the memory's requirements (including decoder delays). If it fails, add wait states or use a faster memory."
glossary:
  - { term: "Wait state", def: "An extra clock cycle added to a memory access so a slower memory has time to respond." }
---

## Learn

Interfacing to memory means making the **processor's timing and the memory's timing compatible**. Memory has timing requirements, the processor has timing requirements, and **any decoding reduces timing margins**.

- **Z80 memory timing** is **synchronous** (no acknowledgement from memory is required). The memory system's **~WAIT** output extends the cycle for slow devices.
- Margins must be analysed as minimum, typical and maximum, which vary with temperature, processor speed, manufacturing lot and process, and PCB path lengths. Also add the **glue logic delays**, which depend on the logic family (LS, ALS, F, HC, HCT, FCT) and on loading. Example: a **74ALS138** decoder could reduce the available memory cycle time by as much as **36 ns**.

The lecture's procedure for margins:

1. Collect the data sheets for all parts.
2. Extract the timing information.
3. For a **read cycle**, compute the worst-case time for the address, ~OE and ~CE to reach memory and be stable.
4. Compute when the processor expects to read the data (de-assertion of signals is also delayed, which can work in your favour).
5. Compare with the memory's requirements.
6. If it fails, **add WAIT states** or **use a faster part**.

## Worked example

*A processor reads data at 120 ns after the address is output. The decoder adds 25 ns to ~CE and the SRAM needs 100 ns from ~CE low to data valid. Does it fit?*

1. The memory sees ~CE after 25 ns and then needs 100 ns, so data is valid at 125 ns.
2. The processor samples at 120 ns: **5 ns too early**.
3. Fix: add one wait state, or use a faster memory or a faster decoder.

## Try it

*What does one extra wait state do?*

???

It lengthens the memory cycle by one clock period, giving a slow memory that much more time before the processor samples the data (at the cost of a slower access).
