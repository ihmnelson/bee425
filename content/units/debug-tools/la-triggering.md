---
track: shared
title: Logic analyzer trigger types and negative time
summary: A logic analyzer captures continuously and stops at the trace point, so it shows data before the trigger; patterns and edges select the trace point.
needs: [la-timing-sampling]
sources:
  - { type: handout, ref: "laan Triggering the timing analyzer", quote: "a logic analyzer continuously captures data and stops the acquisition after the trace point is found" }
  - { type: handout, ref: "laan Triggering the timing analyzer", quote: "information prior to the trace point, which is known as negative time" }
  - { type: handout, ref: "laan Pattern trigger", quote: "the trigger specification would be 55 instead of 0101 0101" }
  - { type: handout, ref: "laan Edge trigger", quote: "Edge triggering allows you to start capturing data as the device is clocked." }
checks:
  - type: choice
    prompt: "How does a logic analyzer's trace point differ from an oscilloscope's trigger?"
    options: ["It captures continuously and stops after the trace point, so it can show data from before it", "It starts recording only after the trigger, as a scope does", "It records only the single sample at the trigger", "It cannot show data from before the trigger"]
    answer: 0
    explain: "A scope starts the trace right after the trigger. A logic analyzer keeps capturing and stops once the trace point is found, so it also shows what happened before it (negative time)."
  - type: choice
    prompt: "An 8-bit pattern trigger is set so channels 0, 2, 4 and 6 are high and channels 1, 3, 5 and 7 are low (channel 0 is the least significant bit). What is the trigger value in hexadecimal?"
    options: ["55", "AA", "0F", "F0"]
    answer: 0
    explain: "Channel 7 down to channel 0 reads 0101 0101 = 55 hex. AA would be the opposite pattern. Hex is easier than binary on wide buses."
  - type: choice
    prompt: "An edge-triggered shift register is not shifting data correctly and you want to check its data when it is clocked. Which trigger fits best?"
    options: ["Edge trigger on the clock, with the trace point delayed for propagation", "Pattern trigger on all the data lines at once", "No trigger; just run for a few seconds", "Trigger on the supply voltage"]
    answer: 0
    explain: "Edge triggering starts the capture as the device is clocked. The trace point is delayed to allow for the propagation delay through the shift register."
  - type: choice
    prompt: "What is 'negative time' on a logic analyzer display?"
    options: ["Information captured before the trace point", "Samples taken while the clock is low", "A sampling clock running backwards", "Data lost when memory is full"]
    answer: 0
    explain: "Because acquisition runs continuously and stops after the trace point, the memory holds data from before the trigger. That earlier part is negative time."
card:
  front: "Logic analyzer triggering: how does it differ from a scope?"
  back: "It captures continuously and stops after the trace point, so it shows data before the trigger (negative time). Pattern trigger: a pattern of highs and lows across lines (e.g. 0101 0101 = 55 hex). Edge trigger: start on a clock edge when a device is clocked."
glossary:
  - { term: "Trace point", def: "The logic analyzer's name for the trigger: the event that stops acquisition." }
  - { term: "Negative time", def: "Data captured before the trace point." }
---

## Learn

An oscilloscope starts the trace right after the trigger. A logic analyzer's **trigger (trace point)** is different: it **captures continuously** and **stops after the trace point is found**, so its memory also holds what happened **before** it, called **negative time**. That is how you see what led up to a fault.

Two ways to set the trace point on a timing analyzer:

- **Pattern trigger:** a pattern of highs and lows across the lines. Channels 0, 2, 4, 6 high and 1, 3, 5, 7 low is 0101 0101, or **55** in hex. Hex (or octal, ASCII, decimal) is much easier on 16 or 24-bit buses.
- **Edge trigger:** the same idea as a scope trigger, but with the level fixed at the logic threshold. Many devices are level-dependent but clocked on an **edge**, so edge triggering starts the capture as the device is clocked; delay the trace point if you want to see the outputs after the propagation delay.

## Worked example

*You want to start the capture when an address bus A15..A0 equals $41B0. What pattern do you enter, and why use hex?*

1. $41B0 = 0100 0001 1011 0000 in binary.
2. Enter **41B0** in hex: four digits instead of sixteen 1s and 0s, and less error-prone.
3. Set the position so some of the memory holds negative time, to see the instructions that led to this address.

## Try it

*A trigger on the 8-bit pattern 1010 1010 would be entered as what hex value?*

???

**AA**.
