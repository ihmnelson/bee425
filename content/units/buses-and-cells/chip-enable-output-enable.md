---
track: shared
title: "~CE and ~OE: chip enable and output enable"
summary: "~CE is the master switch for the whole chip; ~OE only controls whether its outputs drive the bus."
needs: [bus-contention-tristate]
sources:
  - { type: slide, ref: "L6 s266", quote: "Output Enable (~OE) only places the chip output into tri-state condition" }
  - { type: slide, ref: "L6 s266", quote: "If ~CE is not LOW (active), the entire chip is turned off" }
  - { type: slide, ref: "L6 s267", quote: "~CS must be low for Clock input to be active" }
checks:
  - type: choice
    prompt: "If **~CE is high**, what is the state of the chip?"
    options: ["Turned off: all outputs are Hi-Z and clocked inputs are inactive", "Reading only", "Writing only", "Outputs drive 0"]
    answer: 0
    explain: "If ~CE is not LOW (active), the entire chip is off: all outputs are tri-stated and clocked inputs are inactive."
  - type: choice
    prompt: "~CE is low and ~OE is high. What does the chip do?"
    options: ["It accepts new data on a write, but its output stays Hi-Z", "It drives the bus", "It is off", "It resets"]
    answer: 0
    explain: "~OE only controls whether the outputs are placed on the bus. With ~CE low and ~OE high the chip will accept data but not drive it."
  - type: choice
    prompt: "Which signal selects **which of several chips** on a shared data bus is active?"
    options: ["Chip select (~CS / ~CE), driven from the address decoder", "~OE alone", "The clock", "~WE"]
    answer: 0
    explain: "With tri-state outputs wired directly to the bus, only the chip whose ~CS is low (chosen by decoding the address) is active; the others stay off."
card:
  front: "What is the difference between ~CE (~CS) and ~OE?"
  back: "~CE/~CS is the master control: if not low, the whole chip is off (outputs Hi-Z, clocked inputs inactive). ~OE only puts the outputs into or out of tri-state. A chip drives the bus only when ~CE is low and ~OE is low."
glossary: []
---

## Learn

- **Chip Select / Chip Enable (~CS or ~CE)**: a master control. If it is not LOW (active), the entire chip is off: all outputs tri-stated and clocked inputs inactive.
- **Output Enable (~OE)**: only places the chip's outputs into the tri-state condition.
- If **~CE is LOW and ~OE is HIGH**, the chip will accept new data but its output stays Hi-Z.
- All of these are **active low** (the ~ means low = true).

With tri-state outputs you can wire outputs straight to the bus, but the chip selects must be controlled through proper **addressing**: the address decoder makes exactly one ~CS low. (The lecture suggests deriving the truth table of a 2:4 decoder as an exercise: with two inputs, exactly one of four active-low outputs is low, which gives ~CS0 to ~CS3.)

## Worked example

*Four 32-bit registers share a 32-bit bus with a 2:4 decoder driving ~CS0 to ~CS3. The address bits are 10. Which register drives the bus (if ~OE is low)?*

1. A 2:4 decoder with active-low outputs makes the output numbered by the input value low: input 10 binary = 2, so ~CS2 is low.
2. Only register 2 is enabled; the others stay Hi-Z.
3. No contention.

## Try it

*A chip has ~CE low, ~OE low and ~WE high. Is it reading or writing?*

???

**Reading**: ~OE low drives the data onto the bus, and ~WE high means no write is happening.
