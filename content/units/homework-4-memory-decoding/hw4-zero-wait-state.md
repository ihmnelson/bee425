---
track: shared
title: "Homework 4, problem 3: the fastest clock with zero wait states"
summary: "Zero wait states needs 3 clock periods >= decoder delay + memory access time."
needs: ["memory-systems.memory-timing", "clocks-and-pulses.propagation-delay"]
sources:
  - { type: handout, ref: "hw4 P3", quote: "15 nanosecond access time" }
  - { type: handout, ref: "hw4 P3", quote: "each gate that you use in your memory" }
  - { type: handout, ref: "hw4 P3", quote: "3 clock cycles" }
  - { type: own, ref: "the arithmetic below (calc); the decoder depth is a design assumption stated in each example" }
checks:
  - type: choice
    prompt: "A memory has a 15 ns access time measured from ~CE low. The decoder in front of ~CE is 2 gates deep at 2 ns per gate, and the processor takes 3 clock cycles per read or write. What is the maximum clock frequency with zero wait states?"
    options: ["About 158 MHz (3T = 19 ns)", "About 67 MHz (T = 15 ns)", "About 53 MHz (T = 19 ns)", "200 MHz (3T = 15 ns)"]
    answer: 0
    explain: "Data is valid 4 ns (decoder) + 15 ns (memory) = 19 ns after the address appears. That must fit in 3 clock periods: T >= 19/3 = 6.33 ns, so f <= 157.9 MHz. 67 MHz forgets the decoder and the 3 cycles; 53 MHz forgets the 3 cycles; 200 MHz forgets the decoder."
  - type: choice
    prompt: "The same memory (15 ns) and 3-cycle access, but the decoder is 3 gates deep at 2 ns each. What is the maximum clock for zero wait states?"
    options: ["About 143 MHz (3T = 21 ns)", "About 158 MHz (3T = 19 ns)", "About 48 MHz (T = 21 ns)", "About 214 MHz (3T = 14 ns)"]
    answer: 0
    explain: "Delay = 3 x 2 + 15 = 21 ns, so T >= 21/3 = 7 ns and f <= 142.9 MHz. Each extra gate costs about 2/3 ns of clock period (about 15 MHz here)."
  - type: choice
    prompt: "Why do the decoder's gate delays add to the memory's 15 ns access time?"
    options: ["~CE falls only after the decoder settles, and the 15 ns starts then", "Gate delays make the memory chip itself slower", "The decoder runs on a separate, slower clock", "Gate delays matter only for write cycles"]
    answer: 0
    explain: "The 15 ns is measured from ~CE low. The decoder output goes low only after the address passes through its gates, so the total time from address to valid data is decoder delay plus access time."
  - type: choice
    prompt: "The processor is clocked at 200 MHz (T = 5 ns) with a 3-cycle access, so 15 ns is available. The decoder plus memory needs 19 ns. How many wait states are needed?"
    options: ["1", "0", "2", "4"]
    answer: 0
    explain: "Each wait state adds one 5 ns clock. 15 ns is 4 ns short; one wait state gives 20 ns, which covers the 19 ns. So 1 wait state."
card:
  front: "Homework 4, P3: how do you find the maximum clock with zero wait states for a 15 ns SRAM, 2 ns gates and a 3-cycle access?"
  back: "Total delay = (gates in the decoder x 2 ns) + 15 ns. Zero wait states needs 3 x T >= total delay, so fmax = 3 / total. Example: 2 gates -> 19 ns -> T = 6.33 ns -> 158 MHz; 3 gates -> 21 ns -> 143 MHz. Fewer gates or a faster memory raises the clock; otherwise add wait states."
glossary: []
---

## Learn

**Problem 3** asks for the maximum clock frequency with **zero wait states** when the memory has a **15 ns access time** (from ~CE low to data valid or accepted), every decoder gate has a **2 ns** propagation delay, and a processor read or write takes **3 clock cycles**.

The chain of events for one access:

1. The address appears; it goes through the decoder gates.
2. ~CE falls after (gates x 2 ns).
3. Data is valid 15 ns after ~CE falls.
4. All of that must finish within the 3 clock periods the processor allows.

> **3 x T >= (decoder gates x 2 ns) + 15 ns  and  fmax = 1/T = 3 / total delay**

The answer depends on how many gate delays your decoder from Problem 2 puts in the ~CE path. With an inverter followed by one wide gate (2 gates): total 19 ns, T = 6.33 ns, **f = 157.9 MHz**. With 3 levels: 21 ns, T = 7 ns, **f = 142.9 MHz** (calc). If the clock is faster than that, either add wait states or use a faster memory.

## Worked example

*A 12 ns RAM, a 1-gate decoder (2 ns) and a 2-cycle access. Maximum clock with zero wait states?*

1. Total = 2 + 12 = 14 ns.
2. 2 x T >= 14 ns, so T >= 7 ns.
3. fmax = 1/7 ns = **142.9 MHz**.

## Try it

*If the decoder gets one gate slower (3 ns instead of 2 ns) in the 15 ns, 3-cycle example with a 2-gate decoder, what is the new maximum clock?*

???

Total = 2 x 3 + 15 = 21 ns. T >= 7 ns, so **f <= 142.9 MHz**.
