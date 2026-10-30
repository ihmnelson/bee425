---
track: shared
title: Propagation delay and why clocks cannot go faster
summary: Gates need time to switch, signals need time to travel, and both eat the clock period.
needs: [time-and-frequency]
sources:
  - { type: slide, ref: "L2 s109", quote: "Gates require a finite amount of time to switch state when their inputs change" }
  - { type: slide, ref: "L2 s102", quote: "wasted just getting the clock signal there" }
  - { type: slide, ref: "L2 s100", quote: "Internal gate delays are ~ 100 psec" }
checks:
  - type: choice
    prompt: "What is **propagation delay**?"
    options: ["The time from an input change to the resulting output change", "The time a clock stays high", "The time between two boards", "The time to boot"]
    answer: 0
    explain: "The slide defines it as the time delay from input change to output change. A gate needs a finite time to switch."
  - type: choice
    prompt: "Why can't we simply raise the clock of a processor to 4 GHz or higher?"
    options: ["Gates need a finite time to switch when their inputs change", "Clocks do not work above 1 GHz", "Capacitors would explode", "The software forbids it"]
    answer: 0
    explain: "The lecture's answer: gates require a finite amount of time to switch state, and everything the machine must do in one cycle has to fit inside the clock period."
  - type: choice
    prompt: "A clock has a 0.3 ns period, and it takes about 0.16 ns for the clock to cross the chip. What does the lecture conclude?"
    options: ["More than half of the available time is wasted just getting the clock there", "The clock is too slow", "Half the chip is unused", "Nothing; propagation is free"]
    answer: 0
    explain: "0.16 ns of 0.3 ns is about 53%, so more than half of the available time is spent distributing the clock."
card:
  front: "Why is there a limit to clock speed?"
  back: "Gates need a finite propagation delay to switch, and signals need time to cross the chip and board (about 2 ns per foot on a PCB), so everything must fit inside one clock period."
glossary:
  - { term: "Propagation delay", def: "The time delay from a change at a gate's input to the resulting change at its output." }
---

## Learn

**Propagation delay** is the time from an input change to the output change. Gates need a finite time to switch state, so a clock cannot be made arbitrarily fast: everything the computer does in one cycle must fit inside the period.

Numbers from the lecture:

- Today's maximum PC clocks are around **4 GHz**; internal gate delays are about **100 ps**, and everything in one cycle must happen in about **250 ps**.
- A signal on an IC travels roughly **1.4 inches in 270 ps**. On a chip the speed is about **6 inches per ns**, while on a PCB it is about **2 ns per foot**.
- With a period of about **0.3 ns** and a clock crossing time of about **0.16 ns**, **more than half** the available time is wasted just getting the clock signal there.

The inverter example on the slide measures a delay of 12.60 ns on a slower gate.

## Worked example

*A signal path has three gates in series, each with 8 ns propagation delay, and the wire adds 2 ns. What is the minimum clock period, and the maximum frequency?*

1. Total delay = 3 x 8 + 2 = **26 ns**.
2. The period must be at least 26 ns.
3. Maximum frequency = 1000 / 26 = **38.5 MHz**.

## Try it

*A path has 4 gates of 5 ns each. What is the highest clock frequency it allows?*

???

Total delay = 20 ns, so the maximum frequency is 1000 / 20 = **50 MHz** (a 20 ns period).
