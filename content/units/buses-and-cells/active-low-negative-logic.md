---
track: shared
title: "Active-low signals and negative logic"
summary: "A ~ means the signal is true when low; the same gate is OR in positive logic and AND in negative logic."
needs: [chip-enable-output-enable]
sources:
  - { type: slide, ref: "L6 s266", quote: "Chip Select (or Chip Enable) ( ~CS or ~CE )" }
  - { type: slide, ref: "L6 s287", quote: "OR gates become AND gates in negative logic" }
  - { type: slide, ref: "L6 s289", quote: "2 to 4 decoder with active LOW outputs" }
  - { type: own, ref: "truth tables of OR, NOR and AND under swapped polarity (standard De Morgan reasoning)" }
checks:
  - type: choice
    prompt: "What does the tilde in a signal name such as **~CS** or **~OE** mean?"
    options: ["The signal is active low: it is asserted (true) when it is low", "The signal is inverted twice", "The signal is analog", "The signal is a clock"]
    answer: 0
    explain: "A leading ~ (or an overbar) marks an active-low signal: the chip is selected, or the output enabled, when the pin is at logic 0."
  - type: choice
    prompt: "A physical gate acts as an **OR** in positive logic. What does the same gate do in negative logic?"
    options: ["AND", "NAND", "NOR", "XOR"]
    answer: 0
    explain: "Swapping which voltage means true swaps OR and AND (De Morgan): OR gates become AND gates in negative logic, as in the lecture's 512K x 2 memory diagram where an OR gate decodes an active-low chip select."
  - type: choice
    prompt: "True or false: the **NOR** gate is the negative-logic equivalent of the positive-logic **OR** gate."
    options: ["False. NOR is an OR followed by an inversion; the negative-logic equivalent of OR is AND", "True", "True only for two inputs", "False. It is XOR"]
    answer: 0
    explain: "NOR = NOT(OR) inverts the output; that is a different function in the same logic polarity. Changing polarity (negative logic) turns the OR function into AND, not NOR."
  - type: choice
    prompt: "A 2-to-4 decoder has **active-low outputs**. With the input 11, which output line is low?"
    options: ["Output 3, and the other three are high", "Output 0", "All four are low", "All four are high"]
    answer: 0
    explain: "Only the selected output is asserted, which for active-low outputs means it is the single one at 0. Input 11 selects output 3."
card:
  front: "What are active-low signals and what is negative logic?"
  back: "~NAME means true when low. In negative logic (low = true) the same gate swaps function: an OR gate acts as AND (De Morgan). NOR is OR plus an inverted output, not the negative-logic OR."
glossary:
  - { term: "Active low", def: "A signal that is asserted (true) when it is at logic 0; written ~CS or with an overbar." }
---

## Learn

Many memory and processor signals are **active low**: the name carries a tilde (~CS, ~OE, ~WE, ~RD, ~AS) and the signal is true when the pin is **low**. All of the memory control signals in this course are active low.

**Negative logic** means treating low as true. Swapping the meaning of the two voltage levels swaps the function of a gate:

| Physical gate | Positive logic | Negative logic |
|---|---|---|
| Output high only if any input is high | **OR** | **AND** |
| Output high only if all inputs are high | AND | OR |

This is why the lecture notes that "OR gates become AND gates in negative logic": to make ~CS low when **both** an address-valid and a page-select condition are true, a single OR gate (of the active-low signals) does the job.

**NOR is not the negative-logic OR.** NOR is an OR **followed by an inversion**. Changing polarity changes AND into OR (and back); it does not add an inversion. A physical NOR becomes a NAND in negative logic, and a physical NAND becomes a NOR.

The lecture's BEE 271 reminder: a **2-to-4 decoder with active-low outputs** has exactly one output low, the one numbered by the input.

## Worked example

*A chip's ~CS must be low when ~ADDRVAL is low and the page-select line ~PAGE is low. Which gate?*

1. In positive logic we would want ~CS asserted when both are asserted (AND of the assertions).
2. With low = true for all three signals, the assertion of ~CS needs both inputs low.
3. An **OR gate** outputs low only when both inputs are low, so one OR gate does it: OR in positive-logic terms is AND in negative logic.

## Try it

*Read a physical NOR gate in negative logic. Which function is it?*

???

A **NAND**. With low meaning true, the NOR's output is low (asserted) unless both inputs are low (both asserted), which is exactly "not both asserted". In the same way a physical NAND is a NOR in negative logic.
